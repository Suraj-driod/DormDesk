import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Search,
  AlertTriangle,
  FileText,
  Loader2,
  Lock,
  Globe,
} from "lucide-react";

import PostBase from "../../components/core/PostBase/PostBase";
import { SelectBetter } from "../../UI/SelectBetter";
import { BadgeBetter1 } from "../../UI/BadgeBetter";
import { getStatusTimeline, getAnnouncementTimeline, getLostItemTimeline, getComplaintTimeline } from "../../utils/statusTimeline";
import { useAuth } from "../../auth/AuthContext";
import { fetchIssues } from "../../services/issues.service";
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
  ({ lost: "lost_found", complaints: "complaint" }[tab] || null);

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "top", label: "Most Upvoted" },
  { value: "discussed", label: "Most Discussed" },
];

const TABS = [
  { id: "issues", label: "My Issues", icon: ClipboardList },
  { id: "lost", label: "Lost Items", icon: Search },
  { id: "complaints", label: "Complaints", icon: AlertTriangle },
];

const MyIssues = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState("issues");
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentData, setCurrentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votedPosts, setVotedPosts] = useState({});

  const uid = user?.uid || profile?.id;

  useEffect(() => {
    if (!uid) return;
    fetchData();
  }, [activeTab, uid]);

  const handleUpvote = useCallback(
    async (postId) => {
      if (!user) return;
      const isIssue = activeTab === "issues";
      const postType = tabToPostType(activeTab);
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
        case "issues": {
          const issues = await fetchIssues({ created_by: uid }, profile?.hostelId);
          data =
            issues?.map((issue) => ({
              id: issue.id,
              title: issue.title,
              content: issue.description,
              author: issue.profile?.name || "You",
              timestamp: new Date(issue.created_at),
              status: issue.status,
              upvotes: issue.upvotes?.[0]?.count || 0,
              comments: issue.comments?.[0]?.count || 0,
              visibility: issue.visibility,
              category: issue.category,
              priority: issue.priority,
              repostCount: issue.repost_count || 0,
              media: issue.media_url ? { type: "image", url: issue.media_url } : null,
            })) || [];
          if (user?.uid && issues?.length) {
            const voteChecks = await Promise.all(
              issues.map((issue) => hasUserVoted(issue.id, user.uid))
            );
            const newVotedPosts = {};
            issues.forEach((issue, idx) => {
              newVotedPosts[issue.id] = voteChecks[idx];
            });
            setVotedPosts((prev) => ({ ...prev, ...newVotedPosts }));
          }
          break;
        }

        case "lost": {
          const allLost = await fetchLostItems({}, profile?.hostelId);
          const lostItems = (allLost || []).filter((item) => item.reported_by === uid);
          data = lostItems.map((item) => ({
            id: item.id,
            title: item.title,
            content: item.description,
            author: item.reported_by_profile?.name || "You",
            timestamp: new Date(item.created_at),
            status: item.status,
            upvotes: 0,
            comments: 0,
            visibility: "public",
            location: item.location,
            media: item.image_url ? { type: "image", url: item.image_url } : null,
          }));
          const lostIds = data.map((p) => p.id);
          if (lostIds.length && user?.uid) {
            const [upvoteCounts, commentCounts, votedMap] = await Promise.all([
              getPostUpvoteCountsBatch("lost_found", lostIds),
              getCommentCountsBatch("lost_found", lostIds),
              getHasVotedBatch("lost_found", lostIds, user.uid),
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
          const complaints = await fetchComplaints({ raised_by: profile?.id || uid }, profile?.hostelId);
          data = complaints?.map((comp) => ({
            id: comp.id,
            title: `${comp.complaint_type} Complaint`,
            content: comp.description,
            author: comp.raised_by_profile?.name || "You",
            timestamp: new Date(comp.created_at),
            status: comp.status,
            upvotes: 0,
            comments: 0,
            visibility: "private",
            type: comp.complaint_type,
            media: (comp.media_url || comp.image_url)
              ? { type: "image", url: comp.media_url || comp.image_url }
              : null,
          })) || [];
          const compIds = data.map((p) => p.id);
          if (compIds.length && user?.uid) {
            const [upvoteCounts, commentCounts, votedMap] = await Promise.all([
              getPostUpvoteCountsBatch("complaint", compIds),
              getCommentCountsBatch("complaint", compIds),
              getHasVotedBatch("complaint", compIds, user.uid),
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
      console.error("Error fetching my issues:", error);
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
      <div className="sticky top-0 z-30 bg-transparent/80 ">
        <div className="max-w-5xl mx-auto px-4 py-5">
        


              {/* Glowy MyIssues Tabs Bar */}
            <div className="sticky top-0 z-30 bg-transparent">
              <div className="max-w-5xl mx-auto px-4 py-6 flex justify-center">
                <div
                  className="
                    flex gap-2 px-3 py-2 rounded-2xl
                    bg-[#ECFAFD]
                    border border-[#D6F5FA]
                    shadow-[0_0_35px_rgba(0,229,255,0.28)]
                  "
                >
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveTab(tab.id);
                        }}
                        className={`
                          relative flex items-center gap-2
                          px-5 py-3 rounded-xl
                          text-sm font-bold
                          transition-all duration-300
                          ${active
                            ? "text-[#007C8A]"
                            : "text-gray-500 hover:text-gray-800"}
                        `}
                      >
                        {active && (
                          <motion.div
                            layoutId="myIssuesTabGlow"
                            className="
                              pointer-events-none
                              absolute inset-0 rounded-xl
                              bg-gradient-to-r from-[#B2F3FF] to-white
                              shadow-[0_0_30px_rgba(0,229,255,0.65)]
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
            </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex justify-end mb-6 md:mb-8">
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
                <p className="text-sm">Loading...</p>
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
                        : activeTab === "lost"
                          ? getLostItemTimeline(post.status, { timestamp: post.timestamp?.toLocaleDateString?.() })
                          : activeTab === "complaints"
                            ? getComplaintTimeline(post.status, { timestamp: post.timestamp?.toLocaleDateString?.() })
                            : [{ label: "Posted", timestamp: post.timestamp?.toLocaleDateString?.(), active: true }, { label: post.status, timestamp: "Current", active: true }]
                    }
                    extras={
                      <>
                        {post.visibility === "private" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
                            <Lock size={10} /> Private
                          </span>
                        )}
                        {post.visibility === "public" && activeTab === "issues" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#E0F7FA] text-[#00838F] border border-[#B2EBF2]">
                            <Globe size={10} /> Public
                          </span>
                        )}
                        {post.repostCount > 0 && (
                          <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                            {post.repostCount} similar reports
                          </span>
                        )}
                      </>
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
                  No {activeTab === "issues" ? "issues" : activeTab} yet
                </h3>
                <p className="text-gray-500 text-sm">
                  Reports and complaints you create will appear here.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default MyIssues;
