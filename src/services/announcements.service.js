import { supabase } from "../Lib/supabaseClient";

// Fetch all announcements
export const fetchAnnouncements = async (filters = {}) => {
  let query = supabase
    .from("announcements")
    .select(`
      *,
      profiles:created_by (id, name, role)
    `)
    .order("created_at", { ascending: false });

  // Filter by hostel
  if (filters.hostel && filters.hostel !== "All") {
    query = query.or(`target_hostel.eq.All,target_hostel.eq.${filters.hostel}`);
  }

  // Filter by block
  if (filters.block && filters.block !== "All") {
    query = query.or(`target_block.eq.All,target_block.eq.${filters.block}`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

// Fetch single announcement by id
export const fetchAnnouncementById = async (id) => {
  const { data, error } = await supabase
    .from("announcements")
    .select(`
      *,
      profiles:created_by (id, name, role)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

// Create a new announcement (Admin only)
export const createAnnouncement = async (announcementData, userId) => {
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      ...announcementData,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update an announcement
export const updateAnnouncement = async (id, updateData) => {
  const { data, error } = await supabase
    .from("announcements")
    .update(updateData)
    .eq("id", id)
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

// Fetch announcements for a specific user's hostel/block
export const fetchAnnouncementsForUser = async (userHostel, userBlock) => {
  const { data, error } = await supabase
    .from("announcements")
    .select(`
      *,
      profiles:created_by (id, name)
    `)
    .or(`target_hostel.eq.All,target_hostel.eq.${userHostel}`)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Further filter by block on client side
  return data.filter(
    (ann) => ann.target_block === "All" || ann.target_block === userBlock || !ann.target_block
  );
};

// Vote on a poll (if announcement has poll)
export const voteOnPoll = async (announcementId, option, userId) => {
  // Fetch current poll data
  const { data: announcement, error: fetchError } = await supabase
    .from("announcements")
    .select("poll_data")
    .eq("id", announcementId)
    .single();

  if (fetchError) throw fetchError;

  const pollData = announcement.poll_data;
  if (!pollData) throw new Error("No poll data found");

  // Check if user already voted
  if (pollData.voters?.includes(userId)) {
    throw new Error("You have already voted");
  }

  // Update vote count
  pollData.votes[option] = (pollData.votes[option] || 0) + 1;
  pollData.total_votes = (pollData.total_votes || 0) + 1;
  pollData.voters = [...(pollData.voters || []), userId];

  // Save updated poll data
  const { data, error } = await supabase
    .from("announcements")
    .update({ poll_data: pollData })
    .eq("id", announcementId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get recent announcements (last 7 days)
export const fetchRecentAnnouncements = async (limit = 5) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error } = await supabase
    .from("announcements")
    .select(`
      id, title, content, created_at, target_hostel,
      profiles:created_by (name)
    `)
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};
