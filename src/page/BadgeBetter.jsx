import { motion } from "framer-motion";
import { theme } from "../theme";

/* ================= STATUS COLORS (No Glow) ================= */
const statusStyles = {
  Reported: {
    bg: "bg-[#FB7185]",   // red
    text: "text-[#0f172a]",
  },
  Assigned: {
    bg: "bg-[#38BDF8]",  // sky blue
    text: "text-[#0f172a]",
  },
  InProgress: {
    bg: "bg-[#FACC15]",  // amber/yellow
    text: "text-[#0f172a]",
  },
  Resolved: {
    bg: "bg-[#22C55E]",  // green
    text: "text-[#052e16]",
  },
  Closed: {
    bg: "bg-[#94A3B8]",  // slate gray
    text: "text-[#020617]",
  }
};

/* ================= BADGE ================= */
export const BadgeBetter1 = ({ status = "Reported" }) => {
  const style = statusStyles[status] || statusStyles.Reported;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.6, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.05, ease: "easeOut" }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative
        px-3 py-1 
        rounded-full 
        text-[12px] font-semibold
        ${style.bg}
        ${style.text}
        inline-flex items-center justify-center
        select-none cursor-default
        transition-colors
      `}
    >
      <span className="relative z-10">{status}</span>
    </motion.span>
  );
};