import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  // GM (admin) accounts can edit and delete any team or game. The check
  // runs in the database (is_admin(), see supabase/admin_access.sql), so
  // this flag only decides which buttons to show; the database still
  // enforces who can actually change what.
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id ?? null;
  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    supabase.rpc('is_admin').then(({ data, error }) => setIsAdmin(!error && data === true));
  }, [userId]);

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    isAdmin,
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    logIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    logOut: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
