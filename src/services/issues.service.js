import { supabase } from "../Lib/supabaseClient";
import { processNewIssue } from "./geminiSimilarity.service";

// Fetch all issues
export const fetchIssues = async (filters = {}) => {
  let query = supabase
    .from("issues")
    .select(`
      *,
      profiles:created_by (id, name, hostel, block, room_no),
      assigned_profile:assigned_to (id, name),
      upvotes:issue_upvotes (count),
      comments:issue_comments (count)
    `)
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.category) {
    query = query.eq("category", filters.category);
  }
  if (filters.visibility) {
    query = query.eq("visibility", filters.visibility);
  }
  if (filters.hostel) {
    query = query.eq("hostel", filters.hostel);
  }
  if (filters.priority) {
    query = query.eq("priority", filters.priority);
  }
  if (filters.created_by) {
    query = query.eq("created_by", filters.created_by);
  }
  if (filters.assigned_to) {
    query = query.eq("assigned_to", filters.assigned_to);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

// Fetch single issue by id
export const fetchIssueById = async (id) => {
  const { data, error } = await supabase
    .from("issues")
    .select(`
      *,
      profiles:created_by (id, name, email, hostel, block, room_no),
      assigned_profile:assigned_to (id, name, email),
      upvotes:issue_upvotes (count),
      comments:issue_comments (
        id, content, created_at,
        user:user_id (id, name)
      )
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

// Create a new issue with similarity detection
export const createIssue = async (issueData, useSimilarityCheck = true) => {
  if (useSimilarityCheck) {
    // Use Gemini to check for similar issues
    const result = await processNewIssue(issueData);
    return result;
  }

  // Direct insert without similarity check
  const { data, error } = await supabase
    .from("issues")
    .insert({
      ...issueData,
      repost_count: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return { isDuplicate: false, issue: data, message: "Issue reported successfully!" };
};

// Update issue status
export const updateIssueStatus = async (id, status, changedBy, note = null) => {
  // Get current status for logging
  const { data: currentIssue } = await supabase
    .from("issues")
    .select("status")
    .eq("id", id)
    .single();

  // Update the issue
  const updateData = { status };
  if (status === "resolved") {
    updateData.resolved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("issues")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Log status change
  await supabase.from("issue_status_logs").insert({
    issue_id: id,
    old_status: currentIssue?.status,
    new_status: status,
    changed_by: changedBy,
    note,
  });

  return data;
};

// Assign issue to caretaker
export const assignIssue = async (issueId, caretakerId, assignedBy) => {
  const { data, error } = await supabase
    .from("issues")
    .update({
      assigned_to: caretakerId,
      status: "assigned",
    })
    .eq("id", issueId)
    .select()
    .single();

  if (error) throw error;

  // Log the assignment
  await supabase.from("issue_status_logs").insert({
    issue_id: issueId,
    old_status: "reported",
    new_status: "assigned",
    changed_by: assignedBy,
    note: `Assigned to caretaker`,
  });

  return data;
};

// Update issue priority
export const updateIssuePriority = async (id, priority) => {
  const { data, error } = await supabase
    .from("issues")
    .update({ priority })
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

// Fetch issues for public feed
export const fetchIssuesForFeed = async () => {
  const { data, error } = await supabase
    .from("issues")
    .select(`
      id, title, description, created_at, status, visibility, category, priority, repost_count,
      profiles:created_by (name),
      upvotes:issue_upvotes (count),
      comments:issue_comments (count)
    `)
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Fetch issues assigned to a specific caretaker
export const fetchAssignedIssues = async (caretakerId) => {
  const { data, error } = await supabase
    .from("issues")
    .select(`
      *,
      profiles:created_by (id, name, hostel, block, room_no)
    `)
    .eq("assigned_to", caretakerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Get issue statistics for dashboard
export const getIssueStats = async () => {
  const { data, error } = await supabase.from("issues").select("status, category, priority");

  if (error) throw error;

  const stats = {
    total: data.length,
    byStatus: {},
    byCategory: {},
    byPriority: {},
  };

  data.forEach((issue) => {
    stats.byStatus[issue.status] = (stats.byStatus[issue.status] || 0) + 1;
    stats.byCategory[issue.category] = (stats.byCategory[issue.category] || 0) + 1;
    stats.byPriority[issue.priority] = (stats.byPriority[issue.priority] || 0) + 1;
  });

  return stats;
};

// Get pending issues (not assigned)
export const fetchPendingIssues = async () => {
  const { data, error } = await supabase
    .from("issues")
    .select(`
      *,
      profiles:created_by (id, name, hostel, block, room_no)
    `)
    .is("assigned_to", null)
    .eq("status", "reported")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
};
