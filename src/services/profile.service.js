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
    // If email provided, check management collection (same lookup as AuthContext: by email field)
    if (userEmail) {
      const mgmtRef = collection(db, "management");
      const q = query(mgmtRef, where("email", "==", userEmail));
      const mgmtSnap = await getDocs(q);

      if (!mgmtSnap.empty) {
        const mgmtDoc = mgmtSnap.docs[0];
        const mgmtData = mgmtDoc.data();
        const isActiveVal = mgmtData.isActive ?? mgmtData.is_active ?? mgmtData.active;
        const isActive = isActiveVal === true || isActiveVal === "true";
        if (isActive) {
          return {
            id: userId,
            email: userEmail,
            managementDocId: mgmtDoc.id,
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

// Get user statistics based on role (role normalized to lowercase)
export const getUserStats = async (userId, role) => {
  const r = (role || "").toLowerCase();
  try {
    if (r === "student") {
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

    if (r === "caretaker") {
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

    if (r === "admin" || r === "administrator") {
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
// For management: resolve doc by email query; for students: doc ID = userId
export const updateUserProfile = async (userId, updateData, role, userEmail = null) => {
  try {
    let docRef;
    const r = (role || "").toLowerCase();
    if ((r === "admin" || r === "caretaker" || r === "administrator") && userEmail) {
      const q = query(collection(db, "management"), where("email", "==", userEmail));
      const snap = await getDocs(q);
      if (snap.empty) throw new Error("Management profile not found");
      docRef = doc(db, "management", snap.docs[0].id);
    } else {
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

// Update profile avatar URL (uploaded separately via Cloudinary)
export const updateAvatarUrl = async (userId, avatarUrl, role, userEmail = null) => {
  try {
    let docRef;
    const r = (role || "").toLowerCase();
    if ((r === "admin" || r === "caretaker" || r === "administrator") && userEmail) {
      const q = query(collection(db, "management"), where("email", "==", userEmail));
      const snap = await getDocs(q);
      if (snap.empty) throw new Error("Management profile not found");
      docRef = doc(db, "management", snap.docs[0].id);
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
export const fetchCaretakers = async (hostelId = null) => {
  try {
    const mgmtRef = collection(db, "management");
    // Fetch all, filter client-side to avoid composite index
    const snapshot = await getDocs(mgmtRef);

    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(m => 
        m.role === "caretaker" && 
        m.is_active !== false &&
        (!hostelId || m.hostelId === hostelId)
      )
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
