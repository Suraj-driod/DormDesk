import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  setDoc, 
  query, 
  where 
} from "firebase/firestore";
import { db } from "../firebase";

const COMMENTS_COLLECTION = "comments";
const COMMENT_VOTES_COLLECTION = "comment_votes";

const formatCommentTimestamp = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  if (diffMs < 60000) return "just now";
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
  if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const rawToDisplay = (c, voteMap = null) => {
  const votes = voteMap?.get(c.id) ?? { count: 0, isUpvoted: false };
  return {
    id: c.id,
    author: c.user?.name || "Anonymous",
    content: c.text ?? c.content ?? "",
    timestamp: formatCommentTimestamp(c.created_at),
    authorAvatar: c.user?.photoURL ?? c.user?.avatar_url ?? null,
    replies: [],
    upvotes: votes.count ?? 0,
    isUpvoted: votes.isUpvoted ?? false,
    isDownvoted: false,
  };
};

export function buildCommentTree(flatComments, voteMap = null) {
  const byId = new Map();
  flatComments.forEach((c) => {
    const node = rawToDisplay(c, voteMap);
    byId.set(c.id, { ...node, replies: [] });
  });
  const roots = [];
  flatComments.forEach((c) => {
    const node = byId.get(c.id);
    const parentId = c.parent_id ?? null;
    if (!parentId || !byId.has(parentId)) {
      roots.push(node);
    } else {
      byId.get(parentId).replies.push(node);
    }
  });
  const t = (id) => (flatComments.find((c) => c.id === id)?.created_at || 0);
  roots.sort((a, b) => new Date(t(b.id)) - new Date(t(a.id)));
  const sortReplies = (nodes) => {
    nodes.forEach((n) => {
      if (n.replies?.length) sortReplies(n.replies);
    });
    nodes.sort((a, b) => new Date(t(a.id)) - new Date(t(b.id)));
  };
  sortReplies(roots);
  return roots;
}

export const fetchCommentVotesForIssue = async (issueId, currentUserId) => {
  try {
    const votesRef = collection(db, COMMENT_VOTES_COLLECTION);
    const q = query(votesRef, where("issue_id", "==", issueId));
    const snapshot = await getDocs(q);
    const map = new Map();
    snapshot.docs.forEach((d) => {
      const { comment_id, user_id } = d.data();
      if (!map.has(comment_id)) map.set(comment_id, { count: 0, userIds: new Set() });
      const entry = map.get(comment_id);
      entry.count += 1;
      entry.userIds.add(user_id);
    });
    const result = new Map();
    map.forEach((v, commentId) => {
      result.set(commentId, { count: v.count, isUpvoted: currentUserId ? v.userIds.has(currentUserId) : false });
    });
    return result;
  } catch (e) {
    console.warn("fetchCommentVotesForIssue:", e);
    return new Map();
  }
};

const voteDocId = (commentId, userId) => `${commentId}_${userId}`;

export const addCommentUpvote = async (issueId, commentId, userId) => {
  const ref = doc(db, COMMENT_VOTES_COLLECTION, voteDocId(commentId, userId));
  await setDoc(ref, { issue_id: issueId, comment_id: commentId, user_id: userId });
};

export const removeCommentUpvote = async (commentId, userId) => {
  const ref = doc(db, COMMENT_VOTES_COLLECTION, voteDocId(commentId, userId));
  await deleteDoc(ref);
};

export const fetchCommentsByIssue = async (issueId, currentUserId = null) => {
  try {
    const [commentsSnap, voteMap] = await Promise.all([
      getDocs(collection(db, COMMENTS_COLLECTION)),
      currentUserId != null ? fetchCommentVotesForIssue(issueId, currentUserId) : Promise.resolve(new Map()),
    ]);

    let flat = await Promise.all(
      commentsSnap.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .filter((c) => c.issue_id === issueId)
        .map(async (comment) => {
          if (comment.user_id) {
            try {
              const userRef = doc(db, "users", comment.user_id);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                comment.user = { id: userSnap.id, ...userSnap.data() };
              }
            } catch (e) {
              console.warn("Could not fetch user:", e);
            }
          }
          return comment;
        })
    );

    flat.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    return buildCommentTree(flat, voteMap);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
};

export const addComment = async (commentData) => {
  try {
    const commentsRef = collection(db, COMMENTS_COLLECTION);
    const payload = {
      issue_id: commentData.issue_id,
      user_id: commentData.user_id,
      text: commentData.text ?? commentData.content ?? "",
      created_at: new Date().toISOString(),
    };
    if (commentData.parent_id != null && commentData.parent_id !== "") {
      payload.parent_id = commentData.parent_id;
    }
    const docRef = await addDoc(commentsRef, payload);
    const newSnap = await getDoc(docRef);
    return { id: newSnap.id, ...newSnap.data() };
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
};

// Delete a comment
export const deleteComment = async (commentId) => {
  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    const commentSnap = await getDoc(commentRef);
    
    if (!commentSnap.exists()) throw new Error("Comment not found");
    
    const commentData = { id: commentSnap.id, ...commentSnap.data() };
    await deleteDoc(commentRef);
    return commentData;
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
};
