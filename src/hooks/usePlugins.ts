import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Plugin, PluginSubscription, UserPlugin } from '../types/plugin';
import { useAuth } from '../contexts/AuthContext';

export function usePlugins() {
  const { user } = useAuth();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<PluginSubscription[]>([]);
  const [userPlugins, setUserPlugins] = useState<UserPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlugins = useCallback(async () => {
    try {
      if (!supabase) {
        setPlugins([]);
        return;
      }

      const { data, error } = await supabase
        .from('plugins')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('name');

      if (error) throw error;
      setPlugins(data || []);
    } catch (err) {
      console.error('❌ Erreur chargement plugins:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    }
  }, []);

  const fetchUserSubscriptions = useCallback(async () => {
    try {
      if (!supabase || !user) {
        setUserSubscriptions([]);
        return;
      }

      console.log('🔍 Chargement abonnements pour:', user.id);

      const { data, error } = await supabase
        .from('plugin_subscriptions')
        .select(`
          *,
          plugin:plugins(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('✅ Abonnements chargés:', data?.length || 0);
      setUserSubscriptions(data || []);
    } catch (err) {
      console.error('❌ Erreur chargement abonnements:', err);
    }
  }, [user?.id]);

  const fetchUserPlugins = useCallback(async () => {
    try {
      if (!supabase || !user) {
        setUserPlugins([]);
        return;
      }

      console.log('🔍 Chargement plugins actifs pour:', user.id);

      const { data, error } = await supabase
        .rpc('get_user_active_plugins', { p_user_id: user.id });

      if (error) {
        console.error('❌ Erreur RPC:', error);
        throw error;
      }

      const formattedPlugins: UserPlugin[] = (data || []).map((plugin: any) => ({
        plugin_id: plugin.plugin_id,
        plugin_name: plugin.plugin_name,
        plugin_slug: plugin.plugin_slug,
        plugin_icon: plugin.plugin_icon,
        plugin_category: plugin.plugin_category,
        activated_features: plugin.activated_features || [],
        settings: plugin.settings || {}
      }));

      console.log('✅ Plugins actifs chargés:', formattedPlugins.length);
      setUserPlugins(formattedPlugins);

    } catch (err) {
      console.error('❌ Erreur chargement plugins actifs:', err);
      setUserPlugins([]);
    }
  }, [user?.id]);

  const hasPluginAccess = useCallback(async (pluginSlug: string): Promise<boolean> => {
    if (!user) {
      console.log('❌ Pas d\'utilisateur connecté');
      return false;
    }

    if (!supabase) {
      console.log('✅ Mode démo - accès autorisé');
      return true;
    }

    try {
      console.log(`🔍 Vérification accès plugin: ${pluginSlug}`);

      const { data, error } = await supabase
        .rpc('has_plugin_access', {
          p_user_id: user.id,
          p_plugin_slug: pluginSlug
        });

      if (error) {
        console.error('❌ Erreur vérification accès:', error);
        return false;
      }

      console.log(`🔐 Accès plugin ${pluginSlug}:`, data);
      return data || false;
    } catch (error) {
      console.error('❌ Erreur vérification accès:', error);
      return false;
    }
  }, [user?.id]);

  const hasUsedTrial = useCallback(async (pluginId: string): Promise<boolean> => {
    if (!supabase || !user) return false;

    try {
      const { data, error } = await supabase
        .rpc('has_used_trial', {
          p_user_id: user.id,
          p_plugin_id: pluginId
        });

      if (error) {
        console.error('❌ Erreur vérification trial:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('❌ Erreur vérification trial:', error);
      return false;
    }
  }, [user?.id]);

  const subscribeToPlugin = async (
    pluginId: string,
    activatedFeatures: string[] = []
  ): Promise<PluginSubscription> => {
    if (!supabase || !user) {
      throw new Error('Configuration invalide');
    }

    try {
      console.log('🎯 Début souscription plugin (trial):', pluginId);

      // ✅ Vérifier si l'utilisateur a déjà utilisé le trial
      const trialUsed = await hasUsedTrial(pluginId);
      
      if (trialUsed) {
        throw new Error('Vous avez déjà utilisé l\'essai gratuit pour ce plugin. Veuillez souscrire à l\'abonnement mensuel.');
      }

      const { data: existingSub, error: checkError } = await supabase
        .from('plugin_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('plugin_id', pluginId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingSub) {
        console.log('📋 Souscription existante trouvée:', existingSub.status);
        
        // ❌ Si trial déjà utilisé, ne pas permettre la réactivation
        if (existingSub.trial_used) {
          throw new Error('Vous avez déjà utilisé l\'essai gratuit pour ce plugin. Veuillez souscrire à l\'abonnement mensuel.');
        }
        
        if (existingSub.status === 'expired' || existingSub.status === 'cancelled') {
          console.log('🔄 Réactivation de la souscription en trial');
          
          const trialEnd = new Date();
          trialEnd.setDate(trialEnd.getDate() + 7);
          
          const { data: updatedSub, error: updateError } = await supabase
            .from('plugin_subscriptions')
            .update({
              status: 'trial',
              is_trial: true,
              trial_ends_at: trialEnd.toISOString(),
              trial_used: true, // ✅ Marquer comme utilisé
              current_period_start: new Date().toISOString(),
              current_period_end: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingSub.id)
            .select(`
              *,
              plugin:plugins(*)
            `)
            .single();

          if (updateError) throw updateError;

          console.log('✅ Souscription réactivée avec trial_ends_at:', trialEnd.toISOString());
          return updatedSub;
        }
        
        if (existingSub.status === 'trial' && (!existingSub.is_trial || !existingSub.trial_ends_at)) {
          console.log('🔧 Correction des champs trial manquants');
          
          const trialEnd = new Date();
          trialEnd.setDate(trialEnd.getDate() + 7);
          
          const { data: updatedSub, error: updateError } = await supabase
            .from('plugin_subscriptions')
            .update({
              is_trial: true,
              trial_ends_at: trialEnd.toISOString(),
              trial_used: true, // ✅ Marquer comme utilisé
              updated_at: new Date().toISOString()
            })
            .eq('id', existingSub.id)
            .select(`
              *,
              plugin:plugins(*)
            `)
            .single();

          if (updateError) throw updateError;

          console.log('✅ Champs trial corrigés, trial_ends_at:', trialEnd.toISOString());
          return updatedSub;
        }
        
        console.log('✅ Souscription déjà active');
        return existingSub as PluginSubscription;
      }

      console.log('➕ Création nouvelle souscription trial (7 jours)');
      
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7);
      
      const newSubscription = {
        user_id: user.id,
        plugin_id: pluginId,
        status: 'trial',
        is_trial: true,
        trial_ends_at: trialEnd.toISOString(),
        trial_used: true, // ✅ Marquer comme utilisé dès la création
        current_period_start: new Date().toISOString(),
        current_period_end: null
      };

      console.log('📝 Données de la nouvelle souscription:', newSubscription);

      const { data, error } = await supabase
        .from('plugin_subscriptions')
        .insert(newSubscription)
        .select(`
          *,
          plugin:plugins(*)
        `)
        .single();

      if (error) throw error;

      console.log('✅ Souscription trial créée avec trial_ends_at:', trialEnd.toISOString());

      return data;
    } catch (err) {
      console.error('❌ Erreur souscription plugin:', err);
      throw err;
    }
  };

  const createCheckoutSession = async (pluginId: string): Promise<string> => {
    if (!supabase || !user) {
      throw new Error('Configuration invalide');
    }

    try {
      console.log('💳 === APPEL EDGE FUNCTION ===');
      console.log('User ID:', user.id);
      console.log('Plugin ID:', pluginId);

      const { data, error } = await supabase.functions.invoke('create-plugin-checkout', {
        body: {
          userId: user.id,
          pluginId: pluginId
        }
      });

      console.log('📦 Réponse Edge Function:', { data, error });

      if (error) {
        console.error('❌ Erreur Edge Function:', error);
        throw new Error(error.message || 'Erreur lors de la création de la session');
      }

      if (!data || !data.url) {
        console.error('❌ Pas d\'URL dans la réponse:', data);
        throw new Error('Aucune URL de checkout reçue');
      }

      console.log('✅ Session créée:', data.sessionId);
      console.log('🔗 URL:', data.url);
      
      return data.url;
    } catch (err) {
      console.error('❌ Erreur création session:', err);
      throw err;
    }
  };

  const cancelSubscription = async (subscriptionId: string) => {
    if (!supabase || !user) throw new Error('Configuration invalide');

    try {
      console.log('🔴 Annulation abonnement:', subscriptionId);

      const { data: subscription, error: fetchError } = await supabase
        .from('plugin_subscriptions')
        .select('stripe_subscription_id')
        .eq('id', subscriptionId)
        .single();

      if (fetchError) throw fetchError;

      if (!subscription?.stripe_subscription_id) {
        throw new Error('Aucun abonnement Stripe trouvé');
      }

      console.log('💳 Stripe Subscription ID:', subscription.stripe_subscription_id);

      const { data, error: cancelError } = await supabase.functions.invoke('cancel-subscription', {
        body: {
          subscription_id: subscription.stripe_subscription_id
        }
      });

      if (cancelError) throw cancelError;

      console.log('✅ Réponse Stripe:', data);

      const { error: updateError } = await supabase
        .from('plugin_subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (updateError) throw updateError;

      console.log('✅ Abonnement marqué comme annulé');

      await fetchUserSubscriptions();
      await fetchUserPlugins();
    } catch (err) {
      console.error('❌ Erreur annulation abonnement:', err);
      throw err;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPlugins(),
        fetchUserSubscriptions(),
        fetchUserPlugins()
      ]);
      setLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user?.id, fetchPlugins, fetchUserSubscriptions, fetchUserPlugins]);

  return {
    plugins,
    userSubscriptions,
    userPlugins,
    loading,
    error,
    hasPluginAccess,
    hasUsedTrial,
    subscribeToPlugin,
    createCheckoutSession,
    cancelSubscription,
    refetch: async () => {
      console.log('🔄 Rechargement des données...');
      await Promise.all([
        fetchPlugins(),
        fetchUserSubscriptions(),
        fetchUserPlugins()
      ]);
      console.log('✅ Données rechargées');
    }
  };
}
