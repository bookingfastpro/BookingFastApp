import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Mail, Phone, CreditCard, FileText, Package, UserCheck } from 'lucide-react';
import { Service, Client, Booking } from '../../types';
import { supabase } from '../../lib/supabase';
import { ClientSearchModal } from './ClientSearchModal';
import { useTeamMembers } from '../../hooks/useTeamMembers';
import { isPWA } from '../../utils/pwaDetection';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  services: Service[];
  selectedDate?: string;
  selectedTime?: string;
  selectedServiceId?: string;
  editingBooking?: Booking | null;
}

export function BookingModal({
  isOpen,
  onClose,
  onSubmit,
  services,
  selectedDate,
  selectedTime,
  selectedServiceId,
  editingBooking
}: BookingModalProps) {
  const [formData, setFormData] = useState({
    service_id: selectedServiceId || '',
    client_id: '',
    client_name: '',
    client_firstname: '',
    client_email: '',
    client_phone: '',
    date: selectedDate || new Date().toISOString().split('T')[0],
    time: selectedTime || '09:00',
    duration_minutes: 60,
    quantity: 1,
    total_amount: 0,
    payment_amount: 0,
    payment_method: 'cash' as const,
    payment_status: 'pending' as const,
    booking_status: 'confirmed' as const,
    notes: '',
    assigned_user_id: null as string | null
  });

  const [showClientSearch, setShowClientSearch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { teamMembers } = useTeamMembers();
  const [isPWAMode, setIsPWAMode] = useState(false);

  useEffect(() => {
    setIsPWAMode(isPWA());
  }, []);

  useEffect(() => {
    if (editingBooking) {
      setFormData({
        service_id: editingBooking.service_id,
        client_id: editingBooking.client_id || '',
        client_name: editingBooking.client_name,
        client_firstname: editingBooking.client_firstname,
        client_email: editingBooking.client_email,
        client_phone: editingBooking.client_phone,
        date: editingBooking.date,
        time: editingBooking.time,
        duration_minutes: editingBooking.duration_minutes,
        quantity: editingBooking.quantity,
        total_amount: editingBooking.total_amount,
        payment_amount: editingBooking.payment_amount || 0,
        payment_method: editingBooking.payment_method || 'cash',
        payment_status: editingBooking.payment_status || 'pending',
        booking_status: editingBooking.booking_status,
        notes: editingBooking.notes || '',
        assigned_user_id: editingBooking.assigned_user_id || null
      });
    } else if (selectedServiceId) {
      const service = services.find(s => s.id === selectedServiceId);
      if (service) {
        setFormData(prev => ({
          ...prev,
          service_id: selectedServiceId,
          duration_minutes: service.duration_minutes,
          total_amount: service.price,
          date: selectedDate || prev.date,
          time: selectedTime || prev.time
        }));
      }
    }
  }, [editingBooking, selectedServiceId, selectedDate, selectedTime, services]);

  const selectedService = services.find(s => s.id === formData.service_id);

  const handleServiceChange = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      const newTotalAmount = service.price * formData.quantity;
      setFormData(prev => ({
        ...prev,
        service_id: serviceId,
        duration_minutes: service.duration_minutes,
        total_amount: newTotalAmount
      }));
    }
  };

  const handleQuantityChange = (quantity: number) => {
    if (selectedService) {
      const newTotalAmount = selectedService.price * quantity;
      setFormData(prev => ({
        ...prev,
        quantity,
        total_amount: newTotalAmount
      }));
    }
  };

  const handleClientSelect = (client: Client) => {
    setFormData(prev => ({
      ...prev,
      client_id: client.id,
      client_name: client.name,
      client_firstname: client.firstname,
      client_email: client.email,
      client_phone: client.phone
    }));
    setShowClientSearch(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_name || !formData.client_firstname || !formData.client_email || !formData.client_phone) {
      alert('Veuillez sélectionner ou créer un client');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert('Erreur lors de la création de la réservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const getUnitName = () => {
    if (selectedService?.unit_name && selectedService.unit_name !== 'personnes') {
      return selectedService.unit_name;
    }
    return 'participants';
  };

  const getPluralUnitName = () => {
    const unitName = getUnitName();
    if (formData.quantity <= 1) {
      return `${unitName.replace(/s$/, '')}(s)`;
    }
    return `${unitName}(s)`;
  };

  const mobileModalTop = isPWAMode ? '120px' : '80px';

  return (
    <>
      {/* Desktop Modal */}
      <div className="hidden sm:flex fixed inset-0 bg-black/60 backdrop-blur-sm items-center justify-center z-50 animate-fadeIn p-4">
        <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl transform animate-slideUp flex flex-col">
          {/* Header Desktop - FIXE (pas dans le scroll) */}
          <div className="flex-shrink-0 relative overflow-hidden rounded-t-3xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative z-10 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                      {editingBooking ? 'Modifier la réservation' : 'Nouvelle réservation'}
                    </h2>
                    <p className="text-white/80 mt-1">
                      {editingBooking ? 'Modifiez les informations' : 'Créez une nouvelle réservation'}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={onClose}
                  className="group relative p-3 text-white hover:bg-white/20 rounded-2xl transition-all duration-300 transform hover:scale-110 hover:rotate-90 backdrop-blur-sm"
                  aria-label="Fermer"
                >
                  <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <svg className="w-6 h-6 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
          </div>

          {/* Form - SCROLLABLE */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service *
                  </label>
                  <div className="space-y-2">
                    {services.map((service) => (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => handleServiceChange(service.id)}
                        className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                          formData.service_id === service.id
                            ? 'border-purple-500 bg-purple-50 shadow-lg transform scale-[1.02]'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            formData.service_id === service.id
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                              : 'bg-gray-100'
                          }`}>
                            <Package className={`w-6 h-6 ${
                              formData.service_id === service.id ? 'text-white' : 'text-gray-400'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{service.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-4 mt-1">
                              <span className="text-green-600 font-semibold">{service.price.toFixed(2)}€</span>
                              <span>{service.duration_minutes}min</span>
                              <span>Max {service.max_capacity} {service.unit_name || 'personnes'}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowClientSearch(true)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-purple-300 transition-colors text-left"
                  >
                    {formData.client_name ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                          {formData.client_firstname.charAt(0)}{formData.client_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {formData.client_firstname} {formData.client_name}
                          </div>
                          <div className="text-sm text-gray-500">{formData.client_email}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-gray-500">
                        <User className="w-5 h-5" />
                        <span>Rechercher ou créer un client...</span>
                      </div>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Heure *
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigner à un membre
                  </label>
                  <select
                    value={formData.assigned_user_id || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, assigned_user_id: e.target.value || null }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Non assigné</option>
                    {teamMembers.map((member) => (
                      <option key={member.user_id} value={member.user_id}>
                        {member.full_name} ({member.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de {getPluralUnitName()} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedService?.max_capacity || 10}
                    value={formData.quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Montant total</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formData.total_amount.toFixed(2)}€
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes internes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="Notes visibles uniquement par vous et votre équipe"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Ces notes sont visibles uniquement par vous et votre équipe
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Création...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Créer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile Modal */}
      <div className="sm:hidden">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
        
        {/* Modal content - STRUCTURE FIXE */}
        <div 
          className="fixed left-0 right-0 bottom-0 bg-white z-45 flex flex-col"
          style={{ 
            top: mobileModalTop,
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            maxHeight: `calc(100vh - ${mobileModalTop})`
          }}
        >
          {/* Header Mobile - FIXE (pas dans le scroll) */}
          <div 
            className="flex-shrink-0 relative overflow-hidden"
            style={{
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative z-10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white drop-shadow-lg">
                      {editingBooking ? 'Modifier la réservation' : 'Nouvelle réservation'}
                    </h2>
                    <p className="text-white/80 text-xs">
                      {editingBooking ? 'Modifiez les informations' : 'Créez une nouvelle réservation'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-all duration-300 transform hover:scale-110 mobile-tap-target"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
          </div>

          {/* Content - SCROLLABLE */}
          <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="p-4 space-y-4 pb-32">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service *
                </label>
                <div className="space-y-2">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => handleServiceChange(service.id)}
                      className={`w-full p-3 rounded-xl border-2 transition-all duration-300 text-left ${
                        formData.service_id === service.id
                          ? 'border-purple-500 bg-purple-50 shadow-lg'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          formData.service_id === service.id
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                            : 'bg-gray-100'
                        }`}>
                          <Package className={`w-5 h-5 ${
                            formData.service_id === service.id ? 'text-white' : 'text-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">{service.name}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                            <span className="text-green-600 font-semibold">{service.price.toFixed(2)}€</span>
                            <span>{service.duration_minutes}min</span>
                            <span>Max {service.max_capacity} {service.unit_name || 'personnes'}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client *
                </label>
                <button
                  type="button"
                  onClick={() => setShowClientSearch(true)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl hover:border-purple-300 transition-colors text-left"
                >
                  {formData.client_name ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {formData.client_firstname.charAt(0)}{formData.client_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {formData.client_firstname} {formData.client_name}
                        </div>
                        <div className="text-xs text-gray-500">{formData.client_email}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-gray-500">
                      <User className="w-5 h-5" />
                      <span className="text-sm">Rechercher ou créer un client...</span>
                    </div>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heure *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigner à un membre
                </label>
                <select
                  value={formData.assigned_user_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, assigned_user_id: e.target.value || null }))}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                >
                  <option value="">Non assigné</option>
                  {teamMembers.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de {getPluralUnitName()} *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedService?.max_capacity || 10}
                  value={formData.quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Montant total</span>
                  <span className="text-xl font-bold text-green-600">
                    {formData.total_amount.toFixed(2)}€
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes internes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                  placeholder="Notes visibles uniquement par vous et votre équipe"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Ces notes sont visibles uniquement par vous et votre équipe
                </p>
              </div>
            </div>
          </div>

          {/* Footer FIXE EN BAS */}
          <div 
            className="flex-shrink-0 bg-white border-t border-gray-200 p-4 flex gap-3"
            style={{
              boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
              paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium text-sm"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Création...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Créer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showClientSearch && (
        <ClientSearchModal
          isOpen={showClientSearch}
          onClose={() => setShowClientSearch(false)}
          onSelectClient={handleClientSelect}
        />
      )}
    </>
  );
}
