import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import PostDetailBase from "../../components/core/PostDetailBase/PostDetailBase";
import MediaRenderer from "../../components/core/MediaRenderer/MediaRenderer";
import { BadgeBetter1 } from "../../UI/BadgeBetter";
import { getStatusTimeline, getAnnouncementTimeline, getLostItemTimeline, getComplaintTimeline } from "../../utils/statusTimeline";
import { useAuth } from "../../auth/AuthContext";
import { fetchIssueById } from "../../services/issues.service";
import { fetchAnnouncementById } from "../../services/announcements.service";
import { fetchLostItemById } from "../../services/lostItems.service";
import { fetchComplaintById } from "../../services/complaints.service";
import { fetchCommentsByIssue, addComment, addCommentUpvote, removeCommentUpvote } from "../../services/issueComments.service";
import { addUpvote, removeUpvote, hasUserVoted } from "../../services/issueUpvotes.service";
import { fetchCommentsByPost, addPostComment } from "../../services/postComments.service";
import { addPostUpvote, removePostUpvote, getPostUpvoteCount, hasUserVotedPost } from "../../services/postUpvotes.service";

function countCommentTree(nodes) {
  if (!nodes?.length) return 0;
  return nodes.reduce((acc, n) => acc + 1 + countCommentTree(n.replies || []), 0);
}

const POST_TYPES = ["announcement", "lost_found", "complaint"];

