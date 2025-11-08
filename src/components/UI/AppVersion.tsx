import React from 'react';
import { CacheBuster } from '../../utils/cacheBuster';

export function AppVersion() {
  const version = CacheBuster.getVersion();

  const handleClearCache = async () => {
    if (window.confirm('Vider le cache et recharger l\'application ?')) {
      await CacheBuster.forceReload();
    }
  };

  return (
    <div className="fixed bottom-2 right-2 text-xs text-gray-400 hover:text-gray-600 transition-colors z-50">
      <button
        onClick={handleClearCache}
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100"
        title="Cliquez pour vider le cache"
      >
        <span>v{version}</span>
      </button>
    </div>
  );
}
