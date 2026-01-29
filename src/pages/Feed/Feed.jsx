import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Megaphone, Users, Search, AlertTriangle, 
  Plus, Filter, FileText 
} from "lucide-react";

// --- Custom Components ---
import PostBase from "../../components/core/PostBase";
import { SelectBetter } from "../../page/SelectBetter";
import { BadgeBetter1 } from "../../page/BadgeBetter";

// --- Mock Data ---
const MOCK_DATA = {
  issues: [
    {
      id: 1,
      title: "Broken Streetlight near C-Block",
      author: "Rahul V.",
      timestamp: new Date("2026-01-28T19:30:00"),
      content: "The streetlight creates a dark spot near the entrance. It's unsafe at night.",
      status: "Reported",
      upvotes: 12,
      comments: 3,
      visibility: "public"
    },
    {
      id: 2,
      title: "Gym Equipment Rusted",
      author: "Alex M.",
      timestamp: new Date("2026-01-27T10:00:00"),
      content: "The treadmill in the boys' hostel gym is stuck and rusted.",
      status: "InProgress",
      upvotes: 45,
      comments: 8,
      visibility: "public"
    }
  ],
  announcements: [
    {
      id: 3,
      title: "Annual Sports Day Registration",
      author: "Sports Committee",
      timestamp: new Date("2026-01-29T09:00:00"),
      content: "Registrations for Cricket, Football, and Basketball are now open. Visit the gym office to sign up.",
      status: "Assigned", 
      upvotes: 89,
      comments: 12,
      visibility: "public"
    }
  ],
  lost: [
    {
      id: 5,
      title: "Lost: Black Sony Headphones",
      author: "Priya S.",
      timestamp: new Date("2026-01-28T16:20:00"),
      content: "Left them in the library reading room table 4. Please contact if found.",
      status: "Reported",
      upvotes: 5,
      comments: 1,
      visibility: "public",
      media: { type: 'image', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop' }
    }
  ],
  complaints: [
    {
      id: 6,
      title: "Loud Music in B-Block Post Midnight",
      author: "Anonymous",
      timestamp: new Date("2026-01-28T01:30:00"),
      content: "Residents of Room 304 are playing loud music every night. It's disturbing everyone.",
      status: "Assigned",
      upvotes: 20,
      comments: 0,
      visibility: "public"
    }
  ]
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'top', label: 'Most Upvoted' },
  { value: 'discussed', label: 'Most Discussed' },
];

const TABS = [
  { id: 'issues', label: 'Public Issues', icon: Users },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'lost', label: 'Lost Items', icon: Search },
  { id: 'complaints', label: 'Complaints', icon: AlertTriangle },
];

const Feed = () => {
  const [activeTab, setActiveTab] = useState('issues');
  const [sortOrder, setSortOrder] = useState('newest');

  // --- Helpers ---
  const currentData = useMemo(() => {
    return MOCK_DATA[activeTab] || [];
  }, [activeTab]);

  const getActionConfig = () => {
    switch (activeTab) {
      case 'issues': return { text: 'Report Issue', icon: Plus };
      case 'lost': return { text: 'Report Item', icon: Search };
      case 'complaints': return { text: 'File Complaint', icon: AlertTriangle };
      default: return null;
    }
  };

  const actionConfig = getActionConfig();

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-['Poppins',sans-serif]">
      
      {/* --- Sticky Header Area --- */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#E6FBFF] shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 md:py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Title Section */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Campus Feed</h1>
              <p className="text-gray-500 text-xs md:text-sm mt-1">Stay updated with the latest happenings</p>
            </div>

            {/* Desktop Action Button (Hidden on Mobile) */}
            {actionConfig && (
              <div className="hidden md:block">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(0,229,255,0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => console.log(`Clicked ${actionConfig.text}`)}
                  className={`
                    px-6 py-3 rounded-full 
                    bg-gradient-to-r from-[#00B8D4] to-[#00E5FF] 
                    text-white font-bold text-sm tracking-wide
                    flex items-center gap-2 shadow-lg
                    transition-all duration-300
                  `}
                >
                  <actionConfig.icon size={18} strokeWidth={2.5} />
                  {actionConfig.text}
                </motion.button>
              </div>
            )}
          </div>

          {/* --- Tabs Navigation (Inside Sticky Header) --- */}
          <div className="mt-6 overflow-x-auto scrollbar-hide pb-1">
            <div className="flex gap-2 min-w-max">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300
                    flex items-center gap-2
                    ${activeTab === tab.id ? 'text-[#008394]' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}
                  `}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeFeedTab"
                      className="absolute inset-0 bg-[#E0F7FA] rounded-xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <tab.icon size={16} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        
        {/* Sort Filter (Separate Row) */}
        <div className="flex justify-end mb-6">
          <div className="w-full md:w-56">
            <SelectBetter
              options={SORT_OPTIONS}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              placeholder="Sort By"
            />
          </div>
        </div>

        {/* Feed List */}
        <motion.div layout className="space-y-6 pb-20">
          <AnimatePresence mode="wait">
            {currentData.length > 0 ? (
              currentData.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <PostBase
                    title={post.title}
                    author={post.author}
                    timestamp={post.timestamp}
                    content={post.content}
                    visibility={post.visibility}
                    media={post.media}
                    upvoteCount={post.upvotes}
                    commentCount={post.comments}
                    // Inject Badge
                    currentStatus={<BadgeBetter1 status={post.status} />}
                    // Example Timeline
                    statusTimeline={[
                      { label: "Reported", timestamp: "Jan 28", active: true },
                      { label: post.status, timestamp: "Today", active: true },
                    ]}
                  />
                </motion.div>
              ))
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-20 text-center flex flex-col items-center"
              >
                <div className="w-24 h-24 bg-white border border-gray-100 shadow-sm rounded-full flex items-center justify-center mb-4">
                  <FileText className="text-gray-300" size={40} />
                </div>
                <h3 className="text-lg font-bold text-gray-700">No {activeTab} yet</h3>
                <p className="text-gray-500 text-sm mt-1">Check back later or be the first to post!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* --- Mobile Floating Action Button (FAB) --- */}
      {actionConfig && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="fixed bottom-6 right-6 md:hidden z-50"
        >
          <button
            onClick={() => console.log(`Mobile Click: ${actionConfig.text}`)}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#00B8D4] to-[#00E5FF] text-white shadow-[0_4px_20px_rgba(0,229,255,0.5)] flex items-center justify-center active:scale-95 transition-transform"
          >
            <actionConfig.icon size={24} strokeWidth={2.5} />
          </button>
        </motion.div>
      )}

    </div>
  );
};

export default Feed;