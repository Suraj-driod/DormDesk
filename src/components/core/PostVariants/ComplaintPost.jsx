import React from 'react';
import PostBase from '../PostBase';

const complaintTypeStyles = {
  noise: 'bg-orange-100 text-orange-700 border-orange-200',
  hygiene: 'bg-amber-100 text-amber-700 border-amber-200',
  behavior: 'bg-red-100 text-red-700 border-red-200',
  other: 'bg-gray-100 text-gray-600 border-gray-200',
};

const ComplaintPost = ({
  title,
  author,
  authorAvatar,
  timestamp,
  content,
  children,
  media,
  visibility = 'public',
  complaintType = 'other',
  accusedName,
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
  const typeClass = complaintTypeStyles[complaintType] || complaintTypeStyles.other;
  const headerSlot = (
    <div className="mt-2 flex items-center gap-2 flex-wrap">
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border capitalize ${typeClass}`}>
        {complaintType}
      </span>
      {accusedName && (
        <span className="text-xs text-gray-600">
          Against: <span className="font-medium text-gray-700">{accusedName}</span>
        </span>
      )}
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

export default ComplaintPost;
