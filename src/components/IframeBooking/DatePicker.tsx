import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { BusinessSettings } from '../../types';

interface DateOption {
  date: string;
  label: string;
  isToday: boolean;
}

interface DatePickerProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  availableDates: DateOption[];
  settings: BusinessSettings;
}

export function DatePicker({ selectedDate, onDateSelect, availableDates, settings }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(new Date(selectedDate));
    }
  }, [selectedDate]);

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
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

  const handleDateSelect = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    const isAvailable = availableDates.some(d => d.date === dateString);
    if (isAvailable) {
      onDateSelect(dateString);
      setIsOpen(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
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

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    
    const todayString = today.toISOString().split('T')[0];
    const todayAvailable = availableDates.find(d => d.date === todayString);
    if (todayAvailable) {
      onDateSelect(todayString);
      setIsOpen(false);
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    const selectedDateObj = new Date(selectedDate);
    return date.toDateString() === selectedDateObj.toDateString();
  };

  const isAvailable = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    return availableDates.some(d => d.date === dateString);
  };

  const days = getDaysInMonth();
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div ref={dropdownRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 sm:p-6 border-2 rounded-3xl transition-all duration-300 text-left ${
          isOpen
            ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-xl'
            : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg'
        }`}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            selectedDate ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'bg-gray-100 text-gray-400'
          }`}>
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-gray-900">
              {selectedDate ? formatDisplayDate(selectedDate) : 'Sélectionner une date'}
            </div>
            <div className="text-sm sm:text-base text-gray-600">
              {selectedDate ? 'Cliquez pour changer' : 'Choisissez votre date de rendez-vous'}
            </div>
          </div>
        </div>
        <ChevronDown className={`w-6 h-6 sm:w-8 sm:h-8 text-gray-400 transition-transform duration-300 ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-3xl shadow-2xl z-50 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => navigateMonth('prev')}
                className="p-2 sm:p-3 hover:bg-white/20 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              
              <h3 className="text-lg sm:text-2xl font-bold">
                {currentMonth.toLocaleDateString('fr-FR', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h3>
              
              <button
                type="button"
                onClick={() => navigateMonth('next')}
                className="p-2 sm:p-3 hover:bg-white/20 rounded-xl transition-colors"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            <button
              type="button"
              onClick={goToToday}
              className="w-full bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-xl transition-colors font-medium"
            >
              Aller à aujourd'hui
            </button>
          </div>

          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {weekDays.map(day => (
              <div key={day} className="py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2 p-3 sm:p-4">
            {days.map((day, index) => {
              const isCurrentMonth = day.isCurrentMonth;
              const isTodayDate = isToday(day.date);
              const isSelectedDate = isSelected(day.date);
              const isDateAvailable = isAvailable(day.date);
              
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateSelect(day.date)}
                  disabled={!isCurrentMonth || !isDateAvailable}
                  className={`h-10 sm:h-12 rounded-xl text-sm sm:text-base font-medium transition-all duration-300 transform hover:scale-110 ${
                    isSelectedDate
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-xl'
                      : isTodayDate && isDateAvailable
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                      : isCurrentMonth && isDateAvailable
                      ? 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200'
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  {day.date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="bg-gray-50 p-3 sm:p-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2 justify-center">
              {availableDates.slice(0, 4).map((dateOption) => (
                <button
                  key={dateOption.date}
                  onClick={() => {
                    onDateSelect(dateOption.date);
                    setIsOpen(false);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${
                    selectedDate === dateOption.date
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-gray-200'
                  }`}
                >
                  {dateOption.isToday ? 'Aujourd\'hui' : dateOption.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
