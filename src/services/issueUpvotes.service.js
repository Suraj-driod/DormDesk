import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  query, 
  where 
} from "firebase/firestore";
import { db, auth } from "../firebase";

const VOTES_COLLECTION = "votes";

// Add an upvote to an issue
export const addUpvote = async (issueId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    // Check if user already voted
    const votesRef = collection(db, VOTES_COLLECTION);
    const existingVoteQ = query(
      votesRef,
      where("issue_id", "==", issueId),
      where("user_id", "==", user.uid)
    );
    const existingSnap = await getDocs(existingVoteQ);
    
    if (!existingSnap.empty) {
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

    const votesRef = collection(db, VOTES_COLLECTION);
    const q = query(
      votesRef,
      where("issue_id", "==", issueId),
      where("user_id", "==", user.uid)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) throw new Error("No vote found");

    const voteDoc = snapshot.docs[0];
    const voteData = { id: voteDoc.id, ...voteDoc.data() };
    await deleteDoc(voteDoc.ref);
    
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
    const votesRef = collection(db, VOTES_COLLECTION);
    const q = query(
      votesRef,
      where("issue_id", "==", issueId),
      where("user_id", "==", userId)
    );
    const snapshot = await getDocs(q);

    return !snapshot.empty;
  } catch (error) {
    console.error("Error checking vote:", error);
    return false;
  }
};
