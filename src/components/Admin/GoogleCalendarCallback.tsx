import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle, XCircle, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export function GoogleCalendarCallback() {
  const { user } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Connexion à Google Calendar en cours...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Récupérer les paramètres de l'URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');

        if (!code || !state) {
          throw new Error('Code ou state manquant dans l\'URL');
        }

        if (!user) {
          throw new Error('Utilisateur non connecté');
        }

        if (state !== user.id) {
          throw new Error('State invalide - possible attaque CSRF');
        }

        setMessage('Échange du code d\'autorisation...');

        // Configuration OAuth
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
        const redirectUri = `${window.location.origin}/auth/google/callback`;

        if (!clientId || !clientSecret) {
          throw new Error('Configuration OAuth manquante');
        }

        // Échanger le code contre un access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json();
          throw new Error(`Erreur échange token: ${errorData.error_description || errorData.error}`);
        }

        const tokenData = await tokenResponse.json();

        setMessage('Sauvegarde des tokens...');

        // Calculer la date d'expiration
        const expiryDate = new Date(Date.now() + tokenData.expires_in * 1000);

        // Préparer les données à insérer
        const tokenRecord = {
          user_id: user.id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expiry: expiryDate.toISOString(),
          scope: tokenData.scope || 'https://www.googleapis.com/auth/calendar',
        };

        // Vérifier si un token existe déjà
        const { data: existingToken } = await supabase
          .from('google_calendar_tokens')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingToken) {
          // Mettre à jour le token existant
          const { error: updateError } = await supabase
            .from('google_calendar_tokens')
            .update(tokenRecord)
            .eq('user_id', user.id);

          if (updateError) throw updateError;
        } else {
          // Créer un nouveau token
          const { error: insertError } = await supabase
            .from('google_calendar_tokens')
            .insert(tokenRecord);

          if (insertError) throw insertError;
        }

        setMessage('Mise à jour des paramètres...');

        // Mettre à jour les paramètres business
        const { error: settingsError } = await supabase
          .from('business_settings')
          .update({
            google_calendar_enabled: true,
            google_calendar_sync_status: 'connected',
          })
          .eq('user_id', user.id);

        if (settingsError) throw settingsError;

        setStatus('success');
        setMessage('✅ Google Calendar connecté avec succès !');

        // Rediriger vers la page admin après 2 secondes
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);

      } catch (error) {
        console.error('Erreur connexion Google Calendar:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Erreur lors de la connexion');

        // Rediriger vers admin après 5 secondes
        setTimeout(() => {
          window.location.href = '/';
        }, 5000);
      }
    };

    handleCallback();
  }, [user]);

  return (
    <div className="max-w-4xl w-full mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Icône */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
            status === 'processing' ? 'bg-blue-100' :
            status === 'success' ? 'bg-green-100' :
            'bg-red-100'
          }`}>
            {status === 'processing' && (
              <Loader className="w-10 h-10 text-blue-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-10 h-10 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="w-10 h-10 text-red-600" />
            )}
          </div>

          {/* Titre */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {status === 'processing' && 'Connexion en cours...'}
              {status === 'success' && 'Connexion réussie !'}
              {status === 'error' && 'Erreur de connexion'}
            </h2>
            <p className="text-gray-600">{message}</p>
          </div>

          {/* Barre de progression */}
          {status === 'processing' && (
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full animate-pulse" 
                   style={{ width: '70%' }} />
            </div>
          )}

          {/* Message de redirection */}
          {(status === 'success' || status === 'error') && (
            <p className="text-sm text-gray-500">
              Redirection automatique dans quelques secondes...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
