import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile 
} from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext(null);

// Auth initialization timeout (5 seconds max)
const AUTH_TIMEOUT_MS = 5000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  // Fetch user profile - default to student, only checks management if requested
  const fetchProfile = useCallback(async (firebaseUser, checkManagement = false) => {
    if (!firebaseUser) return null;

    const userId = firebaseUser.uid;
    const userEmail = firebaseUser.email;

    try {
      // Only check management collection if explicitly requested (staff login)
      if (checkManagement && userEmail) {
        console.log("Staff login check for:", userEmail);
        
        // Query management collection by email field (not document ID)
        const mgmtRef = collection(db, "management");
        const q = query(mgmtRef, where("email", "==", userEmail));
        const mgmtSnap = await getDocs(q);

        console.log("Documents found:", mgmtSnap.size);

        if (!mgmtSnap.empty) {
          const mgmtDoc = mgmtSnap.docs[0];
          const mgmtData = mgmtDoc.data();
          console.log("Management data:", mgmtData);
          
          // Check for various field name conventions (isActive, is_active, active)
          // Also handle string "true" vs boolean true
          const isActiveValue = mgmtData.isActive ?? mgmtData.is_active ?? mgmtData.active;
          const isActive = isActiveValue === true || isActiveValue === "true";
          
          console.log("isActive value:", isActiveValue, "parsed as:", isActive);
          
          if (isActive) {
            return {
              id: userId,
              email: userEmail,
              managementDocId: mgmtDoc.id,
              ...mgmtData,
              role: mgmtData.role, // "admin" or "caretaker"
              name: mgmtData.full_name || mgmtData.name || userEmail.split("@")[0],
              hostel: mgmtData.hostel_block || mgmtData.hostel,
            };
          }
          // isActive is false - not authorized as staff
          throw new Error("Your staff account is not active. Contact administrator.");
        }
        // Email not in management - not authorized as staff
        throw new Error(`Email "${userEmail}" not found in management collection.`);
      }

      // Check users collection by UID (for students)
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        return {
          id: userId,
          email: userEmail,
          ...userData,
          role: "student",
        };
      }

      // No profile exists - return basic info as student
      return {
        id: userId,
        email: userEmail,
        name: firebaseUser.displayName || userEmail?.split("@")[0],
        role: "student",
      };
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error; // Re-throw to handle in login
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    let timeoutId;
    let initialized = false;

    const completeInit = () => {
      if (!initialized && isMountedRef.current) {
        initialized = true;
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    // Safety timeout - ensures loading stops even if auth hangs
    timeoutId = setTimeout(() => {
      console.warn("Auth timeout - forcing loading complete");
      completeInit();
    }, AUTH_TIMEOUT_MS);

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMountedRef.current) return;

      setUser(currentUser);

      if (currentUser) {
        // On page reload, check if user was previously a staff member
        // by looking at localStorage flag
        const wasStaffLogin = localStorage.getItem(`staff_${currentUser.uid}`) === "true";
        try {
          const userProfile = await fetchProfile(currentUser, wasStaffLogin);
          if (isMountedRef.current) setProfile(userProfile);
        } catch {
          // If staff check fails on reload, clear flag and treat as student
          localStorage.removeItem(`staff_${currentUser.uid}`);
          const studentProfile = await fetchProfile(currentUser, false);
          if (isMountedRef.current) setProfile(studentProfile);
        }
      } else {
        setProfile(null);
      }

      completeInit();
    });

    return () => {
      isMountedRef.current = false;
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [fetchProfile]);

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (user) {
      const userProfile = await fetchProfile(user);
      setProfile(userProfile);
    }
  }, [user, fetchProfile]);

  // Login - pass isStaffLogin=true to check management collection
  const login = async (email, password, isStaffLogin = false) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (result.user) {
        try {
          const userProfile = await fetchProfile(result.user, isStaffLogin);
          setProfile(userProfile);
          
          // Remember staff login for session persistence
          if (isStaffLogin && (userProfile.role === "admin" || userProfile.role === "caretaker")) {
            localStorage.setItem(`staff_${result.user.uid}`, "true");
          } else {
            localStorage.removeItem(`staff_${result.user.uid}`);
          }
        } catch (profileError) {
          // If staff login fails validation, sign out and return error
          if (isStaffLogin) {
            await signOut(auth);
            return { data: null, error: { message: profileError.message } };
          }
          // For regular login, just set basic profile
          setProfile({
            id: result.user.uid,
            email: result.user.email,
            name: result.user.displayName || email.split("@")[0],
            role: "student",
          });
        }
      }
      return { data: result, error: null };
    } catch (error) {
      console.error("Login error:", error);
      return { data: null, error };
    }
  };

  // Sign Up - always creates student account (staff should already be in management)
  const signUp = async (email, password, metadata) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      if (result.user) {
        // Update display name
        await updateProfile(result.user, {
          displayName: metadata?.fullName || email.split("@")[0],
        });

        // Create user document in users collection (always as student)
        const userRef = doc(db, "users", result.user.uid);
        await setDoc(userRef, {
          name: metadata?.fullName || email.split("@")[0],
          email: email,
          role: "student",
          hostel: metadata?.hostel || null,
          block: metadata?.block || null,
          floor: metadata?.floor || null,
          room_no: metadata?.room_no || null,
          phone_no: metadata?.phone_no || null,
          created_at: new Date().toISOString(),
        });

        // Fetch profile as student (no management check on signup)
        const userProfile = await fetchProfile(result.user, false);
        setProfile(userProfile);
      }

      return { data: result, error: null };
    } catch (error) {
      console.error("Signup error:", error);
      return { data: null, error };
    }
  };

  // Logout
  const logout = async () => {
    // Clear staff flag on logout
    if (user?.uid) {
      localStorage.removeItem(`staff_${user.uid}`);
    }
    setProfile(null);
    return await signOut(auth);
  };

  // Role check helpers
  const isAdmin = profile?.role === "admin";
  const isCaretaker = profile?.role === "caretaker";
  const isStudent = profile?.role === "student";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        signUp,
        logout,
        refreshProfile,
        // Role helpers
        isAdmin,
        isCaretaker,
        isStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
