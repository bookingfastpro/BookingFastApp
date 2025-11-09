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
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-3 border-2 border-blue-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {quantity} {getPluralUnitName(quantity)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-blue-200"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onQuantityChange(Math.min(maxCapacity, quantity + 1))}
            disabled={quantity >= maxCapacity}
            className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white hover:from-blue-600 hover:to-cyan-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs text-blue-700">
        <div className="flex-1 bg-blue-200 rounded-full h-1 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-300"
            style={{ width: `${(quantity / maxCapacity) * 100}%` }}
          />
        </div>
        <span className="font-medium whitespace-nowrap">{quantity}/{maxCapacity}</span>
      </div>
    </div>
  );
}
