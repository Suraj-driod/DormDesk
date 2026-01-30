import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Filter, CheckCircle, Clock, 
  Globe, Lock, AlertCircle, XCircle, ChevronDown, RefreshCw
} from "lucide-react";

// --- Custom Components ---
import { SelectBetter } from "../../UI/SelectBetter"; 
import { BadgeBetter1 } from "../../UI/BadgeBetter"; 

// --- MOCK DATA (Assigned to Caretaker) ---
const MOCK_ASSIGNMENTS = [
  {
    id: 201,
    title: "Water Cooler Leakage",
    category: "Plumbing",
    priority: "High",
    status: "Assigned",
    visibility: "public",
    hostel: "Sahyadri",
    block: "A",
    room_no: "Corridor 2",
    assigned_at: "2026-01-30T09:00:00",
    description: "Water is pooling near the cooler. Slip hazard."
  },
  {
    id: 202,
    title: "Fan Making Noise",
    category: "Electrical",
    priority: "Medium",
    status: "InProgress",
    visibility: "private",
    hostel: "Aravali",
    block: "B",
    room_no: "304",
    assigned_at: "2026-01-29T14:30:00",
    description: "Ceiling fan making loud grinding noise."
  },
  {
    id: 203,
    title: "Broken Window Pane",
    category: "Carpenter",
    priority: "Low",
    status: "Resolved",
    visibility: "public",
    hostel: "Sahyadri",
    block: "C",
    room_no: "Ground Floor",
    assigned_at: "2026-01-28T10:00:00",
    completed_at: "2026-01-29T16:00:00",
    description: "Window glass broken by cricket ball."
  }
];

// --- STATUS UPDATE OPTIONS ---
const STATUS_UPDATE_OPTIONS = [
  { value: 'Assigned', label: 'Assigned' },
  { value: 'InProgress', label: 'In Progress' },
  { value: 'Resolved', label: 'Resolved' }
];

// --- HELPER: PRIORITY DOT ---
const PriorityDot = ({ priority }) => {
  const color = 
    priority === 'High' ? 'bg-red-500' : 
    priority === 'Medium' ? 'bg-orange-400' : 
    'bg-green-500';

  return (
    <div className="flex items-center gap-1.5" title={`Priority: ${priority}`}>
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs text-gray-500 capitalize">{priority}</span>
    </div>
  );
};

