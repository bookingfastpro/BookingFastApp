import React, { useState } from 'react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { Invoice } from '../../types';
import { Undo2, CreditCard, Banknote, Building2, FileText } from 'lucide-react';
import { useInvoicePayments } from '../../hooks/useInvoicePayments';

interface RefundPaymentModalProps {
  invoice: Invoice;
  totalPaid: number;
  isOpen: boolean;
  onClose: () => void;
  onRefundAdded: () => void;
}

const paymentMethods = [
  { value: 'especes', label: 'Espèces', icon: Banknote },
  { value: 'carte', label: 'Carte bancaire', icon: CreditCard },
  { value: 'virement', label: 'Virement', icon: Building2 },
  { value: 'cheque', label: 'Chèque', icon: FileText }
];

export function RefundPaymentModal({ invoice, totalPaid, isOpen, onClose, onRefundAdded }: RefundPaymentModalProps) {
  const { addPayment } = useInvoicePayments(invoice.id);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    payment_method: 'especes' as 'especes' | 'carte' | 'virement' | 'cheque',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    reference: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);

    if (isNaN(amount) || amount <= 0) {
      alert('❌ Montant invalide');
      return;
    }

    if (amount > totalPaid) {
      alert(`❌ Le remboursement ne peut pas dépasser le montant payé (${totalPaid.toFixed(2)}€)`);
      return;
    }

    try {
      setLoading(true);

      // Ajouter un paiement négatif pour le remboursement
      await addPayment({
        invoice_id: invoice.id,
        payment_method: formData.payment_method,
        amount: -amount, // Montant négatif pour remboursement
        payment_date: formData.payment_date,
        reference: formData.reference || undefined,
        notes: formData.notes ? `REMBOURSEMENT: ${formData.notes}` : 'REMBOURSEMENT'
      });

      alert('✅ Remboursement enregistré');
      onRefundAdded();
      onClose();
    } catch (error) {
      console.error('Erreur remboursement:', error);
      alert('❌ Erreur lors du remboursement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rembourser la facture" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info montant disponible */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Montant payé</div>
              <div className="text-3xl font-black text-orange-600">{totalPaid.toFixed(2)}€</div>
            </div>
            <Undo2 className="w-12 h-12 text-orange-400" />
          </div>
        </div>

        {/* Méthode de remboursement */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">
            Méthode de remboursement *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, payment_method: method.value as any })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.payment_method === method.value
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${
                    formData.payment_method === method.value ? 'text-red-600' : 'text-gray-400'
                  }`} />
                  <div className={`text-sm font-bold ${
                    formData.payment_method === method.value ? 'text-red-600' : 'text-gray-600'
                  }`}>
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
            Montant à rembourser * (max: {totalPaid.toFixed(2)}€)
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max={totalPaid}
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder="0.00"
            required
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Date du remboursement *
          </label>
          <input
            type="date"
            value={formData.payment_date}
            onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder="N° de transaction, chèque..."
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
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
            rows={3}
            placeholder="Raison du remboursement..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
            disabled={loading}
          >
            {loading ? 'Enregistrement...' : 'Rembourser'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
