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
      {/* Résumé des paiements */}
      <div className={`bg-gradient-to-r ${getPaymentStatusColor()} rounded-2xl p-4 border-2 animate-fadeIn`}>
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold text-gray-800">État du paiement</span>
          <span className="text-sm font-bold px-3 py-1 bg-white/50 rounded-full">{getPaymentStatusText()}</span>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-bold text-xl text-gray-900">{totalAmount.toFixed(2)}€</div>
            <div className="text-gray-600 font-medium">Total</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-xl text-green-600">{currentPaid.toFixed(2)}€</div>
            <div className="text-gray-600 font-medium">Payé</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-xl text-orange-600">{remainingAmount.toFixed(2)}€</div>
            <div className="text-gray-600 font-medium">Restant</div>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="mt-4">
          <div className="w-full bg-white/50 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min((currentPaid / totalAmount) * 100, 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-600 mt-1 text-center">
            {((currentPaid / totalAmount) * 100).toFixed(0)}% payé
          </div>
        </div>
      </div>

      {/* Actions de paiement */}
      {!isFullyPaid && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-slideUp">
          <button
            type="button"
            onClick={() => {
              setShowAddTransaction(!showAddTransaction);
              setShowPaymentLink(false);
            }}
            className={`px-4 py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 text-base font-bold transform hover:scale-105 shadow-lg ${
              showAddTransaction 
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' 
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600'
            }`}
          >
            {showAddTransaction ? <ChevronUp className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            Ajouter paiement
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
            className={`px-4 py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 text-base font-bold transform hover:scale-105 shadow-lg ${
              showPaymentLink 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
            }`}
          >
            {showPaymentLink ? <ChevronUp className="w-5 h-5" /> : <Link className="w-5 h-5" />}
            Lien de paiement
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

      {/* Section Lien de Paiement (Expandable) */}
      {showPaymentLink && (
        <div className="bg-white border-2 border-purple-200 rounded-2xl p-6 space-y-6 animate-slideDown shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white">
                <Link className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Lien de paiement</h3>
                <p className="text-sm text-gray-600">Créer un lien sécurisé pour le client</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPaymentLink(false)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Timer d'expiration */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-3">
            <div className="flex items-center gap-2 text-purple-700">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                Le lien expirera dans {settings?.payment_link_expiry_minutes || 30} minutes
              </span>
            </div>
          </div>

          {/* Informations de la réservation */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-blue-800">Détails de la réservation</span>
            </div>
            <div className="text-sm text-blue-800 space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span><strong>Client:</strong> {clientEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span><strong>Service:</strong> {serviceName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span><strong>Date:</strong> {new Date(bookingDate).toLocaleDateString('fr-FR')} à {bookingTime}</span>
              </div>
            </div>
          </div>

          {/* Montant */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Euro className="w-4 h-4 text-green-600 flex-shrink-0" />
              Montant à payer (€)
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
                value={paymentLinkAmount || ''}
                onChange={(e) => setPaymentLinkAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-300 text-xl font-bold bg-white shadow-inner"
                placeholder="0.00"
              />
            </div>
            
            {/* Suggestions de montants */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Montant restant', value: remainingAmount },
                { label: 'Acompte 30%', value: totalAmount * 0.3 },
                { label: 'Acompte 50%', value: totalAmount * 0.5 },
                { label: '20€', value: 20 },
                { label: '50€', value: 50 },
                { label: '100€', value: 100 }
              ].filter(item => item.value <= remainingAmount && item.value > 0).map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setPaymentLinkAmount(item.value)}
                  className="px-3 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-xl text-sm font-medium hover:from-purple-200 hover:to-pink-200 transition-all duration-300 transform hover:scale-105 border border-purple-200"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Guide d'utilisation */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">i</span>
              </div>
              <span className="font-bold text-blue-800">Comment ça marche</span>
            </div>
            <div className="text-xs text-blue-700 space-y-1">
              <div>1. Le lien sera copié dans votre presse-papiers</div>
              <div>2. Envoyez-le au client par email ou SMS</div>
              <div>3. Le client clique et paie en ligne</div>
              <div>4. Le paiement est automatiquement enregistré</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowPaymentLink(false)}
              className="flex-1 px-6 py-4 text-gray-600 hover:bg-gray-100 rounded-2xl transition-all duration-300 font-bold border-2 border-gray-200 hover:border-gray-300"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleGenerateLink}
              disabled={paymentLinkAmount <= 0 || !isStripeConfigured}
              className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 text-white px-6 py-4 rounded-2xl hover:from-purple-700 hover:via-pink-700 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold flex items-center justify-center gap-2 transform hover:scale-105 shadow-lg"
            >
              <Send className="w-5 h-5" />
              Générer le lien
            </button>
          </div>
        </div>
      )}

      {/* Liste des transactions */}
      {transactions.length > 0 && (
        <div className="space-y-3 animate-fadeIn">
          <h4 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Historique des paiements ({transactions.length})
          </h4>
          
          <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-custom">
            {transactions.map((transaction, index) => (
              <div
                key={transaction.id}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 hover:border-blue-200 transition-all duration-300 transform hover:scale-[1.02] shadow-sm animate-fadeIn ${
                  transaction.status === 'pending' 
                    ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200' 
                    : 'bg-white border-gray-100'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`font-bold text-lg ${
                      transaction.status === 'pending' ? 'text-orange-600' : 
                      transaction.status === 'cancelled' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {transaction.status === 'pending' || transaction.status === 'cancelled' ? '' : '+'}{transaction.amount.toFixed(2)}€
                    </span>
                    <span className="text-xs bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-1 rounded-full font-medium">
                      {getPaymentMethodLabel(transaction.method)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      transaction.status === 'pending' 
                        ? 'bg-orange-100 text-orange-700' 
                        : transaction.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {getTransactionStatusLabel(transaction)}
                    </span>
                    {/* Timer pour les liens de paiement */}
                    {transaction.method === 'stripe' && transaction.status === 'pending' && (
                      <PaymentLinkTimer 
                        createdAt={transaction.created_at} 
                        expiryMinutes={settings?.payment_link_expiry_minutes || 30}
                      />
                    )}
                  </div>
                  {transaction.note && (
                    <div className="text-sm text-gray-600 mb-1 font-medium">{cleanTransactionNote(transaction.note)}</div>
                  )}
                  <div className="text-xs text-gray-400">
                    {new Date(transaction.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {/* Bouton copier lien - seulement pour les liens Stripe en attente */}
                  {transaction.method === 'stripe' && transaction.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => copyPaymentLink(transaction)}
                      className="p-3 text-blue-500 hover:bg-blue-50 rounded-xl transition-all duration-300 transform hover:scale-110"
                      title="Copier le lien de paiement"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => handleDeleteTransaction(transaction.id)}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300 transform hover:scale-110"
                    title={transaction.status === 'pending' ? 'Supprimer le lien de paiement' : 'Supprimer la transaction'}
                  >
                    <Trash2 className="w-5 h-5" />
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
