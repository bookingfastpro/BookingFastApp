import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = window.location.pathname;
  const isPublicPage =
    pathname === '/' ||
    pathname.startsWith('/booking/') ||
    pathname === '/payment' ||
    pathname.startsWith('/payment?') ||
    pathname.includes('/payment') ||
    pathname === '/login' ||
    pathname === '/privacy-policy' ||
    pathname === '/terms-of-service';

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isPublicPage) {
      return;
    }

    if (!supabase) {
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);

        if (_event === 'SIGNED_UP' && session?.user) {
          await initializeNewAccount(session.user.id);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isPublicPage]);

  const initializeNewAccount = async (userId: string) => {
    if (!supabase) return;

    try {
      await Promise.all([
        supabase.from('profiles').upsert({
          id: userId,
          email: user?.email || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }),
        supabase.from('business_settings').upsert({
          user_id: userId,
          business_name: 'Mon Entreprise',
          primary_color: '#3B82F6',
          secondary_color: '#8B5CF6',
          opening_hours: {
            monday: { start: '08:00', end: '18:00', closed: false },
            tuesday: { start: '08:00', end: '18:00', closed: false },
            wednesday: { start: '08:00', end: '18:00', closed: false },
            thursday: { start: '08:00', end: '18:00', closed: false },
            friday: { start: '08:00', end: '18:00', closed: false },
            saturday: { start: '09:00', end: '17:00', closed: false },
            sunday: { start: '09:00', end: '17:00', closed: true }
          },
          buffer_minutes: 15,
          default_deposit_percentage: 30,
          email_notifications: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      ]);
    } catch (error) {
      // Silent fail
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase non configuré');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase non configuré');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      await initializeNewAccount(data.user.id);
    }
  };

  const signOut = async () => {
    if (!supabase) throw new Error('Supabase non configuré');

    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });

      if (error && !error.message?.includes('session')) {
        throw error;
      }

      setSession(null);
      setUser(null);
      window.location.href = '/login';
    } catch (error) {
      localStorage.removeItem('bookingfast-auth');
      setSession(null);
      setUser(null);
      window.location.href = '/login';
    }
  };

  const value = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
