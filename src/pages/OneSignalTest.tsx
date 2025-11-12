import { useState, useEffect } from 'react';
import { oneSignalService } from '../lib/oneSignalService';

export default function OneSignalTest() {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState('Initialisation...');
  const [permission, setPermission] = useState('unknown');
  const [playerId, setPlayerId] = useState<string | null>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };

  useEffect(() => {
    testOneSignal();
  }, []);

  const testOneSignal = async () => {
    try {
      addLog('Début du test OneSignal');

      // Vérifier si le SDK est chargé
      if (typeof window.OneSignal === 'undefined') {
        addLog('❌ SDK OneSignal non chargé!');
        setStatus('SDK non chargé');
        return;
      }
      addLog('✅ SDK OneSignal chargé');

      // Initialiser
      addLog('Appel de initialize()...');
      await oneSignalService.initialize();
      addLog('✅ Initialize terminé');
      setStatus('Initialisé');

      // Vérifier permission
      addLog('Vérification permission...');
      const perm = await oneSignalService.getNotificationPermission();
      setPermission(perm);
      addLog(`Permission: ${perm}`);

      // Obtenir Player ID
      addLog('Récupération Player ID...');
      const id = await oneSignalService.getPlayerId();
      setPlayerId(id);
      addLog(`Player ID: ${id || 'null'}`);

    } catch (error) {
      addLog(`❌ ERREUR: ${error}`);
      setStatus('Erreur');
    }
  };

  const requestPermission = async () => {
    try {
      addLog('Demande de permission...');
      const result = await oneSignalService.requestPermission();
      addLog(`Résultat: ${result}`);

      // Recharger les infos
      const perm = await oneSignalService.getNotificationPermission();
      setPermission(perm);

      const id = await oneSignalService.getPlayerId();
      setPlayerId(id);
    } catch (error) {
      addLog(`❌ ERREUR: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Test OneSignal</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">État actuel</h2>
          <div className="space-y-2">
            <p><strong>Status:</strong> {status}</p>
            <p><strong>Permission:</strong> {permission}</p>
            <p><strong>Player ID:</strong> {playerId || 'Non disponible'}</p>
          </div>

          <button
            onClick={requestPermission}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Demander la permission
          </button>

          <button
            onClick={testOneSignal}
            className="mt-4 ml-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Réinitialiser le test
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Logs</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p>Aucun log pour le moment...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i}>{log}</div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Variables d'environnement</h3>
          <p className="text-sm text-yellow-700">
            VITE_ONESIGNAL_APP_ID: {import.meta.env.VITE_ONESIGNAL_APP_ID ? '✅ Configuré' : '❌ Manquant'}
          </p>
          <p className="text-sm text-yellow-700">
            VITE_ONESIGNAL_REST_API_KEY: {import.meta.env.VITE_ONESIGNAL_REST_API_KEY ? '✅ Configuré' : '❌ Manquant'}
          </p>
        </div>
      </div>
    </div>
  );
}
