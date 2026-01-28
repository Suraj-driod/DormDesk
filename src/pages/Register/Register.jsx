import { useState } from 'react';
import { TextInput, Select, Button, ImageUpload } from '../../components/core';
import { theme } from '../../theme';

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
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#E0F7FA] p-4 flex justify-center">
      <div className="w-full max-w-[600px] py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
          <p className="text-base text-gray-600">Join DormDesk to manage your hostel experience</p>
        </div>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          {/* ID Card Upload Section */}
          <section className={`${theme.glass} rounded-2xl p-6 ${theme.glow}`}>
            <ImageUpload
              label="Upload Hostel ID Card"
              helperText="Details like name, hostel, and room will be auto-filled using OCR"
              onChange={handleImageUpload}
              required
            />
          </section>

          {/* Divider */}
          <div className="flex items-center gap-4 text-gray-400 text-xs uppercase tracking-wider">
            <div className="flex-1 h-px bg-gray-200" />
            <span>OR FILL MANUALLY</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Personal Information */}
          <section className={`${theme.glass} rounded-2xl p-6 ${theme.glow}`}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h2>
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
              <Select
                label="Role"
                name="role"
                placeholder="Select your role"
                options={ROLE_OPTIONS}
                value={formData.role}
                onChange={handleChange}
                error={errors.role}
                required
              />
            </div>
          </section>

          {/* Hostel Details */}
          <section className={`${theme.glass} rounded-2xl p-6 ${theme.glow}`}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Hostel Details</h2>
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
          <section className={`${theme.glass} rounded-2xl p-6 ${theme.glow}`}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Security</h2>
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
          <div className="flex flex-col items-center gap-4 pt-2">
            <Button type="submit" fullWidth>
              Register
            </Button>
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button type="button" onClick={onNavigateToLogin} className="text-[#00E5FF] font-semibold hover:text-[#00B8D4] hover:underline transition-colors bg-transparent border-none cursor-pointer p-0">
                Login
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
