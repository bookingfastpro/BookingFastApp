import React, { useState } from 'react';
import { CreditCard, DollarSign, Calendar, Users, TrendingUp, ExternalLink, Plus, CreditCard as Edit, Trash2 } from 'lucide-react';
import { useAdmin } from '../../hooks/useAdmin';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { LoadingSpinner } from '../UI/LoadingSpinner';

export function SubscriptionManagement() {
  const { users, subscriptions, subscriptionPlans, loading, createSubscription, cancelSubscription } = useAdmin();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [saving, setSaving] = useState(false);

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  const trialUsers = users.filter(u => u.subscription_status === 'trial');
  const activeUsers = users.filter(u => u.subscription_status === 'active');
  const expiredUsers = users.filter(u => u.subscription_status === 'expired');

  const monthlyRevenue = activeSubscriptions.reduce((sum, sub) => {
    const plan = subscriptionPlans.find(p => p.id === sub.plan_id);
    return sum + (plan?.price_monthly || 0);
  }, 0);

  const yearlyRevenue = monthlyRevenue * 12;
  const conversionRate = users.length > 0 ? (activeUsers.length / users.length) * 100 : 0;

  const handleCreateSubscription = async () => {
    if (!selectedUserId || !selectedPlanId) {
      alert('Veuillez sélectionner un utilisateur et un plan');
      return;
    }

    setSaving(true);
    try {
      await createSubscription(selectedUserId, selectedPlanId);
      setShowCreateModal(false);
      setSelectedUserId('');
      setSelectedPlanId('');
      alert('Abonnement créé avec succès !');
    } catch (error) {
      alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler cet abonnement ?')) {
      try {
        await cancelSubscription(subscriptionId);
        alert('Abonnement annulé avec succès !');
      } catch (error) {
        alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-green-600" />
              Gestion des Abonnements
            </h2>
            <p className="text-gray-600 mt-1">Suivi des revenus et abonnements</p>
          </div>

          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouvel Abonnement
          </Button>
        </div>

        {/* Statistiques financières */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8" />
              <TrendingUp className="w-5 h-5 text-green-200" />
            </div>
            <div className="text-3xl font-bold mb-2">{monthlyRevenue.toFixed(2)}€</div>
            <div className="text-green-100 text-sm">Revenus mensuels</div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8" />
              <TrendingUp className="w-5 h-5 text-blue-200" />
            </div>
            <div className="text-3xl font-bold mb-2">{activeUsers.length}</div>
            <div className="text-blue-100 text-sm">Abonnés actifs</div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8" />
              <TrendingUp className="w-5 h-5 text-orange-200" />
            </div>
            <div className="text-3xl font-bold mb-2">{trialUsers.length}</div>
            <div className="text-orange-100 text-sm">Essais en cours</div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div className="text-3xl font-bold mb-2">{conversionRate.toFixed(1)}%</div>
            <div className="text-purple-100 text-sm">Taux de conversion</div>
          </div>
        </div>

        {/* Plans d'abonnement */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-green-600" />
            Plans d'Abonnement
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subscriptionPlans.map((plan, index) => (
              <div
                key={plan.id}
                className="border-2 border-gray-200 rounded-2xl p-6 hover:border-blue-400 transition-all duration-300 transform hover:scale-[1.02]"
              >
                <div className="text-center mb-6">
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h4>
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {plan.price_yearly ? (plan.price_yearly / 12).toFixed(2) : plan.price_monthly}€
                  </div>
                  <div className="text-gray-600">par mois</div>
                  {plan.price_yearly && (
                    <div className="text-sm text-green-600 font-medium mt-1">
                      Ou {plan.price_yearly}€/an (économie 17%)
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  {plan.features?.map((feature: string, featureIndex: number) => (
                    <div key={featureIndex} className="flex items-center gap-2 text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-800">
                    <strong>Abonnés actuels:</strong> {activeSubscriptions.filter(s => s.plan_id === plan.id).length}
                  </div>
                  <div className="text-sm text-blue-600">
                    Revenus: {(activeSubscriptions.filter(s => s.plan_id === plan.id).length * plan.price_monthly).toFixed(2)}€/mois
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Liste des abonnements actifs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-6 h-6 text-purple-600" />
              Abonnements Actifs ({activeSubscriptions.length})
            </h3>
          </div>

          {activeSubscriptions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Utilisateur</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Plan</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Statut</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Période</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeSubscriptions.map((subscription, index) => (
                    <tr
                      key={subscription.id}
                      className="hover:bg-gray-50 transition-colors animate-fadeIn"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {subscription.user?.email?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {subscription.user?.full_name || subscription.user?.email}
                            </div>
                            <div className="text-sm text-gray-600">{subscription.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{subscription.plan?.name}</div>
                        <div className="text-sm text-gray-600">
                          {subscription.plan?.price_monthly}€/mois
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                          ✅ Actif
                        </span>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {subscription.current_period_start && new Date(subscription.current_period_start).toLocaleDateString('fr-FR')}
                          {' - '}
                          {subscription.current_period_end && new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleCancelSubscription(subscription.id)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          title="Annuler l'abonnement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun abonnement actif</h4>
              <p className="text-gray-500">Les abonnements apparaîtront ici</p>
            </div>
          )}
        </div>

        {/* Utilisateurs en essai */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="w-6 h-6 text-orange-600" />
              Utilisateurs en Essai Gratuit ({trialUsers.length})
            </h3>
          </div>

          {trialUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Utilisateur</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Début essai</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Fin essai</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Jours restants</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {trialUsers.map((user, index) => {
                    const daysLeft = user.trial_ends_at 
                      ? Math.max(0, Math.ceil((new Date(user.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
                      : 0;
                    const isExpiringSoon = daysLeft <= 2;
                    
                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50 transition-colors animate-fadeIn"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                              {user.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{user.full_name || user.email}</div>
                              <div className="text-sm text-gray-600">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {user.trial_started_at && new Date(user.trial_started_at).toLocaleDateString('fr-FR')}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {user.trial_ends_at && new Date(user.trial_ends_at).toLocaleDateString('fr-FR')}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                            isExpiringSoon 
                              ? 'bg-red-100 text-red-700 animate-pulse' 
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {daysLeft} jour{daysLeft > 1 ? 's' : ''}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setSelectedPlanId('monthly');
                              setShowCreateModal(true);
                            }}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            title="Créer un abonnement"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun essai en cours</h4>
              <p className="text-gray-500">Les nouveaux utilisateurs apparaîtront ici</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de création d'abonnement */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Créer un Abonnement"
          size="md"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Utilisateur
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300"
              >
                <option value="">Sélectionner un utilisateur</option>
                {users.filter(u => u.subscription_status !== 'active').map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.email} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan d'abonnement
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300"
              >
                <option value="">Sélectionner un plan</option>
                {subscriptionPlans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - {plan.price_monthly}€/mois
                  </option>
                ))}
              </select>
            </div>

            {/* Aperçu */}
            {selectedUserId && selectedPlanId && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                <h4 className="font-bold text-green-800 mb-2">Aperçu de l'abonnement</h4>
                <div className="text-green-700 text-sm space-y-1">
                  <div>• Utilisateur: <strong>{users.find(u => u.id === selectedUserId)?.email}</strong></div>
                  <div>• Plan: <strong>{subscriptionPlans.find(p => p.id === selectedPlanId)?.name}</strong></div>
                  <div>• Prix: <strong>{subscriptionPlans.find(p => p.id === selectedPlanId)?.price_monthly}€/mois</strong></div>
                  <div>• Début: <strong>Immédiat</strong></div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateSubscription}
                loading={saving}
                disabled={!selectedUserId || !selectedPlanId}
                variant="success"
                className="flex-1"
              >
                Créer l'Abonnement
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
