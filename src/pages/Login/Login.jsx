import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { TextInput } from "../../components/core";
import { Button, Toast } from "../../UI/Glow.jsx";
import { motion } from "framer-motion";
import { LogIn } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

const Login = () => {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from location state or default to dashboard
  const from = location.state?.from?.pathname || "/";

  // Check for disabled caretaker message
  const disabledMessage = location.state?.disabledMessage || null;

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    // Role resolution is now handled server-side in AuthContext
    const { error } = await login(formData.email, formData.password);

    setIsSubmitting(false);

    if (error) {
      setErrors({ general: error.message });
      return;
    }

    setShowSuccess(true);

    // Navigate to dashboard after brief success message
    setTimeout(() => {
      setShowSuccess(false);
      navigate(from, { replace: true });
    }, 800);
  };

  return (
    // 1. Changed to 'flex-col' so items stack vertically
    <div className="min-h-screen flex flex-col items-center justify-center bg-[linear-gradient(#f7fdff,#ffffff)] font-['Poppins',sans-serif] text-[#0f172a] px-4">
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-[0_0_20px_rgba(0,229,255,0.4)] mb-4 text-white transition-all duration-300 bg-gradient-to-tr from-[#00E5FF] to-[#00B8D4]">
            <LogIn size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-[24px] font-semibold text-[#0f172a]">
            Welcome Back
          </h1>
          <p className="text-[14px] text-[#64748B] mt-1">
            Sign in to continue to DormDesk
          </p>
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

            {(errors.general || disabledMessage) && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-center">
                <p className="text-red-600 text-sm font-medium">
                  {errors.general || disabledMessage}
                </p>
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" fullWidth disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Button>
            </div>
          </motion.div>
        </form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center text-[13px] text-[#64748B] mt-6"
        >
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="text-[#00B8D4] font-semibold hover:text-[#00E5FF] hover:underline transition-colors bg-transparent border-none cursor-pointer p-0"
          >
            Register
          </button>
        </motion.p>
      </motion.div>

      {/* 2. Moved Toast Here & Removed 'fixed' positioning */}
      {/* We use 'mt-6' to give it space below the card */}
      {showSuccess && (
        <div className="mt-6 animate-in slide-in-from-top-2 duration-300 fade-in">
          <Toast text="Login successful 🎉" />
        </div>
      )}
    </div>
  );
};

export default Login;
