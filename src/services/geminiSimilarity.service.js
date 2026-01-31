import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "../Lib/supabaseClient";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Threshold for similarity (0-1)
const SIMILARITY_THRESHOLD = 0.75;

// Repost count threshold for priority escalation
const REPOST_THRESHOLD = 5;

/**
 * Detect similar posts using Gemini AI
 * @param {string} newTitle - Title of the new post
 * @param {string} newDescription - Description of the new post
 * @param {string} category - Category of the issue
 * @returns {Object|null} - Similar post if found, null otherwise
 */
export const detectSimilarPost = async (newTitle, newDescription, category) => {
  try {
    if (!API_KEY) {
      console.warn("Gemini API key not found, skipping similarity check");
      return null;
    }

    // Fetch existing issues in the same category (last 30 days, not closed)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: existingIssues, error } = await supabase
      .from("issues")
      .select("id, title, description, repost_count, priority")
      .eq("category", category)
      .neq("status", "closed")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .limit(50);

    if (error || !existingIssues?.length) {
      return null;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are a similarity detection engine for a hostel issue reporting system.
      
      NEW POST:
      Title: "${newTitle}"
      Description: "${newDescription}"
      
      EXISTING POSTS:
      ${existingIssues.map((issue, i) => `
        [${i}] ID: ${issue.id}
        Title: "${issue.title}"
        Description: "${issue.description || 'No description'}"
      `).join('\n')}
      
      Task: Find if the NEW POST is semantically similar to any EXISTING POST.
      Consider:
      1. Same problem/issue being reported
      2. Similar location mentioned
      3. Same type of complaint
      
      Response format (JSON only, no markdown):
      {
        "isSimilar": true/false,
        "matchIndex": <index of most similar post or -1>,
        "confidence": <0.0 to 1.0>,
        "reason": "<brief explanation>"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    if (parsed.isSimilar && parsed.confidence >= SIMILARITY_THRESHOLD && parsed.matchIndex >= 0) {
      const matchedIssue = existingIssues[parsed.matchIndex];
      return {
        ...matchedIssue,
        similarityConfidence: parsed.confidence,
        similarityReason: parsed.reason,
      };
    }

    return null;
  } catch (error) {
    console.error("Similarity detection error:", error);
    return null;
  }
};

/**
 * Increment repost count and potentially escalate priority
 * @param {string} issueId - ID of the existing similar issue
 * @returns {Object} - Updated issue data
 */
export const incrementRepostCount = async (issueId) => {
  try {
    // First get current repost count
    const { data: currentIssue, error: fetchError } = await supabase
      .from("issues")
      .select("repost_count, priority")
      .eq("id", issueId)
      .single();

    if (fetchError) throw fetchError;

    const newRepostCount = (currentIssue.repost_count || 0) + 1;
    let newPriority = currentIssue.priority;

    // Escalate priority every 5 reposts (if not already high/emergency)
    if (newRepostCount % REPOST_THRESHOLD === 0) {
      const priorityLevels = ["low", "medium", "high", "emergency"];
      const currentIndex = priorityLevels.indexOf(currentIssue.priority);
      
      if (currentIndex < priorityLevels.length - 1 && currentIndex !== -1) {
        newPriority = priorityLevels[currentIndex + 1];
      } else if (currentIndex === -1) {
        newPriority = "medium"; // Default escalation
      }
    }

    // Update the issue
    const { data: updatedIssue, error: updateError } = await supabase
      .from("issues")
      .update({
        repost_count: newRepostCount,
        priority: newPriority,
      })
      .eq("id", issueId)
      .select()
      .single();

    if (updateError) throw updateError;

    return {
      ...updatedIssue,
      priorityEscalated: newPriority !== currentIssue.priority,
    };
  } catch (error) {
    console.error("Error incrementing repost count:", error);
    throw error;
    
  }
};

/**
 * Process new issue submission with similarity check
 * @param {Object} issueData - New issue data
 * @returns {Object} - Result with either new issue or merged info
 */
export const processNewIssue = async (issueData) => {
  const { title, description, category } = issueData;

  // Check for similar post
  const similarPost = await detectSimilarPost(title, description, category);

  if (similarPost) {
    // Similar post found - increment repost count instead of creating new
    const updatedIssue = await incrementRepostCount(similarPost.id);

    return {
      isDuplicate: true,
      originalIssue: updatedIssue,
      message: `Similar issue found: "${similarPost.title}". Your report has been merged and the issue priority ${
        updatedIssue.priorityEscalated ? "has been escalated" : "remains unchanged"
      }. Repost count: ${updatedIssue.repost_count}`,
      similarityReason: similarPost.similarityReason,
    };
  }

  // No similar post - create new issue
  const { data: newIssue, error } = await supabase
    .from("issues")
    .insert({
      ...issueData,
      repost_count: 0,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    isDuplicate: false,
    issue: newIssue,
    message: "Issue reported successfully!",
  };
};

/**
 * Get similarity suggestions while typing (debounced usage recommended)
 * @param {string} title - Current title being typed
 * @param {string} category - Selected category
 * @returns {Array} - Array of potentially similar issues
 */
export const getSimilaritySuggestions = async (title, category) => {
  if (!title || title.length < 10) return [];

  try {
    // Simple keyword-based pre-filtering (faster than AI)
    const keywords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    if (keywords.length === 0) return [];

    const { data: potentialMatches, error } = await supabase
      .from("issues")
      .select("id, title, description, status, repost_count")
      .eq("category", category)
      .neq("status", "closed")
      .limit(10);

    if (error || !potentialMatches) return [];

    // Score each issue by keyword matches
    const scored = potentialMatches.map(issue => {
      const issueText = (issue.title + " " + (issue.description || "")).toLowerCase();
      const matchCount = keywords.filter(kw => issueText.includes(kw)).length;
      return { ...issue, matchScore: matchCount / keywords.length };
    });

    // Return issues with at least 50% keyword match
    return scored
      .filter(issue => issue.matchScore >= 0.5)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);
  } catch (error) {
    console.error("Suggestion error:", error);
    return [];
  }
};
