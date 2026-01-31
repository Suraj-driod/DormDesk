import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit 
} from "firebase/firestore";
import { db } from "../firebase";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Threshold for similarity (0-1)
const SIMILARITY_THRESHOLD = 0.75;

// Repost count threshold for priority escalation
const REPOST_THRESHOLD = 5;

/**
 * Detect similar posts using Gemini AI
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

    const issuesRef = collection(db, "issues");
    const q = query(
      issuesRef,
      where("category", "==", category),
      orderBy("created_at", "desc"),
      limit(50)
    );
    const snapshot = await getDocs(q);

    // Filter out closed issues
    const existingIssues = snapshot.docs
      .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
      .filter(issue => 
        issue.status !== "closed" && 
        new Date(issue.created_at) >= thirtyDaysAgo
      );

    if (existingIssues.length === 0) return null;

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
 */
export const incrementRepostCount = async (issueId) => {
  try {
    const issueRef = doc(db, "issues", issueId);
    const issueSnap = await getDoc(issueRef);

    if (!issueSnap.exists()) throw new Error("Issue not found");

    const currentIssue = issueSnap.data();
    const newRepostCount = (currentIssue.repost_count || 0) + 1;
    let newPriority = currentIssue.priority;

    // Escalate priority every 5 reposts
    if (newRepostCount % REPOST_THRESHOLD === 0) {
      const priorityLevels = ["low", "medium", "high", "emergency"];
      const currentIndex = priorityLevels.indexOf(currentIssue.priority);
      
      if (currentIndex < priorityLevels.length - 1 && currentIndex !== -1) {
        newPriority = priorityLevels[currentIndex + 1];
      } else if (currentIndex === -1) {
        newPriority = "medium";
      }
    }

    await updateDoc(issueRef, {
      repost_count: newRepostCount,
      priority: newPriority,
    });

    const updatedSnap = await getDoc(issueRef);
    return {
      id: updatedSnap.id,
      ...updatedSnap.data(),
      priorityEscalated: newPriority !== currentIssue.priority,
    };
  } catch (error) {
    console.error("Error incrementing repost count:", error);
    throw error;
  }
};

/**
 * Process new issue submission with similarity check
 */
export const processNewIssue = async (issueData) => {
  // CRITICAL: Validate created_by before any DB operation
  if (!issueData.created_by) {
    const error = new Error("created_by is required - cannot create issue without user ID");
    error.code = "MISSING_USER_ID";
    console.error("processNewIssue validation failed:", error);
    throw error;
  }

  const { title, description, category } = issueData;

  // Try similarity check, but don't block submission if it fails
  let similarPost = null;
  try {
    similarPost = await detectSimilarPost(title, description, category);
  } catch (similarityError) {
    console.warn("Similarity detection failed (continuing with insert):", similarityError);
  }

  if (similarPost) {
    // Similar post found - increment repost count instead of creating new
    try {
      const updatedIssue = await incrementRepostCount(similarPost.id);

      return {
        isDuplicate: true,
        originalIssue: updatedIssue,
        message: `Similar issue found: "${similarPost.title}". Your report has been merged and the issue priority ${
          updatedIssue.priorityEscalated ? "has been escalated" : "remains unchanged"
        }. Repost count: ${updatedIssue.repost_count}`,
        similarityReason: similarPost.similarityReason,
      };
    } catch (repostError) {
      console.warn("Failed to update repost count, creating new issue instead:", repostError);
    }
  }

  // No similar post - create new issue
  const issuesRef = collection(db, "issues");
  const docRef = await addDoc(issuesRef, {
    ...issueData,
    repost_count: 0,
    created_at: new Date().toISOString(),
  });

  const newSnap = await getDoc(docRef);
  return {
    isDuplicate: false,
    issue: { id: newSnap.id, ...newSnap.data() },
    message: "Issue reported successfully!",
  };
};

/**
 * Get similarity suggestions while typing
 */
export const getSimilaritySuggestions = async (title, category) => {
  if (!title || title.length < 10) return [];

  try {
    const keywords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    if (keywords.length === 0) return [];

    const issuesRef = collection(db, "issues");
    const q = query(
      issuesRef,
      where("category", "==", category),
      limit(10)
    );
    const snapshot = await getDocs(q);

    const potentialMatches = snapshot.docs
      .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
      .filter(issue => issue.status !== "closed");

    if (potentialMatches.length === 0) return [];

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
