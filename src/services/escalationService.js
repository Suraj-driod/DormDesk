import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { withHostelFilter } from "../Lib/utilities";
import { createNotification } from "./notificationService";

const ISSUES_COLLECTION = "issues";
const MANAGEMENT_COLLECTION = "management";

const HOUR_MS = 1000 * 60 * 60;

// ── Priority ranking (higher = more severe) ────────────────────────────────────
const PRIORITY_RANK = { low: 0, medium: 1, high: 2, emergency: 3, critical: 4 };

const shouldEscalate = (currentPriority, targetPriority) => {
  const current = PRIORITY_RANK[(currentPriority || "low").toLowerCase()] ?? 0;
  const target = PRIORITY_RANK[(targetPriority || "low").toLowerCase()] ?? 0;
  return target > current;
};

// ══════════════════════════════════════════════════════════════════════════════
// runEscalationCheck — applies Rule 1 and Rule 2 to all non-resolved issues
// ══════════════════════════════════════════════════════════════════════════════
export const runEscalationCheck = async (hostelId, adminUid) => {
  const escalatedIds = [];

  try {
    if (!hostelId) return { escalatedCount: 0, issueIds: [] };

    const issuesRef = collection(db, ISSUES_COLLECTION);
    const q = withHostelFilter(issuesRef, hostelId);
    const snapshot = await getDocs(q);

    const now = Date.now();

    for (const docSnap of snapshot.docs) {
      const issue = { id: docSnap.id, ...docSnap.data() };
      const status = (issue.status || "").toLowerCase();

      // Skip resolved/closed
      if (status === "resolved" || status === "closed") continue;

      // Skip already-critical escalated issues
      if (
        issue.escalated &&
        (issue.priority || "").toLowerCase() === "critical"
      ) continue;

      const createdAt = issue.created_at ? new Date(issue.created_at).getTime() : 0;
      if (!createdAt) continue;

      const ageHours = (now - createdAt) / HOUR_MS;
      let newPriority = null;
      let reason = null;

      // Rule 2: age > 72h → Critical (check first — higher priority)
      if (ageHours > 72) {
        if (shouldEscalate(issue.priority, "critical")) {
          newPriority = "critical";
          reason = `Auto-escalated to Critical: unresolved for ${Math.round(ageHours)}h (>72h threshold)`;
        }
      }
      // Rule 1: status is reported/assigned AND age > 48h → High
      else if (
        ageHours > 48 &&
        (status === "reported" || status === "assigned")
      ) {
        if (shouldEscalate(issue.priority, "high")) {
          newPriority = "high";
          reason = `Auto-escalated to High: ${status} for ${Math.round(ageHours)}h (>48h threshold)`;
        }
      }

      if (newPriority && reason) {
        const issueRef = doc(db, ISSUES_COLLECTION, issue.id);
        await updateDoc(issueRef, {
          priority: newPriority,
          escalated: true,
          escalated_at: new Date().toISOString(),
          escalation_reason: reason,
        });

        escalatedIds.push(issue.id);

        // Notify admin about escalation
        if (adminUid) {
          createNotification(
            adminUid,
            hostelId,
            "escalation",
            "Issue Escalated",
            `"${issue.title}" has been auto-escalated to ${newPriority.charAt(0).toUpperCase() + newPriority.slice(1)}`,
            issue.id
          );
        }
      }
    }
  } catch (error) {
    console.error("runEscalationCheck error:", error);
  }

  return { escalatedCount: escalatedIds.length, issueIds: escalatedIds };
};

// ══════════════════════════════════════════════════════════════════════════════
// applyRule3 — if issue is created with Critical priority, auto-assign to admin
// ══════════════════════════════════════════════════════════════════════════════
export const applyRule3 = async (issueId, hostelId) => {
  try {
    if (!issueId || !hostelId) return;

    // Find the admin for this hostel
    const mgmtRef = collection(db, MANAGEMENT_COLLECTION);
    const q = query(
      mgmtRef,
      where("role", "==", "admin"),
      where("hostelId", "==", hostelId)
    );
    const mgmtSnap = await getDocs(q);

    let adminDocId = null;
    if (!mgmtSnap.empty) {
      adminDocId = mgmtSnap.docs[0].id;
    } else {
      // Fallback: find any admin
      const fallbackQ = query(mgmtRef, where("role", "==", "admin"));
      const fallbackSnap = await getDocs(fallbackQ);
      if (!fallbackSnap.empty) {
        adminDocId = fallbackSnap.docs[0].id;
      }
    }

    if (!adminDocId) {
      console.warn("applyRule3: No admin found to assign critical issue");
      return;
    }

    const issueRef = doc(db, ISSUES_COLLECTION, issueId);
    await updateDoc(issueRef, {
      assigned_to: adminDocId,
      status: "assigned",
      escalated: true,
      escalated_at: new Date().toISOString(),
      escalation_reason: "Critical priority at creation — auto-assigned to admin",
    });

    // Notify the admin
    const issueSnap = await getDoc(issueRef);
    const issueData = issueSnap.exists() ? issueSnap.data() : {};

    createNotification(
      adminDocId,
      hostelId,
      "escalation",
      "Critical Issue Created",
      `"${issueData.title || "Untitled"}" has been auto-assigned to you as Critical priority`,
      issueId
    );
  } catch (error) {
    // Never block issue creation
    console.error("applyRule3 error (non-blocking):", error);
  }
};
