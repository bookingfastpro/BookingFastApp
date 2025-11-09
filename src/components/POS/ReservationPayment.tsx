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
                className="w-full bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300 text-left group border-2 border-purple-100 hover:border-purple-300"
              >
                {/* En-tête avec client et prix */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-lg">
                      {booking.client_firstname?.charAt(0)}{booking.client_name?.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-gray-900 text-base truncate">
                        {booking.client_firstname} {booking.client_name}
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {booking.client_email}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {remaining.toFixed(2)}€
                    </div>
                    <div className="text-xs text-gray-500">
                      sur {booking.total_amount.toFixed(2)}€
                    </div>
                  </div>
                </div>

                {/* Informations de la réservation avec fond coloré */}
                <div className="space-y-2 text-sm bg-white/60 rounded-xl p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <div className="w-7 h-7 bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <span className="truncate font-medium">{formatDate(booking.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">{formatTime(booking.time)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <div className="w-7 h-7 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="truncate font-medium">{booking.service?.name}</span>
                  </div>
                </div>

                {/* Statut de paiement */}
                <div className="mt-3 pt-3 border-t border-purple-100">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${getPaymentStatusColor(booking)}`}>
                    {getPaymentStatusText(booking)}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
