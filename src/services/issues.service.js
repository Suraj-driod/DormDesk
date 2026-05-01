import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";
import { processNewIssue } from "./geminiSimilarity.service";
import { withHostelFilter } from "../Lib/utilities";
import { createNotification } from "./notificationService";
import { applyRule3 } from "./escalationService";
import { uploadMedia } from "./mediaService";
import { emailOnIssueReported, emailOnIssueAssigned, emailOnIssueResolved } from "./emailService";

const ISSUES_COLLECTION = "issues";

// Fetch all issues with optional filters
export const fetchIssues = async (filters = {}, hostelId) => {
  try {
    const issuesRef = collection(db, ISSUES_COLLECTION);
    const q = withHostelFilter(issuesRef, hostelId);
    // Fetch all, filter client-side to avoid composite index requirement
    const snapshot = await getDocs(q);

    let issues = await Promise.all(snapshot.docs.map(async (docSnap) => {
      const issue = { id: docSnap.id, ...docSnap.data() };
      
      // Fetch creator profile
      if (issue.created_by) {
        try {
          const profileRef = doc(db, "users", issue.created_by);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            issue.profile = { id: profileSnap.id, ...profileSnap.data() };
          }
        } catch (e) {
          console.warn("Could not fetch creator profile:", e);
        }
      }
      
      // Fetch assigned profile
      if (issue.assigned_to) {
        try {
          const assignedRef = doc(db, "management", issue.assigned_to);
          const assignedSnap = await getDoc(assignedRef);
          if (assignedSnap.exists()) {
            issue.assigned_profile = { id: assignedSnap.id, ...assignedSnap.data() };
          }
        } catch (e) {
          console.warn("Could not fetch assigned profile:", e);
        }
      }

      // Get upvotes count
      try {
        const upvotesQ = query(collection(db, "votes"), where("issue_id", "==", docSnap.id));
        const upvotesSnap = await getDocs(upvotesQ);
        issue.upvotes = [{ count: upvotesSnap.size }];
      } catch (e) {
        issue.upvotes = [{ count: 0 }];
      }

      // Get comments count
      try {
        const commentsQ = query(collection(db, "comments"), where("issue_id", "==", docSnap.id));
        const commentsSnap = await getDocs(commentsQ);
        issue.comments = [{ count: commentsSnap.size }];
      } catch (e) {
        issue.comments = [{ count: 0 }];
      }

      return issue;
    }));

    // Apply filters client-side
    if (filters.status) issues = issues.filter(i => i.status === filters.status);
    if (filters.category) issues = issues.filter(i => i.category === filters.category);
    if (filters.visibility) issues = issues.filter(i => i.visibility === filters.visibility);
    if (filters.hostel) issues = issues.filter(i => i.hostel === filters.hostel);
    if (filters.priority) issues = issues.filter(i => i.priority === filters.priority);
    if (filters.created_by) issues = issues.filter(i => i.created_by === filters.created_by);
    if (filters.assigned_to) issues = issues.filter(i => i.assigned_to === filters.assigned_to);

    // Sort by created_at descending
    return issues.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching issues:", error);
    return [];
  }
};

// Fetch single issue by id
export const fetchIssueById = async (id) => {
  try {
    const issueRef = doc(db, ISSUES_COLLECTION, id);
    const issueSnap = await getDoc(issueRef);

    if (!issueSnap.exists()) throw new Error("Issue not found");

    const issue = { id: issueSnap.id, ...issueSnap.data() };
    // Normalize media: support media_url (single) or media (array)
    if (issue.media_url) {
      issue.media = Array.isArray(issue.media) ? issue.media : [issue.media_url];
    } else if (!issue.media || !Array.isArray(issue.media)) {
      issue.media = issue.media ? [issue.media] : [];
    }

    // Fetch creator profile
    if (issue.created_by) {
      const profileRef = doc(db, "users", issue.created_by);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        issue.profile = { id: profileSnap.id, ...profileSnap.data() };
      }
    }

    // Fetch assigned profile
    if (issue.assigned_to) {
      const assignedRef = doc(db, "management", issue.assigned_to);
      const assignedSnap = await getDoc(assignedRef);
      if (assignedSnap.exists()) {
        issue.assigned_profile = { id: assignedSnap.id, ...assignedSnap.data() };
      }
    }

    const upvotesRef = collection(db, "votes");
    const upvotesQ = query(upvotesRef, where("issue_id", "==", id));
    const upvotesSnap = await getDocs(upvotesQ);
    issue.upvotes = [{ count: upvotesSnap.size }];

    return issue;
  } catch (error) {
    console.error("Error fetching issue:", error);
    throw error;
  }
};

