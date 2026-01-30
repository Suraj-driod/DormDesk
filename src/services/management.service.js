import { supabase } from "../Lib/supabaseClient";

// Fetch all management users
export const fetchManagementUsers = async () => {
  const { data, error } = await supabase
    .from("management")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Create a new management user
export const createManagementUser = async (userData) => {
  const { data, error } = await supabase
    .from("management")
    .insert(userData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Fetch caretakers by hostel name
export const fetchCaretakersByHostel = async (hostelName) => {
  const { data, error } = await supabase
    .from("management")
    .select("*")
    .eq("hostel_name", hostelName)
    .eq("role", "caretaker")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Add a new caretaker
export const addCaretaker = async (caretakerData) => {
  const { data, error } = await supabase
    .from("management")
    .insert({ ...caretakerData, role: "caretaker" })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update caretaker details
export const updateCaretaker = async (id, caretakerData) => {
  const { data, error } = await supabase
    .from("management")
    .update(caretakerData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete a caretaker
export const deleteCaretaker = async (id) => {
  const { data, error } = await supabase
    .from("management")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};
