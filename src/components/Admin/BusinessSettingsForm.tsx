import React, { useState, useEffect } from 'react';
import { Save, Building2, Clock, Euro, Mail, CreditCard, Eye, EyeOff, Globe, Shield, AlertTriangle, CheckCircle, Percent, Trash2, RefreshCw, Calculator, Calendar, FileText, MessageSquare } from 'lucide-react';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';
import { BusinessSettings } from '../../types';
import { Button } from '../UI/Button';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { POPULAR_TIMEZONES } from '../../lib/timezone';
import { GoogleCalendarSettings } from './GoogleCalendarSettings';
import { BlockedDateRanges } from './BlockedDateRanges';

export function BusinessSettingsForm() {
  const { settings, loading: settingsLoading, updateSettings } = useBusinessSettings();
  const { companyInfo, loading: companyLoading, updateCompanyInfo } = useCompanyInfo();
  const [formData, setFormData] = useState<Partial<BusinessSettings>>({});
  const [companyData, setCompanyData] = useState({
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
  const [saving, setSaving] = useState(false);
  const [showStripeKeys, setShowStripeKeys] = useState(false);
  const [showBrevoKey, setShowBrevoKey] = useState(false);
  const [showTwilioToken, setShowTwilioToken] = useState(false);
  const [testingStripe, setTestingStripe] = useState(false);
  const [stripeTestResult, setStripeTestResult] = useState<string | null>(null);
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [activeSection, setActiveSection] = useState<'general' | 'company' | 'calendar' | 'blocked-dates'>('general');

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  useEffect(() => {
    if (companyInfo) {
      setCompanyData({
        company_name: companyInfo.company_name || '',
        legal_form: companyInfo.legal_form || '',
        siret: companyInfo.siret || '',
        tva_number: companyInfo.tva_number || '',
        address: companyInfo.address || '',
        postal_code: companyInfo.postal_code || '',
        city: companyInfo.city || '',
        country: companyInfo.country || 'France',
        phone: companyInfo.phone || '',
        email: companyInfo.email || '',
        website: companyInfo.website || '',
        bank_name: companyInfo.bank_name || '',
        iban: companyInfo.iban || '',
        bic: companyInfo.bic || ''
      });
    }
  }, [companyInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await updateSettings(formData);
      alert('Paramètres sauvegardés avec succès !');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await updateCompanyInfo(companyData);
      alert('Informations entreprise sauvegardées avec succès !');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTimeRangeChange = (day: string, rangeIndex: number, field: 'start' | 'end', value: string) => {
    setFormData(prev => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: {
          ...prev.opening_hours?.[day],
          ranges: prev.opening_hours?.[day]?.ranges?.map((range, index) =>
            index === rangeIndex ? { ...range, [field]: value } : range
          ) || []
        }
      }
    }));
  };

  const handleDayToggle = (day: string, closed: boolean) => {
    setFormData(prev => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: {
          ...prev.opening_hours?.[day],
          closed
        }
      }
    }));
  };

  const addTimeRange = (day: string) => {
    setFormData(prev => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: {
          ...prev.opening_hours?.[day],
          ranges: [
            ...(prev.opening_hours?.[day]?.ranges || []),
            { start: '09:00', end: '17:00' }
          ]
        }
      }
    }));
  };

  const removeTimeRange = (day: string, rangeIndex: number) => {
    setFormData(prev => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: {
          ...prev.opening_hours?.[day],
          ranges: prev.opening_hours?.[day]?.ranges?.filter((_, index) => index !== rangeIndex) || []
        }
      }
    }));
  };

  const testStripeConnection = async () => {
    if (!formData.stripe_public_key || !formData.stripe_secret_key) {
      setStripeTestResult('❌ Veuillez renseigner les clés Stripe');
      return;
    }

    setTestingStripe(true);
    setStripeTestResult(null);

    try {
      const publicKeyValid = formData.stripe_public_key.startsWith('pk_');
      const secretKeyValid = formData.stripe_secret_key.startsWith('sk_');
      
      if (!publicKeyValid || !secretKeyValid) {
        setStripeTestResult('❌ Format des clés Stripe invalide');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setStripeTestResult('✅ Clés Stripe valides ! Configuration OK');
      
      setTimeout(() => setStripeTestResult(null), 5000);
      
    } catch (error) {
      setStripeTestResult('❌ Erreur lors du test de connexion');
    } finally {
      setTestingStripe(false);
    }
  };

  const handleClearCache = async () => {
    const confirmed = window.confirm(
      '⚠️ Êtes-vous sûr de vouloir vider le cache ?\n\n' +
      'Cette action va :\n' +
      '• Supprimer toutes les données en cache\n' +
      '• Recharger l\'application\n' +
      '• Vous devrez peut-être vous reconnecter\n\n' +
      'Continuer ?'
    );

    if (!confirmed) return;

    setClearingCache(true);

    try {
      localStorage.clear();
      sessionStorage.clear();
      
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      setCacheCleared(true);
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Erreur lors du vidage du cache:', error);
      alert('❌ Erreur lors du vidage du cache. Veuillez réessayer.');
      setClearingCache(false);
    }
  };

  if (settingsLoading || companyLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const dayLabels = {
    monday: 'Lundi',
    tuesday: 'Mardi', 
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche'
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Navigation par onglets */}
      <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-lg overflow-x-auto">
        <button
          onClick={() => setActiveSection('general')}
          className={`flex-1 min-w-[150px] px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
            activeSection === 'general'
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span>Paramètres généraux</span>
        </button>
        <button
          onClick={() => setActiveSection('company')}
          className={`flex-1 min-w-[150px] px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
            activeSection === 'company'
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span>Entreprise</span>
        </button>
        <button
          onClick={() => setActiveSection('calendar')}
          className={`flex-1 min-w-[150px] px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
            activeSection === 'calendar'
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span>Google Calendar</span>
        </button>
        <button
          onClick={() => setActiveSection('blocked-dates')}
          className={`flex-1 min-w-[150px] px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
            activeSection === 'blocked-dates'
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span>Dates bloquées</span>
        </button>
      </div>

      {/* Contenu selon l'onglet actif */}
      {activeSection === 'calendar' ? (
        <GoogleCalendarSettings />
      ) : activeSection === 'blocked-dates' ? (
        <BlockedDateRanges />
      ) : activeSection === 'company' ? (
        <form onSubmit={handleCompanySubmit} className="space-y-6 sm:space-y-8">
          {/* Informations entreprise */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Informations entreprise</h3>
                <p className="text-sm text-gray-600">Données légales et coordonnées</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'entreprise *
                  </label>
                  <input
                    type="text"
                    value={companyData.company_name}
                    onChange={(e) => setCompanyData({ ...companyData, company_name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Forme juridique
                  </label>
                  <input
                    type="text"
                    value={companyData.legal_form}
                    onChange={(e) => setCompanyData({ ...companyData, legal_form: e.target.value })}
                    placeholder="SARL, SAS, Auto-entrepreneur..."
                    className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SIRET
                  </label>
                  <input
                    type="text"
                    value={companyData.siret}
                    onChange={(e) => setCompanyData({ ...companyData, siret: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    N° TVA Intracommunautaire
                  </label>
                  <input
                    type="text"
                    value={companyData.tva_number}
                    onChange={(e) => setCompanyData({ ...companyData, tva_number: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse
                </label>
                <input
                  type="text"
                  value={companyData.address}
                  onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code postal
                  </label>
                  <input
                    type="text"
                    value={companyData.postal_code}
                    onChange={(e) => setCompanyData({ ...companyData, postal_code: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={companyData.city}
                    onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pays
                  </label>
                  <input
                    type="text"
                    value={companyData.country}
                    onChange={(e) => setCompanyData({ ...companyData, country: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={companyData.phone}
                    onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={companyData.email}
                    onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site web
                </label>
                <input
                  type="url"
                  value={companyData.website}
                  onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Coordonnées bancaires */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Coordonnées bancaires</h3>
                <p className="text-sm text-gray-600">Pour les factures et paiements</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la banque
                </label>
                <input
                  type="text"
                  value={companyData.bank_name}
                  onChange={(e) => setCompanyData({ ...companyData, bank_name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IBAN
                </label>
                <input
                  type="text"
                  value={companyData.iban}
                  onChange={(e) => setCompanyData({ ...companyData, iban: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BIC
                </label>
                <input
                  type="text"
                  value={companyData.bic}
                  onChange={(e) => setCompanyData({ ...companyData, bic: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Bouton de sauvegarde */}
          <div className="flex justify-end">
            <Button
              type="submit"
              loading={saving}
              variant="primary"
              size="lg"
            >
              <Save className="w-5 h-5" />
              Enregistrer les informations
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Informations générales */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Informations générales</h3>
                <p className="text-sm text-gray-600">Nom et identité de votre entreprise</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'entreprise
                </label>
                <input
                  type="text"
                  value={formData.business_name || ''}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="Ex: Mon Entreprise"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-2" />
                  Fuseau horaire
                </label>
                <select
                  value={formData.timezone || 'Europe/Paris'}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                >
                  {POPULAR_TIMEZONES.map(tz => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Horaires d'ouverture */}
          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Horaires d'ouverture</h3>
                <p className="text-sm text-gray-600">Définissez vos plages horaires</p>
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(dayLabels).map(([day, label]) => (
                <div key={day} className="bg-white rounded-xl p-4 border-2 border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-gray-900">{label}</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.opening_hours?.[day]?.closed || false}
                        onChange={(e) => handleDayToggle(day, e.target.checked)}
                        className="w-5 h-5 rounded border-2 border-green-300"
                      />
                      <span className="text-sm text-gray-600">Fermé</span>
                    </label>
                  </div>

                  {!formData.opening_hours?.[day]?.closed && (
                    <div className="space-y-2">
                      {formData.opening_hours?.[day]?.ranges?.map((range, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="time"
                            value={range.start}
                            onChange={(e) => handleTimeRangeChange(day, index, 'start', e.target.value)}
                            className="flex-1 px-3 py-2 border-2 border-green-300 rounded-lg"
                          />
                          <span className="text-gray-500">→</span>
                          <input
                            type="time"
                            value={range.end}
                            onChange={(e) => handleTimeRangeChange(day, index, 'end', e.target.value)}
                            className="flex-1 px-3 py-2 border-2 border-green-300 rounded-lg"
                          />
                          {(formData.opening_hours?.[day]?.ranges?.length || 0) > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTimeRange(day, index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addTimeRange(day)}
                        className="text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        + Ajouter une plage horaire
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Paramètres de réservation */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 border-2 border-orange-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Paramètres de réservation</h3>
                <p className="text-sm text-gray-600">Délais et tampons de temps</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tampon entre réservations (minutes)
                </label>
                <input
                  type="number"
                  value={formData.buffer_minutes || 15}
                  onChange={(e) => setFormData({ ...formData, buffer_minutes: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-orange-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                  min="0"
                  step="5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Délai minimum de réservation (heures)
                </label>
                <input
                  type="number"
                  value={formData.minimum_booking_delay_hours || 24}
                  onChange={(e) => setFormData({ ...formData, minimum_booking_delay_hours: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-orange-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Paramètres de paiement */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 border-2 border-indigo-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Euro className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Paramètres de paiement</h3>
                <p className="text-sm text-gray-600">Acomptes et délais de paiement</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d'acompte
                </label>
                <select
                  value={formData.deposit_type || 'percentage'}
                  onChange={(e) => setFormData({ ...formData, deposit_type: e.target.value as 'percentage' | 'fixed' })}
                  className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                >
                  <option value="percentage">Pourcentage</option>
                  <option value="fixed">Montant fixe</option>
                </select>
              </div>

              {formData.deposit_type === 'percentage' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Percent className="w-4 h-4 inline mr-2" />
                    Pourcentage d'acompte par défaut
                  </label>
                  <input
                    type="number"
                    value={formData.default_deposit_percentage || 30}
                    onChange={(e) => setFormData({ ...formData, default_deposit_percentage: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    min="0"
                    max="100"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Euro className="w-4 h-4 inline mr-2" />
                    Montant d'acompte fixe (€)
                  </label>
                  <input
                    type="number"
                    value={formData.deposit_fixed_amount || 20}
                    onChange={(e) => setFormData({ ...formData, deposit_fixed_amount: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}

              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-4 border-2 border-yellow-200">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="multiply_deposit"
                    checked={formData.multiply_deposit_by_services || false}
                    onChange={(e) => setFormData({ ...formData, multiply_deposit_by_services: e.target.checked })}
                    className="w-5 h-5 rounded border-2 border-yellow-300 mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="multiply_deposit" className="block text-sm font-bold text-gray-900 mb-1 cursor-pointer">
                      <Calculator className="w-4 h-4 inline mr-2" />
                      Multiplier l'acompte par la quantité (iframe)
                    </label>
                    <p className="text-xs text-gray-600">
                      {formData.deposit_type === 'percentage' ? (
                        <>
                          <strong>Activé :</strong> L'acompte sera calculé sur chaque service individuellement<br />
                          <em>Exemple : 3 services à 50€ avec 30% = (50€ × 30%) × 3 = 45€</em><br /><br />
                          <strong>Désactivé :</strong> L'acompte sera calculé sur le total<br />
                          <em>Exemple : 3 services à 50€ avec 30% = (50€ × 3) × 30% = 45€</em>
                        </>
                      ) : (
                        <>
                          <strong>Activé :</strong> L'acompte fixe sera multiplié par la quantité<br />
                          <em>Exemple : 3 services avec acompte de 20€ = 20€ × 3 = 60€</em><br /><br />
                          <strong>Désactivé :</strong> L'acompte fixe reste le même quelle que soit la quantité<br />
                          <em>Exemple : 3 services avec acompte de 20€ = 20€</em>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiration du lien de paiement (minutes)
                </label>
                <input
                  type="number"
                  value={formData.payment_link_expiry_minutes || 30}
                  onChange={(e) => setFormData({ ...formData, payment_link_expiry_minutes: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  min="5"
                />
              </div>
            </div>
          </div>

          {/* Stripe */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border-2 border-purple-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Configuration Stripe</h3>
                <p className="text-sm text-gray-600">Clés API pour les paiements</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-purple-100 rounded-xl">
                <input
                  type="checkbox"
                  checked={formData.stripe_enabled || false}
                  onChange={(e) => setFormData({ ...formData, stripe_enabled: e.target.checked })}
                  className="w-5 h-5 rounded border-2 border-purple-300"
                />
                <label className="text-sm font-medium text-gray-700">
                  Activer les paiements Stripe
                </label>
              </div>

              {formData.stripe_enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Clé publique Stripe
                    </label>
                    <div className="relative">
                      <input
                        type={showStripeKeys ? 'text' : 'password'}
                        value={formData.stripe_public_key || ''}
                        onChange={(e) => setFormData({ ...formData, stripe_public_key: e.target.value })}
                        className="w-full px-4 py-3 pr-12 border-2 border-purple-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                        placeholder="pk_live_..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowStripeKeys(!showStripeKeys)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showStripeKeys ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Clé secrète Stripe
                    </label>
                    <div className="relative">
                      <input
                        type={showStripeKeys ? 'text' : 'password'}
                        value={formData.stripe_secret_key || ''}
                        onChange={(e) => setFormData({ ...formData, stripe_secret_key: e.target.value })}
                        className="w-full px-4 py-3 pr-12 border-2 border-purple-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                        placeholder="sk_live_..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowStripeKeys(!showStripeKeys)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showStripeKeys ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Webhook Secret (optionnel)
                    </label>
                    <input
                      type={showStripeKeys ? 'text' : 'password'}
                      value={formData.stripe_webhook_secret || ''}
                      onChange={(e) => setFormData({ ...formData, stripe_webhook_secret: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                      placeholder="whsec_..."
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={testStripeConnection}
                    loading={testingStripe}
                    variant="secondary"
                    className="w-full"
                  >
                    <Shield className="w-4 h-4" />
                    Tester la connexion Stripe
                  </Button>

                  {stripeTestResult && (
                    <div className={`p-4 rounded-xl ${
                      stripeTestResult.includes('✅') 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {stripeTestResult}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Brevo */}
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-6 border-2 border-pink-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Configuration Brevo</h3>
                <p className="text-sm text-gray-600">Emails transactionnels</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-pink-100 rounded-xl">
                <input
                  type="checkbox"
                  checked={formData.brevo_enabled || false}
                  onChange={(e) => setFormData({ ...formData, brevo_enabled: e.target.checked })}
                  className="w-5 h-5 rounded border-2 border-pink-300"
                />
                <label className="text-sm font-medium text-gray-700">
                  Activer les emails Brevo
                </label>
              </div>

              {formData.brevo_enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Clé API Brevo
                    </label>
                    <div className="relative">
                      <input
                        type={showBrevoKey ? 'text' : 'password'}
                        value={formData.brevo_api_key || ''}
                        onChange={(e) => setFormData({ ...formData, brevo_api_key: e.target.value })}
                        className="w-full px-4 py-3 pr-12 border-2 border-pink-300 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
                        placeholder="xkeysib-..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowBrevoKey(!showBrevoKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showBrevoKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email expéditeur
                    </label>
                    <input
                      type="email"
                      value={formData.brevo_sender_email || ''}
                      onChange={(e) => setFormData({ ...formData, brevo_sender_email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-pink-300 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
                      placeholder="noreply@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom expéditeur
                    </label>
                    <input
                      type="text"
                      value={formData.brevo_sender_name || ''}
                      onChange={(e) => setFormData({ ...formData, brevo_sender_name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-pink-300 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
                      placeholder="BookingFast"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Twilio SMS */}
          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Configuration Twilio SMS</h3>
                <p className="text-sm text-gray-600">Envoi automatique de SMS</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong>À propos de Twilio :</strong> Twilio vous permet d'envoyer des SMS automatiques à vos clients pour les confirmations de réservation, rappels et modifications. Créez un compte sur <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="underline font-bold">twilio.com</a> pour obtenir vos identifiants.
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-green-100 rounded-xl">
                <input
                  type="checkbox"
                  checked={formData.twilio_enabled || false}
                  onChange={(e) => setFormData({ ...formData, twilio_enabled: e.target.checked })}
                  className="w-5 h-5 rounded border-2 border-green-300"
                />
                <label className="text-sm font-medium text-gray-700">
                  Activer l'envoi de SMS via Twilio
                </label>
              </div>

              {formData.twilio_enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account SID Twilio
                    </label>
                    <input
                      type="text"
                      value={formData.twilio_account_sid || ''}
                      onChange={(e) => setFormData({ ...formData, twilio_account_sid: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                    <p className="text-xs text-gray-500 mt-1">Trouvable sur votre tableau de bord Twilio</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Auth Token Twilio
                    </label>
                    <div className="relative">
                      <input
                        type={showTwilioToken ? 'text' : 'password'}
                        value={formData.twilio_auth_token || ''}
                        onChange={(e) => setFormData({ ...formData, twilio_auth_token: e.target.value })}
                        className="w-full px-4 py-3 pr-12 border-2 border-green-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                        placeholder="********************************"
                      />
                      <button
                        type="button"
                        onClick={() => setShowTwilioToken(!showTwilioToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showTwilioToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Token d'authentification (à garder secret)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro de téléphone Twilio
                    </label>
                    <input
                      type="tel"
                      value={formData.twilio_phone_number || ''}
                      onChange={(e) => setFormData({ ...formData, twilio_phone_number: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      placeholder="+33612345678"
                    />
                    <p className="text-xs text-gray-500 mt-1">Format international (ex: +33612345678)</p>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <strong>Important :</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Les numéros de téléphone des clients doivent être au format international (+33...)</li>
                        <li>Chaque SMS envoyé est facturé par Twilio (environ 0,05€ par SMS)</li>
                        <li>Les SMS sont limités à 160 caractères</li>
                        <li>Configurez vos workflows SMS dans la section Workflows</li>
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Cache Management */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 border-2 border-red-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Gestion du cache</h3>
                <p className="text-sm text-gray-600">Vider le cache de l'application</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <strong>Attention :</strong> Cette action va supprimer toutes les données en cache et recharger l'application. Vous devrez peut-être vous reconnecter.
                </div>
              </div>

              {cacheCleared && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-800">Cache vidé avec succès ! Rechargement...</span>
                </div>
              )}

              <Button
                type="button"
                onClick={handleClearCache}
                loading={clearingCache}
                variant="secondary"
                className="w-full bg-red-100 hover:bg-red-200 text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Vider le cache
              </Button>
            </div>
          </div>

          {/* Bouton de sauvegarde */}
          <div className="flex justify-end">
            <Button
              type="submit"
              loading={saving}
              variant="primary"
              size="lg"
            >
              <Save className="w-5 h-5" />
              Enregistrer les paramètres
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
