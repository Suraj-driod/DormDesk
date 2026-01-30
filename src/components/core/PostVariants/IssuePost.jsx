import React from 'react';
import PostBase from '../PostBase';

const severityStyles = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
};

const IssuePost = ({
  title,
  author,
  authorAvatar,
  timestamp,
  content,
  children,
  media,
  visibility = 'public',
  severity = 'medium',
  currentStatus,
  statusTimeline,
  statusSlot,
  upvoteCount = 0,
  commentCount = 0,
  isUpvoted = false,
  onUpvote,
  onCommentClick,
  onRepost,
  className = '',
  ...rest
}) => {
  const severityClass = severityStyles[severity] || severityStyles.medium;
  const headerSlot = (
    <div className="mt-2 flex items-center gap-2 flex-wrap">
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${severityClass}`}>
        Severity: {severity}
      </span>
    </div>
  );

  return (
    <PostBase
      {...rest}
      title={title}
      author={author}
      authorAvatar={authorAvatar}
      timestamp={timestamp}
      content={content}
      media={media}
      visibility={visibility}
      currentStatus={currentStatus}
      statusTimeline={statusTimeline}
      statusSlot={statusSlot}
      headerSlot={headerSlot}
      upvoteCount={upvoteCount}
      commentCount={commentCount}
      isUpvoted={isUpvoted}
      onUpvote={onUpvote}
      onCommentClick={onCommentClick}
      onRepost={onRepost}
      className={className}
    >
      {children}
    </PostBase>
  );
};

export default IssuePost;
