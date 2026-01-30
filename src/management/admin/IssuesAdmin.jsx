import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Search, Globe, Lock, MapPin, Download, Filter 
} from "lucide-react";

// --- Custom Components ---
import { SelectBetter } from "../../UI/SelectBetter"; 
import { BadgeBetter1 } from "../../UI/BadgeBetter"; 

// --- MOCK DATA ---
const MOCK_ISSUES_ADMIN = [
  {
    id: 1,
    title: "Water Cooler Leaking",
    description: "The water cooler near the stairs is leaking continuously.",
    category: "Plumbing",
    priority: "High",
    status: "Reported",
    visibility: "public",
    hostel: "Sahyadri",
    block: "A",
    room_no: "Corridor 2",
    created_at: "2026-01-28T10:30:00",
    profiles: { name: "Rahul V.", email: "rahul@example.com" }
  },
  {
    id: 2,
    title: "Fan Making Noise",
    description: "Ceiling fan making loud grinding noise.",
    category: "Electrical",
    priority: "Medium",
    status: "InProgress",
    visibility: "private",
    hostel: "Sahyadri",
    block: "B",
    room_no: "304",
    created_at: "2026-01-27T14:20:00",
    profiles: { name: "Amit K.", email: "amit@example.com" }
  },
  {
    id: 3,
    title: "Mess Food Cold",
    description: "Dinner served was cold and tasteless.",
    category: "Food",
    priority: "Medium",
    status: "Resolved",
    visibility: "public",
    hostel: "Aravali",
    block: "Mess",
    room_no: "Main Hall",
    created_at: "2026-01-26T09:00:00",
    profiles: { name: "Anjali S.", email: "anjali@example.com" }
  },
  {
    id: 4,
    title: "Lost ID Card",
    description: "I lost my ID card in the playground.",
    category: "Other",
    priority: "Low",
    status: "Assigned",
    visibility: "private",
    hostel: "Aravali",
    block: "A",
    room_no: "102",
    created_at: "2026-01-25T11:00:00",
    profiles: { name: "Sneha P.", email: "sneha@example.com" }
  },
  {
    id: 5,
    title: "Broken Window Pane",
    description: "Window glass broken due to cricket ball.",
    category: "Furniture",
    priority: "Low",
    status: "Reported",
    visibility: "public",
    hostel: "Sahyadri",
    block: "C",
    room_no: "Ground Floor",
    created_at: "2026-01-29T16:00:00",
    profiles: { name: "Vikram R.", email: "vikram@example.com" }
  },
  {
    id: 6,
    title: "Wi-Fi Not Working",
    description: "No internet connectivity in B-Block since morning.",
    category: "Internet",
    priority: "High",
    status: "Reported",
    visibility: "public",
    hostel: "Sahyadri",
    block: "B",
    room_no: "Lobby",
    created_at: "2026-01-30T08:00:00",
    profiles: { name: "Rohan D.", email: "rohan@example.com" }
  }
];

// --- Helper: Priority Dot ---
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

const IssuesAdmin = () => {
  const [issues] = useState(MOCK_ISSUES_ADMIN);
  const loading = false;
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState("public"); // 'public' | 'private'
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter States
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [hostelFilter, setHostelFilter] = useState("All");
  const [blockFilter, setBlockFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  // --- FILTER LOGIC ---
  const filteredData = useMemo(() => {
    return issues.filter(issue => {
      // 1. Tab
      const issueVisibility = (issue.visibility || 'public').toLowerCase();
      if (issueVisibility !== activeTab) return false;

      // 2. Search
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        issue.title?.toLowerCase().includes(query) ||
        issue.description?.toLowerCase().includes(query) ||
        issue.room_no?.toLowerCase().includes(query) ||
        issue.profiles?.name?.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // 3. Category
      if (categoryFilter !== "All" && issue.category !== categoryFilter) return false;

      // 4. Hostel
      if (hostelFilter !== "All" && issue.hostel !== hostelFilter) return false;

      // 5. Block
      if (blockFilter !== "All" && issue.block !== blockFilter) return false;

      // 6. Priority
      if (priorityFilter !== "All" && issue.priority !== priorityFilter) return false;

      return true;
    });
  }, [issues, activeTab, searchQuery, categoryFilter, hostelFilter, blockFilter, priorityFilter]);

  // --- OPTIONS GENERATION ---
  
  // 1. Categories
  const categoryOptions = [
    { value: "All", label: "All Categories" },
    ...[...new Set(issues.map(i => i.category).filter(Boolean))].map(c => ({ value: c, label: c }))
  ];

  // 2. Hostels
  const hostelOptions = [
    { value: "All", label: "All Hostels" },
    ...[...new Set(issues.map(i => i.hostel).filter(Boolean))].map(h => ({ value: h, label: h }))
  ];

  // 3. Blocks
  const blockOptions = [
    { value: "All", label: "All Blocks" },
    ...[...new Set(issues.map(i => i.block).filter(Boolean))].map(b => ({ value: b, label: `Block ${b}` }))
  ];

  // 4. Priorities
  const priorityOptions = [
    { value: "All", label: "All Priorities" },
    { value: "High", label: "High" },
    { value: "Medium", label: "Medium" },
    { value: "Low", label: "Low" },
  ];

  // --- EXPORT ---
  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Title,Category,Priority,Status,Hostel,Block,Room,Author,Date"].join(",") + "\n"
      + filteredData.map(e => `"${e.title}","${e.category}","${e.priority}","${e.status}","${e.hostel}","${e.block}","${e.room_no}","${e.profiles?.name || 'Unknown'}","${new Date(e.created_at).toLocaleDateString()}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `issues_${activeTab}_report.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-['Poppins',sans-serif]">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Issue Management</h1>
            <p className="text-gray-500 text-sm mt-1">Monitor and resolve student grievances.</p>
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

        {/* --- FILTER BAR --- */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col gap-4">
          
          {/* Top Row: Search & Export */}
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
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200 whitespace-nowrap"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>

          {/* Bottom Row: Filter Dropdowns */}
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
             <SelectBetter 
               options={priorityOptions}
               value={priorityFilter}
               onChange={(e) => setPriorityFilter(e.target.value)}
               placeholder="Priority"
             />
          </div>
        </div>

        {/* --- TABLE SECTION --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-20 text-center text-gray-500">Loading data...</div>
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
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.map((issue) => (
                    <tr 
                      key={issue.id} 
                      className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                      onClick={() => console.log("Open Detail Modal for:", issue.id)}
                    >
                      {/* Issue Info */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-gray-800 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {issue.title}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                              {issue.category}
                            </span>
                            <PriorityDot priority={issue.priority} />
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin size={14} className="text-gray-400" />
                          <span>{issue.hostel} <span className="text-gray-300">|</span> Block {issue.block} <span className="text-gray-300">|</span> {issue.room_no}</span>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-800">
                            {issue.profiles?.name || 'Unknown Student'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(issue.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      {/* Status (Using BadgeBetter1) */}
                      <td className="px-6 py-4">
                        <BadgeBetter1 status={issue.status} />
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <button className="text-gray-400 hover:text-blue-600 transition-colors px-2 py-1 text-sm font-medium">
                          View Details
                        </button>
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