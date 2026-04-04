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
  orderBy, 
  limit 
} from "firebase/firestore";
import { db } from "../firebase";
import { withHostelFilter } from "../Lib/utilities";

const ANNOUNCEMENTS_COLLECTION = "announcements";

// Fetch all announcements
export const fetchAnnouncements = async (filters = {}, hostelId) => {
  try {
    const announcementsRef = collection(db, ANNOUNCEMENTS_COLLECTION);
    const q = withHostelFilter(announcementsRef, hostelId);
    // Fetch all, sort client-side to avoid index issues
    const snapshot = await getDocs(q);

    let announcements = await Promise.all(snapshot.docs.map(async (docSnap) => {
      const announcement = { id: docSnap.id, ...docSnap.data() };

      // Fetch creator profile
      if (announcement.created_by) {
        // Try users first, then management
        let profileRef = doc(db, "users", announcement.created_by);
        let profileSnap = await getDoc(profileRef);
        
        if (!profileSnap.exists()) {
          profileRef = doc(db, "management", announcement.created_by);
          profileSnap = await getDoc(profileRef);
        }
        
        if (profileSnap.exists()) {
          const profileData = profileSnap.data();
          announcement.profile = { 
            id: profileSnap.id, 
            name: profileData.name || profileData.full_name,
            role: profileData.role 
          };
        }
      }

      return announcement;
    }));

    // Apply client-side filters
    if (filters.hostel && filters.hostel !== "All") {
      announcements = announcements.filter(ann => 
        ann.target_hostel === "All" || ann.target_hostel === filters.hostel
      );
    }

    if (filters.block && filters.block !== "All") {
      announcements = announcements.filter(ann => 
        ann.target_block === "All" || ann.target_block === filters.block
      );
    }

    // Sort by created_at descending (client-side)
    return announcements.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    throw error;
  }
};

// Fetch single announcement by id
export const fetchAnnouncementById = async (id) => {
  try {
    const announcementRef = doc(db, ANNOUNCEMENTS_COLLECTION, id);
    const announcementSnap = await getDoc(announcementRef);

    if (!announcementSnap.exists()) throw new Error("Announcement not found");

    const announcement = { id: announcementSnap.id, ...announcementSnap.data() };

    // Fetch creator profile
    if (announcement.created_by) {
      let profileRef = doc(db, "users", announcement.created_by);
      let profileSnap = await getDoc(profileRef);
      
      if (!profileSnap.exists()) {
        profileRef = doc(db, "management", announcement.created_by);
        profileSnap = await getDoc(profileRef);
      }
      
      if (profileSnap.exists()) {
        const profileData = profileSnap.data();
        announcement.profile = { 
          id: profileSnap.id, 
          name: profileData.name || profileData.full_name,
          role: profileData.role 
        };
      }
    }

    return announcement;
  } catch (error) {
    console.error("Error fetching announcement:", error);
    throw error;
  }
};

// Create a new announcement (Admin only)
export const createAnnouncement = async (announcementData, userId, hostelId) => {
  try {
    const announcementsRef = collection(db, ANNOUNCEMENTS_COLLECTION);
    const docRef = await addDoc(announcementsRef, {
      ...announcementData,
      hostelId,
      created_by: userId,
      created_at: new Date().toISOString(),
    });

    const newSnap = await getDoc(docRef);
    return { id: newSnap.id, ...newSnap.data() };
  } catch (error) {
    console.error("Error creating announcement:", error);
    throw error;
  }
};

// Update an announcement
export const updateAnnouncement = async (id, updateData) => {
  try {
    const announcementRef = doc(db, ANNOUNCEMENTS_COLLECTION, id);
    await updateDoc(announcementRef, updateData);

    const updatedSnap = await getDoc(announcementRef);
    return { id: updatedSnap.id, ...updatedSnap.data() };
  } catch (error) {
    console.error("Error updating announcement:", error);
    throw error;
  }
};

// Delete an announcement
export const deleteAnnouncement = async (id) => {
  try {
    const announcementRef = doc(db, ANNOUNCEMENTS_COLLECTION, id);
    const announcementSnap = await getDoc(announcementRef);
    
    if (!announcementSnap.exists()) throw new Error("Announcement not found");
    
    const announcementData = { id: announcementSnap.id, ...announcementSnap.data() };
    await deleteDoc(announcementRef);
    return announcementData;
  } catch (error) {
    console.error("Error deleting announcement:", error);
    throw error;
  }
};

