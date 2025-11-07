import React, { useState } from 'react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { Invoice } from '../../types';
import { CreditCard, Banknote, Building2, FileText, Loader2 } from 'lucide-react';
import { useInvoicePayments } from '../../hooks/useInvoicePayments';

interface AddPaymentModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onPaymentAdded: () => void;
}

const paymentMethods = [
  { value: 'especes', label: 'Espèces', icon: Banknote, color: 'from-green-600 to-emerald-600' },
  { value: 'carte', label: 'Carte bancaire', icon: CreditCard, color: 'from-blue-600 to-cyan-600' },
  { value: 'virement', label: 'Virement', icon: Building2, color: 'from-purple-600 to-pink-600' },
  { value: 'cheque', label: 'Chèque', icon: FileText, color: 'from-orange-600 to-red-600' }
];

export function AddPaymentModal({ invoice, isOpen, onClose, onPaymentAdded }: AddPaymentModalProps) {
  const { addPayment, getTotalPaid } = useInvoicePayments(invoice.id);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    payment_method: 'especes' as 'especes' | 'carte' | 'virement' | 'cheque',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    reference: '',
    notes: ''
  });

  const totalPaid = getTotalPaid();
  const remainingAmount = invoice.total_ttc - totalPaid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Veuillez saisir un montant valide');
      return;
    }

    if (parseFloat(formData.amount) > remainingAmount) {
      alert(`Le montant ne peut pas dépasser le reste à payer (${remainingAmount.toFixed(2)}€)`);
      return;
    }

    try {
      setLoading(true);

      await addPayment({
        invoice_id: invoice.id,
        payment_method: formData.payment_method,
        amount: parseFloat(formData.amount),
        payment_date: formData.payment_date,
        reference: formData.reference || undefined,
        notes: formData.notes || undefined
      });

      alert('✅ Paiement enregistré avec succès !');
      onPaymentAdded();
      onClose();
    } catch (error) {
      alert('❌ Erreur lors de l\'enregistrement du paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un paiement" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Résumé facture */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600 mb-1">Facture</div>
              <div className="font-bold text-gray-900">{invoice.invoice_number}</div>
            </div>
            <div>
              <div className="text-gray-600 mb-1">Montant total</div>
              <div className="font-bold text-gray-900">{invoice.total_ttc.toFixed(2)}€</div>
            </div>
            <div>
              <div className="text-gray-600 mb-1">Déjà payé</div>
              <div className="font-bold text-green-600">{totalPaid.toFixed(2)}€</div>
            </div>
            <div>
              <div className="text-gray-600 mb-1">Reste à payer</div>
              <div className="font-bold text-orange-600">{remainingAmount.toFixed(2)}€</div>
            </div>
          </div>
        </div>

        {/* Méthode de paiement */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">
            Méthode de paiement *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = formData.payment_method === method.value;
              return (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, payment_method: method.value as any })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? `border-transparent bg-gradient-to-r ${method.color} text-white shadow-lg`
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                  <div className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                    {method.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Montant */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Montant *
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={remainingAmount}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full p-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="0.00"
              required
            />
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">
              €
            </span>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, amount: remainingAmount.toFixed(2) })}
            className="mt-2 text-sm text-purple-600 hover:text-purple-700 font-bold"
          >
            Payer le solde complet ({remainingAmount.toFixed(2)}€)
          </button>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Date de paiement *
          </label>
          <input
            type="date"
            value={formData.payment_date}
            onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            required
          />
        </div>

        {/* Référence */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Référence (optionnel)
          </label>
          <input
            type="text"
            value={formData.reference}
            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="N° de chèque, référence virement..."
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Notes (optionnel)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            rows={3}
            placeholder="Informations complémentaires..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer le paiement'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
