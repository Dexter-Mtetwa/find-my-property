import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasProperties: boolean;
  checkUserProperties: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  hasProperties: false,
  checkUserProperties: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProperties, setHasProperties] = useState(false);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const checkUserProperties = async () => {
    if (!user) {
      setHasProperties(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id')
        .eq('seller_id', user.id)
        .limit(1);

      if (error) throw error;
      setHasProperties(data && data.length > 0);
    } catch (error) {
      console.error('Error checking user properties:', error);
      setHasProperties(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
      await checkUserProperties();
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile(user.id);
      checkUserProperties();
    } else {
      setProfile(null);
      setHasProperties(false);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut, refreshProfile, hasProperties, checkUserProperties }}>
      {children}
    </AuthContext.Provider>
  );
}
