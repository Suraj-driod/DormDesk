import { supabase } from "../Lib/supabaseClient";

// Fetch current user's profile
export const fetchMyProfile = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("profile")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) throw error;
  return data;
};

// Update current user's profile
export const updateProfile = async (profileData) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("profile")
    .update(profileData)
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};
