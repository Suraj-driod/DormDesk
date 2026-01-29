import { useState } from 'react';
import { TextInput } from '../../components/core';
import { theme } from '../../theme';
import { Button } from '../../page/Glow.jsx';
import { motion } from "framer-motion";
import { LogIn } from "lucide-react";

const Login = ({ onNavigateToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    console.log('Login submitted:', formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(#f7fdff,#ffffff)] font-['Poppins',sans-serif] text-[#0f172a] px-4">
      
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[440px] bg-white/70 backdrop-blur rounded-[28px] p-8 shadow-[0_0_40px_rgba(0,229,255,0.25)] border border-[#E6FBFF]"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00E5FF] to-[#00B8D4] shadow-[0_0_20px_rgba(0,229,255,0.4)] mb-4 text-white">
            <LogIn size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-[24px] font-semibold text-[#0f172a]">Welcome Back</h1>
          <p className="text-[14px] text-[#64748B] mt-1">Sign in to continue to DormDesk</p>
        </motion.div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col gap-5"
          >
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
            <TextInput
              label="Password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
              autoComplete="current-password"
            />

            <div className="pt-2">
              <Button type="submit" fullWidth>
                Sign In
              </Button>
            </div>
          </motion.div>
        </form>

        {/* Footer Link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center text-[13px] text-[#64748B] mt-6"
        >
          Don't have an account?{' '}
          <button 
            type="button" 
            onClick={onNavigateToRegister} 
            className="text-[#00B8D4] font-semibold hover:text-[#00E5FF] hover:underline transition-colors bg-transparent border-none cursor-pointer p-0"
          >
            Register
          </button>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Login;