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
  const [loading, setLoading] = useState(!isPublicPage);

  useEffect(() => {
    if (isPublicPage) {
      console.log('🌐 Page publique détectée - skip auth');
      setLoading(false);
      return;
    }

    if (!supabase) {
      console.error('❌ Supabase non configuré');
      setLoading(false);
      return;
    }

    let mounted = true;

    console.log('🔍 Vérification de la session...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        console.log('📋 Session récupérée:', session ? '✅ Connecté' : '❌ Non connecté');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        console.log('🔐 Auth state changed:', _event, session ? '✅ Session active' : '❌ Pas de session');
        setSession(session);
        setUser(session?.user ?? null);
        
        if (_event === 'SIGNED_IN') {
          console.log('✅ SIGNED_IN détecté - utilisateur connecté');
        }
        
        if (_event === 'SIGNED_UP' && session?.user) {
          console.log('🆕 Nouveau compte détecté, initialisation...');
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
      console.log('🔧 Initialisation du compte:', userId);
      
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: user?.email || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (profileError) {
        console.error('❌ Erreur création profil:', profileError);
      } else {
        console.log('✅ Profil créé');
      }
      
      const { error: settingsError } = await supabase
        .from('business_settings')
        .upsert({
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
        });
      
      if (settingsError) {
        console.error('❌ Erreur création paramètres:', settingsError);
      } else {
        console.log('✅ Paramètres créés');
      }
      
      console.log('✅ Initialisation terminée');
    } catch (error) {
      console.error('❌ Erreur initialisation compte:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase non configuré');
    
    console.log('🔑 Tentative de connexion pour:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('❌ Erreur connexion:', error);
      throw error;
    }
    
    console.log('✅ Connexion réussie - Session:', data.session ? '✅ Active' : '❌ Manquante');
    console.log('✅ User:', data.user ? '✅ Présent' : '❌ Manquant');
  };

  const signUp = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase non configuré');
    
    console.log('📝 Tentative d\'inscription pour:', email);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      console.error('❌ Erreur inscription:', error);
      throw error;
    }
    
    console.log('✅ Inscription réussie');
    
    if (data.user) {
      await initializeNewAccount(data.user.id);
    }
  };

  const signOut = async () => {
    if (!supabase) {
      console.error('❌ Supabase non configuré');
      throw new Error('Supabase non configuré');
    }

    try {
      console.log('🚪 Déconnexion en cours...');

      const { error } = await supabase.auth.signOut({ 
        scope: 'local' 
      });

      if (error) {
        console.error('❌ Erreur lors de la déconnexion:', error);
        
        if (error.message?.includes('session') || error.message?.includes('Session')) {
          console.warn('⚠️ Session manquante, nettoyage local forcé');
          localStorage.removeItem('bookingfast-auth');
          setSession(null);
          setUser(null);
          window.location.href = '/login';
          return;
        }
        
        throw error;
      }

      console.log('✅ Déconnexion réussie - redirection vers /login');
      setSession(null);
      setUser(null);
      window.location.href = '/login';
      
    } catch (error) {
      console.error('❌ Erreur critique lors de la déconnexion:', error);
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

  console.log('🔐 AuthContext - État actuel:', { 
    isAuthenticated: !!user, 
    loading,
    hasUser: !!user,
    hasSession: !!session
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
