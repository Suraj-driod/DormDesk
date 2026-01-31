import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, Lock, Globe, FileText, Loader2 } from "lucide-react"; 
import { PostBase } from "../../components/core";
import { BadgeBetter1 } from "../../UI/BadgeBetter";
import { SelectBetter } from "../../UI/SelectBetter"; 

// --- Import the Backend Hook ---
import { useMyReports } from "../../services/MyReports";

// --- Options for SelectBetter ---
const FILTER_OPTIONS = [
  { value: "All", label: "All Status" },
  { value: "Reported", label: "Reported" },
  { value: "Assigned", label: "Assigned" },
  { value: "InProgress", label: "In Progress" },
  { value: "Resolved", label: "Resolved" },
];

const Issues = () => {
  const navigate = useNavigate();
  const { reports, loading } = useMyReports();
  
  const [activeTab, setActiveTab] = useState("public"); // 'public' | 'private'
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // 2. Filter Logic (Applied to Real Data)
  const filteredIssues = useMemo(() => {
    return reports.filter((issue) => {
      // Ensure safe comparison by converting to lower case
      const issueType = issue.type ? issue.type.toLowerCase() : 'public';
      
      const matchesTab = issueType === activeTab;
      const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status matching (Handle case sensitivity if needed)
      const matchesStatus = statusFilter === "All" || issue.status === statusFilter;
      
      return matchesTab && matchesSearch && matchesStatus;
    });
  }, [activeTab, searchQuery, statusFilter, reports]);

  return (
    <div className="min-h-screen bg-[linear-gradient(#f7fdff,#ffffff)] font-['Poppins',sans-serif] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* --- Header --- */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-bold text-gray-800">My Reports</h1>
          <p className="text-gray-500 mt-1">Track the status of your complaints and view public issues.</p>
        </div>

        {/* --- Controls Section --- */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8">
          
          {/* Tab Switcher */}
          <div className="flex bg-white p-1 rounded-full border border-[#E6FBFF] shadow-sm w-full md:w-auto">
            {["public", "private"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  relative px-6 py-2.5 rounded-full text-sm font-semibold capitalize w-1/2 md:w-auto z-10 transition-colors duration-300
                  ${activeTab === tab ? "text-[#00B8D4]" : "text-gray-500 hover:text-gray-700"}
                `}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-[#E0F7FA] rounded-full shadow-[0_0_10px_rgba(0,229,255,0.15)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {tab === "public" ? <Globe size={16} /> : <Lock size={16} />}
                  {tab}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Filter */}
          <div className="flex gap-3 w-full md:w-auto items-center">
            {/* Search Bar */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-[#E6FBFF] focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20 outline-none text-sm text-gray-700 transition-all shadow-sm"
              />
            </div>
            
            {/* Custom Select Component */}
            <div className="w-48 z-30"> 
               <SelectBetter 
                 options={FILTER_OPTIONS}
                 value={statusFilter}
                 onChange={(e) => setStatusFilter(e.target.value)}
                 placeholder="Status"
               />
            </div>
          </div>
        </div>

        {/* --- List Section --- */}
        {loading ? (
           <div className="flex flex-col items-center justify-center py-20 text-gray-400">
             <Loader2 className="animate-spin mb-2" size={32} />
             <p>Loading your reports...</p>
           </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 gap-6 z-0 relative">
            <AnimatePresence mode="popLayout">
              {filteredIssues.length > 0 ? (
                filteredIssues.map((issue) => (
                  <motion.div
                    key={issue.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <PostBase
                      title={issue.title}
                      author={issue.author}
                      timestamp={issue.timestamp}
                      content={issue.content}
                      visibility={issue.type}
                      media={issue.media}
                      upvoteCount={issue.upvotes}
                      commentCount={issue.comments}
                      onCommentClick={() => navigate(`/feed/post/${issue.id}`)}
                      onPostClick={() => navigate(`/feed/post/${issue.id}`)}
                      currentStatus={<BadgeBetter1 status={issue.status} />}
                      statusTimeline={[
                        { label: "Reported", timestamp: "Created", active: true },
                        { label: issue.status, timestamp: "Current", active: true },
                      ]}
                    />
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FileText className="text-gray-400" size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">No Issues Found</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    You have no {activeTab} reports matching your filters.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default Issues;