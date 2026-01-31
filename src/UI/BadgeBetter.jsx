import { motion } from "framer-motion";
import { theme } from "../theme";

/* ================= STATUS COLORS (No Glow) ================= */
const statusStyles = {
  Reported: { bg: "bg-[#FB7185]", text: "text-[#0f172a]" },
  Assigned: { bg: "bg-[#38BDF8]", text: "text-[#0f172a]" },
  InProgress: { bg: "bg-[#FACC15]", text: "text-[#0f172a]" },
  Resolved: { bg: "bg-[#22C55E]", text: "text-[#052e16]" },
  Closed: { bg: "bg-[#94A3B8]", text: "text-[#020617]" },
  Published: { bg: "bg-[#06B6D4]", text: "text-[#0f172a]" },
  Draft: { bg: "bg-[#94A3B8]", text: "text-[#020617]" },
  Lost: { bg: "bg-[#F59E0B]", text: "text-[#0f172a]" },
  Claimed: { bg: "bg-[#22C55E]", text: "text-[#052e16]" },
  Found: { bg: "bg-[#22C55E]", text: "text-[#052e16]" },
  Submitted: { bg: "bg-[#38BDF8]", text: "text-[#0f172a]" },
  "Under Review": { bg: "bg-[#FACC15]", text: "text-[#0f172a]" },
};

const normalizeStatus = (s) => {
  if (!s || typeof s !== "string") return "Reported";
  const raw = s.toLowerCase().replace(/\s+/g, "_");
  const map = {
    reported: "Reported", assigned: "Assigned", in_progress: "InProgress", resolved: "Resolved", closed: "Closed",
    published: "Published", draft: "Draft", lost: "Lost", claimed: "Claimed", found: "Found",
    submitted: "Submitted", under_review: "Under Review",
  };
  const key = map[raw];
  return key || (statusStyles[s] ? s : "Reported");
};

/* ================= BADGE ================= */
export const BadgeBetter1 = ({ status = "Reported" }) => {
  const key = normalizeStatus(status);
  const style = statusStyles[key] || statusStyles.Reported;

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
      <span className="relative z-10">{key}</span>
    </motion.span>
  );
};