// Validate required fields
const validateIssueData = (issueData) => {
  const errors = [];
  if (!issueData.created_by) errors.push("created_by (user ID) is required");
  if (!issueData.title?.trim()) errors.push("title is required");
  if (!issueData.category) errors.push("category is required");
  
  if (errors.length > 0) {
    const error = new Error(`Validation failed: ${errors.join(", ")}`);
    error.code = "VALIDATION_ERROR";
    error.details = errors;
    throw error;
  }
  return true;
};

// Direct insert helper
const directInsertIssue = async (issueData, hostelId) => {
  const issuesRef = collection(db, ISSUES_COLLECTION);
  const docRef = await addDoc(issuesRef, {
    ...issueData,
    hostelId,
    repost_count: 0,
    created_at: new Date().toISOString(),
  });
  
  const newDoc = await getDoc(docRef);
  const newIssue = { id: newDoc.id, ...newDoc.data() };

  // Rule 3: Critical priority at creation → auto-assign to admin
  if ((issueData.priority || "").toLowerCase() === "critical") {
    applyRule3(newDoc.id, hostelId);
  }

  // Email admin (non-blocking)
  emailOnIssueReported(newIssue).catch(() => {});

  return { isDuplicate: false, issue: newIssue, message: "Issue reported successfully!" };
};

// Create a new issue with optional similarity detection
export const createIssue = async (issueData, hostelId, useSimilarityCheck = true) => {
  validateIssueData(issueData);

  if (!useSimilarityCheck) {
    return directInsertIssue(issueData, hostelId);
  }

  try {
    return await processNewIssue(issueData, hostelId);
  } catch (similarityError) {
    return directInsertIssue(issueData, hostelId);
  }
};

// Update issue status
export const updateIssueStatus = async (id, status, changedBy, note = null) => {
  const issueRef = doc(db, ISSUES_COLLECTION, id);
  const issueSnap = await getDoc(issueRef);
  
  if (!issueSnap.exists()) throw new Error("Issue not found");
  
  const currentIssue = issueSnap.data();
  const updateData = { status };
  
  // Set resolved_at when status changes to resolved OR closed
  const statusLower = status.toLowerCase();
  if (statusLower === "resolved" || statusLower === "closed") {
    updateData.resolved_at = new Date().toISOString();
  }

  await updateDoc(issueRef, updateData);

  const logsRef = collection(db, "issue_status_logs");
  await addDoc(logsRef, {
    issue_id: id,
    old_status: currentIssue.status,
    new_status: status,
    changed_by: changedBy ?? null,
    note: note ?? null,
    changed_at: new Date().toISOString(),
  });

  // Notify issue reporter about status change (non-blocking)
  if (currentIssue.created_by) {
    createNotification(
      currentIssue.created_by,
      currentIssue.hostelId || null,
      "status_change",
      "Status Update",
      `Your issue "${currentIssue.title || "Untitled"}" is now ${status}`,
      id
    );
  }

  const updatedSnap = await getDoc(issueRef);
  return { id: updatedSnap.id, ...updatedSnap.data() };
};

