import { collection, getDocs, addDoc, getDoc, query, where } from "firebase/firestore";
import { doc } from "firebase/firestore";
import { db } from "../firebase";

const POST_COMMENTS_COLLECTION = "post_comments";
const POST_TYPES = ["announcement", "lost_found", "complaint"];

const formatTs = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  if (diffMs < 60000) return "just now";
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
  if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const rawToNode = (c) => ({
  id: c.id,
  author: c.user?.name || "Anonymous",
  content: c.text ?? c.content ?? "",
  timestamp: formatTs(c.created_at),
  authorAvatar: c.user?.photoURL ?? c.user?.avatar_url ?? null,
  replies: [],
  upvotes: 0,
  isUpvoted: false,
  isDownvoted: false,
});

function buildTree(flat) {
  const byId = new Map();
  flat.forEach((c) => byId.set(c.id, { ...rawToNode(c), replies: [] }));
  const roots = [];
  flat.forEach((c) => {
    const node = byId.get(c.id);
    const parentId = c.parent_id ?? null;
    if (!parentId || !byId.has(parentId)) roots.push(node);
    else byId.get(parentId).replies.push(node);
  });
  const t = (id) => (flat.find((x) => x.id === id)?.created_at || 0);
  roots.sort((a, b) => new Date(t(b.id)) - new Date(t(a.id)));
  const sortReplies = (nodes) => {
    nodes.forEach((n) => n.replies?.length && sortReplies(n.replies));
    nodes.sort((a, b) => new Date(t(a.id)) - new Date(t(b.id)));
  };
  sortReplies(roots);
  return roots;
}

export const fetchCommentsByPost = async (postType, postId) => {
  if (!POST_TYPES.includes(postType)) return [];
  try {
    const commentsRef = collection(db, POST_COMMENTS_COLLECTION);
    const q = query(
      commentsRef,
      where("post_type", "==", postType),
      where("post_id", "==", postId)
    );
    const snapshot = await getDocs(q);
    let flat = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    flat = await Promise.all(
      flat.map(async (c) => {
        if (c.user_id) {
          try {
            const userRef = doc(db, "users", c.user_id);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) c.user = { id: userSnap.id, ...userSnap.data() };
          } catch (e) {}
        }
        return c;
      })
    );
    flat.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    return buildTree(flat);
  } catch (e) {
    console.error("fetchCommentsByPost:", e);
    return [];
  }
};

export const getCommentCountByPost = async (postType, postId) => {
  const tree = await fetchCommentsByPost(postType, postId);
  const count = (nodes) => nodes.reduce((acc, n) => acc + 1 + count(n.replies || []), 0);
  return count(tree);
};

export const getCommentCountsBatch = async (postType, postIds) => {
  if (!postIds?.length) return {};
  try {
    const commentsRef = collection(db, POST_COMMENTS_COLLECTION);
    const q = query(commentsRef, where("post_type", "==", postType));
    const snapshot = await getDocs(q);
    const set = new Set(postIds);
    const counts = {};
    postIds.forEach((id) => (counts[id] = 0));
    snapshot.docs.forEach((d) => {
      const pid = d.data().post_id;
      if (set.has(pid)) counts[pid] = (counts[pid] || 0) + 1;
    });
    return counts;
  } catch (e) {
    console.warn("getCommentCountsBatch:", e);
    return postIds.reduce((o, id) => ({ ...o, [id]: 0 }), {});
  }
};

export const addPostComment = async (postType, postId, commentData) => {
  if (!POST_TYPES.includes(postType)) throw new Error("Invalid post type");
  const commentsRef = collection(db, POST_COMMENTS_COLLECTION);
  const payload = {
    post_type: postType,
    post_id: postId,
    user_id: commentData.user_id,
    text: commentData.text ?? commentData.content ?? "",
    created_at: new Date().toISOString(),
  };
  if (commentData.parent_id != null && commentData.parent_id !== "") payload.parent_id = commentData.parent_id;
  const docRef = await addDoc(commentsRef, payload);
  const snap = await getDoc(docRef);
  return { id: snap.id, ...snap.data() };
};
