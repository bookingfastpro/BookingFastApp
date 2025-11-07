import React, { useEffect, useState } from 'react';
import { Lock, Sparkles, ArrowRight, Clock } from 'lucide-react';
import { usePlugins } from '../../hooks/usePlugins';
import { LoadingSpinner } from '../UI/LoadingSpinner';

interface PluginGuardProps {
  pluginSlug: string;
  children: React.ReactNode;
}

export function PluginGuard({ pluginSlug, children }: PluginGuardProps) {
  const { hasPluginAccess } = usePlugins();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const verifyAccess = async () => {
      try {
        setLoading(true);
        console.log(`🔒 PluginGuard - Vérification accès: ${pluginSlug}`);
        const access = await hasPluginAccess(pluginSlug);
        console.log(`🔒 PluginGuard - Résultat: ${access}`);
        
        if (mounted) {
          setHasAccess(access);
        }
      } catch (error) {
        console.error('❌ Erreur vérification accès plugin:', error);
        if (mounted) {
          setHasAccess(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    verifyAccess();

    return () => {
      mounted = false;
    };
  }, [pluginSlug, hasPluginAccess]); // ✅ Dépendances stables

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
            <h1 className="text-3xl font-bold mb-2">Plugin non activé</h1>
            <p className="text-white/90 text-lg">
              Démarrez votre essai gratuit pour accéder à ce plugin
            </p>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-purple-50 rounded-2xl p-6 border-2 border-purple-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    7 jours d'essai gratuit
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Testez ce plugin gratuitement pendant 7 jours, sans engagement. 
                    Vous pourrez ensuite souscrire à l'abonnement mensuel si vous le souhaitez.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Accès complet à toutes les fonctionnalités
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Aucune carte bancaire requise
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Annulation à tout moment
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-sm text-gray-600">
                Plugin: <code className="bg-gray-200 px-2 py-1 rounded font-mono text-xs">{pluginSlug}</code>
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Retour au dashboard
              </button>
              <button
                onClick={() => window.location.href = '/?page=plugins'}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <span>Démarrer l'essai gratuit</span>
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
