import React, { useState, useEffect } from 'react';
import { Shield, Users, CreditCard, Key, BarChart3, Settings, Crown, Zap, Package } from 'lucide-react';
import { Share2 } from 'lucide-react';
import { useAdmin } from '../../hooks/useAdmin';
import { UserManagement } from './UserManagement';
import { SubscriptionManagement } from './SubscriptionManagement';
import { AccessCodeManagement } from './AccessCodeManagement';
import { AdminStats } from './AdminStats';
import { AffiliateAdminPanel } from './AffiliateAdminPanel';
import { VersionManagement } from './VersionManagement';
import { PluginManagement } from './PluginManagement';
import { LoadingSpinner } from '../UI/LoadingSpinner';

type AdminTab = 'stats' | 'users' | 'subscriptions' | 'codes' | 'affiliates' | 'versions' | 'plugins';

export function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const { loading, error, isSuperAdmin } = useAdmin();

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        const authorized = await isSuperAdmin();
        setIsAuthorized(authorized);
      } catch (err) {
        setIsAuthorized(false);
      }
    };
    
    checkAuthorization();
  }, []);

  if (loading || isAuthorized === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Vérification des autorisations...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl max-w-md">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Accès refusé</h1>
          <p className="text-gray-600 text-lg mb-6">
            Vous n'avez pas les droits d'administration nécessaires pour accéder à cette page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'stats', label: 'Statistiques', icon: BarChart3, description: 'Vue d\'ensemble' },
    { id: 'users', label: 'Utilisateurs', icon: Users, description: 'Gestion des comptes' },
    { id: 'subscriptions', label: 'Abonnements', icon: CreditCard, description: 'Gestion Stripe' },
    { id: 'codes', label: 'Codes d\'accès', icon: Key, description: 'Codes secrets' },
    { id: 'plugins', label: 'Plugins', icon: Package, description: 'Gestion des plugins' },
    { id: 'affiliates', label: 'Affiliations', icon: Share2, description: 'Programme de parrainage' },
    { id: 'versions', label: 'Versions', icon: Settings, description: 'Gestion des versions' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'stats':
        return <AdminStats />;
      case 'users':
        return <UserManagement />;
      case 'subscriptions':
        return <SubscriptionManagement />;
      case 'codes':
        return <AccessCodeManagement />;
      case 'plugins':
        return <PluginManagement />;
      case 'affiliates':
        return <AffiliateAdminPanel />;
      case 'versions':
        return <VersionManagement />;
      default:
        return <AdminStats />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50">
      {/* Header Super Admin */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white p-6 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Super Administration</h1>
              <p className="text-white/80 text-lg">Gestion complète de la plateforme BookingPro</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-2 bg-white/10 backdrop-blur-sm rounded-2xl p-2 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex-shrink-0 flex items-center gap-3 px-6 py-4 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-white text-purple-600 shadow-lg transform scale-105'
                    : 'text-white/80 hover:bg-white/20 hover:text-white'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <div className="text-left hidden sm:block">
                  <div className="font-bold">{tab.label}</div>
                  <div className="text-xs opacity-75">{tab.description}</div>
                </div>
                <div className="sm:hidden font-bold">{tab.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto p-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <Shield className="w-6 h-6 text-red-600" />
            <span className="text-red-800 font-medium">Erreur: {error}</span>
          </div>
        )}

        {renderContent()}
      </div>
    </div>
  );
}
