import React, { useState } from 'react';
import { CreditCard, Plus, Trash2, Link, Euro, Calculator, Send, Clock, Copy, User, Mail, Package, Calendar, ChevronDown, ChevronUp, X, ExternalLink, MessageSquare } from 'lucide-react';
import { Transaction, Booking } from '../../types';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import { sendPaymentLinkEmail } from '../../lib/workflowEngine';
import { triggerWorkflow } from '../../lib/workflowEngine';
import { triggerSmsWorkflow } from '../../lib/smsWorkflowEngine';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

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

  const getPaymentLinkUrl = async (transaction: Transaction): Promise<string | null> => {
    if (!transaction.payment_link_id) return null;

    try {
      const { data: paymentLink } = await supabase
        .from('payment_links')
        .select('short_code')
        .eq('id', transaction.payment_link_id)
        .maybeSingle();

      if (paymentLink?.short_code) {
        const baseUrl = window.location.origin;
        return `${baseUrl}/p/${paymentLink.short_code}`;
      }

      return null;
    } catch (error) {
      console.error('❌ Erreur récupération lien:', error);
      return null;
    }
  };

  const copyPaymentLink = async (transaction: Transaction) => {
    if (transaction.method !== 'stripe' || transaction.status !== 'pending') return;

    try {
      const fullPaymentLink = await getPaymentLinkUrl(transaction);

      if (!fullPaymentLink) {
        console.error('❌ Impossible de récupérer le lien de paiement');
        alert('Erreur : Impossible de récupérer le lien de paiement');
        return;
      }

      await navigator.clipboard.writeText(fullPaymentLink);
      alert('Lien de paiement copié dans le presse-papiers !');
    } catch (error) {
      console.error('Erreur copie lien:', error);
      alert('Erreur lors de la copie du lien');
    }
  };

  const sendPaymentLinkByEmail = async (transaction: Transaction) => {
    if (transaction.method !== 'stripe' || transaction.status !== 'pending') return;
    if (!user?.id) return;

    try {
      const fullPaymentLink = await getPaymentLinkUrl(transaction);

      if (!fullPaymentLink) {
        alert('Erreur : Impossible de récupérer le lien de paiement');
        return;
      }

      const bookingData: Partial<Booking> = {
        client_firstname: selectedClient?.firstname || '',
        client_name: selectedClient?.lastname || '',
        client_email: clientEmail,
        client_phone: selectedClient?.phone || '',
        payment_link: fullPaymentLink,
        date: bookingDate,
        time: bookingTime,
        total_amount: totalAmount
      };

      await triggerWorkflow('payment_link_created', bookingData as Booking, user.id);

      alert('✅ Lien de paiement envoyé par email !');
    } catch (error) {
      console.error('Erreur envoi email:', error);
      alert('❌ Erreur lors de l\'envoi de l\'email');
    }
  };

  const sendPaymentLinkBySms = async (transaction: Transaction) => {
    if (transaction.method !== 'stripe' || transaction.status !== 'pending') return;
    if (!user?.id) return;

    try {
      const fullPaymentLink = await getPaymentLinkUrl(transaction);

      if (!fullPaymentLink) {
        alert('Erreur : Impossible de récupérer le lien de paiement');
        return;
      }

      const bookingData: Partial<Booking> = {
        client_firstname: selectedClient?.firstname || '',
        client_name: selectedClient?.lastname || '',
        client_email: clientEmail,
        client_phone: selectedClient?.phone || '',
        payment_link: fullPaymentLink,
        date: bookingDate,
        time: bookingTime,
        total_amount: totalAmount
      };

      await triggerSmsWorkflow('payment_link_created', bookingData as Booking, user.id);

      alert('✅ Lien de paiement envoyé par SMS !');
    } catch (error) {
      console.error('Erreur envoi SMS:', error);
      alert('❌ Erreur lors de l\'envoi du SMS');
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
    <div className="space-y-3 lg:space-y-4">
      {/* Résumé des paiements - VERSION COMPACTE */}
      <div className={`bg-gradient-to-r ${getPaymentStatusColor()} rounded-lg lg:rounded-xl p-3 lg:p-4 border lg:border-2`}>
        <div className="flex items-center justify-between mb-2 lg:mb-3">
          <span className="text-sm lg:text-base font-bold text-gray-800">État du paiement</span>
          <span className="text-xs lg:text-sm font-bold px-2 py-1 bg-white/60 rounded-full">{getPaymentStatusText()}</span>
        </div>

        <div className="flex items-center justify-between text-sm mb-2 lg:mb-3">
          <div className="flex items-center gap-1">
            <span className="text-gray-600 text-xs lg:text-sm">Total</span>
            <span className="font-bold text-gray-900 text-xs lg:text-sm">{totalAmount.toFixed(2)}€</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-600 text-xs lg:text-sm">Payé</span>
            <span className="font-bold text-green-600 text-xs lg:text-sm">{currentPaid.toFixed(2)}€</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-600 text-xs lg:text-sm">Restant</span>
            <span className="font-bold text-orange-600 text-xs lg:text-sm">{remainingAmount.toFixed(2)}€</span>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white/50 rounded-full h-2 lg:h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min((currentPaid / totalAmount) * 100, 100)}%` }}
            />
          </div>
          <span className="text-xs lg:text-sm font-semibold text-gray-700 whitespace-nowrap">
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
            className={`px-3 py-3 lg:py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm lg:text-base font-semibold ${
              showAddTransaction
? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
            }`}
          >
            {showAddTransaction ? <ChevronUp className="w-4 h-4 lg:w-5 lg:h-5" /> : <Plus className="w-4 h-4 lg:w-5 lg:h-5" />}
            Créer paiement
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
            className={`px-3 py-3 lg:py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm lg:text-base font-semibold ${
              showPaymentLink
? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white'
: 'bg-gradient-to-r from-purple-500 to-violet-500 text-white hover:from-purple-600 hover:to-violet-600'
            }`}
          >
            {showPaymentLink ? <ChevronUp className="w-4 h-4 lg:w-5 lg:h-5" /> : <Link className="w-4 h-4 lg:w-5 lg:h-5" />}
            Lien de paiement
          </button>
        </div>
      )}

      {/* Section Ajouter Transaction - VERSION COMPACTE */}
      {showAddTransaction && (
        <div className="bg-white border-2 border-green-200 rounded-xl p-3 lg:p-4 space-y-3">
          {/* Header compact */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 lg:w-9 lg:h-9 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Plus className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
              </div>
              <span className="text-sm lg:text-base font-bold text-gray-900">Ajouter un paiement</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAddTransaction(false)}
              className="p-1 lg:p-1.5 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
          </div>

          {/* Montant */}
          <div>
            <label className="text-xs lg:text-sm font-semibold text-gray-700 mb-1.5 block flex items-center gap-1">
              <Euro className="w-3 h-3 lg:w-4 lg:h-4" />
              Montant (€)
            </label>

            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
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
                  className="w-full px-3 py-2 lg:py-3 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-500 text-base lg:text-lg font-bold"
                  placeholder="0.00"
                />
              </div>
              <button
                type="button"
                onClick={() => setNewTransaction(prev => ({ ...prev, amount: remainingAmount }))}
                className="px-3 py-2 lg:py-3 bg-green-100 text-green-700 rounded-lg text-xs lg:text-sm font-semibold hover:bg-green-200 border border-green-300 whitespace-nowrap"
              >
                Restant
              </button>
            </div>

            {/* Suggestions rapides */}
            <div className="flex flex-wrap gap-1.5">
              {[
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
                  className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium hover:bg-green-100 border border-green-200"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mode de paiement - Version horizontale compacte */}
          <div>
            <label className="text-xs lg:text-sm font-semibold text-gray-700 mb-1.5 block flex items-center gap-1">
              <CreditCard className="w-3 h-3 lg:w-4 lg:h-4" />
              Mode
            </label>

            <div className="grid grid-cols-4 gap-1.5 lg:gap-2">
              {[
                { value: 'cash', label: 'Espèces', icon: '💵' },
                { value: 'card', label: 'Carte', icon: '💳' },
                { value: 'transfer', label: 'Virement', icon: '🏦' },
                { value: 'stripe', label: 'En ligne', icon: '🔗' }
              ].map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setNewTransaction(prev => ({ ...prev, method: method.value as any }))}
                  className={`p-2 lg:p-3 rounded-lg border transition-all ${
                    newTransaction.method === method.value
                      ? 'bg-green-500 text-white border-green-600'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-green-300'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center text-center gap-0.5">
                    <div className="text-base lg:text-xl">{method.icon}</div>
                    <div className="text-[10px] lg:text-xs font-semibold leading-tight">{method.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Note optionnelle */}
          <div>
            <label className="text-xs lg:text-sm font-semibold text-gray-700 mb-1.5 block">
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
              className="w-full px-3 py-2 lg:py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-500 text-sm lg:text-base"
              placeholder="Référence..."
            />
          </div>

          {/* Actions compactes */}
          <div className="flex gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setShowAddTransaction(false)}
              className="flex-1 px-3 py-2 lg:py-3 text-gray-600 hover:bg-gray-100 rounded-lg text-sm lg:text-base font-semibold border border-gray-200"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleAddTransaction}
              disabled={newTransaction.amount <= 0}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 lg:py-3 rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base font-semibold flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
              Ajouter
            </button>
          </div>
        </div>
      )}

      {/* Section Lien de Paiement - VERSION COMPACTE */}
      {showPaymentLink && (
        <div className="bg-white border-2 border-purple-200 rounded-xl p-3 lg:p-4 space-y-3">
          {/* Header compact */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 lg:w-9 lg:h-9 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
                <Link className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
              </div>
              <span className="text-sm lg:text-base font-bold text-gray-900">Lien de paiement</span>
            </div>
            <button
              type="button"
              onClick={() => setShowPaymentLink(false)}
              className="p-1 lg:p-1.5 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
          </div>

          {/* Info expiration + Client compact */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 lg:p-3 text-xs lg:text-sm space-y-1">
            <div className="flex items-center gap-1.5 text-purple-700">
              <Clock className="w-3 h-3 lg:w-4 lg:h-4" />
              <span>Expire dans {settings?.payment_link_expiry_minutes || 30} min</span>
              <span className="text-purple-600">•</span>
              <Mail className="w-3 h-3 lg:w-4 lg:h-4" />
              <span className="truncate">{clientEmail}</span>
            </div>
          </div>

          {/* Montant rapide */}
          <div>
            <label className="text-xs lg:text-sm font-semibold text-gray-700 mb-1.5 block flex items-center gap-1">
              <Euro className="w-3 h-3 lg:w-4 lg:h-4" />
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
                  className="w-full px-3 py-2 lg:py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-500 text-base lg:text-lg font-bold"
                  placeholder="0.00"
                />
              </div>
              <button
                type="button"
                onClick={() => setPaymentLinkAmount(remainingAmount)}
                className="px-3 py-2 lg:py-3 bg-purple-100 text-purple-700 rounded-lg text-xs lg:text-sm font-semibold hover:bg-purple-200 border border-purple-300 whitespace-nowrap"
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
                  className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium hover:bg-purple-100 border border-purple-200"
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
              className="flex-1 px-3 py-2 lg:py-3 text-gray-600 hover:bg-gray-100 rounded-lg text-sm lg:text-base font-semibold border border-gray-200"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleGenerateLink}
              disabled={paymentLinkAmount <= 0 || !isStripeConfigured}
              className="flex-1 bg-gradient-to-r from-purple-500 to-violet-500 text-white px-3 py-2 lg:py-3 rounded-lg hover:from-purple-600 hover:to-violet-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base font-semibold flex items-center justify-center gap-1.5"
            >
              <Send className="w-4 h-4 lg:w-5 lg:h-5" />
              Générer
            </button>
          </div>
        </div>
      )}

      {/* Liste des transactions - VERSION COMPACTE */}
      {transactions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm lg:text-base font-bold text-gray-800 flex items-center gap-2">
            <CreditCard className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />
            Historique ({transactions.length})
          </h4>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`flex items-center gap-2 p-2 lg:p-3 rounded-lg border ${
                  transaction.status === 'pending'
                    ? 'bg-orange-50 border-orange-200'
                    : transaction.status === 'cancelled'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs lg:text-sm">
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
                    <div className="text-xs lg:text-sm text-gray-500 truncate">{cleanTransactionNote(transaction.note)}</div>
                  )}
                </div>

                <div className="flex gap-1 flex-shrink-0">
                  {transaction.method === 'stripe' && transaction.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => copyPaymentLink(transaction)}
                        className="p-1.5 lg:p-2 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                        title="Copier le lien"
                      >
                        <Copy className="w-4 h-4 lg:w-5 lg:h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => sendPaymentLinkByEmail(transaction)}
                        className="p-1.5 lg:p-2 text-green-500 hover:bg-green-50 rounded transition-colors"
                        title="Envoyer par email"
                      >
                        <Mail className="w-4 h-4 lg:w-5 lg:h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => sendPaymentLinkBySms(transaction)}
                        className="p-1.5 lg:p-2 text-purple-500 hover:bg-purple-50 rounded transition-colors"
                        title="Envoyer par SMS"
                      >
                        <MessageSquare className="w-4 h-4 lg:w-5 lg:h-5" />
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteTransaction(transaction.id)}
                    className="p-1.5 lg:p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4 lg:w-5 lg:h-5" />
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
