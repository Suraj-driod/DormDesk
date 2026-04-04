import React, { useState, isValidElement } from 'react';
import MediaRenderer from '../MediaRenderer/MediaRenderer';

const PostBase = ({
  // Header props
  title,
  author = 'Admin',
  authorAvatar,
  timestamp,
  
  // Content props
  content,
  children,
  
  // Media props
  media,
  mediaSlot,
  
  // Status props
  visibility = 'public',
  currentStatus,
  statusTimeline,
  statusSlot,
  
  // Action props
  upvoteCount = 0,
  commentCount = 0,
  isUpvoted = false,
  onUpvote,
  onCommentClick,
  onPostClick,
  onRepost,
  mediaFullSize = false,
  
  // Slots for extensibility
  headerSlot,
  footerSlot,
  actionsSlot,
  
  // Styling
  className = '',
}) => {
  const [showStatusTooltip, setShowStatusTooltip] = useState(false);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const VisibilityBadge = () => (
    <span
      className={`
        inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide
        ${visibility === 'public' 
          ? 'bg-[#E0F7FA] text-[#00B8D4]' 
          : 'bg-gray-100 text-gray-600'
        }
      `}
    >
      {visibility === 'public' ? (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )}
      {visibility}
    </span>
  );

  const getStatusColor = (label) => {
    // Safety check: ensure label is a string
    if (!label || typeof label !== 'string') {
        return { dot: 'bg-gray-400', text: 'text-gray-600', line: 'bg-gray-200' };
    }

    const normalizedLabel = label.toLowerCase();
    if (normalizedLabel.includes('reported') || normalizedLabel.includes('open')) {
      return { dot: 'bg-red-500', text: 'text-red-600', line: 'bg-red-300' };
    }
    if (normalizedLabel.includes('assigned')) {
      return { dot: 'bg-blue-500', text: 'text-blue-600', line: 'bg-blue-300' };
    }
    if (normalizedLabel.includes('progress') || normalizedLabel.includes('in_progress') || normalizedLabel.includes('review')) {
      return { dot: 'bg-amber-500', text: 'text-amber-600', line: 'bg-amber-300' };
    }
    if (normalizedLabel.includes('resolved') || normalizedLabel.includes('claimed')) {
      return { dot: 'bg-green-500', text: 'text-green-600', line: 'bg-green-300' };
    }
    if (normalizedLabel.includes('closed')) {
      return { dot: 'bg-gray-500', text: 'text-gray-600', line: 'bg-gray-300' };
    }
    if (normalizedLabel.includes('published') || normalizedLabel.includes('draft')) {
      return { dot: normalizedLabel.includes('published') ? 'bg-[#00B8D4]' : 'bg-gray-400', text: normalizedLabel.includes('published') ? 'text-[#00838F]' : 'text-gray-500', line: normalizedLabel.includes('published') ? 'bg-[#00E5FF]/50' : 'bg-gray-300' };
    }
    if (normalizedLabel.includes('lost')) return { dot: 'bg-amber-500', text: 'text-amber-600', line: 'bg-amber-300' };
    if (normalizedLabel.includes('found')) return { dot: 'bg-green-500', text: 'text-green-600', line: 'bg-green-300' };
    if (normalizedLabel.includes('submitted')) return { dot: 'bg-blue-500', text: 'text-blue-600', line: 'bg-blue-300' };
    if (normalizedLabel.includes('under_review') || normalizedLabel.includes('under review')) {
      return { dot: 'bg-amber-500', text: 'text-amber-600', line: 'bg-amber-300' };
    }
    return { dot: 'bg-[#00E5FF]', text: 'text-[#00B8D4]', line: 'bg-[#00E5FF]/50' };
  };

  const StatusBadge = () => {
    if (!currentStatus && !statusSlot) return null;

    // Check if currentStatus is a React Element (like <BadgeBetter1 />)
    if (isValidElement(currentStatus)) {
        return (
            <div 
                className="relative"
                onMouseEnter={() => setShowStatusTooltip(true)}
                onMouseLeave={() => setShowStatusTooltip(false)}
            >
                {currentStatus}
                {/* Tooltip Logic reused below */}
                {showStatusTooltip && statusTimeline && statusTimeline.length > 0 && (
                    <TimelineTooltip />
                )}
            </div>
        );
    }

    // Default string handling logic
    const currentColors = getStatusColor(currentStatus);

    return (
      <div 
        className="relative"
        onMouseEnter={() => setShowStatusTooltip(true)}
        onMouseLeave={() => setShowStatusTooltip(false)}
      >
        {statusSlot || (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#00E5FF]/10 text-[#00B8D4] border border-[#00E5FF]/20 cursor-pointer transition-all hover:bg-[#00E5FF]/20`}>
            <span className={`w-1.5 h-1.5 rounded-full ${currentColors.dot} animate-pulse`} />
            {currentStatus}
          </span>
        )}

        {showStatusTooltip && statusTimeline && statusTimeline.length > 0 && (
            <TimelineTooltip />
        )}
      </div>
    );
  };

  // Extract Timeline Tooltip to reuse it easily
  const TimelineTooltip = () => (
    <div className="absolute right-0 top-full mt-2 z-50 p-4 bg-white rounded-xl shadow-xl border border-gray-200 animate-fadeIn min-w-[200px]">
        <div className="text-xs font-semibold text-gray-700 mb-3">Status Timeline</div>
        <div className="flex items-start overflow-x-auto pb-2 scrollbar-thin">
            {statusTimeline.map((item, index) => {
                const colors = getStatusColor(item.label);
                const isLast = index === statusTimeline.length - 1;
                
                return (
                    <div key={index} className="flex items-start">
                        {/* Dot and content */}
                        <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${item.active ? colors.dot : 'bg-gray-300 border-2 border-gray-200'}`} />
                            <div className="mt-2 text-center min-w-[70px]">
                                <div className={`text-[10px] font-semibold whitespace-nowrap ${item.active ? colors.text : 'text-gray-400'}`}>
                                    {item.label}
                                </div>
                                {item.timestamp && (
                                    <div className="text-[9px] text-gray-400 mt-0.5 whitespace-nowrap">{item.timestamp}</div>
                                )}
                            </div>
                        </div>
                        {/* Horizontal line */}
                        {!isLast && (
                            <div className={`h-0.5 w-6 mt-1.5 flex-shrink-0 ${item.active ? colors.line : 'bg-gray-200'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    </div>
  );

  const ActionButton = ({ icon, count, active, onClick, label }) => (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
        transition-all duration-200 min-h-[36px]
        ${active 
          ? 'text-[#00E5FF] bg-[#00E5FF]/10' 
          : 'text-gray-500 hover:text-[#00E5FF] hover:bg-[#00E5FF]/5'
        }
      `}
      aria-label={label}
    >
      {icon}
      {count !== undefined && count > 0 && <span>{count}</span>}
    </button>
  );

  const UpvoteIcon = () => (
    <svg className="w-5 h-5" fill={isUpvoted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  );

  const CommentIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );

  const RepostIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );

  const clickable = Boolean(onPostClick);
  const wrap = (children) =>
    clickable ? (
      <div
        role="button"
        tabIndex={0}
        onClick={onPostClick}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPostClick?.()}
        className="cursor-pointer outline-none"
      >
        {children}
      </div>
    ) : (
      children
    );

  return (
    <article
      className={`
        bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)]
        border border-gray-100 overflow-hidden
        transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]
        ${className}
      `}
    >
      {wrap(
        <>
      {/* Header */}
      <header className="px-4 pt-4 pb-3 border-b border-gray-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {authorAvatar ? (
              <img 
                src={authorAvatar} 
                alt={author}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-[#E0F7FA]"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00E5FF] to-[#00B8D4] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm">
                  {author?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700 truncate">
                  Posted by {author}
                </span>
              </div>
              <time className="text-xs text-gray-400">
                {formatDate(timestamp)}
              </time>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <VisibilityBadge />
            <StatusBadge />
          </div>
        </div>
        
        {/* Title */}
        <h2 className="mt-3 text-lg font-bold text-gray-900 leading-snug">
          {title}
        </h2>

        {/* Custom header slot */}
        {headerSlot}
      </header>

      {/* Content */}
      <div className="px-4 py-3">
        {content && (
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        )}
        
        {/* Custom children content */}
        {children}
      </div>

      {/* Media Preview */}
      {(mediaSlot || media) && (
        <div className="px-4 pb-3">
          {/* Explicit pre-rendered slot (e.g. from PostDetail via MediaRenderer) */}
          {mediaSlot || null}
          {/* Legacy media object prop — normalize via MediaRenderer */}
          {!mediaSlot && media && (
            <MediaRenderer
              post={{
                media_url: media.url,
                media: media.url ? [{ url: media.url, resourceType: media.type || 'image', thumbnail: media.url }] : undefined,
              }}
            />
          )}
        </div>
      )}
        </>
      )}

      {/* Custom footer slot (above actions) */}
      {footerSlot && (
        <div className="px-4 pb-3">
          {footerSlot}
        </div>
      )}

      {/* Footer Actions */}
      <footer className="px-4 py-3 bg-gray-50/50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {actionsSlot || (
              <>
                <ActionButton
                  icon={<UpvoteIcon />}
                  count={upvoteCount}
                  active={isUpvoted}
                  onClick={onUpvote}
                  label="Upvote"
                />
                <ActionButton
                  icon={<CommentIcon />}
                  count={commentCount}
                  active={false}
                  onClick={onCommentClick}
                  label="Comments"
                />
                <ActionButton
                  icon={<RepostIcon />}
                  active={false}
                  onClick={onRepost}
                  label="Repost"
                />
              </>
            )}
          </div>
        </div>
      </footer>
    </article>
  );
};

export default PostBase;