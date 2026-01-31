import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from "firebase/firestore";
import { db } from "../firebase";

const COMPLAINTS_COLLECTION = "complaints";

// Fetch all complaints
export const fetchComplaints = async (filters = {}) => {
  try {
    const complaintsRef = collection(db, COMPLAINTS_COLLECTION);
    // Fetch all, filter client-side to avoid composite index requirement
    const snapshot = await getDocs(complaintsRef);

    let complaints = await Promise.all(snapshot.docs.map(async (docSnap) => {
      const complaint = { id: docSnap.id, ...docSnap.data() };

      // Fetch raised_by profile
      if (complaint.raised_by) {
        try {
          const profileRef = doc(db, "users", complaint.raised_by);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            complaint.raised_by_profile = { id: profileSnap.id, ...profileSnap.data() };
          }
        } catch (e) {
          console.warn("Could not fetch raiser profile:", e);
        }
      }

      // Fetch accused profile if it's a user ID
      if (complaint.accused_user_id) {
        try {
          const accusedRef = doc(db, "users", complaint.accused_user_id);
          const accusedSnap = await getDoc(accusedRef);
          if (accusedSnap.exists()) {
            complaint.accused_profile = { id: accusedSnap.id, ...accusedSnap.data() };
          }
        } catch (e) {
          console.warn("Could not fetch accused profile:", e);
        }
      }

      return complaint;
    }));

    // Apply filters client-side
    if (filters.status) {
      complaints = complaints.filter(c => c.status === filters.status);
    }
    if (filters.complaint_type) {
      complaints = complaints.filter(c => c.complaint_type === filters.complaint_type);
    }
    if (filters.raised_by) {
      complaints = complaints.filter(c => c.raised_by === filters.raised_by);
    }

    // Sort by created_at descending
    return complaints.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    return [];
  }
};

// Fetch single complaint by id
export const fetchComplaintById = async (id) => {
  try {
    const complaintRef = doc(db, COMPLAINTS_COLLECTION, id);
    const complaintSnap = await getDoc(complaintRef);

    if (!complaintSnap.exists()) throw new Error("Complaint not found");

    const complaint = { id: complaintSnap.id, ...complaintSnap.data() };

    // Fetch profiles
    if (complaint.raised_by) {
      const profileRef = doc(db, "users", complaint.raised_by);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        complaint.raised_by_profile = { id: profileSnap.id, ...profileSnap.data() };
      }
    }

    if (complaint.accused_user_id) {
      const accusedRef = doc(db, "users", complaint.accused_user_id);
      const accusedSnap = await getDoc(accusedRef);
      if (accusedSnap.exists()) {
        complaint.accused_profile = { id: accusedSnap.id, ...accusedSnap.data() };
      }
    }

    return complaint;
  } catch (error) {
    console.error("Error fetching complaint:", error);
    throw error;
  }
};

// Create a new complaint
export const createComplaint = async (complaintData, userId) => {
  try {
    const complaintsRef = collection(db, COMPLAINTS_COLLECTION);
    const docRef = await addDoc(complaintsRef, {
      ...complaintData,
      raised_by: userId,
      status: "submitted",
      created_at: new Date().toISOString(),
    });

    const newSnap = await getDoc(docRef);
    return { id: newSnap.id, ...newSnap.data() };
  } catch (error) {
    console.error("Error creating complaint:", error);
    throw error;
  }
};

// Update complaint status (Admin only)
export const updateComplaintStatus = async (id, status, closedAt = null) => {
  try {
    const complaintRef = doc(db, COMPLAINTS_COLLECTION, id);
    const updateData = { status };
    
    if (status === "closed") {
      updateData.closed_at = closedAt || new Date().toISOString();
    }

    await updateDoc(complaintRef, updateData);

    const updatedSnap = await getDoc(complaintRef);
    return { id: updatedSnap.id, ...updatedSnap.data() };
  } catch (error) {
    console.error("Error updating complaint status:", error);
    throw error;
  }
};

// Delete a complaint
export const deleteComplaint = async (id) => {
  try {
    const complaintRef = doc(db, COMPLAINTS_COLLECTION, id);
    const complaintSnap = await getDoc(complaintRef);
    
    if (!complaintSnap.exists()) throw new Error("Complaint not found");
    
    const complaintData = { id: complaintSnap.id, ...complaintSnap.data() };
    await deleteDoc(complaintRef);
    return complaintData;
  } catch (error) {
    console.error("Error deleting complaint:", error);
    throw error;
  }
};

// Fetch complaints by user
export const fetchUserComplaints = async (userId) => {
  try {
    const complaintsRef = collection(db, COMPLAINTS_COLLECTION);
    const q = query(
      complaintsRef,
      where("raised_by", "==", userId),
      orderBy("created_at", "desc")
    );
    const snapshot = await getDocs(q);

    const complaints = await Promise.all(snapshot.docs.map(async (docSnap) => {
      const complaint = { id: docSnap.id, ...docSnap.data() };

      if (complaint.accused_user_id) {
        const accusedRef = doc(db, "users", complaint.accused_user_id);
        const accusedSnap = await getDoc(accusedRef);
        if (accusedSnap.exists()) {
          complaint.accused_profile = { id: accusedSnap.id, ...accusedSnap.data() };
        }
      }

      return complaint;
    }));

    return complaints;
  } catch (error) {
    console.error("Error fetching user complaints:", error);
    throw error;
  }
};

// Get complaint statistics
export const getComplaintStats = async () => {
  try {
    const complaintsRef = collection(db, COMPLAINTS_COLLECTION);
    const snapshot = await getDocs(complaintsRef);

    const stats = {
      total: snapshot.size,
      byStatus: {},
      byType: {},
    };

    snapshot.docs.forEach((docSnap) => {
      const complaint = docSnap.data();
      stats.byStatus[complaint.status] = (stats.byStatus[complaint.status] || 0) + 1;
      stats.byType[complaint.complaint_type] = (stats.byType[complaint.complaint_type] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error("Error getting complaint stats:", error);
    throw error;
  }
};

// Fetch pending complaints for admin
export const fetchPendingComplaints = async () => {
  try {
    const complaintsRef = collection(db, COMPLAINTS_COLLECTION);
    const q = query(
      complaintsRef,
      where("status", "in", ["submitted", "under_review"]),
      orderBy("created_at", "asc")
    );
    const snapshot = await getDocs(q);

    const complaints = await Promise.all(snapshot.docs.map(async (docSnap) => {
      const complaint = { id: docSnap.id, ...docSnap.data() };

      if (complaint.raised_by) {
        const profileRef = doc(db, "users", complaint.raised_by);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          complaint.raised_by_profile = { id: profileSnap.id, ...profileSnap.data() };
        }
      }

      if (complaint.accused_user_id) {
        const accusedRef = doc(db, "users", complaint.accused_user_id);
        const accusedSnap = await getDoc(accusedRef);
        if (accusedSnap.exists()) {
          complaint.accused_profile = { id: accusedSnap.id, ...accusedSnap.data() };
        }
      }

      return complaint;
    }));

    return complaints;
  } catch (error) {
    console.error("Error fetching pending complaints:", error);
    throw error;
  }
};
