/**
 * Email Service — calls the Vercel serverless function at /api/send-email.
 * All calls are non-blocking (fire-and-forget) so they never break the main flow.
 */

import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const EMAIL_ENDPOINT = "/api/send-email";

const sendEmail = async (to, template, data) => {
  try {
    if (!to) return;
    const res = await fetch(EMAIL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, template, data }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn(`Email (${template}) failed:`, err.error || res.status);
    }
  } catch (err) {
    console.warn(`Email (${template}) network error:`, err.message);
  }
};

// ── Helpers to resolve emails from Firestore ────────────────────────────────

const getAdminEmailForHostel = async (hostelId) => {
  if (!hostelId) return null;
  try {
    const hostelSnap = await getDoc(doc(db, "hostels", hostelId));
    if (!hostelSnap.exists()) return null;
    const adminUid = hostelSnap.data().adminUid;
    if (!adminUid) return null;

    const mgmtSnap = await getDoc(doc(db, "management", adminUid));
    if (!mgmtSnap.exists()) return null;
    return { email: mgmtSnap.data().email, name: mgmtSnap.data().full_name || mgmtSnap.data().name };
  } catch (e) {
    console.warn("Could not resolve admin email:", e.message);
    return null;
  }
};

const getCaretakerEmail = async (caretakerId) => {
  if (!caretakerId) return null;
  try {
    const snap = await getDoc(doc(db, "management", caretakerId));
    if (!snap.exists()) return null;
    return { email: snap.data().email, name: snap.data().full_name || snap.data().name };
  } catch (e) {
    console.warn("Could not resolve caretaker email:", e.message);
    return null;
  }
};

const getStudentEmail = async (userId) => {
  if (!userId) return null;
  try {
    const snap = await getDoc(doc(db, "users", userId));
    if (!snap.exists()) return null;
    return { email: snap.data().email, name: snap.data().name };
  } catch (e) {
    console.warn("Could not resolve student email:", e.message);
    return null;
  }
};

// ── Public API (fire-and-forget) ─────────────────────────────────────────────

export const emailOnIssueReported = async (issue, reporterName) => {
  const admin = await getAdminEmailForHostel(issue.hostelId);
  if (!admin?.email) return;
  sendEmail(admin.email, "issue_reported", {
    issue,
    reporterName,
    adminName: admin.name,
  });
};

export const emailOnIssueAssigned = async (issue, caretakerId, adminName) => {
  const ct = await getCaretakerEmail(caretakerId);
  if (!ct?.email) return;
  sendEmail(ct.email, "issue_assigned", {
    issue,
    caretakerName: ct.name,
    adminName,
  });
};

export const emailOnIssueResolved = async (issue) => {
  const student = await getStudentEmail(issue.created_by);
  if (!student?.email) return;
  sendEmail(student.email, "issue_resolved", {
    issue,
    studentName: student.name,
  });
};
