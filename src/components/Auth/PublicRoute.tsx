import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../UI/LoadingSpinner';

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // ⚠️ SEULEMENT rediriger si authentifié ET pas en train de charger
    if (!loading && isAuthenticated) {
      console.log('✅ PublicRoute - Utilisateur authentifié détecté, redirection vers /dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  // Afficher le loader pendant la vérification initiale
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Vérification...</p>
        </div>
      </div>
    );
  }

  // ✅ Toujours afficher le contenu si pas authentifié
  return <>{children}</>;
}
