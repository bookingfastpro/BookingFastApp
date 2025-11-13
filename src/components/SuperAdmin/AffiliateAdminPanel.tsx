import React, { useState } from 'react';
import { Share2, DollarSign, Users, TrendingUp, Settings, Crown, Gift, Eye, CreditCard, BarChart3 } from 'lucide-react';
import { useAffiliateAdmin } from '../../hooks/useAffiliateAdmin';
import { Button } from '../UI/Button';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { Modal } from '../UI/Modal';

export function AffiliateAdminPanel() {
  const { affiliates, referrals, commissions, settings, stats, loading, error, updateSettings, payCommission } = useAffiliateAdmin();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    commission_percentage: 10,
    extended_trial_days: 15,
    minimum_payout_amount: 50,
    is_active: true
  });
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (settings) {
      setSettingsForm({
        commission_percentage: settings.commission_percentage,
        extended_trial_days: settings.extended_trial_days,
        minimum_payout_amount: settings.minimum_payout_amount,
        is_active: settings.is_active
      });
    }
  }, [settings]);

  const handleUpdateSettings = async () => {
    setSaving(true);
    try {
      await updateSettings(settingsForm);
      setShowSettingsModal(false);
      alert('Paramètres mis à jour avec succès !');
    } catch (error) {
      alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePayCommission = async (commissionId: string) => {
    if (window.confirm('Marquer cette commission comme payée ?')) {
      try {
        await payCommission(commissionId);
        alert('Commission marquée comme payée !');
      } catch (error) {
        alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center p-8 bg-red-50 rounded-2xl border border-red-200">
          <Share2 className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-800 mb-2">Erreur</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header avec actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Share2 className="w-8 h-8 text-purple-600" />
              Gestion des Affiliations
            </h2>
            <p className="text-gray-600 mt-1">Administration du programme d'affiliation</p>
          </div>

          <Button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-2"
          >
            <Settings className="w-5 h-5" />
            Paramètres
          </Button>
        </div>

        {/* Statistiques globales */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8" />
                <TrendingUp className="w-5 h-5 text-blue-200" />
              </div>
              <div className="text-3xl font-bold mb-2">{stats.totalReferrals}</div>
              <div className="text-blue-100 text-sm">Total parrainages</div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <Gift className="w-8 h-8" />
                <TrendingUp className="w-5 h-5 text-green-200" />
              </div>
              <div className="text-3xl font-bold mb-2">{stats.successfulConversions}</div>
              <div className="text-green-100 text-sm">Conversions réussies</div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="w-8 h-8" />
                <TrendingUp className="w-5 h-5 text-purple-200" />
              </div>
              <div className="text-3xl font-bold mb-2">{stats.conversionRate.toFixed(1)}%</div>
              <div className="text-purple-100 text-sm">Taux de conversion</div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-8 h-8" />
                <TrendingUp className="w-5 h-5 text-orange-200" />
              </div>
              <div className="text-3xl font-bold mb-2">{stats.totalCommissions.toFixed(0)}€</div>
              <div className="text-orange-100 text-sm">Commissions totales</div>
            </div>
          </div>
        )}

        {/* Top affiliés */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Crown className="w-6 h-6 text-yellow-600" />
            Top Affiliés
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Affilié</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Code</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Parrainages</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Conversions</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Commissions</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {affiliates.slice(0, 10).map((affiliate, index) => (
                  <tr key={affiliate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {affiliate.user_id.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="text-sm text-gray-900">ID: {affiliate.user_id.slice(0, 8)}...</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {affiliate.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{affiliate.total_referrals || 0}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {affiliate.successful_conversions || 0}
                        <span className="text-xs text-gray-500 ml-1">
                          ({(affiliate.total_referrals || 0) > 0 ? (((affiliate.successful_conversions || 0) / (affiliate.total_referrals || 1)) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-green-600">{(affiliate.total_earnings || 0).toFixed(2)}€</div>
                      <div className="text-xs text-gray-500">
                        En attente: {(affiliate.pending_commissions || 0).toFixed(2)}€
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        affiliate.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {affiliate.status === 'active' ? '✅ Actif' : '❌ Inactif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {affiliates.length === 0 && (
            <div className="text-center py-12">
              <Share2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun affilié</h4>
              <p className="text-gray-500">Les affiliés apparaîtront ici une fois qu'ils auront activé leur programme</p>
            </div>
          )}
        </div>

        {/* Commissions à payer */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-orange-600" />
            Commissions à Payer ({commissions.filter(c => c.status === 'pending').length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Affilié</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Client parrainé</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Mois</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Montant</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {commissions.filter(c => c.status === 'pending').map((commission, index) => (
                  <tr key={commission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {affiliates.find(a => a.id === commission.affiliate_id)?.code}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {commission.referral?.referred_user?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{commission.commission_month}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-green-600">{commission.amount.toFixed(2)}€</div>
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        onClick={() => handlePayCommission(commission.id)}
                        size="sm"
                        variant="success"
                      >
                        Marquer comme payé
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {commissions.filter(c => c.status === 'pending').length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Aucune commission en attente</h4>
              <p className="text-gray-500">Les commissions à payer apparaîtront ici</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal paramètres */}
      {showSettingsModal && (
        <Modal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          title="Paramètres d'Affiliation"
          size="md"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commission (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={settingsForm.commission_percentage}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, commission_percentage: parseInt(e.target.value) || 10 }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Essai étendu (jours)
                </label>
                <input
                  type="number"
                  min="7"
                  max="30"
                  value={settingsForm.extended_trial_days}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, extended_trial_days: parseInt(e.target.value) || 15 }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum pour paiement (€)
              </label>
              <input
                type="number"
                min="10"
                step="0.01"
                value={settingsForm.minimum_payout_amount}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, minimum_payout_amount: parseFloat(e.target.value) || 50 }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={settingsForm.is_active}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Programme d'affiliation actif
              </label>
            </div>

            {/* Aperçu des changements */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
              <h4 className="font-bold text-purple-800 mb-2">Aperçu des paramètres</h4>
              <div className="text-purple-700 text-sm space-y-1">
                <div>• Commission: <strong>{settingsForm.commission_percentage}%</strong> par mois</div>
                <div>• Essai étendu: <strong>{settingsForm.extended_trial_days} jours</strong> au lieu de 7</div>
                <div>• Paiement minimum: <strong>{settingsForm.minimum_payout_amount}€</strong></div>
                <div>• Statut: <strong>{settingsForm.is_active ? 'Actif' : 'Inactif'}</strong></div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="secondary"
                onClick={() => setShowSettingsModal(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleUpdateSettings}
                loading={saving}
                className="flex-1"
              >
                Sauvegarder
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
