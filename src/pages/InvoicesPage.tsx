import React, { useState } from 'react';
import { Plus, Eye, Download, Trash2, FileText, Send } from 'lucide-react';
import { Button } from '../components/UI/Button';
import { CreateInvoiceModal } from '../components/Invoices/CreateInvoiceModal';
import { InvoiceDetailsModal } from '../components/Invoices/InvoiceDetailsModal';
import { SendInvoiceModal } from '../components/Invoices/SendInvoiceModal';
import { useInvoices } from '../hooks/useInvoices';
import { useCompanyInfo } from '../hooks/useCompanyInfo';
import { Invoice } from '../types';
import { generateInvoicePDF } from '../utils/pdfGenerator';

export function InvoicesPage() {
  const { invoices, loading, deleteInvoice } = useInvoices();
  const { companyInfo } = useCompanyInfo();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceToSend, setInvoiceToSend] = useState<Invoice | null>(null);

  const handleDelete = async (invoiceId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      try {
        await deleteInvoice(invoiceId);
        alert('Facture supprimée avec succès');
      } catch (error) {
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleDownloadPDF = (invoice: Invoice) => {
    generateInvoicePDF(invoice, companyInfo);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { label: 'Brouillon', class: 'bg-gray-100 text-gray-800' },
      sent: { label: 'Envoyée', class: 'bg-blue-100 text-blue-800' },
      paid: { label: 'Payée', class: 'bg-green-100 text-green-800' },
      overdue: { label: 'En retard', class: 'bg-red-100 text-red-800' }
    };
    const badge = badges[status as keyof typeof badges] || badges.draft;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.class}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Factures</h1>
          <p className="text-gray-600 mt-1">Gérez vos factures clients</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Nouvelle facture
        </Button>
      </div>

      {/* Liste des factures */}
      {invoices.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-dashed border-purple-300">
          <FileText className="w-16 h-16 mx-auto text-purple-400 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune facture</h3>
          <p className="text-gray-600 mb-6">Créez votre première facture pour commencer</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Créer une facture
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold">N° Facture</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Client</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Montant TTC</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Statut</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-purple-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-purple-600">{invoice.invoice_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {invoice.client?.firstname} {invoice.client?.lastname}
                      </div>
                      <div className="text-sm text-gray-500">{invoice.client?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(invoice.invoice_date).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-xs text-gray-500">
                        Échéance: {new Date(invoice.due_date).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{invoice.total_ttc.toFixed(2)}€</div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Voir les détails"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(invoice)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Télécharger PDF"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setInvoiceToSend(invoice)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Envoyer par email"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateInvoiceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {selectedInvoice && (
        <InvoiceDetailsModal
          invoice={selectedInvoice}
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {invoiceToSend && (
        <SendInvoiceModal
          invoice={invoiceToSend}
          isOpen={!!invoiceToSend}
          onClose={() => setInvoiceToSend(null)}
        />
      )}
    </div>
  );
}