// Assign issue to caretaker
export const assignIssue = async (issueId, caretakerId, assignedBy) => {
  const issueRef = doc(db, ISSUES_COLLECTION, issueId);
  
  await updateDoc(issueRef, {
    assigned_to: caretakerId,
    status: "assigned",
  });

  // Log the assignment
  const logsRef = collection(db, "issue_status_logs");
  await addDoc(logsRef, {
    issue_id: issueId,
    old_status: "reported",
    new_status: "assigned",
    changed_by: assignedBy,
    note: "Assigned to caretaker",
    changed_at: new Date().toISOString(),
  });

  // Notify the assigned caretaker (non-blocking)
  const issueSnap = await getDoc(issueRef);
  const issueData = issueSnap.exists() ? issueSnap.data() : {};
  createNotification(
    caretakerId,
    issueData.hostelId || null,
    "assignment",
    "New Assignment",
    `You have been assigned: "${issueData.title || "Untitled"}"`,
    issueId
  );

  // Email caretaker (non-blocking)
  const fullIssue = { id: issueSnap.id, ...issueData };
  emailOnIssueAssigned(fullIssue, caretakerId).catch(() => {});

  return fullIssue;
};

// Update issue priority
export const updateIssuePriority = async (id, priority) => {
  const issueRef = doc(db, ISSUES_COLLECTION, id);
  await updateDoc(issueRef, { priority });
  const updatedSnap = await getDoc(issueRef);
  return { id: updatedSnap.id, ...updatedSnap.data() };
};

// Delete an issue
export const deleteIssue = async (id) => {
  const issueRef = doc(db, ISSUES_COLLECTION, id);
  const issueSnap = await getDoc(issueRef);
  
  if (!issueSnap.exists()) throw new Error("Issue not found");
  
  const issueData = { id: issueSnap.id, ...issueSnap.data() };
  await deleteDoc(issueRef);
  return issueData;
};

// Fetch issues for public feed
export const fetchIssuesForFeed = async (hostelId) => {
  try {
    const issuesRef = collection(db, ISSUES_COLLECTION);
    const q = withHostelFilter(issuesRef, hostelId);
    // Fetch all issues, filter client-side to avoid composite index requirement
    const snapshot = await getDocs(q);

    console.log("Total issues in DB:", snapshot.docs.length);

    const issues = await Promise.all(snapshot.docs
      .map(docSnap => {
        const data = { id: docSnap.id, ...docSnap.data() };
        console.log("Issue data:", data.id, "media_url:", data.media_url);
        return data;
      })
      .filter(issue => issue.visibility === "public")
      .map(async (issue) => {
        // Fetch creator name
        if (issue.created_by) {
          try {
            const profileRef = doc(db, "users", issue.created_by);
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) {
              issue.profile = { name: profileSnap.data().name };
            }
          } catch (e) {
            console.warn("Could not fetch profile:", e);
          }
        }

        // Get upvotes count
        try {
          const upvotesQ = query(collection(db, "votes"), where("issue_id", "==", issue.id));
          const upvotesSnap = await getDocs(upvotesQ);
          issue.upvotes = [{ count: upvotesSnap.size }];
        } catch (e) {
          issue.upvotes = [{ count: 0 }];
        }

        // Get comments count
        try {
          const commentsQ = query(collection(db, "comments"), where("issue_id", "==", issue.id));
          const commentsSnap = await getDocs(commentsQ);
          issue.comments = [{ count: commentsSnap.size }];
        } catch (e) {
          issue.comments = [{ count: 0 }];
        }

        return issue;
      }));

    // Sort by created_at descending (client-side)
    return issues.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching issues for feed:", error);
    return [];
  }
};

// ── Anonymization helper ──────────────────────────────────────────────────────
// Strips reporter identity from issues shown to caretakers.
// Admin views should NOT use this — they fetch profiles directly.
export const maskIssueForCaretaker = (issue) => ({
  ...issue,
  created_by: null,       // hide UID
  profile: {
    name: "Anonymous Student",
    avatar_url: null,
    email: null,
    phone: null,
    room_no: null,
  },
});

