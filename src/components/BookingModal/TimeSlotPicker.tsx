import React, { useState, useEffect } from 'react';
import { Clock, ChevronDown } from 'lucide-react';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import { TimeSlot } from '../../types';
import { getBusinessTimezone } from '../../lib/timezone';
import { validateBookingDateTime } from '../../lib/bookingValidation';
import { formatTime } from '../../utils/dateUtils';

interface TimeSlotPickerProps {
  selectedDate: string;
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  disabled?: boolean;
  occupiedSlots?: string[];
  serviceDuration?: number;
}

export function TimeSlotPicker({ 
  selectedDate, 
  selectedTime, 
  onTimeSelect, 
  disabled,
  occupiedSlots = [],
  serviceDuration = 60
}: TimeSlotPickerProps) {
  const { settings } = useBusinessSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    if (settings && selectedDate) {
      generateTimeSlots();
    }
  }, [settings, selectedDate, occupiedSlots]);

  const generateTimeSlots = () => {
    if (!settings) return;
    
    const date = new Date(selectedDate);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const daySettings = settings.opening_hours[dayName];
    
    if (!daySettings || daySettings.closed) {
      setAvailableSlots([]);
      return;
    }
    
    const slots: TimeSlot[] = [];
    
    const ranges = daySettings.ranges || [{ start: daySettings.start, end: daySettings.end }];
    
    if (!ranges || ranges.length === 0) {
      setAvailableSlots([]);
      return;
    }
    
    ranges.forEach(range => {
      if (!range.start || !range.end) return;
      
      const startTime = range.start.split(':');
      const endTime = range.end.split(':');
      const startHour = parseInt(startTime[0]);
      const startMinute = parseInt(startTime[1]);
      const endHour = parseInt(endTime[0]);
      const endMinute = parseInt(endTime[1]);
      
      let currentHour = startHour;
      let currentMinute = startMinute;
      
      while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        const time = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        
        const isOccupied = occupiedSlots.includes(time);
        
        const validation = validateBookingDateTime(selectedDate, time, settings, false);
        const isAvailable = !isOccupied && validation.isValid;
        
        if (!slots.find(slot => slot.time === time)) {
          slots.push({
            time,
            available: isAvailable
          });
        }
        
        currentMinute += 30;
        if (currentMinute >= 60) {
          currentMinute = 0;
          currentHour++;
        }
      }
    });
    
    slots.sort((a, b) => a.time.localeCompare(b.time));
    
    setAvailableSlots(slots);
  };

  const handleTimeSelect = (time: string, available: boolean) => {
    if (!available || disabled) return;
    onTimeSelect(time);
    setIsOpen(false);
  };

  const availableCount = availableSlots.filter(slot => slot.available).length;

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Heure *
      </label>
      
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between p-4 border rounded-2xl transition-all duration-300 ${
          disabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : isOpen
            ? 'border-blue-500 bg-blue-50 shadow-lg'
            : 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-md'
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
            selectedTime ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'bg-gray-100 text-gray-400'
          }`}>
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="text-left min-w-0 flex-1">
            <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
              {selectedTime ? formatTime(selectedTime) : 'Sélectionner une heure'}
            </div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ml-2 ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {isOpen && (
        <>
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[100000] max-h-80 overflow-y-auto">
            {availableSlots.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <div className="font-medium text-lg mb-1">Fermé ce jour</div>
                <div className="text-sm">Aucun créneau disponible</div>
              </div>
            ) : (
              <div className="p-4">
                <div className="text-sm font-medium text-gray-700 mb-3 text-center">
                  Choisir un créneau horaire
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => handleTimeSelect(slot.time, slot.available)}
                      disabled={!slot.available}
                      className={`p-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 animate-fadeIn ${
                        selectedTime === slot.time
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                          : slot.available
                          ? 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200'
                          : 'bg-red-50 text-red-400 cursor-not-allowed border border-red-200'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div 
            className="fixed inset-0 z-[99999]" 
            onClick={() => setIsOpen(false)}
          />
        </>
      )}
    </div>
  );
}
