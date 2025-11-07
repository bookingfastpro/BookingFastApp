import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';

export function PaymentAutoClose() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    console.log('🔄 Page auto-close - Session ID:', sessionId);

    // Fermer l'onglet après 2 secondes
    const timer = setTimeout(() => {
      console.log('🚪 Fermeture automatique de l\'onglet...');
      window.close();
      
      // Si window.close() échoue (bloqué par le navigateur)
      setTimeout(() => {
        if (!window.closed) {
          console.log('⚠️ Fermeture bloquée - affichage message');
          document.getElementById('close-message')!.style.display = 'block';
        }
      }, 500);
    }, 2000);

    return () => clearTimeout(timer);
  }, [sessionId]);

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
          Votre paiement a été confirmé avec succès.
        </p>

        {/* Auto-close indicator */}
        <div className="flex items-center justify-center gap-3 text-green-600 mb-6">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-medium">Fermeture automatique...</span>
        </div>

        {/* Fallback message (hidden by default) */}
        <div id="close-message" style={{ display: 'none' }} className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
          <p className="text-sm text-blue-700">
            Vous pouvez fermer cet onglet manuellement
          </p>
          <button
            onClick={() => window.close()}
            className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Fermer cet onglet
          </button>
        </div>
      </div>
    </div>
  );
}