const PostDetail = () => {
  const params = useParams();
  const typeParam = params.type;
  const id = params.id;
  const type = typeParam ?? "issue";
  const isIssue = type === "issue";

  const navigate = useNavigate();
  const { user } = useAuth();
  const [issue, setIssue] = useState(null);
  const [postEntity, setPostEntity] = useState(null);
  const [commentTree, setCommentTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      setLoading(true);
      try {
        if (isIssue) {
          const data = await fetchIssueById(id);
          if (cancelled) return;
          setIssue(data);
          setPostEntity(null);
          const tree = await fetchCommentsByIssue(id, user?.uid ?? null);
          if (cancelled) return;
          setCommentTree(tree);
          if (user?.uid && data?.id) {
            const v = await hasUserVoted(data.id, user.uid);
            if (!cancelled) setVoted(!!v);
          }
          setUpvoteCount(data?.upvotes?.[0]?.count ?? 0);
        } else if (POST_TYPES.includes(type)) {
          let data;
          if (type === "announcement") data = await fetchAnnouncementById(id);
          else if (type === "lost_found") data = await fetchLostItemById(id);
          else data = await fetchComplaintById(id);
          if (cancelled) return;
          setPostEntity(data);
          setIssue(null);
          const [tree, count, hasV] = await Promise.all([
            fetchCommentsByPost(type, id),
            getPostUpvoteCount(type, id),
            user?.uid ? hasUserVotedPost(type, id, user.uid) : Promise.resolve(false),
          ]);
          if (cancelled) return;
          setCommentTree(tree);
          setUpvoteCount(count);
          setVoted(!!hasV);
        }
      } catch (e) {
        if (!cancelled) setIssue(null), setPostEntity(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, type, isIssue, user?.uid]);

  const handleUpvote = useCallback(async () => {
    if (!user) return;
    if (isIssue && issue?.id) {
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
      } catch (e) { console.error("Upvote error:", e); }
    } else if (POST_TYPES.includes(type) && id) {
      try {
        if (voted) {
          await removePostUpvote(type, id);
          setVoted(false);
          setUpvoteCount((c) => Math.max(0, c - 1));
        } else {
          await addPostUpvote(type, id);
          setVoted(true);
          setUpvoteCount((c) => c + 1);
        }
      } catch (e) { console.error("Upvote error:", e); }
    }
  }, [user, isIssue, issue?.id, type, id, voted]);

  const handleCommentSubmit = useCallback(
    async ({ text, parentId }) => {
      if (!user?.uid || !id?.trim() || !text?.trim()) return;
      try {
        if (isIssue) {
          await addComment({ issue_id: id, user_id: user.uid, text: text.trim(), parent_id: parentId ?? null });
          const tree = await fetchCommentsByIssue(id, user?.uid ?? null);
          setCommentTree(tree);
        } else if (POST_TYPES.includes(type)) {
          await addPostComment(type, id, { user_id: user.uid, text: text.trim(), parent_id: parentId ?? null });
          const tree = await fetchCommentsByPost(type, id);
          setCommentTree(tree);
        }
      } catch (e) { console.error("Add comment error:", e); }
    },
    [user?.uid, id, isIssue, type]
  );

  const handleCommentUpvote = useCallback(
    async (commentId, isUpvoted) => {
      if (!user?.uid || !id || !isIssue) return;
      try {
        if (isUpvoted) await removeCommentUpvote(commentId, user.uid);
        else await addCommentUpvote(id, commentId, user.uid);
        const tree = await fetchCommentsByIssue(id, user.uid);
        setCommentTree(tree);
      } catch (e) { console.error("Comment upvote error:", e); }
    },
    [user?.uid, id, isIssue]
  );

  const post = useMemo(() => {
    if (isIssue && issue) {
      return {
        title: issue.title,
        author: issue.profile?.name || "Anonymous",
        timestamp: issue.created_at ? new Date(issue.created_at) : new Date(),
        content: issue.description,
        // Render media via MediaRenderer in footerSlot
        mediaSlot: <MediaRenderer post={issue} fullSize />,
        mediaFullSize: true,
        upvoteCount: issue.upvotes?.[0]?.count ?? 0,
        commentCount: countCommentTree(commentTree),
        isUpvoted: voted,
        onUpvote: handleUpvote,
        currentStatus: issue.status ? <BadgeBetter1 status={issue.status} /> : null,
        statusTimeline: getStatusTimeline(issue.status, { timestamp: issue.created_at ? new Date(issue.created_at).toLocaleDateString() : "" }),
      };
    }
    if (postEntity && POST_TYPES.includes(type)) {
      const e = postEntity;
      const author = e.profile?.name || e.raised_by_profile?.name || e.reported_by_profile?.name || "Anonymous";
      const status = e.status || "Published";
      return {
        title: type === "complaint" ? `${e.complaint_type || "General"} Complaint` : e.title,
        author,
        timestamp: e.created_at ? new Date(e.created_at) : new Date(),
        content: e.content ?? e.description ?? "",
        mediaSlot: <MediaRenderer post={e} fullSize />,
        mediaFullSize: true,
        upvoteCount: upvoteCount,
        commentCount: countCommentTree(commentTree),
        isUpvoted: voted,
        onUpvote: handleUpvote,
        currentStatus: <BadgeBetter1 status={status} />,
        statusTimeline:
          type === "announcement"
            ? getAnnouncementTimeline(status, { timestamp: e.created_at ? new Date(e.created_at).toLocaleDateString() : "" })
            : type === "lost_found"
              ? getLostItemTimeline(status, { timestamp: e.created_at ? new Date(e.created_at).toLocaleDateString() : "" })
              : type === "complaint"
                ? getComplaintTimeline(status, { timestamp: e.created_at ? new Date(e.created_at).toLocaleDateString() : "" })
                : [
                    { label: "Posted", timestamp: e.created_at ? new Date(e.created_at).toLocaleDateString() : "", active: true },
                    { label: status, timestamp: "Current", active: true },
                  ],
      };
    }
    return null;
  }, [isIssue, issue, postEntity, type, commentTree, voted, upvoteCount, handleUpvote]);

  const totalComments = useMemo(() => countCommentTree(commentTree), [commentTree]);

  if (loading && !issue && !postEntity) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-[#00B8D4]" size={40} />
        <p className="text-gray-500 mt-3">Loading post...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <p className="text-gray-600">Post not found.</p>
        <button type="button" onClick={() => navigate("/feed")} className="mt-4 px-4 py-2 bg-[#00B8D4] text-white rounded-lg">
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
      onCommentUpvote={isIssue ? handleCommentUpvote : undefined}
      onBack={() => navigate(-1)}
    />
  );
};

export default PostDetail;
