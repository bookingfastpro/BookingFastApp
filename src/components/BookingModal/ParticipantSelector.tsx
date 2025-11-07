import React from 'react';
import { Users, Minus, Plus } from 'lucide-react';

interface ParticipantSelectorProps {
  quantity: number;
  maxCapacity: number;
  onQuantityChange: (quantity: number) => void;
  unitName?: string;
}

export function ParticipantSelector({ 
  quantity, 
  maxCapacity, 
  onQuantityChange,
  unitName = 'participants'
}: ParticipantSelectorProps) {
  const displayUnitName = unitName || 'participants';
  
  // Fonction pour obtenir le nom d'unité avec suffixe (s)
  const getPluralUnitName = (qty: number) => {
    if (qty <= 1) {
      // Retirer le 's' final si présent et ajouter (s) après
      return `${displayUnitName.replace(/s$/, '')}(s)`;
    }
    return `${displayUnitName}(s)`;
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-purple-800">Nombre de {displayUnitName}</h3>
          <p className="text-purple-600 text-sm">Maximum {maxCapacity} {displayUnitName}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
          disabled={quantity <= 1}
          className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-purple-600 hover:bg-purple-100 transition-all duration-300 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md"
        >
          <Minus className="w-5 h-5" />
        </button>

        <div className="flex-1 text-center">
          <div className="text-3xl font-bold text-purple-800">{quantity}</div>
          <div className="text-sm text-purple-600">{getPluralUnitName(quantity)}</div>
        </div>

        <button
          type="button"
          onClick={() => onQuantityChange(Math.min(maxCapacity, quantity + 1))}
          disabled={quantity >= maxCapacity}
          className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-4 bg-white rounded-xl p-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Capacité utilisée</span>
          <span className="font-bold text-purple-600">{quantity} / {maxCapacity}</span>
        </div>
        <div className="mt-2 bg-purple-100 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${(quantity / maxCapacity) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
