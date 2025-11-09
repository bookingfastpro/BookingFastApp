import React, { useState } from 'react';
import { CreditCard, Plus, Trash2, Link, Euro, Calculator, Send, Clock, Copy, User, Mail, Package, Calendar, ChevronDown, ChevronUp, X, ExternalLink } from 'lucide-react';
import { Transaction } from '../../types';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import { sendPaymentLinkEmail } from '../../lib/workflowEngine';
import { useAuth } from '../../contexts/AuthContext';

interface PaymentSectionProps {
  totalAmount: number;
  currentPaid: number;
  transactions: Transaction[];
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'created_at'>) => void;
  onDeleteTransaction: (transactionId: string) => void;
  onGeneratePaymentLink: (amount: number) => void;
  clientEmail: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  selectedClient?: {
    firstname?: string;
    lastname?: string;
    phone?: string;
  };
}

// Composant Timer pour les liens de paiement
function PaymentLinkTimer({ createdAt, expiryMinutes = 30 }: { createdAt: string; expiryMinutes?: number }) {
  const [timeLeft, setTimeLeft] = React.useState<number>(0);
  const [isExpired, setIsExpired] = React.useState(false);

  React.useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const createdTime = new Date(createdAt).getTime();
      const expirationTime = createdTime + (expiryMinutes * 60 * 1000);
      const remaining = Math.max(0, expirationTime - now);
      
      setTimeLeft(remaining);
      setIsExpired(remaining === 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [createdAt, expiryMinutes]);

  const formatTimeLeft = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isExpired) {
    return (
      <div className="flex items-center gap-1 text-red-600 text-xs font-bold">
        <Clock className="w-3 h-3" />
        <span>Expiré</span>
      </div>
    );
  }

  const isWarning = timeLeft < 5 * 60 * 1000; // Moins de 5 minutes

  return (
    <div className={`flex items-center gap-1 text-xs font-bold ${
      isWarning ? 'text-orange-600 animate-pulse' : 'text-blue-600'
    }`}>
      <Clock className="w-3 h-3" />
      <span>{formatTimeLeft(timeLeft)}</span>
    </div>
  );
}

