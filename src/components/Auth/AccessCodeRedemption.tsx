import React, { useState } from 'react';
import { Gift, Key, CheckCircle, AlertCircle, Clock, Sparkles, Crown, Zap, Shield } from 'lucide-react';
import { useAdmin } from '../../hooks/useAdmin';
import { Button } from '../UI/Button';

interface AccessCodeRedemptionProps {
  onSuccess?: () => void;
}

export function AccessCodeRedemption({ onSuccess }: AccessCodeRedemptionProps) {
  const { redeemAccessCode } = useAdmin();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const result = await redeemAccessCode(code.trim().toUpperCase());
      
      if (result) {
        setResult({
          type: 'success',
          message: '🎉 Code utilisé avec succès ! Votre accès a été étendu. Rechargement en cours...'
        });
        setCode('');
        
        // Forcer le rechargement de la page pour mettre à jour l'état d'authentification
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        
        onSuccess?.();
      } else {
        setResult({
          type: 'error',
          message: 'Échec de l\'utilisation du code.'
        });
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 border-2 border-purple-200 animate-slideDown space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center animate-glow">
          <Gift className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-purple-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Code d'Accès Secret
          </h3>
          <p className="text-purple-600">Débloquez toutes les fonctionnalités</p>
        </div>
      </div>

      {/* Exemples de codes */}
      <div className="bg-white/80 backdrop-blur-sm border border-purple-300 rounded-xl p-4">
        <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
          <Key className="w-4 h-4" />
          Types de codes disponibles
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-3 text-center">
            <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <div className="font-bold text-blue-800">Temporaire</div>
            <div className="text-blue-600">Jours/Semaines/Mois</div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 text-center">
            <Crown className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <div className="font-bold text-green-800">À vie</div>
            <div className="text-green-600">Accès permanent</div>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-3 text-center">
            <Zap className="w-5 h-5 text-orange-600 mx-auto mb-1" />
            <div className="font-bold text-orange-800">Premium</div>
            <div className="text-orange-600">Fonctionnalités bonus</div>
          </div>
        </div>
      </div>

      {/* Formulaire de saisie */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Code secret *
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full pl-12 pr-4 py-3 border-2 border-purple-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-300 font-mono text-lg bg-white shadow-inner"
              placeholder="ABCD1234"
              maxLength={20}
            />
          </div>
          <div className="text-xs text-purple-600 mt-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Entrez votre code secret (8 caractères minimum)</span>
          </div>
        </div>

        {result && (
          <div className={`p-4 rounded-xl border-2 flex items-center gap-3 ${
            result.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {result.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span className="font-medium">{result.message}</span>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          loading={loading}
          disabled={!code.trim()}
          className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 hover:from-purple-700 hover:via-pink-700 hover:to-red-600"
        >
          <Key className="w-5 h-5" />
          🚀 Débloquer l'accès
        </Button>
      </div>

      {/* Avantages */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Avantages des codes secrets
        </h4>
        <div className="text-blue-700 text-sm space-y-1">
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3" />
            <span>Accès immédiat à toutes les fonctionnalités</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>Durée d'accès variable selon le code</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3" />
            <span>Codes sécurisés à usage limité</span>
          </div>
          <div className="flex items-center gap-2">
            <Crown className="w-3 h-3" />
            <span>Certains codes offrent un accès à vie</span>
          </div>
        </div>
      </div>
    </div>
  );
}
