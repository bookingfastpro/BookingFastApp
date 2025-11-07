import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Euro, Search, Filter, ChevronDown, ChevronUp, X, FileText, UserCheck } from 'lucide-react';
import { useBookings } from '../../hooks/useBookings';
import { useTeam } from '../../hooks/useTeam';
import { useTeamMembers } from '../../hooks/useTeamMembers';
import { usePlugins } from '../../hooks/usePlugins';
import { Booking } from '../../types';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { bookingEvents } from '../../lib/bookingEvents';
import { formatTime } from '../../utils/dateUtils';

interface BookingsListProps {
  onEditBooking: (booking: Booking) => void;
}

export function BookingsList({ onEditBooking }: BookingsListProps) {
  const { bookings, loading, refetch } = useBookings();
  const { canEditBooking, isOwner } = useTeam();
  const { teamMembers, loading: membersLoading } = useTeamMembers();
  const { hasPluginAccess } = usePlugins();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState<string>('all');
  const [canViewTeamFilter, setCanViewTeamFilter] = useState(false);
  const [isMultiUserActive, setIsMultiUserActive] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const multiUserActive = await hasPluginAccess('multi-user');
      setIsMultiUserActive(multiUserActive);
      
      if (isOwner && multiUserActive) {
        setCanViewTeamFilter(true);
      }
    };

    checkAccess();
  }, [hasPluginAccess, isOwner]);

  useEffect(() => {
    const handleBookingChange = () => {
      console.log('📋 BookingsList - Événement booking détecté, rafraîchissement...');
      refetch();
    };

    bookingEvents.on('bookingCreated', handleBookingChange);
    bookingEvents.on('bookingUpdated', handleBookingChange);
    bookingEvents.on('bookingDeleted', handleBookingChange);

    const handleRefresh = () => {
      console.log('🔄 BookingsList - Rafraîchissement global demandé');
      refetch();
    };
    window.addEventListener('refreshBookings', handleRefresh);

    return () => {
      bookingEvents.off('bookingCreated', handleBookingChange);
      bookingEvents.off('bookingUpdated', handleBookingChange);
      bookingEvents.off('bookingDeleted', handleBookingChange);
      window.removeEventListener('refreshBookings', handleRefresh);
    };
  }, [refetch]);

  const getMemberDisplayName = (member: typeof teamMembers[0]) => {
    if (member.firstname && member.lastname) {
      return `${member.firstname} ${member.lastname}`;
    }
    if (member.full_name) {
      return member.full_name;
    }
    if (member.firstname) {
      return member.firstname;
    }
    return member.email || 'Membre sans nom';
  };

  const getFilteredBookings = () => {
    let filtered = bookings;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.booking_status === statusFilter);
    }

    if (selectedTeamMember !== 'all') {
      filtered = filtered.filter(b => {
        if (selectedTeamMember === 'unassigned') {
          return !b.assigned_user_id;
        }
        return b.assigned_user_id === selectedTeamMember;
      });
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(b => {
        const bookingDate = new Date(b.date);
        
        switch (dateFilter) {
          case 'today':
            return bookingDate.toDateString() === today.toDateString();
          case 'week':
            const weekFromNow = new Date(today);
            weekFromNow.setDate(today.getDate() + 7);
            return bookingDate >= today && bookingDate <= weekFromNow;
          case 'month':
            const monthFromNow = new Date(today);
            monthFromNow.setMonth(today.getMonth() + 1);
            return bookingDate >= today && bookingDate <= monthFromNow;
          default:
            return true;
        }
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b =>
        b.client_firstname?.toLowerCase().includes(term) ||
        b.client_name?.toLowerCase().includes(term) ||
        b.client_email?.toLowerCase().includes(term) ||
        b.service?.name?.toLowerCase().includes(term) ||
        (b.custom_service_data?.name && b.custom_service_data.name.toLowerCase().includes(term))
      );
    }

    return filtered.sort((a, b) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return b.time.localeCompare(a.time);
    });
  };

  const filteredBookings = getFilteredBookings();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200">
            ✅ Confirmée
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border border-yellow-200">
            ⏳ En attente
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border border-red-200">
            ❌ Annulée
          </span>
        );
      default:
        return null;
    }
  };

  const getPaymentStatusBadge = (booking: Booking) => {
    const totalAmount = booking.total_amount;
    const paidAmount = booking.payment_amount || 0;
    const remainingAmount = totalAmount - paidAmount;

    if (paidAmount >= totalAmount) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200">
          💰 Payé
        </span>
      );
    } else if (paidAmount > 0) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200">
          💳 Partiel ({paidAmount.toFixed(2)}€)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border border-red-200">
          ⚠️ Non payé
        </span>
      );
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const shouldShowTeamFilter = canViewTeamFilter && isMultiUserActive && teamMembers.length > 0;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-lg p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
              Liste des réservations
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {filteredBookings.length} réservation{filteredBookings.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par nom, email, service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                showFilters
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span className="hidden sm:inline">Filtres</span>
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {showFilters && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-lg animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Statut</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="confirmed">Confirmées</option>
                    <option value="pending">En attente</option>
                    <option value="cancelled">Annulées</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Période</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  >
                    <option value="all">Toutes les dates</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="week">Cette semaine</option>
                    <option value="month">Ce mois</option>
                  </select>
                </div>

                {shouldShowTeamFilter && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Membre</label>
                    <select
                      value={selectedTeamMember}
                      onChange={(e) => setSelectedTeamMember(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      disabled={membersLoading}
                    >
                      <option value="all">Tous les membres</option>
                      {teamMembers.map(member => (
                        <option key={member.user_id} value={member.user_id}>
                          {getMemberDisplayName(member)}
                        </option>
                      ))}
                      <option value="unassigned">Non assigné</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all' || selectedTeamMember !== 'all') && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-600">Filtres actifs:</span>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs hover:bg-purple-200 transition-colors"
                >
                  Recherche: "{searchTerm}"
                  <X className="w-3 h-3" />
                </button>
              )}
              {statusFilter !== 'all' && (
                <button
                  onClick={() => setStatusFilter('all')}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200 transition-colors"
                >
                  Statut: {statusFilter}
                  <X className="w-3 h-3" />
                </button>
              )}
              {dateFilter !== 'all' && (
                <button
                  onClick={() => setDateFilter('all')}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs hover:bg-green-200 transition-colors"
                >
                  Période: {dateFilter}
                  <X className="w-3 h-3" />
                </button>
              )}
              {selectedTeamMember !== 'all' && (
                <button
                  onClick={() => setSelectedTeamMember('all')}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 text-pink-700 rounded-lg text-xs hover:bg-pink-200 transition-colors"
                >
                  Membre: {selectedTeamMember === 'unassigned' ? 'Non assigné' : getMemberDisplayName(teamMembers.find(m => m.user_id === selectedTeamMember)!)}
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredBookings.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
              <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune réservation</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' || selectedTeamMember !== 'all'
                  ? 'Aucune réservation ne correspond à vos critères'
                  : 'Commencez par créer votre première réservation'}
              </p>
            </div>
          </div>
        ) : (
          filteredBookings.map((booking) => {
            const isExpanded = expandedBooking === booking.id;
            const canEdit = canEditBooking(booking);
            const assignedMember = booking.assigned_user_id 
              ? teamMembers.find(m => m.user_id === booking.assigned_user_id)
              : null;

            return (
              <div
                key={booking.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {booking.client_firstname} {booking.client_name}
                        </h3>
                        {getStatusBadge(booking.booking_status || 'pending')}
                        {getPaymentStatusBadge(booking)}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-500" />
                          <span className="font-medium">
                            {new Date(booking.date).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span>{formatTime(booking.time)} ({booking.duration_minutes} min)</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedBooking(isExpanded ? null : booking.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3">
                      <div className="text-xs text-purple-600 font-medium mb-1">Service</div>
                      <div className="font-bold text-gray-900 text-sm">
                        {(() => {
                          if (booking.service?.name === 'Service personnalisé' && booking.custom_service_data?.name) {
                            return booking.custom_service_data.name;
                          }
                          return booking.service?.name || 'Service inconnu';
                        })()}
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3">
                      <div className="text-xs text-green-600 font-medium mb-1">Montant</div>
                      <div className="font-bold text-gray-900 text-sm">{booking.total_amount.toFixed(2)}€</div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 animate-fadeIn">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Email</div>
                          <div className="font-medium text-gray-900 text-sm">{booking.client_email}</div>
                        </div>
                        {booking.client_phone && (
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Téléphone</div>
                            <div className="font-medium text-gray-900 text-sm">{booking.client_phone}</div>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-xs text-gray-600 mb-1">Quantité</div>
                        <div className="font-medium text-gray-900 text-sm">
                          {booking.quantity} {getPluralUnitName(booking, booking.quantity)}
                        </div>
                      </div>

                      {assignedMember && (
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-3">
                          <div className="flex items-center gap-2 text-blue-700">
                            <UserCheck className="w-4 h-4" />
                            <div>
                              <div className="text-xs font-medium">Assigné à</div>
                              <div className="font-bold text-sm">{getMemberDisplayName(assignedMember)}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {booking.notes && (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-3">
                          <div className="flex items-start gap-2 text-yellow-700">
                            <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="text-xs font-medium mb-1">Notes internes</div>
                              <div className="text-sm whitespace-pre-wrap">{booking.notes}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {booking.transactions && booking.transactions.length > 0 && (
                        <div>
                          <div className="text-xs text-gray-600 mb-2 font-medium">Paiements</div>
                          <div className="space-y-2">
                            {booking.transactions.map((transaction, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center gap-2">
                                  <Euro className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-medium">{transaction.amount.toFixed(2)}€</span>
                                  <span className="text-xs text-gray-600">
                                    ({transaction.method === 'card' ? 'Carte' : 
                                      transaction.method === 'cash' ? 'Espèces' : 
                                      transaction.method === 'check' ? 'Chèque' : 
                                      transaction.method === 'transfer' ? 'Virement' : 'Stripe'})
                                  </span>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  transaction.status === 'completed' 
                                    ? 'bg-green-100 text-green-700'
                                    : transaction.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {transaction.status === 'completed' ? 'Validé' :
                                   transaction.status === 'pending' ? 'En attente' : 'Annulé'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {canEdit && (
                        <button
                          onClick={() => onEditBooking(booking)}
                          className="w-full mt-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-3 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
                        >
                          Modifier la réservation
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
