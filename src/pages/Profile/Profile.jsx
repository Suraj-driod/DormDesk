import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  User, Mail, Phone, MapPin, Building, 
  LogOut, Edit2, Shield, Camera 
} from "lucide-react";
import { theme } from "../../theme"; // Assuming you have your theme file
import { Button } from "../../page/Glow"; // Your custom Button

// Mock User Data
const MOCK_USER = {
  name: "Aryan Sharma",
  role: "Student",
  email: "aryan.sharma@college.edu",
  phone: "+91 98765 43210",
  hostel: "Krishna Hostel",
  block: "Block A",
  room: "304",
  floor: "3rd Floor",
  avatarUrl: null, // Set to a URL string to test image
  stats: {
    reported: 12,
    resolved: 10,
    pending: 2
  }
};

const Profile = ({ onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const ProfileField = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-4 p-4 bg-white/50 border border-[#E6FBFF] rounded-2xl hover:border-[#00E5FF]/50 transition-colors group">
      <div className="w-10 h-10 rounded-full bg-[#E0F7FA] flex items-center justify-center text-[#00B8D4] group-hover:bg-[#00E5FF] group-hover:text-white transition-colors shadow-sm">
        <Icon size={18} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );

  const StatCard = ({ label, count, color }) => (
    <div className="flex-1 bg-white/60 backdrop-blur border border-[#E6FBFF] p-4 rounded-2xl text-center shadow-sm relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-1 ${color}`} />
      <p className="text-2xl font-bold text-gray-800">{count}</p>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">{label}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0FEFF] to-white py-8 px-4 font-['Poppins',sans-serif]">
      <motion.div 
        className="max-w-4xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        {/* Header Title */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Profile</h1>
          <p className="text-gray-500">Manage your personal information and account settings</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column: Avatar & Quick Actions */}
          <motion.div variants={itemVariants} className="md:col-span-1">
            <div className={`bg-white/70 backdrop-blur rounded-[28px] p-6 border border-[#E6FBFF] ${theme.glow} flex flex-col items-center text-center h-full`}>
              
              {/* Avatar Circle */}
              <div className="relative mb-4 group cursor-pointer">
                <div className={`w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-[#00E5FF] to-[#00B8D4] shadow-[0_0_25px_rgba(0,229,255,0.4)]`}>
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    {MOCK_USER.avatarUrl ? (
                      <img src={MOCK_USER.avatarUrl} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      <User size={64} className="text-gray-300" />
                    )}
                  </div>
                </div>
                <div className="absolute bottom-1 right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md text-[#00B8D4]">
                  <Camera size={16} />
                </div>
              </div>

              {/* Name & Role */}
              <h2 className="text-xl font-bold text-gray-800">{MOCK_USER.name}</h2>
              <span className="mt-1 px-3 py-1 bg-[#E0F7FA] text-[#00B8D4] text-xs font-bold uppercase tracking-wide rounded-full">
                {MOCK_USER.role}
              </span>

              {/* Divider */}
              <div className="w-full h-px bg-gray-100 my-6" />

              {/* Action Buttons */}
              <div className="w-full space-y-3 mt-auto">
                <Button onClick={() => setIsEditing(!isEditing)}>
                  <Edit2 size={16} />
                  {isEditing ? "Save Changes" : "Edit Profile"}
                </Button>
                
                <button 
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full text-[#EF4444] font-bold text-[15px] bg-red-50 hover:bg-red-100 transition-all duration-300"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Details & Stats */}
          <motion.div variants={itemVariants} className="md:col-span-2 space-y-6">
            
            {/* Stats Row */}
            <div className="flex gap-4">
              <StatCard label="Reported" count={MOCK_USER.stats.reported} color="bg-blue-400" />
              <StatCard label="Resolved" count={MOCK_USER.stats.resolved} color="bg-green-400" />
              <StatCard label="Pending" count={MOCK_USER.stats.pending} color="bg-yellow-400" />
            </div>

            {/* Information Card */}
            <div className={`bg-white/70 backdrop-blur rounded-[28px] p-8 border border-[#E6FBFF] shadow-sm`}>
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <User size={20} className="text-[#00B8D4]" />
                Personal Details
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <ProfileField icon={Mail} label="Email Address" value={MOCK_USER.email} />
                <ProfileField icon={Phone} label="Phone Number" value={MOCK_USER.phone} />
              </div>

              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Building size={20} className="text-[#00B8D4]" />
                Hostel Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ProfileField icon={Building} label="Hostel Name" value={MOCK_USER.hostel} />
                <ProfileField icon={MapPin} label="Block & Room" value={`${MOCK_USER.block}, Room ${MOCK_USER.room}`} />
                <ProfileField icon={Shield} label="Floor" value={MOCK_USER.floor} />
                
                {/* ID Card Status (Visual flair) */}
                <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-100 rounded-2xl">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <Shield size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">ID Status</p>
                    <p className="text-sm font-medium text-gray-800">Verified</p>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
};

export default Profile;