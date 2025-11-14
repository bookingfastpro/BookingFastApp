import React, { useEffect, useState } from 'react';
import { Database, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface MaintenanceModalProps {
  isOpen: boolean;
  isReconnecting?: boolean;
}

export function MaintenanceModal({ isOpen, isReconnecting = false }: MaintenanceModalProps) {
  const [dots, setDots] = useState('.');
  const [secondsDown, setSecondsDown] = useState(0);

  // Animation des points
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '.';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Compteur de temps
  useEffect(() => {
    if (!isOpen) {
      setSecondsDown(0);
      return;
    }

    const interval = setInterval(() => {
      setSecondsDown(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 animate-fade-in">
        <div className="flex flex-col items-center text-center">
          {/* Icône animée */}
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 bg-orange-100 rounded-full animate-ping opacity-75"></div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              {isReconnecting ? (
                <Wifi className="w-10 h-10 text-white animate-pulse" />
              ) : (
                <Database className="w-10 h-10 text-white animate-pulse" />
              )}
            </div>
          </div>

          {/* Titre */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {isReconnecting ? 'Reconnexion en cours' : 'Maintenance en cours'}
          </h2>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            {isReconnecting ? (
              <>
                Tentative de reconnexion à la base de données{dots}
                <br />
                <span className="text-sm text-gray-500 mt-2 block">
                  Veuillez patienter quelques instants
                </span>
              </>
            ) : (
              <>
                Une mise à jour de maintenance est en cours.
                <br />
                <span className="text-sm text-gray-500 mt-2 block">
                  Cela ne devrait prendre que quelques minutes{dots}
                </span>
              </>
            )}
          </p>

          {/* Indicateur de temps */}
          <div className="w-full bg-gray-100 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-2">
                {isReconnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Vérification
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4" />
                    Déconnecté
                  </>
                )}
              </span>
              <span className="font-mono text-gray-700 font-semibold">
                {formatTime(secondsDown)}
              </span>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full animate-progress-indeterminate"></div>
          </div>

          {/* Message d'info */}
          <p className="text-xs text-gray-500 mt-6">
            {isReconnecting ? (
              'La connexion sera rétablie automatiquement'
            ) : (
              <>
                Votre session sera restaurée automatiquement
                <br />
                après la fin de la maintenance
              </>
            )}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        @keyframes progress-indeterminate {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }

        .animate-progress-indeterminate {
          animation: progress-indeterminate 1.5s ease-in-out infinite;
          width: 25%;
        }
      `}</style>
    </div>
  );
}