export function PaymentSection({
  totalAmount,
  currentPaid,
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  onGeneratePaymentLink,
  clientEmail,
  serviceName,
  bookingDate,
  bookingTime,
  selectedClient
}: PaymentSectionProps) {
  const { settings } = useBusinessSettings();
  const { user } = useAuth();
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showPaymentLink, setShowPaymentLink] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    amount: 0,
    method: 'cash' as const,
    note: ''
  });
  const [paymentLinkAmount, setPaymentLinkAmount] = useState(0);

  const calculateCurrentPaid = () => {
    return transactions
      .filter(transaction => transaction.status !== 'pending' && transaction.status !== 'cancelled')
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  };

  const remainingAmount = totalAmount - currentPaid;
  const isFullyPaid = remainingAmount <= 0;
  
  // Vérifier si Stripe est vraiment configuré
  const isStripeConfigured = !!(
    settings?.stripe_enabled === true && 
    settings?.stripe_public_key && 
    settings?.stripe_public_key.trim() !== '' &&
    settings?.stripe_secret_key && 
    settings?.stripe_secret_key.trim() !== ''
  );
  
  console.log('🔍 Vérification Stripe:', {
    stripe_enabled: settings?.stripe_enabled,
    has_public_key: !!(settings?.stripe_public_key && settings.stripe_public_key.trim() !== ''),
    has_secret_key: !!(settings?.stripe_secret_key && settings.stripe_secret_key.trim() !== ''),
    isStripeConfigured
  });
  const handleAddTransaction = () => {
    if (newTransaction.amount <= 0) return;
    
    onAddTransaction(newTransaction);
    setNewTransaction({ amount: 0, method: 'cash', note: '' });
    setShowAddTransaction(false);
  };

  const handleGenerateLink = () => {
    if (paymentLinkAmount <= 0) return;
    
    console.log('🔄 Génération lien de paiement:', {
      amount: paymentLinkAmount,
      client: clientEmail,
      service: serviceName,
      isStripeConfigured
    });
    
    if (!isStripeConfigured) {
      console.warn('⚠️ Stripe non configuré - génération du lien quand même');
    }
    
    // Appeler la fonction de génération de lien qui gère le workflow
    onGeneratePaymentLink(paymentLinkAmount);
    
    setPaymentLinkAmount(0);
    setShowPaymentLink(false);
  };

  const handleDeleteTransaction = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    
    if (transaction && transaction.method === 'stripe' && transaction.status === 'pending') {
      // Pour les liens de paiement, marquer comme supprimé au lieu de supprimer
      const updatedTransactions = transactions.map(t => 
        t.id === transactionId 
          ? { ...t, status: 'cancelled' as const, note: t.note.replace('En attente', 'Supprimé') }
          : t
      );
      
      // Mettre à jour les transactions avec le statut "cancelled"
      transactions.forEach((t, index) => {
        if (t.id === transactionId) {
          onDeleteTransaction(transactionId);
        }
      });
    } else {
      onDeleteTransaction(transactionId);
    }
  };

  const copyPaymentLink = async (transaction: Transaction) => {
    if (transaction.method !== 'stripe' || transaction.status !== 'pending') return;

    try {
      let fullPaymentLink = '';

      // 🔥 PRIORITÉ 1 : Utiliser le payment_link_id de la transaction
      if (transaction.payment_link_id) {
        const baseUrl = window.location.origin;
        fullPaymentLink = `${baseUrl}/payment?link_id=${transaction.payment_link_id}`;
        console.log('✅ Lien généré avec payment_link_id:', fullPaymentLink);
      }
      // Fallback : chercher le lien dans la note
      else {
        const noteMatch = transaction.note.match(/Lien: (https?:\/\/[^\s)]+)/);
        if (noteMatch) {
          fullPaymentLink = noteMatch[1];
          console.log('🔗 Lien trouvé dans la note:', fullPaymentLink);
        } else {
          console.error('❌ Aucun payment_link_id et aucun lien dans la note');
          alert('Erreur : Impossible de récupérer le lien de paiement');
          return;
        }
      }

      await navigator.clipboard.writeText(fullPaymentLink);
      alert('Lien de paiement copié dans le presse-papiers !');
    } catch (error) {
      console.error('Erreur copie lien:', error);
      alert('Erreur lors de la copie du lien');
    }
  };

  // Fonction pour nettoyer le texte de la note (enlever les IDs de session)
  const cleanTransactionNote = (note: string) => {
    // Supprimer les références aux sessions Stripe et aux liens de paiement
    return note
      .replace(/\s*-\s*Session:\s*cs_[a-zA-Z0-9_]+/g, '')
      .replace(/\s*\(Session:\s*cs_[a-zA-Z0-9_]+\)/g, '')
      .replace(/\s*-\s*Lien:\s*https?:\/\/[^\s)]+/g, '')
      .replace(/\s*\(Lien:\s*https?:\/\/[^\s)]+\)/g, '')
      .trim();
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return '💵 Espèces';
      case 'card': return '💳 Carte';
      case 'transfer': return '🏦 Virement';
      case 'stripe': return '🔗 Stripe';
      default: return method;
    }
  };

  const getTransactionStatusLabel = (transaction: Transaction) => {
    if (transaction.status === 'pending') {
      return '⏳ En attente';
    }
    if (transaction.status === 'cancelled') {
      return '❌ Expiré';
    }
    return '✅ Payé';
  };

  const getTransactionStatusColor = (transaction: Transaction) => {
    if (transaction.status === 'pending') {
      return 'from-orange-100 to-yellow-100 border-orange-200';
    }
    if (transaction.status === 'cancelled') {
      return 'from-red-100 to-pink-100 border-red-200';
    }
    return 'from-green-100 to-emerald-100 border-green-200';
  };

  const getPaymentStatusColor = () => {
    if (isFullyPaid) return 'from-green-100 to-emerald-100 border-green-200';
    if (currentPaid > 0) return 'from-orange-100 to-yellow-100 border-orange-200';
    return 'from-red-100 to-pink-100 border-red-200';
  };

  const getPaymentStatusText = () => {
    if (isFullyPaid) return '✅ Payé intégralement';
    if (currentPaid > 0) return '⏳ Partiellement payé';
    return '❌ Non payé';
  };

  return (
    <div className="space-y-4">
      {/* Résumé des paiements - VERSION COMPACTE */}
      <div className={`bg-gradient-to-r ${getPaymentStatusColor()} rounded-xl p-3 border-2`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-gray-800">État du paiement</span>
          <span className="text-xs font-bold px-2 py-1 bg-white/60 rounded-full">{getPaymentStatusText()}</span>
        </div>

        <div className="flex items-center justify-between text-sm mb-2">
          <div className="flex items-center gap-1">
            <span className="text-gray-600 text-xs">Total</span>
            <span className="font-bold text-gray-900">{totalAmount.toFixed(2)}€</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-600 text-xs">Payé</span>
            <span className="font-bold text-green-600">{currentPaid.toFixed(2)}€</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-600 text-xs">Restant</span>
            <span className="font-bold text-orange-600">{remainingAmount.toFixed(2)}€</span>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white/50 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((currentPaid / totalAmount) * 100, 100)}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">
            {((currentPaid / totalAmount) * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Actions de paiement - VERSION COMPACTE */}
      {!isFullyPaid && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setShowAddTransaction(!showAddTransaction);
              setShowPaymentLink(false);
            }}
            className={`px-3 py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-semibold ${
              showAddTransaction
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600'
            }`}
          >
            {showAddTransaction ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            Ajouter
          </button>

          <button
            type="button"
            onClick={() => {
              setShowPaymentLink(!showPaymentLink);
              setShowAddTransaction(false);
              if (!showPaymentLink) {
                setPaymentLinkAmount(remainingAmount);
              }
            }}
            className={`px-3 py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-semibold ${
              showPaymentLink
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600'
            }`}
          >
            {showPaymentLink ? <ChevronUp className="w-4 h-4" /> : <Link className="w-4 h-4" />}
            Lien
          </button>
        </div>
      )}

      {/* Section Ajouter Transaction (Expandable) */}
      {showAddTransaction && (
        <div className="bg-white border-2 border-blue-200 rounded-2xl p-6 space-y-6 animate-slideDown shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Ajouter un paiement</h3>
                <p className="text-sm text-gray-600">Enregistrer un nouveau paiement reçu</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAddTransaction(false)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-3">
              <div className="text-blue-600 text-xs font-medium">Montant total</div>
              <div className="text-lg font-bold text-blue-800">{totalAmount.toFixed(2)}€</div>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-3">
              <div className="text-orange-600 text-xs font-medium">Restant à payer</div>
              <div className="text-lg font-bold text-orange-800">{remainingAmount.toFixed(2)}€</div>
            </div>
          </div>

          {/* Montant */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Euro className="w-4 h-4 text-green-600 flex-shrink-0" />
              Montant du paiement (€)
            </label>
            
            <div className="relative mb-3">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Euro className="w-4 h-4 text-white" />
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={remainingAmount}
                value={newTransaction.amount || ''}
                onChange={(e) => setNewTransaction(prev => ({
                  ...prev,
                  amount: parseFloat(e.target.value) || 0
                }))}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 text-xl font-bold bg-white shadow-inner"
                placeholder="0.00"
              />
            </div>
            
            {/* Suggestions de montants */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Restant', value: remainingAmount },
                { label: '50%', value: totalAmount * 0.5 },
                { label: '30%', value: totalAmount * 0.3 },
                { label: '20€', value: 20 },
                { label: '50€', value: 50 },
                { label: '100€', value: 100 }
              ].filter(item => item.value <= remainingAmount && item.value > 0).map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setNewTransaction(prev => ({ ...prev, amount: item.value }))}
                  className="px-3 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-xl text-sm font-medium hover:from-blue-200 hover:to-purple-200 transition-all duration-300 transform hover:scale-105 border border-blue-200"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mode de paiement */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-600" />
              Mode de paiement
            </label>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'cash', label: 'Espèces', icon: '💵', color: 'from-green-500 to-emerald-500' },
                { value: 'card', label: 'Carte', icon: '💳', color: 'from-blue-500 to-cyan-500' },
                { value: 'transfer', label: 'Virement', icon: '🏦', color: 'from-purple-500 to-pink-500' },
                { value: 'stripe', label: 'En ligne', icon: '🔗', color: 'from-orange-500 to-red-500' }
              ].map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setNewTransaction(prev => ({ ...prev, method: method.value as any }))}
                  className={`p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                    newTransaction.method === method.value
                      ? `bg-gradient-to-r ${method.color} text-white border-transparent shadow-lg`
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="text-2xl mb-1">{method.icon}</div>
                    <div className="text-sm font-bold">{method.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3">
              Note (optionnel)
            </label>
            <input
              type="text"
              maxLength={100}
              value={newTransaction.note}
              onChange={(e) => setNewTransaction(prev => ({
                ...prev,
                note: e.target.value
              }))}
              className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 bg-white shadow-inner"
              placeholder="Ajouter une note ou référence..."
            />
            <div className="text-xs text-gray-500 mt-1 text-right">
              {newTransaction.note.length}/100 caractères
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowAddTransaction(false)}
              className="flex-1 px-6 py-4 text-gray-600 hover:bg-gray-100 rounded-2xl transition-all duration-300 font-bold border-2 border-gray-200 hover:border-gray-300"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleAddTransaction}
              disabled={newTransaction.amount <= 0}
              className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 text-white px-6 py-4 rounded-2xl hover:from-blue-700 hover:via-purple-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Ajouter
            </button>
          </div>
        </div>
      )}

      {/* Section Lien de Paiement - VERSION COMPACTE */}
      {showPaymentLink && (
        <div className="bg-white border-2 border-cyan-200 rounded-xl p-3 space-y-3">
          {/* Header compact */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Link className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-gray-900">Lien de paiement</span>
            </div>
            <button
              type="button"
              onClick={() => setShowPaymentLink(false)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Info expiration + Client compact */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-blue-700">
              <Clock className="w-3 h-3" />
              <span>Expire dans {settings?.payment_link_expiry_minutes || 30} min</span>
              <span className="text-blue-600">•</span>
              <Mail className="w-3 h-3" />
              <span className="truncate">{clientEmail}</span>
            </div>
          </div>

          {/* Montant rapide */}
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1.5 block flex items-center gap-1">
              <Euro className="w-3 h-3" />
              Montant (€)
            </label>

            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={remainingAmount}
                  value={paymentLinkAmount || ''}
                  onChange={(e) => setPaymentLinkAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-500 text-base font-bold"
                  placeholder="0.00"
                />
              </div>
              <button
                type="button"
                onClick={() => setPaymentLinkAmount(remainingAmount)}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200 border border-blue-300 whitespace-nowrap"
              >
                Restant
              </button>
            </div>

            {/* Suggestions rapides */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '30%', value: totalAmount * 0.3 },
                { label: '50%', value: totalAmount * 0.5 },
                { label: '20€', value: 20 },
                { label: '50€', value: 50 },
                { label: '100€', value: 100 }
              ].filter(item => item.value <= remainingAmount && item.value > 0).map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setPaymentLinkAmount(item.value)}
                  className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100 border border-blue-200"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions compactes */}
          <div className="flex gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setShowPaymentLink(false)}
              className="flex-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-semibold border border-gray-200"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleGenerateLink}
              disabled={paymentLinkAmount <= 0 || !isStripeConfigured}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-2 rounded-lg hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold flex items-center justify-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              Générer
            </button>
          </div>
        </div>
      )}

      {/* Liste des transactions - VERSION COMPACTE */}
      {transactions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600" />
            Historique ({transactions.length})
          </h4>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`flex items-center gap-2 p-2 rounded-lg border ${
                  transaction.status === 'pending'
                    ? 'bg-orange-50 border-orange-200'
                    : transaction.status === 'cancelled'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`font-bold ${
                      transaction.status === 'pending' ? 'text-orange-600' :
                      transaction.status === 'cancelled' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {transaction.status === 'pending' || transaction.status === 'cancelled' ? '' : '+'}{transaction.amount.toFixed(2)}€
                    </span>
                    <span className="text-gray-600">{getPaymentMethodLabel(transaction.method)}</span>
                    {transaction.method === 'stripe' && transaction.status === 'pending' && (
                      <PaymentLinkTimer
                        createdAt={transaction.created_at}
                        expiryMinutes={settings?.payment_link_expiry_minutes || 30}
                      />
                    )}
                  </div>
                  {transaction.note && (
                    <div className="text-xs text-gray-500 truncate">{cleanTransactionNote(transaction.note)}</div>
                  )}
                </div>

                <div className="flex gap-1 flex-shrink-0">
                  {transaction.method === 'stripe' && transaction.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => copyPaymentLink(transaction)}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                      title="Copier le lien"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteTransaction(transaction.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
