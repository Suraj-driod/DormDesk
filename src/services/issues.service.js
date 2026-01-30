import { supabase } from "../Lib/supabaseClient";

// Fetch all issues
export const fetchIssues = async () => {
  const { data, error } = await supabase
    .from("issues")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Fetch single issue by id
export const fetchIssueById = async (id) => {
  const { data, error } = await supabase
    .from("issues")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

// Create a new issue
export const createIssue = async (issueData) => {
  const { data, error } = await supabase
    .from("issues")
    .insert(issueData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update issue status
export const updateIssueStatus = async (id, status) => {
  const { data, error } = await supabase
    .from("issues")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete an issue
export const deleteIssue = async (id) => {
  const { data, error } = await supabase
    .from("issues")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};
