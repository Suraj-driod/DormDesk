import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../Lib/supabaseClient";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from profiles or management table
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
          role: mgmtData.role, // 'admin' or 'caretaker'
          name: mgmtData.full_name,
          hostel: mgmtData.hostel_block,
        };
      }

      // Fallback to profiles table (student)
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
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
    // Initial session
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      setUser(data.session?.user || null);
      
      if (data.session?.user) {
        const userProfile = await fetchProfile(data.session.user.id);
        setProfile(userProfile);
      }
      
      setLoading(false);
    });

    // Listen to auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          const userProfile = await fetchProfile(session.user.id);
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
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
