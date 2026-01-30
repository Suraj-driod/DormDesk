import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Filter, CheckCircle, XCircle, 
  User, Eye, MapPin, Calendar, FileCheck
} from "lucide-react";

// --- Custom Components ---
import { SelectBetter } from "../../UI/SelectBetter"; 
import { BadgeBetter1 } from "../../UI/BadgeBetter"; 

// --- MOCK DATA ---
const MOCK_RESPONSES = [
  {
    id: 101,
    title: "Leakage Fixed in Corridor",
    category: "Plumbing",
    hostel: "Sahyadri",
    block: "A",
    room_no: "Corridor 2",
    caretaker_name: "Ramesh Kumar",
    status: "Pending Verification",
    submitted_at: "2026-01-30T14:00:00",
    proof_url: "https://images.unsplash.com/photo-1584622050111-993a426fbf0a?w=400&fit=crop", 
    proof_type: "image"
  },
  {
    id: 102,
    title: "Switchboard Replaced",
    category: "Electrical",
    hostel: "Aravali",
    block: "B",
    room_no: "102",
    caretaker_name: "Suresh Singh",
    status: "Pending Verification",
    submitted_at: "2026-01-29T16:30:00",
    proof_url: null, 
    proof_type: null
  },
  {
    id: 103,
    title: "Window Latch Repaired",
    category: "Carpenter",
    hostel: "Sahyadri",
    block: "C",
    room_no: "305",
    caretaker_name: "Ramesh Kumar",
    status: "Verified",
    submitted_at: "2026-01-28T12:00:00",
    proof_url: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&fit=crop",
    proof_type: "image"
  }
];

const Responses = () => {
  const [responses, setResponses] = useState(MOCK_RESPONSES);
  
  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMedia, setSelectedMedia] = useState(null);

  // --- FILTERS ---
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [hostelFilter, setHostelFilter] = useState("All");
  const [blockFilter, setBlockFilter] = useState("All");
  const [caretakerFilter, setCaretakerFilter] = useState("All");

  // --- ACTIONS ---
  const handleVerify = (id) => {
    if(!window.confirm("Mark this issue as Verified and Closed?")) return;
    setResponses(prev => prev.map(r => r.id === id ? { ...r, status: 'Verified' } : r));
    alert("Issue Verified successfully!");
  };

  const handleReject = (id) => {
    const reason = prompt("Enter reason for rejection:");
    if (reason) {
      alert(`Response rejected. Reason: ${reason}`);
    }
  };

  // --- FILTER LOGIC ---
  const filteredData = useMemo(() => {
    return responses.filter(item => {
      // 1. Tab Logic
      if (activeTab === "pending") {
        if (item.status !== "Pending Verification") return false;
      } else {
        if (item.status !== "Verified") return false;
      }

      // 2. Search
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        item.title.toLowerCase().includes(query) ||
        item.room_no.toLowerCase().includes(query) ||
        item.caretaker_name.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // 3. Dropdowns
      if (categoryFilter !== "All" && item.category !== categoryFilter) return false;
      if (hostelFilter !== "All" && item.hostel !== hostelFilter) return false;
      if (blockFilter !== "All" && item.block !== blockFilter) return false;
      if (caretakerFilter !== "All" && item.caretaker_name !== caretakerFilter) return false;

      return true;
    });
  }, [responses, activeTab, searchQuery, categoryFilter, hostelFilter, blockFilter, caretakerFilter]);

  // --- OPTIONS ---
  const categoryOptions = [{ value: "All", label: "All Categories" }, ...[...new Set(responses.map(i => i.category))].map(c => ({ value: c, label: c }))];
  const hostelOptions = [{ value: "All", label: "All Hostels" }, ...[...new Set(responses.map(i => i.hostel))].map(h => ({ value: h, label: h }))];
  const blockOptions = [{ value: "All", label: "All Blocks" }, ...[...new Set(responses.map(i => i.block))].map(b => ({ value: b, label: `Block ${b}` }))];
  const caretakerOptions = [{ value: "All", label: "All Caretakers" }, ...[...new Set(responses.map(i => i.caretaker_name))].map(c => ({ value: c, label: c }))];

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-['Poppins',sans-serif]">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Caretaker Responses</h1>
            <p className="text-gray-500 text-sm mt-1">Verify fixes submitted by caretakers.</p>
          </div>
          
          {/* Tabs */}
          <div className="bg-white p-1.5 rounded-xl border border-gray-200 flex shadow-sm">
            
            {/* 1. Pending Verification Tab (Rose Theme) */}
            <button
              onClick={() => setActiveTab("pending")}
              className={`
                relative px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2
                ${activeTab === "pending" ? "text-white" : "text-gray-500 hover:bg-gray-50"}
              `}
            >
              {activeTab === "pending" && (
                <motion.div 
                  layoutId="responseTab" 
                  className="absolute inset-0 bg-rose-500 rounded-lg shadow-md" // Rose
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <FileCheck size={16} /> Pending Verification
              </span>
            </button>

            {/* 2. Verified History Tab (Teal Theme) */}
            <button
              onClick={() => setActiveTab("verified")}
              className={`
                relative px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2
                ${activeTab === "verified" ? "text-white" : "text-gray-500 hover:bg-gray-50"}
              `}
            >
              {activeTab === "verified" && (
                <motion.div 
                  layoutId="responseTab" 
                  className="absolute inset-0 bg-teal-600 rounded-lg shadow-md" // Teal
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <CheckCircle size={16} /> Verified History
              </span>
            </button>
          </div>
        </div>

        {/* --- FILTER BAR --- */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search issues, caretaker..." 
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
             <SelectBetter options={caretakerOptions} value={caretakerFilter} onChange={(e) => setCaretakerFilter(e.target.value)} placeholder="Caretaker" icon={User} />
          </div>
        </div>

        {/* --- TABLE SECTION --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredData.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${activeTab === 'pending' ? 'bg-rose-50' : 'bg-teal-50'}`}>
                <CheckCircle className={activeTab === 'pending' ? 'text-rose-300' : 'text-teal-300'} size={32} />
              </div>
              <h3 className="text-gray-800 font-semibold">No responses found</h3>
              <p className="text-gray-400 text-sm">No items match your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Issue Details</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed By</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Proof</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Issue */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-gray-800 text-sm">{item.title}</span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar size={12} /> {new Date(item.submitted_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin size={14} className="text-gray-400" />
                          <span>{item.hostel}, Block {item.block}, {item.room_no}</span>
                        </div>
                      </td>

                      {/* Caretaker */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                            {item.caretaker_name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{item.caretaker_name}</span>
                        </div>
                      </td>

                      {/* Proof */}
                      <td className="px-6 py-4">
                        {item.proof_url ? (
                          <button 
                            onClick={() => setSelectedMedia({ url: item.proof_url, type: item.proof_type })}
                            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                          >
                            <Eye size={14} /> View Proof
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No proof attached</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        {activeTab === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleReject(item.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" 
                              title="Reject"
                            >
                              <XCircle size={18} />
                            </button>
                            <button 
                              onClick={() => handleVerify(item.id)}
                              className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2"
                            >
                              <CheckCircle size={16} /> Verify
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                            Verified
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* --- MEDIA MODAL --- */}
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
                    <XCircle size={24} className="text-gray-500" />
                  </button>
                </div>
                <div className="p-0 bg-black flex justify-center items-center h-[500px]">
                  {selectedMedia.type === 'video' ? (
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
    </div>
  );
};

export default Responses;