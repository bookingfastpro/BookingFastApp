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

  const getPluralUnitName = (qty: number) => {
    if (qty <= 1) {
      return `${displayUnitName.replace(/s$/, '')}(s)`;
    }
    return `${displayUnitName}(s)`;
  };

  return (
    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Users className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-gray-900">{getPluralUnitName(quantity)}</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
          disabled={quantity <= 1}
          className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl flex items-center justify-center text-blue-600 hover:bg-blue-100 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed border-2 border-blue-300 shadow-sm"
        >
          <Minus className="w-6 h-6" />
        </button>

        <div className="flex-1 text-center">
          <div className="text-3xl sm:text-4xl font-bold text-blue-600">
            {quantity}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            sur {maxCapacity} max
          </div>
        </div>

        <button
          type="button"
          onClick={() => onQuantityChange(Math.min(maxCapacity, quantity + 1))}
          disabled={quantity >= maxCapacity}
          className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white hover:from-blue-600 hover:to-cyan-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 bg-blue-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-300"
            style={{ width: `${(quantity / maxCapacity) * 100}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-blue-700 whitespace-nowrap">
          {Math.round((quantity / maxCapacity) * 100)}%
        </span>
      </div>
    </div>
  );
}
