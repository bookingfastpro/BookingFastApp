import React, { useState } from 'react';
import { Settings, Building2, Palette, Clock, Euro, Mail, CreditCard, Users, Shield, Crown, Key, Sparkles, BarChart3, ExternalLink, UserPlus, Package, ArrowLeft } from 'lucide-react';
import { Share2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTeam } from '../../hooks/useTeam';
import { BusinessSettingsForm } from './BusinessSettingsForm';
import { SubscriptionStatus } from './SubscriptionStatus';
import { AffiliateManagement } from './AffiliateManagement';
import { IframeSettings } from './IframeSettings';
import { TeamManagement } from './TeamManagement';
import { PluginsPage } from '../Plugins/PluginsPage';
import { SuperAdminPanel } from '../SuperAdmin/SuperAdminPanel';
import { supabase } from '../../lib/supabase';

export function AdminPage() {
  const { user } = useAuth();
  const { isOwner } = useTeam();
  const [activeTab, setActiveTab] = useState<'settings' | 'subscription' | 'affiliate' | 'iframe' | 'team' | 'plugins' | 'superadmin'>('settings');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Vérifier si l'utilisateur est super admin
  React.useEffect(() => {
    const checkSuperAdmin = async () => {
      setCheckingAdmin(true);
      if (!user || !supabase) {
        console.log('🔍 Pas d\'utilisateur ou Supabase non configuré - pas de super admin');
        setIsSuperAdmin(false);
        setCheckingAdmin(false);
        return;
      }
      
      try {
        console.log('🔍 Vérification statut super admin pour:', user.email);
        const { data, error } = await supabase
          .from('users')
          .select('is_super_admin')
          .eq('id', user.id)
          .maybeSingle();
        
        console.log('📊 Résultat requête super admin:', { data, error });
        
        if (!error && data) {
          const isAdmin = data.is_super_admin === true;
          console.log('✅ Statut super admin déterminé:', isAdmin);
          setIsSuperAdmin(isAdmin);
        } else {
          console.log('❌ Erreur ou pas de données:', error);
          setIsSuperAdmin(data?.is_super_admin === true);
        }
      } catch (error) {
        console.error('❌ Erreur vérification super admin:', error);
        setIsSuperAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };
    
    checkSuperAdmin();
  }, [user]);

  const tabs = [
    { 
      id: 'settings', 
      label: 'Paramètres', 
      icon: Settings, 
      description: 'Configuration générale'
    },
    { 
      id: 'subscription', 
      label: 'Abonnement', 
      icon: Crown, 
      description: 'Statut et codes secrets'
    },
    { 
      id: 'affiliate', 
      label: 'Affiliation', 
      icon: Share2, 
      description: 'Programme de parrainage'
    },
    { 
      id: 'iframe', 
      label: 'Iframe', 
      icon: ExternalLink, 
      description: 'Lien de réservation'
    },
  ];

  // Ajouter l'onglet Plugins seulement pour les propriétaires
  if (isOwner) {
    tabs.push({
      id: 'plugins', 
      label: 'Plugins', 
      icon: Package, 
      description: 'Extensions et fonctionnalités'
    });
  }

  // Ajouter l'onglet Équipe seulement pour les propriétaires
  if (isOwner) {
    tabs.push({
      id: 'team', 
      label: 'Équipe', 
      icon: UserPlus, 
      description: 'Gestion des membres'
    });
  }

  // Ajouter l'onglet Super Admin si l'utilisateur est super admin
  if (isSuperAdmin && !checkingAdmin) {
    console.log('👑 Ajout de l\'onglet Super Admin');
    tabs.push({
      id: 'superadmin',
      label: 'Super Admin',
      icon: Crown,
      description: 'Administration globale'
    });
  }

  console.log('📋 Onglets disponibles:', tabs.map(t => t.label));
  console.log('👑 Super admin status:', { isSuperAdmin, checkingAdmin, userEmail: user?.email });

  const renderContent = () => {
    switch (activeTab) {
      case 'settings':
        return <BusinessSettingsForm />;
      case 'subscription':
        return <SubscriptionStatus />;
      case 'plugins':
        return isOwner ? <PluginsPage /> : <BusinessSettingsForm />;
      case 'affiliate':
        return <AffiliateManagement />;
      case 'iframe':
        return <IframeSettings />;
      case 'team':
        return <TeamManagement />;
      case 'superadmin':
        return <SuperAdminPanel />;
      default:
        return <BusinessSettingsForm />;
    }
  };

  return (
    <div className="main-content-safe overflow-auto bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 mobile-optimized">
      {/* Header */}
      <div className="p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          {activeTab === 'superadmin' && (
            <button
              onClick={() => setActiveTab('settings')}
              className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {activeTab === 'superadmin' ? 'Super Administration' : 'Administration'}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {activeTab === 'superadmin' 
                ? 'Gestion complète de la plateforme' 
                : 'Gérez les paramètres de votre compte'}
            </p>
          </div>
        </div>
      
      {/* Navigation - Masquer si on est en mode Super Admin */}
      {activeTab !== 'superadmin' && (
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-2 bg-white rounded-2xl p-2 shadow-lg w-full sm:w-fit overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 sm:flex-none px-3 sm:px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center sm:justify-start gap-2 text-sm sm:text-base ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <div className="text-left hidden sm:block">
                  <div className="font-bold">{tab.label}</div>
                  <div className="text-xs opacity-75 hidden lg:block">{tab.description}</div>
                </div>
                <div className="sm:hidden font-bold text-xs">{tab.label}</div>
                {tab.id === 'superadmin' && (
                  <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      </div>
      
      {/* Content */}
      <div className={activeTab === 'superadmin' ? '' : 'bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mx-4 sm:mx-6 mb-6'}>
        {renderContent()}
      </div>
    </div>
  );
}
