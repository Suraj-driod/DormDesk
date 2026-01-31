import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile 
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext(null);

// Auth initialization timeout (5 seconds max)
const AUTH_TIMEOUT_MS = 5000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  // Fetch user profile from users or management collection
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) return null;

    try {
      // First check management collection (admin/caretaker)
      const mgmtRef = doc(db, "management", userId);
      const mgmtSnap = await getDoc(mgmtRef);

      if (mgmtSnap.exists()) {
        const mgmtData = mgmtSnap.data();
        return {
          id: userId,
          ...mgmtData,
          role: mgmtData.role,
          name: mgmtData.full_name,
          hostel: mgmtData.hostel_block,
        };
      }

      // Fallback to users collection (student)
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        return {
          id: userId,
          ...userData,
          role: userData.role || "student",
        };
      }

      // If no profile exists, use auth user info
      const currentUser = auth.currentUser;
      if (currentUser) {
        return {
          id: userId,
          name: currentUser.displayName || currentUser.email?.split("@")[0],
          email: currentUser.email,
          role: "student",
        };
      }

      return null;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
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
        const userProfile = await fetchProfile(currentUser.uid);
        if (isMountedRef.current) setProfile(userProfile);
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
    if (user?.uid) {
      const userProfile = await fetchProfile(user.uid);
      setProfile(userProfile);
    }
  }, [user, fetchProfile]);

  // Login
  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (result.user) {
        const userProfile = await fetchProfile(result.user.uid);
        setProfile(userProfile);
      }
      return { data: result, error: null };
    } catch (error) {
      console.error("Login error:", error);
      return { data: null, error };
    }
  };

  // Sign Up
  const signUp = async (email, password, metadata) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      if (result.user) {
        // Update display name
        await updateProfile(result.user, {
          displayName: metadata?.fullName || email.split("@")[0],
        });

        // Create user document in Firestore
        const userRef = doc(db, "users", result.user.uid);
        await setDoc(userRef, {
          name: metadata?.fullName || email.split("@")[0],
          email: email,
          role: metadata?.role || "student",
          hostel: metadata?.hostel || null,
          block: metadata?.block || null,
          floor: metadata?.floor || null,
          room_no: metadata?.room_no || null,
          phone_no: metadata?.phone_no || null,
          created_at: new Date().toISOString(),
        });

        const userProfile = await fetchProfile(result.user.uid);
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
