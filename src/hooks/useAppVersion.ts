import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AppVersion {
  id: string;
  version: string;
  build: string;
  release_notes?: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export function useAppVersion() {
  const [currentVersion, setCurrentVersion] = useState<AppVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentVersion = async () => {
    if (!isSupabaseConfigured) {
      // Version par défaut en mode démo
      const defaultVersion: AppVersion = {
        id: 'demo',
        version: '1.2.3',
        build: '2025.01.28',
        release_notes: 'Version de démonstration',
        is_current: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setCurrentVersion(defaultVersion);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      const { data, error: fetchError } = await supabase!
        .from('app_versions')
        .select('*')
        .eq('is_current', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.warn('⚠️ Erreur chargement version, utilisation version par défaut:', fetchError);
        // Version par défaut en cas d'erreur
        setCurrentVersion({
          id: 'fallback',
          version: '1.2.3',
          build: '2025.01.28',
          release_notes: '',
          is_current: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } else if (data) {
        setCurrentVersion(data);
        console.log('✅ Version actuelle chargée:', data.version, 'Build:', data.build);
      } else {
        // Aucune version trouvée, utiliser la version par défaut
        setCurrentVersion({
          id: 'default',
          version: '1.2.3',
          build: '2025.01.28',
          release_notes: '',
          is_current: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('❌ Erreur chargement version:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
      
      // Version par défaut en cas d'erreur
      setCurrentVersion({
        id: 'error',
        version: '1.2.3',
        build: '2025.01.28',
        release_notes: '',
        is_current: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentVersion();
  }, []);

  return {
    currentVersion,
    loading,
    error,
    refetch: fetchCurrentVersion
  };
}
