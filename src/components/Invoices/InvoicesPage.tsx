import React, { useState } from 'react';
import { FileText, Plus, Search, Eye, Send, Trash2, RefreshCw, Palette, FileCheck, Undo2, Mail, Calendar, Euro, User } from 'lucide-react';
import { useInvoices } from '../../hooks/useInvoices';
import { Invoice } from '../../types';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { CreateInvoiceModal } from './CreateInvoiceModal';
import { InvoiceDetailsModal } from './InvoiceDetailsModal';
import { SendInvoiceModal } from './SendInvoiceModal';
import { InvoicePreviewModal } from './InvoicePreviewModal';
import { PDFCustomizationModal } from './PDFCustomizationModal';
import { useInvoicePayments } from '../../hooks/useInvoicePayments';

type ViewMode = 'quotes' | 'invoices';

export function InvoicesPage() {
  const { invoices, quotes, loading, fetchInvoices, deleteInvoice, convertQuoteToInvoice } = useInvoices();
  const [viewMode, setViewMode] = useState<ViewMode>('quotes');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  const handlePreviewDocument = (doc: Invoice) => {
    setSelectedInvoice(doc);
    setShowPreviewModal(true);
  };

  const handleInvoiceCreated = async () => {
    await fetchInvoices();
    setShowCreateModal(false);
  };

  // Calculer les statistiques
  const totalAmount = currentDocuments.reduce((sum, doc) => sum + doc.total_ttc, 0);
  const paidCount = currentDocuments.filter(doc => doc.status === 'paid').length;
  const draftCount = currentDocuments.filter(doc => doc.status === 'draft').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 lg:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {viewMode === 'quotes' ? 'Devis' : 'Factures'}
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez vos {viewMode === 'quotes' ? 'devis' : 'factures'} clients
          </p>
        </div>

        {/* Cartes statistiques */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 lg:p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="text-2xl lg:text-3xl font-bold text-gray-900">{currentDocuments.length}</div>
            <div className="text-xs lg:text-sm text-gray-600 mt-1">Total</div>
          </div>
          <div className="bg-white rounded-2xl p-4 lg:p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="text-2xl lg:text-3xl font-bold text-green-600">{paidCount}</div>
            <div className="text-xs lg:text-sm text-gray-600 mt-1">Payé{paidCount > 1 ? 's' : ''}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 lg:p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="text-2xl lg:text-3xl font-bold text-orange-600">{draftCount}</div>
            <div className="text-xs lg:text-sm text-gray-600 mt-1">Brouillon{draftCount > 1 ? 's' : ''}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 lg:p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="text-2xl lg:text-3xl font-bold text-indigo-600">{totalAmount.toFixed(0)}€</div>
            <div className="text-xs lg:text-sm text-gray-600 mt-1">Montant total</div>
          </div>
        </div>

        {/* Barre d'actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
          {/* Onglets et boutons */}
          <div className="flex flex-col lg:flex-row gap-3 mb-4">
            <div className="flex gap-2 flex-1">
              <button
                onClick={() => setViewMode('quotes')}
                className={`flex-1 lg:flex-none px-6 py-3 rounded-xl font-semibold transition-all ${
                  viewMode === 'quotes'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Devis</span>
                  <span className="text-xs opacity-75">({quotes.length})</span>
                </div>
              </button>

              <button
                onClick={() => setViewMode('invoices')}
                className={`flex-1 lg:flex-none px-6 py-3 rounded-xl font-semibold transition-all ${
                  viewMode === 'invoices'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  <span>Factures</span>
                  <span className="text-xs opacity-75">({invoices.length})</span>
                </div>
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCustomizationModal(true)}
                className="flex-1 lg:flex-none px-6 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-all font-semibold flex items-center justify-center gap-2"
              >
                <Palette className="w-4 h-4" />
                <span className="hidden lg:inline">PDF</span>
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex-1 lg:flex-none px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all font-semibold shadow-md flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau</span>
              </button>
            </div>
          </div>

          {/* Recherche et filtres */}
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par numéro, client ou email..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="sent">Envoyé</option>
              <option value="paid">Payé</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>
        </div>

        {/* Liste des documents */}
        {filteredDocuments.length > 0 ? (
          <div className="space-y-3">
            {filteredDocuments.map((doc, index) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                index={index}
                viewMode={viewMode}
                onPreview={handlePreviewDocument}
                onSend={handleSendDocument}
                onDetails={(doc) => {
                  setSelectedInvoice(doc);
                  setShowDetailsModal(true);
                }}
                onConvert={handleConvertToInvoice}
                onDelete={handleDeleteDocument}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {viewMode === 'quotes' ? (
                <FileText className="w-8 h-8 text-blue-600" />
              ) : (
                <FileCheck className="w-8 h-8 text-indigo-600" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {viewMode === 'quotes' ? 'Aucun devis' : 'Aucune facture'}
            </h3>
            <p className="text-gray-500 mb-6">
              {viewMode === 'quotes'
                ? 'Créez votre premier devis pour commencer'
                : 'Convertissez un devis en facture pour commencer'
              }
            </p>
            {viewMode === 'quotes' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all font-semibold shadow-md inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Nouveau devis
              </button>
            )}
          </div>
        )}
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
    </>
  );
}

// Composant carte de document moderne
function DocumentCard({
  doc,
  index,
  viewMode,
  onPreview,
  onSend,
  onDetails,
  onConvert,
  onDelete
}: {
  doc: Invoice;
  index: number;
  viewMode: ViewMode;
  onPreview: (doc: Invoice) => void;
  onSend: (doc: Invoice) => void;
  onDetails: (doc: Invoice) => void;
  onConvert: (doc: Invoice) => void;
  onDelete: (doc: Invoice) => void;
}) {
  const { getTotalPaid } = useInvoicePayments(doc.id);
  const totalPaid = getTotalPaid();
  const remainingAmount = doc.total_ttc - totalPaid;

  const getPaymentStatus = (): Invoice['status'] => {
    if (doc.status === 'draft') return 'draft';
    if (doc.status === 'cancelled') return 'cancelled';
    if (totalPaid === 0) return 'sent';
    if (remainingAmount <= 0.01) return 'paid';
    return 'sent';
  };

  const actualStatus = getPaymentStatus();
  const isPartiallyPaid = totalPaid > 0 && remainingAmount > 0.01;
  const isQuote = viewMode === 'quotes';

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
      sent: { label: 'Non payé', class: 'bg-orange-100 text-orange-700' },
      paid: { label: 'Payé', class: 'bg-green-100 text-green-700' },
      cancelled: { label: 'Annulé', class: 'bg-red-100 text-red-700' }
    };

    const badge = badges[status];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.class}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all animate-fadeIn overflow-hidden"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Version desktop */}
      <div className="hidden lg:block">
        <div className="p-6">
          <div className="flex items-center gap-6">
            {/* Numéro et date */}
            <div className="w-40">
              <div className="text-xs text-gray-500 mb-1">
                {isQuote ? 'Devis' : 'Facture'}
              </div>
              <div className="text-lg font-bold text-blue-600">
                {doc.invoice_number || doc.quote_number}
              </div>
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(doc.invoice_date)}
              </div>
            </div>

            {/* Client */}
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 mb-1">Client</div>
              <div className="font-semibold text-gray-900 truncate">
                {doc.client?.firstname} {doc.client?.lastname}
              </div>
              <div className="text-sm text-gray-600 truncate flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {doc.client?.email}
              </div>
            </div>

            {/* Montant */}
            <div className="w-32 text-right">
              <div className="text-xs text-gray-500 mb-1">Montant TTC</div>
              <div className="text-xl font-bold text-gray-900">
                {doc.total_ttc.toFixed(2)}€
              </div>
              {isPartiallyPaid && (
                <div className="text-xs text-orange-600 font-semibold mt-1">
                  Payé: {totalPaid.toFixed(2)}€
                </div>
              )}
            </div>

            {/* Statut */}
            <div className="w-32">
              {isPartiallyPaid ? (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                  Partiellement payé
                </span>
              ) : (
                getStatusBadge(actualStatus)
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => onPreview(doc)}
                className="p-2.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl transition-all"
                title="Aperçu"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDetails(doc)}
                className="p-2.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl transition-all"
                title="Détails"
              >
                <FileText className="w-4 h-4" />
              </button>

              {isQuote && doc.status === 'draft' && (
                <button
                  onClick={() => onSend(doc)}
                  className="p-2.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl transition-all"
                  title="Envoyer"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}

              {isQuote && actualStatus === 'sent' && !isPartiallyPaid && (
                <button
                  onClick={() => onSend(doc)}
                  className="p-2.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-xl transition-all"
                  title="Renvoyer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}

              {isQuote && (
                <button
                  onClick={() => onConvert(doc)}
                  className="p-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-xl transition-all"
                  title="Convertir en facture"
                >
                  <FileCheck className="w-4 h-4" />
                </button>
              )}

              {!isQuote && totalPaid > 0 && (
                <button
                  onClick={() => onDetails(doc)}
                  className="p-2.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-all"
                  title="Rembourser"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
              )}

              {(doc.status === 'draft' || (actualStatus === 'sent' && !isPartiallyPaid)) && (
                <button
                  onClick={() => onDelete(doc)}
                  className="p-2.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-all"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Version mobile */}
      <div className="lg:hidden p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xs text-gray-500">
              {isQuote ? 'Devis' : 'Facture'}
            </div>
            <div className="text-lg font-bold text-blue-600">
              {doc.invoice_number || doc.quote_number}
            </div>
          </div>
          {isPartiallyPaid ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
              Partiel
            </span>
          ) : (
            getStatusBadge(actualStatus)
          )}
        </div>

        {/* Client */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 mb-3">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <User className="w-3 h-3" />
            <div className="text-xs font-medium">Client</div>
          </div>
          <div className="font-semibold text-gray-900 text-sm">
            {doc.client?.firstname} {doc.client?.lastname}
          </div>
          <div className="text-xs text-gray-600 mt-1 truncate flex items-center gap-1">
            <Mail className="w-3 h-3" />
            {doc.client?.email}
          </div>
        </div>

        {/* Infos en grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <Calendar className="w-3 h-3" />
              Date
            </div>
            <div className="text-sm font-medium text-gray-900">
              {formatDate(doc.invoice_date)}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <Euro className="w-3 h-3" />
              Montant TTC
            </div>
            <div className="text-sm font-bold text-gray-900">
              {doc.total_ttc.toFixed(2)}€
            </div>
          </div>
        </div>

        {isPartiallyPaid && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-orange-700 font-medium">Payé:</span>
              <span className="text-orange-700 font-bold">{totalPaid.toFixed(2)}€</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="border-t border-gray-200 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onPreview(doc)}
              className="p-2.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl transition-all flex flex-col items-center justify-center gap-1"
            >
              <Eye className="w-4 h-4" />
              <span className="text-xs font-semibold">Aperçu</span>
            </button>

            <button
              onClick={() => onDetails(doc)}
              className="p-2.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl transition-all flex flex-col items-center justify-center gap-1"
            >
              <FileText className="w-4 h-4" />
              <span className="text-xs font-semibold">Détails</span>
            </button>

            {isQuote && doc.status === 'draft' && (
              <button
                onClick={() => onSend(doc)}
                className="p-2.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl transition-all flex flex-col items-center justify-center gap-1"
              >
                <Send className="w-4 h-4" />
                <span className="text-xs font-semibold">Envoyer</span>
              </button>
            )}

            {isQuote && actualStatus === 'sent' && !isPartiallyPaid && (
              <button
                onClick={() => onSend(doc)}
                className="p-2.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-xl transition-all flex flex-col items-center justify-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-xs font-semibold">Renvoyer</span>
              </button>
            )}

            {isQuote && (
              <button
                onClick={() => onConvert(doc)}
                className="p-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-xl transition-all flex flex-col items-center justify-center gap-1"
              >
                <FileCheck className="w-4 h-4" />
                <span className="text-xs font-semibold">Facturer</span>
              </button>
            )}

            {!isQuote && totalPaid > 0 && (
              <button
                onClick={() => onDetails(doc)}
                className="p-2.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-all flex flex-col items-center justify-center gap-1"
              >
                <Undo2 className="w-4 h-4" />
                <span className="text-xs font-semibold">Rembourser</span>
              </button>
            )}

            {(doc.status === 'draft' || (actualStatus === 'sent' && !isPartiallyPaid)) && (
              <button
                onClick={() => onDelete(doc)}
                className="p-2.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-all flex flex-col items-center justify-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-xs font-semibold">Supprimer</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
