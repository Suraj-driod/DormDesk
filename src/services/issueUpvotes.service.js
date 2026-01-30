import { supabase } from "../Lib/supabaseClient";

// Add an upvote to an issue
export const addUpvote = async (issueId) => {
  const { data, error } = await supabase
    .from("issue_upvotes")
    .insert({ issue_id: issueId })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Remove an upvote from an issue
export const removeUpvote = async (issueId) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("issue_upvotes")
    .delete()
    .eq("issue_id", issueId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get upvote count for an issue
export const getUpvoteCount = async (issueId) => {
  const { count, error } = await supabase
    .from("issue_upvotes")
    .select("*", { count: "exact", head: true })
    .eq("issue_id", issueId);

  if (error) throw error;
  return count;
};
