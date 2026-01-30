import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Search, Filter, CheckCircle, Clock, 
  User, Briefcase, ChevronRight, UserPlus 
} from "lucide-react";

// --- Custom Components ---
import { SelectBetter } from "../../UI/SelectBetter"; 
import { BadgeBetter1 } from "../../UI/BadgeBetter"; 

// --- MOCK DATA ---
const MOCK_CASES = [
  {
    id: 1,
    title: "Water Leakage in Corridor",
    category: "Plumbing",
    priority: "High",
    status: "Reported",
    hostel: "Sahyadri",
    block: "A",
    room_no: "Corridor 2",
    assigned_to: null, // Pending
    caretaker_name: null,
    created_at: "2026-01-30T09:00:00",
  },
  {
    id: 2,
    title: "Sparking Switchboard",
    category: "Electrical",
    priority: "High",
    status: "Assigned",
    hostel: "Aravali",
    block: "B",
    room_no: "102",
    assigned_to: "ct_1",
    caretaker_name: "Ramesh Kumar",
    created_at: "2026-01-29T14:30:00",
  },
  {
    id: 3,
    title: "Broken Window Latch",
    category: "Carpenter",
    priority: "Low",
    status: "Reported",
    hostel: "Sahyadri",
    block: "C",
    room_no: "305",
    assigned_to: null, // Pending
    caretaker_name: null,
    created_at: "2026-01-28T11:00:00",
  },
  {
    id: 4,
    title: "Mess Fan Not Working",
    category: "Electrical",
    priority: "Medium",
    status: "InProgress",
    hostel: "Aravali",
    block: "Mess",
    room_no: "Main Hall",
    assigned_to: "ct_2",
    caretaker_name: "Suresh Singh",
    created_at: "2026-01-27T10:00:00",
  },
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

const AdminCases = () => {
  const [cases, setCases] = useState(MOCK_CASES);
  const [loading, setLoading] = useState(false);

  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState("pending"); // 'pending' | 'assigned'
  const [searchQuery, setSearchQuery] = useState("");

  // --- FILTER STATES ---
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [hostelFilter, setHostelFilter] = useState("All");
  const [blockFilter, setBlockFilter] = useState("All"); // Added Block Filter
  const [caretakerFilter, setCaretakerFilter] = useState("All");

  // --- FILTER LOGIC ---
  const filteredCases = useMemo(() => {
    return cases.filter(item => {
      // 1. Tab Logic
      if (activeTab === "pending") {
        if (item.assigned_to !== null) return false;
      } else {
        if (item.assigned_to === null) return false;
      }

      // 2. Search
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        item.title.toLowerCase().includes(query) ||
        item.room_no.toLowerCase().includes(query) ||
        (item.caretaker_name && item.caretaker_name.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // 3. Dropdown Filters
      if (categoryFilter !== "All" && item.category !== categoryFilter) return false;
      if (hostelFilter !== "All" && item.hostel !== hostelFilter) return false;
      if (blockFilter !== "All" && item.block !== blockFilter) return false; // Block Logic
      if (caretakerFilter !== "All" && item.caretaker_name !== caretakerFilter) return false;

      return true;
    });
  }, [cases, activeTab, searchQuery, categoryFilter, hostelFilter, blockFilter, caretakerFilter]);

  // --- ACTIONS ---
  const handleAssign = (id) => {
    console.log("Open Assign Modal for ID:", id);
    alert(`Open modal to assign Caretaker for Case #${id}`);
  };

  // --- OPTIONS GENERATION ---
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
    ...[...new Set(cases.map(i => i.caretaker_name).filter(Boolean))].map(c => ({ value: c, label: c }))
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-['Poppins',sans-serif]">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Case Assignment</h1>
            <p className="text-gray-500 text-sm mt-1">Assign pending issues to caretakers and track workload.</p>
          </div>
          
          {/* Custom Tabs */}
          <div className="bg-white p-1.5 rounded-xl border border-gray-200 flex shadow-sm">
            <button
              onClick={() => setActiveTab("pending")}
              className={`
                relative px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2
                ${activeTab === "pending" ? "text-white" : "text-gray-500 hover:bg-gray-50"}
              `}
            >
              {activeTab === "pending" && (
                <motion.div
                  layoutId="caseTab"
                  className="absolute inset-0 bg-orange-500 rounded-lg shadow-md"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Clock size={16} /> Pending Assignment
              </span>
            </button>

            <button
              onClick={() => setActiveTab("assigned")}
              className={`
                relative px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2
                ${activeTab === "assigned" ? "text-white" : "text-gray-500 hover:bg-gray-50"}
              `}
            >
              {activeTab === "assigned" && (
                <motion.div
                  layoutId="caseTab"
                  className="absolute inset-0 bg-blue-600 rounded-lg shadow-md"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Briefcase size={16} /> Assigned Cases
              </span>
            </button>
          </div>
        </div>

        {/* --- FILTER BAR --- */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder={activeTab === 'pending' ? "Search issues..." : "Search issues or caretaker name..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
             <SelectBetter 
               options={categoryOptions}
               value={categoryFilter}
               onChange={(e) => setCategoryFilter(e.target.value)}
               placeholder="Category"
               icon={Filter}
             />
             <SelectBetter 
               options={hostelOptions}
               value={hostelFilter}
               onChange={(e) => setHostelFilter(e.target.value)}
               placeholder="Hostel"
             />
             <SelectBetter 
               options={blockOptions}
               value={blockFilter}
               onChange={(e) => setBlockFilter(e.target.value)}
               placeholder="Block"
             />
             
             {/* Only show Caretaker filter on Assigned Tab */}
             {activeTab === 'assigned' && (
               <div className="col-span-2 md:col-span-1">
                 <SelectBetter 
                   options={caretakerOptions}
                   value={caretakerFilter}
                   onChange={(e) => setCaretakerFilter(e.target.value)}
                   placeholder="Caretaker"
                   icon={User}
                 />
               </div>
             )}
          </div>
        </div>

        {/* --- TABLE SECTION --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-20 text-center text-gray-500">Loading cases...</div>
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
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Issue</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                    {activeTab === 'assigned' && (
                       <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned To</th>
                    )}
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCases.map((item) => (
                    <tr 
                      key={item.id} 
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      {/* Issue Info */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-gray-800 text-sm">{item.title}</span>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                              {item.category}
                            </span>
                            <PriorityDot priority={item.priority} />
                          </div>
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

                      {/* Caretaker (Assigned Tab Only) */}
                      {activeTab === 'assigned' && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                              {item.caretaker_name?.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-800">{item.caretaker_name}</span>
                              <span className="text-[10px] text-gray-400">Caretaker</span>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Status */}
                      <td className="px-6 py-4">
                        <BadgeBetter1 status={item.status} />
                      </td>

                      {/* Action Button */}
                      <td className="px-6 py-4 text-right">
                        {activeTab === 'pending' ? (
                          <button 
                            onClick={() => handleAssign(item.id)}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm shadow-orange-200 transition-all flex items-center gap-2 ml-auto"
                          >
                            <UserPlus size={16} /> Assign
                          </button>
                        ) : (
                          <button 
                            className="text-gray-400 hover:text-blue-600 font-medium text-sm flex items-center gap-1 ml-auto transition-colors"
                          >
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
    </div>
  );
};

export default AdminCases;