// Fetch announcements for a specific user's hostel/block
export const fetchAnnouncementsForUser = async (userHostel, userBlock, hostelId) => {
  try {
    const announcementsRef = collection(db, ANNOUNCEMENTS_COLLECTION);
    let q = query(announcementsRef, orderBy("created_at", "desc"));
    q = withHostelFilter(q, hostelId);
    const snapshot = await getDocs(q);

    const announcements = await Promise.all(snapshot.docs.map(async (docSnap) => {
      const announcement = { id: docSnap.id, ...docSnap.data() };

      // Fetch creator name
      if (announcement.created_by) {
        let profileRef = doc(db, "users", announcement.created_by);
        let profileSnap = await getDoc(profileRef);
        
        if (!profileSnap.exists()) {
          profileRef = doc(db, "management", announcement.created_by);
          profileSnap = await getDoc(profileRef);
        }
        
        if (profileSnap.exists()) {
          const profileData = profileSnap.data();
          announcement.profile = { 
            id: profileSnap.id, 
            name: profileData.name || profileData.full_name 
          };
        }
      }

      return announcement;
    }));

    // Filter by hostel and block
    return announcements.filter(ann => {
      const hostelMatch = ann.target_hostel === "All" || ann.target_hostel === userHostel;
      const blockMatch = ann.target_block === "All" || ann.target_block === userBlock || !ann.target_block;
      return hostelMatch && blockMatch;
    });
  } catch (error) {
    console.error("Error fetching user announcements:", error);
    throw error;
  }
};

// Vote on a poll
export const voteOnPoll = async (announcementId, option, userId) => {
  try {
    const announcementRef = doc(db, ANNOUNCEMENTS_COLLECTION, announcementId);
    const announcementSnap = await getDoc(announcementRef);

    if (!announcementSnap.exists()) throw new Error("Announcement not found");

    const announcement = announcementSnap.data();
    const pollData = announcement.poll_data;
    
    if (!pollData) throw new Error("No poll data found");
    if (pollData.voters?.includes(userId)) throw new Error("You have already voted");

    // Update vote count
    pollData.votes[option] = (pollData.votes[option] || 0) + 1;
    pollData.total_votes = (pollData.total_votes || 0) + 1;
    pollData.voters = [...(pollData.voters || []), userId];

    await updateDoc(announcementRef, { poll_data: pollData });

    const updatedSnap = await getDoc(announcementRef);
    return { id: updatedSnap.id, ...updatedSnap.data() };
  } catch (error) {
    console.error("Error voting on poll:", error);
    throw error;
  }
};

// Get recent announcements (last 7 days)
export const fetchRecentAnnouncements = async (limitCount = 5, hostelId) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const announcementsRef = collection(db, ANNOUNCEMENTS_COLLECTION);
    let q = query(
      announcementsRef,
      where("created_at", ">=", sevenDaysAgo.toISOString()),
      orderBy("created_at", "desc"),
      limit(limitCount)
    );
    q = withHostelFilter(q, hostelId);
    const snapshot = await getDocs(q);

    const announcements = await Promise.all(snapshot.docs.map(async (docSnap) => {
      const announcement = { 
        id: docSnap.id, 
        title: docSnap.data().title,
        content: docSnap.data().content,
        created_at: docSnap.data().created_at,
        target_hostel: docSnap.data().target_hostel,
      };

      if (docSnap.data().created_by) {
        let profileRef = doc(db, "users", docSnap.data().created_by);
        let profileSnap = await getDoc(profileRef);
        
        if (!profileSnap.exists()) {
          profileRef = doc(db, "management", docSnap.data().created_by);
          profileSnap = await getDoc(profileRef);
        }
        
        if (profileSnap.exists()) {
          announcement.profile = { name: profileSnap.data().name || profileSnap.data().full_name };
        }
      }

      return announcement;
    }));

    return announcements;
  } catch (error) {
    console.error("Error fetching recent announcements:", error);
    throw error;
  }
};
