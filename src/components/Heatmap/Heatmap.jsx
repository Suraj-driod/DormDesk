import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wifi, Wrench, Zap, Sparkles, HelpCircle, TrendingUp } from "lucide-react";
import { supabase } from "../../Lib/supabaseClient";

const CATEGORY_CONFIG = {
  wifi: { 
    label: "Wi-Fi", 
    icon: Wifi, 
    gradient: "from-blue-500 to-cyan-400",
    bg: "bg-blue-50",
    border: "border-blue-200"
  },
  plumbing: { 
    label: "Plumbing", 
    icon: Wrench, 
    gradient: "from-teal-500 to-emerald-400",
    bg: "bg-teal-50",
    border: "border-teal-200"
  },
  electrical: { 
    label: "Electrical", 
    icon: Zap, 
    gradient: "from-amber-500 to-yellow-400",
    bg: "bg-amber-50",
    border: "border-amber-200"
  },
  cleanliness: { 
    label: "Cleanliness", 
    icon: Sparkles, 
    gradient: "from-purple-500 to-pink-400",
    bg: "bg-purple-50",
    border: "border-purple-200"
  },
  other: { 
    label: "Other", 
    icon: HelpCircle, 
    gradient: "from-gray-500 to-slate-400",
    bg: "bg-gray-50",
    border: "border-gray-200"
  },
};

const Heatmap = ({ compact = false }) => {
  const [categoryStats, setCategoryStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalIssues, setTotalIssues] = useState(0);

  useEffect(() => {
    fetchCategoryStats();
  }, []);

  const fetchCategoryStats = async () => {
    try {
      const { data, error } = await supabase
        .from("issues")
        .select("category")
        .neq("status", "closed");

      if (error) throw error;

      // Count by category
      const counts = {};
      data.forEach((issue) => {
        const cat = issue.category || "other";
        counts[cat] = (counts[cat] || 0) + 1;
      });

      // Transform to array with percentages
      const total = data.length;
      setTotalIssues(total);

      const stats = Object.entries(CATEGORY_CONFIG).map(([key, config]) => ({
        category: key,
        count: counts[key] || 0,
        percentage: total > 0 ? Math.round(((counts[key] || 0) / total) * 100) : 0,
        ...config,
      }));

      // Sort by count descending
      stats.sort((a, b) => b.count - a.count);
      setCategoryStats(stats);
    } catch (error) {
      console.error("Error fetching category stats:", error);
      // Fallback to empty stats
      setCategoryStats(
        Object.entries(CATEGORY_CONFIG).map(([key, config]) => ({
          category: key,
          count: 0,
          percentage: 0,
          ...config,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl border border-gray-100 p-6 ${compact ? '' : 'shadow-sm'}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...categoryStats.map((s) => s.count), 1);

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 ${compact ? 'p-4' : 'p-6 shadow-sm'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-[#00B8D4]" />
          <h3 className={`font-bold text-gray-800 ${compact ? 'text-sm' : 'text-lg'}`}>
            Issue Heatmap
          </h3>
        </div>
        <span className="text-xs text-gray-400 font-medium">
          {totalIssues} active issues
        </span>
      </div>

      {/* Heatmap Grid */}
      <div className={`grid ${compact ? 'grid-cols-5 gap-2' : 'grid-cols-5 gap-3'}`}>
        {categoryStats.map((stat, index) => {
          const Icon = stat.icon;
          const intensity = stat.count / maxCount;
          
          return (
            <motion.div
              key={stat.category}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`
                relative overflow-hidden rounded-xl cursor-pointer
                ${stat.bg} ${stat.border} border
                transition-all duration-300 hover:scale-105
                ${compact ? 'p-3' : 'p-4'}
              `}
              style={{
                boxShadow: stat.count > 0 
                  ? `0 0 ${Math.max(10, intensity * 30)}px rgba(0, 184, 212, ${intensity * 0.3})` 
                  : 'none'
              }}
            >
              {/* Heat indicator bar */}
              <div 
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-r ${stat.gradient} transition-all duration-500`}
                style={{ height: `${Math.max(4, stat.percentage)}%`, opacity: 0.3 }}
              />

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center mb-2
                  bg-gradient-to-br ${stat.gradient} text-white shadow-lg
                `}>
                  <Icon size={18} />
                </div>
                <span className={`font-bold text-gray-800 ${compact ? 'text-lg' : 'text-2xl'}`}>
                  {stat.count}
                </span>
                <span className={`text-gray-500 font-medium ${compact ? 'text-[10px]' : 'text-xs'}`}>
                  {stat.label}
                </span>
                {!compact && stat.percentage > 0 && (
                  <span className="text-[10px] text-gray-400 mt-1">
                    {stat.percentage}%
                  </span>
                )}
              </div>

              {/* Priority indicator for high counts */}
              {stat.count > 5 && (
                <div className="absolute top-2 right-2">
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-gradient-to-r ${stat.gradient}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 bg-gradient-to-r ${stat.gradient}`}></span>
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend (only in full mode) */}
      {!compact && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 to-red-500 shadow-[0_0_10px_rgba(255,100,100,0.5)]"></div>
            <span>High</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Heatmap;
