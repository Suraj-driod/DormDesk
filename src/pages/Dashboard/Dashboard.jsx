import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Megaphone, AlertTriangle, Search, 
  ChevronLeft, ChevronRight, Clock, TrendingUp 
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import Heatmap from "../../components/Heatmap/Heatmap";
import QuickReportFAB from "../../components/QuickReportFAB/QuickReportFAB";

// Background images for slideshow
const SLIDESHOW_IMAGES = [
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&fit=crop&q=80",
  "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&fit=crop&q=80",
  "https://images.unsplash.com/photo-1562774053-701939374585?w=1200&fit=crop&q=80",
  "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=1200&fit=crop&q=80",
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, isAdmin, isCaretaker, isStudent, user, loading: authLoading, supabase } = useAuth();
  
  // Slideshow state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [bgIndex, setBgIndex] = useState(0);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch dynamic slide data - wait for auth
  useEffect(() => {
    if (!authLoading && user) {
      fetchSlideData();
    } else if (!authLoading && !user) {
      // No user, show fallback slides
      setSlides([
        { category: "Welcome", title: "DormDesk - Your Hostel Companion", icon: Users, color: "text-[#00B8D4]", path: "/" },
        { category: "Report Issues", title: "Quick and easy issue reporting", icon: AlertTriangle, color: "text-[#FB923C]", path: "/report-issue" },
        { category: "Lost Something?", title: "Report lost items instantly", icon: Search, color: "text-[#A78BFA]", path: "/lost-found" },
        { category: "Stay Updated", title: "Get hostel announcements", icon: Megaphone, color: "text-[#2DD4BF]", path: "/announcements" },
      ]);
      setLoading(false);
    }
  }, [authLoading, user]);

  const fetchSlideData = async () => {
    try {
      // Fetch top issues (most upvoted)
      const { data: topIssue } = await supabase
        .from("issues")
        .select("title, id")
        .eq("visibility", "public")
        .neq("status", "closed")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Fetch latest announcement
      const { data: latestAnnouncement } = await supabase
        .from("announcements")
        .select("title, id")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Fetch recent lost item
      const { data: recentLost } = await supabase
        .from("lost_items")
        .select("title, id")
        .eq("status", "lost")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Fetch issue stats
      const { count: pendingCount } = await supabase
        .from("issues")
        .select("*", { count: "exact", head: true })
        .in("status", ["reported", "assigned", "in_progress"]);

      const dynamicSlides = [
        {
          category: "Trending Issue",
          title: topIssue?.title || "No active issues",
          icon: TrendingUp,
          color: "text-[#00B8D4]",
          path: topIssue ? `/issues/${topIssue.id}` : "/issues",
        },
        {
          category: "Latest Announcement",
          title: latestAnnouncement?.title || "No announcements yet",
          icon: Megaphone,
          color: "text-[#2DD4BF]",
          path: "/announcements",
        },
        {
          category: "Recently Lost",
          title: recentLost?.title || "No lost items reported",
          icon: Search,
          color: "text-[#A78BFA]",
          path: "/lost-found",
        },
        {
          category: "Pending Issues",
          title: `${pendingCount || 0} issues awaiting resolution`,
          icon: Clock,
          color: "text-[#FB923C]",
          path: "/issues",
        },
      ];

      setSlides(dynamicSlides);
    } catch (error) {
      console.error("Error fetching slide data:", error);
      // Fallback slides
      setSlides([
        { category: "Welcome", title: "DormDesk - Your Hostel Companion", icon: Users, color: "text-[#00B8D4]", path: "/" },
        { category: "Report Issues", title: "Quick and easy issue reporting", icon: AlertTriangle, color: "text-[#FB923C]", path: "/report-issue" },
        { category: "Lost Something?", title: "Report lost items instantly", icon: Search, color: "text-[#A78BFA]", path: "/lost-found" },
        { category: "Stay Updated", title: "Get hostel announcements", icon: Megaphone, color: "text-[#2DD4BF]", path: "/announcements" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-slide every 4 seconds
  useEffect(() => {
    if (slides.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Background image rotation every 6 seconds
  useEffect(() => {
    const bgTimer = setInterval(() => {
      setBgIndex((prev) => (prev === SLIDESHOW_IMAGES.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(bgTimer);
  }, []);

  // Card navigation handler
  const handleCardClick = (path) => {
    navigate(path);
  };

  // Card Component
  const Card = ({ title, icon: Icon, color, glow, hoverGlow, onClick }) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        cursor-pointer
        h-[150px] rounded-[26px]
        bg-white/80 backdrop-blur-md
        border border-[#7CF3FF]/50
        ${glow}
        hover:${hoverGlow}
        transition-all duration-300
        flex flex-col items-center justify-center
        gap-3
        group
      `}
    >
      <div
        className={`
          w-[60px] h-[60px] rounded-full
          ${color.bg}
          flex items-center justify-center
          ${color.shadow}
          group-hover:scale-110
          transition-transform duration-300
        `}
      >
        <Icon className={color.icon} size={28} />
      </div>
      <p className="font-semibold text-[15px] text-gray-800">{title}</p>
    </motion.div>
  );

  const roleTitle = isAdmin ? "Admin Dashboard" : isCaretaker ? "Caretaker Dashboard" : "Student Dashboard";

  return (
    <div className="min-h-screen font-['Poppins',sans-serif] relative">
      {/* Background Slideshow */}
      <div className="fixed inset-0 -z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={bgIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <img
              src={SLIDESHOW_IMAGES[bgIndex]}
              alt="Background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/80 to-white/95" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-6 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-800">
            {roleTitle}
          </h1>
          {profile?.name && (
            <p className="text-gray-500 text-sm mt-1">
              Welcome back, {profile.name}
            </p>
          )}
        </motion.div>

        {/* Slideshow Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 w-full h-[160px] relative rounded-[26px] bg-white/70 backdrop-blur-lg border border-[#7CF3FF]/50 shadow-[0_0_35px_rgba(0,229,255,0.25)] flex items-center justify-center overflow-hidden"
        >
          {/* Navigation Arrows */}
          <button
            onClick={() => setCurrentSlide(prev => prev === 0 ? slides.length - 1 : prev - 1)}
            className="absolute left-4 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-md transition-all"
          >
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          
          <button
            onClick={() => setCurrentSlide(prev => prev === slides.length - 1 ? 0 : prev + 1)}
            className="absolute right-4 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-md transition-all"
          >
            <ChevronRight size={18} className="text-gray-600" />
          </button>

          {/* Slide Content */}
          <AnimatePresence mode="wait">
            {slides.length > 0 && (
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center px-12 cursor-pointer"
                onClick={() => slides[currentSlide]?.path && navigate(slides[currentSlide].path)}
              >
                <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-[#E6FBFF] flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.4)]">
                  {React.createElement(slides[currentSlide]?.icon || Users, {
                    size: 24,
                    className: slides[currentSlide]?.color || "text-[#00B8D4]",
                  })}
                </div>
                <p className="text-[11px] font-bold tracking-widest text-[#00B8D4] uppercase mb-1">
                  {slides[currentSlide]?.category}
                </p>
                <h2 className="text-[17px] font-semibold text-gray-800 line-clamp-2 max-w-md mx-auto">
                  {slides[currentSlide]?.title}
                </h2>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'w-6 bg-[#00E5FF] shadow-[0_0_10px_#00E5FF]' 
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </motion.div>

        {/* Heatmap Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Heatmap />
        </motion.div>

        {/* Quick Actions Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-5"
        >
          <Card
            title="Public Feed"
            icon={Users}
            color={{
              bg: "bg-[#E6FBFF]",
              icon: "text-[#00B8D4]",
              shadow: "shadow-[0_0_25px_rgba(0,229,255,0.6)]",
            }}
            glow="shadow-[0_0_35px_rgba(0,229,255,0.25)]"
            hoverGlow="shadow-[0_0_45px_rgba(0,229,255,0.45)]"
            onClick={() => handleCardClick("/feed")}
          />

          <Card
            title="Announcements"
            icon={Megaphone}
            color={{
              bg: "bg-[#ECFEFF]",
              icon: "text-[#2DD4BF]",
              shadow: "shadow-[0_0_25px_rgba(45,212,191,0.6)]",
            }}
            glow="shadow-[0_0_35px_rgba(45,212,191,0.25)]"
            hoverGlow="shadow-[0_0_45px_rgba(45,212,191,0.45)]"
            onClick={() => handleCardClick("/announcements")}
          />

          <Card
            title="Complaints"
            icon={AlertTriangle}
            color={{
              bg: "bg-[#FFF7ED]",
              icon: "text-[#FB923C]",
              shadow: "shadow-[0_0_25px_rgba(251,146,60,0.6)]",
            }}
            glow="shadow-[0_0_35px_rgba(251,146,60,0.25)]"
            hoverGlow="shadow-[0_0_45px_rgba(251,146,60,0.45)]"
            onClick={() => handleCardClick("/complaints")}
          />

          <Card
            title="Lost & Found"
            icon={Search}
            color={{
              bg: "bg-[#F5F3FF]",
              icon: "text-[#A78BFA]",
              shadow: "shadow-[0_0_25px_rgba(167,139,250,0.6)]",
            }}
            glow="shadow-[0_0_35px_rgba(167,139,250,0.25)]"
            hoverGlow="shadow-[0_0_45px_rgba(167,139,250,0.45)]"
            onClick={() => handleCardClick("/lost-found")}
          />
        </motion.div>

        {/* Admin Quick Links */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3">
              Admin Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Manage Issues", path: "/admin/issues" },
                { label: "Announcements", path: "/admin/announcements" },
                { label: "Lost & Found", path: "/admin/lost" },
                { label: "Case Assignment", path: "/admin/cases" },
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="px-4 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors shadow-lg"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Caretaker Quick Links */}
        {isCaretaker && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3">
              Caretaker Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate("/caretaker/assignments")}
                className="px-4 py-3 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors shadow-lg"
              >
                My Assignments
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="px-4 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors shadow-lg"
              >
                My Profile
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Quick Report FAB - Only for students */}
      {isStudent && <QuickReportFAB />}
    </div>
  );
}
