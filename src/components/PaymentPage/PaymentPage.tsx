import React, { useState, useEffect } from 'react';
import { CreditCard, Clock, User, Calendar, AlertTriangle, XCircle, Timer, CheckCircle, Package } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useSearchParams } from 'react-router-dom';

export function PaymentPage() {
  const [searchParams] = useSearchParams();
  const linkId = searchParams.get('link_id');

  console.log('🔍 [PaymentPage] URL complète:', window.location.href);
  console.log('🔍 [PaymentPage] searchParams:', searchParams.toString());
  console.log('🔍 [PaymentPage] link_id extrait:', linkId);

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [paymentLinkData, setPaymentLinkData] = useState<any>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Charger les données du lien de paiement
  useEffect(() => {
    const loadPaymentLink = async () => {
      console.log('🔵 [loadPaymentLink] Début du chargement');
      console.log('🔵 [loadPaymentLink] linkId reçu:', linkId);
      
      if (!linkId) {
        console.error('❌ Aucun link_id fourni');
        console.error('❌ URL actuelle:', window.location.href);
        console.error('❌ searchParams:', searchParams.toString());
        setError('Aucun identifiant de lien fourni');
        setCheckingStatus(false);
        return;
      }

      if (!isSupabaseConfigured()) {
        console.error('❌ Supabase non configuré');
        setError('Configuration manquante');
        setCheckingStatus(false);
        return;
      }

      try {
        console.log('🔍 Chargement lien de paiement:', linkId);

        // 🔥 REQUÊTE SANS AUTHENTIFICATION (politique publique)
        const { data: link, error: linkError } = await supabase!
          .from('payment_links')
          .select(`
            *,
            bookings (
              *,
              services (*)
            )
          `)
          .eq('id', linkId)
          .maybeSingle();

        if (linkError) {
          console.error('❌ Erreur Supabase:', linkError);
          setError(`Erreur base de données: ${linkError.message}`);
          setCheckingStatus(false);
          return;
        }

        if (!link) {
          console.error('❌ Lien non trouvé');
          setIsDeleted(true);
          setCheckingStatus(false);
          return;
        }

        console.log('✅ Lien chargé:', link);

        // Vérifier le statut
        if (link.status === 'completed') {
          console.log('✅ Lien déjà payé');
          setIsDeleted(true);
          setCheckingStatus(false);
          return;
        }

        if (link.status === 'expired' || link.status === 'cancelled') {
          console.log('⏰ Lien expiré ou annulé');
          setIsExpired(true);
          setCheckingStatus(false);
          return;
        }

        // Vérifier l'expiration
        const expiresAt = new Date(link.expires_at).getTime();
        const now = Date.now();

        if (now >= expiresAt) {
          console.log('⏰ Lien expiré');
          setIsExpired(true);
          
          // Marquer comme expiré dans la base
          try {
            await supabase!
              .from('payment_links')
              .update({ status: 'expired' })
              .eq('id', linkId);
          } catch (updateError) {
            console.warn('⚠️ Impossible de marquer comme expiré:', updateError);
          }
          
          setCheckingStatus(false);
          return;
        }

        setPaymentLinkData(link);
        setBookingData(link.bookings);
        setCheckingStatus(false);
      } catch (err) {
        console.error('❌ Erreur chargement:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setCheckingStatus(false);
      }
    };

    loadPaymentLink();
  }, [linkId, searchParams]);

  // Timer d'expiration
  useEffect(() => {
    if (!paymentLinkData?.expires_at) return;

    const updateTimer = () => {
      const now = Date.now();
      const expiry = new Date(paymentLinkData.expires_at).getTime();
      const remaining = Math.max(0, expiry - now);

      setTimeLeft(remaining);
      
      if (remaining === 0) {
        setIsExpired(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [paymentLinkData?.expires_at]);

  const formatTimeLeft = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // 🔥 FONCTION POUR FORMATER L'HEURE (HH:mm au lieu de HH:mm:ss)
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    // Si le format est "HH:mm:ss", on prend seulement "HH:mm"
    return timeString.substring(0, 5);
  };

  const handlePayment = async () => {
    if (isExpired || processing || !paymentLinkData || !bookingData) return;

    setProcessing(true);

    try {
      console.log('💳 Création session Stripe pour lien de paiement');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
      
      // 🔥 MÉTADONNÉES AVEC payment_type = 'payment_link'
      const metadata = {
        payment_type: 'payment_link', // ✅ TYPE CRITIQUE
        payment_link_id: paymentLinkData.id,
        booking_id: bookingData.id,
        user_id: paymentLinkData.user_id,
        service_id: bookingData.service_id,
        client: `${bookingData.client_firstname || ''} ${bookingData.client_name || ''}`.trim(),
        email: bookingData.client_email,
        date: bookingData.date,
        time: bookingData.time
      };

      console.log('📦 Métadonnées envoyées:', metadata);

      const response = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          amount: paymentLinkData.amount,
          currency: 'eur',
          customer_email: bookingData.client_email,
          service_name: bookingData.services?.name || 'Paiement',
          success_url: `${window.location.origin}/payment-success?link_id=${paymentLinkData.id}`,
          cancel_url: `${window.location.origin}/payment-cancel?link_id=${paymentLinkData.id}`,
          metadata // ✅ MÉTADONNÉES AVEC payment_type
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erreur Stripe:', errorData);
        throw new Error(errorData.error || 'Erreur création session');
      }

      const { url } = await response.json();
      
      if (url) {
        console.log('✅ Redirection vers Stripe:', url);
        window.location.href = url;
      } else {
        throw new Error('URL de paiement manquante');
      }
    } catch (err) {
      console.error('❌ Erreur paiement:', err);
      alert('Erreur lors du paiement. Veuillez réessayer.');
    } finally {
      setProcessing(false);
    }
  };

  const isWarning = timeLeft > 0 && timeLeft < 5 * 60 * 1000;

  // Vérification en cours
  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Vérification...</h1>
          <p className="text-gray-600">Vérification du lien de paiement</p>
          <div className="mt-4 text-xs text-gray-400">
            <div>URL: {window.location.href}</div>
            <div>link_id: {linkId || 'NON TROUVÉ'}</div>
          </div>
        </div>
      </div>
    );
  }

  // Erreur de chargement
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Erreur</h1>
          <p className="text-gray-600 text-lg mb-6">{error}</p>
          <div className="bg-red-50 rounded-xl p-4 border border-red-200 text-left">
            <p className="text-sm text-red-800">
              <strong>Informations de débogage :</strong>
            </p>
            <ul className="text-sm text-red-700 mt-2 space-y-1">
              <li><strong>URL:</strong> {window.location.href}</li>
              <li><strong>link_id:</strong> {linkId || 'NON TROUVÉ'}</li>
              <li><strong>searchParams:</strong> {searchParams.toString() || 'VIDE'}</li>
            </ul>
            <p className="text-sm text-red-800 mt-3">
              <strong>Causes possibles :</strong>
            </p>
            <ul className="text-sm text-red-700 mt-2 space-y-1 list-disc list-inside">
              <li>Le paramètre link_id est manquant dans l'URL</li>
              <li>La table payment_links n'existe pas encore</li>
              <li>Les politiques RLS ne sont pas configurées</li>
              <li>Le lien n'a pas été créé correctement</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Lien déjà payé
  if (isDeleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Paiement validé !</h1>
          <p className="text-gray-600 text-lg mb-6">
            Ce lien de paiement a déjà été utilisé avec succès.
          </p>
          <button
            onClick={() => window.close()}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-2xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  // Lien invalide
  if (!paymentLinkData || !bookingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Lien invalide</h1>
          <p className="text-gray-600 text-lg mb-6">
            Ce lien de paiement n'existe pas ou a été supprimé.
          </p>
        </div>
      </div>
    );
  }

  // Lien expiré
  if (isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Lien expiré</h1>
          <p className="text-gray-600 text-lg mb-6">
            Ce lien de paiement a expiré. Veuillez contacter l'établissement pour obtenir un nouveau lien.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header avec compteur */}
        <div className={`p-6 text-white relative overflow-hidden ${
          isWarning 
            ? 'bg-gradient-to-r from-orange-500 to-red-500' 
            : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Paiement sécurisé</h1>
                  <p className="text-white/80 text-sm">Powered by Stripe</p>
                </div>
              </div>
            </div>

            {/* Compteur d'expiration */}
            {timeLeft > 0 && (
              <div className={`bg-white/20 backdrop-blur-sm rounded-xl p-3 ${
                isWarning ? 'animate-pulse' : ''
              }`}>
                <div className="flex items-center justify-center gap-2">
                  <Timer className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {isWarning ? 'Attention ! ' : ''}Temps restant : {formatTimeLeft(timeLeft)}
                  </span>
                </div>
                {isWarning && (
                  <div className="text-center text-xs mt-1 text-white/90">
                    Ce lien expire bientôt !
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Détails de la réservation */}
        <div className="p-6">
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">{bookingData.services?.name || 'Service'}</div>
                <div className="text-sm text-gray-600">{bookingData.services?.duration_minutes || 0} minutes</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">
                  {bookingData.client_firstname} {bookingData.client_name}
                </div>
                <div className="text-sm text-gray-600">{bookingData.client_email}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
              <Calendar className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-medium text-gray-900">
                  {new Date(bookingData.date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </div>
                <div className="text-sm text-gray-600">{formatTime(bookingData.time)}</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Montant à payer</span>
                <span className="text-2xl font-bold text-green-600">
                  {paymentLinkData.amount.toFixed(2)}€
                </span>
              </div>
            </div>
          </div>

          {/* Avertissement si proche de l'expiration */}
          {isWarning && (
            <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <div className="text-orange-800 text-sm">
                <div className="font-medium">Attention !</div>
                <div>Ce lien de paiement expire dans moins de 5 minutes.</div>
              </div>
            </div>
          )}

          {/* Bouton de paiement */}
          <button
            onClick={handlePayment}
            disabled={isExpired || processing}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-white transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 ${
              isExpired
                ? 'bg-gray-400 cursor-not-allowed'
                : processing
                ? 'bg-blue-400 cursor-wait'
                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
            }`}
          >
            {processing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Traitement en cours...
              </>
            ) : isExpired ? (
              <>
                <XCircle className="w-5 h-5" />
                Lien expiré
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Payer {paymentLinkData.amount.toFixed(2)}€
              </>
            )}
          </button>

          {/* Informations de sécurité */}
          <div className="mt-6 text-center">
            <div className="text-xs text-gray-500 mb-2">
              🔒 Paiement sécurisé par Stripe
            </div>
            <div className="text-xs text-gray-400">
              Vos informations de paiement sont protégées par un chiffrement SSL
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
