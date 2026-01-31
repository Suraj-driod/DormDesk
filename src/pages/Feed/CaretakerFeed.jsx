import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Megaphone,
  Users,
  Search,
  AlertTriangle,
  FileText,
  Loader2,
  Eye,
} from "lucide-react";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

import PostBase from "../../components/core/PostBase/PostBase";
import { SelectBetter } from "../../UI/SelectBetter";
import { BadgeBetter1 } from "../../UI/BadgeBetter";
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
  const navigate = useNavigate();
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
          const issuesRef = collection(db, "issues");
          // Fetch all, filter client-side to avoid composite index
          const issuesSnap = await getDocs(issuesRef);

          const issuesList = await Promise.all(
            issuesSnap.docs
              .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
              .filter(issue => issue.visibility === "public")
              .map(async (issue) => {
                // Get profile name
                let authorName = "Anonymous";
                if (issue.created_by) {
                  try {
                    const profileRef = doc(db, "users", issue.created_by);
                    const profileSnap = await getDoc(profileRef);
                    if (profileSnap.exists()) {
                      authorName = profileSnap.data().name || "Anonymous";
                    }
                  } catch (e) {}
                }

                // Get upvotes count
                let upvotes = 0;
                try {
                  const votesQ = query(collection(db, "votes"), where("issue_id", "==", issue.id));
                  const votesSnap = await getDocs(votesQ);
                  upvotes = votesSnap.size;
                } catch (e) {}

                // Get comments count
                let comments = 0;
                try {
                  const commentsQ = query(collection(db, "comments"), where("issue_id", "==", issue.id));
                  const commentsSnap = await getDocs(commentsQ);
                  comments = commentsSnap.size;
                } catch (e) {}

                return {
                  id: issue.id,
                  title: issue.title,
                  content: issue.description,
                  author: authorName,
                  timestamp: new Date(issue.created_at || Date.now()),
                  status: issue.status,
                  upvotes,
                  comments,
                  visibility: issue.visibility,
                  category: issue.category,
                  priority: issue.priority,
                  media: issue.media_url ? { type: "image", url: issue.media_url } : null,
                };
              })
          );
          // Sort by date descending
          data = issuesList.sort((a, b) => b.timestamp - a.timestamp);
          break;

        case "announcements":
          const annRef = collection(db, "announcements");
          const annSnap = await getDocs(annRef);

          const annList = await Promise.all(annSnap.docs.map(async (docSnap) => {
            const ann = docSnap.data();
            
            let authorName = "Admin";
            if (ann.created_by) {
              try {
                let profileRef = doc(db, "users", ann.created_by);
                let profileSnap = await getDoc(profileRef);
                if (!profileSnap.exists()) {
                  profileRef = doc(db, "management", ann.created_by);
                  profileSnap = await getDoc(profileRef);
                }
                if (profileSnap.exists()) {
                  const profileData = profileSnap.data();
                  authorName = profileData.name || profileData.full_name || "Admin";
                }
              } catch (e) {}
            }

            return {
              id: docSnap.id,
              title: ann.title,
              content: ann.content,
              author: authorName,
              timestamp: new Date(ann.created_at || Date.now()),
              status: "Published",
              upvotes: 0,
              comments: 0,
              visibility: "public",
              target: `${ann.target_hostel}${ann.target_block ? ` - ${ann.target_block}` : ""}`,
              media: (ann.image_url || ann.media_url) ? { type: "image", url: ann.image_url || ann.media_url } : null,
            };
          }));
          data = annList.sort((a, b) => b.timestamp - a.timestamp);
          break;

        case "lost":
          const lostRef = collection(db, "lost_found");
          const lostSnap = await getDocs(lostRef);

          const lostList = await Promise.all(lostSnap.docs.map(async (docSnap) => {
            const item = docSnap.data();
            
            let authorName = "Anonymous";
            if (item.reported_by) {
              try {
                const profileRef = doc(db, "users", item.reported_by);
                const profileSnap = await getDoc(profileRef);
                if (profileSnap.exists()) {
                  authorName = profileSnap.data().name || "Anonymous";
                }
              } catch (e) {}
            }

            return {
              id: docSnap.id,
              title: item.title,
              content: item.description,
              author: authorName,
              timestamp: new Date(item.created_at || Date.now()),
              status: item.status,
              upvotes: 0,
              comments: 0,
              visibility: "public",
              location: item.location,
              media: item.image_url ? { type: "image", url: item.image_url } : null,
            };
          }));
          data = lostList.sort((a, b) => b.timestamp - a.timestamp);
          break;

        case "complaints":
          const compRef = collection(db, "complaints");
          const compSnap = await getDocs(compRef);

          const compList = await Promise.all(compSnap.docs.map(async (docSnap) => {
            const comp = docSnap.data();
            
            let authorName = "Anonymous";
            if (comp.raised_by) {
              try {
                const profileRef = doc(db, "users", comp.raised_by);
                const profileSnap = await getDoc(profileRef);
                if (profileSnap.exists()) {
                  authorName = profileSnap.data().name || "Anonymous";
                }
              } catch (e) {}
            }

            return {
              id: docSnap.id,
              title: `${comp.complaint_type || "General"} Complaint`,
              content: comp.description,
              author: authorName,
              timestamp: new Date(comp.created_at || Date.now()),
              status: comp.status,
              upvotes: 0,
              comments: 0,
              visibility: "private",
              type: comp.complaint_type,
              media: (comp.media_url || comp.image_url) ? { type: "image", url: comp.media_url || comp.image_url } : null,
            };
          }));
          data = compList.sort((a, b) => b.timestamp - a.timestamp);
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
                    media={post.media}
                    upvoteCount={post.upvotes}
                    commentCount={post.comments}
                    onCommentClick={activeTab === "issues" ? () => navigate(`/feed/post/${post.id}`) : undefined}
                    onPostClick={activeTab === "issues" ? () => navigate(`/feed/post/${post.id}`) : undefined}
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
