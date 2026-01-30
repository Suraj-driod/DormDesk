import { supabase } from "../Lib/supabaseClient";

// Fetch comments for a specific issue
export const fetchCommentsByIssue = async (issueId) => {
  const { data, error } = await supabase
    .from("issue_comments")
    .select("*")
    .eq("issue_id", issueId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Add a new comment
export const addComment = async (commentData) => {
  const { data, error } = await supabase
    .from("issue_comments")
    .insert(commentData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete a comment
export const deleteComment = async (commentId) => {
  const { data, error } = await supabase
    .from("issue_comments")
    .delete()
    .eq("id", commentId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
