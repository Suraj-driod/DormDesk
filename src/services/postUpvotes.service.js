import { collection, getDocs, addDoc, deleteDoc, query, where } from "firebase/firestore";
import { db, auth } from "../firebase";

const POST_VOTES_COLLECTION = "post_votes";
const POST_TYPES = ["announcement", "lost_found", "complaint"];

const docMatch = (d, postType, postId, userId) => {
  const data = d.data();
  return data.post_type === postType && data.post_id === postId && data.user_id === userId;
};

export const addPostUpvote = async (postType, postId) => {
  if (!POST_TYPES.includes(postType)) throw new Error("Invalid post type");
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  const votesRef = collection(db, POST_VOTES_COLLECTION);
  const snapshot = await getDocs(votesRef);
  if (snapshot.docs.some((d) => docMatch(d, postType, postId, user.uid))) throw new Error("Already voted");
  const docRef = await addDoc(votesRef, {
    post_type: postType,
    post_id: postId,
    user_id: user.uid,
    created_at: new Date().toISOString(),
  });
  return { id: docRef.id };
};

export const removePostUpvote = async (postType, postId) => {
  if (!POST_TYPES.includes(postType)) throw new Error("Invalid post type");
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  const votesRef = collection(db, POST_VOTES_COLLECTION);
  const snapshot = await getDocs(votesRef);
  const voteDoc = snapshot.docs.find((d) => docMatch(d, postType, postId, user.uid));
  if (!voteDoc) throw new Error("No vote found");
  await deleteDoc(voteDoc.ref);
  return { id: voteDoc.id };
};

export const getPostUpvoteCount = async (postType, postId) => {
  const votesRef = collection(db, POST_VOTES_COLLECTION);
  const q = query(
    votesRef,
    where("post_type", "==", postType),
    where("post_id", "==", postId)
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
};

export const hasUserVotedPost = async (postType, postId, userId) => {
  if (!userId) return false;
  const votesRef = collection(db, POST_VOTES_COLLECTION);
  const snapshot = await getDocs(votesRef);
  return snapshot.docs.some((d) => docMatch(d, postType, postId, userId));
};

export const getPostUpvoteCountsBatch = async (postType, postIds) => {
  if (!postIds?.length) return {};
  const votesRef = collection(db, POST_VOTES_COLLECTION);
  const q = query(votesRef, where("post_type", "==", postType));
  const snapshot = await getDocs(q);
  const set = new Set(postIds);
  const counts = {};
  postIds.forEach((id) => (counts[id] = 0));
  snapshot.docs.forEach((d) => {
    const pid = d.data().post_id;
    if (set.has(pid)) counts[pid] = (counts[pid] || 0) + 1;
  });
  return counts;
};

export const getHasVotedBatch = async (postType, postIds, userId) => {
  if (!userId || !postIds?.length) return {};
  const votesRef = collection(db, POST_VOTES_COLLECTION);
  const q = query(votesRef, where("post_type", "==", postType), where("user_id", "==", userId));
  const snapshot = await getDocs(q);
  const set = new Set(postIds);
  const result = {};
  postIds.forEach((id) => (result[id] = false));
  snapshot.docs.forEach((d) => {
    const pid = d.data().post_id;
    if (set.has(pid)) result[pid] = true;
  });
  return result;
};
