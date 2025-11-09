import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, Sparkles, Calendar as CalendarIcon, ChevronDown, Ban, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Booking, Unavailability } from '../../types';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import { ServiceBookingModal } from './ServiceBookingModal';
import { DatePicker } from './DatePicker';
import { isSupabaseConfigured } from '../../lib/supabase';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { bookingEvents } from '../../lib/bookingEvents';
import { formatTime } from '../../utils/dateUtils';

interface CalendarGridProps {
  currentDate: Date;
  onTimeSlotClick: (date: string, time: string) => void;
  onBookingClick: (booking: Booking) => void;
  bookings: Booking[];
  unavailabilities: Unavailability[];
  loading: boolean;
  onDeleteBooking: (bookingId: string) => void;
  onDeleteUnavailability: (unavailabilityId: string) => void;
  onAddUnavailability: (date?: string) => void;
  filterButton?: React.ReactNode;
}

interface ServiceGroup {
  serviceId: string;
  serviceName: string;
  timeIndex: number;
  duration: number;
  bookings: Booking[];
  startTime: string;
}

interface UnavailabilityBlock {
  id: string;
  timeIndex: number;
  duration: number;
  reason?: string;
  startTime: string;
  endTime: string;
}

interface ColumnLayout {
  column: number;
  totalColumns: number;
  group: ServiceGroup;
}

