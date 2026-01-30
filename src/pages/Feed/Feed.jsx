import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  Users,
  Search,
  AlertTriangle,
  Plus,
  FileText,
  Loader2,
} from "lucide-react";

// --- Custom Components ---
import PostBase from "../../components/core/PostBase/PostBase";
import { SelectBetter } from "../../UI/SelectBetter";
import { BadgeBetter1 } from "../../UI/BadgeBetter";

// --- Backend Hook (TODO: create FeedGet service) ---
// import { useFeedGet } from "../../Services/FeedGet";
const useFeedGet = () => ({ data: [], loading: false });

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "top", label: "Most Upvoted" },
  { value: "discussed", label: "Most Discussed" },
];

const TABS = [
  { id: "issues", label: "Public Issues", icon: Users },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "lost", label: "Lost Items", icon: Search },
  { id: "complaints", label: "Complaints", icon: AlertTriangle },
];

const Feed = () => {
  const [activeTab, setActiveTab] = useState("issues");
  const [sortOrder, setSortOrder] = useState("newest");

  const { data: currentData, loading } = useFeedGet(activeTab);

  const actionConfig = useMemo(() => {
    switch (activeTab) {
      case "issues":
        return { text: "Report Issue", icon: Plus };
      case "lost":
        return { text: "Report Item", icon: Search };
      case "complaints":
        return { text: "File Complaint", icon: AlertTriangle };
      default:
        return null;
    }
  }, [activeTab]);

  const sortedData = useMemo(() => {
    if (!currentData) return [];
    return [...currentData].sort((a, b) => {
      if (sortOrder === "newest") return b.timestamp - a.timestamp;
      if (sortOrder === "top") return b.upvotes - a.upvotes;
      if (sortOrder === "discussed") return b.comments - a.comments;
      return 0;
    });
  }, [currentData, sortOrder]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-['Poppins',sans-serif]">
      {/* ---------- Header ---------- */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <h1 className="text-3xl font-bold text-gray-800">Campus Feed</h1>
          <p className="text-gray-500 text-sm mt-1">
            Stay updated with the latest happenings
          </p>

          {/* Tabs */}
          <div className="mt-6 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-5 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all
                    ${
                      activeTab === tab.id
                        ? "text-[#008394]"
                        : "text-gray-500 hover:bg-gray-100"
                    }
                  `}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeFeedTab"
                      className="absolute inset-0 bg-[#E0F7FA] rounded-xl"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <tab.icon size={18} />
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Content ---------- */}
      <div className="max-w-5xl mx-auto px-4 py-6">
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

        <motion.div layout className="space-y-6 pb-36">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div className="py-20 flex flex-col items-center text-gray-400">
                <Loader2 className="animate-spin mb-3" size={36} />
                <p className="text-sm">Loading {activeTab}...</p>
              </motion.div>
            ) : sortedData.length ? (
              sortedData.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
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
                    currentStatus={<BadgeBetter1 status={post.status} />}
                    statusTimeline={[
                      {
                        label: "Posted",
                        timestamp: post.timestamp.toLocaleDateString(),
                        active: true,
                      },
                      {
                        label: post.status,
                        timestamp: "Current",
                        active: true,
                      },
                    ]}
                  />
                </motion.div>
              ))
            ) : (
              <motion.div className="py-20 text-center flex flex-col items-center">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow">
                  <FileText size={40} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-700">
                  No {activeTab} yet
                </h3>
                <p className="text-gray-500 text-sm">
                  Be the first to post!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ---------- Desktop CTA ---------- */}
      {actionConfig && (
        <motion.div className="fixed bottom-10 right-10 z-50 hidden md:block">
          <motion.button
            whileHover={{
              scale: 1.08,
              boxShadow: "0 12px 40px rgba(0,229,255,0.55)",
            }}
            whileTap={{ scale: 0.96 }}
            className="px-8 py-4 rounded-full bg-gradient-to-r from-[#00B8D4] via-[#00D9F5] to-[#00E5FF] text-white font-extrabold tracking-wide flex items-center gap-3 shadow-lg"
          >
            <actionConfig.icon size={22} strokeWidth={2.7} />
            {actionConfig.text}
          </motion.button>
        </motion.div>
      )}

      {/* ---------- Mobile FAB ---------- */}
      {actionConfig && (
        <motion.div className="fixed bottom-7 right-7 z-50 md:hidden">
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#00B8D4] to-[#00E5FF] text-white shadow-xl flex items-center justify-center"
          >
            <actionConfig.icon size={28} strokeWidth={2.8} />
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

export default Feed;
