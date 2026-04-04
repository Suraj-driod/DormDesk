import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Search, Globe, Lock, MapPin, Download, Filter, RefreshCw 
} from "lucide-react";

import { SelectBetter } from "../../UI/SelectBetter"; 
import { BadgeBetter1 } from "../../UI/BadgeBetter";
import { AlertModal } from "../../UI/Glow";
import Heatmap from "../../components/Heatmap/Heatmap";
import { fetchIssues, updateIssueStatus, updateIssuePriority } from "../../services/issues.service";
import { useAuth } from "../../auth/AuthContext";
import { useAlert } from "../../hooks/useAlert";

// Priority Dot helper
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

const IssuesAdmin = () => {
  const { user, profile } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { alertState, closeAlert, error: showError } = useAlert();
  
  // UI State
  const [activeTab, setActiveTab] = useState("public");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [hostelFilter, setHostelFilter] = useState("All");
  const [blockFilter, setBlockFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  // Fetch data on mount
  useEffect(() => {
    loadIssues();
  }, []);

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

  // Filter logic
  const filteredData = useMemo(() => {
    return issues.filter(issue => {
      // Tab filter
      const issueVisibility = (issue.visibility || 'public').toLowerCase();
      if (issueVisibility !== activeTab) return false;

      // Search
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        issue.title?.toLowerCase().includes(query) ||
        issue.description?.toLowerCase().includes(query) ||
        issue.room_no?.toLowerCase().includes(query) ||
        issue.profile?.name?.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // Category
      if (categoryFilter !== "All" && issue.category !== categoryFilter) return false;
      // Hostel
      if (hostelFilter !== "All" && issue.hostel !== hostelFilter) return false;
      // Block
      if (blockFilter !== "All" && issue.block !== blockFilter) return false;
      // Priority
      if (priorityFilter !== "All" && issue.priority !== priorityFilter) return false;

      return true;
    });
  }, [issues, activeTab, searchQuery, categoryFilter, hostelFilter, blockFilter, priorityFilter]);

  // Options
  const categoryOptions = [
    { value: "All", label: "All Categories" },
    ...[...new Set(issues.map(i => i.category).filter(Boolean))].map(c => ({ value: c, label: c }))
  ];
  const hostelOptions = [
    { value: "All", label: "All Hostels" },
    ...[...new Set(issues.map(i => i.hostel).filter(Boolean))].map(h => ({ value: h, label: h }))
  ];
  const blockOptions = [
    { value: "All", label: "All Blocks" },
    ...[...new Set(issues.map(i => i.block).filter(Boolean))].map(b => ({ value: b, label: `Block ${b}` }))
  ];
  const priorityOptions = [
    { value: "All", label: "All Priorities" },
    { value: "emergency", label: "Emergency" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

  // Status update handler
  const handleStatusChange = async (issueId, newStatus) => {
    try {
      await updateIssueStatus(issueId, newStatus, user?.uid ?? profile?.id ?? profile?.managementDocId);
      setIssues(prev => prev.map(issue => 
        issue.id === issueId ? { ...issue, status: newStatus } : issue
      ));
    } catch (err) {
      console.error("Error updating status:", err);
      showError("Failed to update status");
    }
  };

  // CSV Export
  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Title,Category,Priority,Status,Hostel,Block,Room,Author,Date,Reposts"].join(",") + "\n"
      + filteredData.map(e => 
        `"${e.title}","${e.category}","${e.priority}","${e.status}","${e.hostel}","${e.block}","${e.room_no}","${e.profile?.name || 'Unknown'}","${new Date(e.created_at).toLocaleDateString()}","${e.repost_count || 0}"`
      ).join("\n");
    
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `issues_${activeTab}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-['Poppins',sans-serif]">
      <AlertModal {...alertState} onClose={closeAlert} />
      
      <div className="max-w-7xl mx-auto">
        
        {/* Heatmap Section */}
        <div className="mb-6">
          <Heatmap />
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Issue Management</h1>
            <p className="text-gray-500 text-sm mt-1">
              Monitor and resolve student grievances • {filteredData.length} issues
            </p>
          </div>
          
          {/* Tabs */}
          <div className="bg-white p-1.5 rounded-xl border border-gray-200 flex shadow-sm">
            {['public', 'private'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  relative px-6 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-300
                  ${activeTab === tab ? "text-white" : "text-gray-500 hover:bg-gray-50"}
                `}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="adminTab"
                    className="absolute inset-0 bg-gray-900 rounded-lg shadow-md"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {tab === 'public' ? <Globe size={16} /> : <Lock size={16} />}
                  {tab} Issues
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
                placeholder="Search by title, room, or student name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
              />
            </div>
            
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            </button>
            
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors shadow-lg whitespace-nowrap"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SelectBetter options={categoryOptions} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} placeholder="Category" icon={Filter} />
            <SelectBetter options={hostelOptions} value={hostelFilter} onChange={(e) => setHostelFilter(e.target.value)} placeholder="Hostel" />
            <SelectBetter options={blockOptions} value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)} placeholder="Block" />
            <SelectBetter options={priorityOptions} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} placeholder="Priority" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-20 text-center text-gray-500">
              <div className="w-10 h-10 border-4 border-[#00E5FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              Loading issues...
            </div>
          ) : filteredData.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Search className="text-gray-300" size={32} />
              </div>
              <h3 className="text-gray-800 font-semibold">No issues found</h3>
              <p className="text-gray-400 text-sm">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Issue Details</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reported By</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.map((issue) => (
                    <tr 
                      key={issue.id} 
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-gray-800 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {issue.title}
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200 capitalize">
                              {issue.category}
                            </span>
                            <PriorityDot priority={issue.priority} />
                            {issue.repost_count > 0 && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                {issue.repost_count} reposts
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin size={14} className="text-gray-400" />
                          <span>{issue.hostel} | Block {issue.block} | {issue.room_no}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-800">
                            {issue.profile?.name || 'Unknown'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(issue.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <BadgeBetter1 status={issue.status} />
                      </td>

                      <td className="px-6 py-4 text-right">
                        <select
                          value={issue.status}
                          onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="reported">Reported</option>
                          <option value="assigned">Assigned</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
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

export default IssuesAdmin;
