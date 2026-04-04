import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Filter, CheckCircle, Clock, 
  User, Briefcase, ChevronRight, UserPlus, RefreshCw, X
} from "lucide-react";

import { SelectBetter } from "../../UI/SelectBetter"; 
import { BadgeBetter1 } from "../../UI/BadgeBetter";
import { AlertModal } from "../../UI/Glow";
import { fetchPendingIssues, fetchIssues, assignIssue } from "../../services/issues.service";
import { fetchCaretakers } from "../../services/profile.service";
import { useAuth } from "../../auth/AuthContext";
import { useAlert } from "../../hooks/useAlert";

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

const AdminCases = () => {
  const { user, profile } = useAuth();
  const [cases, setCases] = useState([]);
  const [caretakers, setCaretakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { alertState, closeAlert, error: showError } = useAlert();

  // UI State
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [hostelFilter, setHostelFilter] = useState("All");
  const [blockFilter, setBlockFilter] = useState("All");
  const [caretakerFilter, setCaretakerFilter] = useState("All");

  // Assignment Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedCaretaker, setSelectedCaretaker] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [issuesData, caretakersData] = await Promise.all([
        fetchIssues({}, profile?.hostelId),
        fetchCaretakers(),
      ]);
      setCases(issuesData || []);
      setCaretakers(caretakersData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = useMemo(() => {
    return cases.filter(item => {
      if (activeTab === "pending") {
        if (item.status !== "reported") return false;
      } else {
        if (item.status === "reported") return false;
      }

      // Search
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        item.title?.toLowerCase().includes(query) ||
        item.room_no?.toLowerCase().includes(query) ||
        item.assigned_profile?.name?.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // Filters
      if (categoryFilter !== "All" && item.category !== categoryFilter) return false;
      if (hostelFilter !== "All" && item.hostel !== hostelFilter) return false;
      if (blockFilter !== "All" && item.block !== blockFilter) return false;
      if (activeTab === 'assigned' && caretakerFilter !== "All" && item.assigned_profile?.name !== caretakerFilter) return false;

      return true;
    });
  }, [cases, activeTab, searchQuery, categoryFilter, hostelFilter, blockFilter, caretakerFilter]);

  const handleOpenAssignModal = (caseItem) => {
    setSelectedCase(caseItem);
    setSelectedCaretaker("");
    setAssignModalOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedCaretaker || !selectedCase) return;
    
    try {
      await assignIssue(selectedCase.id, selectedCaretaker, user?.id);
      setCases(prev => prev.map(c => 
        c.id === selectedCase.id 
          ? { ...c, assigned_to: selectedCaretaker, status: 'assigned', assigned_profile: caretakers.find(ct => ct.id === selectedCaretaker) }
          : c
      ));
      setAssignModalOpen(false);
      setSelectedCase(null);
    } catch (err) {
      console.error("Error assigning:", err);
      showError("Failed to assign caretaker");
    }
  };

  // Options
  const categoryOptions = [
    { value: "All", label: "All Categories" },
    ...[...new Set(cases.map(i => i.category).filter(Boolean))].map(c => ({ value: c, label: c }))
  ];
  const hostelOptions = [
    { value: "All", label: "All Hostels" },
    ...[...new Set(cases.map(i => i.hostel).filter(Boolean))].map(h => ({ value: h, label: h }))
  ];
  const blockOptions = [
    { value: "All", label: "All Blocks" },
    ...[...new Set(cases.map(i => i.block).filter(Boolean))].map(b => ({ value: b, label: `Block ${b}` }))
  ];
  const caretakerOptions = [
    { value: "All", label: "All Caretakers" },
    ...caretakers.map(c => ({ value: c.full_name, label: c.full_name }))
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-['Poppins',sans-serif]">
      <AlertModal {...alertState} onClose={closeAlert} />
      
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Case Assignment</h1>
            <p className="text-gray-500 text-sm mt-1">Assign pending issues to caretakers and track workload.</p>
          </div>
          
          {/* Tabs */}
          <div className="bg-white p-1.5 rounded-xl border border-gray-200 flex shadow-sm">
            <button
              onClick={() => setActiveTab("pending")}
              className={`relative px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2
                ${activeTab === "pending" ? "text-white" : "text-gray-500 hover:bg-gray-50"}`}
            >
              {activeTab === "pending" && (
                <motion.div layoutId="caseTab" className="absolute inset-0 bg-orange-500 rounded-lg shadow-md" />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Clock size={16} /> Pending
              </span>
            </button>

            <button
              onClick={() => setActiveTab("assigned")}
              className={`relative px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2
                ${activeTab === "assigned" ? "text-white" : "text-gray-500 hover:bg-gray-50"}`}
            >
              {activeTab === "assigned" && (
                <motion.div layoutId="caseTab" className="absolute inset-0 bg-blue-600 rounded-lg shadow-md" />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Briefcase size={16} /> Assigned
              </span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder={activeTab === 'pending' ? "Search issues..." : "Search issues or caretaker..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm transition-all"
              />
            </div>
            <button onClick={loadData} className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50">
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SelectBetter options={categoryOptions} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} placeholder="Category" icon={Filter} />
            <SelectBetter options={hostelOptions} value={hostelFilter} onChange={(e) => setHostelFilter(e.target.value)} placeholder="Hostel" />
            <SelectBetter options={blockOptions} value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)} placeholder="Block" />
            {activeTab === 'assigned' && (
              <SelectBetter options={caretakerOptions} value={caretakerFilter} onChange={(e) => setCaretakerFilter(e.target.value)} placeholder="Caretaker" icon={User} />
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-20 text-center text-gray-500">
              <div className="w-10 h-10 border-4 border-[#00E5FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              Loading cases...
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${activeTab === 'pending' ? 'bg-orange-50' : 'bg-blue-50'}`}>
                <CheckCircle className={activeTab === 'pending' ? 'text-orange-300' : 'text-blue-300'} size={32} />
              </div>
              <h3 className="text-gray-800 font-semibold">No {activeTab} cases found</h3>
              <p className="text-gray-400 text-sm">Great job! Everything seems in order.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Issue</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Location</th>
                    {activeTab === 'assigned' && (
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Assigned To</th>
                    )}
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCases.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-gray-800 text-sm">{item.title}</span>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border capitalize">
                              {item.category}
                            </span>
                            <PriorityDot priority={item.priority} />
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium text-gray-800">{item.hostel}</span>
                          <span className="text-gray-400 mx-1">|</span>
                          Block {item.block} - {item.room_no}
                        </div>
                      </td>

                      {activeTab === 'assigned' && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                              {item.assigned_profile?.full_name?.charAt(0) || item.assigned_profile?.name?.charAt(0) || '?'}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-800">{item.assigned_profile?.full_name || item.assigned_profile?.name}</span>
                              <span className="text-[10px] text-gray-400">Caretaker</span>
                            </div>
                          </div>
                        </td>
                      )}

                      <td className="px-6 py-4">
                        <BadgeBetter1 status={item.status} />
                      </td>

                      <td className="px-6 py-4 text-right">
                        {activeTab === 'pending' ? (
                          <button 
                            onClick={() => handleOpenAssignModal(item)}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2 ml-auto"
                          >
                            <UserPlus size={16} /> Assign
                          </button>
                        ) : (
                          <button className="text-gray-400 hover:text-blue-600 font-medium text-sm flex items-center gap-1 ml-auto">
                            Reassign <ChevronRight size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      <AnimatePresence>
        {assignModalOpen && selectedCase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setAssignModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Assign Caretaker</h2>
                <button onClick={() => setAssignModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Issue:</p>
                <p className="font-semibold text-gray-800">{selectedCase.title}</p>
                <p className="text-sm text-gray-500 mt-1">{selectedCase.hostel} | Block {selectedCase.block}</p>
              </div>

              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 block mb-2">Select Caretaker</label>
                <select
                  value={selectedCaretaker}
                  onChange={(e) => setSelectedCaretaker(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                >
                  <option value="">Choose a caretaker...</option>
                  {caretakers.map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.full_name} - {ct.hostel_block || 'All Blocks'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setAssignModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={!selectedCaretaker}
                  className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCases;
