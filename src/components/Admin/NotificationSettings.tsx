import React, { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing, Check, X, Settings, Info } from 'lucide-react';
import { oneSignalService } from '../../lib/oneSignalService';
import { logger } from '../../utils/logger';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface NotificationPreferences {
  booking_created: boolean;
  booking_updated: boolean;
  booking_cancelled: boolean;
  payment_reminder: boolean;
  payment_completed: boolean;
}

export function NotificationSettings() {
  const { user } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushPermission, setPushPermission] = useState<'default' | 'granted' | 'denied'>('default');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    booking_created: true,
    booking_updated: true,
    booking_cancelled: true,
    payment_reminder: true,
    payment_completed: true
  });

  useEffect(() => {
    const checkPushStatus = async () => {
      try {
        const permission = await oneSignalService.getNotificationPermission();
        setPushPermission(permission);
        setPushEnabled(permission === 'granted');

        const id = await oneSignalService.getPlayerId();
        setPlayerId(id);

        setLoading(false);
      } catch (error) {
        logger.error('Error checking push status:', error);
        setLoading(false);
      }
    };

    checkPushStatus();
  }, []);

  const handleEnablePush = async () => {
    try {
      await oneSignalService.showSlidedown();

      setTimeout(async () => {
        const granted = await oneSignalService.isPushEnabled();
        if (granted) {
          setPushPermission('granted');
          setPushEnabled(true);

          if (user) {
            await oneSignalService.registerUser(user.id);
            const id = await oneSignalService.getPlayerId();
            setPlayerId(id);
          }
        }
      }, 1000);
    } catch (error) {
      logger.error('Error enabling push:', error);
    }
  };

  const handleTestNotification = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('send-onesignal-notification', {
        body: {
          userId: user.id,
          type: 'booking_created',
          title: 'Test de notification',
          message: 'Ceci est une notification de test. Si vous la voyez, tout fonctionne correctement !',
          data: {
            test: true
          }
        }
      });

      if (error) {
        logger.error('Error sending test notification:', error);
        alert('Erreur lors de l\'envoi de la notification de test');
      } else {
        alert('Notification de test envoyée ! Vérifiez votre navigateur.');
      }
    } catch (error) {
      logger.error('Error sending test notification:', error);
      alert('Erreur lors de l\'envoi de la notification de test');
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Notifications Push</h2>
          <p className="text-sm text-gray-600">Gérez vos préférences de notifications</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">À propos des notifications push</h3>
              <p className="text-sm text-blue-700">
                Les notifications push vous permettent de recevoir des alertes en temps réel, même quand l'application est fermée.
                Activez-les pour ne jamais manquer une réservation importante.
              </p>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {pushEnabled ? (
                <BellRing className="w-6 h-6 text-green-600" />
              ) : (
                <BellOff className="w-6 h-6 text-gray-400" />
              )}
              <div>
                <h3 className="font-semibold text-gray-900">Statut des notifications</h3>
                <p className="text-sm text-gray-600">
                  {pushPermission === 'granted' && 'Notifications activées'}
                  {pushPermission === 'denied' && 'Notifications bloquées'}
                  {pushPermission === 'default' && 'Notifications non configurées'}
                </p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              pushEnabled
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {pushEnabled ? 'Actif' : 'Inactif'}
            </div>
          </div>

          {playerId && (
            <div className="mb-4 p-2 bg-gray-50 rounded text-xs text-gray-600 font-mono break-all">
              ID: {playerId}
            </div>
          )}

          {pushPermission === 'denied' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                Les notifications sont bloquées. Pour les activer, allez dans les paramètres de votre navigateur et autorisez les notifications pour ce site.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {!pushEnabled && pushPermission !== 'denied' && (
              <button
                onClick={handleEnablePush}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4" />
                Activer les notifications
              </button>
            )}
            {pushEnabled && (
              <button
                onClick={handleTestNotification}
                className="flex-1 px-4 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                <BellRing className="w-4 h-4" />
                Envoyer une notification de test
              </button>
            )}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Préférences de notifications
          </h3>

          <div className="space-y-3">
            {Object.entries(preferences).map(([key, value]) => (
              <label
                key={key}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {key === 'booking_created' && 'Nouvelles réservations'}
                    {key === 'booking_updated' && 'Modifications de réservations'}
                    {key === 'booking_cancelled' && 'Annulations de réservations'}
                    {key === 'payment_reminder' && 'Rappels de paiement'}
                    {key === 'payment_completed' && 'Paiements reçus'}
                  </div>
                  <p className="text-xs text-gray-600">
                    {key === 'booking_created' && 'Recevoir une alerte pour chaque nouvelle réservation'}
                    {key === 'booking_updated' && 'Être notifié des changements de réservations'}
                    {key === 'booking_cancelled' && 'Recevoir une alerte lors d\'annulations'}
                    {key === 'payment_reminder' && 'Rappels pour les paiements en attente'}
                    {key === 'payment_completed' && 'Confirmation de réception des paiements'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handlePreferenceChange(key as keyof NotificationPreferences)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    value ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                      value ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </label>
            ))}
          </div>
        </div>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Compatibilité</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Chrome, Edge, Firefox, Safari (macOS 13+)</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Applications mobiles iOS et Android (PWA)</span>
            </li>
            <li className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Les notifications nécessitent une connexion internet</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
