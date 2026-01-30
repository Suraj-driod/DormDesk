import { useState } from 'react';
import { TextInput, ImageUpload } from '../../components/core';
import { Button } from '../../UI/Glow.jsx'; 
import { theme } from '../../theme';
import { motion } from "framer-motion"; 
import { UserPlus } from "lucide-react"; 
import { SelectBetter } from '../../UI/SelectBetter.jsx'; 

const ROLE_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'warden', label: 'Warden' },
  { value: 'admin', label: 'Admin' },
];

const Register = ({ onNavigateToLogin }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    role: '',
    hostelName: '',
    blockName: '',
    floor: '',
    roomNumber: '',
    password: '',
  });
  const [idCardImage, setIdCardImage] = useState(null);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = (file, preview) => {
    setIdCardImage({ file, preview });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!formData.role) newErrors.role = 'Please select a role';
    if (!formData.password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    console.log('Form submitted:', { ...formData, idCardImage });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(#f7fdff,#ffffff)] font-['Poppins',sans-serif] text-[#0f172a] p-4">
      
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[650px] bg-white/70 backdrop-blur rounded-[28px] p-8 shadow-[0_0_40px_rgba(0,229,255,0.25)] border border-[#E6FBFF] my-10"
      >
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/40 rounded-2xl p-4 border border-[#E6FBFF]"
          >
            <ImageUpload
              label="Upload Hostel ID Card"
              helperText="Details like name, hostel, and room will be auto-filled using OCR"
              onChange={handleImageUpload}
              required
            />
          </motion.section>

          {/* Divider */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="flex items-center gap-4 text-[#94A3B8] text-xs uppercase tracking-wider font-semibold"
          >
            <div className="flex-1 h-px bg-[#E2E8F0]" />
            <span>OR FILL MANUALLY</span>
            <div className="flex-1 h-px bg-[#E2E8F0]" />
          </motion.div>

          {/* Personal Information */}
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
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
              
              {/* Updated SelectBetter */}
              <SelectBetter
                label="Role"
                name="role"
                placeholder="Select Role"
                options={ROLE_OPTIONS}
                value={formData.role}
                onChange={handleChange}
                error={errors.role}
                required
              />
            </div>
          </motion.section>

          {/* Hostel Details */}
          <motion.section
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.4 }}
          >
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
          </motion.section>

          {/* Security */}
          <motion.section
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.5 }}
          >
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
          </motion.section>

          {/* Actions */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col items-center gap-4 pt-4"
          >
            <Button type="submit" fullWidth>
              Register
            </Button>
            <p className="text-sm text-[#64748B]">
              Already have an account?{' '}
              <button type="button" onClick={onNavigateToLogin} className="text-[#00B8D4] font-semibold hover:text-[#00E5FF] hover:underline transition-colors bg-transparent border-none cursor-pointer p-0">
                Login
              </button>
            </p>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;