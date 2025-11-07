import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export function BookingDebug() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [bookingData, setBookingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!isSupabaseConfigured || !bookingId) {
        console.log('❌ Supabase non configuré ou bookingId manquant');
        setError('Configuration manquante');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Récupération booking:', bookingId);
        
        const { data, error: fetchError } = await supabase!
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();

        if (fetchError) {
          console.error('❌ Erreur récupération booking:', fetchError);
          setError(fetchError.message);
          return;
        }

        console.log('📊 DONNÉES BOOKING:', data);
        setBookingData(data);
      } catch (err) {
        console.error('❌ Erreur:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="w-16 h-16 border-4 border-purple-200 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-purple-600 rounded-full animate-spin border-t-transparent"></div>
          </div>
          <p className="text-gray-600 text-lg">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl max-w-md border border-red-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Erreur</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl max-w-md border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔍</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Aucune réservation</h2>
          <p className="text-gray-600">Aucune réservation trouvée avec cet ID</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto my-8">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
            <h2 className="text-3xl font-bold mb-2">🔍 DEBUG - Données de réservation</h2>
            <p className="text-blue-100">ID: {bookingId}</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-2xl border-2 border-blue-200">
              <h3 className="font-bold text-xl mb-4 text-blue-900 flex items-center gap-2">
                <span className="text-2xl">💰</span>
                Montants (CRITIQUE)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-blue-200">
                  <span className="text-sm text-gray-600 block mb-1">total_amount</span>
                  <span className="text-2xl font-bold text-gray-900">{bookingData.total_amount}€</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-blue-200">
                  <span className="text-sm text-gray-600 block mb-1">payment_amount</span>
                  <span className="text-2xl font-bold text-green-600">{bookingData.payment_amount}€</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-blue-200">
                  <span className="text-sm text-gray-600 block mb-1">deposit_amount</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {bookingData.deposit_amount !== null ? `${bookingData.deposit_amount}€` : 'NULL'}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-blue-200">
                  <span className="text-sm text-gray-600 block mb-1">payment_status</span>
                  <span className="text-lg font-bold text-gray-900">{bookingData.payment_status}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border-2 border-green-200">
              <h3 className="font-bold text-xl mb-4 text-green-900 flex items-center gap-2">
                <span className="text-2xl">📋</span>
                Informations générales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="bg-white p-3 rounded-lg">
                  <span className="font-medium text-gray-600">Client:</span>
                  <span className="ml-2 text-gray-900">{bookingData.client_firstname} {bookingData.client_name}</span>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <span className="font-medium text-gray-600">Email:</span>
                  <span className="ml-2 text-gray-900">{bookingData.client_email}</span>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <span className="font-medium text-gray-600">Date:</span>
                  <span className="ml-2 text-gray-900">{bookingData.date}</span>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <span className="font-medium text-gray-600">Heure:</span>
                  <span className="ml-2 text-gray-900">{bookingData.time}</span>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <span className="font-medium text-gray-600">Statut:</span>
                  <span className="ml-2 text-gray-900">{bookingData.booking_status}</span>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <span className="font-medium text-gray-600">Service ID:</span>
                  <span className="ml-2 text-gray-900 text-xs">{bookingData.service_id}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border-2 border-purple-200">
              <h3 className="font-bold text-xl mb-4 text-purple-900 flex items-center gap-2">
                <span className="text-2xl">💳</span>
                Transactions
              </h3>
              {bookingData.transactions && bookingData.transactions.length > 0 ? (
                <div className="space-y-3">
                  {bookingData.transactions.map((t: any, i: number) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-purple-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-medium text-gray-900">Montant:</span>
                          <span className="ml-2 text-xl font-bold text-purple-600">{t.amount}€</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium text-gray-900">Méthode:</span>
                          <span className="ml-2 text-gray-700">{t.method}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium text-gray-900">Statut:</span>
                          <span className="ml-2 text-gray-700">{t.status}</span>
                        </div>
                        {t.stripe_session_id && (
                          <div className="text-xs text-gray-500">
                            Session: {t.stripe_session_id.substring(0, 20)}...
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-white rounded-xl border border-purple-200">
                  <span className="text-4xl mb-2 block">📭</span>
                  <p className="text-gray-600">Aucune transaction enregistrée</p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-200">
              <h3 className="font-bold text-xl mb-4 text-gray-900 flex items-center gap-2">
                <span className="text-2xl">🔧</span>
                Données brutes (JSON)
              </h3>
              <pre className="text-xs overflow-auto bg-white p-4 rounded-xl border border-gray-300 max-h-96">
                {JSON.stringify(bookingData, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
