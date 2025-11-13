import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AffiliateData {
  id: string;
  user_id: string;
  affiliate_code: string;
  commission_rate: number;
  total_earnings: number;
  pending_earnings: number;
  is_active: boolean;
  created_at: string;
}

export function useAffiliate() {
  const { user } = useAuth();
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAffiliate, setIsAffiliate] = useState(false);

  useEffect(() => {
    if (!supabase || !user) {
      setLoading(false);
      return;
    }

    async function fetchAffiliateData() {
      try {
        const { data, error } = await supabase
          .from('affiliates')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setAffiliateData(data);
          setIsAffiliate(true);
        } else {
          setIsAffiliate(false);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données affilié:', error);
        setIsAffiliate(false);
      } finally {
        setLoading(false);
      }
    }

    fetchAffiliateData();
  }, [user]);

  const createAffiliateAccount = async () => {
    if (!supabase || !user) {
      throw new Error('Supabase non configuré ou utilisateur non connecté');
    }

    try {
      // Générer un code affilié unique
      const affiliateCode = `AFF${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const { data, error } = await supabase
        .from('affiliates')
        .insert({
          user_id: user.id,
          affiliate_code: affiliateCode,
          commission_rate: 20.00, // 20% par défaut
          total_earnings: 0,
          pending_earnings: 0,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      setAffiliateData(data);
      setIsAffiliate(true);

      return data;
    } catch (error) {
      console.error('Erreur lors de la création du compte affilié:', error);
      throw error;
    }
  };

  const updateCommissionRate = async (newRate: number) => {
    if (!supabase || !affiliateData) {
      throw new Error('Pas de compte affilié actif');
    }

    if (newRate < 0 || newRate > 100) {
      throw new Error('Le taux de commission doit être entre 0 et 100');
    }

    try {
      const { data, error } = await supabase
        .from('affiliates')
        .update({ commission_rate: newRate })
        .eq('id', affiliateData.id)
        .select()
        .single();

      if (error) throw error;

      setAffiliateData(data);
      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du taux de commission:', error);
      throw error;
    }
  };

  return {
    affiliateData,
    loading,
    isAffiliate,
    createAffiliateAccount,
    updateCommissionRate
  };
}
