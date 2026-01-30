import React from 'react';
import PostBase from '../PostBase';

const LostFoundPost = ({
  title,
  author,
  authorAvatar,
  timestamp,
  content,
  children,
  media,
  visibility = 'public',
  type = 'found',
  location,
  onClaim,
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
  const isLost = type === 'lost';
  const tagClass = isLost
    ? 'bg-amber-100 text-amber-700 border-amber-200'
    : 'bg-emerald-100 text-emerald-700 border-emerald-200';

  const headerSlot = (
    <div className="mt-2 flex items-center gap-2 flex-wrap">
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border uppercase tracking-wide ${tagClass}`}>
        {type}
      </span>
      {location && (
        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {location}
        </span>
      )}
    </div>
  );

  const footerSlot = onClaim ? (
    <div className="flex items-center justify-end">
      <button
        type="button"
        onClick={onClaim}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#00B8D4] text-white hover:bg-[#0097A7] transition-colors"
      >
        Claim Item
      </button>
    </div>
  ) : null;

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
      footerSlot={footerSlot}
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

export default LostFoundPost;
