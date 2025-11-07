import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

interface SubscriptionStatusProps {
  pluginSlug: string;
}

export function SubscriptionStatus({ pluginSlug }: SubscriptionStatusProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<'active' | 'trial' | 'inactive' | 'loading'>('loading');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function checkSubscription() {
      if (!supabase || !user) {
        setStatus('inactive');
        return;
      }

      try {
        const { data } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .eq('plugin_slug', pluginSlug)
          .in('status', ['active', 'trial'])
          .single();

        setStatus(data ? data.status : 'inactive');
      } catch (error) {
        setStatus('inactive');
      }
    }

    checkSubscription();
  }, [user, pluginSlug]);

  const handleSubscribe = async () => {
    if (!user || isProcessing) return;

    setIsProcessing(true);
    console.log('🔄 Démarrage processus abonnement...');

    try {
      // IMPORTANT: Utilise le Stripe de la PLATEFORME (pas celui de l'utilisateur)
      // Les utilisateurs paient la plateforme pour s'abonner
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          amount: 29.99, // Prix de l'abonnement
          currency: 'eur',
          success_url: `${window.location.origin}/plugins?subscription=success`,
          cancel_url: `${window.location.origin}/plugins?subscription=cancelled`,
          customer_email: user.email,
          service_name: `Abonnement ${pluginSlug}`,
          metadata: {
            user_id: user.id,
            plugin_slug: pluginSlug,
            payment_type: 'platform_subscription' // IMPORTANT: Indique que c'est un abonnement plateforme
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la session de paiement');
      }

      console.log('✅ Session Stripe créée:', data.sessionId);

      // Rediriger vers Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de paiement non reçue');
      }

    } catch (error) {
      console.error('❌ Erreur abonnement:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'abonnement');
    } finally {
      setIsProcessing(false);
    }
  };

  if (status === 'loading') {
    return null;
  }

  if (status === 'active') {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm">Actif</span>
      </div>
    );
  }

  if (status === 'trial') {
    return (
      <div className="flex items-center gap-2 text-blue-600">
        <Clock className="w-4 h-4" />
        <span className="text-sm">Essai</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={isProcessing}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Traitement...</span>
        </>
      ) : (
        <>
          <span className="text-sm">S'abonner</span>
        </>
      )}
    </button>
  );
}