// Fetch issues assigned to a specific caretaker (no orderBy to avoid composite index)
export const fetchAssignedIssues = async (caretakerId, hostelId) => {
  if (!caretakerId) return [];
  const issuesRef = collection(db, ISSUES_COLLECTION);
  let q = query(issuesRef, where("assigned_to", "==", caretakerId));
  q = withHostelFilter(q, hostelId);
  const snapshot = await getDocs(q);

  const issues = await Promise.all(snapshot.docs.map(async (docSnap) => {
    const issue = { id: docSnap.id, ...docSnap.data() };
    // Fetch profile for internal use only — will be masked before returning
    if (issue.created_by) {
      try {
        const profileRef = doc(db, "users", issue.created_by);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          issue.profile = { id: profileSnap.id, ...profileSnap.data() };
        }
      } catch (e) {
        console.warn("Could not fetch creator profile:", e);
      }
    }
    // Apply anonymization — caretakers must not see reporter identity
    return maskIssueForCaretaker(issue);
  }));

  return issues.sort((a, b) => {
    const dateA = new Date(a.created_at || 0);
    const dateB = new Date(b.created_at || 0);
    return dateB - dateA;
  });
};

// Get issue statistics for dashboard
export const getIssueStats = async (hostelId) => {
  const issuesRef = collection(db, ISSUES_COLLECTION);
  const q = withHostelFilter(issuesRef, hostelId);
  const snapshot = await getDocs(q);

  const stats = {
    total: snapshot.size,
    byStatus: {},
    byCategory: {},
    byPriority: {},
  };

  snapshot.docs.forEach((docSnap) => {
    const issue = docSnap.data();
    stats.byStatus[issue.status] = (stats.byStatus[issue.status] || 0) + 1;
    stats.byCategory[issue.category] = (stats.byCategory[issue.category] || 0) + 1;
    stats.byPriority[issue.priority] = (stats.byPriority[issue.priority] || 0) + 1;
  });

  return stats;
};

// Get pending issues (not assigned)
export const fetchPendingIssues = async (hostelId) => {
  const issuesRef = collection(db, ISSUES_COLLECTION);
  let q = query(
    issuesRef,
    where("status", "==", "reported"),
    orderBy("created_at", "asc")
  );
  q = withHostelFilter(q, hostelId);
  const snapshot = await getDocs(q);

  const issues = await Promise.all(snapshot.docs.map(async (docSnap) => {
    const issue = docSnap.data();
    
    // Filter out assigned issues (Firestore doesn't support "is null" easily)
    if (issue.assigned_to) return null;

    const result = { id: docSnap.id, ...issue };
    
    if (issue.created_by) {
      const profileRef = doc(db, "users", issue.created_by);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        result.profile = { id: profileSnap.id, ...profileSnap.data() };
      }
    }
    
    return result;
  }));

  return issues.filter(Boolean);
};

// ── Resolution proof workflow ─────────────────────────────────────────────────

export const submitResolutionProof = async (issueId, { file, comment }, caretakerUid) => {
  const issueRef = doc(db, ISSUES_COLLECTION, issueId);
  const issueSnap = await getDoc(issueRef);
  if (!issueSnap.exists()) throw new Error("Issue not found");

  const issue = issueSnap.data();
  if (issue.assigned_to !== caretakerUid) throw new Error("You are not assigned to this issue");

  const media = await uploadMedia(file);

  const proofSubmission = {
    url: media.url,
    resourceType: media.resourceType,
    publicId: media.publicId,
    comment: comment || null,
    submittedBy: caretakerUid,
    submittedAt: new Date().toISOString(),
    status: "pending",
  };

  const updateData = { proofSubmission };
  if (issue.status === "assigned") updateData.status = "in_progress";

  await updateDoc(issueRef, updateData);

  const logsRef = collection(db, "issue_status_logs");
  await addDoc(logsRef, {
    issue_id: issueId,
    old_status: issue.status,
    new_status: updateData.status || issue.status,
    changed_by: caretakerUid,
    note: "Proof submitted — awaiting admin approval",
    changed_at: new Date().toISOString(),
  });

  // Notify all admins in the hostel would require a query; notify via hostel admin shortcut
  if (issue.hostelId) {
    createNotification(
      null, // userId null — will be picked up by admin listeners if you add hostel-wide notif support
      issue.hostelId,
      "proof_submitted",
      "Proof Submitted",
      `Caretaker submitted proof for "${issue.title || "Untitled"}"`,
      issueId
    );
  }

  const updatedSnap = await getDoc(issueRef);
  return { id: updatedSnap.id, ...updatedSnap.data() };
};

