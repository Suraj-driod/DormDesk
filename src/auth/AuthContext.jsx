// src/auth/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// 🔐 Public anon key ONLY
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user || null);
      setLoading(false);
    });

    // Listen to auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  /* ================= AUTH ACTIONS ================= */

  // ✅ Login
  const login = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };
  // ✅ Sign Up (New)
  const signUp = async (email, password, metadata) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        // This stores fullName, phone, role, hostel details in 'raw_user_meta_data'
        data: metadata, 
      },
    });
  };

  // 🚪 Logout
  const logout = async () => {
    return await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        login,
        signUp, // Exporting signUp
        logout,
        supabase,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => useContext(AuthContext);