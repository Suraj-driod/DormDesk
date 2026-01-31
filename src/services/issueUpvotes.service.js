import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  deleteDoc 
} from "firebase/firestore";
import { db, auth } from "../firebase";

const VOTES_COLLECTION = "votes";

// Add an upvote to an issue
export const addUpvote = async (issueId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    // Check if user already voted - fetch all votes for issue, filter client-side
    const votesRef = collection(db, VOTES_COLLECTION);
    const snapshot = await getDocs(votesRef);
    const existingVote = snapshot.docs.find(doc => {
      const data = doc.data();
      return data.issue_id === issueId && data.user_id === user.uid;
    });
    
    if (existingVote) {
      throw new Error("Already voted");
    }

    const docRef = await addDoc(votesRef, {
      issue_id: issueId,
      user_id: user.uid,
      created_at: new Date().toISOString(),
    });

    const newSnap = await getDoc(docRef);
    return { id: newSnap.id, ...newSnap.data() };
  } catch (error) {
    console.error("Error adding upvote:", error);
    throw error;
  }
};

// Remove an upvote from an issue
export const removeUpvote = async (issueId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    // Fetch all votes, filter client-side to avoid composite index
    const votesRef = collection(db, VOTES_COLLECTION);
    const snapshot = await getDocs(votesRef);
    const voteDoc = snapshot.docs.find(doc => {
      const data = doc.data();
      return data.issue_id === issueId && data.user_id === user.uid;
    });

    if (!voteDoc) throw new Error("No vote found");

    const voteData = { id: voteDoc.id, ...voteDoc.data() };
    await deleteDoc(doc(db, VOTES_COLLECTION, voteDoc.id));
    
    return voteData;
  } catch (error) {
    console.error("Error removing upvote:", error);
    throw error;
  }
};

// Get upvote count for an issue
export const getUpvoteCount = async (issueId) => {
  try {
    const votesRef = collection(db, VOTES_COLLECTION);
    const q = query(votesRef, where("issue_id", "==", issueId));
    const snapshot = await getDocs(q);

    return snapshot.size;
  } catch (error) {
    console.error("Error getting upvote count:", error);
    throw error;
  }
};

// Check if user has voted on an issue
export const hasUserVoted = async (issueId, userId) => {
  try {
    // Fetch all votes, filter client-side to avoid composite index
    const votesRef = collection(db, VOTES_COLLECTION);
    const snapshot = await getDocs(votesRef);
    const hasVoted = snapshot.docs.some(doc => {
      const data = doc.data();
      return data.issue_id === issueId && data.user_id === userId;
    });

    return hasVoted;
  } catch (error) {
    console.error("Error checking vote:", error);
    return false;
  }
};
