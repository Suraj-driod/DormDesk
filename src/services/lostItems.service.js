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
import { withHostelFilter } from "../Lib/utilities";

const LOST_ITEMS_COLLECTION = "lost_found";

// Fetch all lost items
export const fetchLostItems = async (filters = {}, hostelId) => {
  try {
    const lostItemsRef = collection(db, LOST_ITEMS_COLLECTION);
    const q = withHostelFilter(lostItemsRef, hostelId);
    // Fetch all, filter client-side to avoid composite index requirement
    const snapshot = await getDocs(q);

    let items = await Promise.all(snapshot.docs.map(async (docSnap) => {
      const item = { id: docSnap.id, ...docSnap.data() };

      // Fetch reported_by profile
      if (item.reported_by) {
        try {
          const profileRef = doc(db, "users", item.reported_by);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            item.reported_by_profile = { id: profileSnap.id, ...profileSnap.data() };
          }
        } catch (e) {
          console.warn("Could not fetch reporter profile:", e);
        }
      }

      // Fetch claimed_by profile
      if (item.claimed_by) {
        try {
          const claimedRef = doc(db, "users", item.claimed_by);
          const claimedSnap = await getDoc(claimedRef);
          if (claimedSnap.exists()) {
            item.claimed_by_profile = { id: claimedSnap.id, ...claimedSnap.data() };
          }
        } catch (e) {
          console.warn("Could not fetch claimer profile:", e);
        }
      }

      return item;
    }));

    // Apply status filter client-side
    if (filters.status) {
      items = items.filter(item => item.status === filters.status);
    }

    // Apply location filter client-side (case-insensitive search)
    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      items = items.filter(item => 
        item.location?.toLowerCase().includes(locationLower)
      );
    }

    // Sort by created_at descending
    return items.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching lost items:", error);
    throw error;
  }
};

// Fetch single lost item by id
export const fetchLostItemById = async (id) => {
  try {
    const itemRef = doc(db, LOST_ITEMS_COLLECTION, id);
    const itemSnap = await getDoc(itemRef);

    if (!itemSnap.exists()) throw new Error("Item not found");

    const item = { id: itemSnap.id, ...itemSnap.data() };

    // Fetch profiles
    if (item.reported_by) {
      const profileRef = doc(db, "users", item.reported_by);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        item.reported_by_profile = { id: profileSnap.id, ...profileSnap.data() };
      }
    }

    if (item.claimed_by) {
      const claimedRef = doc(db, "users", item.claimed_by);
      const claimedSnap = await getDoc(claimedRef);
      if (claimedSnap.exists()) {
        item.claimed_by_profile = { id: claimedSnap.id, ...claimedSnap.data() };
      }
    }

    return item;
  } catch (error) {
    console.error("Error fetching lost item:", error);
    throw error;
  }
};

// Create a new lost item entry
export const createLostItem = async (itemData, userId, hostelId) => {
  try {
    const lostItemsRef = collection(db, LOST_ITEMS_COLLECTION);
    const docRef = await addDoc(lostItemsRef, {
      ...itemData,
      hostelId,
      reported_by: userId,
      status: itemData.status || "lost",
      created_at: new Date().toISOString(),
    });

    const newSnap = await getDoc(docRef);
    return { id: newSnap.id, ...newSnap.data() };
  } catch (error) {
    console.error("Error creating lost item:", error);
    throw error;
  }
};

// Update lost item status
export const updateLostItemStatus = async (id, status) => {
  try {
    const itemRef = doc(db, LOST_ITEMS_COLLECTION, id);
    await updateDoc(itemRef, { status });

    const updatedSnap = await getDoc(itemRef);
    return { id: updatedSnap.id, ...updatedSnap.data() };
  } catch (error) {
    console.error("Error updating lost item status:", error);
    throw error;
  }
};

// Mark item as claimed
export const markItemClaimed = async (id, claimedById) => {
  try {
    const itemRef = doc(db, LOST_ITEMS_COLLECTION, id);
    await updateDoc(itemRef, {
      status: "claimed",
      claimed_by: claimedById,
      claimed_at: new Date().toISOString(),
    });

    const updatedSnap = await getDoc(itemRef);
    return { id: updatedSnap.id, ...updatedSnap.data() };
  } catch (error) {
    console.error("Error marking item claimed:", error);
    throw error;
  }
};

// Mark item as found
export const markItemFound = async (id) => {
  try {
    const itemRef = doc(db, LOST_ITEMS_COLLECTION, id);
    await updateDoc(itemRef, { status: "found" });

    const updatedSnap = await getDoc(itemRef);
    return { id: updatedSnap.id, ...updatedSnap.data() };
  } catch (error) {
    console.error("Error marking item found:", error);
    throw error;
  }
};

// Delete a lost item entry
export const deleteLostItem = async (id) => {
  try {
    const itemRef = doc(db, LOST_ITEMS_COLLECTION, id);
    const itemSnap = await getDoc(itemRef);
    
    if (!itemSnap.exists()) throw new Error("Item not found");
    
    const itemData = { id: itemSnap.id, ...itemSnap.data() };
    await deleteDoc(itemRef);
    return itemData;
  } catch (error) {
    console.error("Error deleting lost item:", error);
    throw error;
  }
};

// Fetch lost items by user
export const fetchUserLostItems = async (userId, hostelId) => {
  try {
    const lostItemsRef = collection(db, LOST_ITEMS_COLLECTION);
    let q = query(
      lostItemsRef,
      where("reported_by", "==", userId),
      orderBy("created_at", "desc")
    );
    q = withHostelFilter(q, hostelId);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.error("Error fetching user lost items:", error);
    throw error;
  }
};

// Search lost items
export const searchLostItems = async (searchQuery, hostelId) => {
  try {
    const lostItemsRef = collection(db, LOST_ITEMS_COLLECTION);
    let q = query(lostItemsRef, orderBy("created_at", "desc"));
    q = withHostelFilter(q, hostelId);
    const snapshot = await getDocs(q);

    const searchLower = searchQuery.toLowerCase();
    
    let items = await Promise.all(snapshot.docs.map(async (docSnap) => {
      const item = docSnap.data();
      
      // Filter by search query (client-side)
      const titleMatch = item.title?.toLowerCase().includes(searchLower);
      const descMatch = item.description?.toLowerCase().includes(searchLower);
      const locationMatch = item.location?.toLowerCase().includes(searchLower);
      
      if (!titleMatch && !descMatch && !locationMatch) return null;
      if (item.status === "claimed") return null;

      const result = { id: docSnap.id, ...item };

      if (item.reported_by) {
        const profileRef = doc(db, "users", item.reported_by);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          result.reported_by_profile = { name: profileSnap.data().name };
        }
      }

      return result;
    }));

    return items.filter(Boolean);
  } catch (error) {
    console.error("Error searching lost items:", error);
    throw error;
  }
};

// Get lost items statistics
export const getLostItemStats = async (hostelId) => {
  try {
    const lostItemsRef = collection(db, LOST_ITEMS_COLLECTION);
    const q = withHostelFilter(lostItemsRef, hostelId);
    const snapshot = await getDocs(q);

    const stats = {
      total: snapshot.size,
      lost: 0,
      found: 0,
      claimed: 0,
    };

    snapshot.docs.forEach((docSnap) => {
      const status = docSnap.data().status;
      if (stats[status] !== undefined) {
        stats[status]++;
      }
    });

    return stats;
  } catch (error) {
    console.error("Error getting lost item stats:", error);
    throw error;
  }
};
