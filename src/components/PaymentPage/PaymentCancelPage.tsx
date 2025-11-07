import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, Mail } from 'lucide-react';

export function PaymentCancelPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center animate-fadeIn">
        <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-white" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Paiement annulé
        </h1>

        <p className="text-gray-600 text-lg mb-8">
          Vous avez annulé le processus de paiement. Aucun montant n'a été débité.
        </p>

        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 mb-8">
          <h3 className="font-bold text-orange-800 mb-2">Que faire maintenant ?</h3>
          <ul className="text-left text-sm text-orange-700 space-y-2">
            <li>• Vous pouvez réessayer le paiement en utilisant le même lien</li>
            <li>• Contactez l'établissement si vous rencontrez des difficultés</li>
            <li>• Vérifiez vos informations de paiement</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-2xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour au paiement
          </button>

          <button
            onClick={() => window.close()}
            className="w-full bg-gray-500 text-white py-3 px-6 rounded-2xl font-medium hover:bg-gray-600 transition-all duration-300"
          >
            Fermer
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Mail className="w-4 h-4" />
            <span>Besoin d'aide ? Contactez l'établissement</span>
          </div>
        </div>
      </div>
    </div>
  );
}
