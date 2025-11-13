import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'starter' | 'pro';
  billing_cycle: 'monthly' | 'annual';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  current_period_start: string;
  current_period_end: string;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSubscription();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user]);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setSubscription(null);
        } else {
          throw fetchError;
        }
      } else {
        setSubscription(data);
      }
    } catch (err) {
      console.error('Error loading subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  };

  const createCheckoutSession = async (
    planType: 'starter' | 'pro',
    billingCycle: 'monthly' | 'annual'
  ): Promise<string> => {
    try {
      // Créer la session de paiement avec l'URL de succès correcte
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          planType,
          billingCycle,
          // CORRECTION : Rediriger vers le dashboard après paiement
          successUrl: `${window.location.origin}/dashboard?payment=success`,
          cancelUrl: `${window.location.origin}/dashboard?payment=cancelled`
        }
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No checkout URL returned');

      return data.url;
    } catch (err) {
      console.error('Error creating checkout session:', err);
      throw err;
    }
  };

  const cancelSubscription = async (): Promise<void> => {
    try {
      if (!subscription?.stripe_subscription_id) {
        throw new Error('No active subscription found');
      }

      const { error } = await supabase.functions.invoke('cancel-subscription', {
        body: {
          subscriptionId: subscription.stripe_subscription_id
        }
      });

      if (error) throw error;

      await loadSubscription();
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      throw err;
    }
  };

  const reactivateSubscription = async (): Promise<void> => {
    try {
      if (!subscription?.stripe_subscription_id) {
        throw new Error('No subscription found');
      }

      const { error } = await supabase.functions.invoke('reactivate-subscription', {
        body: {
          subscriptionId: subscription.stripe_subscription_id
        }
      });

      if (error) throw error;

      await loadSubscription();
    } catch (err) {
      console.error('Error reactivating subscription:', err);
      throw err;
    }
  };

  return {
    subscription,
    loading,
    error,
    createCheckoutSession,
    cancelSubscription,
    reactivateSubscription,
    refreshSubscription: loadSubscription
  };
}
