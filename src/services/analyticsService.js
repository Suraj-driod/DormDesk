import {
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { withHostelFilter } from "../Lib/utilities";

const ISSUES_COLLECTION = "issues";

// ── Full unfiltered fetch for analytics ────────────────────────────────────────
export const fetchAllIssuesForAnalytics = async (hostelId) => {
  try {
    const issuesRef = collection(db, ISSUES_COLLECTION);
    const q = withHostelFilter(issuesRef, hostelId);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  } catch (error) {
    console.error("Error fetching issues for analytics:", error);
    return [];
  }
};

// ── Open vs Closed ratio ───────────────────────────────────────────────────────
export const computeOpenClosedRatio = (issues) => {
  const closed = issues.filter((i) => {
    const s = (i.status || "").toLowerCase();
    return s === "resolved" || s === "closed";
  }).length;

  const open = issues.length - closed;
  const total = issues.length || 1; // avoid /0

  return {
    open,
    closed,
    openPercent: Math.round((open / total) * 100),
    closedPercent: Math.round((closed / total) * 100),
  };
};

// ── Average resolution time per category ───────────────────────────────────────
export const computeAvgResolutionTimeByCategory = (issues) => {
  const categoryMap = {};

  issues.forEach((issue) => {
    const s = (issue.status || "").toLowerCase();
    if ((s === "resolved" || s === "closed") && issue.created_at && issue.resolved_at) {
      const cat = issue.category || "Uncategorized";
      const created = new Date(issue.created_at);
      const resolved = new Date(issue.resolved_at);
      const days = (resolved - created) / (1000 * 60 * 60 * 24);

      if (!categoryMap[cat]) categoryMap[cat] = { totalDays: 0, count: 0 };
      categoryMap[cat].totalDays += days;
      categoryMap[cat].count += 1;
    }
  });

  return Object.entries(categoryMap)
    .map(([category, { totalDays, count }]) => ({
      category,
      avgDays: Math.round((totalDays / count) * 10) / 10,
    }))
    .sort((a, b) => b.avgDays - a.avgDays);
};

// ── Issue volume over time (daily counts) ──────────────────────────────────────
export const computeIssueVolumeOverTime = (issues, period = "7d") => {
  const periodDays = { "7d": 7, "30d": 30, "90d": 90 }[period] || 7;
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - periodDays);

  // Initialize all days in range
  const dayMap = {};
  for (let d = 0; d < periodDays; d++) {
    const date = new Date(cutoff);
    date.setDate(date.getDate() + d + 1);
    const key = date.toISOString().slice(0, 10);
    dayMap[key] = 0;
  }

  // Count issues per day
  issues.forEach((issue) => {
    if (!issue.created_at) return;
    const dateKey = new Date(issue.created_at).toISOString().slice(0, 10);
    if (dayMap[dateKey] !== undefined) {
      dayMap[dateKey]++;
    }
  });

  return Object.entries(dayMap).map(([date, count]) => ({ date, count }));
};

// ── Issue density by category ──────────────────────────────────────────────────
export const computeIssueDensityByCategory = (issues) => {
  const categoryMap = {};
  issues.forEach((issue) => {
    const cat = issue.category || "Uncategorized";
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });

  const total = issues.length || 1;
  return Object.entries(categoryMap)
    .map(([category, count]) => ({
      category,
      count,
      percent: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
};

// ── Caretaker performance ──────────────────────────────────────────────────────
export const computeCaretakerPerformance = (issues, caretakersMap) => {
  // caretakersMap: { [id]: { name, ... } }
  const perfMap = {};

  issues.forEach((issue) => {
    const ctId = issue.assigned_to;
    if (!ctId) return;

    if (!perfMap[ctId]) {
      const ct = caretakersMap[ctId];
      perfMap[ctId] = {
        id: ctId,
        name: ct?.full_name || ct?.name || "Unknown",
        assigned: 0,
        resolved: 0,
        pending: 0,
        totalResolutionDays: 0,
        resolvedCount: 0,
      };
    }

    const entry = perfMap[ctId];
    entry.assigned++;

    const s = (issue.status || "").toLowerCase();
    if (s === "resolved" || s === "closed") {
      entry.resolved++;
      if (issue.created_at && issue.resolved_at) {
        const days =
          (new Date(issue.resolved_at) - new Date(issue.created_at)) /
          (1000 * 60 * 60 * 24);
        entry.totalResolutionDays += days;
        entry.resolvedCount++;
      }
    } else {
      entry.pending++;
    }
  });

  return Object.values(perfMap)
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      assigned: entry.assigned,
      resolved: entry.resolved,
      pending: entry.pending,
      avgDays:
        entry.resolvedCount > 0
          ? Math.round((entry.totalResolutionDays / entry.resolvedCount) * 10) / 10
          : null,
    }))
    .sort((a, b) => b.pending - a.pending);
};

// ── Escalation statistics ──────────────────────────────────────────────────────
export const computeEscalationStats = (issues) => {
  const escalated = issues.filter((i) => i.escalated === true);
  const critical = escalated.filter(
    (i) => (i.priority || "").toLowerCase() === "critical"
  );

  const recentEscalations = [...escalated]
    .sort((a, b) => {
      const dateA = new Date(a.escalated_at || a.created_at || 0);
      const dateB = new Date(b.escalated_at || b.created_at || 0);
      return dateB - dateA;
    })
    .slice(0, 5);

  return {
    totalEscalated: escalated.length,
    criticalCount: critical.length,
    recentEscalations,
  };
};
