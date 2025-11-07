import React, { useState } from 'react';
import { Mail, RotateCcw, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Veuillez saisir votre adresse email');
      return;
    }

    if (!isSupabaseConfigured()) {
      setError('Fonctionnalité non disponible en mode démo');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `https://bookingfast.pro/reset-password`,
      });

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
      setEmail('');
    } catch (err) {
      console.error('Erreur réinitialisation mot de passe:', err);
      
      let errorMessage = 'Une erreur est survenue';
      if (err instanceof Error) {
        if (err.message.includes('Email not found')) {
          errorMessage = 'Aucun compte trouvé avec cette adresse email';
        } else if (err.message.includes('Too many requests')) {
          errorMessage = 'Trop de tentatives. Veuillez patienter quelques minutes.';
        } else if (err.message.includes('Invalid email')) {
          errorMessage = 'Adresse email invalide';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Mot de passe oublié"
      size="sm"
    >
      <div className="space-y-6">
        {!success ? (
          <>
            {/* Instructions */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Réinitialiser votre mot de passe
              </h3>
              <p className="text-gray-600 text-sm">
                Saisissez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                    placeholder="votre@email.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span className="text-red-800 text-sm">{error}</span>
                </div>
              )}

              <Button
                type="submit"
                loading={loading}
                disabled={!email.trim()}
                className="w-full"
              >
                <RotateCcw className="w-5 h-5" />
                Envoyer le lien de réinitialisation
              </Button>
            </form>

            {/* Retour à la connexion */}
            <div className="text-center pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-600 hover:text-gray-800 font-medium hover:underline transition-all duration-300 flex items-center gap-2 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à la connexion
              </button>
            </div>
          </>
        ) : (
          /* Message de succès */
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Email envoyé !
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-bold text-blue-800 mb-2">📧 Prochaines étapes</h4>
              <div className="text-blue-700 text-sm space-y-1 text-left">
                <div>1. Vérifiez votre boîte email (et les spams)</div>
                <div>2. Cliquez sur le lien de réinitialisation</div>
                <div>3. Créez un nouveau mot de passe</div>
                <div>4. Reconnectez-vous avec votre nouveau mot de passe</div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-orange-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>
                  <strong>Important :</strong> Le lien expire dans 1 heure pour votre sécurité.
                </span>
              </div>
            </div>

            <Button
              onClick={handleClose}
              variant="secondary"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
