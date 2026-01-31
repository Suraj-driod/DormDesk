import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection, 
  getDocs, 
  query, 
  where 
} from "firebase/firestore";
import { db } from "../firebase";

// Fetch user profile - accepts userId (uid) and optionally email for management lookup
export const fetchUserProfile = async (userId, userEmail = null) => {
  try {
    // If email provided, check management collection first (document ID = email)
    if (userEmail) {
      const mgmtRef = doc(db, "management", userEmail);
      const mgmtSnap = await getDoc(mgmtRef);

      if (mgmtSnap.exists()) {
        const mgmtData = mgmtSnap.data();
        if (mgmtData.isActive === true) {
          return {
            id: userId,
            email: userEmail,
            managementDocId: userEmail,
            ...mgmtData,
            role: mgmtData.role,
            name: mgmtData.full_name || mgmtData.name,
            hostel: mgmtData.hostel_block || mgmtData.hostel,
            avatarUrl: mgmtData.avatar_url || null,
            stats: await getUserStats(userId, mgmtData.role),
          };
        }
      }
    }

    // Check users collection by UID (student)
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      return {
        id: userId,
        ...userData,
        role: "student",
        avatarUrl: userData.avatar_url || null,
        stats: await getUserStats(userId, "student"),
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }
};

// Get user statistics based on role
export const getUserStats = async (userId, role) => {
  try {
    if (role === "student") {
      const issuesRef = collection(db, "issues");
      const q = query(issuesRef, where("created_by", "==", userId));
      const snapshot = await getDocs(q);

      let reported = 0, resolved = 0, pending = 0;
      snapshot.docs.forEach(doc => {
        const status = doc.data().status;
        reported++;
        if (status === "resolved" || status === "closed") resolved++;
        else pending++;
      });

      return { reported, resolved, pending };
    }

    if (role === "caretaker") {
      const issuesRef = collection(db, "issues");
      const q = query(issuesRef, where("assigned_to", "==", userId));
      const snapshot = await getDocs(q);

      let assigned = 0, completed = 0, inProgress = 0;
      snapshot.docs.forEach(doc => {
        const status = doc.data().status;
        assigned++;
        if (status === "resolved" || status === "closed") completed++;
        else if (status === "in_progress") inProgress++;
      });

      return { assigned, completed, inProgress };
    }

    if (role === "admin") {
      const [issuesSnap, announcementsSnap, complaintsSnap] = await Promise.all([
        getDocs(collection(db, "issues")),
        getDocs(collection(db, "announcements")),
        getDocs(collection(db, "complaints")),
      ]);

      // Filter pending complaints client-side
      const pendingComplaints = complaintsSnap.docs.filter(doc => {
        const status = doc.data().status;
        return status === "submitted" || status === "under_review";
      }).length;

      return {
        totalIssues: issuesSnap.size,
        announcements: announcementsSnap.size,
        pendingComplaints,
      };
    }

    return { reported: 0, resolved: 0, pending: 0 };
  } catch (error) {
    console.error("Error getting user stats:", error);
    return { reported: 0, resolved: 0, pending: 0 };
  }
};

// Update user profile
// For management (admin/caretaker): use email as document ID
// For students: use userId (uid) as document ID
export const updateUserProfile = async (userId, updateData, role, userEmail = null) => {
  try {
    let docRef;
    
    if ((role === "admin" || role === "caretaker") && userEmail) {
      // Management uses email as document ID
      docRef = doc(db, "management", userEmail);
    } else {
      // Students use uid as document ID
      docRef = doc(db, "users", userId);
    }
    
    await updateDoc(docRef, {
      ...updateData,
      updated_at: new Date().toISOString(),
    });

    const updatedSnap = await getDoc(docRef);
    return { id: updatedSnap.id, ...updatedSnap.data() };
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};

// Create profile (after signup)
export const createProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      ...profileData,
      created_at: new Date().toISOString(),
    });

    const newSnap = await getDoc(userRef);
    return { id: newSnap.id, ...newSnap.data() };
  } catch (error) {
    console.error("Error creating profile:", error);
    throw error;
  }
};

// Upload profile avatar (now using ImgBB URL)
export const updateAvatarUrl = async (userId, avatarUrl, role, userEmail = null) => {
  try {
    let docRef;
    
    if ((role === "admin" || role === "caretaker") && userEmail) {
      docRef = doc(db, "management", userEmail);
    } else {
      docRef = doc(db, "users", userId);
    }
    
    await updateDoc(docRef, { avatar_url: avatarUrl });
    
    return avatarUrl;
  } catch (error) {
    console.error("Error updating avatar:", error);
    throw error;
  }
};

// Fetch all caretakers (for admin assignment)
export const fetchCaretakers = async () => {
  try {
    const mgmtRef = collection(db, "management");
    // Fetch all, filter client-side to avoid composite index
    const snapshot = await getDocs(mgmtRef);

    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(m => m.role === "caretaker" && m.is_active !== false)
      .sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
  } catch (error) {
    console.error("Error fetching caretakers:", error);
    return [];
  }
};

// Fetch caretakers by hostel
export const fetchCaretakersByHostel = async (hostelBlock) => {
  try {
    const mgmtRef = collection(db, "management");
    // Fetch all, filter client-side to avoid composite index
    const snapshot = await getDocs(mgmtRef);

    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(m => 
        m.role === "caretaker" && 
        m.hostel_block === hostelBlock && 
        m.is_active !== false
      );
  } catch (error) {
    console.error("Error fetching caretakers by hostel:", error);
    return [];
  }
};