export const approveResolutionProof = async (issueId, adminUid) => {
  const issueRef = doc(db, ISSUES_COLLECTION, issueId);
  const issueSnap = await getDoc(issueRef);
  if (!issueSnap.exists()) throw new Error("Issue not found");

  const issue = issueSnap.data();
  if (!issue.proofSubmission || issue.proofSubmission.status !== "pending") {
    throw new Error("No pending proof to approve");
  }

  const now = new Date().toISOString();
  await updateDoc(issueRef, {
    status: "resolved",
    proofUrl: issue.proofSubmission.url,
    resolvedBy: issue.assigned_to || adminUid,
    resolvedAt: now,
    resolved_at: now,
    "proofSubmission.status": "approved",
    "proofSubmission.reviewedBy": adminUid,
    "proofSubmission.reviewedAt": now,
  });

  const logsRef = collection(db, "issue_status_logs");
  await addDoc(logsRef, {
    issue_id: issueId,
    old_status: issue.status,
    new_status: "resolved",
    changed_by: adminUid,
    note: "Admin approved proof — issue resolved",
    changed_at: now,
  });

  if (issue.created_by) {
    createNotification(
      issue.created_by,
      issue.hostelId || null,
      "status_change",
      "Issue Resolved",
      `Your issue "${issue.title || "Untitled"}" has been resolved. Please give feedback.`,
      issueId
    );
  }

  const updatedSnap = await getDoc(issueRef);
  const resolvedIssue = { id: updatedSnap.id, ...updatedSnap.data() };

  // Email student (non-blocking)
  emailOnIssueResolved(resolvedIssue).catch(() => {});

  return resolvedIssue;
};

export const rejectResolutionProof = async (issueId, adminUid, reason) => {
  const issueRef = doc(db, ISSUES_COLLECTION, issueId);
  const issueSnap = await getDoc(issueRef);
  if (!issueSnap.exists()) throw new Error("Issue not found");

  const issue = issueSnap.data();
  if (!issue.proofSubmission || issue.proofSubmission.status !== "pending") {
    throw new Error("No pending proof to reject");
  }

  const now = new Date().toISOString();
  await updateDoc(issueRef, {
    "proofSubmission.status": "rejected",
    "proofSubmission.reviewedBy": adminUid,
    "proofSubmission.reviewedAt": now,
    "proofSubmission.rejectionReason": reason || "No reason provided",
  });

  const logsRef = collection(db, "issue_status_logs");
  await addDoc(logsRef, {
    issue_id: issueId,
    old_status: issue.status,
    new_status: issue.status,
    changed_by: adminUid,
    note: `Proof rejected: ${reason || "No reason provided"}`,
    changed_at: now,
  });

  if (issue.assigned_to) {
    createNotification(
      issue.assigned_to,
      issue.hostelId || null,
      "proof_rejected",
      "Proof Rejected",
      `Your proof for "${issue.title || "Untitled"}" was rejected: ${reason || "No reason"}. Please resubmit.`,
      issueId
    );
  }

  const updatedSnap = await getDoc(issueRef);
  return { id: updatedSnap.id, ...updatedSnap.data() };
};

// ── Student feedback ──────────────────────────────────────────────────────────

