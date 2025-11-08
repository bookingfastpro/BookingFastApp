import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Clock, User, Mail, Phone, CreditCard, CreditCard as Edit, Trash2, Calendar, Eye, FileText, History, UserCheck, Euro, MapPin } from 'lucide-react';
import { Booking } from '../../types';
import { BookingHistoryModal } from './BookingHistoryModal';
import { useTeamMembers } from '../../hooks/useTeamMembers';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatTime } from '../../utils/dateUtils';

interface ServiceBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  serviceName: string;
  serviceId: string;
  selectedDate: string;
  selectedTime: string;
  onEditBooking: (booking: Booking) => void;
  onDeleteBooking: (bookingId: string) => void;
  onNewBooking: (date: string, time: string, serviceId: string) => void;
}

export function ServiceBookingModal({ 
  isOpen, 
  onClose, 
  bookings, 
  serviceName, 
  serviceId,
  selectedDate,
  selectedTime,
  onEditBooking,
  onDeleteBooking,
  onNewBooking
}: ServiceBookingModalProps) {
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<Booking | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyBookingId, setHistoryBookingId] = useState<string | null>(null);
  const [historyClientName, setHistoryClientName] = useState<string>('');
  const { teamMembers } = useTeamMembers();

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');

      if (!document.getElementById('modal-root')) {
        const modalRoot = document.createElement('div');
        modalRoot.id = 'modal-root';
        document.body.appendChild(modalRoot);
      }

      return () => {
        document.body.classList.remove('modal-open');
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalAmount = bookings.reduce((sum, booking) => sum + booking.total_amount, 0);
  const totalPaid = bookings.reduce((sum, booking) => sum + (booking.payment_amount || 0), 0);

  const getAssignedUser = (booking: Booking) => {
    if (!booking.assigned_user_id) {
      return null;
    }
    
    return teamMembers.find(member => member.user_id === booking.assigned_user_id);
  };

  const getActualPaymentStatus = (booking: Booking): 'pending' | 'partial' | 'completed' => {
    const paid = booking.payment_amount || 0;
    const total = booking.total_amount || 0;
    
    if (paid === 0) {
      return 'pending';
    } else if (paid >= total) {
      return 'completed';
    } else {
      return 'partial';
    }
  };

  const getPaymentStatusColor = (booking: Booking) => {
    const status = getActualPaymentStatus(booking);
    switch (status) {
      case 'completed':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200';
      case 'partial':
        return 'bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-red-200';
    }
  };

  const getPaymentStatusText = (booking: Booking) => {
    const status = getActualPaymentStatus(booking);
    switch (status) {
      case 'completed':
        return '✅ Payé';
      case 'partial':
        return '💵 Partiel';
      default:
        return '❌ Non payé';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmée';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulée';
      case 'completed':
        return 'Terminée';
      default:
        return status;
    }
  };

  const getUnitName = (booking: Booking) => {
    if (booking.service?.unit_name && booking.service.unit_name !== 'personnes') {
      return booking.service.unit_name;
    }
    return 'participants';
  };

  const getPluralUnitName = (booking: Booking, quantity: number) => {
    const unitName = getUnitName(booking);
    if (quantity <= 1) {
      return `${unitName.replace(/s$/, '')}(s)`;
    }
    return `${unitName}(s)`;
  };

  const handleShowHistory = (booking: Booking) => {
    setHistoryBookingId(booking.id);
    setHistoryClientName(`${booking.client_firstname} ${booking.client_name}`);
    setShowHistory(true);
  };

  const handleDeleteBooking = async (bookingId: string, clientName: string) => {
    console.log('🗑️ Tentative de suppression de la réservation:', bookingId);
    
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la réservation de ${clientName} ?\n\nCette action est irréversible.`)) {
      console.log('❌ Suppression annulée par l\'utilisateur');
      return;
    }

    try {
      console.log('🔄 Appel de onDeleteBooking...');
      await onDeleteBooking(bookingId);
      console.log('✅ Réservation supprimée avec succès');
      
      onClose();
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de la réservation. Veuillez réessayer.');
    }
  };

  // AFFICHAGE DES DÉTAILS D'UNE RÉSERVATION AVEC REACT PORTAL
  if (selectedBookingDetails) {
    const assignedUser = getAssignedUser(selectedBookingDetails);
    const displayTransactions = (selectedBookingDetails.transactions || []).filter(transaction => 
      transaction.status === 'completed' || transaction.status === 'paid'
    );
    
    const detailsModalContent = (
      <>
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn z-[9998]"
          onClick={() => setSelectedBookingDetails(null)}
        />

        {/* Modal - CRITICAL: Utiliser la même structure que les autres modals */}
        <div className="fixed inset-0 flex items-center justify-center p-0 sm:p-4 z-[9999]">
          <div className="bg-white w-full h-full sm:h-auto sm:max-w-3xl sm:max-h-[90vh] sm:rounded-3xl shadow-2xl transform animate-slideUp flex flex-col">
            {/* Header avec safe area */}
            <div 
              className="flex-shrink-0 relative overflow-hidden sm:rounded-t-3xl"
              style={{
                paddingTop: 'env(safe-area-inset-top, 0px)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
              
              <div className="relative z-10 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                      <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-2xl font-bold text-white drop-shadow-lg">
                        Détails de la réservation
                      </h2>
                      <p className="text-white/80 text-sm sm:text-base mt-0.5 sm:mt-1">
                        {selectedBookingDetails.client_firstname} {selectedBookingDetails.client_name}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setSelectedBookingDetails(null)}
                    className="p-2 sm:p-3 text-white hover:bg-white/20 rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-110"
                    aria-label="Fermer"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Contenu scrollable avec safe area */}
            <div 
              className="flex-1 overflow-y-auto"
              style={{
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <button
                  onClick={() => handleShowHistory(selectedBookingDetails)}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-3 sm:p-4 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2 sm:gap-3 font-bold text-sm sm:text-base"
                >
                  <History className="w-5 h-5 sm:w-6 sm:h-6" />
                  Historique de la réservation
                </button>

                {/* Statuts */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Statut réservation</p>
                    <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border-2 ${getStatusColor(selectedBookingDetails.booking_status)}`}>
                      {getStatusLabel(selectedBookingDetails.booking_status)}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Statut paiement</p>
                    <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border-2 ${getPaymentStatusColor(selectedBookingDetails)}`}>
                      {getPaymentStatusText(selectedBookingDetails)}
                    </span>
                  </div>
                </div>

                {assignedUser && (
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-indigo-200">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                      Utilisateur assigné
                    </h3>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-sm sm:text-lg flex-shrink-0">
                        {assignedUser.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm sm:text-base">
                          {assignedUser.full_name}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">
                          {assignedUser.email}
                        </div>
                        <div className="mt-1">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            assignedUser.role === 'owner' 
                              ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200'
                              : assignedUser.role === 'admin'
                              ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200'
                              : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200'
                          }`}>
                            {assignedUser.role === 'owner' ? '👑 Propriétaire' : 
                             assignedUser.role === 'admin' ? '⭐ Administrateur' : '👤 Membre'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Informations client */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-blue-200">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    Informations client
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">Nom</p>
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{selectedBookingDetails.client_firstname} {selectedBookingDetails.client_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                        <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">Email</p>
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{selectedBookingDetails.client_email}</p>
                      </div>
                    </div>
                    {selectedBookingDetails.client_phone && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                          <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Téléphone</p>
                          <p className="font-semibold text-gray-900 text-sm sm:text-base">{selectedBookingDetails.client_phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Détails réservation */}
                <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-green-200">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    Détails de la réservation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">Date</p>
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">
                          {format(new Date(selectedBookingDetails.date), 'EEEE d MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">Heure</p>
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{formatTime(selectedBookingDetails.time)}</p>
                      </div>
                    </div>
                    {selectedBookingDetails.service_name && (
                      <div className="flex items-center gap-3 md:col-span-2">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Service</p>
                          <p className="font-semibold text-gray-900 text-sm sm:text-base">{selectedBookingDetails.service_name}</p>
                        </div>
                      </div>
                    )}
                    {selectedBookingDetails.location && (
                      <div className="flex items-center gap-3 md:col-span-2">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Lieu</p>
                          <p className="font-semibold text-gray-900 text-sm sm:text-base">{selectedBookingDetails.location}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informations financières */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-yellow-200">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                    <Euro className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                    Informations financières
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b border-yellow-200">
                      <span className="text-gray-700 font-medium text-sm sm:text-base">Montant total</span>
                      <span className="text-lg sm:text-xl font-bold text-gray-900">{selectedBookingDetails.total_amount.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-yellow-200">
                      <span className="text-gray-700 font-medium text-sm sm:text-base">Montant payé</span>
                      <span className="text-lg sm:text-xl font-bold text-green-600">{(selectedBookingDetails.payment_amount || 0).toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-gray-900 font-bold text-sm sm:text-base">Solde restant</span>
                      <span className="text-xl sm:text-2xl font-bold text-orange-600">
                        {(selectedBookingDetails.total_amount - (selectedBookingDetails.payment_amount || 0)).toFixed(2)}€
                      </span>
                    </div>
                  </div>
                </div>

                {displayTransactions.length > 0 && (
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-indigo-200">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                      Historique des paiements ({displayTransactions.length})
                    </h3>
                    <div className="space-y-3">
                      {displayTransactions.map((transaction, index) => (
                        <div key={index} className="bg-white rounded-xl p-3 sm:p-4 border-2 border-indigo-200 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm sm:text-base">
                              {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)}€
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {transaction.method === 'stripe' ? 'Stripe' : 
                               transaction.method === 'cash' ? 'Espèces' : 
                               transaction.method === 'card' ? 'Carte' : 
                               transaction.method}
                            </p>
                            {transaction.date && (
                              <p className="text-xs text-gray-500">
                                {format(new Date(transaction.date), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedBookingDetails.notes && (
                  <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-gray-200">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                      Notes
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap text-sm">{selectedBookingDetails.notes}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={() => setSelectedBookingDetails(null)}
                    className="w-full sm:w-auto sm:min-w-[120px] bg-gray-500 text-white px-4 sm:px-6 py-3 rounded-xl hover:bg-gray-600 transition-colors font-medium text-sm sm:text-base"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={() => {
                      onEditBooking(selectedBookingDetails);
                      setSelectedBookingDetails(null);
                    }}
                    className="w-full sm:flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                    Modifier
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showHistory && historyBookingId && (
          <BookingHistoryModal
            isOpen={showHistory}
            onClose={() => setShowHistory(false)}
            bookingId={historyBookingId}
            clientName={historyClientName}
          />
        )}
      </>
    );

    // Utiliser le portail React pour rendre le modal de détails
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return null;

    return ReactDOM.createPortal(detailsModalContent, modalRoot);
  }

  // AFFICHAGE DE LA LISTE DES RÉSERVATIONS AVEC REACT PORTAL
  const listModalContent = (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn z-[9998]"
        onClick={onClose}
      />

      {/* Modal - CRITICAL: Plein écran sur mobile, centré sur desktop */}
      <div className="fixed inset-0 flex items-center justify-center p-0 sm:p-4 z-[9999]">
        <div className="bg-white w-full h-full sm:h-auto sm:max-w-4xl sm:max-h-[90vh] sm:rounded-3xl shadow-2xl transform animate-slideUp flex flex-col">
          {/* Header avec safe area */}
          <div 
            className="flex-shrink-0 relative overflow-hidden sm:rounded-t-3xl"
            style={{
              paddingTop: 'env(safe-area-inset-top, 0px)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
            
            <div className="relative z-10 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-white drop-shadow-lg">
                      {serviceName}
                    </h2>
                    <p className="text-white/80 text-sm sm:text-base mt-0.5 sm:mt-1">{bookings.length} réservation(s)</p>
                  </div>
                </div>
                
                <button
                  onClick={onClose}
                  className="p-2 sm:p-3 text-white hover:bg-white/20 rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-110"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4">
                  <div className="text-white/80 text-xs sm:text-sm">Chiffre d'affaires</div>
                  <div className="text-lg sm:text-2xl font-bold text-white">{totalAmount.toFixed(2)}€</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4">
                  <div className="text-white/80 text-xs sm:text-sm">Encaissé</div>
                  <div className="text-lg sm:text-2xl font-bold text-white">{totalPaid.toFixed(2)}€</div>
                </div>
              </div>
            </div>
          </div>

          {/* Contenu scrollable avec safe area */}
          <div 
            className="flex-1 overflow-y-auto"
            style={{
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div className="p-4 sm:p-6">
              <div className="mb-4 sm:mb-6">
                <button
                  onClick={() => {
                    onClose();
                    onNewBooking(selectedDate, selectedTime, serviceId);
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2 sm:gap-3 font-bold text-sm sm:text-base"
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-xs sm:text-sm">+</span>
                  </div>
                  Ajouter un client à ce créneau
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {bookings.map((booking, index) => {
                  const assignedUser = getAssignedUser(booking);
                  
                  return (
                    <div
                      key={booking.id}
                      className="bg-gradient-to-r from-gray-50 to-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] animate-fadeIn"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 sm:gap-4 flex-1">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-sm sm:text-lg flex-shrink-0">
                            {booking.client_firstname.charAt(0)}{booking.client_name.charAt(0)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                                {booking.client_firstname} {booking.client_name}
                              </h3>
                              <div className="flex gap-2">
                                <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border self-start ${
                                  booking.booking_status === 'confirmed' 
                                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200'
                                    : booking.booking_status === 'cancelled'
                                    ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-red-200'
                                    : 'bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700 border-orange-200'
                                }`}>
                                  {booking.booking_status === 'confirmed' ? '✅ Confirmée' : 
                                   booking.booking_status === 'cancelled' ? '❌ Annulée' : '⏳ En attente'}
                                </div>
                                <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border self-start ${getPaymentStatusColor(booking)}`}>
                                  {getPaymentStatusText(booking)}
                                </div>
                              </div>
                            </div>
                            
                            {assignedUser && (
                              <div className="flex items-center gap-2 mb-2 text-xs sm:text-sm text-indigo-600 bg-indigo-50 rounded-lg px-2 py-1 w-fit">
                                <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="font-medium">{assignedUser.full_name}</span>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                                <span>{booking.time.slice(0, 5)} ({booking.duration_minutes}min)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" />
                                <span>{booking.quantity} {getPluralUnitName(booking, booking.quantity)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                                <span className="truncate">{booking.client_email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 flex-shrink-0" />
                                <a 
                                  href={`tel:${booking.client_phone}`}
                                  className="text-orange-600 hover:text-orange-800 hover:underline transition-colors font-medium"
                                  title={`Appeler ${booking.client_phone}`}
                                >
                                  {booking.client_phone}
                                </a>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-3">
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                                <span className="font-medium text-green-600 text-xs sm:text-sm">
                                  {booking.payment_amount?.toFixed(2) || '0.00'}€ / {booking.total_amount.toFixed(2)}€
                                </span>
                              </div>
                              {booking.notes && (
                                <div className="flex items-center gap-1 text-amber-600">
                                  <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span className="text-xs">Note</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 sm:gap-3 self-start sm:self-center">
                          <button
                            onClick={() => setSelectedBookingDetails(booking)}
                            className="p-2 sm:p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg sm:rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-110 shadow-lg flex items-center justify-center"
                            title="Voir les détails"
                          >
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => onEditBooking(booking)}
                            className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-110 shadow-lg flex items-center justify-center"
                            title="Modifier"
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBooking(booking.id, `${booking.client_firstname} ${booking.client_name}`)}
                            className="p-2 sm:p-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg sm:rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-110 shadow-lg flex items-center justify-center"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {bookings.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Aucune réservation</h3>
                  <p className="text-sm sm:text-base text-gray-500">Aucune réservation pour ce service</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Utiliser le portail React
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return ReactDOM.createPortal(listModalContent, modalRoot);
}
