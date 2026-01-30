import { supabase } from "../Lib/supabaseClient";

// Fetch all announcements
export const fetchAnnouncements = async () => {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Create a new announcement
export const createAnnouncement = async (announcementData) => {
  const { data, error } = await supabase
    .from("announcements")
    .insert(announcementData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete an announcement
export const deleteAnnouncement = async (id) => {
  const { data, error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};
