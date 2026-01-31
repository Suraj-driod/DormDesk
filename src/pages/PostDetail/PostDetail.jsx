import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import PostDetailBase from "../../components/core/PostDetailBase/PostDetailBase";
import { BadgeBetter1 } from "../../UI/BadgeBetter";
import { useAuth } from "../../auth/AuthContext";
import { fetchIssueById } from "../../Services/issues.service";
import { fetchCommentsByIssue, addComment, addCommentUpvote, removeCommentUpvote } from "../../Services/issueComments.service";
import { addUpvote, removeUpvote, hasUserVoted } from "../../Services/issueUpvotes.service";

function countCommentTree(nodes) {
  if (!nodes?.length) return 0;
  return nodes.reduce((acc, n) => acc + 1 + countCommentTree(n.replies || []), 0);
}

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issue, setIssue] = useState(null);
  const [commentTree, setCommentTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchIssueById(id);
        if (cancelled) return;
        setIssue(data);
        const tree = await fetchCommentsByIssue(id, user?.uid ?? null);
        if (cancelled) return;
        setCommentTree(tree);
        if (user?.uid && data?.id) {
          const v = await hasUserVoted(data.id, user.uid);
          if (!cancelled) setVoted(!!v);
        }
      } catch (e) {
        if (!cancelled) setIssue(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, user?.uid]);

  const handleUpvote = useCallback(async () => {
    if (!user || !issue?.id) return;
    try {
      if (voted) {
        await removeUpvote(issue.id);
        setVoted(false);
        setIssue((prev) => (prev ? { ...prev, upvotes: [{ count: Math.max(0, (prev.upvotes?.[0]?.count ?? 0) - 1) }] } : null));
      } else {
        await addUpvote(issue.id);
        setVoted(true);
        setIssue((prev) => (prev ? { ...prev, upvotes: [{ count: (prev.upvotes?.[0]?.count ?? 0) + 1 }] } : null));
      }
    } catch (e) {
      console.error("Upvote error:", e);
    }
  }, [user, issue?.id, voted]);

  const handleCommentSubmit = useCallback(
    async ({ text, parentId }) => {
      if (!user?.uid || !id?.trim() || !text?.trim()) return;
      try {
        await addComment({
          issue_id: id,
          user_id: user.uid,
          text: text.trim(),
          parent_id: parentId ?? null,
        });
        const tree = await fetchCommentsByIssue(id, user?.uid ?? null);
        setCommentTree(tree);
      } catch (e) {
        console.error("Add comment error:", e);
      }
    },
    [user?.uid, id]
  );

  const handleCommentUpvote = useCallback(
    async (commentId, isUpvoted) => {
      if (!user?.uid || !id) return;
      try {
        if (isUpvoted) {
          await removeCommentUpvote(commentId, user.uid);
        } else {
          await addCommentUpvote(id, commentId, user.uid);
        }
        const tree = await fetchCommentsByIssue(id, user.uid);
        setCommentTree(tree);
      } catch (e) {
        console.error("Comment upvote error:", e);
      }
    },
    [user?.uid, id]
  );

  const post = useMemo(() => {
    if (!issue) return null;
    const mediaUrl = issue.media_url || (issue.media && issue.media[0]);
    return {
      title: issue.title,
      author: issue.profile?.name || "Anonymous",
      timestamp: issue.created_at ? new Date(issue.created_at) : new Date(),
      content: issue.description,
      media: mediaUrl ? { type: "image", url: mediaUrl } : null,
      mediaFullSize: true,
      upvoteCount: issue.upvotes?.[0]?.count ?? 0,
      commentCount: countCommentTree(commentTree),
      isUpvoted: voted,
      onUpvote: handleUpvote,
      currentStatus: issue.status ? <BadgeBetter1 status={issue.status} /> : null,
      statusTimeline: [
        { label: "Posted", timestamp: issue.created_at ? new Date(issue.created_at).toLocaleDateString() : "", active: true },
        { label: issue.status || "Current", timestamp: "Current", active: true },
      ],
    };
  }, [issue, commentTree, voted, handleUpvote]);

  const totalComments = useMemo(() => countCommentTree(commentTree), [commentTree]);

  if (loading && !issue) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-[#00B8D4]" size={40} />
        <p className="text-gray-500 mt-3">Loading post...</p>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <p className="text-gray-600">Post not found.</p>
        <button
          type="button"
          onClick={() => navigate("/feed")}
          className="mt-4 px-4 py-2 bg-[#00B8D4] text-white rounded-lg"
        >
          Back to Feed
        </button>
      </div>
    );
  }

  return (
    <PostDetailBase
      post={post}
      comments={commentTree}
      totalCommentCount={totalComments}
      onCommentSubmit={handleCommentSubmit}
      onCommentUpvote={handleCommentUpvote}
      onBack={() => navigate(-1)}
    />
  );
};

export default PostDetail;
