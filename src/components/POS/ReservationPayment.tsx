import React, { useState, useMemo } from 'react';
import { Calendar, Clock, User, Search, Euro, ChevronRight } from 'lucide-react';
import { Booking } from '../../types';
import { Client } from '../../types/client';

interface ReservationPaymentProps {
  bookings: Booking[];
  clients: Client[];
  onSelectBooking: (booking: Booking) => void;
}

export function ReservationPayment({ bookings, clients, onSelectBooking }: ReservationPaymentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // ✅ CORRECTION: Filtrer les réservations annulées pour le POS
  // Dans le POS, on ne peut pas encaisser une réservation annulée
  const activeBookings = useMemo(() => {
    return bookings.filter(booking => booking.booking_status !== 'cancelled');
  }, [bookings]);

  // Filtrer les réservations avec paiement incomplet
  const unpaidBookings = useMemo(() => {
    return activeBookings.filter(booking => {
      const remaining = booking.total_amount - (booking.payment_amount || 0);
      return remaining > 0;
    });
  }, [activeBookings]);

  // Filtrer par recherche et date
  const filteredBookings = useMemo(() => {
    return unpaidBookings.filter(booking => {
      const matchesSearch = searchQuery === '' || 
        booking.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.client_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.service?.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDate = selectedDate === '' || booking.date === selectedDate;

      return matchesSearch && matchesDate;
    });
  }, [unpaidBookings, searchQuery, selectedDate]);

  // Obtenir les dates uniques pour le filtre
  const uniqueDates = useMemo(() => {
    const dates = new Set(unpaidBookings.map(b => b.date));
    return Array.from(dates).sort();
  }, [unpaidBookings]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const getPaymentStatusColor = (booking: Booking) => {
    const paid = booking.payment_amount || 0;
    const total = booking.total_amount;
    
    if (paid === 0) {
      return 'bg-red-100 text-red-700 border-red-200';
    } else if (paid < total) {
      return 'bg-orange-100 text-orange-700 border-orange-200';
    }
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const getPaymentStatusText = (booking: Booking) => {
    const paid = booking.payment_amount || 0;
    const total = booking.total_amount;
    
    if (paid === 0) {
      return '❌ Non payé';
    } else if (paid < total) {
      return '💳 Acompte';
    }
    return '💰 Payé';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* En-tête */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          Paiement de réservations
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          {filteredBookings.length} réservation{filteredBookings.length > 1 ? 's' : ''} en attente de paiement
        </p>
      </div>

      {/* Filtres */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 sm:w-5 h-4 sm:h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un client ou service..."
            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
          />
        </div>

        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
        >
          <option value="">Toutes les dates</option>
          {uniqueDates.map(date => (
            <option key={date} value={date}>
              {formatDate(date)}
            </option>
          ))}
        </select>
      </div>

      {/* Liste des réservations */}
      <div className="space-y-3 sm:space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Calendar className="w-12 sm:w-16 h-12 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-gray-600">
              {searchQuery || selectedDate
                ? 'Aucune réservation ne correspond à votre recherche'
                : 'Aucune réservation en attente de paiement'
              }
            </p>
          </div>
        ) : (
          filteredBookings.map(booking => {
            const remaining = booking.total_amount - (booking.payment_amount || 0);
            
            return (
              <button
                key={booking.id}
                onClick={() => onSelectBooking(booking)}
                className="w-full bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 text-left group"
              >
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Client */}
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                        {booking.client_firstname?.charAt(0)}{booking.client_name?.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-gray-900 text-sm sm:text-base truncate">
                          {booking.client_firstname} {booking.client_name}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 truncate">
                          {booking.client_email}
                        </div>
                      </div>
                    </div>

                    {/* Détails */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-3 sm:w-4 h-3 sm:h-4 text-purple-500 flex-shrink-0" />
                        <span className="truncate">{formatDate(booking.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-3 sm:w-4 h-3 sm:h-4 text-blue-500 flex-shrink-0" />
                        <span>{formatTime(booking.time)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 sm:col-span-2">
                        <User className="w-3 sm:w-4 h-3 sm:h-4 text-green-500 flex-shrink-0" />
                        <span className="truncate">{booking.service?.name}</span>
                      </div>
                    </div>

                    {/* Statut de paiement */}
                    <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(booking)}`}>
                        {getPaymentStatusText(booking)}
                      </span>
                      {booking.payment_amount > 0 && (
                        <span className="text-xs text-gray-600">
                          Payé: {booking.payment_amount.toFixed(2)}€
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Montant et flèche */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-bold text-purple-600">
                        {remaining.toFixed(2)}€
                      </div>
                      <div className="text-xs text-gray-600">
                        sur {booking.total_amount.toFixed(2)}€
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-purple-600 transition-colors" />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
