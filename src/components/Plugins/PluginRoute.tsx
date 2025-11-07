import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { usePluginPermissions } from '../../hooks/usePluginPermissions';
import { LoadingSpinner } from '../UI/LoadingSpinner';

interface PluginRouteProps {
  pluginSlug: string;
  children: React.ReactNode;
}

export function PluginRoute({ pluginSlug, children }: PluginRouteProps) {
  const navigate = useNavigate();
  const { checkPluginAccess } = usePluginPermissions();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAccess = async () => {
      console.log('🔐 PluginRoute - Vérification accès pour:', pluginSlug);
      setLoading(true);
      
      try {
        const access = await checkPluginAccess(pluginSlug);
        console.log('✅ PluginRoute - Résultat accès:', access);
        setHasAccess(access);
      } catch (error) {
        console.error('❌ PluginRoute - Erreur vérification:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    verifyAccess();
  }, [pluginSlug, checkPluginAccess]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">Vérification des accès...</p>
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-8 text-white text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Lock className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Accès Refusé</h1>
            <p className="text-white/90 text-lg">
              Vous n'avez pas accès à ce plugin
            </p>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-purple-50 rounded-2xl p-6 border-2 border-purple-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Demandez l'accès
                  </h3>
                  <p className="text-gray-600">
                    Contactez le propriétaire du compte pour obtenir l'accès à ce plugin.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <span>Retour au dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
