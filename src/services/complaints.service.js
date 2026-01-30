import { supabase } from "../Lib/supabaseClient";

// Fetch all complaints
export const fetchComplaints = async () => {
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Fetch single complaint by id
export const fetchComplaintById = async (id) => {
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

// Create a new complaint
export const createComplaint = async (complaintData) => {
  const { data, error } = await supabase
    .from("complaints")
    .insert(complaintData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update complaint status
export const updateComplaintStatus = async (id, status) => {
  const { data, error } = await supabase
    .from("complaints")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};
