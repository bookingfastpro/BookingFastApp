import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Button } from '../UI/Button';
import { Invoice } from '../../types';
import { FileText, Calendar, User, Mail, Phone, Download, RefreshCw, Eye, Plus, CreditCard, Banknote, Building2, FileText as FileTextIcon, Trash2, Undo2 } from 'lucide-react';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';
import { useInvoicePayments } from '../../hooks/useInvoicePayments';
import { SendInvoiceModal } from './SendInvoiceModal';
import { InvoicePreviewModal } from './InvoicePreviewModal';
import { AddPaymentModal } from './AddPaymentModal';
import { RefundPaymentModal } from './RefundPaymentModal';

interface InvoiceDetailsModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
}

const paymentMethodIcons = {
  especes: { icon: Banknote, label: 'Espèces', color: 'text-green-600' },
  carte: { icon: CreditCard, label: 'Carte bancaire', color: 'text-blue-600' },
  virement: { icon: Building2, label: 'Virement', color: 'text-purple-600' },
  cheque: { icon: FileTextIcon, label: 'Chèque', color: 'text-orange-600' }
};

export function InvoiceDetailsModal({ invoice, isOpen, onClose }: InvoiceDetailsModalProps) {
  const { companyInfo } = useCompanyInfo();
  const { payments, deletePayment, getTotalPaid, fetchPayments } = useInvoicePayments(invoice.id);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  const totalPaid = getTotalPaid();
  const remainingAmount = invoice.total_ttc - totalPaid;
  const isFullyPaid = remainingAmount <= 0;

  useEffect(() => {
    if (isOpen) {
      // Bloquer le scroll du body
      // Use modal-open class
      document.body.classList.add('modal-open');
      
      // Créer le conteneur modal-root s'il n'existe pas
      if (!document.getElementById('modal-root')) {
        const modalRoot = document.createElement('div');
        modalRoot.id = 'modal-root';
        document.body.appendChild(modalRoot);
      }

      return () => {
        document.body.classList.remove('modal-open');
      };
    }
  }, [isOpen]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleDownloadPDF = () => {
    generateInvoicePDF(invoice, companyInfo);
  };

  const handleResend = () => {
    setShowSendModal(true);
  };

  const handlePreview = () => {
    setShowPreviewModal(true);
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Supprimer ce paiement ?')) return;

    try {
      await deletePayment(paymentId);
      alert('✅ Paiement supprimé');
    } catch (error) {
      alert('❌ Erreur lors de la suppression');
    }
  };

  const handlePaymentAdded = () => {
    fetchPayments();
  };

  const handleRefund = () => {
    setShowRefundModal(true);
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn z-[9998]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 z-[9999]">
        <div className="bg-white w-full sm:max-w-3xl max-h-full sm:max-h-[90vh] sm:rounded-3xl shadow-2xl transform animate-slideUp flex flex-col">
          {/* Header avec safe area */}
          <div 
            className="flex-shrink-0 relative overflow-hidden sm:rounded-t-3xl"
            style={{
              paddingTop: 'env(safe-area-inset-top, 0px)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
            
            <div className="relative z-10 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-white drop-shadow-lg">
                      Détails de la facture
                    </h2>
                    <p className="text-white/80 text-sm sm:text-base mt-0.5 sm:mt-1">{invoice.invoice_number}</p>
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
              {/* En-tête facture */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-purple-200">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-purple-600">{invoice.invoice_number}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Facture</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-black text-gray-900">{invoice.total_ttc.toFixed(2)}€</div>
                    <div className="text-xs sm:text-sm text-gray-600">TTC</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div>
                    <div className="text-gray-600 mb-1 text-xs sm:text-sm">Date de facture</div>
                    <div className="font-bold text-gray-900 text-sm sm:text-base">{formatDate(invoice.invoice_date)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1 text-xs sm:text-sm">Date d'échéance</div>
                    <div className="font-bold text-gray-900 text-sm sm:text-base">{formatDate(invoice.due_date)}</div>
                  </div>
                </div>
              </div>

              {/* Statut de paiement */}
              <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 ${
                isFullyPaid 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                  : totalPaid > 0
                  ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-300'
                  : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-300'
              }`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div>
                    <div className={`text-xl sm:text-2xl font-black ${
                      isFullyPaid ? 'text-green-600' : totalPaid > 0 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {isFullyPaid ? '✅ Payée' : totalPaid > 0 ? '⚠️ Partiellement payée' : '❌ Non payée'}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {totalPaid.toFixed(2)}€ / {invoice.total_ttc.toFixed(2)}€
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {!isFullyPaid && (
                      <button
                        onClick={() => setShowAddPaymentModal(true)}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg text-sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Ajouter un paiement</span>
                        <span className="sm:hidden">Ajouter paiement</span>
                      </button>
                    )}
                    {totalPaid > 0 && (
                      <button
                        onClick={handleRefund}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg text-sm"
                      >
                        <Undo2 className="w-4 h-4 mr-2" />
                        Rembourser
                      </button>
                    )}
                  </div>
                </div>

                {remainingAmount > 0 && (
                  <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-bold text-sm">Reste à payer:</span>
                      <span className="text-xl sm:text-2xl font-black text-orange-600">
                        {remainingAmount.toFixed(2)}€
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Liste des paiements */}
              {payments.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-200">
                  <h3 className="font-bold text-blue-800 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                    Paiements reçus ({payments.length})
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    {payments.map((payment) => {
                      const methodInfo = paymentMethodIcons[payment.payment_method];
                      const Icon = methodInfo.icon;
                      return (
                        <div key={payment.id} className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-300">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${methodInfo.color}`} />
                              <div>
                                <div className="font-bold text-gray-900 text-sm sm:text-base">{methodInfo.label}</div>
                                <div className="text-xs sm:text-sm text-gray-600">{formatDate(payment.payment_date)}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="text-lg sm:text-xl font-black text-green-600">
                                {payment.amount.toFixed(2)}€
                              </div>
                              <button
                                onClick={() => handleDeletePayment(payment.id)}
                                className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          </div>
                          {payment.reference && (
                            <div className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">
                              Réf: {payment.reference}
                            </div>
                          )}
                          {payment.notes && (
                            <div className="text-xs sm:text-sm text-gray-600 mt-1 italic">
                              {payment.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Informations client */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-200">
                <h3 className="font-bold text-blue-800 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  Client
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="font-bold text-gray-900">
                    {invoice.client?.firstname} {invoice.client?.lastname}
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 text-xs sm:text-sm">
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                    {invoice.client?.email}
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 text-xs sm:text-sm">
                    <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                    {invoice.client?.phone}
                  </div>
                </div>
              </div>

              {/* Lignes de facture */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-green-200">
                <h3 className="font-bold text-green-800 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  Détails
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {invoice.items?.map((item, index) => (
                    <div key={index} className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-300">
                      <div className="flex justify-between items-start mb-1 sm:mb-2">
                        <div className="font-medium text-gray-900 text-sm sm:text-base">{item.description}</div>
                        <div className="font-bold text-gray-900 text-sm sm:text-base">{item.total_ttc.toFixed(2)}€</div>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        {item.quantity} × {item.unit_price_ht.toFixed(2)}€ HT (TVA {item.tva_rate}%)
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t-2 border-green-300 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-700">
                    <span>Sous-total HT:</span>
                    <span className="font-bold">{invoice.subtotal_ht.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>TVA:</span>
                    <span className="font-bold">{invoice.total_tva.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-lg sm:text-xl font-black text-green-600">
                    <span>Total TTC:</span>
                    <span>{invoice.total_ttc.toFixed(2)}€</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">Notes</h3>
                  <p className="text-gray-700 whitespace-pre-wrap text-sm">{invoice.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pb-4 sm:pb-0">
                <button
                  onClick={onClose}
                  className="w-full sm:flex-1 inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg text-sm"
                >
                  Fermer
                </button>
                <button
                  onClick={handlePreview}
                  className="w-full sm:flex-1 inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg text-sm"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Aperçu
                </button>
                {(invoice.status === 'sent' || invoice.status === 'paid') && (
                  <button
                    onClick={handleResend}
                    className="w-full sm:flex-1 inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg text-sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Renvoyer
                  </button>
                )}
                <button
                  onClick={handleDownloadPDF}
                  className="w-full sm:flex-1 inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg text-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSendModal && (
        <SendInvoiceModal
          invoice={invoice}
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
        />
      )}

      {showPreviewModal && (
        <InvoicePreviewModal
          invoice={invoice}
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
        />
      )}

      {showAddPaymentModal && (
        <AddPaymentModal
          invoice={invoice}
          isOpen={showAddPaymentModal}
          onClose={() => setShowAddPaymentModal(false)}
          onPaymentAdded={handlePaymentAdded}
        />
      )}

      {showRefundModal && (
        <RefundPaymentModal
          invoice={invoice}
          totalPaid={totalPaid}
          isOpen={showRefundModal}
          onClose={() => setShowRefundModal(false)}
          onRefundAdded={handlePaymentAdded}
        />
      )}
    </>
  );

  // Utiliser le portail React
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return ReactDOM.createPortal(modalContent, modalRoot);
}
