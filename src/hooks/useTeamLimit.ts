import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface TeamLimitInfo {
  allowed: boolean;
  limit: number | null;
  current: number;
  remaining: number | null;
  has_plugin?: boolean;
  subscription_tier?: string;
}

export function useTeamLimit() {
  const { user } = useAuth();
  const [limitInfo, setLimitInfo] = useState<TeamLimitInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkLimit = async () => {
    if (!user || !isSupabaseConfigured) {
      setLimitInfo(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Vérification limite équipe pour:', user.email);
      console.log('🆔 User ID:', user.id);

      // ✅ CORRECTION : JOIN avec subscription_plans pour récupérer la limite
      const { data: subscriptionData, error: subscriptionError } = await supabase!
        .from('subscriptions')
        .select(`
          plan_id,
          status,
          created_at,
          subscription_plans!inner(
            id,
            name,
            team_member_limit
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'trial'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        console.error('❌ Erreur récupération abonnement:', subscriptionError);
        throw subscriptionError;
      }

      console.log('📊 Données abonnement avec plan:', JSON.stringify(subscriptionData, null, 2));

      // Extraire les données du plan
      const planId = subscriptionData?.plan_id;
      const planName = subscriptionData?.subscription_plans?.name;
      const teamMemberLimit = subscriptionData?.subscription_plans?.team_member_limit;
      const status = subscriptionData?.status;

      console.log('📊 plan_id:', planId);
      console.log('📊 plan_name:', planName);
      console.log('📊 team_member_limit:', teamMemberLimit);
      console.log('📊 status:', status);

      // ✅ DEBUG: Vérifier TOUTES les souscriptions plugin de l'utilisateur
      console.log('🔍 === DÉBUT DEBUG PLUGIN SUBSCRIPTIONS ===');
      
      const { data: allPluginSubs, error: allPluginError } = await supabase!
        .from('plugin_subscriptions')
        .select(`
          id,
          plugin_id,
          status,
          is_trial,
          trial_ends_at,
          current_period_end,
          plugins!inner(
            id,
            slug,
            name
          )
        `)
        .eq('user_id', user.id);

      console.log('📋 TOUTES les souscriptions plugin:', JSON.stringify(allPluginSubs, null, 2));
      console.log('📊 Nombre total:', allPluginSubs?.length || 0);

      if (allPluginSubs && allPluginSubs.length > 0) {
        allPluginSubs.forEach((sub, index) => {
          console.log(`\n🔌 Plugin ${index + 1}:`);
          console.log('   - ID:', sub.id);
          console.log('   - Plugin ID:', sub.plugin_id);
          console.log('   - Nom:', sub.plugins?.name);
          console.log('   - Slug:', sub.plugins?.slug);
          console.log('   - Status:', sub.status);
          console.log('   - Is Trial:', sub.is_trial);
          console.log('   - Trial Ends:', sub.trial_ends_at);
          console.log('   - Period End:', sub.current_period_end);
        });
      } else {
        console.log('❌ AUCUNE souscription plugin trouvée pour cet utilisateur');
      }

      console.log('🔍 === FIN DEBUG PLUGIN SUBSCRIPTIONS ===\n');

      // ✅ Requête plugin avec statuts multiples pour debug
      const { data: pluginData, error: pluginError } = await supabase!
        .from('plugin_subscriptions')
        .select(`
          plugin_id,
          status,
          is_trial,
          trial_ends_at,
          plugins!inner(
            id,
            slug,
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('plugins.slug', 'entreprisepack')
        .maybeSingle();

      if (pluginError && pluginError.code !== 'PGRST116') {
        console.warn('⚠️ Erreur vérification plugin:', pluginError);
      }

      console.log('🔍 Données plugin "entreprisepack":', JSON.stringify(pluginData, null, 2));

      // ✅ Vérifier si le plugin existe et est actif OU en trial
      const hasPlugin = pluginData && 
        pluginData.plugins?.slug === 'entreprisepack' &&
        (pluginData.status === 'active' || 
         (pluginData.status === 'trial' && pluginData.trial_ends_at && new Date(pluginData.trial_ends_at) > new Date()));

      console.log('🔌 Plugin détecté:', pluginData?.plugins?.name || 'Aucun');
      console.log('🔌 Plugin slug:', pluginData?.plugins?.slug || 'N/A');
      console.log('🔌 Plugin status:', pluginData?.status || 'N/A');
      console.log('🔌 Plugin Pack Société:', hasPlugin ? '✅ ACTIF' : '❌ INACTIF');

      // Compter les membres actuels
      const { count: currentCount, error: countError } = await supabase!
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id)
        .eq('is_active', true);

      if (countError) {
        console.error('❌ Erreur comptage membres:', countError);
        throw countError;
      }

      const current = currentCount || 0;
      console.log('👥 Membres actuels:', current);

      // ✅ CORRECTION : Utiliser team_member_limit depuis subscription_plans
      let limit: number | null = 0;
      let allowed = false;

      console.log('🔍 Vérification des conditions:');
      console.log('   - hasPlugin:', hasPlugin);
      console.log('   - teamMemberLimit:', teamMemberLimit);
      console.log('   - status:', status);

      if (hasPlugin) {
        limit = null;
        allowed = true;
        console.log('✅ CONDITION 1: Pack Société actif - Membres illimités');
      } else if (status === 'active' && teamMemberLimit !== undefined && teamMemberLimit !== null) {
        limit = teamMemberLimit;
        allowed = current < limit;
        console.log(`✅ CONDITION 2: Plan actif avec limite ${limit} - Actuel: ${current}, Autorisé: ${allowed}`);
      } else {
        limit = 0;
        allowed = false;
        console.log('❌ CONDITION 3: Aucun abonnement actif ou limite non définie');
        console.log('   Raison: status =', status, ', teamMemberLimit =', teamMemberLimit);
      }

      const remaining = limit === null ? null : Math.max(0, limit - current);

      const result: TeamLimitInfo = {
        allowed,
        limit,
        current,
        remaining,
        has_plugin: hasPlugin,
        subscription_tier: planName || 'none'
      };

      console.log('📋 RÉSULTAT FINAL:', JSON.stringify(result, null, 2));
      console.log('🎯 canInviteMember:', result.allowed);
      console.log('🎯 isAtLimit:', limit !== null && current >= limit);

      setLimitInfo(result);
    } catch (err) {
      console.error('❌ Erreur vérification limite équipe:', err);
      setError(err instanceof Error ? err.message : 'Erreur de vérification');
      setLimitInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkLimit();
    } else {
      setLimitInfo(null);
    }
  }, [user?.id]);

  return {
    limitInfo,
    loading,
    error,
    refetch: checkLimit,
    canInviteMember: limitInfo?.allowed ?? false,
    isUnlimited: limitInfo?.limit === null,
    isAtLimit: limitInfo ? (limitInfo.limit !== null && limitInfo.current >= limitInfo.limit) : false,
    hasPlugin: limitInfo?.has_plugin ?? false
  };
}
