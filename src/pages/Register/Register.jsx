import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion"; 
import { UserPlus, Sparkles, ChevronDown } from "lucide-react"; 

// --- Custom Components & Services ---
import { TextInput, ImageUpload } from '../../components/core';
import { Button, Toast, Modal } from '../../UI/Glow.jsx'; 
import { SelectBetter } from '../../UI/SelectBetter.jsx'; 
import { theme } from '../../theme';
import { useAuth} from "../../auth/AuthContext";  
import { scanIdCard } from '../../services/geminiOCR'; 

// --- CONSTANTS ---
const ROLE_OPTIONS = [
  { value: 'student', label: 'Student' },
];

const Register = ({ onNavigateToLogin }) => {
  const { signUp } = useAuth(); 

  // --- STATE ---
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    role: 'student',
    hostelName: '',
    blockName: '',
    floor: '',
    roomNumber: '',
    password: '',
  });
  
  const [idCardImage, setIdCardImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false); 
  const [formVisible, setFormVisible] = useState(false);

  // --- UI STATE (Toast & Modal) ---
  const [toastMessage, setToastMessage] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleRoleChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, role: value }));
    if (errors.role) setErrors(prev => ({ ...prev, role: '' }));
  };

  const handleImageUpload = async (file, preview) => {
    setIdCardImage({ file, preview });
    
    if (file) {
      setFormVisible(true); 
      setIsScanning(true);
      setToastMessage("Scanning ID card...");

      try {
        const scannedData = await scanIdCard(file);
        
        if (scannedData) {
          setFormData(prev => ({
            ...prev,
            fullName: scannedData.fullName || prev.fullName,
            email: scannedData.email || prev.email,
          }));
          setToastMessage("Details extracted successfully!");
        } else {
          setToastMessage("Could not extract details. Please fill manually.");
        }
      } catch (error) {
        console.error("AI Scan error:", error);
        setToastMessage("Scan failed. Please fill details manually.");
      } finally {
        setIsScanning(false);
      }
    }
  };

  // --- SUBMIT HANDLER ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.role) newErrors.role = 'Please select a role';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!idCardImage) newErrors.idCard = 'ID Card image is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      setToastMessage("Please fix the errors in the form.");
      return;
    }

    try {
      const { data, error } = await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        phone: formData.phone,
        role: formData.role,
        hostel_name: formData.hostelName,
        block_name: formData.blockName,
        floor: formData.floor,
        room_number: formData.roomNumber,
      });

      if (error) throw error;

      setShowSuccessModal(true);

    } catch (error) {
      console.error("Registration failed", error);
      setToastMessage(error.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(#f7fdff,#ffffff)] font-['Poppins',sans-serif] text-[#0f172a] p-4 relative">
      
      {/* --- TOAST NOTIFICATION (Perfectly Centered) --- */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }} // Handle X centering here
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            className="fixed top-6 left-1/2 z-[100]" // High Z-index, no CSS transform
          >
            <Toast text={toastMessage} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SUCCESS MODAL --- */}
      <Modal 
        open={showSuccessModal} 
        onClose={() => {
          setShowSuccessModal(false);
          if (onNavigateToLogin) onNavigateToLogin();
        }}
      >
        <div className="text-center py-2">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="text-green-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-[#064E3B] mb-2">Welcome to DormDesk!</h2>
          <p className="text-[#064E3B]/80 text-sm leading-relaxed">
            Your account has been created successfully. You can now login to manage your hostel experience.
          </p>
        </div>
      </Modal>

      <motion.div 
        layout 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[650px] bg-white/70 backdrop-blur-md rounded-[28px] p-8 shadow-[0_0_40px_rgba(0,229,255,0.25)] border border-[#E6FBFF] my-10"
      >
        {/* Header */}
        <motion.div 
          layout
          className="text-center mb-8"
        >
           <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00E5FF] to-[#00B8D4] shadow-[0_0_20px_rgba(0,229,255,0.4)] mb-4 text-white">
            <UserPlus size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-[24px] font-semibold text-[#0f172a]">Create Account</h1>
          <p className="text-[14px] text-[#64748B] mt-1">Join DormDesk to manage your hostel experience</p>
        </motion.div>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          
          {/* ID Card Upload Section */}
          <motion.section 
            layout
            className={`
              relative bg-white/40 rounded-2xl p-4 border transition-colors 
              ${errors.idCard ? 'border-red-300 bg-red-50/30' : 'border-[#E6FBFF]'}
              ${isScanning ? 'ring-2 ring-[#00B8D4] ring-opacity-50' : ''}
            `}
          >
            <ImageUpload
              label="Upload Hostel ID Card"
              helperText="Full Name and Email will be auto-filled using AI" 
              onChange={handleImageUpload}
              required
            />
            {errors.idCard && <p className="text-xs text-red-500 mt-2 ml-2">{errors.idCard}</p>}

            {isScanning && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10">
                <div className="flex items-center gap-2 text-[#00B8D4] font-semibold animate-pulse">
                  <Sparkles size={20} />
                  <span>AI is scanning ID...</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Extracting Name and Email</p>
              </div>
            )}
          </motion.section>

          {/* Clickable Divider */}
          <motion.div 
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="flex items-center gap-4 text-[#94A3B8] text-xs uppercase tracking-wider font-semibold cursor-pointer group"
            onClick={() => setFormVisible(true)} 
          >
            <div className="flex-1 h-px bg-[#E2E8F0] group-hover:bg-[#00B8D4] transition-colors" />
            <span className="group-hover:text-[#00B8D4] transition-colors flex items-center gap-1">
              OR FILL MANUALLY {!formVisible && <ChevronDown size={14} />}
            </span>
            <div className="flex-1 h-px bg-[#E2E8F0] group-hover:bg-[#00B8D4] transition-colors" />
          </motion.div>

          {/* Hidden Sections */}
          <AnimatePresence>
            {formVisible && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="overflow-hidden flex flex-col gap-6"
              >
                {/* Personal Information */}
                <section>
                  <h2 className="text-sm font-bold text-[#00B8D4] uppercase tracking-wide mb-4 pl-1">Personal Information</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TextInput
                      label="Full Name"
                      name="fullName"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={handleChange}
                      error={errors.fullName}
                      required
                    />
                    <TextInput
                      label="Phone Number"
                      name="phone"
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.phone}
                      onChange={handleChange}
                      error={errors.phone}
                      required
                    />
                    <TextInput
                      label="Email Address"
                      name="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      error={errors.email}
                      required
                      autoComplete="email"
                    />
                    
                    <SelectBetter
                      label="Role"
                      name="role"
                      placeholder="Select Role"
                      options={ROLE_OPTIONS}
                      value={formData.role}
                      onChange={handleRoleChange}
                      error={errors.role}
                      required
                      icon={UserPlus}
                      disabled={true} 
                    />
                  </div>
                </section>

                {/* Hostel Details */}
                <section>
                  <h2 className="text-sm font-bold text-[#00B8D4] uppercase tracking-wide mb-4 pl-1">Hostel Details</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TextInput
                      label="Hostel Name"
                      name="hostelName"
                      placeholder="Enter hostel name"
                      value={formData.hostelName}
                      onChange={handleChange}
                    />
                    <TextInput
                      label="Block Name / Number"
                      name="blockName"
                      placeholder="e.g., Block A or 1"
                      value={formData.blockName}
                      onChange={handleChange}
                    />
                    <TextInput
                      label="Floor"
                      name="floor"
                      type="number"
                      placeholder="e.g., 2"
                      value={formData.floor}
                      onChange={handleChange}
                    />
                    <TextInput
                      label="Room Number"
                      name="roomNumber"
                      placeholder="e.g., 204"
                      value={formData.roomNumber}
                      onChange={handleChange}
                    />
                  </div>
                </section>

                {/* Security */}
                <section>
                  <h2 className="text-sm font-bold text-[#00B8D4] uppercase tracking-wide mb-4 pl-1">Security</h2>
                  <TextInput
                    label="Password"
                    name="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    required
                    autoComplete="new-password"
                  />
                </section>

                {/* Actions */}
                <div className="flex flex-col items-center gap-4 pt-4">
                  <Button type="submit" fullWidth disabled={isSubmitting}>
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                        Creating Account...
                      </div>
                    ) : "Register"}
                  </Button>
                  
                  <p className="text-sm text-[#64748B]">
                    Already have an account?{' '}
                    <button 
                      type="button" 
                      onClick={onNavigateToLogin} 
                      className="text-[#00B8D4] font-semibold hover:text-[#00E5FF] hover:underline transition-colors bg-transparent border-none cursor-pointer p-0"
                    >
                      Login
                    </button>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </form>
      </motion.div>
    </div>
  );
};

export default Register;