export function CalendarGrid({
  currentDate,
  onTimeSlotClick,
  onBookingClick,
  bookings: allBookings,
  unavailabilities,
  loading,
  onDeleteBooking,
  onDeleteUnavailability,
  onAddUnavailability,
  filterButton
}: CalendarGridProps) {
  const today = new Date();
  const todayString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [viewMonth, setViewMonth] = useState<Date>(today);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [selectedServiceBookings, setSelectedServiceBookings] = useState<Booking[]>([]);
  const [selectedServiceName, setSelectedServiceName] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [deletingUnavailabilityId, setDeletingUnavailabilityId] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timeGridRef = useRef<HTMLDivElement>(null);
  const monthButtonRef = useRef<HTMLButtonElement>(null);
  const { settings } = useBusinessSettings();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const selectedDateString = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`;

  const getTodayString = (): string => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
  };

  const isToday = (date: Date): boolean => {
    const now = new Date();
    return date.getFullYear() === now.getFullYear() &&
           date.getMonth() === now.getMonth() &&
           date.getDate() === now.getDate();
  };

  const isSelected = (date: Date): boolean => {
    return date.getFullYear() === selectedDate.getFullYear() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getDate() === selectedDate.getDate();
  };

  const generateDaysForMonth = () => {
    const days = [];
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

    const today = new Date();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = new Date(year, month, -i);
      const dayDateOnly = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      days.push({
        date: day,
        isToday: isToday(day),
        isSelected: isSelected(day),
        isCurrentMonth: false,
        isPast: dayDateOnly < todayDateOnly,
        dateString: `${day.getFullYear()}-${(day.getMonth() + 1).toString().padStart(2, '0')}-${day.getDate().toString().padStart(2, '0')}`
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      days.push({
        date: date,
        isToday: isToday(date),
        isSelected: isSelected(date),
        isCurrentMonth: true,
        isPast: dayDateOnly < todayDateOnly,
        dateString: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
      });
    }

    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      const dayDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      days.push({
        date: date,
        isToday: isToday(date),
        isSelected: isSelected(date),
        isCurrentMonth: false,
        isPast: dayDateOnly < todayDateOnly,
        dateString: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
      });
    }

    return days;
  };

  const days = generateDaysForMonth();

  useEffect(() => {
    const now = new Date();
    setSelectedDate(now);
    setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  }, []);

  useEffect(() => {
    const handleBookingChange = () => {
      console.log('📅 CalendarGrid - Événement booking détecté, centrage de la date...');
      setRefreshTrigger(prev => prev + 1);
      
      setTimeout(() => {
        scrollToSelectedDate(true);
        window.dispatchEvent(new CustomEvent('refreshBookings'));
      }, 100);
    };

    bookingEvents.on('bookingCreated', handleBookingChange);
    bookingEvents.on('bookingUpdated', handleBookingChange);
    bookingEvents.on('bookingDeleted', handleBookingChange);

    return () => {
      bookingEvents.off('bookingCreated', handleBookingChange);
      bookingEvents.off('bookingUpdated', handleBookingChange);
      bookingEvents.off('bookingDeleted', handleBookingChange);
    };
  }, [selectedDate, days]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newViewMonth = new Date(viewMonth);
    if (direction === 'prev') {
      newViewMonth.setMonth(viewMonth.getMonth() - 1);
    } else {
      newViewMonth.setMonth(viewMonth.getMonth() + 1);
    }
    setViewMonth(newViewMonth);
    const newSelectedDate = new Date(newViewMonth.getFullYear(), newViewMonth.getMonth(), 1);
    setSelectedDate(newSelectedDate);
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  };

  const goToMonth = (monthOffset: number) => {
    const now = new Date();
    const targetMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    setViewMonth(targetMonth);
    if (monthOffset === 0) {
      setSelectedDate(now);
    } else {
      setSelectedDate(new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1));
    }
  };

  const getQuickNavOptions = () => {
    return [
      { label: 'Ce mois', offset: 0, isCurrent: true },
      { label: 'Mois prochain', offset: 1, isCurrent: false },
      { label: 'Dans 2 mois', offset: 2, isCurrent: false },
      { label: 'Mois dernier', offset: -1, isCurrent: false }
    ];
  };

  const quickNavOptions = getQuickNavOptions();

  const isCurrentMonth = () => {
    const now = new Date();
    return viewMonth.getFullYear() === now.getFullYear() && 
           viewMonth.getMonth() === now.getMonth();
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(viewMonth);
    if (direction === 'prev') {
      newMonth.setMonth(viewMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(viewMonth.getMonth() + 1);
    }
    setViewMonth(newMonth);
    const firstDay = new Date(newMonth.getFullYear(), newMonth.getMonth(), 1);
    setSelectedDate(firstDay);
  };

  const selectDay = (date: Date) => {
    setSelectedDate(date);
    if (date.getMonth() !== viewMonth.getMonth() || date.getFullYear() !== viewMonth.getFullYear()) {
      setViewMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  };

  const handleDatePickerSelect = (date: Date) => {
    setSelectedDate(date);
    setViewMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  const generateTimeSlots = (date: Date) => {
    if (!settings) return [];
    
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const daySettings = settings.opening_hours[dayName];
    
    if (!daySettings || daySettings.closed) {
      return [];
    }
    
    let availableRanges;
    if (daySettings.ranges && Array.isArray(daySettings.ranges)) {
      availableRanges = daySettings.ranges;
    } else if (daySettings.start && daySettings.end) {
      availableRanges = [{ start: daySettings.start, end: daySettings.end }];
    } else {
      return [];
    }
    
    const allTimes = availableRanges.flatMap(range => [range.start, range.end]);
    const openingTime = allTimes.reduce((earliest, time) => time < earliest ? time : earliest);
    const closingTime = allTimes.reduce((latest, time) => time > latest ? time : latest);
    
    const allSlots = [];
    const [openHour, openMinute] = openingTime.split(':').map(Number);
    const [closeHour, closeMinute] = closingTime.split(':').map(Number);
    
    let currentHour = openHour;
    let currentMinute = openMinute;
    
    while (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute)) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      const isAvailable = availableRanges.some(range => {
        return timeString >= range.start && timeString < range.end;
      });
      
      allSlots.push({
        time: timeString,
        available: isAvailable
      });
      
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;
      }
    }
    
    return allSlots;
  };

  const timeSlots = generateTimeSlots(selectedDate);

  const isDayClosed = () => {
    if (!settings) return false;
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const daySettings = settings.opening_hours[dayName];
    return !daySettings || daySettings.closed;
  };

  const scrollToDays = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollToToday = () => {
    const now = new Date();
    if (viewMonth.getMonth() !== now.getMonth() || viewMonth.getFullYear() !== now.getFullYear()) {
      setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    }
    setSelectedDate(now);
  };

  const scrollToSelectedDate = (animated: boolean = false) => {
    console.log('🎯 scrollToSelectedDate - Début centrage, animated:', animated);
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const selectedIndex = days.findIndex(day => isSelected(day.date));
      
      console.log('🔍 scrollToSelectedDate - Index sélectionné:', selectedIndex);
      
      if (selectedIndex !== -1) {
        const firstDateElement = container.querySelector('button');
        if (firstDateElement) {
          const dateRect = firstDateElement.getBoundingClientRect();
          const dateWidth = dateRect.width;
          
          const containerStyle = window.getComputedStyle(container.firstElementChild as Element);
          const gap = parseFloat(containerStyle.gap) || 8;
          
          const totalItemWidth = dateWidth + gap;
          const itemPosition = selectedIndex * totalItemWidth;
          const containerWidth = container.clientWidth;
          const scrollPosition = itemPosition - (containerWidth / 2) + (dateWidth / 2);
          
          console.log('📐 scrollToSelectedDate - Calculs:', {
            dateWidth,
            gap,
            totalItemWidth,
            itemPosition,
            containerWidth,
            scrollPosition: Math.max(0, scrollPosition),
            animated
          });
          
          container.scrollTo({
            left: Math.max(0, scrollPosition),
            behavior: animated ? 'smooth' : 'auto'
          });
          
          console.log('✅ scrollToSelectedDate - Centrage effectué');
        }
      }
    }
  };

  useEffect(() => {
    if (isInitialLoad) {
      console.log('🚀 CalendarGrid - Chargement initial, scroll SANS animation');
      const timer = setTimeout(() => {
        scrollToSelectedDate(false);
        setIsInitialLoad(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!isInitialLoad) {
      console.log('🔄 CalendarGrid - Changement de date utilisateur, scroll AVEC animation');
      const timer = setTimeout(() => {
        scrollToSelectedDate(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedDate, viewMonth]);

  const getBookingsForDay = (date: Date) => {
    const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    const dayBookings = allBookings.filter(b => b.date === dateString);
    return dayBookings.sort((a, b) => a.time.localeCompare(b.time));
  };

  const getUnavailabilitiesForDay = (date: Date): UnavailabilityBlock[] => {
    const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    const dayUnavailabilities = unavailabilities.filter(u => u.date === dateString);
    
    return dayUnavailabilities.map(unavailability => {
      const startTime = formatTime(unavailability.start_time);
      const endTime = formatTime(unavailability.end_time);
      const timeIndex = timeSlots.findIndex(slot => slot.time === startTime);
      
      if (timeIndex === -1) return null;
      
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      const durationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
      const duration = Math.ceil(durationMinutes / 30);
      
      return {
        id: unavailability.id,
        timeIndex,
        duration,
        reason: unavailability.reason,
        startTime,
        endTime
      };
    }).filter((block): block is UnavailabilityBlock => block !== null);
  };

  const groupBookingsByServiceAndTime = (bookings: Booking[]): ServiceGroup[] => {
    const groups: ServiceGroup[] = [];
    const serviceTimeGroups = new Map<string, Booking[]>();
    
    bookings.forEach(booking => {
      const normalizedTime = formatTime(booking.time);
      const key = `${booking.service_id}-${normalizedTime}`;
      if (!serviceTimeGroups.has(key)) {
        serviceTimeGroups.set(key, []);
      }
      serviceTimeGroups.get(key)!.push(booking);
    });
    
    serviceTimeGroups.forEach((groupBookings, key) => {
      const firstBooking = groupBookings[0];
      if (!firstBooking) return;
      
      const serviceName = firstBooking.service?.name || `Service ${firstBooking.service_id.slice(0, 8)}`;
      const bookingTime = formatTime(firstBooking.time);
      const timeIndex = timeSlots.findIndex(slot => slot.time === bookingTime);
      
      if (timeIndex !== -1) {
        groups.push({
          serviceId: firstBooking.service_id,
          serviceName: serviceName,
          timeIndex,
          duration: Math.ceil(firstBooking.duration_minutes / 30),
          bookings: groupBookings,
          startTime: bookingTime
        });
      }
    });

    return groups;
  };

  const calculateColumnLayout = (groups: ServiceGroup[]): ColumnLayout[] => {
    const layouts: ColumnLayout[] = [];
    const columns: Array<{ endIndex: number }> = [];

    const sortedGroups = [...groups].sort((a, b) => a.timeIndex - b.timeIndex);

    sortedGroups.forEach(group => {
      const groupStart = group.timeIndex;
      const groupEnd = group.timeIndex + group.duration;

      let columnIndex = columns.findIndex(col => col.endIndex <= groupStart);
      
      if (columnIndex === -1) {
        columnIndex = columns.length;
        columns.push({ endIndex: groupEnd });
      } else {
        columns[columnIndex].endIndex = groupEnd;
      }

      layouts.push({
        column: columnIndex,
        totalColumns: 0,
        group
      });
    });

    const totalColumns = columns.length;
    layouts.forEach(layout => {
      layout.totalColumns = totalColumns;
    });

    return layouts;
  };

  const getBookingColor = (index: number) => {
    const colors = [
      'from-rose-400 to-pink-500',
      'from-blue-400 to-cyan-500',
      'from-purple-400 to-indigo-500',
      'from-orange-400 to-red-500',
      'from-teal-400 to-green-500',
      'from-yellow-400 to-orange-500',
    ];
    return colors[index % colors.length];
  };

  const dayBookings = getBookingsForDay(selectedDate);
  const dayUnavailabilities = timeSlots.length > 0 ? getUnavailabilitiesForDay(selectedDate) : [];
  const serviceGroups = timeSlots.length > 0 ? groupBookingsByServiceAndTime(dayBookings) : [];
  const columnLayouts = calculateColumnLayout(serviceGroups);

  const handleServiceBlockClick = (group: ServiceGroup) => {
    setSelectedServiceBookings(group.bookings);
    setSelectedServiceName(group.serviceName);
    setServiceModalOpen(true);
  };

  const handleDeleteUnavailability = async (unavailabilityId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    console.log('🗑️ CalendarGrid.handleDeleteUnavailability - Début suppression ID:', unavailabilityId);
    
    if (!confirm('Supprimer cette indisponibilité ?')) {
      console.log('❌ CalendarGrid.handleDeleteUnavailability - Annulé par utilisateur');
      return;
    }

    setDeletingUnavailabilityId(unavailabilityId);
    
    try {
      console.log('🔄 CalendarGrid.handleDeleteUnavailability - Appel onDeleteUnavailability');
      await onDeleteUnavailability(unavailabilityId);
      console.log('✅ CalendarGrid.handleDeleteUnavailability - Suppression réussie');
      
      window.dispatchEvent(new CustomEvent('refreshUnavailabilities'));
    } catch (error) {
      console.error('❌ CalendarGrid.handleDeleteUnavailability - Erreur:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setDeletingUnavailabilityId(null);
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

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Chargement du planning...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 h-full flex flex-col"
        style={{
          overflowX: 'hidden',
          overflowY: 'auto',
          touchAction: 'pan-y'
        }}
      >
        <div className="bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-lg p-3 sm:p-4 flex-shrink-0">
          {/* HEADER - Masqué sur mobile */}
          <div className="hidden md:flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
                  Planning
                </h1>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  Gestion des rendez-vous
                </div>
              </div>
            </div>
            
            <div className="text-right flex items-center gap-2">
              <div className="flex flex-col items-end">
                <div className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                  <span>
                    {selectedDate.toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
                <div className={`text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-medium ${
                  isDayClosed()
                    ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700'
                    : dayBookings.length > 0
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700'
                    : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600'
                }`}>
                  {isDayClosed() ? '🔒 Fermé' : `📅 ${dayBookings.length} rdv`}
                </div>
              </div>

              {/* Bouton filtre à côté de la date */}
              {filterButton && (
                <div>
                  {filterButton}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center mb-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => changeMonth('prev')}
                className="hidden sm:flex p-2 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 transform hover:scale-110"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>

              <button
                ref={monthButtonRef}
                onClick={() => setShowDatePicker(true)}
                className="group relative px-3 py-2 sm:px-4 sm:py-2 bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-gray-600" />
                  <span className="text-base sm:text-lg font-bold text-gray-900 capitalize">
                    {viewMonth.toLocaleDateString('fr-FR', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </button>

              <button
                onClick={() => changeMonth('next')}
                className="hidden sm:flex p-2 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 transform hover:scale-110"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="hidden sm:flex gap-1 mb-2 justify-center flex-wrap">
            {quickNavOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => goToMonth(option.offset)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300 transform hover:scale-105 ${
                  option.isCurrent && isCurrentMonth()
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                    : 'bg-white/60 text-gray-600 hover:bg-white/80 border border-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => scrollToDays('left')}
              className="hidden sm:flex p-3 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-md"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-x-auto scrollbar-hide px-1 sm:px-2 scroll-smooth mobile-optimized"
              style={{ touchAction: 'pan-x' }}
            >
              <div className="flex gap-2 sm:gap-3" style={{ width: 'max-content' }}>
                {days.map((day, index) => {
                  const dayBookingsCount = getBookingsForDay(day.date).length;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => selectDay(day.date)}
                      className={`relative flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-lg animate-fadeIn ${
                        day.isSelected
                          ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 text-white shadow-xl shadow-purple-200 animate-pulse'
                          : day.isToday
                          ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-2 border-blue-300 shadow-xl shadow-blue-200'
                          : day.isCurrentMonth
                          ? 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 border border-gray-200'
                          : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 border border-gray-200'
                      }`}
                      style={{ animationDelay: `${index * 20}ms` }}
                    >
                      <div className="text-xs font-medium">
                        {day.date.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3)}
                      </div>
                      <div className="text-sm font-bold">
                        {day.date.getDate()}
                      </div>
                      
                      {day.isToday && (
                        <div className="absolute -bottom-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      )}

                      {dayBookingsCount > 0 && (
                        <div className={`absolute -top-1 -right-1 min-w-[18px] h-5 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg px-1.5 ${
                          day.isPast
                            ? 'bg-gradient-to-r from-gray-400 to-gray-500'
                            : 'bg-gradient-to-r from-green-400 to-emerald-500 animate-bounce'
                        }`}>
                          {dayBookingsCount}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <button
              onClick={() => scrollToDays('right')}
              className="hidden sm:flex p-3 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-md"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div 
          className="flex-1 overflow-y-auto" 
          ref={timeGridRef} 
          style={{ 
            paddingBottom: 'max(6rem, calc(6rem + env(safe-area-inset-bottom)))',
            overflowX: 'hidden',
            touchAction: 'pan-y'
          }}
        >
          {isDayClosed() ? (
            <div className="flex items-center justify-center h-64 animate-fadeIn">
              <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                <div className="w-20 h-20 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <Clock className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">🔒 Fermé aujourd'hui</h3>
                <p className="text-gray-600 text-lg">
                  L'établissement est fermé le {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long' })}
                </p>
              </div>
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="flex items-center justify-center h-64 animate-fadeIn">
              <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Clock className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">⚙️ Aucun horaire configuré</h3>
                <p className="text-gray-600 text-lg">
                  Configurez les horaires d'ouverture dans les paramètres admin
                </p>
              </div>
            </div>
          ) : (
            <div className="flex" style={{ overflowX: 'hidden' }}>
              <div className="w-20 bg-white/80 backdrop-blur-sm border-r border-gray-100 flex-shrink-0 shadow-lg">
                {timeSlots.map((slot, index) => (
                  <div
                    key={slot.time}
                    className={`h-12 flex items-center justify-center border-b border-gray-50 transition-all duration-300 ${
                      slot.available 
                        ? index % 2 === 0 ? 'bg-gradient-to-r from-blue-50/50 to-purple-50/50' : 'bg-white/50'
                        : index % 2 === 0 ? 'bg-gradient-to-r from-gray-100/50 to-gray-200/50' : 'bg-gray-100/30'
                    }`}
                  >
                    <span className={`text-xs font-bold ${
                      slot.available ? 'text-gray-700' : 'text-gray-400'
                    }`}>
                      {slot.time}
                    </span>
                  </div>
                ))}
              </div>

              <div 
                className="flex-1 relative bg-white/60 backdrop-blur-sm" 
                style={{ 
                  minHeight: `${timeSlots.length * 48}px`,
                  overflowX: 'hidden',
                  maxWidth: '100%'
                }}
              >
                {timeSlots.map((slot, index) => (
                  <div
                    key={slot.time}
                    className={`absolute left-0 right-0 border-b border-gray-100 transition-all duration-300 ${
                      !slot.available 
                        ? 'bg-gradient-to-r from-gray-100/80 to-gray-200/80' 
                        : index % 2 === 0 
                        ? 'bg-gradient-to-r from-blue-50/30 to-purple-50/30' 
                        : 'bg-white/50'
                    }`}
                    style={{ top: `${index * 48}px`, height: '48px' }}
                  />
                ))}

                {timeSlots.map((slot, index) => (
                  <button
                    key={slot.time}
                    onClick={() => {
                      if (!slot.available) return;
                      const selectedDateString = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`;
                      onTimeSlotClick(selectedDateString, slot.time);
                    }}
                    disabled={!slot.available}
                    className={`absolute left-0 right-0 transition-all duration-300 group ${
                      slot.available 
                        ? 'hover:bg-gradient-to-r hover:from-green-100/80 hover:to-emerald-100/80 transform hover:scale-[1.02] cursor-pointer'
                        : 'cursor-not-allowed'
                    }`}
                    style={{ 
                      top: `${index * 48}px`, 
                      height: '48px' 
                    }}
                  >
                    {slot.available && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center justify-center h-full transition-all duration-300">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full p-3 shadow-xl transform group-hover:rotate-180 transition-transform duration-300">
                          <Plus className="w-5 h-5" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}

                {/* Indisponibilités */}
                <div className="absolute inset-0 z-20 pointer-events-none">
                  {dayUnavailabilities.map((block, blockIndex) => {
                    const position = {
                      top: `${block.timeIndex * 48 + 1}px`,
                      height: `${block.duration * 48 - 2}px`,
                    };

                    return (
                      <div
                        key={block.id}
                        className="absolute left-1 right-1 bg-gradient-to-r from-red-500/90 to-orange-500/90 text-white rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 hover:z-10 animate-fadeIn pointer-events-auto border-2 border-red-300/50 group"
                        style={{
                          ...position,
                          animationDelay: `${blockIndex * 100}ms`,
                          zIndex: 20
                        }}
                      >
                        <div className="h-full flex items-center justify-between relative overflow-hidden px-3 py-2">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"></div>
                          
                          <div className="relative z-10 flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Ban className="w-5 h-5 flex-shrink-0" />
                              <div className="font-bold text-sm truncate">
                                Indisponible
                              </div>
                            </div>
                            <div className="opacity-90 text-xs flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {block.startTime} - {block.endTime}
                            </div>
                            {block.reason && (
                              <div className="text-xs opacity-80 mt-1 truncate">
                                {block.reason}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={(e) => handleDeleteUnavailability(block.id, e)}
                            disabled={deletingUnavailabilityId === block.id}
                            className="relative z-10 flex-shrink-0 p-2.5 bg-white/20 hover:bg-red-600 rounded-xl transition-all duration-300 transform hover:scale-110 shadow-lg border border-white/30 ml-3"
                            title="Supprimer"
                          >
                            {deletingUnavailabilityId === block.id ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Réservations */}
                <div className="absolute inset-0 z-30 pointer-events-none">
                  {columnLayouts.map((layout, layoutIndex) => {
                    const { column, totalColumns, group } = layout;
                    const { bookings, serviceName, startTime } = group;
                    
                    if (!bookings || bookings.length === 0) return null;
                    
                    const timeIndex = timeSlots.findIndex(slot => slot && slot.time === startTime);
                    if (timeIndex === -1) return null;
                    
                    const duration = Math.ceil(bookings[0].duration_minutes / 30);
                    
                    const columnGap = totalColumns > 1 ? 2 : 0;
                    const columnWidth = totalColumns > 1 
                      ? `calc(${100 / totalColumns}% - ${(totalColumns - 1) * columnGap}px)` 
                      : 'calc(100% - 4px)';
                    const columnLeft = totalColumns > 1 
                      ? `calc(${(column * 100) / totalColumns}% + ${column * columnGap}px + 2px)` 
                      : '2px';

                    const position = {
                      top: `${timeIndex * 48 + 1}px`,
                      height: `${duration * 48 - 2}px`,
                    };
                    
                    const colorClass = getBookingColor(layoutIndex);
                    const totalParticipants = bookings.reduce((sum, booking) => sum + booking.quantity, 0);
                    const firstBooking = bookings[0];
                    const unitName = getPluralUnitName(firstBooking, totalParticipants);
                    
                    return (
                      <div
                        key={`${group.serviceId}-${startTime}-${column}`}
                        className={`absolute bg-gradient-to-r ${colorClass} text-white rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 hover:z-10 animate-fadeIn pointer-events-auto border-2 border-white/30`}
                        style={{
                          left: columnLeft,
                          width: columnWidth,
                          ...position,
                          animationDelay: `${layoutIndex * 100}ms`,
                          zIndex: 30 + column
                        }}
                        onClick={() => handleServiceBlockClick(group)}
                      >
                        <div className={`h-full flex flex-col justify-center relative overflow-hidden ${
                          totalColumns > 2 ? 'p-1.5' : 'p-2'
                        }`}>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"></div>

                          <div className="relative z-10 text-center sm:text-left">
                            {/* Nom du service */}
                            <div className={`font-bold line-clamp-1 ${
                              totalColumns > 2 ? 'text-xs' : 'text-xs sm:text-sm'
                            }`}>
                              {(() => {
                                if (serviceName === 'Service personnalisé' && bookings.length > 0) {
                                  const firstBooking = bookings[0];
                                  if (firstBooking.custom_service_data?.name) {
                                    return firstBooking.custom_service_data.name;
                                  }
                                }
                                return serviceName;
                              })()}
                            </div>

                            {/* Heure et participants - Affichage adaptatif selon la hauteur */}
                            {duration < 2 ? (
                              // Petit bloc (< 1h) : tout sur une ligne
                              <div className={`opacity-90 flex items-center justify-center sm:justify-start gap-2 ${
                                totalColumns > 2 ? 'text-xs' : 'text-xs'
                              }`}>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 flex-shrink-0" />
                                  <span className="whitespace-nowrap">{startTime}</span>
                                </div>
                                <span className="text-white/80">•</span>
                                <span className="font-medium whitespace-nowrap">
                                  {totalParticipants}/{firstBooking?.service?.capacity || 1}
                                </span>
                              </div>
                            ) : (
                              // Grand bloc (>= 1h) : affichage classique
                              <>
                                <div className={`opacity-90 flex items-center justify-center sm:justify-start gap-1 ${
                                  totalColumns > 2 ? 'text-xs' : 'text-xs'
                                }`}>
                                  <Clock className="w-3 h-3 flex-shrink-0" />
                                  <span>{startTime}</span>
                                </div>
                                <div className="mt-0.5 flex flex-col items-center sm:items-start">
                                  <div className="text-xs font-medium text-white leading-tight">
                                    {totalParticipants} {unitName} sur {firstBooking?.service?.capacity || 1}
                                  </div>
                                  <div className="w-10 bg-white/30 rounded-full h-1 overflow-hidden mt-0.5">
                                    <div
                                      className="h-full bg-white rounded-full transition-all duration-500"
                                      style={{
                                        width: `${Math.min((totalParticipants / (firstBooking?.service?.capacity || 1)) * 100, 100)}%`
                                      }}
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={scrollToToday}
        className="fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-110 shadow-2xl border-2 border-white/20 backdrop-blur-sm"
        title="Aller à aujourd'hui"
        style={{ 
          bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
          right: 'calc(1.5rem + env(safe-area-inset-right, 0px))'
        }}
      >
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
        </div>
      </button>

      <ServiceBookingModal
        isOpen={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        bookings={selectedServiceBookings}
        serviceName={selectedServiceName}
        serviceId={selectedServiceBookings[0]?.service_id || ''}
        selectedDate={selectedDateString}
        selectedTime={selectedServiceBookings[0]?.time || '09:00'}
        onEditBooking={(booking) => {
          setServiceModalOpen(false);
          onBookingClick(booking);
        }}
        onDeleteBooking={onDeleteBooking}
        onNewBooking={(date, time, serviceId) => {
          onTimeSlotClick(date, time);
        }}
      />

      <DatePicker
        selectedDate={selectedDate}
        onDateSelect={handleDatePickerSelect}
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        buttonRef={monthButtonRef}
      />
    </>
  );
}
