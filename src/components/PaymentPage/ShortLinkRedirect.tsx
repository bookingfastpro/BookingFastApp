import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../UI/LoadingSpinner';

export function ShortLinkRedirect() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const redirectToPayment = async () => {
      if (!code) {
        setError('Code de paiement manquant');
        return;
      }

      try {
        console.log('🔍 Recherche du lien de paiement avec code:', code);

        const { data: paymentLink, error: fetchError } = await supabase
          .from('payment_links')
          .select('id')
          .eq('short_code', code.toUpperCase())
          .maybeSingle();

        if (fetchError) {
          console.error('❌ Erreur récupération lien:', fetchError);
          setError('Erreur lors de la récupération du lien de paiement');
          return;
        }

        if (!paymentLink) {
          console.log('❌ Lien de paiement introuvable pour le code:', code);
          setError('Lien de paiement introuvable ou expiré');
          return;
        }

        console.log('✅ Lien trouvé, redirection vers:', `/payment?link_id=${paymentLink.id}`);
        navigate(`/payment?link_id=${paymentLink.id}`, { replace: true });
      } catch (err) {
        console.error('❌ Erreur:', err);
        setError('Une erreur est survenue');
      }
    };

    redirectToPayment();
  }, [code, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Lien invalide</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Redirection vers le paiement...</p>
      </div>
    </div>
  );
}
