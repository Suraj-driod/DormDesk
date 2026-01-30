import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export const SelectBetter = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Select", 
  label, 
  name,
  required,
  error 
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Find the label for the current value (if exists)
  const selectedLabel = options.find(opt => opt.value === value)?.label || value;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (optionValue) => {
    // Mimic standard event object for compatibility
    const event = {
      target: {
        name: name,
        value: optionValue
      }
    };
    onChange(event);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative w-full flex flex-col gap-1">

      {/* Label */}
      {label && (
        <label className="text-sm font-semibold text-gray-800 ml-1">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Select Box (Button) */}
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(!open)}
        className={`
          w-full h-[52px] px-4 
          rounded-full 
          border 
          ${error ? 'border-red-500' : 'border-transparent'} 
          ${open ? 'border-[#00E5FF] ring-1 ring-[#00E5FF]' : ''}
          bg-gray-50 
          text-[#0f172a] 
          flex items-center justify-between
          cursor-pointer
          transition-all duration-200
          hover:bg-gray-100
        `}
      >
        <span className={`${!value ? "text-[#94A3B8]" : "text-[#0f172a]"}`}>
          {selectedLabel || placeholder}
        </span>

        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.05 }}
        >
          <ChevronDown size={18} className="text-[#00B8D4]" />
        </motion.div>
      </motion.div>

      {/* Error Message */}
      {error && <span className="text-xs text-red-500 ml-1">{error}</span>}

      {/* Dropdown Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 8, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`
              absolute z-50 w-full mt-1
              rounded-2xl 
              bg-white/90 backdrop-blur-xl 
              border border-[#E6FBFF]
              shadow-[0_10px_30px_rgba(0,0,0,0.05)]
              overflow-hidden
            `}
          >
            <div className="max-h-[200px] overflow-y-auto py-2">
              {options.map((opt, i) => (
                <motion.div
                  key={i}
                  whileHover={{ backgroundColor: "#E6FBFF", color: "#00B8D4" }}
                  onClick={() => handleSelect(opt.value)}
                  className={`
                    px-5 py-3 
                    text-sm text-[#0f172a] 
                    cursor-pointer 
                    transition-colors
                    ${value === opt.value ? 'bg-[#E6FBFF] text-[#00B8D4] font-medium' : ''}
                  `}
                >
                  {opt.label}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};