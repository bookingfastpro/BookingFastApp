import React from 'react';
import { CheckCircle, Calendar, ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  
  const handleBackToHome = () => {
    // Fermer la fenêtre ou rediriger vers une page de confirmation
    window.close();
    
    // Si la fermeture échoue (bloquée par le navigateur), rediriger
    setTimeout(() => {
      if (!window.closed) {
        window.location.href = '/';
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Paiement réussi !
        </h1>
        
        <p className="text-gray-600 text-lg mb-6">
          Votre acompte a été payé avec succès ! Votre réservation est maintenant confirmée.
        </p>

        {/* Confirmation Details */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 mb-6 border border-green-200">
          <div className="flex items-center justify-center gap-2 text-green-700">
            <Calendar className="w-5 h-5" />
            <span className="font-medium">Réservation confirmée</span>
          </div>
          {bookingId && (
            <div className="text-green-600 text-sm mt-2">
              Référence: {bookingId.slice(0, 8)}...
            </div>
          )}
        </div>

        {/* Information sur le solde */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
          <div className="text-blue-700 text-sm">
            <div className="font-medium mb-1">📧 Email de confirmation envoyé</div>
            <div>Le solde restant sera à régler lors de votre rendez-vous</div>
          </div>
        </div>
      </div>
    </div>
  );
}
