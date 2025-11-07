import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { createPortal } from 'react-dom';

interface DatePickerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  isOpen: boolean;
  onClose: () => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

export function DatePicker({ selectedDate, onDateSelect, isOpen, onClose, buttonRef }: DatePickerProps) {
  const [viewDate, setViewDate] = useState(new Date(selectedDate));
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current && pickerRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const pickerWidth = 320; // w-80 = 320px
      
      // Centrer le picker par rapport au bouton
      const centerLeft = buttonRect.left + (buttonRect.width / 2) - (pickerWidth / 2);
      
      // S'assurer que le picker ne dépasse pas à gauche ou à droite
      const maxLeft = window.innerWidth - pickerWidth - 16; // 16px de marge
      const finalLeft = Math.max(16, Math.min(centerLeft, maxLeft));
      
      setPosition({
        top: buttonRect.bottom + 8,
        left: finalLeft
      });
    }
  }, [isOpen, buttonRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && pickerRef.current && !pickerRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, buttonRef]);

  if (!isOpen) return null;

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Lundi = 0

    const days = [];

    // Jours du mois précédent
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = new Date(year, month, -i);
      days.push({
        date: day,
        isCurrentMonth: false,
        isToday: isToday(day),
        isSelected: isSameDay(day, selectedDate)
      });
    }

    // Jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date: date,
        isCurrentMonth: true,
        isToday: isToday(date),
        isSelected: isSameDay(date, selectedDate)
      });
    }

    // Jours du mois suivant pour compléter la grille
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date: date,
        isCurrentMonth: false,
        isToday: isToday(date),
        isSelected: isSameDay(date, selectedDate)
      });
    }

    return days;
  };

  const isToday = (date: Date): boolean => {
    const now = new Date();
    return date.getFullYear() === now.getFullYear() &&
           date.getMonth() === now.getMonth() &&
           date.getDate() === now.getDate();
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(viewDate);
    if (direction === 'prev') {
      newDate.setMonth(viewDate.getMonth() - 1);
    } else {
      newDate.setMonth(viewDate.getMonth() + 1);
    }
    setViewDate(newDate);
  };

  const handleDateClick = (date: Date) => {
    onDateSelect(date);
    onClose();
  };

  const goToToday = () => {
    const today = new Date();
    setViewDate(today);
    onDateSelect(today);
    onClose();
  };

  const days = getDaysInMonth(viewDate);
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return createPortal(
    <>
      <div 
        className="fixed inset-0 z-[999998] bg-transparent" 
        onClick={onClose}
      />
      <div
        ref={pickerRef}
        className="fixed z-[999999] bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 w-80"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`
        }}
      >
        {/* Header avec navigation mois */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => changeMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 capitalize">
              {viewDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </div>
          </div>
          
          <button
            onClick={() => changeMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Grille des jours */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <button
              key={index}
              onClick={() => handleDateClick(day.date)}
              className={`
                aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200
                ${day.isCurrentMonth 
                  ? 'text-gray-900 hover:bg-blue-50' 
                  : 'text-gray-400 hover:bg-gray-50'
                }
                ${day.isSelected 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg' 
                  : ''
                }
                ${day.isToday && !day.isSelected
                  ? 'border-2 border-blue-500 text-blue-600 font-bold'
                  : ''
                }
              `}
            >
              {day.date.getDate()}
            </button>
          ))}
        </div>

        {/* Footer avec bouton "Aujourd'hui" */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={goToToday}
            className="w-full py-2 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2"
          >
            <CalendarIcon className="w-4 h-4" />
            Aujourd'hui
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
