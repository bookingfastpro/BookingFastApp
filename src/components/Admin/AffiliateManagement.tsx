import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useAffiliate } from '../../hooks/useAffiliate';
import { Users, DollarSign, TrendingUp, Copy, Check, Settings } from 'lucide-react';

interface AffiliateStats {
  totalReferrals: number;
  activeSubscriptions: number;
  totalEarnings: number;
  pendingEarnings: number;
}

export function AffiliateManagement() {
  const { user, isAuthenticated } = useAuth();
  const { affiliateData, loading: affiliateLoading, createAffiliateAccount, updateCommissionRate, isAffiliate } = useAffiliate();
  const [stats, setStats] = useState<AffiliateStats>({
    totalReferrals: 0,
    activeSubscriptions: 0,
    totalEarnings: 0,
    pendingEarnings: 0
  });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [newCommissionRate, setNewCommissionRate] = useState<number>(20);

  useEffect(() => {
    if (!supabase || !user || !isAffiliate) {
      setLoading(false);
      return;
    }

    async function fetchStats() {
      try {
        const { data: referrals } = await supabase!
          .from('affiliate_referrals')
          .select('*')
          .eq('affiliate_id', affiliateData!.id);

        const activeReferrals = referrals?.filter(r => r.status === 'active') || [];

        setStats({
          totalReferrals: referrals?.length || 0,
          activeSubscriptions: activeReferrals.length,
          totalEarnings: affiliateData?.total_earnings || 0,
          pendingEarnings: activeReferrals.reduce((sum, r) => sum + (r.commission_amount || 0), 0)
        });
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user, isAffiliate, affiliateData]);

  useEffect(() => {
    if (affiliateData) {
      setNewCommissionRate(affiliateData.commission_rate);
    }
  }, [affiliateData]);

  const handleCreateAccount = async () => {
    if (!isAuthenticated) {
      alert('Vous devez être connecté pour créer un compte affilié');
      return;
    }

    try {
      await createAffiliateAccount();
      alert('Compte affilié créé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la création du compte affilié:', error);
      alert('Erreur lors de la création du compte affilié. Veuillez réessayer.');
    }
  };

  const handleUpdateCommissionRate = async () => {
    try {
      await updateCommissionRate(newCommissionRate);
      alert('Taux de commission mis à jour avec succès !');
      setShowSettings(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du taux:', error);
      alert('Erreur lors de la mise à jour du taux de commission.');
    }
  };

  const copyAffiliateLink = () => {
    const link = `${window.location.origin}?ref=${affiliateData?.affiliate_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!supabase) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">Supabase non configuré</p>
      </div>
    );
  }

  if (affiliateLoading || loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  if (!isAffiliate) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Programme d'Affiliation</h2>
        <p className="text-gray-600 mb-4">
          Rejoignez notre programme d'affiliation et gagnez 20% de commission sur chaque vente référée.
        </p>
        <button
          onClick={handleCreateAccount}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Devenir Affilié
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Tableau de Bord Affilié</h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Paramètres"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {showSettings && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">Paramètres de Commission</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taux de Commission (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={newCommissionRate}
                  onChange={(e) => setNewCommissionRate(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <button
                onClick={handleUpdateCommissionRate}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Mettre à jour
              </button>
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Votre Lien d'Affiliation
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={`${window.location.origin}?ref=${affiliateData?.affiliate_code || ''}`}
              readOnly
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
            <button
              onClick={copyAffiliateLink}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copié!' : 'Copier'}
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Taux de commission actuel: <span className="font-semibold">{affiliateData?.commission_rate}%</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Références Totales</span>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalReferrals}</p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Abonnements Actifs</span>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Gains Totaux</span>
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{(stats.totalEarnings || 0).toFixed(2)}€</p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Gains en Attente</span>
              <DollarSign className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{(stats.pendingEarnings || 0).toFixed(2)}€</p>
          </div>
        </div>
      </div>
    </div>
  );
}
