import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Star, ThumbsUp, ThumbsDown, CheckCircle, Image as ImageIcon } from "lucide-react";
import PostDetailBase from "../../components/core/PostDetailBase/PostDetailBase";
import MediaRenderer from "../../components/core/MediaRenderer/MediaRenderer";
import { BadgeBetter1 } from "../../UI/BadgeBetter";
import { getStatusTimeline, getAnnouncementTimeline, getLostItemTimeline, getComplaintTimeline } from "../../utils/statusTimeline";
import { useAuth } from "../../auth/AuthContext";
import { fetchIssueById, submitIssueFeedback } from "../../services/issues.service";
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
  const { user, profile } = useAuth();
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
      let author = e.profile?.name || e.raised_by_profile?.name || e.reported_by_profile?.name || "Anonymous";
      if (type === "complaint" && profile?.role === "caretaker") {
        author = "Anonymous";
      }
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

  // ── Feedback form state ─────────────────────────────────────────────────────
  const [fbRating, setFbRating] = useState(0);
  const [fbHover, setFbHover] = useState(0);
  const [fbSatisfaction, setFbSatisfaction] = useState(null);
  const [fbComment, setFbComment] = useState("");
  const [fbSubmitting, setFbSubmitting] = useState(false);
  const [fbError, setFbError] = useState("");

  const canGiveFeedback = isIssue && issue && user?.uid === issue.created_by && issue.status === "resolved" && !issue.feedbackGiven;
  const showProof = isIssue && issue?.proofUrl && ["resolved", "closed"].includes(issue.status);
  const showFeedbackSummary = isIssue && issue?.feedbackGiven && issue?.feedback;

  const handleFeedbackSubmit = async () => {
    if (!fbRating) { setFbError("Please select a rating"); return; }
    if (!fbSatisfaction) { setFbError("Please select satisfaction"); return; }
    setFbError("");
    setFbSubmitting(true);
    try {
      const updated = await submitIssueFeedback(issue.id, user.uid, {
        rating: fbRating,
        satisfaction: fbSatisfaction,
        comment: fbComment,
      });
      setIssue((prev) => ({ ...prev, ...updated }));
    } catch (err) {
      setFbError(err.message || "Failed to submit feedback");
    } finally {
      setFbSubmitting(false);
    }
  };

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

  const feedbackSlot = (
    <>
      {/* Proof preview */}
      {showProof && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <ImageIcon size={16} className="text-teal-500" /> Proof of Resolution
          </h3>
          <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            {issue.proofSubmission?.resourceType === "video" ? (
              <video src={issue.proofUrl} controls className="w-full max-h-[300px]" />
            ) : (
              <img src={issue.proofUrl} alt="Proof" className="w-full max-h-[300px] object-contain" />
            )}
          </div>
          {issue.proofSubmission?.comment && (
            <p className="text-xs text-gray-500 mt-2 italic">"{issue.proofSubmission.comment}"</p>
          )}
        </div>
      )}

      {/* Feedback form */}
      {canGiveFeedback && (
        <div className="bg-gradient-to-br from-[#F0FEFF] to-white rounded-2xl border border-[#B2EBF2] shadow-sm p-5 mb-4">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Star size={16} className="text-amber-500" /> Give Feedback
          </h3>

          {/* Stars */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2 font-medium">How would you rate the resolution?</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setFbRating(i)}
                  onMouseEnter={() => setFbHover(i)}
                  onMouseLeave={() => setFbHover(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={28}
                    className={i <= (fbHover || fbRating) ? "text-amber-400 fill-amber-400" : "text-gray-300"}
                  />
                </button>
              ))}
              {fbRating > 0 && <span className="ml-2 text-sm text-gray-500 self-center">{fbRating}/5</span>}
            </div>
          </div>

          {/* Satisfaction */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2 font-medium">Are you satisfied with the resolution?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFbSatisfaction("satisfied")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                  fbSatisfaction === "satisfied"
                    ? "border-green-400 bg-green-50 text-green-700"
                    : "border-gray-200 text-gray-500 hover:border-green-300"
                }`}
              >
                <ThumbsUp size={16} /> Satisfied
              </button>
              <button
                type="button"
                onClick={() => setFbSatisfaction("not_satisfied")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                  fbSatisfaction === "not_satisfied"
                    ? "border-red-400 bg-red-50 text-red-700"
                    : "border-gray-200 text-gray-500 hover:border-red-300"
                }`}
              >
                <ThumbsDown size={16} /> Not Satisfied
              </button>
            </div>
          </div>

          {/* Comment */}
          <div className="mb-4">
            <textarea
              value={fbComment}
              onChange={(e) => setFbComment(e.target.value)}
              placeholder="Any additional comments... (optional)"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/30 focus:border-[#00E5FF] transition-all"
              rows={3}
            />
          </div>

          {fbError && <p className="text-xs text-red-500 mb-3">{fbError}</p>}

          <button
            type="button"
            onClick={handleFeedbackSubmit}
            disabled={fbSubmitting}
            className="w-full px-4 py-3 bg-gradient-to-r from-[#00E5FF] to-[#00B8D4] text-white font-semibold text-sm rounded-xl hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {fbSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle size={16} />
            )}
            Submit Feedback
          </button>
        </div>
      )}

      {/* Already-submitted feedback summary */}
      {showFeedbackSummary && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Star size={16} className="text-amber-500 fill-amber-500" /> Your Feedback
          </h3>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={16} className={i <= issue.feedback.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"} />
              ))}
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
              issue.feedback.satisfaction === "satisfied"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}>
              {issue.feedback.satisfaction === "satisfied" ? "Satisfied" : "Not Satisfied"}
            </span>
          </div>
          {issue.feedback.comment && <p className="text-sm text-gray-600">{issue.feedback.comment}</p>}
          <p className="text-xs text-gray-400 mt-2">Submitted {new Date(issue.feedback.submittedAt).toLocaleString()}</p>
        </div>
      )}
    </>
  );

  return (
    <PostDetailBase
      post={post}
      comments={commentTree}
      totalCommentCount={totalComments}
      onCommentSubmit={handleCommentSubmit}
      onCommentUpvote={isIssue ? handleCommentUpvote : undefined}
      onBack={() => navigate(-1)}
      postSlot={feedbackSlot}
    />
  );
};

export default PostDetail;
