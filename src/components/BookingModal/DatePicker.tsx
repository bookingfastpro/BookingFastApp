import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import { getBusinessTimezone, getCurrentDateInTimezone, isPastDateInTimezone, formatInBusinessTimezone } from '../../lib/timezone';
import { isDateAvailableForBooking, getNextAvailableDateTime } from '../../lib/bookingValidation';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  disabled?: boolean;
  required?: boolean;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  showInline?: boolean;
  label?: string; // Nouveau prop pour personnaliser le label
}

export function DatePicker({ value, onChange, disabled, required, isOpen: externalIsOpen, onOpenChange, showInline, label = 'Date' }: DatePickerProps) {
  const { settings } = useBusinessSettings();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalIsOpen(open);
    }
  };

  // Initialiser avec la date du jour si aucune valeur n'est fournie
  useEffect(() => {
    const timezone = getBusinessTimezone(settings);
    if (!value) {
      if (settings) {
        const { date: nextAvailableDate } = getNextAvailableDateTime(settings);
        onChange(nextAvailableDate);
        setSelectedDate(new Date(nextAvailableDate));
        setCurrentMonth(new Date(nextAvailableDate));
      } else {
        const todayString = getCurrentDateInTimezone(timezone);
        onChange(todayString);
        setSelectedDate(new Date(todayString));
        setCurrentMonth(new Date(todayString));
      }
    } else {
      const date = new Date(value);
      setSelectedDate(date);
      setCurrentMonth(date);
    }
  }, [value, onChange, settings]);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    if (showInline) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, showInline]);

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const timezone = getBusinessTimezone(settings);
    return formatInBusinessTimezone(new Date(dateString), timezone, {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

    const days = [];
    
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = new Date(year, month, -i);
      days.push({ date: day, isCurrentMonth: false });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      days.push({ date: dayDate, isCurrentMonth: true });
    }
    
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const dayDate = new Date(year, month + 1, day);
      days.push({ date: dayDate, isCurrentMonth: false });
    }
    
    return days;
  };

  const handleDateSelect = (date: Date, e: React.MouseEvent) => {
    // Empêcher TOUS les comportements par défaut
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    
    // Utiliser la date locale pour éviter les décalages de fuseau horaire
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    console.log('📅 Date sélectionnée:', dateString);
    
    // Mettre à jour l'état local immédiatement
    setSelectedDate(date);
    
    // Appeler onChange avec la nouvelle date
    onChange(dateString);
    
    // Fermer le dropdown seulement si pas en mode inline
    if (!showInline) {
      // Délai plus long pour s'assurer que tout est traité
      requestAnimationFrame(() => {
        setIsOpen(false);
      });
    }
  };

  const navigateMonth = (direction: 'prev' | 'next', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const goToToday = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (settings) {
      const { date: nextAvailableDate } = getNextAvailableDateTime(settings);
      const nextAvailable = new Date(nextAvailableDate);
      setCurrentMonth(nextAvailable);
      handleDateSelect(nextAvailable, e);
    } else {
      const timezone = getBusinessTimezone(settings);
      const todayString = getCurrentDateInTimezone(timezone);
      const today = new Date(todayString);
      setCurrentMonth(today);
      handleDateSelect(today, e);
    }
  };

  const centerOnToday = () => {
    if (settings) {
      const { date: nextAvailableDate } = getNextAvailableDateTime(settings);
      const nextAvailable = new Date(nextAvailableDate);
      setCurrentMonth(nextAvailable);
    } else {
      const timezone = getBusinessTimezone(settings);
      const todayString = getCurrentDateInTimezone(timezone);
      const today = new Date(todayString);
      setCurrentMonth(today);
    }
  };

  useEffect(() => {
    if (!value) {
      centerOnToday();
    }
  }, [value, settings]);

  useEffect(() => {
    const handleReset = () => {
      centerOnToday();
    };

    window.addEventListener('resetDatePicker', handleReset);
    return () => window.removeEventListener('resetDatePicker', handleReset);
  }, [settings]);

  const isToday = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    return today.getTime() === compareDate.getTime();
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const isPastDate = (date: Date) => {
    return false;
  };

  const days = getDaysInMonth();
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  if (showInline) {
    return (
      <div className="w-full bg-white border-2 border-gray-200 rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 sm:p-5 text-white">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <button
              type="button"
              onClick={(e) => navigateMonth('prev', e)}
              className="p-2 sm:p-2.5 hover:bg-white/20 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            
            <h3 className="text-base sm:text-xl font-bold">
              {currentMonth.toLocaleDateString('fr-FR', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </h3>
            
            <button
              type="button"
              onClick={(e) => navigateMonth('next', e)}
              className="p-2 sm:p-2.5 hover:bg-white/20 rounded-xl transition-colors"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
          
          <button
            type="button"
            onClick={goToToday}
            className="w-full bg-white/20 hover:bg-white/30 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-colors font-medium text-sm sm:text-base"
          >
            {settings && settings.minimum_booking_delay_hours > 0 ? 'Prochaine date disponible' : 'Aujourd\'hui'}
          </button>
        </div>

        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {weekDays.map(day => (
            <div key={day} className="py-2.5 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 p-3 sm:p-4">
          {days.map((day, index) => {
            const isCurrentMonth = day.isCurrentMonth;
            const isTodayDate = isToday(day.date);
            const isSelectedDate = isSelected(day.date);
            const isNotAvailable = isPastDate(day.date);
            
            return (
              <button
                key={index}
                type="button"
                onClick={(e) => handleDateSelect(day.date, e)}
                disabled={!isCurrentMonth}
                className={`h-10 sm:h-12 rounded-xl text-sm sm:text-base font-medium transition-all duration-300 transform hover:scale-110 ${
                  isSelectedDate
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : isTodayDate
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                    : isCurrentMonth
                    ? isNotAvailable
                      ? 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    : 'bg-transparent text-gray-300 cursor-not-allowed'
                }`}
                title={isNotAvailable && settings ? `Délai minimum: ${settings.minimum_booking_delay_hours}h` : ''}
              >
                {day.date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && '*'}
      </label>
      
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
        disabled={disabled}
        className={`w-full flex items-center justify-between p-3 sm:p-4 border-2 rounded-2xl transition-all duration-300 text-left ${
          disabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
            : isOpen
            ? 'border-blue-500 bg-blue-50 shadow-lg'
            : 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-md'
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
            value ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'bg-gray-100 text-gray-400'
          }`}>
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="font-medium text-gray-900 text-sm sm:text-base">
              {value ? formatDisplayDate(value) : 'Sélectionner une date'}
            </div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform duration-300 ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 mt-2 w-[340px] sm:w-[380px] bg-white border-2 border-gray-200 rounded-3xl shadow-2xl overflow-hidden"
          onMouseDown={(e) => {
            // Empêcher la fermeture lors du clic dans le calendrier
            e.stopPropagation();
          }}
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 sm:p-5 text-white">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <button
                type="button"
                onClick={(e) => navigateMonth('prev', e)}
                className="p-2 sm:p-2.5 hover:bg-white/20 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              
              <h3 className="text-base sm:text-xl font-bold">
                {currentMonth.toLocaleDateString('fr-FR', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h3>
              
              <button
                type="button"
                onClick={(e) => navigateMonth('next', e)}
                className="p-2 sm:p-2.5 hover:bg-white/20 rounded-xl transition-colors"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            <button
              type="button"
              onClick={goToToday}
              className="w-full bg-white/20 hover:bg-white/30 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-colors font-medium text-sm sm:text-base"
            >
              {settings && settings.minimum_booking_delay_hours > 0 ? 'Prochaine date disponible' : 'Aujourd\'hui'}
            </button>
          </div>

          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {weekDays.map(day => (
              <div key={day} className="py-2.5 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 p-3 sm:p-4">
            {days.map((day, index) => {
              const isCurrentMonth = day.isCurrentMonth;
              const isTodayDate = isToday(day.date);
              const isSelectedDate = isSelected(day.date);
              const isNotAvailable = isPastDate(day.date);
              
              return (
                <button
                  key={index}
                  type="button"
                  onMouseDown={(e) => {
                    // Utiliser onMouseDown au lieu de onClick pour capturer l'événement avant
                    if (isCurrentMonth) {
                      handleDateSelect(day.date, e);
                    }
                  }}
                  disabled={!isCurrentMonth}
                  className={`h-10 sm:h-12 rounded-xl text-sm sm:text-base font-medium transition-all duration-300 transform hover:scale-110 ${
                    isSelectedDate
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : isTodayDate
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                      : isCurrentMonth
                      ? isNotAvailable
                        ? 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                      : 'bg-transparent text-gray-300 cursor-not-allowed'
                  }`}
                  title={isNotAvailable && settings ? `Délai minimum: ${settings.minimum_booking_delay_hours}h` : ''}
                >
                  {day.date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