const Assignment = () => {
  const [assignments, setAssignments] = useState(MOCK_ASSIGNMENTS);
  const [loading, setLoading] = useState(false);

  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState("public"); // 'public' | 'private' | 'completed'
  const [searchQuery, setSearchQuery] = useState("");
  
  // --- FILTERS ---
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [hostelFilter, setHostelFilter] = useState("All");
  const [blockFilter, setBlockFilter] = useState("All");

  // --- HELPER: TAB COLOR LOGIC ---
  // In src/management/caretaker/Assignment.jsx

// In src/management/caretaker/Assignment.jsx

const getTabColor = (tab) => {
  if (activeTab !== tab) return "text-gray-500 hover:bg-gray-50";
  switch (tab) {
    case 'public': return "text-white bg-purple-600 shadow-purple-200 shadow-md";
    
    // 👇 UPDATED TO REDDISH PLUM
    case 'private': return "text-white bg-[#850F45] shadow-[#850F45]/40 shadow-md"; 
    
    case 'completed': return "text-white bg-green-600 shadow-green-200 shadow-md";
    default: return "text-gray-500";
  }
};

  // In src/management/caretaker/Assignment.jsx

// In src/management/caretaker/Assignment.jsx

const getTabIndicatorColor = (tab) => {
  switch (tab) {
    case 'public': return "bg-purple-600";
    
    // 👇 UPDATED TO REDDISH PLUM
    case 'private': return "bg-[#850F45]"; 
    
    case 'completed': return "bg-green-600";
    default: return "";
  }
};
  // --- ACTIONS ---
  const handleStatusUpdate = (id, newStatus) => {
    if (newStatus === 'Resolved' && !window.confirm("Mark this job as completed?")) return;
    
    setAssignments(prev => prev.map(item => 
      item.id === id ? { ...item, status: newStatus } : item
    ));
  };

  const handleReject = (id) => {
    const reason = prompt("Enter reason for rejecting this assignment:");
    if (reason) {
      alert(`Assignment #${id} rejected. Reason: ${reason}`);
      setAssignments(prev => prev.filter(item => item.id !== id));
    }
  };

  // --- FILTER LOGIC ---
  const filteredData = useMemo(() => {
    return assignments.filter(item => {
      // 1. Tab Logic
      if (activeTab === "completed") {
        if (item.status !== "Resolved" && item.status !== "Closed") return false;
      } else {
        if (item.status === "Resolved" || item.status === "Closed") return false;
        if (item.visibility !== activeTab) return false;
      }

      // 2. Search
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        item.title.toLowerCase().includes(query) ||
        item.room_no.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // 3. Dropdowns
      if (categoryFilter !== "All" && item.category !== categoryFilter) return false;
      if (hostelFilter !== "All" && item.hostel !== hostelFilter) return false;
      if (blockFilter !== "All" && item.block !== blockFilter) return false;

      return true;
    });
  }, [assignments, activeTab, searchQuery, categoryFilter, hostelFilter, blockFilter]);

  // --- OPTIONS ---
  const categoryOptions = [{ value: "All", label: "All Categories" }, ...[...new Set(assignments.map(i => i.category))].map(c => ({ value: c, label: c }))];
  const hostelOptions = [{ value: "All", label: "All Hostels" }, ...[...new Set(assignments.map(i => i.hostel))].map(h => ({ value: h, label: h }))];
  const blockOptions = [{ value: "All", label: "All Blocks" }, ...[...new Set(assignments.map(i => i.block))].map(b => ({ value: b, label: `Block ${b}` }))];

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-['Poppins',sans-serif]">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
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
                className={`
                  relative px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-300 flex items-center gap-2 whitespace-nowrap
                  ${getTabColor(tab)}
                `}
              >
                {activeTab === tab && (
                  <motion.div 
                    layoutId="caretakerTab" 
                    className={`absolute inset-0 rounded-lg ${getTabIndicatorColor(tab)}`} 
                  />
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

        {/* --- FILTER BAR --- */}
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
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
             <SelectBetter options={categoryOptions} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} placeholder="Category" icon={Filter} />
             <SelectBetter options={hostelOptions} value={hostelFilter} onChange={(e) => setHostelFilter(e.target.value)} placeholder="Hostel" />
             <SelectBetter options={blockOptions} value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)} placeholder="Block" />
          </div>
        </div>

        {/* --- TABLE SECTION --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible min-h-[400px]">
          {filteredData.length === 0 ? (
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
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Issue Details</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    {activeTab !== 'completed' && (
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Quick Update</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                      {/* Issue */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-gray-800 text-sm">{item.title}</span>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                              {item.category}
                            </span>
                            <PriorityDot priority={item.priority} />
                          </div>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.description}</p>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium text-gray-800">{item.hostel}</span>
                          <span className="text-gray-400 mx-1">|</span>
                          Block {item.block} - {item.room_no}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <BadgeBetter1 status={item.status} />
                      </td>

                      {/* Quick Actions (Using SelectBetter) */}
                      {activeTab !== 'completed' && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-2">
                            
                            {/* Reject Button */}
                            <button 
                              onClick={() => handleReject(item.id)}
                              className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors group-hover:opacity-100 opacity-60" 
                              title="Reject Assignment"
                            >
                              <XCircle size={18} />
                            </button>

                            {/* Status SelectBetter */}
                            <div className="w-36 text-left relative z-10">
                              <SelectBetter
                                options={STATUS_UPDATE_OPTIONS}
                                value={item.status}
                                onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                                placeholder="Status"
                              />
                            </div>

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