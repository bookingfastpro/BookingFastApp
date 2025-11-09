import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Package, Save, X, Image, Clock, Calculator } from 'lucide-react';
import { useServices } from '../../hooks/useServices';
import { useTeam } from '../../hooks/useTeam';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import { PermissionGate, UsageLimitIndicator } from '../UI/PermissionGate';
import { Service } from '../../types';
import { calculatePriceHT, formatPrice } from '../../lib/taxCalculations';
import { Modal } from '../UI/Modal';

export function ServicesPage() {
  const { services, loading, addService, updateService, deleteService } = useServices();
  const { hasPermission, getUsageLimits } = useTeam();
  const { settings } = useBusinessSettings();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  
  const usageLimits = getUsageLimits();
  const userServicesCount = services.filter(s => s.description !== 'Service personnalisé').length;
  const taxRate = settings?.tax_rate ?? 20;
  
  const handleAvailabilityChange = (day: string, field: 'closed', value: any) => {
    setFormData(prev => ({
      ...prev,
      availability_hours: {
        ...prev.availability_hours,
        [day]: {
          ...prev.availability_hours[day],
          closed: !value
        }
      }
    }));
  };

  const handleRangeChange = (day: string, rangeIndex: number, field: 'start' | 'end', value: string) => {
    setFormData(prev => ({
      ...prev,
      availability_hours: {
        ...prev.availability_hours,
        [day]: {
          ...prev.availability_hours[day],
          ranges: prev.availability_hours[day].ranges.map((range, index) =>
            index === rangeIndex ? { ...range, [field]: value } : range
          )
        }
      }
    }));
  };

  const addTimeRange = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availability_hours: {
        ...prev.availability_hours,
        [day]: {
          ...prev.availability_hours[day],
          ranges: [...prev.availability_hours[day].ranges, { start: '09:00', end: '17:00' }]
        }
      }
    }));
  };

  const removeTimeRange = (day: string, rangeIndex: number) => {
    setFormData(prev => ({
      ...prev,
      availability_hours: {
        ...prev.availability_hours,
        [day]: {
          ...prev.availability_hours[day],
          ranges: prev.availability_hours[day].ranges.filter((_, index) => index !== rangeIndex)
        }
      }
    }));
  };

  const [formData, setFormData] = useState({
    name: '',
    price_ht: 0,
    price_ttc: 0,
    image_url: '',
    description: '',
    duration_minutes: 60,
    capacity: 1,
    unit_name: '',
    availability_hours: {
      monday: { ranges: [{ start: '08:00', end: '18:00' }], closed: false },
      tuesday: { ranges: [{ start: '08:00', end: '18:00' }], closed: false },
      wednesday: { ranges: [{ start: '08:00', end: '18:00' }], closed: false },
      thursday: { ranges: [{ start: '08:00', end: '18:00' }], closed: false },
      friday: { ranges: [{ start: '08:00', end: '18:00' }], closed: false },
      saturday: { ranges: [{ start: '09:00', end: '17:00' }], closed: false },
      sunday: { ranges: [{ start: '10:00', end: '16:00' }], closed: true }
    }
  });

  // Recalculer le prix HT quand le prix TTC change
  useEffect(() => {
    if (formData.price_ttc > 0) {
      const calculatedHT = calculatePriceHT(formData.price_ttc, taxRate);
      setFormData(prev => ({ ...prev, price_ht: calculatedHT }));
    }
  }, [formData.price_ttc, taxRate]);

  const resetForm = () => {
    setFormData({
      name: '',
      price_ht: 0,
      price_ttc: 0,
      image_url: '',
      description: '',
      duration_minutes: 60,
      capacity: 1,
      unit_name: '',
      availability_hours: {
        monday: { ranges: [{ start: '08:00', end: '18:00' }], closed: false },
        tuesday: { ranges: [{ start: '08:00', end: '18:00' }], closed: false },
        wednesday: { ranges: [{ start: '08:00', end: '18:00' }], closed: false },
        thursday: { ranges: [{ start: '08:00', end: '18:00' }], closed: false },
        friday: { ranges: [{ start: '08:00', end: '18:00' }], closed: false },
        saturday: { ranges: [{ start: '09:00', end: '17:00' }], closed: false },
        sunday: { ranges: [{ start: '10:00', end: '16:00' }], closed: true }
      }
    });
    setEditingService(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      price_ht: service.price_ht,
      price_ttc: service.price_ttc,
      image_url: service.image_url || '',
      description: service.description,
      duration_minutes: service.duration_minutes,
      capacity: service.capacity,
      unit_name: service.unit_name || '',
      availability_hours: service.availability_hours || {
        monday: { ranges: [{ start: '08:00', end: '18:00' }], closed: false },
        tuesday: { ranges: [{ start: '08:00', end: '18:00' }], closed: false },
        wednesday: { ranges: [{ start: '08:00', end: '18:00' }], closed: false },
        thursday: { ranges: [{ start: '08:00', end: '18:00' }], closed: false },
        friday: { ranges: [{ start: '08:00', end: '18:00' }], closed: false },
        saturday: { ranges: [{ start: '09:00', end: '17:00' }], closed: false },
        sunday: { ranges: [{ start: '10:00', end: '16:00' }], closed: true }
      }
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    if (!editingService && usageLimits.maxServicesCreated && userServicesCount >= usageLimits.maxServicesCreated) {
      alert(`Limite atteinte: ${usageLimits.maxServicesCreated} services maximum pour votre rôle`);
      setSaving(false);
      return;
    }
    
    try {
      // Recalculer le prix HT avant la sauvegarde
      const finalData = {
        ...formData,
        price_ht: calculatePriceHT(formData.price_ttc, taxRate)
      };

      if (editingService) {
        await updateService(editingService.id, finalData);
      } else {
        await addService(finalData);
      }
      handleCloseModal();
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (service: Service) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le service "${service.name}" ?`)) {
      try {
        await deleteService(service.id);
      } catch (error) {
        alert(`Erreur lors de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-200 rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-purple-600 rounded-full animate-spin border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 mobile-optimized">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Services
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Gérez vos services et tarifs (TVA: {taxRate}%)</p>
        </div>
        
        <PermissionGate permission="create_service">
          <UsageLimitIndicator currentUsage={userServicesCount} permission="create_service">
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 sm:px-6 py-3 rounded-xl sm:rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Nouveau service
            </button>
          </UsageLimitIndicator>
        </PermissionGate>
      </div>

      {/* Services List */}
      <div className="space-y-3 sm:space-y-4">
        {services.filter(service => service.description !== 'Service personnalisé').map((service, index) => (
          <div
            key={service.id}
            className="w-full bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 animate-fadeIn"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                {/* En-tête avec image et nom */}
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  {service.image_url ? (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={service.image_url}
                        alt={service.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                      {service.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-gray-900 text-sm sm:text-base truncate">
                      {service.name}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 truncate">
                      {service.description}
                    </div>
                  </div>
                </div>

                {/* Détails */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-3 sm:w-4 h-3 sm:h-4 text-blue-500 flex-shrink-0" />
                    <span>{service.duration_minutes} minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Package className="w-3 sm:w-4 h-3 sm:h-4 text-green-500 flex-shrink-0" />
                    <span>{service.capacity} {service.unit_name || 'pers.'}</span>
                  </div>
                </div>

                {/* Prix */}
                <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-700 border-green-200">
                    Prix TTC
                  </span>
                  <span className="text-xs text-gray-600">
                    HT: {formatPrice(service.price_ht)} · TVA: {formatPrice(service.price_ttc - service.price_ht)}
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  <PermissionGate permission="edit_service">
                    <button
                      onClick={() => handleEdit(service)}
                      className="flex items-center justify-center gap-1 sm:gap-2 bg-blue-500 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-blue-600 transition-colors text-xs sm:text-sm"
                    >
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                      Modifier
                    </button>
                  </PermissionGate>
                  <PermissionGate permission="delete_service">
                    <button
                      onClick={() => handleDelete(service)}
                      className="flex items-center justify-center gap-1 sm:gap-2 bg-red-500 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-red-600 transition-colors text-xs sm:text-sm"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      Supprimer
                    </button>
                  </PermissionGate>
                </div>
              </div>

              {/* Prix à droite */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <div className="text-right">
                  <div className="text-base sm:text-lg font-bold text-purple-600">
                    {formatPrice(service.price_ttc)}
                  </div>
                  <div className="text-xs text-gray-600">
                    TTC
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {services.filter(service => service.description !== 'Service personnalisé').length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Aucun service</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-6">Commencez par créer votre premier service</p>
          <PermissionGate permission="create_service">
            <UsageLimitIndicator currentUsage={userServicesCount} permission="create_service">
              <button
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 sm:px-6 py-3 rounded-xl sm:rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
              >
                Créer un service
              </button>
            </UsageLimitIndicator>
          </PermissionGate>
        </div>
      )}

      {/* Modal utilisant le composant Modal générique */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingService ? 'Modifier le service' : 'Nouveau service'}
        size="2xl"
        headerGradient="from-purple-600 via-pink-600 to-rose-600"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du service
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                placeholder="Ex: Massage relaxant"
              />
            </div>

            {/* Section Prix avec calcul automatique */}
            <div className="sm:col-span-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-gray-900">Tarification (TVA: {taxRate}%)</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix TTC (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_ttc === 0 ? '' : formData.price_ttc}
                    onChange={(e) => {
                      const ttc = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                      setFormData(prev => ({ 
                        ...prev, 
                        price_ttc: ttc
                      }));
                    }}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300"
                    placeholder="120.00"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Prix toutes taxes comprises
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border border-emerald-300">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix HT (calculé automatiquement)
                  </label>
                  <div className="text-2xl font-bold text-emerald-600">
                    {formatPrice(formData.price_ht)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    TVA: {formatPrice(formData.price_ttc - formData.price_ht)}
                  </div>
                </div>
              </div>

              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-xs text-blue-700">
                  <strong>💡 Calcul automatique:</strong> Le prix HT est calculé à partir du prix TTC avec la formule: 
                  HT = TTC ÷ (1 + {taxRate}%)
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={formData.duration_minutes === 0 ? '' : formData.duration_minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value === '' ? 0 : parseInt(e.target.value) || 60 }))}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacité (personnes)
              </label>
              <input
                type="number"
                min="1"
                value={formData.capacity === 0 ? '' : formData.capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value === '' ? 0 : parseInt(e.target.value) || 1 }))}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'unité (optionnel)
              </label>
              <input
                type="text"
                value={formData.unit_name}
                onChange={(e) => setFormData(prev => ({ ...prev, unit_name: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                placeholder="Ex: Jet ski, Vélo, Chambre..."
              />
              <div className="text-xs text-gray-500 mt-1">
                Ce mot remplacera "participants" dans la réservation
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de l'image (optionnel)
              </label>
              <div className="relative">
                <Image className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                  placeholder="https://exemple.com/image.jpg"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                placeholder="Décrivez votre service..."
              />
            </div>

            {/* Horaires de disponibilité */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Horaires de disponibilité du service
              </label>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-blue-700 mb-2">
                  <strong>💡 Conseil :</strong> Configurez des horaires spécifiques pour ce service.
                </p>
                <p className="text-xs text-blue-600">
                  Si aucun horaire n'est défini, les horaires généraux de l'entreprise seront utilisés.
                </p>
              </div>
              
              <div className="space-y-4">
                {Object.entries(formData.availability_hours).map(([day, hours]) => (
                  <div key={day} className="p-4 bg-white border border-gray-200 rounded-xl">
                    <div className="text-sm font-medium text-gray-700 capitalize mb-2">
                      {day === 'monday' ? 'Lundi' :
                       day === 'tuesday' ? 'Mardi' :
                       day === 'wednesday' ? 'Mercredi' :
                       day === 'thursday' ? 'Jeudi' :
                       day === 'friday' ? 'Vendredi' :
                       day === 'saturday' ? 'Samedi' :
                       day === 'sunday' ? 'Dimanche' : day}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        checked={!hours.closed}
                        onChange={(e) => handleAvailabilityChange(day, 'closed', e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-600">Disponible</span>
                    </div>
                    
                    {!hours.closed && (
                      <div className="space-y-3">
                        {hours.ranges.map((range, rangeIndex) => (
                          <div key={rangeIndex} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <input
                                type="time"
                                value={range.start}
                                onChange={(e) => handleRangeChange(day, rangeIndex, 'start', e.target.value)}
                                className="flex-1 sm:flex-initial p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              />
                              <span className="text-gray-500 font-medium">à</span>
                              <input
                                type="time"
                                value={range.end}
                                onChange={(e) => handleRangeChange(day, rangeIndex, 'end', e.target.value)}
                                className="flex-1 sm:flex-initial p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              />
                            </div>
                            
                            {hours.ranges.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeTimeRange(day, rangeIndex)}
                                className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors self-end sm:self-auto"
                                title="Supprimer cette plage"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        
                        <button
                          type="button"
                          onClick={() => addTimeRange(day)}
                          className="flex items-center justify-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-sm font-medium w-full sm:w-auto"
                        >
                          <Plus className="w-4 h-4" />
                          Ajouter une plage horaire
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-xl sm:rounded-2xl hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 text-white px-6 py-3 rounded-xl sm:rounded-2xl hover:from-purple-700 hover:via-pink-700 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg font-medium flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {editingService ? 'Modifier' : 'Créer'}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
