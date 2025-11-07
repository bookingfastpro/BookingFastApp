import React, { useState } from 'react';
import { Search, Calendar, DollarSign, User } from 'lucide-react';
import { Modal } from '../UI/Modal';
import { POSTransaction } from '../../types/pos';

interface TransactionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: POSTransaction[];
}

export function TransactionHistory({ isOpen, onClose, transactions }: TransactionHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransactions = transactions.filter(t => {
    const query = searchQuery.toLowerCase();
    return (
      t.transaction_number.toLowerCase().includes(query) ||
      t.customer_name?.toLowerCase().includes(query) ||
      t.customer_email?.toLowerCase().includes(query)
    );
  });

  const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
  const todayRevenue = transactions
    .filter(t => new Date(t.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, t) => sum + t.total, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Historique des transactions"
      size="xl"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
            <div className="text-sm text-gray-600 mb-1">Aujourd'hui</div>
            <div className="text-2xl font-bold text-green-600">{todayRevenue.toFixed(2)} €</div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200">
            <div className="text-sm text-gray-600 mb-1">Total</div>
            <div className="text-2xl font-bold text-blue-600">{totalRevenue.toFixed(2)} €</div>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une transaction..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="max-h-96 overflow-y-auto space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              Aucune transaction trouvée
            </div>
          ) : (
            filteredTransactions.map(transaction => (
              <div key={transaction.id} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-bold text-gray-900">
                      #{transaction.transaction_number}
                    </div>
                    {transaction.customer_name && (
                      <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <User className="w-4 h-4" />
                        {transaction.customer_name}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">
                      {transaction.total.toFixed(2)} €
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 justify-end mt-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(transaction.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t border-gray-200">
                  <div>
                    Sous-total: {transaction.subtotal.toFixed(2)} €
                  </div>
                  <div>
                    TVA ({transaction.tax_rate}%): {transaction.tax_amount.toFixed(2)} €
                  </div>
                </div>

                {transaction.notes && (
                  <div className="text-sm text-gray-600 mt-2 italic">
                    {transaction.notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
        >
          Fermer
        </button>
      </div>
    </Modal>
  );
}
