import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { CalendarGrid } from '../components/Calendar/CalendarGrid';
import { BookingModal } from '../components/Calendar/BookingModal';
import { UnavailabilityModal } from '../components/Calendar/UnavailabilityModal';
import { useBookings } from '../hooks/useBookings';
import { useUnavailabilities } from '../hooks/useUnavailabilities';
import { Booking } from '../types';

export function CalendarPage() {
  console.log('🔍 CalendarPage - Rendu');
  
  const [currentDate] = useState(new Date());
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [unavailabilityModalOpen, setUnavailabilityModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  
  const { 
    bookings, 
    loading: bookingsLoading, 
    refetch: refetchBookings,
    deleteBooking: deleteBookingFromHook,
    updateBooking,
    addBooking
  } = useBookings();

  const {
    unavailabilities,
    loading: unavailabilitiesLoading,
    refetch: refetchUnavailabilities,
    addUnavailability,
    deleteUnavailability: deleteUnavailabilityFromHook
  } = useUnavailabilities();

  useEffect(() => {
    const handleRefreshBookings = () => {
      console.log('📢 CalendarPage - Événement refreshBookings reçu');
      refetchBookings();
    };

    const handleRefreshUnavailabilities = () => {
      console.log('📢 CalendarPage - Événement refreshUnavailabilities reçu');
      refetchUnavailabilities();
    };

    window.addEventListener('refreshBookings', handleRefreshBookings);
    window.addEventListener('refreshUnavailabilities', handleRefreshUnavailabilities);

    return () => {
      window.removeEventListener('refreshBookings', handleRefreshBookings);
      window.removeEventListener('refreshUnavailabilities', handleRefreshUnavailabilities);
    };
  }, [refetchBookings, refetchUnavailabilities]);

  const handleTimeSlotClick = (date: string, time: string) => {
    console.log('🔍 CalendarPage.handleTimeSlotClick - Date:', date, 'Time:', time);
    setSelectedDate(date);
    setSelectedTime(time);
    setEditingBooking(null);
    setBookingModalOpen(true);
  };

  const handleBookingClick = (booking: Booking) => {
    console.log('🔍 CalendarPage.handleBookingClick - Booking:', booking);
    setEditingBooking(booking);
    setSelectedDate(booking.date);
    setSelectedTime(booking.time);
    setBookingModalOpen(true);
  };

  const handleDeleteBooking = async (bookingId: string) => {
    console.log('🗑️ CalendarPage.handleDeleteBooking - ID:', bookingId);
    try {
      await deleteBookingFromHook(bookingId);
      console.log('✅ CalendarPage.handleDeleteBooking - Suppression réussie');
    } catch (error) {
      console.error('❌ CalendarPage.handleDeleteBooking - Erreur:', error);
      throw error;
    }
  };

  const handleDeleteUnavailability = async (unavailabilityId: string) => {
    console.log('🗑️ CalendarPage.handleDeleteUnavailability - ID:', unavailabilityId);
    try {
      await deleteUnavailabilityFromHook(unavailabilityId);
      console.log('✅ CalendarPage.handleDeleteUnavailability - Suppression réussie');
    } catch (error) {
      console.error('❌ CalendarPage.handleDeleteUnavailability - Erreur:', error);
      throw error;
    }
  };

  const handleAddUnavailability = (date?: string) => {
    console.log('🔍 CalendarPage.handleAddUnavailability - Date:', date);
    if (date) {
      setSelectedDate(date);
    }
    setUnavailabilityModalOpen(true);
  };

  const handleSaveUnavailability = async (unavailabilityData: any) => {
    console.log('💾 CalendarPage.handleSaveUnavailability - Data:', unavailabilityData);
    try {
      await addUnavailability(unavailabilityData);
      console.log('✅ CalendarPage.handleSaveUnavailability - Création réussie');
      setUnavailabilityModalOpen(false);
    } catch (error) {
      console.error('❌ CalendarPage.handleSaveUnavailability - Erreur:', error);
      throw error;
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <CalendarGrid
        currentDate={currentDate}
        onTimeSlotClick={handleTimeSlotClick}
        onBookingClick={handleBookingClick}
        bookings={bookings}
        unavailabilities={unavailabilities}
        loading={bookingsLoading || unavailabilitiesLoading}
        onDeleteBooking={handleDeleteBooking}
        onDeleteUnavailability={handleDeleteUnavailability}
        onAddUnavailability={handleAddUnavailability}
      />

      <button
        onClick={() => handleAddUnavailability()}
        className="fixed bottom-24 left-6 z-40 p-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full hover:from-red-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-110 shadow-2xl border-2 border-white/20 backdrop-blur-sm"
        title="Ajouter une indisponibilité"
        style={{ 
          bottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))',
          left: 'calc(1.5rem + env(safe-area-inset-left, 0px))'
        }}
      >
        <Plus className="w-6 h-6" />
      </button>

      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => {
          setBookingModalOpen(false);
          setEditingBooking(null);
        }}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        editingBooking={editingBooking}
        onSave={async (bookingData) => {
          if (editingBooking) {
            await updateBooking(editingBooking.id, bookingData);
          } else {
            await addBooking(bookingData);
          }
          setBookingModalOpen(false);
          setEditingBooking(null);
        }}
      />

      <UnavailabilityModal
        isOpen={unavailabilityModalOpen}
        onClose={() => setUnavailabilityModalOpen(false)}
        onSave={handleSaveUnavailability}
        selectedDate={selectedDate}
      />
    </div>
  );
}
