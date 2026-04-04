import { query, where } from "firebase/firestore";

/**
 * Appends a hostelId filter to a Firestore query.
 * All reads should be scoped to a specific hostel.
 * 
 * @param {import("firebase/firestore").Query} baseQuery 
 * @param {string} hostelId 
 * @returns {import("firebase/firestore").Query}
 */
export const withHostelFilter = (baseQuery, hostelId) => {
  if (!hostelId) {
    console.warn("withHostelFilter called with empty hostelId. Query will likely return empty.");
  }
  return query(baseQuery, where("hostelId", "==", hostelId));
};
