import React, { useState, useEffect } from 'react';
import { Settings, Save, Building2, CreditCard, Mail, Clock, Users, Palette, FileText } from 'lucide-react';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { Button } from '../UI/Button';

export function SettingsPage() {
  const { settings, loading: settingsLoading, updateSettings } = useBusinessSettings();
  const { companyInfo, loading: companyLoading, updateCompanyInfo } = useCompanyInfo();
  
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({
    // Paramètres généraux
    business_name: '',
    primary_color: '#3B82F6',
    secondary_color: '#8B5CF6',
    buffer_minutes: 15,
    minimum_booking_delay_hours: 24,
    timezone: 'Europe/Paris',
    multiply_deposit_by_services: false,
    
    // Paramètres acompte
    default_deposit_percentage: 30,
    deposit_type: 'percentage' as 'percentage' | 'fixed',
    deposit_fixed_amount: 20,
    
    // Paramètres email
    email_notifications: true,
    brevo_enabled: false,
    brevo_api_key: '',
    brevo_sender_email: '',
    brevo_sender_name: '',
    
    // Paramètres Stripe
    stripe_enabled: false,
    stripe_public_key: '',
    stripe_secret_key: '',
    payment_link_expiry_minutes: 30,
    
    // Informations entreprise
    company_name: '',
    legal_form: '',
    siret: '',
    tva_number: '',
    address: '',
    postal_code: '',
    city: '',
    country: 'France',
    phone: '',
    email: '',
    website: '',
    bank_name: '',
    iban: '',
    bic: ''
  });

  useEffect(() => {
    if (settings) {
      setFormData(prev => ({
        ...prev,
        business_name: settings.business_name,
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        buffer_minutes: settings.buffer_minutes,
        minimum_booking_delay_hours: settings.minimum_booking_delay_hours,
        timezone: settings.timezone,
        multiply_deposit_by_services: settings.multiply_deposit_by_services,
        default_deposit_percentage: settings.default_deposit_percentage,
        deposit_type: settings.deposit_type,
        deposit_fixed_amount: settings.deposit_fixed_amount,
        email_notifications: settings.email_notifications,
        brevo_enabled: settings.brevo_enabled,
        brevo_api_key: settings.brevo_api_key,
        brevo_sender_email: settings.brevo_sender_email,
        brevo_sender_name: settings.brevo_sender_name,
        stripe_enabled: settings.stripe_enabled,
        stripe_public_key: settings.stripe_public_key,
        stripe_secret_key: settings.stripe_secret_key,
        payment_link_expiry_minutes: settings.payment_link_expiry_minutes
      }));
    }
  }, [settings]);

  useEffect(() => {
    if (companyInfo) {
      setFormData(prev => ({
        ...prev,
        company_name: companyInfo.company_name,
        legal_form: companyInfo.legal_form || '',
        siret: companyInfo.siret || '',
        tva_number: companyInfo.tva_number || '',
        address: companyInfo.address || '',
        postal_code: companyInfo.postal_code || '',
        city: companyInfo.city || '',
        country: companyInfo.country,
        phone: companyInfo.phone || '',
        email: companyInfo.email || '',
        website: companyInfo.website || '',
        bank_name: companyInfo.bank_name || '',
        iban: companyInfo.iban || '',
        bic: companyInfo.bic || ''
      }));
    }
  }, [companyInfo]);

  const handleSaveGeneral = async () => {
    try {
      await updateSettings({
        business_name: formData.business_name,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        buffer_minutes: formData.buffer_minutes,
        minimum_booking_delay_hours: formData.minimum_booking_delay_hours,
        timezone: formData.timezone,
        multiply_deposit_by_services: formData.multiply_deposit_by_services,
        default_deposit_percentage: formData.default_deposit_percentage,
        deposit_type: formData.deposit_type,
        deposit_fixed_amount: formData.deposit_fixed_amount
      });
      alert('Paramètres généraux sauvegardés !');
    } catch (error) {
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleSaveCompany = async () => {
    try {
      await updateCompanyInfo({
        company_name: formData.company_name,
        legal_form: formData.legal_form,
        siret: formData.siret,
        tva_number: formData.tva_number,
        address: formData.address,
        postal_code: formData.postal_code,
        city: formData.city,
        country: formData.country,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        bank_name: formData.bank_name,
        iban: formData.iban,
        bic: formData.bic
      });
      alert('Informations entreprise sauvegardées !');
    } catch (error) {
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleSaveEmail = async () => {
    try {
      await updateSettings({
        email_notifications: formData.email_notifications,
        brevo_enabled: formData.brevo_enabled,
        brevo_api_key: formData.brevo_api_key,
        brevo_sender_email: formData.brevo_sender_email,
        brevo_sender_name: formData.brevo_sender_name
      });
      alert('Paramètres email sauvegardés !');
    } catch (error) {
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleSavePayment = async () => {
    try {
      await updateSettings({
        stripe_enabled: formData.stripe_enabled,
        stripe_public_key: formData.stripe_public_key,
        stripe_secret_key: formData.stripe_secret_key,
        payment_link_expiry_minutes: formData.payment_link_expiry_minutes
      });
      alert('Paramètres paiement sauvegardés !');
    } catch (error) {
      alert('Erreur lors de la sauvegarde');
    }
  };

  if (settingsLoading || companyLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'company', label: 'Entreprise', icon: Building2 },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'payment', label: 'Paiement', icon: CreditCard }
  ];

  return (
    <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 mobile-optimized">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Paramètres
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Configurez votre application
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg mb-6 overflow-x-auto">
        <div className="flex border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu des tabs */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Paramètres généraux</h2>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Nom de l'entreprise
              </label>
              <input
                type="text"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Couleur primaire
                </label>
                <input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="w-full h-12 border border-gray-300 rounded-xl cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Couleur secondaire
                </label>
                <input
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  className="w-full h-12 border border-gray-300 rounded-xl cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Type d'acompte
              </label>
              <select
                value={formData.deposit_type}
                onChange={(e) => setFormData({ ...formData, deposit_type: e.target.value as 'percentage' | 'fixed' })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
              >
                <option value="percentage">Pourcentage</option>
                <option value="fixed">Montant fixe</option>
              </select>
            </div>

            {formData.deposit_type === 'percentage' ? (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Pourcentage d'acompte par défaut (%)
                </label>
                <input
                  type="number"
                  value={formData.default_deposit_percentage}
                  onChange={(e) => setFormData({ ...formData, default_deposit_percentage: parseInt(e.target.value) })}
                  min="0"
                  max="100"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Montant d'acompte fixe (€)
                </label>
                <input
                  type="number"
                  value={formData.deposit_fixed_amount}
                  onChange={(e) => setFormData({ ...formData, deposit_fixed_amount: parseFloat(e.target.value) })}
                  min="0"
                  step="0.01"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
              <input
                type="checkbox"
                id="multiply_deposit"
                checked={formData.multiply_deposit_by_services}
                onChange={(e) => setFormData({ ...formData, multiply_deposit_by_services: e.target.checked })}
                className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
              />
              <label htmlFor="multiply_deposit" className="text-sm font-bold text-gray-700 cursor-pointer">
                Multiplier l'acompte par la quantité sur l'iframe
              </label>
            </div>

            <Button onClick={handleSaveGeneral} className="w-full">
              <Save className="w-5 h-5 mr-2" />
              Sauvegarder les paramètres généraux
            </Button>
          </div>
        )}

        {activeTab === 'company' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Informations entreprise</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nom de l'entreprise *
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Forme juridique
                </label>
                <input
                  type="text"
                  value={formData.legal_form}
                  onChange={(e) => setFormData({ ...formData, legal_form: e.target.value })}
                  placeholder="SARL, SAS, Auto-entrepreneur..."
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  SIRET
                </label>
                <input
                  type="text"
                  value={formData.siret}
                  onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  N° TVA Intracommunautaire
                </label>
                <input
                  type="text"
                  value={formData.tva_number}
                  onChange={(e) => setFormData({ ...formData, tva_number: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Adresse
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Code postal
                </label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Ville
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Pays
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Site web
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Coordonnées bancaires</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Nom de la banque
                  </label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    IBAN
                  </label>
                  <input
                    type="text"
                    value={formData.iban}
                    onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    BIC
                  </label>
                  <input
                    type="text"
                    value={formData.bic}
                    onChange={(e) => setFormData({ ...formData, bic: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleSaveCompany} className="w-full">
              <Save className="w-5 h-5 mr-2" />
              Sauvegarder les informations entreprise
            </Button>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Paramètres email</h2>
            
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <input
                type="checkbox"
                id="email_notifications"
                checked={formData.email_notifications}
                onChange={(e) => setFormData({ ...formData, email_notifications: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="email_notifications" className="text-sm font-bold text-gray-700 cursor-pointer">
                Activer les notifications email
              </label>
            </div>

            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
              <input
                type="checkbox"
                id="brevo_enabled"
                checked={formData.brevo_enabled}
                onChange={(e) => setFormData({ ...formData, brevo_enabled: e.target.checked })}
                className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
              />
              <label htmlFor="brevo_enabled" className="text-sm font-bold text-gray-700 cursor-pointer">
                Activer Brevo (anciennement Sendinblue)
              </label>
            </div>

            {formData.brevo_enabled && (
              <div className="space-y-4 pl-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Clé API Brevo
                  </label>
                  <input
                    type="password"
                    value={formData.brevo_api_key}
                    onChange={(e) => setFormData({ ...formData, brevo_api_key: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Email expéditeur
                  </label>
                  <input
                    type="email"
                    value={formData.brevo_sender_email}
                    onChange={(e) => setFormData({ ...formData, brevo_sender_email: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Nom expéditeur
                  </label>
                  <input
                    type="text"
                    value={formData.brevo_sender_name}
                    onChange={(e) => setFormData({ ...formData, brevo_sender_name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}

            <Button onClick={handleSaveEmail} className="w-full">
              <Save className="w-5 h-5 mr-2" />
              Sauvegarder les paramètres email
            </Button>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Paramètres paiement</h2>
            
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
              <input
                type="checkbox"
                id="stripe_enabled"
                checked={formData.stripe_enabled}
                onChange={(e) => setFormData({ ...formData, stripe_enabled: e.target.checked })}
                className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
              />
              <label htmlFor="stripe_enabled" className="text-sm font-bold text-gray-700 cursor-pointer">
                Activer les paiements Stripe
              </label>
            </div>

            {formData.stripe_enabled && (
              <div className="space-y-4 pl-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Clé publique Stripe
                  </label>
                  <input
                    type="text"
                    value={formData.stripe_public_key}
                    onChange={(e) => setFormData({ ...formData, stripe_public_key: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Clé secrète Stripe
                  </label>
                  <input
                    type="password"
                    value={formData.stripe_secret_key}
                    onChange={(e) => setFormData({ ...formData, stripe_secret_key: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Durée de validité des liens de paiement (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.payment_link_expiry_minutes}
                    onChange={(e) => setFormData({ ...formData, payment_link_expiry_minutes: parseInt(e.target.value) })}
                    min="5"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}

            <Button onClick={handleSavePayment} className="w-full">
              <Save className="w-5 h-5 mr-2" />
              Sauvegarder les paramètres paiement
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
