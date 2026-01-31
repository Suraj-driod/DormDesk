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
      /* Broadness & Sizing */
      min-w-[300px] max-w-md 
      px-8 py-3 
      text-center rounded-xl
      
      /* Colors & Glassmorphism */
      text-[#064E3B]
      bg-[#4ADE80]/85 backdrop-blur-md
      border border-[#22C55E]/50
      
      /* Effects */
      font-medium text-[15px]
      shadow-[0_8px_32px_rgba(34,197,94,0.3)]
      transition-all duration-300
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

/* ================= ALERT MODAL ================= */
const ALERT_STYLES = {
  success: {
    border: 'border-green-200',
    bg: 'bg-green-50',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    buttonBg: 'bg-green-500 hover:bg-green-600',
    shadow: 'shadow-[0_10px_30px_rgba(34,197,94,0.25)]',
  },
  error: {
    border: 'border-red-200',
    bg: 'bg-red-50',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    buttonBg: 'bg-red-500 hover:bg-red-600',
    shadow: 'shadow-[0_10px_30px_rgba(239,68,68,0.25)]',
  },
  warning: {
    border: 'border-orange-200',
    bg: 'bg-orange-50',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    buttonBg: 'bg-orange-500 hover:bg-orange-600',
    shadow: 'shadow-[0_10px_30px_rgba(249,115,22,0.25)]',
  },
  info: {
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    buttonBg: 'bg-blue-500 hover:bg-blue-600',
    shadow: 'shadow-[0_10px_30px_rgba(59,130,246,0.25)]',
  },
}

export const AlertModal = ({ open, onClose, title, message, type = 'info' }) => {
  if (!open) return null
  
  const styles = ALERT_STYLES[type] || ALERT_STYLES.info

  const icons = {
    success: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className={`p-6 rounded-2xl bg-white ${styles.border} border ${styles.shadow} w-full max-w-sm animate-in zoom-in-95 duration-200`}>
        <div className="text-center">
          <div className={`w-16 h-16 ${styles.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 ${styles.iconColor}`}>
            {icons[type]}
          </div>
          {title && <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>}
          <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="mt-5 flex justify-center">
          <button
            onClick={onClose}
            className={`px-6 py-2.5 rounded-full text-white font-semibold transition-all ${styles.buttonBg}`}
          >
            OK
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
  <div className="min-h-screen flex items-center justify-center text-[#1f2937] bg-[#f8fafc] px-4">
    <div
      className="
        w-full max-w-2xl
        p-14
        rounded-3xl 
        text-center 
        bg-white 
        border border-[#e5e7eb] 
        shadow-md
      "
    >
      <h1 className="text-8xl font-bold text-[#374151]">404</h1>

      <p className="mt-4 text-lg text-[#6b7280]">
        Page Not Found
      </p>

      <div className="flex items-center justify-center mt-8">
        <button
          className="
            px-10 py-3 
            rounded-full
            bg-[#EF4444]
            text-white
            text-base
            font-semibold
            cursor-pointer
            shadow-[0_0_18px_rgba(239,68,68,0.45)]
            hover:bg-[#DC2626]
            hover:shadow-[0_0_24px_rgba(239,68,68,0.6)]
            transition-all
          "
        >
          Go Home
        </button>
      </div>
    </div>
  </div>
);
