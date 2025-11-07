import React, { useState } from 'react';
import { Shield, Users, CreditCard, Key, BarChart3, Settings, Crown, Package } from 'lucide-react';
import { Share2 } from 'lucide-react';
import { UserManagement } from './UserManagement';
import { SubscriptionManagement } from './SubscriptionManagement';
import { AccessCodeManagement } from './AccessCodeManagement';
import { AdminStats } from './AdminStats';
import { AffiliateAdminPanel } from './AffiliateAdminPanel';
import { VersionManagement } from './VersionManagement';
import { PluginManagement } from './PluginManagement';

type AdminTab = 'stats' | 'users' | 'subscriptions' | 'codes' | 'affiliates' | 'versions' | 'plugins';

export function SuperAdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');

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
    <div className="space-y-6">
      {/* Header avec badge Super Admin */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl sm:text-3xl font-bold">Panel Super Admin</h2>
              <span className="bg-yellow-400 text-purple-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <Shield className="w-3 h-3" />
                ADMIN
              </span>
            </div>
            <p className="text-white/90 text-base sm:text-lg">Gestion complète de la plateforme BookingPro</p>
          </div>
        </div>

        {/* Navigation Super Admin */}
        <div className="flex gap-2 bg-white/10 backdrop-blur-sm rounded-2xl p-2 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex-shrink-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 rounded-xl font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-white text-purple-600 shadow-lg transform scale-105'
                  : 'text-white/80 hover:bg-white/20 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <div className="text-left hidden lg:block">
                <div className="font-bold text-sm">{tab.label}</div>
                <div className="text-xs opacity-75">{tab.description}</div>
              </div>
              <div className="lg:hidden font-bold text-xs sm:text-sm">{tab.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
        {renderContent()}
      </div>
    </div>
  );
}
