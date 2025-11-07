import React from 'react';
import { XCircle, ArrowLeft, RotateCcw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export function PaymentCancel() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  
  const handleBackToHome = () => {
    // Fermer la fenêtre ou rediriger
    window.close();
    
    // Si la fermeture échoue (bloquée par le navigateur), rediriger vers la réservation
    setTimeout(() => {
      if (!window.closed) {
        const referrer = document.referrer;
        const userIdMatch = referrer.match(/\/booking\/([^/?]+)/);
        const userId = userIdMatch ? userIdMatch[1] : 'demo';
        window.location.href = `/booking/${userId}`;
      }
    }, 100);
  };

  const handleRetry = () => {
    // Fermer l'onglet et retourner à la page de réservation
    window.close();
    
    // Si la fermeture échoue, rediriger
    setTimeout(() => {
      if (!window.closed) {
        const referrer = document.referrer;
        const userIdMatch = referrer.match(/\/booking\/([^/?]+)/);
        const userId = userIdMatch ? userIdMatch[1] : 'demo';
        window.location.href = `/booking/${userId}`;
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Cancel Icon */}
        <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-white" />
        </div>

        {/* Cancel Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Paiement annulé
        </h1>
        
        <p className="text-gray-600 text-lg mb-6">
          Le paiement de l'acompte a été annulé. Votre réservation n'a pas été confirmée.
        </p>

        {/* Information sur la réservation */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6">
          <div className="text-orange-700 text-sm">
            <div className="font-medium mb-1">⚠️ Réservation en attente</div>
            <div>Votre réservation reste en attente jusqu'au paiement de l'acompte</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-2xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Retour à la réservation
          </button>
          
          <button
            onClick={handleBackToHome}
            className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 px-6 rounded-2xl font-medium hover:from-gray-600 hover:to-gray-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
