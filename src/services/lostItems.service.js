import { supabase } from "../Lib/supabaseClient";

// Fetch all lost items
export const fetchLostItems = async (filters = {}) => {
  let query = supabase
    .from("lost_items")
    .select(`
      *,
      reported_by_profile:reported_by (id, name, hostel, block),
      claimed_by_profile:claimed_by (id, name)
    `)
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.location) {
    query = query.ilike("location", `%${filters.location}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

// Fetch single lost item by id
export const fetchLostItemById = async (id) => {
  const { data, error } = await supabase
    .from("lost_items")
    .select(`
      *,
      reported_by_profile:reported_by (id, name, email, hostel, block, room_no),
      claimed_by_profile:claimed_by (id, name, email)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

// Create a new lost item entry
export const createLostItem = async (itemData, userId) => {
  const { data, error } = await supabase
    .from("lost_items")
    .insert({
      ...itemData,
      reported_by: userId,
      status: itemData.status || "lost",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update lost item status
export const updateLostItemStatus = async (id, status) => {
  const { data, error } = await supabase
    .from("lost_items")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Mark item as claimed
export const markItemClaimed = async (id, claimedById) => {
  const { data, error } = await supabase
    .from("lost_items")
    .update({
      status: "claimed",
      claimed_by: claimedById,
      claimed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Mark item as found
export const markItemFound = async (id) => {
  const { data, error } = await supabase
    .from("lost_items")
    .update({ status: "found" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete a lost item entry
export const deleteLostItem = async (id) => {
  const { data, error } = await supabase
    .from("lost_items")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Fetch lost items by user
export const fetchUserLostItems = async (userId) => {
  const { data, error } = await supabase
    .from("lost_items")
    .select("*")
    .eq("reported_by", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Search lost items
export const searchLostItems = async (searchQuery) => {
  const { data, error } = await supabase
    .from("lost_items")
    .select(`
      *,
      reported_by_profile:reported_by (name)
    `)
    .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`)
    .neq("status", "claimed")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Get lost items statistics
export const getLostItemStats = async () => {
  const { data, error } = await supabase.from("lost_items").select("status");

  if (error) throw error;

  const stats = {
    total: data.length,
    lost: 0,
    found: 0,
    claimed: 0,
  };

  data.forEach((item) => {
    if (stats[item.status] !== undefined) {
      stats[item.status]++;
    }
  });

  return stats;
};

// Upload lost item image
export const uploadLostItemImage = async (file, userId) => {
  const fileExt = file.name.split(".").pop();
  const fileName = `lost-items/${Date.now()}_${userId}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("lost-items-media")
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage
    .from("lost-items-media")
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
};
