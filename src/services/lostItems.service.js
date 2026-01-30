import { supabase } from "../Lib/supabaseClient";

// Fetch all lost items
export const fetchLostItems = async () => {
  const { data, error } = await supabase
    .from("lost_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Fetch single lost item by id
export const fetchLostItemById = async (id) => {
  const { data, error } = await supabase
    .from("lost_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

// Create a new lost item entry
export const createLostItem = async (itemData) => {
  const { data, error } = await supabase
    .from("lost_items")
    .insert(itemData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Mark item as resolved
export const markItemResolved = async (id) => {
  const { data, error } = await supabase
    .from("lost_items")
    .update({ resolved: true })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};
