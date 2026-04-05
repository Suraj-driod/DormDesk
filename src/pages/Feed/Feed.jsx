import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Megaphone,
  Users,
  Search,
  AlertTriangle,
  Plus,
  FileText,
  Loader2,
} from "lucide-react";

import PostBase from "../../components/core/PostBase/PostBase";
import MediaRenderer from "../../components/core/MediaRenderer/MediaRenderer";
import { SelectBetter } from "../../UI/SelectBetter";
import { BadgeBetter1 } from "../../UI/BadgeBetter";
import { getStatusTimeline, getAnnouncementTimeline, getLostItemTimeline, getComplaintTimeline } from "../../utils/statusTimeline";
import { useAuth } from "../../auth/AuthContext";
import { fetchIssuesForFeed } from "../../services/issues.service";
import { fetchAnnouncements } from "../../services/announcements.service";
import { fetchLostItems } from "../../services/lostItems.service";
import { fetchComplaints } from "../../services/complaints.service";
import { addUpvote, removeUpvote, hasUserVoted } from "../../services/issueUpvotes.service";
import {
  addPostUpvote,
  removePostUpvote,
  getPostUpvoteCountsBatch,
  getHasVotedBatch,
} from "../../services/postUpvotes.service";
import { getCommentCountsBatch } from "../../services/postComments.service";

