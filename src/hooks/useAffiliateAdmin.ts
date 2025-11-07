import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Affiliate, AffiliateReferral, AffiliateCommission, AffiliateSettings, AffiliateStats } from '../types/affiliate';

export function useAffiliateAdmin() {
  const { user } = useAuth();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([]);
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [settings, setSettings] = useState<AffiliateSettings | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const enrichWithUserData = async (referrals: any[]) => {
    if (!referrals.length) return referrals;

    // Collecter tous les IDs utilisateur uniques
    const userIds = [...new Set(referrals.map(r => r.referred_user_id).filter(Boolean))];
    
    if (!userIds.length) return referrals;

    // Récupérer les données utilisateur
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name')
      .in('id', userIds);

    if (error) {
      console.error('Erreur chargement utilisateurs:', error);
      return referrals;
    }

    // Enrichir les parrainages avec les données utilisateur
    return referrals.map(referral => ({
      ...referral,
      referred_user: users?.find(u => u.id === referral.referred_user_id) || null
    }));
  };

  const enrichCommissionsWithUserData = async (commissions: any[]) => {
    if (!commissions.length) return commissions;

    // Collecter tous les IDs utilisateur uniques depuis les referrals
    const userIds = [...new Set(
      commissions
        .map(c => c.referral?.referred_user_id)
        .filter(Boolean)
    )];
    
    if (!userIds.length) return commissions;

    // Récupérer les données utilisateur
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name')
      .in('id', userIds);

    if (error) {
      console.error('Erreur chargement utilisateurs pour commissions:', error);
      return commissions;
    }

    // Enrichir les commissions avec les données utilisateur
    return commissions.map(commission => ({
      ...commission,
      referral: commission.referral ? {
        ...commission.referral,
        referred_user: users?.find(u => u.id === commission.referral.referred_user_id) || null
      } : null
    }));
  };

  const fetchAllData = async () => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }

    try {
      setError(null);

      // Vérifier si l'utilisateur est super admin
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_super_admin')
        .eq('id', user.id)
        .single();

      if (userError || !userData?.is_super_admin) {
        throw new Error('Accès refusé - Super admin requis');
      }

      // Récupérer les paramètres
      const { data: settingsData, error: settingsError } = await supabase
        .from('affiliate_settings')
        .select('*')
        .single();

      if (settingsError) {
        console.warn('Paramètres d\'affiliation non trouvés');
      } else {
        setSettings(settingsData);
      }

      // Récupérer tous les affiliés
      const { data: affiliatesData, error: affiliatesError } = await supabase
        .from('affiliates')
        .select('*')
        .order('total_commissions', { ascending: false });

      if (affiliatesError) {
        throw affiliatesError;
      }

      setAffiliates(affiliatesData || []);

      // Récupérer tous les parrainages
      const { data: rawReferrals, error: referralsError } = await supabase
        .from('affiliate_referrals')
        .select('*')
        .order('created_at', { ascending: false });

      if (referralsError) {
        throw referralsError;
      }

      // Enrichir avec les données utilisateur
      const enrichedReferrals = await enrichWithUserData(rawReferrals || []);
      setReferrals(enrichedReferrals);

      // Récupérer toutes les commissions
      const { data: rawCommissions, error: commissionsError } = await supabase
        .from('affiliate_commissions')
        .select(`
          *,
          referral:affiliate_referrals(*)
        `)
        .order('commission_month', { ascending: false });

      if (commissionsError) {
        throw commissionsError;
      }

      // Enrichir avec les données utilisateur
      const enrichedCommissions = await enrichCommissionsWithUserData(rawCommissions || []);
      setCommissions(enrichedCommissions);

      // Calculer les statistiques
      calculateStats(affiliatesData || [], enrichedReferrals, enrichedCommissions);

    } catch (err) {
      console.error('Erreur chargement données affiliation admin:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (affiliatesData: Affiliate[], referralsData: AffiliateReferral[], commissionsData: AffiliateCommission[]) => {
    const totalReferrals = referralsData.length;
    const successfulConversions = referralsData.filter(r => r.conversion_date).length;
    const conversionRate = totalReferrals > 0 ? (successfulConversions / totalReferrals) * 100 : 0;
    
    const totalCommissions = commissionsData.reduce((sum, c) => sum + c.amount, 0);
    const pendingCommissions = commissionsData.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);
    const paidCommissions = commissionsData.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);
    
    // Commissions du mois actuel
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthlyCommissions = commissionsData
      .filter(c => c.commission_month.startsWith(currentMonth))
      .reduce((sum, c) => sum + c.amount, 0);

    // Top performers
    const topPerformers = affiliatesData
      .sort((a, b) => b.total_commissions - a.total_commissions)
      .slice(0, 5)
      .map(affiliate => ({
        affiliate,
        user: null, // À enrichir si nécessaire
        commissions: affiliate.total_commissions
      }));

    setStats({
      totalReferrals,
      successfulConversions,
      conversionRate,
      totalCommissions,
      pendingCommissions,
      paidCommissions,
      monthlyCommissions,
      topPerformers
    });
  };

  const updateSettings = async (newSettings: Partial<AffiliateSettings>) => {
    if (!supabase || !settings) {
      throw new Error('Paramètres non disponibles');
    }

    try {
      const { data, error } = await supabase
        .from('affiliate_settings')
        .update({
          ...newSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setSettings(data);
      return data;
    } catch (err) {
      console.error('Erreur mise à jour paramètres:', err);
      throw err;
    }
  };

  const payCommission = async (commissionId: string) => {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }

    try {
      const { data, error } = await supabase
        .from('affiliate_commissions')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', commissionId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Mettre à jour les totaux de l'affilié
      const commission = commissions.find(c => c.id === commissionId);
      if (commission) {
        await supabase
          .from('affiliates')
          .update({
            pending_commissions: supabase.rpc('decrement', { amount: commission.amount }),
            paid_commissions: supabase.rpc('increment', { amount: commission.amount }),
            updated_at: new Date().toISOString()
          })
          .eq('id', commission.affiliate_id);
      }

      await fetchAllData();
      return data;
    } catch (err) {
      console.error('Erreur paiement commission:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user?.id]);

  return {
    affiliates,
    referrals,
    commissions,
    settings,
    stats,
    loading,
    error,
    updateSettings,
    payCommission,
    refetch: fetchAllData
  };
}
