import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Plus, X, AlertTriangle, Search, MessageSquare 
} from "lucide-react";

const QuickReportFAB = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    {
      id: "issue",
      label: "Report Issue",
      icon: AlertTriangle,
      path: "/report-issue",
      gradient: "from-red-500 to-orange-400",
      shadow: "shadow-red-200",
    },
    {
      id: "lost",
      label: "Lost & Found",
      icon: Search,
      path: "/lost-found",
      gradient: "from-purple-500 to-pink-400",
      shadow: "shadow-purple-200",
    },
    {
      id: "complaint",
      label: "Register Complaint",
      icon: MessageSquare,
      path: "/complaints",
      gradient: "from-blue-500 to-cyan-400",
      shadow: "shadow-blue-200",
    },
  ];

  const handleItemClick = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Menu Items */}
      <AnimatePresence>
        {isOpen && (
          <div className="absolute bottom-20 right-0 flex flex-col-reverse gap-3">
            {menuItems.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, scale: 0.3, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  y: 0,
                  transition: { delay: index * 0.05 }
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 0.3, 
                  y: 20,
                  transition: { delay: (menuItems.length - index - 1) * 0.03 }
                }}
                whileHover={{ scale: 1.05, x: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleItemClick(item.path)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-2xl
                  bg-white border border-gray-100
                  shadow-lg ${item.shadow}
                  hover:shadow-xl
                  transition-shadow duration-300
                `}
              >
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center
                  bg-gradient-to-br ${item.gradient} text-white
                  shadow-md
                `}>
                  <item.icon size={20} />
                </div>
                <span className="font-semibold text-gray-700 text-sm whitespace-nowrap pr-2">
                  {item.label}
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-14 h-14 rounded-full
          flex items-center justify-center
          text-white font-bold
          shadow-xl
          transition-all duration-300
          ${isOpen 
            ? 'bg-gray-800 shadow-gray-400/50 rotate-0' 
            : 'bg-gradient-to-br from-[#00B8D4] to-[#00E5FF] shadow-[0_0_25px_rgba(0,229,255,0.5)]'
          }
        `}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X size={24} /> : <Plus size={24} strokeWidth={2.5} />}
        </motion.div>
      </motion.button>

      {/* Label tooltip when closed */}
      {!isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute bottom-4 right-16 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg"
        >
          Quick Report
          <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-gray-900" />
        </motion.div>
      )}
    </div>
  );
};

export default QuickReportFAB;
