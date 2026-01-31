import { supabase } from "../Lib/supabaseClient";

// Fetch user profile
export const fetchUserProfile = async (userId) => {
  // First check management table (admin/caretaker)
  const { data: mgmtData, error: mgmtError } = await supabase
    .from("management")
    .select("*")
    .eq("id", userId)
    .single();

  if (mgmtData && !mgmtError) {
    return {
      ...mgmtData,
      role: mgmtData.role,
      name: mgmtData.full_name,
      hostel: mgmtData.hostel_block,
      avatarUrl: null, // Add avatar support if needed
      stats: await getUserStats(userId, mgmtData.role),
    };
  }

  // Fallback to profiles table (student)
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileData && !profileError) {
    return {
      ...profileData,
      avatarUrl: null,
      stats: await getUserStats(userId, profileData.role || "student"),
    };
  }

  return null;
};

// Get user statistics based on role
export const getUserStats = async (userId, role) => {
  if (role === "student") {
    // Student stats: reported, resolved, pending issues
    const { data: issues } = await supabase
      .from("issues")
      .select("status")
      .eq("created_by", userId);

    const stats = {
      reported: issues?.length || 0,
      resolved: issues?.filter((i) => i.status === "resolved" || i.status === "closed").length || 0,
      pending: issues?.filter((i) => !["resolved", "closed"].includes(i.status)).length || 0,
    };

    return stats;
  }

  if (role === "caretaker") {
    // Caretaker stats: assigned, completed, in-progress
    const { data: issues } = await supabase
      .from("issues")
      .select("status")
      .eq("assigned_to", userId);

    return {
      assigned: issues?.length || 0,
      completed: issues?.filter((i) => i.status === "resolved" || i.status === "closed").length || 0,
      inProgress: issues?.filter((i) => i.status === "in_progress").length || 0,
    };
  }

  if (role === "admin") {
    // Admin stats: total issues, announcements, complaints
    const [
      { count: totalIssues },
      { count: totalAnnouncements },
      { count: pendingComplaints },
    ] = await Promise.all([
      supabase.from("issues").select("*", { count: "exact", head: true }),
      supabase.from("announcements").select("*", { count: "exact", head: true }),
      supabase.from("complaints").select("*", { count: "exact", head: true }).in("status", ["submitted", "under_review"]),
    ]);

    return {
      totalIssues: totalIssues || 0,
      announcements: totalAnnouncements || 0,
      pendingComplaints: pendingComplaints || 0,
    };
  }

  return { reported: 0, resolved: 0, pending: 0 };
};

// Update user profile
export const updateUserProfile = async (userId, updateData, role) => {
  const table = role === "admin" || role === "caretaker" ? "management" : "profiles";

  const { data, error } = await supabase
    .from(table)
    .update(updateData)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Create profile (after signup)
export const createProfile = async (userId, profileData) => {
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      ...profileData,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Upload profile avatar
export const uploadAvatar = async (file, userId) => {
  const fileExt = file.name.split(".").pop();
  const fileName = `avatars/${userId}.${fileExt}`;

  // Delete existing avatar if any
  await supabase.storage.from("avatars").remove([fileName]);

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
};

// Fetch all caretakers (for admin assignment)
export const fetchCaretakers = async () => {
  const { data, error } = await supabase
    .from("management")
    .select("*")
    .eq("role", "caretaker")
    .eq("is_active", true)
    .order("full_name");

  if (error) throw error;
  return data;
};

// Fetch caretakers by hostel
export const fetchCaretakersByHostel = async (hostelBlock) => {
  const { data, error } = await supabase
    .from("management")
    .select("*")
    .eq("role", "caretaker")
    .eq("hostel_block", hostelBlock)
    .eq("is_active", true);

  if (error) throw error;
  return data;
};