export const submitIssueFeedback = async (issueId, studentUid, { rating, satisfaction, comment }) => {
  const issueRef = doc(db, ISSUES_COLLECTION, issueId);
  const issueSnap = await getDoc(issueRef);
  if (!issueSnap.exists()) throw new Error("Issue not found");

  const issue = issueSnap.data();
  if (issue.created_by !== studentUid) throw new Error("Only the reporter can give feedback");
  if (issue.status !== "resolved") throw new Error("Feedback is only allowed on resolved issues");
  if (issue.feedbackGiven) throw new Error("Feedback already submitted");

  if (!rating || rating < 1 || rating > 5) throw new Error("Rating must be 1–5");
  if (!["satisfied", "not_satisfied"].includes(satisfaction)) throw new Error("Invalid satisfaction value");

  const now = new Date().toISOString();
  const isPositive = rating >= 4 && satisfaction === "satisfied";
  const newStatus = isPositive ? "closed" : "resolved";

  const updateData = {
    feedback: {
      rating,
      satisfaction,
      comment: comment || null,
      submittedAt: now,
      submittedBy: studentUid,
    },
    feedbackGiven: true,
  };

  if (isPositive) {
    updateData.status = "closed";
    updateData.closedAt = now;
    updateData.feedbackReview = {
      outcome: "positive",
      reviewedBy: "auto",
      reviewedAt: now,
      note: "Auto-closed: rating >= 4 and satisfied",
    };
  }

  await updateDoc(issueRef, updateData);

  const logsRef = collection(db, "issue_status_logs");
  await addDoc(logsRef, {
    issue_id: issueId,
    old_status: "resolved",
    new_status: newStatus,
    changed_by: studentUid,
    note: isPositive
      ? `Feedback submitted (${rating}/5, ${satisfaction}) — auto-closed`
      : `Feedback submitted — ${satisfaction}, ${rating}/5 — pending admin review`,
    changed_at: now,
  });

  if (isPositive && issue.created_by) {
    createNotification(
      issue.created_by,
      issue.hostelId || null,
      "status_change",
      "Issue Closed",
      `Your issue "${issue.title || "Untitled"}" has been closed. Thank you for your feedback!`,
      issueId
    );
  }

  if (!isPositive && issue.hostelId) {
    createNotification(
      null,
      issue.hostelId,
      "feedback_submitted",
      "Negative Feedback Received",
      `Student rated "${issue.title || "Untitled"}" ${rating}/5 — ${satisfaction}. Review required.`,
      issueId
    );
  }

  const updatedSnap = await getDoc(issueRef);
  return { id: updatedSnap.id, ...updatedSnap.data() };
};

// ── Admin feedback adjudication ───────────────────────────────────────────────

export const adminReviewIssueFeedback = async (issueId, adminUid, outcome, note) => {
  const issueRef = doc(db, ISSUES_COLLECTION, issueId);
  const issueSnap = await getDoc(issueRef);
  if (!issueSnap.exists()) throw new Error("Issue not found");

  const issue = issueSnap.data();
  if (!issue.feedbackGiven) throw new Error("No feedback to review");
  if (!["positive", "negative"].includes(outcome)) throw new Error("Outcome must be positive or negative");

  const now = new Date().toISOString();
  const updateData = {
    feedbackReview: {
      outcome,
      reviewedBy: adminUid,
      reviewedAt: now,
      note: note || null,
    },
  };

  if (outcome === "positive") {
    updateData.status = "closed";
    updateData.closedAt = now;
  } else {
    // Negative — reopen for rework
    updateData.status = "in_progress";
    updateData.feedbackGiven = false;
    updateData.feedback = null;
    updateData.proofUrl = null;
    updateData.proofSubmission = null;
    updateData.resolvedAt = null;
    updateData.resolved_at = null;
    updateData.resolvedBy = null;
  }

  await updateDoc(issueRef, updateData);

  const logsRef = collection(db, "issue_status_logs");
  await addDoc(logsRef, {
    issue_id: issueId,
    old_status: issue.status,
    new_status: updateData.status,
    changed_by: adminUid,
    note: outcome === "positive"
      ? "Admin accepted feedback — issue closed"
      : `Admin reopened issue (negative feedback): ${note || ""}`,
    changed_at: now,
  });

  if (issue.created_by) {
    const msg = outcome === "positive"
      ? `Your issue "${issue.title || "Untitled"}" is now closed. Thank you for your feedback!`
      : `Your issue "${issue.title || "Untitled"}" has been reopened based on your feedback.`;
    createNotification(issue.created_by, issue.hostelId || null, "status_change", "Issue Update", msg, issueId);
  }

  if (outcome === "negative" && issue.assigned_to) {
    createNotification(
      issue.assigned_to,
      issue.hostelId || null,
      "issue_reopened",
      "Issue Reopened",
      `Issue "${issue.title || "Untitled"}" was reopened after negative feedback. Please fix and resubmit proof.`,
      issueId
    );
  }

  const updatedSnap = await getDoc(issueRef);
  return { id: updatedSnap.id, ...updatedSnap.data() };
};
