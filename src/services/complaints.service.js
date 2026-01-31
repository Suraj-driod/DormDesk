import { supabase } from "../Lib/supabaseClient";

// Fetch all complaints
export const fetchComplaints = async (filters = {}) => {
  let query = supabase
    .from("complaints")
    .select(`
      *,
      raised_by_profile:raised_by (id, name, hostel, block, room_no),
      accused_profile:accused_user_id (id, name)
    `)
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.complaint_type) {
    query = query.eq("complaint_type", filters.complaint_type);
  }
  if (filters.raised_by) {
    query = query.eq("raised_by", filters.raised_by);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

// Fetch single complaint by id
export const fetchComplaintById = async (id) => {
  const { data, error } = await supabase
    .from("complaints")
    .select(`
      *,
      raised_by_profile:raised_by (id, name, email, hostel, block, room_no),
      accused_profile:accused_user_id (id, name, email)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

// Create a new complaint
export const createComplaint = async (complaintData, userId) => {
  const { data, error } = await supabase
    .from("complaints")
    .insert({
      ...complaintData,
      raised_by: userId,
      status: "submitted",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update complaint status (Admin only)
export const updateComplaintStatus = async (id, status, closedAt = null) => {
  const updateData = { status };
  
  if (status === "closed") {
    updateData.closed_at = closedAt || new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("complaints")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete a complaint
export const deleteComplaint = async (id) => {
  const { data, error } = await supabase
    .from("complaints")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Fetch complaints by user
export const fetchUserComplaints = async (userId) => {
  const { data, error } = await supabase
    .from("complaints")
    .select(`
      *,
      accused_profile:accused_user_id (id, name)
    `)
    .eq("raised_by", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Get complaint statistics
export const getComplaintStats = async () => {
  const { data, error } = await supabase
    .from("complaints")
    .select("status, complaint_type");

  if (error) throw error;

  const stats = {
    total: data.length,
    byStatus: {},
    byType: {},
  };

  data.forEach((complaint) => {
    stats.byStatus[complaint.status] = (stats.byStatus[complaint.status] || 0) + 1;
    stats.byType[complaint.complaint_type] = (stats.byType[complaint.complaint_type] || 0) + 1;
  });

  return stats;
};

// Fetch pending complaints for admin
export const fetchPendingComplaints = async () => {
  const { data, error } = await supabase
    .from("complaints")
    .select(`
      *,
      raised_by_profile:raised_by (id, name, hostel),
      accused_profile:accused_user_id (id, name)
    `)
    .in("status", ["submitted", "under_review"])
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
};
