import { useState } from 'react';
import PostBase from '../PostBase/PostBase';

const PostDetailBase = ({
  // Post props (passed to PostBase)
  post,
  
  // Comments data
  comments = [],
  totalCommentCount,
  
  // Comment input props
  commentInputPlaceholder = 'Write a comment...',
  onCommentSubmit,
  onCommentUpvote,
  commentInputSlot,
  
  // Navigation
  onBack,
  
  // Extension slots
  postSlot,
  commentsHeaderSlot,
  commentActionsSlot,
  emptyCommentsSlot,
  
  // Styling
  className = '',
}) => {
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyingToId, setReplyingToId] = useState(null);
  const [commentText, setCommentText] = useState('');

  const renderCommentInput = (replyTo, onCancelReply) => (
    <div className={replyTo ? 'ml-12 mt-3' : ''}>
      {commentInputSlot || (
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00E5FF] to-[#00B8D4] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-xs">U</span>
          </div>
          <div className="flex-1">
            <div className="relative">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={replyTo ? `Reply to ${replyTo}...` : commentInputPlaceholder}
                className="w-full px-4 py-3 pr-24 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/30 focus:border-[#00E5FF] transition-all min-h-[80px]"
                rows={3}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                {replyTo && (
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyingToId(null);
                      setCommentText('');
                      onCancelReply?.();
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onCommentSubmit?.({ text: commentText, replyTo, parentId: replyTo != null ? (replyingToId ?? undefined) : undefined });
                    setCommentText('');
                    setReplyingTo(null);
                    setReplyingToId(null);
                  }}
                  disabled={!commentText.trim()}
                  className="px-4 py-1.5 bg-gradient-to-r from-[#00E5FF] to-[#00B8D4] text-white text-xs font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_12px_rgba(0,229,255,0.4)] transition-all"
                >
                  {replyTo ? 'Reply' : 'Comment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const CommentItem = ({ comment, depth = 0, renderActions, onUpvote }) => {
    const maxDepth = 4;
    const isMaxDepth = depth >= maxDepth;
    const hasReplies = comment.replies && comment.replies.length > 0;

    return (
      <div className={`${depth > 0 ? 'ml-12 pt-3' : ''}`}>
        <div className="flex gap-3">
          {/* Avatar */}
          {comment.authorAvatar ? (
            <img
              src={comment.authorAvatar}
              alt={comment.author}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <span className="text-gray-600 font-semibold text-xs">
                {comment.author?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Comment header */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-900">{comment.author}</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-400">{comment.timestamp}</span>
            </div>

            {/* Comment content */}
            <p className="mt-1 text-sm text-gray-700 leading-relaxed">{comment.content}</p>

            {/* Comment actions */}
            <div className="mt-2 flex items-center gap-1">
              {renderActions ? renderActions(comment) : (
                <>
                  <CommentActionButton
                    icon={<UpvoteIcon />}
                    count={comment.upvotes}
                    active={comment.isUpvoted}
                  />
                  <CommentActionButton
                    icon={<DownvoteIcon />}
                    active={comment.isDownvoted}
                  />
                  {!isMaxDepth && (
                    <button
                      onClick={() => {
                        setReplyingTo(comment.author);
                        setReplyingToId(comment.id);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 hover:text-[#00E5FF] hover:bg-[#00E5FF]/5 rounded transition-colors"
                    >
                      <ReplyIcon />
                      Reply
                    </button>
                  )}
                  <button className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
                    <MoreIcon />
                  </button>
                </>
              )}
            </div>

            {/* Reply input */}
            {replyingToId === comment.id && (
              <div className="mt-3">
                {renderCommentInput(comment.author, () => { setReplyingTo(null); setReplyingToId(null); })}
              </div>
            )}
          </div>
        </div>

        {/* Nested replies */}
        {hasReplies && (
          <div className="relative">
            {/* Thread line */}
            <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-gray-200" />
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                renderActions={renderActions}
                onUpvote={onUpvote}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const CommentActionButton = ({ icon, count, active, onClick }) => (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
        active
          ? 'text-[#00E5FF] bg-[#00E5FF]/10'
          : 'text-gray-500 hover:text-[#00E5FF] hover:bg-[#00E5FF]/5'
      }`}
    >
      {icon}
      {count !== undefined && count > 0 && <span>{count}</span>}
    </button>
  );

  const UpvoteIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  );

  const DownvoteIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );

  const ReplyIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  );

  const MoreIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
    </svg>
  );

  const SortIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
    </svg>
  );

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header with back button */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Main Post Content */}
        {postSlot || (
          <PostBase
            {...post}
            onCommentClick={undefined}
            className="shadow-none border-0 bg-white"
          />
        )}

        {/* Comments Section */}
        <div className="mt-6 bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">
          {/* Comments Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            {commentsHeaderSlot || (
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">
                  Comments {(totalCommentCount ?? comments.length) > 0 && `(${totalCommentCount ?? comments.length})`}
                </h3>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <SortIcon />
                  Sort by: Best
                </button>
              </div>
            )}
          </div>

          {/* Comment Input */}
          <div className="px-4 py-4 border-b border-gray-100">
            {renderCommentInput(null)}
          </div>

          {/* Comments List */}
          <div className="px-4 py-4">
            {(totalCommentCount ?? comments.length) === 0 ? (
              emptyCommentsSlot || (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-600">No comments yet</p>
                  <p className="mt-1 text-xs text-gray-400">Be the first to share your thoughts!</p>
                </div>
              )
            ) : (
              <div className="space-y-4 divide-y divide-gray-100">
                {comments.map((comment) => (
                  <div key={comment.id} className="pt-4 first:pt-0">
                    <CommentItem
                      comment={comment}
                      renderActions={commentActionsSlot}
                      onUpvote={onCommentUpvote}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailBase;