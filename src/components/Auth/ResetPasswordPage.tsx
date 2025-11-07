import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Building2, Save } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Button } from '../UI/Button';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokens, setTokens] = useState<{
    accessToken: string | null;
    refreshToken: string | null;
    type: string | null;
    urlError: string | null;
    errorDescription: string | null;
  }>({
    accessToken: null,
    refreshToken: null,
    type: null,
    urlError: null,
    errorDescription: null
  });

  // Parse URL fragments au chargement
  useEffect(() => {
    const hash = window.location.hash.substring(1); // Enlever le #
    console.log('🔍 Hash URL détecté:', hash);
    
    if (hash) {
      const params = new URLSearchParams(hash);
      console.log('📋 Paramètres parsés depuis hash:', {
        access_token: params.get('access_token')?.substring(0, 20) + '...',
        refresh_token: params.get('refresh_token'),
        type: params.get('type'),
        error: params.get('error')
      });
      
      setTokens({
        accessToken: params.get('access_token'),
        refreshToken: params.get('refresh_token'),
        type: params.get('type'),
        urlError: params.get('error'),
        errorDescription: params.get('error_description')
      });
    } else {
      // Fallback vers les paramètres de requête classiques
      console.log('📋 Fallback vers search params');
      setTokens({
        accessToken: searchParams.get('access_token'),
        refreshToken: searchParams.get('refresh_token'),
        type: searchParams.get('type'),
        urlError: searchParams.get('error'),
        errorDescription: searchParams.get('error_description')
      });
    }
  }, [searchParams]);

  // Vérifier et configurer la session quand les tokens sont disponibles
  useEffect(() => {
    const { accessToken, refreshToken, type, urlError, errorDescription } = tokens;
    
    console.log('🔐 Vérification tokens:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      type: type,
      hasError: !!urlError
    });
    
    // Vérifier s'il y a une erreur dans l'URL
    if (urlError) {
      console.error('❌ Erreur dans URL:', urlError, errorDescription);
      setError(`Erreur de redirection: ${errorDescription || urlError}`);
      return;
    }
    
    // Vérifier que c'est bien une demande de réinitialisation
    if (type !== 'recovery' || !accessToken || !refreshToken) {
      console.error('❌ Tokens manquants ou type incorrect:', { type, hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken });
      setError('Lien de réinitialisation invalide ou expiré');
      return;
    }

    console.log('✅ Tokens valides détectés, configuration de la session...');
    
    // Définir la session avec les tokens reçus
    if (isSupabaseConfigured()) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      }).then(({ error: sessionError }) => {
        if (sessionError) {
          console.error('❌ Erreur configuration session:', sessionError);
          setError('Erreur lors de la configuration de la session');
        } else {
          console.log('✅ Session configurée avec succès');
        }
      });
    }
  }, [tokens]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!isSupabaseConfigured()) {
      setError('Fonctionnalité non disponible en mode démo');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      
      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err) {
      console.error('Erreur mise à jour mot de passe:', err);
      
      let errorMessage = 'Une erreur est survenue';
      if (err instanceof Error) {
        if (err.message.includes('Invalid token')) {
          errorMessage = 'Lien de réinitialisation invalide ou expiré. Demandez un nouveau lien.';
        } else if (err.message.includes('Token expired')) {
          errorMessage = 'Le lien de réinitialisation a expiré. Demandez un nouveau lien.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Vérifier la validité du lien
  if (tokens.type !== 'recovery' || !tokens.accessToken || !tokens.refreshToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Lien invalide</h1>
          <p className="text-gray-600 text-lg mb-6">
            Ce lien de réinitialisation n'est pas valide ou a expiré.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-left">
            <h4 className="font-bold text-gray-800 mb-2">🔍 Informations de debug :</h4>
            <div className="text-gray-700 text-xs space-y-1">
              <div>• Type: {tokens.type || 'manquant'}</div>
              <div>• Access token: {tokens.accessToken ? 'présent' : 'manquant'}</div>
              <div>• Refresh token: {tokens.refreshToken ? 'présent' : 'manquant'}</div>
              <div>• URL Error: {tokens.urlError || 'aucune'}</div>
            </div>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-2xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Mot de passe mis à jour !
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers la page de connexion.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="text-green-700 text-sm">
              <div className="font-medium mb-1">✅ Mot de passe mis à jour</div>
              <div>Redirection automatique dans quelques secondes...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl animate-glow">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            BookingFast
          </h1>
          <p className="text-gray-600 text-lg">
            Créez votre nouveau mot de passe
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          )}

          {/* Nouveau mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Minimum 6 caractères
            </div>
          </div>

          {/* Confirmer le mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {password && confirmPassword && password !== confirmPassword && (
              <div className="text-xs text-red-500 mt-1">
                Les mots de passe ne correspondent pas
              </div>
            )}
          </div>

          {/* Indicateur de force du mot de passe */}
          {password && (
            <div className="space-y-2">
              <div className="text-xs text-gray-600">Force du mot de passe :</div>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => {
                  const strength = getPasswordStrength(password);
                  return (
                    <div
                      key={level}
                      className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                        strength >= level
                          ? strength === 1 ? 'bg-red-400'
                          : strength === 2 ? 'bg-orange-400'
                          : strength === 3 ? 'bg-yellow-400'
                          : 'bg-green-400'
                          : 'bg-gray-200'
                      }`}
                    />
                  );
                })}
              </div>
              <div className="text-xs text-gray-500">
                {getPasswordStrength(password) === 1 && 'Faible'}
                {getPasswordStrength(password) === 2 && 'Moyen'}
                {getPasswordStrength(password) === 3 && 'Bon'}
                {getPasswordStrength(password) === 4 && 'Excellent'}
              </div>
            </div>
          )}

          {/* Bouton de soumission */}
          <Button
            type="submit"
            loading={loading}
            disabled={!password || !confirmPassword || password !== confirmPassword}
            className="w-full"
          >
            <Save className="w-5 h-5" />
            Mettre à jour le mot de passe
          </Button>
        </form>

        {/* Conseils de sécurité */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
          <h4 className="font-bold text-blue-800 mb-2">🔒 Conseils de sécurité</h4>
          <div className="text-blue-700 text-xs space-y-1">
            <div>• Utilisez au moins 8 caractères</div>
            <div>• Mélangez majuscules, minuscules et chiffres</div>
            <div>• Ajoutez des caractères spéciaux (!@#$%)</div>
            <div>• Évitez les mots du dictionnaire</div>
            <div>• N'utilisez pas d'informations personnelles</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Fonction pour calculer la force du mot de passe
function getPasswordStrength(password: string): number {
  let strength = 0;
  
  if (password.length >= 6) strength++;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  
  return Math.min(strength, 4);
}
