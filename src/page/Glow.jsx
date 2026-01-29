import { theme } from '../theme';

/* ================= BUTTON ================= */
export const Button = ({ children, className = '', ...props }) => (
  <button
    {...props}
    className={`
      /* Layout & Sizing */
      relative mx-auto w-full px-6 py-3
      flex items-center justify-center gap-2 cursor-pointer
      
      /* Shape & Text */
      rounded-full 
      text-[#0f172a] font-bold text-[15px] tracking-wide
      
      /* Appearance (Your Theme) */
      ${theme.blueGrad} 
      ${theme.glow} 
      
      /* Interactions */
      hover:${theme.glowStrong} 
      hover:-translate-y-0.5 
      active:scale-95 active:shadow-inner
      
      /* Transitions */
      transition-all duration-300 ease-out
      
      ${className}
    `}
  >
    {children}
  </button>
)

/* ================= INPUT ================= */
export const InputGlow = (props) => (
  <input
    {...props}
    className={`
      w-full h-[48px] px-4 
      rounded-full 
      border ${theme.neonBorder} 
      text-[14px] text-[#0f172a] 
      placeholder:text-[#64748B]
      bg-white/70 backdrop-blur
      focus:outline-none focus:ring-2 focus:ring-[#00E5FF]
      ${theme.glow}
    `}
  />
)


export const InputDontGlow = (props) => (
  <input
    {...props}
    className={`
     w-full h-[44px] px-4 rounded-full border
    `}
  />
)


/* ================= TEXTAREA ================= */
export const TextArea = (props) => (
  <textarea
    {...props}
    className={`
      w-full p-4 
      rounded-[18px] 
      border ${theme.neonBorder} 
      text-[14px] text-[#0f172a]
      placeholder:text-[#64748B]
      bg-white/70 backdrop-blur
      focus:outline-none focus:ring-2 focus:ring-[#00E5FF]
      ${theme.glow}
    `}
  />
)



/* ================= BADGE ================= */
export const Badge = ({ text }) => (
  <span className={`
    px-3 py-1 rounded-full text-[12px] 
    bg-[#00E5FF] text-[#0f172a]
    ${theme.glow}
  `}>
    {text}
  </span>
)

/* ================= LOADER ================= */
export const Loader = () => (
  <div className="w-10 h-10 border-4 border-[#00E5FF] border-t-transparent rounded-full animate-spin shadow-[0_0_25px_rgba(0,229,255,0.6)]" />
)

/* ================= TOAST ================= */
export const Toast = ({ text }) => (
  <div
    className={`
      px-4 py-3 text-center w-1/4 rounded-xl
      text-[#064E3B]
      bg-[#4ADE80]/85 backdrop-blur
      border border-[#22C55E]
      shadow-[0_0_25px_rgba(52,211,153,0.7)]
    `}
  >
    {text}
  </div>
)




/* ================= MODAL ================= */
export const Modal = ({ open, onClose, children }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div
        className={`
          p-6 rounded-2xl 
          text-[#064E3B]
          bg-white
          border border-[#BBF7D0]
          shadow-[0_10px_30px_rgba(34,197,94,0.25)]
          w-[90%] max-w-md
        `}
      >
        
        {children}

        {/* Centered Close Button */}
        <div className="mt-5 flex justify-center">
          <button
            onClick={onClose}
            className="
              px-6 py-2 rounded-full
              bg-[#22C55E]
              text-white
              font-semibold
              shadow-[0_0_12px_rgba(34,197,94,0.35)]
              hover:bg-[#16A34A]
              transition-all
            "
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}




/* ================= ERROR BOUNDARY ================= */
import { AlertTriangle } from "lucide-react"
import React from 'react'
import { motion } from "framer-motion"
export class ErrorBoundary extends React.Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center text-center bg-[#f8fafc]">
          <div
            className="
              p-8 rounded-2xl 
              bg-white
              border border-[#E9D5FF]
              shadow-[0_0_25px_rgba(192,132,252,0.45)]
              flex flex-col items-center
            "
          >
            {/* Error Icon */}
            <div className="mb-4">
              <AlertTriangle size={48} className="text-[#C084FC]" />
            </div>

            <h1 className="text-2xl mb-2 font-semibold text-[#C084FC]">
              Something went wrong
            </h1>

            <p className="text-black">
             Issues Reporting System itself is experiencing errors. Spare us till we fix this issue loop :\
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

import { Smile } from "lucide-react"



/* ================= EMPTY STATE ================= */
export const EmptyState = ({ title, desc }) => (
  <div className="text-center p-10 text-[#0f172a]">

    {/* Animated Happy Icon */}
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex justify-center"
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        className="flex items-center justify-center"
      >
        <Smile size={38} className="text-[#10B981]" /> {/* balanced mint */}
      </motion.div>
    </motion.div>

    <h2 className="mt-4 text-xl font-semibold text-[#064E3B]">
      {title}
    </h2>

    <p className="text-[#047857] mt-1">
      {desc}
    </p>

  </div>
)


/* ================= 404 PAGE ================= */

export const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center text-[#1f2937] bg-[#f8fafc]">
    <div
      className="
        p-10 rounded-2xl text-center 
        bg-white
        border border-[#e5e7eb]
        shadow-sm
      "
    >
      <h1 className="text-6xl font-bold text-[#374151]">404</h1>

      <p className="mt-2 text-[#6b7280]">
        Page Not Found
      </p>

      <div className="flex items-center justify-center mt-5">
        <button
          className="
            px-6 py-2 rounded-full
            bg-[#EF4444]
            text-white
            font-medium
            cursor-pointer
            shadow-[0_0_12px_rgba(239,68,68,0.45)]
            hover:bg-[#DC2626]
            hover:shadow-[0_0_18px_rgba(239,68,68,0.6)]
            transition-all
          "
        >
          Go Home
        </button>
      </div>
    </div>
  </div>
)

