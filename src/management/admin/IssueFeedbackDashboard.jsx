import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Star, ThumbsUp, ThumbsDown, Filter, RefreshCw,
  Eye, X, XCircle, CheckCircle, TrendingDown, BarChart3,
  MessageSquare,
} from "lucide-react";

import { SelectBetter } from "../../UI/SelectBetter";
import { BadgeBetter1 } from "../../UI/BadgeBetter";
import { AlertModal } from "../../UI/Glow";
import { fetchIssues, adminReviewIssueFeedback } from "../../services/issues.service";
import { useAuth } from "../../auth/AuthContext";
import { useAlert } from "../../hooks/useAlert";

const StarRating = ({ rating, size = 14 }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        size={size}
        className={i <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}
      />
    ))}
  </div>
);

const IssueFeedbackDashboard = () => {
  const { user, profile } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { alertState, closeAlert, error: showError, success: showSuccess } = useAlert();

  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [caretakerFilter, setCaretakerFilter] = useState("All");
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => { loadIssues(); }, []);

  const loadIssues = async () => {
    setLoading(true);
    try {
      const data = await fetchIssues({}, profile?.hostelId);
      setIssues(data || []);
    } catch (error) {
      console.error("Error loading issues:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadIssues();
    setRefreshing(false);
  };

  const handleAdjudicate = async (issue, outcome) => {
    const note = outcome === "negative" ? prompt("Reason for reopening (optional):") : null;
    if (outcome === "negative" && note === null) return;
    try {
      const updated = await adminReviewIssueFeedback(
        issue.id,
        user?.uid ?? profile?.id ?? profile?.managementDocId,
        outcome,
        note
      );
      setIssues((prev) => prev.map((i) => (i.id === issue.id ? { ...i, ...updated } : i)));
      showSuccess(outcome === "positive" ? "Issue closed." : "Issue reopened for rework.");
    } catch (err) {
      showError(err.message || "Failed to review feedback");
    }
  };

  const feedbackIssues = useMemo(
    () => issues.filter((i) => i.feedbackGiven),
    [issues]
  );

  const filteredData = useMemo(() => {
    return feedbackIssues.filter((issue) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        issue.title?.toLowerCase().includes(q) ||
        issue.profile?.name?.toLowerCase().includes(q) ||
        (issue.assigned_profile?.full_name || issue.assigned_profile?.name || "").toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (ratingFilter !== "All" && issue.feedback?.rating !== Number(ratingFilter)) return false;
      if (categoryFilter !== "All" && issue.category !== categoryFilter) return false;
      const ctName = issue.assigned_profile?.full_name || issue.assigned_profile?.name || "";
      if (caretakerFilter !== "All" && ctName !== caretakerFilter) return false;
      return true;
    });
  }, [feedbackIssues, searchQuery, ratingFilter, categoryFilter, caretakerFilter]);

  // Summary metrics
  const metrics = useMemo(() => {
    if (!feedbackIssues.length) return { avg: 0, count: 0, satisfiedPct: 0 };
    const ratings = feedbackIssues.map((i) => i.feedback?.rating || 0);
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    const satisfied = feedbackIssues.filter((i) => i.feedback?.satisfaction === "satisfied").length;
    return {
      avg: avg.toFixed(1),
      count: feedbackIssues.length,
      satisfiedPct: Math.round((satisfied / feedbackIssues.length) * 100),
    };
  }, [feedbackIssues]);

  // Low-rated issues (rating <= 2)
  const lowRated = useMemo(
    () => feedbackIssues.filter((i) => i.feedback?.rating <= 2),
    [feedbackIssues]
  );

  // Caretaker performance
  const caretakerStats = useMemo(() => {
    const map = {};
    feedbackIssues.forEach((i) => {
      const name = i.assigned_profile?.full_name || i.assigned_profile?.name || "Unknown";
      if (!map[name]) map[name] = { total: 0, sum: 0, satisfied: 0 };
      map[name].total++;
      map[name].sum += i.feedback?.rating || 0;
      if (i.feedback?.satisfaction === "satisfied") map[name].satisfied++;
    });
    return Object.entries(map)
      .map(([name, s]) => ({ name, avg: (s.sum / s.total).toFixed(1), count: s.total, satisfiedPct: Math.round((s.satisfied / s.total) * 100) }))
      .sort((a, b) => b.avg - a.avg);
  }, [feedbackIssues]);

  // Filter options
  const categoryOptions = [
    { value: "All", label: "All Categories" },
    ...[...new Set(feedbackIssues.map((i) => i.category).filter(Boolean))].map((c) => ({ value: c, label: c })),
  ];
  const caretakerOptions = [
    { value: "All", label: "All Caretakers" },
    ...[...new Set(feedbackIssues.map((i) => i.assigned_profile?.full_name || i.assigned_profile?.name).filter(Boolean))].map((c) => ({ value: c, label: c })),
  ];
  const ratingOptions = [
    { value: "All", label: "All Ratings" },
    ...([5, 4, 3, 2, 1].map((r) => ({ value: String(r), label: `${r} Star${r > 1 ? "s" : ""}` }))),
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-['Poppins',sans-serif]">
      <AlertModal {...alertState} onClose={closeAlert} />
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Feedback Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Monitor student feedback on resolved issues</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Star size={24} className="text-amber-500 fill-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{metrics.avg}</p>
              <p className="text-xs text-gray-500">Average Rating</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <MessageSquare size={24} className="text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{metrics.count}</p>
              <p className="text-xs text-gray-500">Total Feedback</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <ThumbsUp size={24} className="text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{metrics.satisfiedPct}%</p>
              <p className="text-xs text-gray-500">Satisfaction Rate</p>
            </div>
          </div>
        </div>

        {/* Caretaker Performance */}
        {caretakerStats.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><BarChart3 size={16} /> Caretaker Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {caretakerStats.map((ct) => (
                <div key={ct.name} className="border border-gray-100 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {ct.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{ct.name}</p>
                    <p className="text-xs text-gray-500">{ct.count} reviews · {ct.satisfiedPct}% satisfied</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-800">{ct.avg}</p>
                    <StarRating rating={Math.round(ct.avg)} size={10} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Low-rated alert */}
        {lowRated.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <TrendingDown size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">{lowRated.length} low-rated issue{lowRated.length > 1 ? "s" : ""} (rating 1–2)</p>
              <p className="text-xs text-red-600 mt-0.5">
                {lowRated.slice(0, 3).map((i) => `"${i.title}"`).join(", ")}
                {lowRated.length > 3 && ` and ${lowRated.length - 3} more`}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by issue, student, or caretaker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <SelectBetter options={ratingOptions} value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} placeholder="Rating" icon={Star} />
            <SelectBetter options={categoryOptions} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} placeholder="Category" icon={Filter} />
            <SelectBetter options={caretakerOptions} value={caretakerFilter} onChange={(e) => setCaretakerFilter(e.target.value)} placeholder="Caretaker" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-20 text-center text-gray-500">
              <div className="w-10 h-10 border-4 border-[#00E5FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              Loading feedback...
            </div>
          ) : filteredData.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="text-gray-300" size={32} />
              </div>
              <h3 className="text-gray-800 font-semibold">No feedback found</h3>
              <p className="text-gray-400 text-sm">Feedback from students on resolved issues will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Issue</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Caretaker</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Satisfaction</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Comment</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Proof</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.map((issue) => {
                    const fb = issue.feedback || {};
                    const reviewed = !!issue.feedbackReview;
                    return (
                      <tr key={issue.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-gray-800 text-sm line-clamp-1">{issue.title}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200 capitalize w-fit">
                              {issue.category}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{issue.profile?.name || "Unknown"}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {issue.assigned_profile?.full_name || issue.assigned_profile?.name || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <StarRating rating={fb.rating || 0} />
                            <span className="text-sm font-bold text-gray-700">{fb.rating}/5</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {fb.satisfaction === "satisfied" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                              <ThumbsUp size={12} /> Satisfied
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                              <ThumbsDown size={12} /> Not Satisfied
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-gray-600 line-clamp-2 max-w-[200px]">{fb.comment || "—"}</p>
                        </td>
                        <td className="px-6 py-4">
                          {issue.proofUrl ? (
                            <button
                              onClick={() => setSelectedMedia({ url: issue.proofUrl, type: issue.proofSubmission?.resourceType || "image" })}
                              className="flex items-center gap-1 text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full text-xs font-medium border border-blue-200 transition-colors"
                            >
                              <Eye size={12} /> View
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <BadgeBetter1 status={issue.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          {reviewed ? (
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                              issue.feedbackReview.outcome === "positive"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }`}>
                              {issue.feedbackReview.reviewedBy === "auto"
                                ? "Auto-closed"
                                : issue.feedbackReview.outcome === "positive"
                                  ? "Closed"
                                  : "Reopened"}
                            </span>
                          ) : issue.status === "resolved" ? (
                            <button
                              onClick={() => handleAdjudicate(issue, "negative")}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                              title="Reopen issue for rework"
                            >
                              <XCircle size={14} /> Reopen
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Media Preview Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setSelectedMedia(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full max-h-[80vh] relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-semibold text-gray-800">Proof of Work</h3>
                <button onClick={() => setSelectedMedia(null)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                  <X size={24} className="text-gray-500" />
                </button>
              </div>
              <div className="p-0 bg-black flex justify-center items-center h-[500px]">
                {selectedMedia.type === "video" ? (
                  <video src={selectedMedia.url} controls className="max-h-full max-w-full" />
                ) : (
                  <img src={selectedMedia.url} alt="Proof" className="max-h-full max-w-full object-contain" />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IssueFeedbackDashboard;
