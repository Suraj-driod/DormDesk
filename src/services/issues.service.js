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

const ISSUES_COLLECTION = "issues";

// Fetch all issues with optional filters
export const fetchIssues = async (filters = {}) => {
  try {
    const issuesRef = collection(db, ISSUES_COLLECTION);
    // Fetch all, filter client-side to avoid composite index requirement
    const snapshot = await getDocs(issuesRef);

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
const directInsertIssue = async (issueData) => {
  const issuesRef = collection(db, ISSUES_COLLECTION);
  const docRef = await addDoc(issuesRef, {
    ...issueData,
    repost_count: 0,
    created_at: new Date().toISOString(),
  });
  
  const newDoc = await getDoc(docRef);
  return { isDuplicate: false, issue: { id: newDoc.id, ...newDoc.data() }, message: "Issue reported successfully!" };
};

// Create a new issue with optional similarity detection
export const createIssue = async (issueData, useSimilarityCheck = true) => {
  validateIssueData(issueData);

  if (!useSimilarityCheck) {
    return directInsertIssue(issueData);
  }

  try {
    return await processNewIssue(issueData);
  } catch (similarityError) {
    return directInsertIssue(issueData);
  }
};

// Update issue status
export const updateIssueStatus = async (id, status, changedBy, note = null) => {
  const issueRef = doc(db, ISSUES_COLLECTION, id);
  const issueSnap = await getDoc(issueRef);
  
  if (!issueSnap.exists()) throw new Error("Issue not found");
  
  const currentIssue = issueSnap.data();
  const updateData = { status };
  
  if (status === "resolved") {
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

  const updatedSnap = await getDoc(issueRef);
  return { id: updatedSnap.id, ...updatedSnap.data() };
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
export const fetchIssuesForFeed = async () => {
  try {
    const issuesRef = collection(db, ISSUES_COLLECTION);
    // Fetch all issues, filter client-side to avoid composite index requirement
    const snapshot = await getDocs(issuesRef);

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

// Fetch issues assigned to a specific caretaker
export const fetchAssignedIssues = async (caretakerId) => {
  const issuesRef = collection(db, ISSUES_COLLECTION);
  const q = query(
    issuesRef,
    where("assigned_to", "==", caretakerId),
    orderBy("created_at", "desc")
  );
  const snapshot = await getDocs(q);

  const issues = await Promise.all(snapshot.docs.map(async (docSnap) => {
    const issue = { id: docSnap.id, ...docSnap.data() };
    
    if (issue.created_by) {
      const profileRef = doc(db, "users", issue.created_by);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        issue.profile = { id: profileSnap.id, ...profileSnap.data() };
      }
    }
    
    return issue;
  }));

  return issues;
};

// Get issue statistics for dashboard
export const getIssueStats = async () => {
  const issuesRef = collection(db, ISSUES_COLLECTION);
  const snapshot = await getDocs(issuesRef);

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
export const fetchPendingIssues = async () => {
  const issuesRef = collection(db, ISSUES_COLLECTION);
  const q = query(
    issuesRef,
    where("status", "==", "reported"),
    orderBy("created_at", "asc")
  );
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
