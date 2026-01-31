import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from "firebase/firestore";
import { db } from "../firebase";

const COMMENTS_COLLECTION = "comments";

// Fetch comments for a specific issue
export const fetchCommentsByIssue = async (issueId) => {
  try {
    const commentsRef = collection(db, COMMENTS_COLLECTION);
    const q = query(
      commentsRef,
      where("issue_id", "==", issueId),
      orderBy("created_at", "desc")
    );
    const snapshot = await getDocs(q);

    const comments = await Promise.all(snapshot.docs.map(async (docSnap) => {
      const comment = { id: docSnap.id, ...docSnap.data() };

      // Fetch user profile
      if (comment.user_id) {
        const userRef = doc(db, "users", comment.user_id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          comment.user = { id: userSnap.id, ...userSnap.data() };
        }
      }

      return comment;
    }));

    return comments;
  } catch (error) {
    console.error("Error fetching comments:", error);
    throw error;
  }
};

// Add a new comment
export const addComment = async (commentData) => {
  try {
    const commentsRef = collection(db, COMMENTS_COLLECTION);
    const docRef = await addDoc(commentsRef, {
      ...commentData,
      created_at: new Date().toISOString(),
    });

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