const tabToPostType = (tab) =>
  ({ announcements: "announcement", lost: "lost_found", complaints: "complaint" }[tab] || null);

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
  const navigate = useNavigate();
  const { isStudent, isAdmin, profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState("issues");
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentData, setCurrentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votedPosts, setVotedPosts] = useState({});

  useEffect(() => {
    fetchData();
  }, [activeTab, profile]);

  const handleUpvote = useCallback(
    async (postId) => {
      if (!user) return;
      const postType = tabToPostType(activeTab);
      const isIssue = activeTab === "issues";
      try {
        const hasVoted = votedPosts[postId];
        if (isIssue) {
          if (hasVoted) {
            await removeUpvote(postId);
            setVotedPosts((prev) => ({ ...prev, [postId]: false }));
            setCurrentData((prev) =>
              prev.map((post) =>
                post.id === postId ? { ...post, upvotes: Math.max(0, post.upvotes - 1) } : post
              )
            );
          } else {
            await addUpvote(postId);
            setVotedPosts((prev) => ({ ...prev, [postId]: true }));
            setCurrentData((prev) =>
              prev.map((post) =>
                post.id === postId ? { ...post, upvotes: post.upvotes + 1 } : post
              )
            );
          }
        } else if (postType) {
          if (hasVoted) {
            await removePostUpvote(postType, postId);
            setVotedPosts((prev) => ({ ...prev, [postId]: false }));
            setCurrentData((prev) =>
              prev.map((post) =>
                post.id === postId ? { ...post, upvotes: Math.max(0, post.upvotes - 1) } : post
              )
            );
          } else {
            await addPostUpvote(postType, postId);
            setVotedPosts((prev) => ({ ...prev, [postId]: true }));
            setCurrentData((prev) =>
              prev.map((post) =>
                post.id === postId ? { ...post, upvotes: post.upvotes + 1 } : post
              )
            );
          }
        }
      } catch (error) {
        console.error("Upvote error:", error);
      }
    },
    [user, votedPosts, activeTab]
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      let data = [];

      switch (activeTab) {
        case "issues":
          const issues = await fetchIssuesForFeed(profile?.hostelId);
          data = issues?.map((issue) => ({
            id: issue.id,
            title: issue.title,
            content: issue.description,
            author: issue.profile?.name || "Anonymous",
            timestamp: new Date(issue.created_at),
            status: issue.status,
            upvotes: issue.upvotes?.[0]?.count || 0,
            comments: issue.comments?.[0]?.count || 0,
            visibility: issue.visibility,
            category: issue.category,
            priority: issue.priority,
            repostCount: issue.repost_count || 0,
            // Pass raw document for MediaRenderer normalization
            _rawDoc: issue,
          })) || [];
          
          // Check which issues user has voted on
          if (user?.uid && issues?.length) {
            const voteChecks = await Promise.all(
              issues.map(issue => hasUserVoted(issue.id, user.uid))
            );
            const newVotedPosts = {};
            issues.forEach((issue, idx) => {
              newVotedPosts[issue.id] = voteChecks[idx];
            });
            setVotedPosts(prev => ({ ...prev, ...newVotedPosts }));
          }
          break;

        case "announcements": {
          const announcements = await fetchAnnouncements({}, profile?.hostelId);
          data =
            announcements?.map((ann) => ({
              id: ann.id,
              title: ann.title,
              content: ann.content,
              author: ann.profile?.name || "Admin",
              timestamp: new Date(ann.created_at),
              status: "Published",
              upvotes: 0,
              comments: 0,
              visibility: "public",
              target: `${ann.target_hostel}${ann.target_block ? ` - ${ann.target_block}` : ""}`,
              _rawDoc: ann,
            })) || [];
          const annIds = data.map((p) => p.id);
          if (annIds.length) {
            const [upvoteCounts, commentCounts, votedMap] = await Promise.all([
              getPostUpvoteCountsBatch("announcement", annIds),
              getCommentCountsBatch("announcement", annIds),
              user?.uid ? getHasVotedBatch("announcement", annIds, user.uid) : Promise.resolve({}),
            ]);
            data = data.map((p) => ({
              ...p,
              upvotes: upvoteCounts[p.id] ?? 0,
              comments: commentCounts[p.id] ?? 0,
            }));
            setVotedPosts((prev) => ({ ...prev, ...votedMap }));
          }
          break;
        }

        case "lost": {
          const lostItems = await fetchLostItems({ status: "lost" }, profile?.hostelId);
          data =
            lostItems?.map((item) => ({
              id: item.id,
              title: item.title,
              content: item.description,
              author: item.reported_by_profile?.name || "Anonymous",
              timestamp: new Date(item.created_at),
              status: item.status,
              upvotes: 0,
              comments: 0,
              visibility: "public",
              location: item.location,
              _rawDoc: item,
            })) || [];
          const lostIds = data.map((p) => p.id);
          if (lostIds.length) {
            const [upvoteCounts, commentCounts, votedMap] = await Promise.all([
              getPostUpvoteCountsBatch("lost_found", lostIds),
              getCommentCountsBatch("lost_found", lostIds),
              user?.uid ? getHasVotedBatch("lost_found", lostIds, user.uid) : Promise.resolve({}),
            ]);
            data = data.map((p) => ({
              ...p,
              upvotes: upvoteCounts[p.id] ?? 0,
              comments: commentCounts[p.id] ?? 0,
            }));
            setVotedPosts((prev) => ({ ...prev, ...votedMap }));
          }
          break;
        }

        case "complaints": {
          const complaintsFilters = isStudent ? { raised_by: profile?.id } : {};
          const complaints = await fetchComplaints(complaintsFilters, profile?.hostelId);
          data =
            complaints?.map((comp) => ({
              id: comp.id,
              title: `${comp.complaint_type} Complaint`,
              content: comp.description,
              author: profile?.role === 'caretaker' ? "Anonymous" : (comp.raised_by_profile?.name || "Anonymous"),
              timestamp: new Date(comp.created_at),
              status: comp.status,
              upvotes: 0,
              comments: 0,
              visibility: "private",
              type: comp.complaint_type,
              _rawDoc: comp,
            })) || [];
          const compIds = data.map((p) => p.id);
          if (compIds.length) {
            const [upvoteCounts, commentCounts, votedMap] = await Promise.all([
              getPostUpvoteCountsBatch("complaint", compIds),
              getCommentCountsBatch("complaint", compIds),
              user?.uid ? getHasVotedBatch("complaint", compIds, user.uid) : Promise.resolve({}),
            ]);
            data = data.map((p) => ({
              ...p,
              upvotes: upvoteCounts[p.id] ?? 0,
              comments: commentCounts[p.id] ?? 0,
            }));
            setVotedPosts((prev) => ({ ...prev, ...votedMap }));
          }
          break;
        }
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

  const actionConfig = useMemo(() => {
    if (!isStudent) return null; // Only students can report
    
    switch (activeTab) {
      case "issues":
        return { text: "Report Issue", icon: Plus, path: "/report-issue" };
      case "lost":
        return { text: "Report Item", icon: Search, path: "/lost-found" };
      case "complaints":
        return { text: "File Complaint", icon: AlertTriangle, path: "/complaints" };
      default:
        return null;
    }
  }, [activeTab, isStudent]);

  const handleAction = () => {
    if (actionConfig?.path) {
      navigate(actionConfig.path);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-['Poppins',sans-serif]">
      {/* Glowy Tabs Bar */}
      <div className="sticky top-0 z-30 bg-transparent">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-center">
          <div className="flex gap-2 px-3 py-2 rounded-2xl bg-[#ECFAFD]
            border border-[#D6F5FA]
            shadow-[0_0_30px_rgba(0,229,255,0.25)]
          ">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;

              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveTab(tab.id);
                  }}
                  className={`relative flex items-center gap-2 px-5 py-3 rounded-xl
                    text-sm font-bold transition-all duration-300
                    ${active ? "text-[#007C8A]" : "text-gray-500 hover:text-gray-800"}
                  `}
                >
                  {active && (
                    <motion.div
                      layoutId="feedTabGlow"
                      className="
                        pointer-events-none
                        absolute inset-0 rounded-xl
                        bg-gradient-to-r from-[#B2F3FF] to-white
                        shadow-[0_0_25px_rgba(0,229,255,0.6)]
                      "
                    />
                  )}

                  <span className="relative z-10 flex items-center gap-2">
                    <Icon size={18} strokeWidth={active ? 2.6 : 2} />
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
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
                    upvoteCount={post.upvotes}
                    commentCount={post.comments}
                    isUpvoted={votedPosts[post.id] || false}
                    onUpvote={() => handleUpvote(post.id)}
                    onCommentClick={() =>
                      activeTab === "issues"
                        ? navigate(`/feed/post/${post.id}`)
                        : navigate(`/feed/post/${tabToPostType(activeTab)}/${post.id}`)
                    }
                    onPostClick={() =>
                      activeTab === "issues"
                        ? navigate(`/feed/post/${post.id}`)
                        : navigate(`/feed/post/${tabToPostType(activeTab)}/${post.id}`)
                    }
                    currentStatus={<BadgeBetter1 status={post.status} />}
                    statusTimeline={
                      activeTab === "issues"
                        ? getStatusTimeline(post.status, { timestamp: post.timestamp?.toLocaleDateString?.() })
                        : activeTab === "announcements"
                          ? getAnnouncementTimeline(post.status, { timestamp: post.timestamp?.toLocaleDateString?.() })
                          : activeTab === "lost"
                            ? getLostItemTimeline(post.status, { timestamp: post.timestamp?.toLocaleDateString?.() })
                            : activeTab === "complaints"
                              ? getComplaintTimeline(post.status, { timestamp: post.timestamp?.toLocaleDateString?.() })
                              : [{ label: "Posted", timestamp: post.timestamp?.toLocaleDateString?.(), active: true }, { label: post.status, timestamp: "Current", active: true }]
                    }
                    footerSlot={
                      post._rawDoc ? (
                        <div className="pb-1">
                          <MediaRenderer post={post._rawDoc} />
                        </div>
                      ) : null
                    }
                    extras={
                      post.repostCount > 0 && (
                        <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                          {post.repostCount} similar reports
                        </span>
                      )
                    }
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
                  {isStudent ? "Be the first to post!" : "Nothing to display."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Desktop CTA - Only for students */}
      {actionConfig && (
        <motion.div className="fixed bottom-10 right-10 z-50 hidden md:block">
          <motion.button
            onClick={handleAction}
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

      {/* Mobile FAB - Only for students */}
      {actionConfig && (
        <motion.div className="fixed bottom-7 right-7 z-50 md:hidden">
          <motion.button
            onClick={handleAction}
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
