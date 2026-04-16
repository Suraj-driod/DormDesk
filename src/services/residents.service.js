/**
 * Residents Service
 * Fetches all student users belonging to a specific hostel.
 * Used by the admin "Hostel Residents" page.
 */

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";

const USERS_COLLECTION = "users";

/**
 * Fetch all residents (students) belonging to a specific hostel.
 * @param {string} hostelId - The hostel document ID
 * @returns {Promise<Array>} Array of resident objects
 */
export const fetchResidentsByHostel = async (hostelId) => {
  if (!hostelId) {
    console.warn("fetchResidentsByHostel called without hostelId");
    return [];
  }

  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(
      usersRef,
      where("hostelId", "==", hostelId)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
      .sort((a, b) => {
        // Sort by floor first, then by flatNumber
        const floorA = Number(a.floor) || 0;
        const floorB = Number(b.floor) || 0;
        if (floorA !== floorB) return floorA - floorB;
        return (a.flatNumber || "").localeCompare(b.flatNumber || "", undefined, { numeric: true });
      });
  } catch (error) {
    console.error("Error fetching residents:", error);
    throw error;
  }
};

/**
 * Get floor-wise distribution of residents.
 * @param {Array} residents - Array of resident objects
 * @returns {Array} Array of { floor, count } sorted by floor
 */
export const getFloorDistribution = (residents) => {
  const floorMap = {};
  residents.forEach((r) => {
    const floor = r.floor || "Unknown";
    floorMap[floor] = (floorMap[floor] || 0) + 1;
  });

  return Object.entries(floorMap)
    .map(([floor, count]) => ({ floor, count }))
    .sort((a, b) => {
      if (a.floor === "Unknown") return 1;
      if (b.floor === "Unknown") return -1;
      return Number(a.floor) - Number(b.floor);
    });
};
