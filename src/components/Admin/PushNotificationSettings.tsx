import React, { useState } from 'react';
import { Bell, BellOff, Send, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useOneSignal } from '../../hooks/useOneSignal';
import { useAuth } from '../../contexts/AuthContext';

export function PushNotificationSettings() {
  const { user } = useAuth();
  const {
    isSubscribed,
    playerId,
    isInitialized,
    isLoading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification
  } = useOneSignal();

  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleToggleNotifications = async () => {
    if (!isInitialized) {
      setTestResult({
        success: false,
        message: 'OneSignal n\'est pas initialisé. Vérifiez votre configuration.'
      });
      return;
    }

    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        setTestResult({
          success: true,
          message: 'Vous ne recevrez plus de notifications push'
        });
      }
    } else {
      const granted = await requestPermission();
      if (granted) {
        setTestResult({
          success: true,
          message: 'Notifications push activées avec succès!'
        });
      } else {
        setTestResult({
          success: false,
          message: 'Permission de notification refusée. Vérifiez les paramètres de votre navigateur.'
        });
      }
    }
  };

  const handleSendTest = async () => {
    setIsSendingTest(true);
    setTestResult(null);

    const success = await sendTestNotification();

    setIsSendingTest(false);

    if (success) {
      setTestResult({
        success: true,
        message: 'Notification de test envoyée! Vérifiez votre navigateur.'
      });
    } else {
      setTestResult({
        success: false,
        message: 'Échec de l\'envoi de la notification de test. Vérifiez la console pour plus de détails.'
      });
    }
  };

  if (!isInitialized && !isLoading) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-yellow-900 mb-1">Configuration requise</h3>
            <p className="text-sm text-yellow-800">
              Les notifications push ne sont pas configurées. Ajoutez <code className="bg-yellow-100 px-2 py-1 rounded">VITE_ONESIGNAL_APP_ID</code> dans votre fichier .env
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-100">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isSubscribed ? 'bg-green-500' : 'bg-gray-400'
          }`}>
            {isSubscribed ? (
              <Bell className="w-6 h-6 text-white" />
            ) : (
              <BellOff className="w-6 h-6 text-white" />
            )}
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Notifications Push
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Recevez des notifications en temps réel pour les nouvelles réservations, modifications et annulations.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleToggleNotifications}
                disabled={isLoading}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  isSubscribed
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isSubscribed ? (
                  <>
                    <BellOff className="w-5 h-5" />
                    Désactiver
                  </>
                ) : (
                  <>
                    <Bell className="w-5 h-5" />
                    Activer
                  </>
                )}
              </button>

              {isSubscribed && (
                <button
                  onClick={handleSendTest}
                  disabled={isSendingTest || isLoading}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingTest ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Tester
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {testResult && (
          <div className={`mt-4 p-4 rounded-lg ${
            testResult.success
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-2">
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm ${
                testResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {testResult.message}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 border-2 border-gray-100">
        <h4 className="font-bold text-gray-900 mb-3">Statut de l'abonnement</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">État</span>
            <span className={`font-semibold ${isSubscribed ? 'text-green-600' : 'text-gray-400'}`}>
              {isSubscribed ? 'Activé' : 'Désactivé'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Player ID</span>
            <span className="font-mono text-xs text-gray-500">
              {playerId ? playerId.substring(0, 20) + '...' : 'Non disponible'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-600">Navigateur</span>
            <span className="font-semibold text-gray-700">
              {typeof Notification !== 'undefined' ? 'Compatible' : 'Non compatible'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-100">
        <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Comment ça marche ?
        </h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">•</span>
            <span>Vous recevrez une notification push pour chaque nouvelle réservation</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">•</span>
            <span>Les modifications de réservation génèrent également une notification</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">•</span>
            <span>Chaque notification inclut des boutons d'action directe (Voir, Appeler, etc.)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">•</span>
            <span>Cliquez sur une notification pour accéder directement à la réservation</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
