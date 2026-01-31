import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, CheckCircle, MapPin, Calendar, 
  ArrowRightLeft, Box, User, AlertCircle, RefreshCw
} from 'lucide-react';
import { BadgeBetter1 } from '../../UI/BadgeBetter';
import { AlertModal } from '../../UI/Glow';
import { fetchLostItems, markItemClaimed, updateLostItemStatus } from '../../services/lostItems.service';
import { useAuth } from '../../auth/AuthContext';
import { useAlert } from '../../hooks/useAlert';

const TABS = [
  { id: 'lost', label: 'Lost Items', icon: AlertCircle },
  { id: 'found', label: 'Found Items', icon: Box },
  { id: 'claimed', label: 'Claimed History', icon: CheckCircle },
];

const AdminLost = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { alertState, closeAlert, error: showError } = useAlert();
  
  const [activeTab, setActiveTab] = useState('lost');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [matchMode, setMatchMode] = useState(false);
  const [matchKeywords, setMatchKeywords] = useState([]);
  const [selectedLostItem, setSelectedLostItem] = useState(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await fetchLostItems();
      setItems(data || []);
    } catch (error) {
      console.error("Error loading items:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTabColor = (tabId) => {
    if (matchMode && tabId === 'found') return "bg-purple-600 shadow-purple-200 text-white";
    if (activeTab === tabId) {
      switch (tabId) {
        case 'found': return "bg-blue-500 shadow-blue-200 text-white";
        case 'claimed': return "bg-emerald-500 shadow-emerald-200 text-white";
        default: return "bg-gray-900 shadow-gray-200 text-white";
      }
    }
    return "text-gray-500 hover:bg-gray-50";
  };

  const getCardBorder = (status, matchScore) => {
    if (matchScore > 0) return 'border-purple-300 ring-2 ring-purple-100';
    switch (status) {
      case 'found': return 'border-blue-100 hover:border-blue-300';
      case 'claimed': return 'border-emerald-100 hover:border-emerald-300';
      default: return 'border-gray-100 hover:border-gray-300';
    }
  };

  const handleMarkClaimed = async (itemId) => {
    if (!window.confirm("Mark this item as successfully claimed?")) return;
    try {
      await markItemClaimed(itemId, user?.id);
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, status: 'claimed', claimed_at: new Date().toISOString() } : item
      ));
    } catch (err) {
      console.error("Error marking claimed:", err);
      showError("Failed to mark as claimed");
    }
  };

  const handleMarkFound = async (itemId) => {
    try {
      await updateLostItemStatus(itemId, 'found');
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, status: 'found' } : item
      ));
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const triggerMatch = (item) => {
    const ignoreWords = ['lost', 'found', 'missing', 'my', 'the', 'a', 'an', 'in', 'at', 'near'];
    const keywords = item.title.toLowerCase().split(' ').filter(w => w.length > 2 && !ignoreWords.includes(w));
    setMatchKeywords(keywords);
    setSelectedLostItem(item);
    setMatchMode(true); 
    setActiveTab('found');
  };

  const clearMatch = () => {
    setMatchMode(false);
    setMatchKeywords([]);
    setSelectedLostItem(null);
    setActiveTab('lost');
  };

  const filteredItems = useMemo(() => {
    let data = items;
    
    if (!matchMode) {
      data = data.filter(i => i.status === activeTab);
    } else {
      data = data.filter(i => i.status === 'found');
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(i => 
        i.title?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.location?.toLowerCase().includes(q) ||
        i.reported_by_profile?.name?.toLowerCase().includes(q)
      );
    }

    if (matchMode && matchKeywords.length > 0) {
      data = data.map(item => {
        const text = (item.title + ' ' + (item.description || '')).toLowerCase();
        const score = matchKeywords.reduce((acc, word) => text.includes(word) ? acc + 1 : acc, 0);
        return { ...item, matchScore: score };
      })
      .filter(item => item.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);
    }
    
    return data;
  }, [items, activeTab, searchQuery, matchMode, matchKeywords]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-['Poppins',sans-serif]">
      <AlertModal {...alertState} onClose={closeAlert} />
      
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Lost & Found Management</h1>
            <p className="text-gray-500 mt-1">Track reported items and help reunite them with owners.</p>
          </div>
          <button
            onClick={loadItems}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
          <div className="bg-white p-1.5 rounded-xl border border-gray-200 flex shadow-sm overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { if (matchMode) clearMatch(); setActiveTab(tab.id); }}
                className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${getTabColor(tab.id)}`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Match Mode Banner */}
        <AnimatePresence>
          {matchMode && selectedLostItem && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-6 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 p-2 rounded-full text-purple-600">
                  <ArrowRightLeft size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-purple-900">Finding Matches For: "{selectedLostItem.title}"</h3>
                  <p className="text-sm text-purple-700">
                    Keywords: <span className="font-mono bg-white px-2 py-0.5 rounded border border-purple-100">{matchKeywords.join(", ")}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={clearMatch}
                className="px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-semibold border border-gray-200 hover:bg-gray-50"
              >
                Clear Search
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Items Grid */}
        {loading ? (
          <div className="p-20 text-center text-gray-500">
            <div className="w-10 h-10 border-4 border-[#00E5FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            Loading inventory...
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`bg-white rounded-2xl border p-5 shadow-sm transition-all duration-300 flex flex-col h-full ${getCardBorder(item.status, item.matchScore)}`}
                  >
                    {/* Image */}
                    <div className="h-40 bg-gray-50 rounded-xl mb-4 overflow-hidden flex items-center justify-center border border-gray-100 relative">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <Box className="text-gray-300" size={40} />
                      )}
                      <div className="absolute top-3 right-3">
                        <BadgeBetter1 status={item.status} />
                      </div>
                      {matchMode && item.matchScore > 0 && (
                        <div className="absolute bottom-3 left-3 bg-purple-600 text-white text-xs px-2 py-1 rounded-full shadow-lg font-bold">
                          {item.matchScore} Keyword Match
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{item.title}</h3>
                      <p className="text-gray-500 text-sm mt-1 line-clamp-2 min-h-[40px]">
                        {item.description || "No description provided."}
                      </p>

                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                          <MapPin size={14} className="text-gray-400" />
                          <span className="truncate">{item.location || "Unknown Location"}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                          <div className="flex items-center gap-1.5">
                            <User size={14} />
                            <span>{item.reported_by_profile?.name || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 pt-4 border-t border-gray-50 flex gap-2">
                      {item.status === 'lost' && (
                        <>
                          <button 
                            onClick={() => triggerMatch(item)}
                            className="flex-1 bg-purple-50 text-purple-700 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
                          >
                            <Search size={16} /> Find Match
                          </button>
                          <button 
                            onClick={() => handleMarkFound(item.id)}
                            className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors"
                          >
                            Mark Found
                          </button>
                        </>
                      )}

                      {(item.status === 'lost' || item.status === 'found') && (
                        <button 
                          onClick={() => handleMarkClaimed(item.id)}
                          className="flex-1 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={16} /> Claim
                        </button>
                      )}

                      {item.status === 'claimed' && (
                        <div className="w-full text-center text-xs font-bold text-emerald-600 bg-emerald-50 py-2.5 rounded-lg border border-emerald-100">
                          Claimed on {new Date(item.claimed_at || Date.now()).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    {matchMode ? <Search className="text-gray-300" size={32} /> : <Box className="text-gray-300" size={32} />}
                  </div>
                  <h3 className="text-gray-800 font-semibold">
                    {matchMode ? "No Matches Found" : `No ${activeTab} items found`}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {matchMode ? "Try manually searching or checking the claimed history." : "Inventory is empty."}
                  </p>
                  {matchMode && (
                    <button onClick={clearMatch} className="mt-4 text-blue-500 text-sm font-medium hover:underline">
                      Back to Lost Items
                    </button>
                  )}
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminLost;
