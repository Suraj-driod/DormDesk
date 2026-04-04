import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Filter, CheckCircle, Clock, 
  Globe, Lock, AlertCircle, XCircle, RefreshCw, ShieldCheck
} from "lucide-react";

import { SelectBetter } from "../../UI/SelectBetter"; 
import { BadgeBetter1 } from "../../UI/BadgeBetter";
import { AlertModal } from "../../UI/Glow";
import { fetchAssignedIssues, updateIssueStatus } from "../../services/issues.service";
import { useAuth } from "../../auth/AuthContext";
import { useAlert } from "../../hooks/useAlert";

const STATUS_UPDATE_OPTIONS = [
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' }
];

const PriorityDot = ({ priority }) => {
  const colorMap = {
    emergency: 'bg-red-600',
    high: 'bg-red-500',
    medium: 'bg-orange-400',
    low: 'bg-green-500',
  };
  const color = colorMap[priority] || 'bg-gray-400';

  return (
    <div className="flex items-center gap-1.5" title={`Priority: ${priority}`}>
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs text-gray-500 capitalize">{priority}</span>
    </div>
  );
};

const Assignment = () => {
  const { user, profile } = useAuth();
  const caretakerId = profile?.managementDocId ?? profile?.id ?? user?.uid;
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { alertState, closeAlert, success: showSuccess, error: showError } = useAlert();

  // UI State
  const [activeTab, setActiveTab] = useState("public");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [hostelFilter, setHostelFilter] = useState("All");
  const [blockFilter, setBlockFilter] = useState("All");

  useEffect(() => {
    if (caretakerId) {
      loadAssignments();
    }
  }, [caretakerId]);

  const loadAssignments = async () => {
    if (!caretakerId) return;
    setLoading(true);
    try {
      const data = await fetchAssignedIssues(caretakerId, profile?.hostelId);
      setAssignments(data || []);
    } catch (error) {
      console.error("Error loading assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTabColor = (tab) => {
    if (activeTab !== tab) return "text-gray-500 hover:bg-gray-50";
    switch (tab) {
      case 'public': return "text-white bg-purple-600 shadow-purple-200 shadow-md";
      case 'private': return "text-white bg-[#850F45] shadow-[#850F45]/40 shadow-md";
      case 'completed': return "text-white bg-green-600 shadow-green-200 shadow-md";
      default: return "text-gray-500";
    }
  };

  const getTabIndicatorColor = (tab) => {
    switch (tab) {
      case 'public': return "bg-purple-600";
      case 'private': return "bg-[#850F45]";
      case 'completed': return "bg-green-600";
      default: return "";
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    if (newStatus === 'resolved' && !window.confirm("Mark this job as completed?")) return;
    
    try {
      await updateIssueStatus(id, newStatus, user?.uid);
      setAssignments(prev => prev.map(item => 
        item.id === id ? { ...item, status: newStatus } : item
      ));
    } catch (err) {
      console.error("Error updating status:", err);
      showError("Failed to update status");
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Enter reason for rejecting this assignment:");
    if (reason) {
      try {
        await updateIssueStatus(id, 'reported', user?.uid, `Rejected: ${reason}`);
        setAssignments(prev => prev.filter(item => item.id !== id));
        showSuccess("Assignment rejected and returned to queue.");
      } catch (err) {
        console.error("Error rejecting:", err);
        showError("Failed to reject assignment");
      }
    }
  };

  const filteredData = useMemo(() => {
    return assignments.filter(item => {
      // Tab Logic
      if (activeTab === "completed") {
        if (item.status !== "resolved" && item.status !== "closed") return false;
      } else {
        if (item.status === "resolved" || item.status === "closed") return false;
        const vis = (item.visibility || "public").toString().toLowerCase();
        if (vis !== activeTab) return false;
      }

      const query = (searchQuery || "").trim().toLowerCase();
      if (query) {
        const matchesSearch =
          item.title?.toLowerCase().includes(query) ||
          item.room_no?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query);
        // Note: reporter name is intentionally excluded from search
        if (!matchesSearch) return false;
      }

      // Filters
      if (categoryFilter !== "All" && item.category !== categoryFilter) return false;
      if (hostelFilter !== "All" && item.hostel !== hostelFilter) return false;
      if (blockFilter !== "All" && item.block !== blockFilter) return false;

      return true;
    });
  }, [assignments, activeTab, searchQuery, categoryFilter, hostelFilter, blockFilter]);

  // Options
  const categoryOptions = [
    { value: "All", label: "All Categories" },
    ...[...new Set(assignments.map(i => i.category).filter(Boolean))].map(c => ({ value: c, label: c }))
  ];
  const hostelOptions = [
    { value: "All", label: "All Hostels" },
    ...[...new Set(assignments.map(i => i.hostel).filter(Boolean))].map(h => ({ value: h, label: h }))
  ];
  const blockOptions = [
    { value: "All", label: "All Blocks" },
    ...[...new Set(assignments.map(i => i.block).filter(Boolean))].map(b => ({ value: b, label: `Block ${b}` }))
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-['Poppins',sans-serif]">
      <AlertModal {...alertState} onClose={closeAlert} />
      
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Assignments</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your active maintenance tasks.</p>
          </div>
          
          {/* Tabs */}
          <div className="bg-white p-1.5 rounded-xl border border-gray-200 flex shadow-sm overflow-x-auto">
            {['public', 'private', 'completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${getTabColor(tab)}`}
              >
                {activeTab === tab && (
                  <motion.div layoutId="caretakerTab" className={`absolute inset-0 rounded-lg ${getTabIndicatorColor(tab)}`} />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {tab === 'public' && <Globe size={16} />}
                  {tab === 'private' && <Lock size={16} />}
                  {tab === 'completed' && <CheckCircle size={16} />}
                  {tab}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by title, room..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm transition-all"
              />
            </div>
            <button onClick={loadAssignments} className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50">
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SelectBetter options={categoryOptions} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} placeholder="Category" icon={Filter} />
            <SelectBetter options={hostelOptions} value={hostelFilter} onChange={(e) => setHostelFilter(e.target.value)} placeholder="Hostel" />
            <SelectBetter options={blockOptions} value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)} placeholder="Block" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible min-h-[400px]">
          {loading ? (
            <div className="p-20 text-center text-gray-500">
              <div className="w-10 h-10 border-4 border-[#00E5FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              Loading assignments...
            </div>
          ) : filteredData.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="text-gray-300" size={32} />
              </div>
              <h3 className="text-gray-800 font-semibold">No assignments found</h3>
              <p className="text-gray-400 text-sm">You have no {activeTab} tasks pending.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Issue Details</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Location</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Reported By</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    {activeTab !== 'completed' && (
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Quick Update</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-gray-800 text-sm">{item.title}</span>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border capitalize">
                              {item.category}
                            </span>
                            <PriorityDot priority={item.priority} />
                          </div>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.description}</p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium text-gray-800">{item.hostel}</span>
                          <span className="text-gray-400 mx-1">|</span>
                          Block {item.block} - {item.room_no}
                        </div>
                      </td>

                      {/* Reporter identity — masked for caretaker privacy */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck size={14} className="text-gray-400" />
                          </div>
                          <div>
                            <span className="text-sm text-gray-500 italic">Anonymous Student</span>
                            <p className="text-[10px] text-gray-400">Identity protected</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <BadgeBetter1 status={item.status} />
                      </td>

                      {activeTab !== 'completed' && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button 
                              onClick={() => handleReject(item.id)}
                              className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors" 
                              title="Reject Assignment"
                            >
                              <XCircle size={18} />
                            </button>

                            <select
                              value={item.status}
                              onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white hover:border-blue-400 focus:outline-none"
                            >
                              {STATUS_UPDATE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Assignment;
