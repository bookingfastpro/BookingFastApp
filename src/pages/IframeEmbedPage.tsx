import React, { useEffect } from 'react';

export function IframeEmbedPage() {
  useEffect(() => {
    // 📡 Écouter les messages de l'iframe
    const handleMessage = (event: MessageEvent) => {
      console.log('📨 Message reçu du parent:', event.data);
      
      if (event.data.type === 'booking_confirmed') {
        console.log('✅ Réservation confirmée - Rechargement iframe...');
        
        // Recharger l'iframe
        const iframe = document.querySelector('iframe');
        if (iframe) {
          iframe.src = iframe.src;
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Exemple d'intégration iframe
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            Cette page démontre comment intégrer le système de réservation dans votre site web.
          </p>
          
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200 mb-8">
            <h3 className="font-bold text-blue-900 mb-3">📋 Code d'intégration</h3>
            <pre className="bg-white p-4 rounded-xl overflow-x-auto text-sm">
              <code>{`<iframe 
  src="https://bookingfast.pro/iframe/[USER_ID]"
  width="100%"
  height="800"
  frameborder="0"
  allow="payment"
></iframe>`}</code>
            </pre>
          </div>
        </div>

        {/* Iframe de démonstration */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white">
            <h2 className="text-xl font-bold">Aperçu de l'iframe</h2>
          </div>
          <div className="p-4">
            <iframe
              src={`${window.location.origin}/iframe/9222ceae-5bf3-4b00-ae12-ac7f83e248a1`}
              width="100%"
              height="800"
              frameBorder="0"
              allow="payment"
              className="rounded-2xl border-2 border-gray-200"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
