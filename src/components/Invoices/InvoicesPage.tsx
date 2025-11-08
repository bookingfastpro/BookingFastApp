import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Filter, Eye, Send, Check, X, Edit, Trash2, RefreshCw, Palette, FileCheck, Undo2, ChevronDown, ChevronUp } from 'lucide-react';
import { useInvoices } from '../../hooks/useInvoices';
import { Invoice } from '../../types';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { CreateInvoiceModal } from './CreateInvoiceModal';
import { InvoiceDetailsModal } from './InvoiceDetailsModal';
import { SendInvoiceModal } from './SendInvoiceModal';
import { InvoicePreviewModal } from './InvoicePreviewModal';
import { PDFCustomizationModal } from './PDFCustomizationModal';
import { useInvoicePayments } from '../../hooks/useInvoicePayments';

type ViewMode = 'quotes' | 'invoices';

export function InvoicesPage() {
  const { invoices, quotes, loading, fetchInvoices, updateInvoice, deleteInvoice, convertQuoteToInvoice } = useInvoices();
  const [viewMode, setViewMode] = useState<ViewMode>('quotes');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const currentDocuments = viewMode === 'quotes' ? quotes : invoices;

  const filteredDocuments = currentDocuments.filter(doc => {
    const matchesSearch = 
      (doc.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (doc.quote_number?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (doc.client?.firstname.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (doc.client?.lastname.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (doc.client?.email.toLowerCase().includes(searchTerm.toLowerCase()) || false);

    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Hook pour récupérer les paiements de chaque facture
  const InvoiceRowWithPayments = ({ doc, index }: { doc: Invoice; index: number }) => {
    const { getTotalPaid } = useInvoicePayments(doc.id);
    const totalPaid = getTotalPaid();
    const remainingAmount = doc.total_ttc - totalPaid;
    
    // Calculer le vrai statut basé sur les paiements
    const getPaymentStatus = (): Invoice['status'] => {
      // Si brouillon, garder le statut original
      if (doc.status === 'draft') return 'draft';
      
      // Si annulé, garder le statut original
      if (doc.status === 'cancelled') return 'cancelled';
      
      // Calculer selon les paiements
      if (totalPaid === 0) return 'sent'; // Non payé
      if (remainingAmount <= 0.01) return 'paid'; // Payé (tolérance de 1 centime)
      return 'sent'; // Partiellement payé (affiché différemment)
    };

    const actualStatus = getPaymentStatus();
    const isPartiallyPaid = totalPaid > 0 && remainingAmount > 0.01;

    return (
      <tr
        key={doc.id}
        className="hover:bg-gray-50 transition-colors animate-fadeIn"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <td className="px-6 py-4">
          <div className="font-bold text-purple-600">
            {viewMode === 'quotes' ? doc.quote_number : doc.invoice_number}
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="font-medium text-gray-900">
            {doc.client?.firstname} {doc.client?.lastname}
          </div>
          <div className="text-sm text-gray-600">{doc.client?.email}</div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-gray-900">{formatDate(doc.invoice_date)}</div>
          <div className="text-xs text-gray-600">Échéance: {formatDate(doc.due_date)}</div>
        </td>
        <td className="px-6 py-4">
          <div className="font-bold text-gray-900">{doc.total_ttc.toFixed(2)}€</div>
          {isPartiallyPaid && (
            <div className="text-xs text-orange-600 font-bold">
              Payé: {totalPaid.toFixed(2)}€
            </div>
          )}
        </td>
        <td className="px-6 py-4">
          {isPartiallyPaid ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
              Partiellement payé
            </span>
          ) : (
            getStatusBadge(actualStatus)
          )}
        </td>
        <td className="px-6 py-4">
          <div className="flex gap-2">
            <button
              onClick={() => handlePreviewDocument(doc)}
              className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
              title="Aperçu"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setSelectedInvoice(doc);
                setShowDetailsModal(true);
              }}
              className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
              title="Détails"
            >
              <FileText className="w-4 h-4" />
            </button>
            
            {/* Bouton Envoyer - Devis brouillon */}
            {viewMode === 'quotes' && doc.status === 'draft' && (
              <button
                onClick={() => handleSendDocument(doc)}
                className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                title="Envoyer"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
            
            {/* Bouton Renvoyer - Devis envoyé non payé */}
            {viewMode === 'quotes' && actualStatus === 'sent' && !isPartiallyPaid && (
              <button
                onClick={() => handleResendDocument(doc)}
                className="p-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg hover:from-orange-600 hover:to-yellow-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                title="Renvoyer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            
            {/* Bouton Convertir en facture - Tous les devis */}
            {viewMode === 'quotes' && (
              <button
                onClick={() => handleConvertToInvoice(doc)}
                className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                title="Convertir en facture"
              >
                <FileCheck className="w-4 h-4" />
              </button>
            )}

            {/* Bouton Rembourser - Facture payée ou partiellement payée */}
            {viewMode === 'invoices' && totalPaid > 0 && (
              <button
                onClick={() => {
                  setSelectedInvoice(doc);
                  setShowDetailsModal(true);
                }}
                className="p-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                title="Rembourser"
              >
                <Undo2 className="w-4 h-4" />
              </button>
            )}

            {/* Bouton Supprimer - Devis et factures brouillon ou non payées */}
            {(doc.status === 'draft' || (actualStatus === 'sent' && !isPartiallyPaid)) && (
              <button
                onClick={() => handleDeleteDocument(doc)}
                className="p-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const badges = {
      draft: { label: 'Brouillon', class: 'bg-gray-100 text-gray-700' },
      sent: { label: 'Non payé', class: 'bg-red-100 text-red-700' },
      paid: { label: 'Payé', class: 'bg-green-100 text-green-700' },
      cancelled: { label: 'Annulé', class: 'bg-red-100 text-red-700' }
    };

    const badge = badges[status];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.class}`}>
        {badge.label}
      </span>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleConvertToInvoice = async (quote: Invoice) => {
    if (!confirm('Confirmer la conversion de ce devis en facture ?')) {
      return;
    }

    try {
      await convertQuoteToInvoice(quote.id);
      alert('✅ Devis converti en facture avec succès !');
    } catch (error) {
      alert('❌ Erreur lors de la conversion');
    }
  };

  const handleDeleteDocument = async (doc: Invoice) => {
    const docType = doc.document_type === 'quote' ? 'devis' : 'facture';
    const docNumber = doc.document_type === 'quote' ? doc.quote_number : doc.invoice_number;

    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${docType === 'devis' ? 'le' : 'la'} ${docType} ${docNumber} ?\n\nCette action est irréversible.`)) {
      return;
    }

    try {
      await deleteInvoice(doc.id);
      alert(`✅ ${docType.charAt(0).toUpperCase() + docType.slice(1)} supprimé${docType === 'facture' ? 'e' : ''} avec succès !`);
      await fetchInvoices();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert(`❌ Erreur lors de la suppression ${docType === 'devis' ? 'du' : 'de la'} ${docType}`);
    }
  };

  const handleSendDocument = (doc: Invoice) => {
    setSelectedInvoice(doc);
    setShowSendModal(true);
  };

  const handleResendDocument = (doc: Invoice) => {
    setSelectedInvoice(doc);
    setShowSendModal(true);
  };

  const handlePreviewDocument = (doc: Invoice) => {
    setSelectedInvoice(doc);
    setShowPreviewModal(true);
  };

  const handleInvoiceCreated = async () => {
    console.log('🔄 handleInvoiceCreated - Force refresh');
    await fetchInvoices();
    setShowCreateModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="min-h-full p-4 sm:p-6 mobile-optimized" style={{ paddingBottom: 'max(6rem, calc(6rem + env(safe-area-inset-bottom)))' }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {viewMode === 'quotes' ? 'Devis' : 'Factures'}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              {viewMode === 'quotes' 
                ? `Gérez vos devis clients (${filteredDocuments.length})`
                : `Gérez vos factures clients (${filteredDocuments.length})`
              }
            </p>
          </div>

        </div>

        {/* Barre compacte : Onglets + Actions */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-2 mb-4">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
            {/* Boutons */}
            <button
              onClick={() => setViewMode('quotes')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all ${
                viewMode === 'quotes'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm">Devis ({quotes.length})</span>
            </button>

            <button
              onClick={() => setViewMode('invoices')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all ${
                viewMode === 'invoices'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span className="text-sm">Factures ({invoices.length})</span>
            </button>

            <button
              onClick={() => setShowCustomizationModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all font-semibold"
              title="Personnaliser PDF"
            >
              <Palette className="w-4 h-4" />
              <span className="text-sm">PDF</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg transition-all font-semibold shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Nouveau</span>
            </button>
          </div>
        </div>

        {/* Barre de recherche et filtres compacts */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Barre de recherche + Bouton Filtres */}
            <div className="flex gap-3 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-sm"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-300 whitespace-nowrap ${
                  showFilters
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-5 h-5" />
                <span className="hidden sm:inline">Filtres</span>
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Total */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg px-4 py-2.5 whitespace-nowrap">
              <div className="text-sm font-bold text-purple-600">
                {currentDocuments.reduce((sum, doc) => sum + doc.total_ttc, 0).toFixed(2)}€
              </div>
              <div className="text-xs text-purple-700">
                {viewMode === 'quotes' ? 'Total devis' : 'Total facturé'}
              </div>
            </div>
          </div>

          {/* Panneau de filtres déroulant */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-gray-200 animate-fadeIn">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Statut</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-sm"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="draft">Brouillon</option>
                    <option value="sent">Envoyé</option>
                    <option value="paid">Payé</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Liste des documents */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
          {filteredDocuments.length > 0 ? (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-purple-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                        {viewMode === 'quotes' ? 'N° Devis' : 'N° Facture'}
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Client</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Montant TTC</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Statut</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDocuments.map((doc, index) => (
                      <InvoiceRowWithPayments key={doc.id} doc={doc} index={index} />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden space-y-4 p-4">
                {filteredDocuments.map((doc, index) => (
                  <MobileInvoiceCard key={doc.id} doc={doc} index={index} viewMode={viewMode} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {viewMode === 'quotes' ? (
                  <FileText className="w-8 h-8 text-gray-400" />
                ) : (
                  <FileCheck className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {viewMode === 'quotes' ? 'Aucun devis' : 'Aucune facture'}
              </h3>
              <p className="text-gray-500 mb-4">
                {viewMode === 'quotes' 
                  ? 'Créez votre premier devis'
                  : 'Les devis validés apparaîtront ici'
                }
              </p>
              {viewMode === 'quotes' && (
                <div className="flex justify-center">
                  <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
                    <Plus className="w-5 h-5 mr-2" />
                    Nouveau devis
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateInvoiceModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onInvoiceCreated={handleInvoiceCreated}
        />
      )}

      {showDetailsModal && selectedInvoice && (
        <InvoiceDetailsModal
          invoice={selectedInvoice}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedInvoice(null);
          }}
        />
      )}

      {showSendModal && selectedInvoice && (
        <SendInvoiceModal
          invoice={selectedInvoice}
          isOpen={showSendModal}
          onClose={() => {
            setShowSendModal(false);
            setSelectedInvoice(null);
          }}
        />
      )}

      {showPreviewModal && selectedInvoice && (
        <InvoicePreviewModal
          invoice={selectedInvoice}
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedInvoice(null);
          }}
        />
      )}

      {showCustomizationModal && (
        <PDFCustomizationModal
          isOpen={showCustomizationModal}
          onClose={() => setShowCustomizationModal(false)}
        />
      )}
    </div>
  );
}

// Composant mobile séparé avec viewMode passé en prop
function MobileInvoiceCard({ doc, index, viewMode }: { doc: Invoice; index: number; viewMode: ViewMode }) {
  const { getTotalPaid } = useInvoicePayments(doc.id);
  const totalPaid = getTotalPaid();
  const remainingAmount = doc.total_ttc - totalPaid;
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const { convertQuoteToInvoice, deleteInvoice, fetchInvoices } = useInvoices();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const badges = {
      draft: { label: 'Brouillon', class: 'bg-gray-100 text-gray-700' },
      sent: { label: 'Non payé', class: 'bg-red-100 text-red-700' },
      paid: { label: 'Payé', class: 'bg-green-100 text-green-700' },
      cancelled: { label: 'Annulé', class: 'bg-red-100 text-red-700' }
    };

    const badge = badges[status];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.class}`}>
        {badge.label}
      </span>
    );
  };

  // Calculer le vrai statut basé sur les paiements
  const getPaymentStatus = (): Invoice['status'] => {
    // Si brouillon, garder le statut original
    if (doc.status === 'draft') return 'draft';
    
    // Si annulé, garder le statut original
    if (doc.status === 'cancelled') return 'cancelled';
    
    // Calculer selon les paiements
    if (totalPaid === 0) return 'sent'; // Non payé
    if (remainingAmount <= 0.01) return 'paid'; // Payé (tolérance de 1 centime)
    return 'sent'; // Partiellement payé
  };

  const actualStatus = getPaymentStatus();
  const isPartiallyPaid = totalPaid > 0 && remainingAmount > 0.01;
  const isQuote = viewMode === 'quotes';

  const handlePreviewDocument = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPreviewModal(true);
  };

  const handleSendDocument = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowSendModal(true);
  };

  const handleConvertToInvoice = async (quote: Invoice) => {
    if (!confirm('Confirmer la conversion de ce devis en facture ?')) {
      return;
    }

    try {
      await convertQuoteToInvoice(quote.id);
      alert('✅ Devis converti en facture avec succès !');
    } catch (error) {
      alert('❌ Erreur lors de la conversion');
    }
  };

  const handleDeleteDocument = async (doc: Invoice) => {
    const docType = doc.document_type === 'quote' ? 'devis' : 'facture';
    const docNumber = doc.document_type === 'quote' ? doc.quote_number : doc.invoice_number;

    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${docType === 'devis' ? 'le' : 'la'} ${docType} ${docNumber} ?\n\nCette action est irréversible.`)) {
      return;
    }

    try {
      await deleteInvoice(doc.id);
      alert(`✅ ${docType.charAt(0).toUpperCase() + docType.slice(1)} supprimé${docType === 'facture' ? 'e' : ''} avec succès !`);
      await fetchInvoices();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert(`❌ Erreur lors de la suppression ${docType === 'devis' ? 'du' : 'de la'} ${docType}`);
    }
  };

  return (
    <>
      <div
        className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl border border-purple-200 p-4 animate-fadeIn"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-bold text-purple-600">
              {doc.invoice_number || doc.quote_number}
            </div>
            <div className="text-sm text-gray-600">{formatDate(doc.invoice_date)}</div>
          </div>
          {isPartiallyPaid ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
              Partiellement payé
            </span>
          ) : (
            getStatusBadge(actualStatus)
          )}
        </div>

        <div className="mb-3">
          <div className="font-medium text-gray-900">
            {doc.client?.firstname} {doc.client?.lastname}
          </div>
          <div className="text-sm text-gray-600">{doc.client?.email}</div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-bold text-gray-900">{doc.total_ttc.toFixed(2)}€</div>
            {isPartiallyPaid && (
              <div className="text-xs text-orange-600 font-bold">
                Payé: {totalPaid.toFixed(2)}€
              </div>
            )}
          </div>
        </div>

        {/* Section Actions avec titre */}
        <div className="border-t border-purple-200 pt-3">
          <div className="text-xs font-bold text-gray-600 mb-2">Actions</div>
          <div className="grid grid-cols-3 gap-2">
            {/* Première ligne : Actions de base toujours visibles */}
            <button
              onClick={() => handlePreviewDocument(doc)}
              className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg flex flex-col items-center justify-center"
              title="Aperçu"
            >
              <Eye className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-bold">Aperçu</span>
            </button>
            
            <button
              onClick={() => {
                setSelectedInvoice(doc);
                setShowDetailsModal(true);
              }}
              className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg flex flex-col items-center justify-center"
              title="Détails"
            >
              <FileText className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-bold">Détails</span>
            </button>
            
            {/* Bouton conditionnel selon le statut */}
            {isQuote && doc.status === 'draft' && (
              <button
                onClick={() => handleSendDocument(doc)}
                className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-lg flex flex-col items-center justify-center"
                title="Envoyer"
              >
                <Send className="w-5 h-5" />
                <span className="text-[10px] mt-1 font-bold">Envoyer</span>
              </button>
            )}
            
            {isQuote && actualStatus === 'sent' && !isPartiallyPaid && (
              <button
                onClick={() => handleSendDocument(doc)}
                className="p-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl hover:from-orange-600 hover:to-yellow-600 transition-all duration-300 transform hover:scale-105 shadow-lg flex flex-col items-center justify-center"
                title="Renvoyer"
              >
                <RefreshCw className="w-5 h-5" />
                <span className="text-[10px] mt-1 font-bold">Renvoyer</span>
              </button>
            )}
            
            {/* Bouton Convertir en facture - Tous les devis */}
            {isQuote && (
              <button
                onClick={() => handleConvertToInvoice(doc)}
                className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg flex flex-col items-center justify-center"
                title="Convertir en facture"
              >
                <FileCheck className="w-5 h-5" />
                <span className="text-[10px] mt-1 font-bold">Facturer</span>
              </button>
            )}

            {/* Bouton Rembourser pour les factures */}
            {!isQuote && totalPaid > 0 && (
              <button
                onClick={() => {
                  setSelectedInvoice(doc);
                  setShowDetailsModal(true);
                }}
                className="p-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg flex flex-col items-center justify-center"
                title="Rembourser"
              >
                <Undo2 className="w-5 h-5" />
                <span className="text-[10px] mt-1 font-bold">Rembourser</span>
              </button>
            )}

            {/* Bouton Supprimer - Devis et factures brouillon ou non payées */}
            {(doc.status === 'draft' || (actualStatus === 'sent' && !isPartiallyPaid)) && (
              <button
                onClick={() => handleDeleteDocument(doc)}
                className="p-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-105 shadow-lg flex flex-col items-center justify-center"
                title="Supprimer"
              >
                <Trash2 className="w-5 h-5" />
                <span className="text-[10px] mt-1 font-bold">Supprimer</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showDetailsModal && selectedInvoice && (
        <InvoiceDetailsModal
          invoice={selectedInvoice}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedInvoice(null);
          }}
        />
      )}

      {showSendModal && selectedInvoice && (
        <SendInvoiceModal
          invoice={selectedInvoice}
          isOpen={showSendModal}
          onClose={() => {
            setShowSendModal(false);
            setSelectedInvoice(null);
          }}
        />
      )}

      {showPreviewModal && selectedInvoice && (
        <InvoicePreviewModal
          invoice={selectedInvoice}
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedInvoice(null);
          }}
        />
      )}
    </>
  );
}
