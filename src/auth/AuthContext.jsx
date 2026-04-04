import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext(null);

// Auth initialization timeout (5 seconds max)
const AUTH_TIMEOUT_MS = 5000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  // Fetch user profile - checks both management and users collections for role
  const fetchProfile = useCallback(async (firebaseUser) => {
    if (!firebaseUser) return null;

    const userId = firebaseUser.uid;
    const userEmail = firebaseUser.email;

    try {
      // Always check management collection first (for staff accounts)
      if (userEmail) {
        const mgmtRef = collection(db, "management");
        const q = query(mgmtRef, where("email", "==", userEmail));
        const mgmtSnap = await getDocs(q);

        if (!mgmtSnap.empty) {
          const mgmtDoc = mgmtSnap.docs[0];
          const mgmtData = mgmtDoc.data();

          // Check for various field name conventions (isActive, is_active, active)
          // Also handle string "true" vs boolean true
          const isActiveValue =
            mgmtData.isActive ?? mgmtData.is_active ?? mgmtData.active;
          const isActive = isActiveValue === true || isActiveValue === "true";

          if (isActive) {
            return {
              id: userId,
              email: userEmail,
              managementDocId: mgmtDoc.id,
              ...mgmtData,
              role: mgmtData.role, // "admin" or "caretaker"
              name:
                mgmtData.full_name || mgmtData.name || userEmail.split("@")[0],
              hostelId: mgmtData.hostelId || null,
            };
          }
          // Staff account exists but is not active - deny access
          throw new Error(
            "Your staff account is not active. Please contact your administrator.",
          );
        }
      }

      // Not in management collection, check users collection (student)
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        return {
          id: userId,
          email: userEmail,
          ...userData,
          role: "student",
          hostelId: userData.hostelId || null,
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
      throw error; // Re-throw to handle in caller
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
        try {
          // Always resolve role from Firestore (server-side role resolution)
          const userProfile = await fetchProfile(currentUser);
          if (isMountedRef.current) setProfile(userProfile);
        } catch (profileError) {
          // If profile fetch fails, still set a basic user state but log the error
          console.error(
            "Failed to fetch profile on auth state change:",
            profileError,
          );
          if (isMountedRef.current) {
            setProfile({
              id: currentUser.uid,
              email: currentUser.email,
              name: currentUser.displayName || currentUser.email?.split("@")[0],
              role: "student",
            });
          }
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

  // Login - role is always resolved from Firestore (server-side)
  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (result.user) {
        try {
          // Fetch profile and resolve role from Firestore
          const userProfile = await fetchProfile(result.user);
          setProfile(userProfile);
          return { data: result, error: null };
        } catch (profileError) {
          // Profile fetch failed (e.g., staff account not active)
          await signOut(auth);
          return {
            data: null,
            error: { message: profileError.message },
          };
        }
      }
      return { data: result, error: null };
    } catch (error) {
      console.error("Login error:", error);

      // Map Firebase auth errors to user-friendly messages
      let userMessage = "Email and password don't match";

      if (error.code === "auth/user-not-found") {
        userMessage = "Email not found. Please register first.";
      } else if (error.code === "auth/wrong-password") {
        userMessage = "Incorrect password";
      } else if (error.code === "auth/invalid-email") {
        userMessage = "Invalid email address";
      } else if (error.code === "auth/too-many-requests") {
        userMessage = "Too many login attempts. Please try again later.";
      }

      return {
        data: null,
        error: { message: userMessage },
      };
    }
  };

  // Sign Up - always creates student account (staff should already be in management)
  const signUp = async (email, password, metadata) => {
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

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
          hostelId: metadata?.hostelId || null,
          block: metadata?.block || null,
          floor: metadata?.floor || null,
          room_no: metadata?.room_no || null,
          phone_no: metadata?.phone_no || null,
          created_at: new Date().toISOString(),
        });

        // Fetch profile as student (role resolved from Firestore)
        const userProfile = await fetchProfile(result.user);
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
