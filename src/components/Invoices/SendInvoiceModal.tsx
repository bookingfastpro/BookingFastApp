import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Button } from '../UI/Button';
import { Invoice } from '../../types';
import { Mail, Loader2 } from 'lucide-react';
import { sendInvoiceEmail } from '../../utils/emailService';
import { supabase } from '../../lib/supabase';

interface SendInvoiceModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
}

export function SendInvoiceModal({ invoice, isOpen, onClose }: SendInvoiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Bloquer le scroll du body
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      // Créer le conteneur modal-root s'il n'existe pas
      if (!document.getElementById('modal-root')) {
        const modalRoot = document.createElement('div');
        modalRoot.id = 'modal-root';
        document.body.appendChild(modalRoot);
      }

      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!invoice.client?.email) {
      alert('Le client n\'a pas d\'adresse email');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      console.log('📧 Envoi email pour:', invoice.id);

      // 1. Envoyer l'email
      await sendInvoiceEmail(invoice);
      console.log('✅ Email envoyé');

      // 2. Mettre à jour le statut à "sent"
      console.log('🔄 Mise à jour du statut à "sent"...');
      const { error: updateError } = await supabase!
        .from('invoices')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invoice.id);

      if (updateError) {
        console.error('❌ Erreur mise à jour statut:', updateError);
        throw updateError;
      }

      console.log('✅ Statut mis à jour à "sent"');

      setMessage('✅ Email envoyé avec succès !');
      setTimeout(() => {
        onClose();
        // Force refresh de la page
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      setMessage(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn z-[9998]"
        onClick={onClose}
      />

      {/* Modal - CORRECTION: items-center au lieu de items-end */}
      <div className="fixed inset-0 flex items-center justify-center p-0 sm:p-4 z-[9999]">
        <div className="bg-white w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[90vh] sm:rounded-3xl shadow-2xl transform animate-slideUp flex flex-col">
          {/* Header avec safe area */}
          <div 
            className="flex-shrink-0 relative overflow-hidden sm:rounded-t-3xl"
            style={{
              paddingTop: 'env(safe-area-inset-top, 0px)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
            
            <div className="relative z-10 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                    <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-white drop-shadow-lg">
                      Envoyer le devis par email
                    </h2>
                    <p className="text-white/80 text-sm sm:text-base mt-0.5 sm:mt-1">
                      {invoice.quote_number || invoice.invoice_number}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={onClose}
                  className="p-2 sm:p-3 text-white hover:bg-white/20 rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-110"
                  aria-label="Fermer"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Contenu scrollable avec safe area */}
          <div 
            className="flex-1 overflow-y-auto"
            style={{
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-3 sm:mb-4">
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  <div>
                    <div className="font-bold text-gray-900 text-sm sm:text-base">Destinataire</div>
                    <div className="text-xs sm:text-sm text-gray-600">{invoice.client?.email}</div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Devis:</span>
                    <span className="font-bold">{invoice.quote_number || invoice.invoice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Montant:</span>
                    <span className="font-bold">{invoice.total_ttc.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Client:</span>
                    <span className="font-bold">
                      {invoice.client?.firstname} {invoice.client?.lastname}
                    </span>
                  </div>
                </div>
              </div>

              {message && (
                <div className={`p-3 sm:p-4 rounded-xl text-sm ${
                  message.includes('✅') 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {message}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pb-4 sm:pb-0">
                <Button 
                  variant="secondary" 
                  onClick={onClose} 
                  disabled={loading}
                  className="w-full sm:flex-1"
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleSend}
                  disabled={loading}
                  className="w-full sm:flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Envoyer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Utiliser le portail React
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return ReactDOM.createPortal(modalContent, modalRoot);
}
