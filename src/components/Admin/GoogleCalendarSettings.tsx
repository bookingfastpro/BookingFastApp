import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, RefreshCw, ExternalLink, AlertTriangle, Loader, Clock, Users, Info } from 'lucide-react';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { GoogleCalendarService } from '../../lib/googleCalendar';
import { Button } from '../UI/Button';

export function GoogleCalendarSettings() {
  const { settings, updateSettings } = useBusinessSettings();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
  const [calendars, setCalendars] = useState<Array<{ id: string; summary: string }>>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [ownerHasToken, setOwnerHasToken] = useState<boolean | null>(null);
  const [tokenStatus, setTokenStatus] = useState<{
    hasToken: boolean;
    isExpired: boolean;
    expiresAt?: string;
    timeUntilExpiry?: string;
  } | null>(null);

  // Déterminer si l'utilisateur est membre d'équipe et récupérer l'owner_id
  useEffect(() => {
    const checkTeamMembership = async () => {
      if (!user || !supabase) return;

      try {
        const { data: teamMember } = await supabase
          .from('team_members')
          .select('owner_id, is_active')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (teamMember?.owner_id) {
          console.log('👤 Membre d\'équipe détecté - Propriétaire:', teamMember.owner_id);
          setOwnerId(teamMember.owner_id);
          setIsTeamMember(true);
          
          // Vérifier si le propriétaire a un token
          await checkOwnerToken(teamMember.owner_id);
        } else {
          console.log('👑 Propriétaire détecté');
          setOwnerId(user.id);
          setIsTeamMember(false);
          
          // Vérifier si l'utilisateur a un token
          await checkOwnerToken(user.id);
        }
      } catch (error) {
        console.error('❌ Erreur vérification équipe:', error);
        setOwnerId(user.id);
        setIsTeamMember(false);
      }
    };

    checkTeamMembership();
  }, [user]);

  // Vérifier si le propriétaire a un token Google Calendar
  const checkOwnerToken = async (checkOwnerId: string) => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('google_calendar_tokens')
        .select('id')
        .eq('user_id', checkOwnerId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Erreur vérification token:', error);
        setOwnerHasToken(false);
        return;
      }

      const hasToken = !!data;
      setOwnerHasToken(hasToken);
      
      if (hasToken) {
        console.log('✅ Token trouvé pour owner_id:', checkOwnerId);
      } else {
        console.log('⚠️ Aucun token trouvé pour owner_id:', checkOwnerId);
      }
    } catch (error) {
      console.error('❌ Erreur vérification token:', error);
      setOwnerHasToken(false);
    }
  };

  useEffect(() => {
    if (settings) {
      setSyncStatus(settings.google_calendar_sync_status || 'disconnected');
      setSelectedCalendarId(settings.google_calendar_id || '');
    }
  }, [settings]);

  // Vérifier le statut du token périodiquement
  useEffect(() => {
    const checkToken = async () => {
      if (!user) return;
      const status = await GoogleCalendarService.checkTokenStatus(user.id);
      setTokenStatus(status);
      setOwnerHasToken(status.hasToken);
    };

    checkToken();
    
    // Vérifier toutes les 5 minutes
    const interval = setInterval(checkToken, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user]);

  const handleConnect = async () => {
    if (!user) return;

    // Les membres d'équipe ne peuvent pas connecter leur propre compte
    if (isTeamMember) {
      alert('⚠️ Seul le propriétaire peut connecter Google Calendar. Contactez votre administrateur.');
      return;
    }

    setLoading(true);
    try {
      // Configuration OAuth Google Calendar
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      
      if (!clientId) {
        alert('❌ Configuration Google Calendar manquante. Veuillez configurer VITE_GOOGLE_CLIENT_ID dans les variables d\'environnement.');
        return;
      }

      const scope = 'https://www.googleapis.com/auth/calendar';
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scope)}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${user.id}`;

      // Ouvrir la fenêtre d'authentification Google
      window.location.href = authUrl;
    } catch (error) {
      console.error('Erreur lors de la connexion Google Calendar:', error);
      alert('❌ Erreur lors de la connexion à Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user || !ownerId) return;

    // Les membres d'équipe ne peuvent pas déconnecter
    if (isTeamMember) {
      alert('⚠️ Seul le propriétaire peut déconnecter Google Calendar.');
      return;
    }

    if (!window.confirm('⚠️ Êtes-vous sûr de vouloir déconnecter Google Calendar ? Cela affectera tous les membres de l\'équipe.')) {
      return;
    }

    setLoading(true);
    try {
      // Supprimer les tokens (utiliser ownerId au lieu de user.id)
      await supabase
        .from('google_calendar_tokens')
        .delete()
        .eq('user_id', ownerId);

      // Mettre à jour les paramètres
      await updateSettings({
        google_calendar_enabled: false,
        google_calendar_sync_status: 'disconnected',
        google_calendar_id: null
      });

      setSyncStatus('disconnected');
      setCalendars([]);
      setSelectedCalendarId('');
      setTokenStatus(null);
      setOwnerHasToken(false);
      
      alert('✅ Google Calendar déconnecté avec succès');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      alert('❌ Erreur lors de la déconnexion');
    } finally {
      setLoading(false);
    }
  };

  const loadCalendars = async () => {
    if (!user || !ownerId) {
      console.log('❌ Pas d\'utilisateur ou d\'owner_id');
      return;
    }

    // Vérifier d'abord si le propriétaire a un token
    if (ownerHasToken === false) {
      console.log('⚠️ Le propriétaire n\'a pas connecté Google Calendar');
      alert('⚠️ Le propriétaire doit d\'abord connecter Google Calendar avant que vous puissiez l\'utiliser.');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Chargement calendriers pour owner_id:', ownerId);
      console.log('👤 Utilisateur actuel:', user.id);
      console.log('🏢 Est membre d\'équipe:', isTeamMember);

      // Utiliser le service pour obtenir le token (avec rafraîchissement automatique)
      const accessToken = await GoogleCalendarService.getAccessToken(user.id);

      if (!accessToken) {
        console.log('❌ Impossible d\'obtenir le token');
        
        if (isTeamMember) {
          alert('⚠️ Le propriétaire doit connecter Google Calendar avant que vous puissiez l\'utiliser.');
        } else {
          alert('⚠️ Veuillez connecter Google Calendar pour continuer.');
        }
        
        setOwnerHasToken(false);
        return;
      }

      console.log('✅ Token obtenu avec succès');

      // Récupérer la liste des calendriers
      console.log('📅 Récupération liste calendriers...');
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur API Google:', response.status, errorText);
        throw new Error('Erreur lors de la récupération des calendriers');
      }

      const data = await response.json();
      console.log('✅ Calendriers récupérés:', data.items?.length || 0);
      setCalendars(data.items || []);
      setOwnerHasToken(true);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des calendriers:', error);
      
      if (isTeamMember) {
        alert('❌ Impossible de charger les calendriers. Le propriétaire doit se reconnecter à Google Calendar.');
      } else {
        alert('❌ Erreur lors du chargement des calendriers. Veuillez vous reconnecter.');
      }
      
      setSyncStatus('error');
      setOwnerHasToken(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCalendar = async () => {
    if (!selectedCalendarId) {
      alert('⚠️ Veuillez sélectionner un calendrier');
      return;
    }

    // Les membres d'équipe peuvent maintenant sauvegarder le calendrier
    setLoading(true);
    try {
      await updateSettings({
        google_calendar_enabled: true,
        google_calendar_id: selectedCalendarId,
        google_calendar_sync_status: 'connected'
      });

      setSyncStatus('connected');
      alert('✅ Calendrier configuré avec succès !');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    if (!user || !ownerId) return;

    // Vérifier d'abord si le propriétaire a un token
    if (ownerHasToken === false) {
      alert('⚠️ Le propriétaire doit d\'abord connecter Google Calendar.');
      return;
    }

    setTestingConnection(true);
    try {
      console.log('🧪 Test connexion pour owner_id:', ownerId);

      // Utiliser le service pour obtenir le token
      const accessToken = await GoogleCalendarService.getAccessToken(user.id);

      if (!accessToken) {
        if (isTeamMember) {
          alert('⚠️ Le propriétaire doit connecter Google Calendar.');
        } else {
          alert('⚠️ Veuillez connecter Google Calendar.');
        }
        setOwnerHasToken(false);
        return;
      }

      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        alert('✅ Connexion Google Calendar active !');
        setOwnerHasToken(true);
        
        // Rafraîchir le statut du token
        const status = await GoogleCalendarService.checkTokenStatus(user.id);
        setTokenStatus(status);
      } else {
        throw new Error('Connexion échouée');
      }
    } catch (error) {
      console.error('Erreur test connexion:', error);
      
      if (isTeamMember) {
        alert('❌ Erreur de connexion. Le propriétaire doit se reconnecter.');
      } else {
        alert('❌ Erreur de connexion. Veuillez vous reconnecter.');
      }
      
      setSyncStatus('error');
      setOwnerHasToken(false);
    } finally {
      setTestingConnection(false);
    }
  };

  useEffect(() => {
    if (syncStatus === 'connected' && calendars.length === 0 && ownerId && ownerHasToken) {
      loadCalendars();
    }
  }, [syncStatus, ownerId, ownerHasToken]);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Google Calendar</h2>
            <p className="text-sm text-gray-600">
              {isTeamMember ? '👥 Connexion partagée avec l\'équipe' : 'Synchronisez automatiquement vos réservations'}
            </p>
          </div>
        </div>

        {/* Statut de connexion */}
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border">
          {syncStatus === 'connected' ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <div className="font-medium text-green-700">Connecté</div>
                <div className="text-sm text-gray-600">
                  {isTeamMember ? 'Utilise la connexion du propriétaire' : 'Synchronisation active pour toute l\'équipe'}
                </div>
              </div>
            </>
          ) : syncStatus === 'error' ? (
            <>
              <XCircle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <div className="font-medium text-red-700">Erreur de connexion</div>
                <div className="text-sm text-gray-600">
                  {isTeamMember ? 'Le propriétaire doit se reconnecter' : 'Veuillez vous reconnecter'}
                </div>
              </div>
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <div className="font-medium text-gray-700">Non connecté</div>
                <div className="text-sm text-gray-600">
                  {isTeamMember ? 'Le propriétaire doit connecter Google Calendar' : 'Connectez votre compte Google'}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Statut du token */}
        {tokenStatus && tokenStatus.hasToken && (
          <div className={`mt-3 p-3 rounded-xl border ${
            tokenStatus.isExpired 
              ? 'bg-red-50 border-red-200' 
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center gap-2 text-sm">
              <Clock className={`w-4 h-4 ${tokenStatus.isExpired ? 'text-red-600' : 'text-green-600'}`} />
              <span className={tokenStatus.isExpired ? 'text-red-700' : 'text-green-700'}>
                {tokenStatus.isExpired 
                  ? '⚠️ Token expiré - Rafraîchissement automatique activé' 
                  : `✅ Token valide - Expire dans ${tokenStatus.timeUntilExpiry}`
                }
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Alerte si le propriétaire n'a pas de token (pour les membres d'équipe) */}
      {isTeamMember && ownerHasToken === false && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-yellow-800 mb-2">⚠️ Google Calendar non configuré</h4>
              <div className="text-yellow-700 text-sm space-y-1">
                <div>Le propriétaire de votre équipe n'a pas encore connecté Google Calendar.</div>
                <div className="font-medium mt-2">Contactez votre administrateur pour :</div>
                <div>• Connecter son compte Google Calendar</div>
                <div>• Activer la synchronisation pour toute l'équipe</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message pour les membres d'équipe */}
      {isTeamMember && ownerHasToken === true && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-blue-800 mb-2">👥 Accès partagé</h4>
              <div className="text-blue-700 text-sm space-y-1">
                <div>• Vous utilisez la connexion Google Calendar du propriétaire</div>
                <div>• Vos réservations seront synchronisées automatiquement</div>
                <div>• Vous pouvez créer, modifier et supprimer des événements</div>
                <div>• Seul le propriétaire peut connecter/déconnecter le compte</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-blue-800 mb-2">💡 Comment ça fonctionne ?</h4>
            <div className="text-blue-700 text-sm space-y-1">
              <div>• {isTeamMember ? 'Le propriétaire connecte' : 'Connectez'} son compte Google Calendar</div>
              <div>• {isTeamMember ? 'Vous pouvez sélectionner' : 'Sélectionnez'} le calendrier à synchroniser</div>
              <div>• Toutes les réservations de l'équipe seront synchronisées</div>
              <div>• Les modifications seront visibles pour tous</div>
              <div>• 🔄 Les tokens sont rafraîchis automatiquement (pas d'expiration)</div>
              <div>• 👥 Tous les membres d'équipe peuvent créer des événements</div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions selon le statut */}
      {syncStatus === 'disconnected' || syncStatus === 'error' || ownerHasToken === false ? (
        <div className="space-y-4">
          <Button
            onClick={handleConnect}
            loading={loading}
            disabled={isTeamMember}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calendar className="w-5 h-5" />
            {isTeamMember ? 'Seul le propriétaire peut connecter' : 'Connecter Google Calendar'}
          </Button>

          {!isTeamMember && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <strong>Configuration requise:</strong> Assurez-vous d'avoir configuré les identifiants OAuth Google dans les variables d'environnement (VITE_GOOGLE_CLIENT_ID et VITE_GOOGLE_CLIENT_SECRET).
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sélection du calendrier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Calendrier à synchroniser
            </label>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : calendars.length > 0 ? (
              <div className="space-y-3">
                <select
                  value={selectedCalendarId}
                  onChange={(e) => setSelectedCalendarId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                >
                  <option value="">Sélectionnez un calendrier</option>
                  {calendars.map((calendar) => (
                    <option key={calendar.id} value={calendar.id}>
                      {calendar.summary}
                    </option>
                  ))}
                </select>

                {selectedCalendarId && selectedCalendarId !== settings?.google_calendar_id && (
                  <Button
                    onClick={handleSaveCalendar}
                    loading={loading}
                    className="w-full"
                  >
                    Enregistrer le calendrier
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center p-8 bg-gray-50 rounded-xl">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Aucun calendrier trouvé</p>
                <Button
                  onClick={loadCalendars}
                  loading={loading}
                  variant="secondary"
                  className="mt-4"
                >
                  <RefreshCw className="w-4 h-4" />
                  Recharger
                </Button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={testConnection}
              loading={testingConnection}
              variant="secondary"
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4" />
              Tester la connexion
            </Button>
            {!isTeamMember && (
              <Button
                onClick={handleDisconnect}
                loading={loading}
                variant="danger"
                className="flex-1"
              >
                <XCircle className="w-4 h-4" />
                Déconnecter
              </Button>
            )}
          </div>

          {/* Informations de synchronisation */}
          {settings?.google_calendar_enabled && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-green-800 mb-2">✅ Synchronisation active</h4>
                  <div className="text-green-700 text-sm space-y-1">
                    <div>• Nouvelles réservations → Ajoutées automatiquement</div>
                    <div>• Modifications → Mises à jour en temps réel</div>
                    <div>• Annulations → Événements supprimés</div>
                    <div>• 🔄 Tokens rafraîchis automatiquement toutes les heures</div>
                    <div>• 👥 Accessible à tous les membres de l'équipe</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lien vers la documentation */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <ExternalLink className="w-5 h-5 text-gray-600" />
          <div className="flex-1">
            <div className="font-medium text-gray-900">Besoin d'aide ?</div>
            <a
              href="https://developers.google.com/calendar/api/guides/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              Consulter la documentation Google Calendar API
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
