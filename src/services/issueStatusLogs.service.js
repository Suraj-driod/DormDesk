import { supabase } from "../Lib/supabaseClient";

// Fetch status logs for a specific issue
export const fetchStatusLogs = async (issueId) => {
  const { data, error } = await supabase
    .from("issue_status_logs")
    .select("*")
    .eq("issue_id", issueId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Add a new status log entry
export const addStatusLog = async (logData) => {
  const { data, error } = await supabase
    .from("issue_status_logs")
    .insert(logData)
    .select()
    .single();

  if (error) throw error;
  return data;
};
