import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  User, Mail, Phone, MapPin, Building, 
  LogOut, Edit2, Shield, Camera, Briefcase, BarChart3
} from "lucide-react";
import { theme } from "../../theme";
import { Button, AlertModal } from "../../UI/Glow";
import { useAuth } from "../../auth/AuthContext";
import { fetchUserProfile, updateUserProfile } from "../../services/profile.service";
import { useAlert } from "../../hooks/useAlert";

const ProfileField = ({ icon: Icon, label, value, editable, fieldKey, editValue, onEditChange }) => (
  <div className="flex items-center gap-4 p-4 bg-white/50 border border-[#E6FBFF] rounded-2xl hover:border-[#00E5FF]/50 transition-colors group">
    <div className="w-10 h-10 rounded-full bg-[#E0F7FA] flex items-center justify-center text-[#00B8D4] group-hover:bg-[#00E5FF] group-hover:text-white transition-colors shadow-sm">
      <Icon size={18} strokeWidth={2.5} />
    </div>
    <div className="flex-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      {editable ? (
        <input
          type="text"
          value={editValue ?? ''}
          onChange={(e) => onEditChange?.(e.target.value)}
          className="w-full text-sm font-medium text-gray-800 border-b border-gray-300 focus:border-[#00E5FF] outline-none py-1 bg-transparent"
        />
      ) : (
        <p className="text-sm font-medium text-gray-800">{value || "-"}</p>
      )}
    </div>
  </div>
);

