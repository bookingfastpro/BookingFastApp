import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoadingSpinner } from '../UI/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('🔒 ProtectedRoute - État:', { 
      isAuthenticated, 
      loading, 
      pathname: location.pathname 
    });

    // Si non authentifié, rediriger vers /login
    if (!loading && !isAuthenticated) {
      console.log('❌ Non authentifié - redirection vers /login');
      navigate('/login', { replace: true, state: { from: location } });
    } else if (!loading && isAuthenticated) {
      console.log('✅ Authentifié - accès autorisé à:', location.pathname);
    }
  }, [isAuthenticated, loading, navigate, location]);

  // Afficher le loader pendant la vérification
  if (loading) {
    console.log('⏳ ProtectedRoute - Vérification en cours...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Vérification...</p>
        </div>
      </div>
    );
  }

  // Si non authentifié, ne rien afficher (redirection en cours)
  if (!isAuthenticated) {
    console.log('🚫 ProtectedRoute - Accès refusé, redirection en cours...');
    return null;
  }

  // ✅ Afficher le contenu si authentifié
  console.log('✅ ProtectedRoute - Rendu du contenu autorisé');
  return <>{children}</>;
}
