import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../Lib/supabaseClient";

const AuthContext = createContext(null);

// Auth initialization timeout (5 seconds max)
const AUTH_TIMEOUT_MS = 5000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  // Fetch user profile from profile or management table
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) return null;

    try {
      // First check management table (admin/caretaker)
      const { data: mgmtData, error: mgmtError } = await supabase
        .from("management")
        .select("*")
        .eq("id", userId)
        .single();

      if (mgmtData && !mgmtError) {
        return {
          ...mgmtData,
          role: mgmtData.role,
          name: mgmtData.full_name,
          hostel: mgmtData.hostel_block,
        };
      }

      // Fallback to profile table (student)
      const { data: profileData, error: profileError } = await supabase
        .from("profile")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileData && !profileError) {
        return {
          ...profileData,
          role: profileData.role || "student",
        };
      }

      // If no profile exists, use auth metadata
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser?.user_metadata) {
        return {
          id: userId,
          name: authUser.user_metadata.fullName || authUser.email?.split("@")[0],
          email: authUser.email,
          role: authUser.user_metadata.role || "student",
          hostel: authUser.user_metadata.hostel,
          block: authUser.user_metadata.block,
          room_no: authUser.user_metadata.room_no,
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

    // Set up auth state listener FIRST (before getSession)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth event:", event);
        if (!isMountedRef.current) return;

        // Handle session update
        setSession(currentSession);
        setUser(currentSession?.user || null);

        if (currentSession?.user) {
          const userProfile = await fetchProfile(currentSession.user.id);
          if (isMountedRef.current) setProfile(userProfile);
        } else {
          setProfile(null);
        }

        // Complete initialization on any auth event
        completeInit();
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession }, error }) => {
      if (error) console.error("getSession error:", error);
      if (!isMountedRef.current || initialized) return;

      setSession(existingSession);
      setUser(existingSession?.user || null);

      if (existingSession?.user) {
        const userProfile = await fetchProfile(existingSession.user.id);
        if (isMountedRef.current) setProfile(userProfile);
      }

      completeInit();
    }).catch((err) => {
      console.error("Session check failed:", err);
      completeInit();
    });

    return () => {
      isMountedRef.current = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      const userProfile = await fetchProfile(user.id);
      setProfile(userProfile);
    }
  }, [user, fetchProfile]);

  // Login
  const login = async (email, password) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.data?.user) {
      const userProfile = await fetchProfile(result.data.user.id);
      setProfile(userProfile);
    }
    return result;
  };

  // Sign Up
  const signUp = async (email, password, metadata) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
  };

  // Logout
  const logout = async () => {
    setProfile(null);
    return await supabase.auth.signOut();
  };

  // Role check helpers
  const isAdmin = profile?.role === "admin";
  const isCaretaker = profile?.role === "caretaker";
  const isStudent = profile?.role === "student";

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        login,
        signUp,
        logout,
        refreshProfile,
        supabase,
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
