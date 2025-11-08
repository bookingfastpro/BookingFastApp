import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Button } from '../UI/Button';
import { Invoice } from '../../types';
import { X, Download } from 'lucide-react';
import { generateInvoicePDFDataUrl } from '../../utils/pdfGenerator';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';
import { LoadingSpinner } from '../UI/LoadingSpinner';

interface InvoicePreviewModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoicePreviewModal({ invoice, isOpen, onClose }: InvoicePreviewModalProps) {
  const { companyInfo, loading: companyLoading } = useCompanyInfo();
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      if (!companyLoading) {
        console.log('📋 Company Info:', companyInfo);
        generatePreview();
      }

      return () => {
        document.body.classList.remove('modal-open');
        setPdfDataUrl(null);
      };
    }
  }, [isOpen, invoice, companyInfo, companyLoading]);

  const generatePreview = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Génération du PDF preview...');
      console.log('🏢 Infos entreprise:', companyInfo);
      
      const dataUrl = await generateInvoicePDFDataUrl(invoice, companyInfo);
      console.log('✅ PDF généré, taille:', dataUrl.length, 'caractères');
      
      setPdfDataUrl(dataUrl);
    } catch (error) {
      console.error('❌ Erreur génération preview:', error);
      setError('Erreur lors de la génération du preview');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (pdfDataUrl) {
      const link = document.createElement('a');
      link.href = pdfDataUrl;
      link.download = `Facture_${invoice.invoice_number}.pdf`;
      link.click();
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
        <div className="bg-white w-full h-full sm:h-auto sm:max-w-4xl sm:max-h-[90vh] sm:rounded-3xl shadow-2xl transform animate-slideUp flex flex-col">
          {/* Header avec safe area */}
          <div 
            className="flex-shrink-0 relative overflow-hidden sm:rounded-t-3xl"
            style={{
              paddingTop: 'env(safe-area-inset-top, 0px)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-yellow-600 to-amber-600"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
            
            <div className="relative z-10 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                    <Download className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-white drop-shadow-lg">
                      Aperçu de la facture
                    </h2>
                    <p className="text-white/80 text-sm sm:text-base mt-0.5 sm:mt-1">{invoice.invoice_number}</p>
                  </div>
                </div>
                
                <button
                  onClick={onClose}
                  className="p-2 sm:p-3 text-white hover:bg-white/20 rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-110"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
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
            <div className="p-4 sm:p-6 space-y-4">
              {(loading || companyLoading) ? (
                <div className="flex flex-col items-center justify-center h-64 sm:h-96 space-y-4">
                  <LoadingSpinner size="lg" />
                  <p className="text-gray-600 text-sm sm:text-base">
                    {companyLoading ? 'Chargement des informations...' : 'Génération du PDF en cours...'}
                  </p>
                </div>
              ) : error ? (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-red-600 mb-4 text-sm sm:text-base">{error}</p>
                  <button
                    onClick={generatePreview}
                    className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-medium rounded-xl transition-all duration-300 shadow-lg text-sm"
                  >
                    Réessayer
                  </button>
                </div>
              ) : pdfDataUrl ? (
                <>
                  <div className="bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
                    <iframe
                      src={pdfDataUrl}
                      className="w-full h-[400px] sm:h-[600px]"
                      title="Aperçu facture PDF"
                      style={{ border: 'none' }}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pb-4 sm:pb-0">
                    <button
                      onClick={onClose}
                      className="w-full sm:flex-1 inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg text-sm"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Fermer
                    </button>
                    <button 
                      onClick={handleDownload}
                      className="w-full sm:flex-1 inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg text-sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-gray-600 text-sm sm:text-base">Impossible de générer l'aperçu</p>
                </div>
              )}
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
