import React from 'react';
import PostBase from '../PostBase/PostBase';

const priorityStyles = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
};

const AnnouncementPost = ({
  title,
  author = 'Admin',
  authorAvatar,
  timestamp,
  content,
  children,
  media,
  visibility = 'public',
  priority = 'medium',
  className = '',
  ...rest
}) => {
  const priorityClass = priorityStyles[priority] || priorityStyles.medium;
  const headerSlot = (
    <div className="mt-2 flex items-center gap-2">
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${priorityClass}`}>
        Priority: {priority}
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
      headerSlot={headerSlot}
      actionsSlot={<></>}
      upvoteCount={0}
      commentCount={0}
      className={`border-l-4 border-[#00B8D4] bg-[#E0F7FA]/30 ${className}`}
    >
      {children}
    </PostBase>
  );
};

export default AnnouncementPost;
