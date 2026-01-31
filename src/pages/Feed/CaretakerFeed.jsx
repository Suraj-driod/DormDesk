import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  Users,
  Search,
  AlertTriangle,
  FileText,
  Loader2,
  Eye,
} from "lucide-react";

import PostBase from "../../components/core/PostBase/PostBase";
import { SelectBetter } from "../../UI/SelectBetter";
import { BadgeBetter1 } from "../../UI/BadgeBetter";
import { supabase } from "../../Lib/supabaseClient";
import { useAuth } from "../../auth/AuthContext";

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

const CaretakerFeed = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("issues");
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentData, setCurrentData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab, profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let data = [];

      switch (activeTab) {
        case "issues":
          const { data: issues } = await supabase
            .from("issues")
            .select(`
              id, title, description, created_at, status, visibility, category, priority,
              profiles:created_by (name),
              upvotes:issue_upvotes (count),
              comments:issue_comments (count)
            `)
            .eq("visibility", "public")
            .order("created_at", { ascending: false });

          data = issues?.map((issue) => ({
            id: issue.id,
            title: issue.title,
            content: issue.description,
            author: issue.profiles?.name || "Anonymous",
            timestamp: new Date(issue.created_at),
            status: issue.status,
            upvotes: issue.upvotes?.[0]?.count || 0,
            comments: issue.comments?.[0]?.count || 0,
            visibility: issue.visibility,
            category: issue.category,
            priority: issue.priority,
          })) || [];
          break;

        case "announcements":
          const { data: announcements } = await supabase
            .from("announcements")
            .select(`
              id, title, content, created_at, target_hostel, target_block,
              profiles:created_by (name)
            `)
            .order("created_at", { ascending: false });

          data = announcements?.map((ann) => ({
            id: ann.id,
            title: ann.title,
            content: ann.content,
            author: ann.profiles?.name || "Admin",
            timestamp: new Date(ann.created_at),
            status: "Published",
            upvotes: 0,
            comments: 0,
            visibility: "public",
            target: `${ann.target_hostel}${ann.target_block ? ` - ${ann.target_block}` : ""}`,
          })) || [];
          break;

        case "lost":
          const { data: lostItems } = await supabase
            .from("lost_items")
            .select(`
              id, title, description, created_at, status, location,
              profiles:reported_by (name)
            `)
            .order("created_at", { ascending: false });

          data = lostItems?.map((item) => ({
            id: item.id,
            title: item.title,
            content: item.description,
            author: item.profiles?.name || "Anonymous",
            timestamp: new Date(item.created_at),
            status: item.status,
            upvotes: 0,
            comments: 0,
            visibility: "public",
            location: item.location,
          })) || [];
          break;

        case "complaints":
          const { data: complaints } = await supabase
            .from("complaints")
            .select(`
              id, description, created_at, status, complaint_type,
              profiles:raised_by (name)
            `)
            .order("created_at", { ascending: false });

          data = complaints?.map((comp) => ({
            id: comp.id,
            title: `${comp.complaint_type} Complaint`,
            content: comp.description,
            author: comp.profiles?.name || "Anonymous",
            timestamp: new Date(comp.created_at),
            status: comp.status,
            upvotes: 0,
            comments: 0,
            visibility: "private",
            type: comp.complaint_type,
          })) || [];
          break;
      }

      setCurrentData(data);
    } catch (error) {
      console.error("Error fetching feed data:", error);
      setCurrentData([]);
    } finally {
      setLoading(false);
    }
  };

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
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <div className="flex items-center gap-3 mb-2">
            <Eye size={24} className="text-purple-500" />
            <h1 className="text-3xl font-bold text-gray-800">Campus Feed</h1>
          </div>
          <p className="text-gray-500 text-sm">
            View-only mode for caretakers - Stay updated with campus happenings
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
                        ? "text-purple-600"
                        : "text-gray-500 hover:bg-gray-100"
                    }
                  `}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="caretakerFeedTab"
                      className="absolute inset-0 bg-purple-50 rounded-xl"
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

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          {/* Read-only badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-100 rounded-full">
            <Eye size={14} className="text-purple-500" />
            <span className="text-xs font-medium text-purple-700">Read-only Mode</span>
          </div>

          <div className="w-full md:w-56">
            <SelectBetter
              options={SORT_OPTIONS}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              placeholder="Sort By"
            />
          </div>
        </div>

        <motion.div layout className="space-y-6 pb-12">
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
                    // No action buttons for caretaker
                    hideActions
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
                  Nothing to display at the moment.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default CaretakerFeed;
