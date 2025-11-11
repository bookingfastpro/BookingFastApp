import React, { useState } from 'react';
import { X, Link as LinkIcon, Clock, Euro, Copy, Check } from 'lucide-react';
import { Booking } from '../../types';
import { usePaymentLinks } from '../../hooks/usePaymentLinks';

interface PaymentLinkModalProps {
  booking: Booking;
  onClose: () => void;
}

export function PaymentLinkModal({ booking, onClose }: PaymentLinkModalProps) {
  const { createPaymentLink } = usePaymentLinks();
  const [amount, setAmount] = useState<string>('');
  const [expiryMinutes, setExpiryMinutes] = useState<number>(30);
  const [creating, setCreating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remainingBalance = booking.total_amount - (booking.payment_amount || 0);

  const handleCreate = async () => {
    console.log('🔵 [MODAL] Début création lien');
    
    const amountValue = parseFloat(amount);
    
    if (!amountValue || amountValue <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }

    if (amountValue > remainingBalance) {
      alert(`Le montant ne peut pas dépasser le solde restant (${remainingBalance.toFixed(2)}€)`);
      return;
    }

    setCreating(true);
    setError(null);

    try {
      console.log('🔵 [MODAL] Appel createPaymentLink...');
      const link = await createPaymentLink(booking.id, amountValue, expiryMinutes);
      
      console.log('✅ [MODAL] Lien reçu:', link);
      
      if (link?.payment_url) {
        console.log('✅ [MODAL] URL du lien:', link.payment_url);
        setGeneratedLink(link.payment_url);
      } else if (link?.id) {
        // 🔥 FALLBACK : Si payment_url est vide, on reconstruit l'URL avec link_id
        const fallbackUrl = `${window.location.origin}/payment?link_id=${link.id}`;
        console.log('⚠️ [MODAL] URL reconstruite:', fallbackUrl);
        setGeneratedLink(fallbackUrl);
      } else {
        console.error('❌ [MODAL] Pas d\'URL ni d\'ID dans le lien retourné');
        throw new Error('Données de lien de paiement manquantes');
      }
    } catch (err) {
      console.error('❌ [MODAL] Erreur création lien:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      alert(`Erreur lors de la création du lien de paiement:\n${errorMessage}`);
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <LinkIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Créer un lien de paiement</h2>
                <p className="text-white/80 text-sm">Pour {booking.client_firstname} {booking.client_name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {!generatedLink ? (
            <>
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 font-medium">Total réservation</span>
                  <span className="text-lg font-bold text-gray-900">{booking.total_amount.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 font-medium">Déjà payé</span>
                  <span className="text-lg font-bold text-green-600">{(booking.payment_amount || 0).toFixed(2)}€</span>
                </div>
                <div className="pt-2 border-t border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 font-bold">Solde restant</span>
                    <span className="text-xl font-bold text-blue-600">{remainingBalance.toFixed(2)}€</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Euro className="w-4 h-4 inline mr-1" />
                  Montant du paiement *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={remainingBalance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder={`Max: ${remainingBalance.toFixed(2)}€`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Délai d'expiration
                </label>
                <select
                  value={expiryMinutes}
                  onChange={(e) => setExpiryMinutes(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 heure</option>
                  <option value={120}>2 heures</option>
                  <option value={240}>4 heures</option>
                  <option value={1440}>24 heures</option>
                </select>
              </div>

              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Important :</strong> Le lien expirera automatiquement après {expiryMinutes} minutes.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <p className="text-sm text-red-800">
                    ❌ <strong>Erreur :</strong> {error}
                  </p>
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={creating || !amount}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-2xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Création...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-5 h-5" />
                    Générer le lien
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <div className="bg-green-50 rounded-2xl p-6 border border-green-200 text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Lien créé avec succès !</h3>
                <p className="text-gray-600 mb-4">Le lien de paiement est prêt à être partagé</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lien de paiement
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={generatedLink}
                    readOnly
                    className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm"
                  />
                  <button
                    onClick={handleCopy}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      copied
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <p className="text-sm text-blue-800">
                  💡 <strong>Astuce :</strong> Copiez ce lien et envoyez-le à votre client par email, SMS ou WhatsApp.
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-2xl font-bold hover:bg-gray-200 transition-all"
              >
                Fermer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
