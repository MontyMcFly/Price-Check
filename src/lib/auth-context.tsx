'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabase';
import { syncHunger } from './gamification';
import type { Session, User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  username: string;
  xp?: number;
  level?: number;
  pet_name?: string;
  coins?: number;
  hunger?: number;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string) {
    // Sincroniza el hambre primero por si ha pasado tiempo
    await syncHunger(userId);

    // Limpia tickets viejos (más de 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString().split('T')[0];

    const { data: oldPrices } = await supabase
      .from('prices')
      .select('id, receipt_url')
      .eq('user_id', userId)
      .not('receipt_url', 'is', null)
      .lt('date_recorded', cutoff);

    if (oldPrices && oldPrices.length > 0) {
      for (const p of oldPrices) {
        if (!p.receipt_url) continue;
        const urlParts = p.receipt_url.split('/receipts/');
        if (urlParts.length > 1) {
          await supabase.storage.from('receipts').remove([urlParts[1]]);
        }
        await supabase.from('prices').update({ receipt_url: null }).eq('id', p.id);
      }
    }

    const { data } = await supabase
      .from('profiles')
      .select('id, username, xp, level, pet_name, coins, hunger')
      .eq('id', userId)
      .single();
    setProfile(data);
  }

  async function refreshProfile() {
    if (user) {
      await fetchProfile(user.id);
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) await fetchProfile(session.user.id);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
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
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
