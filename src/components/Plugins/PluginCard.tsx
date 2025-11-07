import React, { useState } from 'react';
import { Plugin, PluginSubscription } from '../../types/plugin';
import { Sparkles, Check, Clock, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '../UI/Button';
import { usePlugins } from '../../hooks/usePlugins';

interface PluginCardProps {
  plugin: Plugin;
  subscription?: PluginSubscription;
  onSubscribe?: (pluginId: string) => void;
  onManage?: (subscription: PluginSubscription) => void;
}

export function PluginCard({ plugin, subscription, onSubscribe, onManage }: PluginCardProps) {
  const [loading, setLoading] = useState(false);
  const { createCheckoutSession } = usePlugins();

  const handleSubscribe = async () => {
    if (!onSubscribe) return;
    
    setLoading(true);
    try {
      await onSubscribe(plugin.id);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const checkoutUrl = await createCheckoutSession(plugin.id);
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Erreur création session:', error);
      alert('Erreur lors de la création de la session de paiement');
    } finally {
      setLoading(false);
    }
  };

  const isActive = subscription?.status === 'active';
  const isTrial = subscription?.status === 'trial';
  const isCancelled = subscription?.status === 'cancelled';
  const hasGracePeriod = isCancelled && subscription?.current_period_end && new Date(subscription.current_period_end) > new Date();

  const getStatusBadge = () => {
    if (hasGracePeriod) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
          <Calendar className="w-4 h-4" />
          Actif jusqu'au {new Date(subscription!.current_period_end!).toLocaleDateString('fr-FR')}
        </div>
      );
    }
    
    if (isActive) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          <Check className="w-4 h-4" />
          Actif
        </div>
      );
    }
    
    if (isTrial) {
      const daysLeft = subscription?.trial_ends_at 
        ? Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;
      
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          <Clock className="w-4 h-4" />
          Essai - {daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      {/* Header avec icône et badge */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <span className="text-3xl">{plugin.icon}</span>
          </div>
          {plugin.is_featured && (
            <div className="flex items-center gap-1 px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">
              <Sparkles className="w-3 h-3" />
              Populaire
            </div>
          )}
        </div>
        
        <h3 className="text-2xl font-bold mb-2">{plugin.name}</h3>
        <p className="text-white/90 text-sm">{plugin.description}</p>
      </div>

      {/* Contenu */}
      <div className="p-6 space-y-4">
        {/* Badge de statut */}
        {getStatusBadge()}

        {/* Message grace period */}
        {hasGracePeriod && (
          <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-orange-700">
              <p className="font-medium mb-1">Abonnement résilié</p>
              <p>Vous conservez l'accès jusqu'au {new Date(subscription!.current_period_end!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        )}

        {/* Prix */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">
            {plugin.price === 0 ? 'Gratuit' : `${plugin.price}€`}
          </span>
          {plugin.price > 0 && (
            <span className="text-gray-500">/mois</span>
          )}
        </div>

        {/* Fonctionnalités */}
        {plugin.features && plugin.features.length > 0 && (
          <ul className="space-y-2">
            {plugin.features.slice(0, 3).map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Actions */}
        <div className="pt-4 space-y-2">
          {!subscription && (
            <Button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Activation...' : 'Essai gratuit 7 jours'}
            </Button>
          )}

          {isTrial && (
            <Button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {loading ? 'Chargement...' : 'Passer à la version payante'}
            </Button>
          )}

          {(isActive || hasGracePeriod) && onManage && (
            <Button
              onClick={() => onManage(subscription!)}
              variant="outline"
              className="w-full"
            >
              Gérer l'abonnement
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