const Profile = () => {
  const { user, profile: authProfile, logout, refreshProfile, isAdmin, isCaretaker, isStudent } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState({});
  const { alertState, closeAlert, error: showError } = useAlert();

  useEffect(() => {
    if (!user) return;
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      const userId = user.uid || user.id;
      const userEmail = user.email;
      
      // Pass both userId and email for proper management/users lookup
      let data = await fetchUserProfile(userId, userEmail);
      
      // Fallback to auth profile if Firestore profile doesn't exist
      if (!data && authProfile) {
        data = {
          ...authProfile,
          id: userId,
          email: userEmail,
          name: authProfile.name || user.displayName || userEmail?.split("@")[0],
        };
      }
      
      // Final fallback to basic user info
      if (!data) {
        data = {
          id: userId,
          email: userEmail,
          name: user.displayName || userEmail?.split("@")[0],
          role: "student",
        };
      }
      
      setProfile(data);
      setEditForm({
        phone: data?.phone || '',
        hostel: data?.hostel || '',
        block: data?.block || '',
        room_no: data?.room_no || '',
      });
    } catch (error) {
      console.error("Error loading profile:", error);
      // Use auth profile as fallback on error
      if (authProfile || user) {
        setProfile({
          id: user.uid || user.id,
          email: user.email,
          name: authProfile?.name || user.displayName || user.email?.split("@")[0],
          role: authProfile?.role || "student",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const userId = user.uid || user.id;
      const userEmail = user.email;
      // Pass email for management users (document ID = email)
      await updateUserProfile(userId, editForm, profile?.role, userEmail);
      await loadProfile();
      await refreshProfile();
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      showError("Failed to update profile. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#00E5FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile && !loading) {
    // This shouldn't happen with fallbacks, but just in case
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-700 mb-2">Profile Loading Issue</h2>
          <p className="text-gray-500 mb-4">Unable to load your profile. Please try again.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-[#00B8D4] text-white rounded-full font-medium"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Role-specific theming
  const getRoleTheme = () => {
    if (isAdmin) return { bg: "bg-red-500", label: "Administrator", color: "text-red-600", gradient: "from-red-500 to-orange-400" };
    if (isCaretaker) return { bg: "bg-purple-500", label: "Caretaker", color: "text-purple-600", gradient: "from-purple-500 to-pink-400" };
    return { bg: "bg-[#00B8D4]", label: "Student", color: "text-[#00B8D4]", gradient: "from-[#00B8D4] to-[#00E5FF]" };
  };

  const roleTheme = getRoleTheme();

  const StatCard = ({ label, count, color, icon: Icon }) => (
    <div className="flex-1 bg-white/60 backdrop-blur border border-[#E6FBFF] p-4 rounded-2xl text-center shadow-sm relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-1 ${color}`} />
      {Icon && (
        <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gray-50 flex items-center justify-center">
          <Icon size={16} className="text-gray-500" />
        </div>
      )}
      <p className="text-2xl font-bold text-gray-800">{count}</p>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">{label}</p>
    </div>
  );

  // Role-specific stats
  const renderStats = () => {
    if (isAdmin) {
      const s = profile.stats || {};
      return (
        <div className="flex gap-4">
          <StatCard label="Total Issues" count={s.totalIssues ?? 0} color="bg-blue-400" icon={BarChart3} />
          <StatCard label="Announcements" count={s.announcements ?? 0} color="bg-green-400" icon={BarChart3} />
          <StatCard label="Pending Complaints" count={s.pendingComplaints ?? 0} color="bg-orange-400" icon={BarChart3} />
        </div>
      );
    }

    if (!profile.stats) return null;

    if (isCaretaker) {
      return (
        <div className="flex gap-4">
          <StatCard label="Assigned" count={profile.stats.assigned} color="bg-blue-400" icon={Briefcase} />
          <StatCard label="Completed" count={profile.stats.completed} color="bg-green-400" icon={Briefcase} />
          <StatCard label="In Progress" count={profile.stats.inProgress} color="bg-yellow-400" icon={Briefcase} />
        </div>
      );
    }

    // Student
    return (
      <div className="flex gap-4">
        <StatCard label="Reported" count={profile.stats.reported} color="bg-blue-400" />
        <StatCard label="Resolved" count={profile.stats.resolved} color="bg-green-400" />
        <StatCard label="Pending" count={profile.stats.pending} color="bg-yellow-400" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0FEFF] to-white py-8 px-4 font-['Poppins',sans-serif]">
      <AlertModal {...alertState} onClose={closeAlert} />
      
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
                <div className={`w-32 h-32 rounded-full p-1 bg-gradient-to-tr ${roleTheme.gradient} shadow-[0_0_25px_rgba(0,229,255,0.4)]`}>
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
              <span className={`mt-1 px-3 py-1 ${roleTheme.bg} text-white text-xs font-bold uppercase tracking-wide rounded-full`}>
                {roleTheme.label}
              </span>

              {profile.email && (
                <p className="text-sm text-gray-500 mt-2">{profile.email}</p>
              )}

              <div className="w-full h-px bg-gray-100 my-6" />

              {/* Actions */}
              <div className="w-full space-y-3 mt-auto">
                <Button onClick={() => {
                  if (isEditing) {
                    handleSave();
                  } else {
                    setIsEditing(true);
                  }
                }}>
                  <Edit2 size={16} />
                  {isEditing ? "Save Changes" : "Edit Profile"}
                </Button>
                
                {isEditing && (
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full text-gray-600 font-bold text-[15px] bg-gray-100 hover:bg-gray-200 transition-all duration-300"
                  >
                    Cancel
                  </button>
                )}
                
                <button 
                  onClick={logout}
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
            {renderStats()}

            {/* Info Card */}
            <div className="bg-white/70 backdrop-blur rounded-[28px] p-8 border border-[#E6FBFF] shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <User size={20} className={roleTheme.color} />
                Personal Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <ProfileField icon={Mail} label="Email Address" value={profile.email} />
                <ProfileField
                  icon={Phone}
                  label="Phone Number"
                  value={profile.phone}
                  editable={isEditing}
                  fieldKey="phone"
                  editValue={editForm.phone}
                  onEditChange={(val) => setEditForm((prev) => ({ ...prev, phone: val }))}
                />
              </div>

              {(isStudent || isCaretaker) && (
                <>
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Building size={20} className={roleTheme.color} />
                    {isCaretaker ? "Assigned Area" : "Hostel Information"}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ProfileField
                      icon={Building}
                      label={isCaretaker ? "Hostel Block" : "Hostel Name"}
                      value={profile.hostel || profile.hostel_block}
                      editable={isStudent && isEditing}
                      fieldKey="hostel"
                      editValue={editForm.hostel}
                      onEditChange={(val) => setEditForm((prev) => ({ ...prev, hostel: val }))}
                    />
                    {isStudent && (
                      <>
                        <ProfileField
                          icon={MapPin}
                          label="Block & Room"
                          value={(`${profile.block || ''}, Room ${profile.room_no || ''}`).trim() || '-'}
                          editable={isEditing}
                          fieldKey="block"
                          editValue={editForm.block}
                          onEditChange={(val) => setEditForm((prev) => ({ ...prev, block: val }))}
                        />
                        <ProfileField icon={Shield} label="Floor" value={profile.floor} />
                      </>
                    )}
                    {isCaretaker && (
                      <ProfileField icon={MapPin} label="Floor Assignment" value={profile.floor || "All Floors"} />
                    )}

                    {/* Verification Status */}
                    <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-100 rounded-2xl">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <Shield size={18} strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Account Status</p>
                        <p className="text-sm font-medium text-gray-800">Verified</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {isAdmin && (
                <>
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Shield size={20} className={roleTheme.color} />
                    Admin Privileges
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 border border-green-100 rounded-2xl">
                      <p className="text-xs font-semibold text-green-600 uppercase">Announcements</p>
                      <p className="text-sm font-medium text-gray-800">Full Access</p>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                      <p className="text-xs font-semibold text-blue-600 uppercase">Issue Management</p>
                      <p className="text-sm font-medium text-gray-800">Full Access</p>
                    </div>
                    <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl">
                      <p className="text-xs font-semibold text-purple-600 uppercase">Complaints</p>
                      <p className="text-sm font-medium text-gray-800">Full Access</p>
                    </div>
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                      <p className="text-xs font-semibold text-orange-600 uppercase">Caretaker Assignment</p>
                      <p className="text-sm font-medium text-gray-800">Full Access</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
