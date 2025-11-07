import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CompanyInfo } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function useCompanyInfo() {
  const { user } = useAuth();
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanyInfo = async () => {
    if (!user || !isSupabaseConfigured()) {
      setCompanyInfo(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase!
        .from('company_info')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setCompanyInfo(data);
    } catch (err) {
      console.error('Erreur chargement infos entreprise:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const updateCompanyInfo = async (updates: Partial<CompanyInfo>): Promise<void> => {
    if (!user || !isSupabaseConfigured()) {
      throw new Error('Supabase non configuré');
    }

    try {
      setError(null);

      // Utiliser UPSERT au lieu de INSERT/UPDATE séparés
      const { error } = await supabase!
        .from('company_info')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      await fetchCompanyInfo();
    } catch (err) {
      console.error('Erreur mise à jour infos entreprise:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchCompanyInfo();
    }
  }, [user?.id]);

  return {
    companyInfo,
    loading,
    error,
    fetchCompanyInfo,
    updateCompanyInfo
  };
}
