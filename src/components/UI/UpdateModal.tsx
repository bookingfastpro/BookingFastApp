import React from 'react';
import { RefreshCw } from 'lucide-react';
import { CacheBuster } from '../../utils/cacheBuster';

interface UpdateModalProps {
  isOpen: boolean;
}

export function UpdateModal({ isOpen }: UpdateModalProps) {
  const [isReloading, setIsReloading] = React.useState(false);

  if (!isOpen) return null;

  const handleReload = async () => {
    setIsReloading(true);
    await CacheBuster.forceReload();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 animate-fade-in">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <RefreshCw className={`w-8 h-8 text-blue-600 ${isReloading ? 'animate-spin' : ''}`} />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Nouvelle version disponible
          </h2>

          <p className="text-gray-600 mb-6">
            Une nouvelle version de l'application est disponible. Veuillez recharger pour bénéficier des dernières améliorations et corrections.
          </p>

          <button
            onClick={handleReload}
            disabled={isReloading}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
              isReloading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }`}
          >
            {isReloading ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                Rechargement en cours...
              </span>
            ) : (
              'Recharger maintenant'
            )}
          </button>

          <p className="text-xs text-gray-500 mt-4">
            Cette action rechargera l'application et appliquera les mises à jour
          </p>
        </div>
      </div>
    </div>
  );
}
