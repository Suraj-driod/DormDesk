import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  User, Mail, Phone, MapPin, Building, 
  LogOut, Edit2, Shield, Camera 
} from "lucide-react";
import { theme } from "../../theme";
import { Button } from "../../UI/Glow";
import { NotFound } from "../../UI/Glow";
import { useAuth } from "../../auth/AuthContext";
// TODO: create FetchProfile service
const fetchUserProfile = async () => null;

const Profile = () => {
  const { user, supabase, logout } = useAuth();   // global auth
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const data = await fetchUserProfile(supabase, user);
      setProfile(data);
      setLoading(false);
    };

    loadProfile();
  }, [user, supabase]);

  /* ================= STATES ================= */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading profile...
      </div>
    );
  }

  // ❌ Not found → NotFound Component
  if (!profile && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
        <div className="w-full max-w-lg">
          <NotFound />
        </div>
      </div>
    );
  }

  /* ================= UI COMPONENTS ================= */

  const ProfileField = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-4 p-4 bg-white/50 border border-[#E6FBFF] rounded-2xl hover:border-[#00E5FF]/50 transition-colors group">
      <div className="w-10 h-10 rounded-full bg-[#E0F7FA] flex items-center justify-center text-[#00B8D4] group-hover:bg-[#00E5FF] group-hover:text-white transition-colors shadow-sm">
        <Icon size={18} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value || "-"}</p>
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

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0FEFF] to-white py-8 px-4 font-['Poppins',sans-serif]">
      <motion.div 
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Profile</h1>
          <p className="text-gray-500">Manage your personal information and account settings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column */}
          <div className="md:col-span-1">
            <div className={`bg-white/70 backdrop-blur rounded-[28px] p-6 border border-[#E6FBFF] ${theme.glow} flex flex-col items-center text-center h-full`}>
              
              {/* Avatar */}
              <div className="relative mb-4 group cursor-pointer">
                <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-[#00E5FF] to-[#00B8D4] shadow-[0_0_25px_rgba(0,229,255,0.4)]">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt="User" className="w-full h-full object-cover" />
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
              <h2 className="text-xl font-bold text-gray-800">{profile.name}</h2>
              <span className="mt-1 px-3 py-1 bg-[#E0F7FA] text-[#00B8D4] text-xs font-bold uppercase tracking-wide rounded-full">
                {profile.role}
              </span>

              <div className="w-full h-px bg-gray-100 my-6" />

              {/* Actions */}
              <div className="w-full space-y-3 mt-auto">
                <Button onClick={() => setIsEditing(!isEditing)}>
                  <Edit2 size={16} />
                  {isEditing ? "Save Changes" : "Edit Profile"}
                </Button>
                
                <button 
                  onClick={logout}   // ✅ global logout
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full text-[#EF4444] font-bold text-[15px] bg-red-50 hover:bg-red-100 transition-all duration-300"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Stats */}
            <div className="flex gap-4">
              <StatCard label="Reported" count={profile.stats.reported} color="bg-blue-400" />
              <StatCard label="Resolved" count={profile.stats.resolved} color="bg-green-400" />
              <StatCard label="Pending" count={profile.stats.pending} color="bg-yellow-400" />
            </div>

            {/* Info Card */}
            <div className="bg-white/70 backdrop-blur rounded-[28px] p-8 border border-[#E6FBFF] shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <User size={20} className="text-[#00B8D4]" />
                Personal Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <ProfileField icon={Mail} label="Email Address" value={profile.email} />
                <ProfileField icon={Phone} label="Phone Number" value={profile.phone} />
              </div>

              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Building size={20} className="text-[#00B8D4]" />
                Hostel Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ProfileField icon={Building} label="Hostel Name" value={profile.hostel} />
                <ProfileField icon={MapPin} label="Block & Room" value={`${profile.block}, Room ${profile.room}`} />
                <ProfileField icon={Shield} label="Floor" value={profile.floor} />

                {/* ID Status */}
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
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
