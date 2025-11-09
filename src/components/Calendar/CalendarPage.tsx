import React, { useState, useEffect, useRef } from 'react';
import { CalendarGrid } from './CalendarGrid';
import { BookingsList } from './BookingsList';
import { ClientsPage } from '../Clients/ClientsPage';
import BookingModal from '../BookingModal/BookingModal';
import { UnavailabilityModal } from './UnavailabilityModal';
import { useBookings } from '../../hooks/useBookings';
import { useUnavailabilities } from '../../hooks/useUnavailabilities';
import { useTeam } from '../../hooks/useTeam';
import { useTeamMembers } from '../../hooks/useTeamMembers';
import { usePlugins } from '../../hooks/usePlugins';
import { PermissionGate, UsageLimitIndicator } from '../UI/PermissionGate';
import { Booking } from '../../types';
import { UserCheck, X, Ban, RotateCcw, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { bookingEvents } from '../../lib/bookingEvents';
import { unavailabilityEvents } from '../../lib/unavailabilityEvents';

interface CalendarPageProps {
  view?: 'calendar' | 'list' | 'clients';
}

export function CalendarPage({ view = 'calendar' }: CalendarPageProps) {
  const [currentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUnavailabilityModalOpen, setIsUnavailabilityModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('');
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState<string>('all');
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  
  const { bookings, loading, addBooking, updateBooking, deleteBooking, refetch } = useBookings();
  const { unavailabilities, addUnavailability, updateUnavailability, deleteUnavailability, refetch: refetchUnavailabilities } = useUnavailabilities();
  
  const { hasPermission, canEditBooking, canDeleteBooking, getUsageLimits, isOwner } = useTeam();
  const { teamMembers, loading: membersLoading } = useTeamMembers();
  const { hasPluginAccess } = usePlugins();

  const [canViewTeamFilter, setCanViewTeamFilter] = useState(false);
  const [isMultiUserActive, setIsMultiUserActive] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const multiUserActive = await hasPluginAccess('multi-user');
      setIsMultiUserActive(multiUserActive);

      if (isOwner && multiUserActive) {
        setCanViewTeamFilter(true);
      } else if (multiUserActive) {
        const hasFilterPermission = hasPermission('view_team_filter');
        setCanViewTeamFilter(hasFilterPermission);
      } else {
        setCanViewTeamFilter(false);
      }
    };

    checkAccess();
  }, [hasPluginAccess, isOwner, hasPermission]);

  // Vérifier si on doit ouvrir une réservation depuis une notification
  const hasCheckedSessionStorage = useRef(false);

  useEffect(() => {
    // Ne vérifier qu'une fois que les bookings sont chargés
    if (loading || bookings.length === 0) return;

    const openBookingId = sessionStorage.getItem('openBookingId');
    if (openBookingId && !hasCheckedSessionStorage.current) {
      console.log('📖 CalendarPage - Ouverture de la réservation depuis notification:', openBookingId);
      hasCheckedSessionStorage.current = true;

      // Chercher la réservation
      const booking = bookings.find(b => b.id === openBookingId);

      if (booking) {
        console.log('✅ Réservation trouvée, ouverture du modal:', booking);
        setEditingBooking(booking);
        setIsModalOpen(true);

        // Nettoyer le sessionStorage
        sessionStorage.removeItem('openBookingId');
      } else {
        console.log('⚠️ Réservation non trouvée dans les bookings actuels, ID:', openBookingId);
        // Ne pas nettoyer le sessionStorage si la réservation n'est pas trouvée
        // pour réessayer plus tard
      }
    }
  }, [bookings, loading]);

  // Réinitialiser le flag quand le composant se démonte
  useEffect(() => {
    return () => {
      hasCheckedSessionStorage.current = false;
    };
  }, []);

  useEffect(() => {
    const handleBookingChange = (data: any) => {
      refetch();
    };

    const handleUnavailabilityChange = () => {
      console.log('📢 CalendarPage - Événement unavailability reçu, rafraîchissement...');
      refetchUnavailabilities();
    };

    bookingEvents.on('bookingCreated', handleBookingChange);
    bookingEvents.on('bookingUpdated', handleBookingChange);
    bookingEvents.on('bookingDeleted', handleBookingChange);
    
    unavailabilityEvents.on('unavailabilityCreated', handleUnavailabilityChange);
    unavailabilityEvents.on('unavailabilityUpdated', handleUnavailabilityChange);
    unavailabilityEvents.on('unavailabilityDeleted', handleUnavailabilityChange);

    return () => {
      bookingEvents.off('bookingCreated', handleBookingChange);
      bookingEvents.off('bookingUpdated', handleBookingChange);
      bookingEvents.off('bookingDeleted', handleBookingChange);
      unavailabilityEvents.off('unavailabilityCreated', handleUnavailabilityChange);
      unavailabilityEvents.off('unavailabilityUpdated', handleUnavailabilityChange);
      unavailabilityEvents.off('unavailabilityDeleted', handleUnavailabilityChange);
    };
  }, [refetch, refetchUnavailabilities]);

  const usageLimits = getUsageLimits();
  const todayBookingsCount = bookings.filter(b => 
    b.date === new Date().toISOString().split('T')[0]
  ).length;

  const filteredBookings = selectedTeamMember === 'all' 
    ? bookings 
    : bookings.filter(b => {
        if (selectedTeamMember === 'unassigned') {
          return !b.assigned_user_id;
        }
        return b.assigned_user_id === selectedTeamMember;
      });

  const filteredUnavailabilities = selectedTeamMember === 'all'
    ? unavailabilities
    : unavailabilities.filter(u => {
        if (selectedTeamMember === 'unassigned') {
          return !u.assigned_user_id;
        }
        return u.assigned_user_id === selectedTeamMember;
      });

  const handleTimeSlotClick = (date: string, time: string) => {
    if (!hasPermission('create_booking')) {
      alert('Vous n\'avez pas la permission de créer des réservations');
      return;
    }
    
    if (usageLimits.maxBookingsPerDay && todayBookingsCount >= usageLimits.maxBookingsPerDay) {
      alert(`Limite atteinte: ${usageLimits.maxBookingsPerDay} réservations par jour maximum pour votre rôle`);
      return;
    }
    
    setSelectedDate(date);
    setSelectedTime(time);
    setIsModalOpen(true);
  };

  const handleAddUnavailability = (date?: string) => {
    if (date) {
      setSelectedDate(date);
    }
    setIsUnavailabilityModalOpen(true);
  };

  const handleBookingClick = (booking: Booking) => {
    if (!canEditBooking(booking)) {
      alert('Vous n\'avez pas la permission de modifier cette réservation');
      return;
    }
    
    setSelectedDate(booking.date);
    setSelectedTime(booking.time);
    setEditingBooking(booking);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBooking(null);
  };

  const handleDeleteBooking = async (bookingId: string) => {
    console.log('🔍 CalendarPage.handleDeleteBooking - ID:', bookingId);
    
    const booking = bookings.find(b => b.id === bookingId);
    if (booking && !canDeleteBooking(booking)) {
      alert('Vous n\'avez pas la permission de supprimer cette réservation');
      return;
    }
    
    console.log('🔄 CalendarPage.handleDeleteBooking - Appel deleteBooking du hook...');
    try {
      await deleteBooking(bookingId);
      console.log('✅ CalendarPage.handleDeleteBooking - Suppression réussie');
      await refetch();
      console.log('✅ CalendarPage.handleDeleteBooking - Rafraîchissement terminé');
    } catch (error) {
      console.error('❌ CalendarPage.handleDeleteBooking - Erreur:', error);
      throw error;
    }
  };

  const handleDeleteUnavailability = async (unavailabilityId: string) => {
    try {
      console.log('🗑️ CalendarPage.handleDeleteUnavailability - ID:', unavailabilityId);
      await deleteUnavailability(unavailabilityId);
      console.log('✅ CalendarPage.handleDeleteUnavailability - Suppression terminée');
    } catch (error) {
      console.error('❌ CalendarPage.handleDeleteUnavailability - Erreur:', error);
      alert('Erreur lors de la suppression de l\'indisponibilité');
      throw error;
    }
  };

  const handleBookingSuccess = async () => {
    handleCloseModal();
  };

  const handleSaveUnavailability = async (unavailabilityData: any) => {
    await addUnavailability(unavailabilityData);
  };

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

  const shouldShowTeamFilter = canViewTeamFilter && isMultiUserActive && teamMembers.length > 0 && view === 'calendar';

  return (
    <div 
      className="h-full flex flex-col overflow-y-auto scrollable-area" 
      style={{ 
        margin: 0, 
        padding: 0,
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y'
      }}
    >
      {shouldShowTeamFilter && (
        <div className="bg-white border-b border-gray-200">
          {/* Bouton Filtres repliable */}
          <div className="px-4 py-3">
            <button
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-xl transition-all duration-300 border border-purple-200"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-700">
                  Filtres
                  {selectedTeamMember !== 'all' && (
                    <span className="ml-2 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                      1
                    </span>
                  )}
                </span>
              </div>
              {isFiltersExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>

          {/* Panneau de filtres dépliable */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isFiltersExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Filtre par membre */}
              <div className="bg-white rounded-xl border border-gray-200 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-sm text-gray-700">Filtrer par membre</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <select
                    value={selectedTeamMember}
                    onChange={(e) => setSelectedTeamMember(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={membersLoading}
                  >
                    <option value="all">
                      {membersLoading ? 'Chargement...' : `Tous les membres (${teamMembers.length})`}
                    </option>
                    {teamMembers.map(member => {
                      const displayName = getMemberDisplayName(member);
                      return (
                        <option key={member.user_id} value={member.user_id}>
                          {displayName}
                          {member.email && displayName !== member.email ? ` (${member.email})` : ''}
                        </option>
                      );
                    })}
                    <option value="unassigned">Non assigné</option>
                  </select>
                  
                  {selectedTeamMember !== 'all' && (
                    <button
                      onClick={() => setSelectedTeamMember('all')}
                      className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-300"
                      title="Réinitialiser"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {selectedTeamMember !== 'all' && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-purple-700 bg-purple-50 px-3 py-2 rounded-lg">
                    <span className="font-medium">Filtre actif :</span>
                    <span className="flex-1 truncate">
                      {selectedTeamMember === 'unassigned' 
                        ? 'Non assignées'
                        : (() => {
                            const member = teamMembers.find(m => m.user_id === selectedTeamMember);
                            return member ? getMemberDisplayName(member) : 'Inconnu';
                          })()
                      }
                    </span>
                    <span className="ml-auto font-bold">
                      {filteredBookings.length} réservation(s)
                    </span>
                  </div>
                )}
              </div>

              {/* Bouton Indisponibilité */}
              <button
                onClick={() => handleAddUnavailability()}
                className="w-full px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
              >
                <Ban className="w-5 h-5" />
                <span>Ajouter une indisponibilité</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1" style={{ margin: 0, padding: 0 }}>
        <PermissionGate permission="view_calendar">
          {view === 'calendar' ? (
            <UsageLimitIndicator currentUsage={todayBookingsCount} permission="create_booking">
              <CalendarGrid
                currentDate={currentDate}
                onTimeSlotClick={handleTimeSlotClick}
                onBookingClick={handleBookingClick}
                bookings={filteredBookings}
                unavailabilities={filteredUnavailabilities}
                loading={loading}
                onDeleteBooking={handleDeleteBooking}
                onAddUnavailability={handleAddUnavailability}
                onDeleteUnavailability={handleDeleteUnavailability}
              />
            </UsageLimitIndicator>
          ) : view === 'list' ? (
            <PermissionGate permission="view_calendar">
              <BookingsList
                onEditBooking={handleBookingClick}
              />
            </PermissionGate>
          ) : (
            <PermissionGate permission="view_clients">
              <ClientsPage />
            </PermissionGate>
          )}
        </PermissionGate>
      </div>
      
      {isModalOpen && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          editingBooking={editingBooking}
          onSuccess={handleBookingSuccess}
        />
      )}

      {isUnavailabilityModalOpen && (
        <UnavailabilityModal
          isOpen={isUnavailabilityModalOpen}
          onClose={() => setIsUnavailabilityModalOpen(false)}
          onSave={handleSaveUnavailability}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
}
