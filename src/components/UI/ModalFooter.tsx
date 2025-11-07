import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface ModalFooterButton {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
}

interface ModalFooterProps {
  buttons: ModalFooterButton[];
}

export function ModalFooter({ buttons }: ModalFooterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 pt-6 pb-6 border-t border-gray-200 md:sticky md:bottom-0 md:bg-white md:z-10">
      {buttons.map((button, index) => {
        const baseClasses = "flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100";
        
        const variantClasses = {
          primary: "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl",
          secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
          danger: "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 shadow-lg hover:shadow-xl"
        };

        return (
          <button
            key={index}
            type={button.variant === 'primary' ? 'submit' : 'button'}
            onClick={button.onClick}
            disabled={button.disabled || button.loading}
            className={`${baseClasses} ${variantClasses[button.variant || 'secondary']}`}
          >
            {button.loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <span className="flex items-center justify-center gap-2">
                {button.icon && <span>{button.icon}</span>}
                {button.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
