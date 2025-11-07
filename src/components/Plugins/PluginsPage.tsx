import React, { useState, useEffect } from 'react';
import { Package, Sparkles, Check, X, Settings as SettingsIcon, Crown, Zap, AlertCircle, CreditCard, Clock, ExternalLink, XCircle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { usePlugins } from '../../hooks/usePlugins';
import { Plugin } from '../../types/plugin';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';

export function PluginsPage() {
  const { user } = useAuth();
  const { plugins, userSubscriptions, loading, hasUsedTrial, subscribeToPlugin, createCheckoutSession, cancelSubscription, refetch } = usePlugins();
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [trialUsedMap, setTrialUsedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const checkTrialStatus = async () => {
      if (!user) return;
      
      const trialStatus: Record<string, boolean> = {};
      
      for (const plugin of plugins) {
        const used = await hasUsedTrial(plugin.id);
        trialStatus[plugin.id] = used;
      }
      
      setTrialUsedMap(trialStatus);
    };

    checkTrialStatus();
  }, [plugins, user, hasUsedTrial]);

  const [shouldRefetch, setShouldRefetch] = useState(false);
  
  useEffect(() => {
    if (!shouldRefetch) return;

    let count = 0;
    const maxCount = 5;
    
    const interval = setInterval(async () => {
      console.log('🔄 Rechargement automatique des données...');
      await refetch();
      count++;
      
      if (count >= maxCount) {
        clearInterval(interval);
        setShouldRefetch(false);
        console.log('✅ Fin du rechargement automatique');
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [shouldRefetch, refetch]);

  const getSubscription = (pluginId: string) => {
    return userSubscriptions.find(sub => sub.plugin_id === pluginId);
  };

  const isTrialActive = (pluginId: string) => {
    const subscription = getSubscription(pluginId);
    if (!subscription || subscription.status !== 'trial') return false;
    
    if (!subscription.trial_ends_at) return false;
    
    const endDate = new Date(subscription.trial_ends_at);
    const now = new Date();
    
    return now < endDate;
  };

  const isTrialExpired = (pluginId: string) => {
    const subscription = getSubscription(pluginId);
    if (!subscription || subscription.status !== 'trial') return false;
    
    if (!subscription.trial_ends_at) return false;
    
    const endDate = new Date(subscription.trial_ends_at);
    const now = new Date();
    
    return now >= endDate;
  };

  const isSubscribed = (pluginId: string) => {
    const subscription = getSubscription(pluginId);
    return subscription?.status === 'active';
  };

  const getTrialDaysLeft = (pluginId: string): number => {
    const subscription = getSubscription(pluginId);
    if (!subscription || !subscription.trial_ends_at) return 0;
    
    const endDate = new Date(subscription.trial_ends_at);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const handleStartTrial = async (plugin: Plugin) => {
    console.log('🎯 Démarrage essai gratuit:', plugin.name);
    
    setSubscribing(true);
    setSubscriptionError(null);
    
    try {
      const result = await subscribeToPlugin(plugin.id, []);
      
      console.log('✅ Essai gratuit démarré:', result);
      
      setShouldRefetch(true);
      await refetch();
      
      setSelectedPlugin(null);
      
      console.log('🎉 Processus terminé avec succès');
    } catch (err) {
      console.error('❌ Erreur démarrage essai:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du démarrage de l\'essai';
      setSubscriptionError(errorMessage);
      alert(`⚠️ ${errorMessage}`);
    } finally {
      setSubscribing(false);
    }
  };

  const handleSubscribe = async (plugin: Plugin) => {
    if (!user) {
      alert('⚠️ Vous devez être connecté pour vous abonner');
      return;
    }

    console.log('💳 Création session Checkout Stripe pour:', plugin.name);
    
    setSubscribing(true);
    setSubscriptionError(null);

    try {
      const checkoutUrl = await createCheckoutSession(plugin.id);
      
      console.log('✅ Redirection vers Stripe:', checkoutUrl);
      
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('❌ Erreur création session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création de la session';
      setSubscriptionError(errorMessage);
      alert(`Erreur: ${errorMessage}`);
      setSubscribing(false);
    }
  };

  const handleCancelSubscription = async (plugin: Plugin) => {
    const subscription = getSubscription(plugin.id);
    if (!subscription) return;

    const confirmed = window.confirm(
      `⚠️ Êtes-vous sûr de vouloir résilier votre abonnement à "${plugin.name}" ?\n\n` +
      `Votre accès restera actif jusqu'à la fin de la période en cours, puis sera automatiquement désactivé.\n\n` +
      `Vous pourrez vous réabonner à tout moment.`
    );

    if (!confirmed) return;

    console.log('🔴 Résiliation abonnement:', plugin.name);
    
    setCancelling(true);
    setSubscriptionError(null);

    try {
      await cancelSubscription(subscription.id);
      
      console.log('✅ Abonnement résilié');
      
      setShouldRefetch(true);
      await refetch();
      
      alert('✅ Votre abonnement a été résilié. Vous conservez l\'accès jusqu\'à la fin de la période en cours.');
      
      setSelectedPlugin(null);
    } catch (err) {
      console.error('❌ Erreur résiliation:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la résiliation';
      setSubscriptionError(errorMessage);
      alert(`Erreur: ${errorMessage}`);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const featuredPlugins = plugins.filter(p => p.is_featured);
  const otherPlugins = plugins.filter(p => !p.is_featured);

  return (
    <div 
      className="space-y-8"
      style={{ paddingBottom: 'max(6rem, calc(6rem + env(safe-area-inset-bottom)))' }}
    >
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-3xl p-8 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Marketplace de Plugins</h1>
            <p className="text-white/90 text-lg">Étendez les fonctionnalités de votre plateforme</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="font-bold">7 jours d'essai gratuit</span>
            </div>
            <p className="text-sm text-white/80">Testez chaque plugin une seule fois</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-yellow-300" />
              <span className="font-bold">Activation instantanée</span>
            </div>
            <p className="text-sm text-white/80">Utilisez vos plugins immédiatement</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-5 h-5 text-yellow-300" />
              <span className="font-bold">Abonnement mensuel</span>
            </div>
            <p className="text-sm text-white/80">Annulation à tout moment</p>
          </div>
        </div>
      </div>

      {featuredPlugins.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900">Plugins en vedette</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPlugins.map(plugin => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                isSubscribed={isSubscribed(plugin.id)}
                isTrialActive={isTrialActive(plugin.id)}
                isTrialExpired={isTrialExpired(plugin.id)}
                trialDaysLeft={getTrialDaysLeft(plugin.id)}
                trialUsed={trialUsedMap[plugin.id] || false}
                subscription={getSubscription(plugin.id)}
                onSelect={() => setSelectedPlugin(plugin)}
              />
            ))}
          </div>
        </div>
      )}

      {otherPlugins.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Tous les plugins</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherPlugins.map(plugin => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                isSubscribed={isSubscribed(plugin.id)}
                isTrialActive={isTrialActive(plugin.id)}
                isTrialExpired={isTrialExpired(plugin.id)}
                trialDaysLeft={getTrialDaysLeft(plugin.id)}
                trialUsed={trialUsedMap[plugin.id] || false}
                subscription={getSubscription(plugin.id)}
                onSelect={() => setSelectedPlugin(plugin)}
              />
            ))}
          </div>
        </div>
      )}

      {selectedPlugin && (
        <PluginModal
          plugin={selectedPlugin}
          isSubscribed={isSubscribed(selectedPlugin.id)}
          isTrialActive={isTrialActive(selectedPlugin.id)}
          isTrialExpired={isTrialExpired(selectedPlugin.id)}
          trialDaysLeft={getTrialDaysLeft(selectedPlugin.id)}
          trialUsed={trialUsedMap[selectedPlugin.id] || false}
          subscribing={subscribing}
          cancelling={cancelling}
          error={subscriptionError}
          onClose={() => {
            setSelectedPlugin(null);
            setSubscriptionError(null);
          }}
          onStartTrial={() => handleStartTrial(selectedPlugin)}
          onSubscribe={() => handleSubscribe(selectedPlugin)}
          onCancel={() => handleCancelSubscription(selectedPlugin)}
        />
      )}
    </div>
  );
}

interface PluginCardProps {
  plugin: Plugin;
  isSubscribed: boolean;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  trialDaysLeft: number;
  trialUsed: boolean;
  subscription?: any;
  onSelect: () => void;
}

function PluginCard({ plugin, isSubscribed, isTrialActive, isTrialExpired, trialDaysLeft, trialUsed, subscription, onSelect }: PluginCardProps) {
  const IconComponent = (LucideIcons as any)[plugin.icon] || Package;
  const includedFeatures = plugin.features.filter(f => f.included);

  const getStatusBadge = () => {
    if (isSubscribed) {
      return (
        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Check className="w-3 h-3" />
          Actif
        </span>
      );
    }
    
    if (isTrialActive) {
      return (
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Essai ({trialDaysLeft}j)
        </span>
      );
    }
    
    if (isTrialExpired || trialUsed) {
      return (
        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Essai utilisé
        </span>
      );
    }
    
    return null;
  };

  const getButtonText = () => {
    if (isSubscribed) {
      return (
        <span className="flex items-center justify-center gap-2">
          <SettingsIcon className="w-5 h-5" />
          Gérer
        </span>
      );
    }
    
    if (isTrialActive) {
      return (
        <span className="flex items-center justify-center gap-2">
          <SettingsIcon className="w-5 h-5" />
          Voir détails
        </span>
      );
    }
    
    if (isTrialExpired || trialUsed) {
      return (
        <span className="flex items-center justify-center gap-2">
          <CreditCard className="w-5 h-5" />
          S'abonner maintenant
        </span>
      );
    }
    
    return (
      <span className="flex items-center justify-center gap-2">
        <Sparkles className="w-5 h-5" />
        Essai gratuit 7j
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-purple-200">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <IconComponent className="w-7 h-7 text-white" />
          </div>
          {getStatusBadge()}
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">{plugin.name}</h3>
        <p className="text-gray-600 text-sm">{plugin.description}</p>
      </div>

      <div className="px-6 py-4 bg-gray-50 border-y border-gray-100">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">{plugin.base_price}€</span>
          <span className="text-gray-600">/mois</span>
        </div>
        {!isSubscribed && !isTrialActive && (
          <p className="text-sm text-purple-600 font-medium mt-1">
            {(isTrialExpired || trialUsed) ? 'Abonnement mensuel' : '+ 7 jours d\'essai gratuit'}
          </p>
        )}
      </div>

      <div className="p-6">
        <p className="text-sm font-bold text-gray-900 mb-3">Fonctionnalités incluses :</p>
        <ul className="space-y-2 mb-6">
          {includedFeatures.slice(0, 3).map(feature => (
            <li key={feature.id} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">{feature.name}</span>
            </li>
          ))}
          {includedFeatures.length > 3 && (
            <li className="text-sm text-purple-600 font-medium">
              + {includedFeatures.length - 3} autres fonctionnalités
            </li>
          )}
        </ul>

        <button
          onClick={onSelect}
          className={`w-full py-3 rounded-xl font-bold transition-all duration-300 ${
            isSubscribed || isTrialActive
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : (isTrialExpired || trialUsed)
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {getButtonText()}
        </button>
      </div>
    </div>
  );
}

interface PluginModalProps {
  plugin: Plugin;
  isSubscribed: boolean;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  trialDaysLeft: number;
  trialUsed: boolean;
  subscribing: boolean;
  cancelling: boolean;
  error: string | null;
  onClose: () => void;
  onStartTrial: () => void;
  onSubscribe: () => void;
  onCancel: () => void;
}

function PluginModal({ plugin, isSubscribed, isTrialActive, isTrialExpired, trialDaysLeft, trialUsed, subscribing, cancelling, error, onClose, onStartTrial, onSubscribe, onCancel }: PluginModalProps) {
  const IconComponent = (LucideIcons as any)[plugin.icon] || Package;
  const includedFeatures = plugin.features.filter(f => f.included);
  const additionalFeatures = plugin.features.filter(f => !f.included);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-8 text-white sticky top-0 z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <IconComponent className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">{plugin.name}</h2>
                <p className="text-white/90 text-lg mt-1">{plugin.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold">{plugin.base_price}€</span>
            <span className="text-xl text-white/80">/mois</span>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-900">Erreur</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {isSubscribed && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-green-900 mb-2">Abonnement actif</h3>
                  <p className="text-green-800 mb-4">
                    Vous avez un accès complet à toutes les fonctionnalités de ce plugin.
                  </p>
                  <button
                    onClick={onCancel}
                    disabled={cancelling}
                    className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {cancelling ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Résiliation...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5" />
                        Résilier l'abonnement
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {isTrialActive && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-blue-900 mb-2">Essai gratuit en cours</h3>
                  <p className="text-blue-800 mb-2">
                    Il vous reste <strong>{trialDaysLeft} jour{trialDaysLeft > 1 ? 's' : ''}</strong> d'essai gratuit.
                  </p>
                  <p className="text-sm text-blue-700">
                    Profitez de toutes les fonctionnalités sans engagement. Vous pourrez souscrire à l'abonnement mensuel avant la fin de l'essai.
                  </p>
                </div>
              </div>
            </div>
          )}

          {(isTrialExpired || trialUsed) && !isSubscribed && !isTrialActive && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-orange-900 mb-2">Essai gratuit déjà utilisé</h3>
                  <p className="text-orange-800 mb-4">
                    Vous avez déjà bénéficié de l'essai gratuit de 7 jours pour ce plugin. Pour continuer à profiter de toutes les fonctionnalités, souscrivez à l'abonnement mensuel.
                  </p>
                  <div className="bg-white rounded-xl p-6 border-2 border-orange-300 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Abonnement mensuel</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-gray-900">{plugin.base_price}€</span>
                          <span className="text-gray-600">/mois</span>
                        </div>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <ul className="space-y-2 mb-4">
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-600" />
                        Facturation mensuelle automatique
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-600" />
                        Annulation à tout moment
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-600" />
                        Accès immédiat après paiement
                      </li>
                    </ul>
                    <button
                      onClick={onSubscribe}
                      disabled={subscribing}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {subscribing ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Redirection...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-5 h-5" />
                          S'abonner maintenant
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Check className="w-6 h-6 text-green-500" />
              Fonctionnalités incluses
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {includedFeatures.map(feature => (
                <div key={feature.id} className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-900">{feature.name}</p>
                      <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {additionalFeatures.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-500" />
                Fonctionnalités additionnelles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {additionalFeatures.map(feature => (
                  <div key={feature.id} className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{feature.name}</p>
                        <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                      </div>
                      <span className="bg-purple-600 text-white px-3 py-1 rounded-lg text-sm font-bold whitespace-nowrap">
                        +{feature.price}€/mois
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={onClose}
              disabled={subscribing || cancelling}
              className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Fermer
            </button>
            {!isSubscribed && !isTrialActive && !trialUsed && !isTrialExpired && (
              <button
                onClick={onStartTrial}
                disabled={subscribing || cancelling}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {subscribing ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" />
                    Activation...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Démarrer l'essai gratuit (7 jours)
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
