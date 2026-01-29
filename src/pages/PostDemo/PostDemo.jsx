import { useState } from 'react';
import PostBase from '../../components/core/PostBase';
import PostDetailBase from '../../components/core/PostDetailBase';

const PostDemo = () => {
  const [selectedPost, setSelectedPost] = useState(null);
  const [upvoted, setUpvoted] = useState({});

  const handleUpvote = (postId) => {
    setUpvoted(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const sampleTimeline = [
    { label: 'Reported', timestamp: 'Jan 28, 2026 10:30 AM', active: true },
    { label: 'Assigned', timestamp: 'Jan 28, 2026 11:00 AM', active: true },
    { label: 'In Progress', timestamp: 'Jan 28, 2026 2:45 PM', active: true },
    { label: 'Resolved', timestamp: null, active: false },
    { label: 'Closed', timestamp: null, active: false },
  ];

  const sampleComments = [
    {
      id: 1,
      author: 'Jane Smith',
      content: 'I\'m experiencing the same issue in Room 206. The water damage is getting worse every day.',
      timestamp: '2 hours ago',
      upvotes: 12,
      isUpvoted: false,
      replies: [
        {
          id: 2,
          author: 'John Doe',
          content: 'Have you reported it to the maintenance team as well? The more reports, the faster they might respond.',
          timestamp: '1 hour ago',
          upvotes: 5,
          replies: [
            {
              id: 3,
              author: 'Jane Smith',
              content: 'Yes, I submitted a ticket yesterday. Still waiting for a response.',
              timestamp: '45 min ago',
              upvotes: 2,
              replies: [],
            },
          ],
        },
      ],
    },
    {
      id: 4,
      author: 'Admin',
      content: 'Thank you for bringing this to our attention. The maintenance team has been notified and will inspect the issue today.',
      timestamp: '30 min ago',
      upvotes: 24,
      isUpvoted: true,
      replies: [],
    },
    {
      id: 5,
      author: 'Mike Chen',
      content: 'This is a recurring problem in Block A. We need a permanent fix, not just temporary patches.',
      timestamp: '15 min ago',
      upvotes: 8,
      replies: [],
    },
  ];

  const posts = [
    {
      id: 1,
      title: 'Water Leakage in Block A - Room 204',
      author: 'John Doe',
      timestamp: new Date('2026-01-28T10:30:00'),
      content: 'There\'s been a persistent water leakage from the bathroom ceiling for the past 3 days. The maintenance team was informed but no action has been taken yet. This is causing water damage to the floor and potential mold growth.',
      visibility: 'public',
      currentStatus: 'In Progress',
      statusTimeline: sampleTimeline,
      upvoteCount: 24,
      commentCount: 12,
    },
    {
      id: 2,
      title: 'Found: Blue Backpack near Library',
      author: 'Admin',
      timestamp: new Date('2026-01-27T14:20:00'),
      content: 'A blue JanSport backpack was found near the main library entrance this afternoon. Contains some notebooks and a water bottle. Owner can claim it from the security office with proper identification.',
      visibility: 'public',
      currentStatus: 'Open',
      statusTimeline: [
        { label: 'Reported', timestamp: 'Jan 27, 2026 2:20 PM', active: true },
        { label: 'Claimed', timestamp: null, active: false },
      ],
      media: {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=400&fit=crop',
        alt: 'Blue backpack',
      },
      upvoteCount: 8,
      commentCount: 3,
    },
    {
      id: 3,
      title: 'Important: Exam Schedule Update',
      author: 'Academic Office',
      timestamp: new Date('2026-01-26T09:00:00'),
      content: 'The mid-term examination schedule for CS301 has been rescheduled from February 5th to February 8th. Please update your calendars accordingly. Contact the academic office for any concerns.',
      visibility: 'private',
      upvoteCount: 156,
      commentCount: 45,
    },
  ];

  // Detail View
  if (selectedPost) {
    const post = posts.find(p => p.id === selectedPost);
    return (
      <PostDetailBase
        post={{
          ...post,
          isUpvoted: upvoted[post.id],
          onUpvote: () => handleUpvote(post.id),
        }}
        comments={sampleComments}
        onBack={() => setSelectedPost(null)}
        onCommentSubmit={(data) => console.log('Comment submitted:', data)}
      />
    );
  }

  // List View
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">PostBase Component Demo</h1>
        <p className="text-sm text-gray-500 mb-4">Click on any post or the comment icon to view the detail page.</p>

        {posts.map((post) => (
          <div 
            key={post.id} 
            onClick={() => setSelectedPost(post.id)}
            className="cursor-pointer"
          >
            <PostBase
              {...post}
              isUpvoted={upvoted[post.id]}
              onUpvote={(e) => {
                e.stopPropagation();
                handleUpvote(post.id);
              }}
              onCommentClick={(e) => {
                e?.stopPropagation();
                setSelectedPost(post.id);
              }}
              headerSlot={post.id === 3 && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                    Announcement
                  </span>
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                    Urgent
                  </span>
                </div>
              )}
            />
          </div>
        ))}

        {/* Additional examples without click navigation */}
        <h2 className="text-lg font-bold text-gray-900 pt-6">More Examples (Static)</h2>

        <PostBase
          title="Complaint: Noisy Construction During Exams"
          author="Sarah Wilson"
          timestamp={new Date('2026-01-25T16:45:00')}
          content="The ongoing construction work near the dormitory is extremely disruptive, especially during exam period. Request to restrict heavy machinery operation between 8 AM - 6 PM on weekdays."
          visibility="public"
          currentStatus="Under Review"
          statusTimeline={[
            { label: 'Reported', timestamp: 'Jan 25, 2026 4:45 PM', active: true },
            { label: 'Under Review', timestamp: 'Jan 26, 2026 9:00 AM', active: true },
            { label: 'Action Taken', timestamp: null, active: false },
            { label: 'Closed', timestamp: null, active: false },
          ]}
          footerSlot={
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="px-2 py-1 bg-gray-100 rounded">Noise Complaint</span>
              <span className="px-2 py-1 bg-gray-100 rounded">Dormitory</span>
              <span className="px-2 py-1 bg-gray-100 rounded">Construction</span>
            </div>
          }
          upvoteCount={89}
          commentCount={23}
        />

        <PostBase
          title="Issue: WiFi Connectivity Problems"
          author="Tech Support"
          timestamp={new Date('2026-01-23T08:15:00')}
          visibility="public"
          currentStatus="Resolved"
          statusTimeline={[
            { label: 'Reported', timestamp: 'Jan 23, 2026 8:15 AM', active: true },
            { label: 'Assigned', timestamp: 'Jan 23, 2026 8:30 AM', active: true },
            { label: 'In Progress', timestamp: 'Jan 23, 2026 9:00 AM', active: true },
            { label: 'Resolved', timestamp: 'Jan 23, 2026 11:30 AM', active: true },
            { label: 'Closed', timestamp: 'Jan 23, 2026 12:00 PM', active: true },
          ]}
          upvoteCount={234}
          commentCount={67}
        >
          <div className="space-y-3">
            <p className="text-gray-600 text-sm">
              Multiple students reported intermittent WiFi connectivity issues in Building C. 
              Our IT team has identified and resolved the router configuration problem.
            </p>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Issue has been resolved
              </div>
              <p className="mt-1 text-green-600 text-xs">
                WiFi service has been fully restored. Please restart your device if you're still experiencing issues.
              </p>
            </div>
          </div>
        </PostBase>
      </div>
    </div>
  );
};

export default PostDemo;
