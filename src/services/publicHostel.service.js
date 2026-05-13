/**
 * Public Hostel Service
 * Fetches publicly listed hostels with Health Score data for the landing page.
 * No authentication required.
 */

import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

const HOSTELS_COLLECTION = "hostels";
const ISSUES_COLLECTION = "issues";

/**
 * Compute a Health Score (1–5) from resolved issues data.
 * Score is based on resolution rate and average resolution speed.
 *
 * @param {Array} issues - All issues for this hostel
 * @returns {{ score: number, label: string, totalResolved: number }}
 */
export const computeHealthScore = (issues) => {
  if (!issues || issues.length === 0) {
    return { score: 0, label: "No Data", totalResolved: 0 };
  }

  const total = issues.length;
  const resolved = issues.filter((i) => {
    const s = (i.status || "").toLowerCase();
    return s === "resolved" || s === "closed";
  });

  const totalResolved = resolved.length;
  const resolutionRate = totalResolved / total; // 0–1

  // Avg resolution time in days (lower = better)
  let avgDays = null;
  const withTime = resolved.filter((i) => i.created_at && i.resolved_at);
  if (withTime.length > 0) {
    const totalDays = withTime.reduce((sum, i) => {
      const diff =
        (new Date(i.resolved_at) - new Date(i.created_at)) /
        (1000 * 60 * 60 * 24);
      return sum + Math.max(0, diff);
    }, 0);
    avgDays = totalDays / withTime.length;
  }

  // Score components:
  // Resolution rate: 0–3 points
  // Speed: 0–2 points (under 1 day = 2, under 3 = 1.5, under 7 = 1, else 0)
  let rateScore = resolutionRate * 3;
  let speedScore = 0;
  if (avgDays !== null) {
    if (avgDays < 1) speedScore = 2;
    else if (avgDays < 3) speedScore = 1.5;
    else if (avgDays < 7) speedScore = 1;
    else if (avgDays < 14) speedScore = 0.5;
  }

  const rawScore = rateScore + speedScore; // 0–5
  const score = Math.min(5, Math.max(1, Math.round(rawScore * 10) / 10));

  let label = "Poor";
  if (score >= 4.5) label = "Excellent";
  else if (score >= 3.5) label = "Good";
  else if (score >= 2.5) label = "Average";
  else if (score >= 1.5) label = "Needs Attention";

  return { score, label, totalResolved };
};

/**
 * Fetch all publicly listed hostels with their health scores.
 * Filters by publicProfile.isPubliclyListed === true
 *
 * @returns {Promise<Array>}
 */
export const fetchPublicHostels = async () => {
  try {
    const hostelsRef = collection(db, HOSTELS_COLLECTION);
    const q = query(
      hostelsRef,
      where("publicProfile.isPubliclyListed", "==", true)
    );
    const snapshot = await getDocs(q);

    const hostels = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Fetch issues for each hostel to compute health score
    const hostelsWithScores = await Promise.all(
      hostels.map(async (hostel) => {
        try {
          const issuesRef = collection(db, ISSUES_COLLECTION);
          const issuesQ = query(
            issuesRef,
            where("hostelId", "==", hostel.id)
          );
          const issuesSnap = await getDocs(issuesQ);
          const issues = issuesSnap.docs.map((d) => d.data());
          const healthScore = computeHealthScore(issues);
          return { ...hostel, healthScore };
        } catch {
          return { ...hostel, healthScore: { score: 0, label: "No Data", totalResolved: 0 } };
        }
      })
    );

    return hostelsWithScores;
  } catch (error) {
    console.error("Error fetching public hostels:", error);
    return [];
  }
};

/**
 * Fetch a single public hostel by ID with its health score.
 */
export const fetchPublicHostelById = async (hostelId) => {
  try {
    const snap = await getDoc(doc(db, HOSTELS_COLLECTION, hostelId));
    if (!snap.exists()) throw new Error("Hostel not found");
    const hostel = { id: snap.id, ...snap.data() };

    const issuesRef = collection(db, ISSUES_COLLECTION);
    const issuesQ = query(issuesRef, where("hostelId", "==", hostelId));
    const issuesSnap = await getDocs(issuesQ);
    const issues = issuesSnap.docs.map((d) => d.data());
    const healthScore = computeHealthScore(issues);

    return { ...hostel, healthScore };
  } catch (error) {
    console.error("Error fetching hostel:", error);
    throw error;
  }
};
