import React, { useState } from 'react';
import { Key, Plus, CreditCard as Edit, Trash2, Copy, Clock, Users, Gift, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAdmin } from '../../hooks/useAdmin';
import { AccessCode } from '../../types/admin';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { LoadingSpinner } from '../UI/LoadingSpinner';

export function AccessCodeManagement() {
  const { accessCodes, redemptions, loading, createAccessCode, refetch } = useAdmin();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    access_type: 'days' as const,
    access_duration: 7,
    max_uses: 1,
    expires_at: ''
  });
  const [saving, setSaving] = useState(false);

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await createAccessCode({
        ...formData,
        expires_at: formData.expires_at || undefined
      });
      
      setShowCreateModal(false);
      setFormData({
        code: '',
        description: '',
        access_type: 'days',
        access_duration: 7,
        max_uses: 1,
        expires_at: ''
      });
      
      alert('Code d\'accès créé avec succès !');
    } catch (error) {
      alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Code copié dans le presse-papiers !');
    } catch (err) {
      console.error('Erreur copie:', err);
      alert('Erreur lors de la copie');
    }
  };

  const getAccessTypeLabel = (type: string, duration?: number) => {
    switch (type) {
      case 'days':
        return `${duration} jour${duration && duration > 1 ? 's' : ''}`;
      case 'weeks':
        return `${duration} semaine${duration && duration > 1 ? 's' : ''}`;
      case 'months':
        return `${duration} mois`;
      case 'lifetime':
        return 'À vie';
      default:
        return type;
    }
  };

  const getCodeStatusColor = (code: AccessCode) => {
    if (!code.is_active) return 'from-gray-100 to-gray-200 text-gray-700 border-gray-200';
    if (code.current_uses >= code.max_uses) return 'from-red-100 to-pink-100 text-red-700 border-red-200';
    if (code.expires_at && new Date(code.expires_at) < new Date()) return 'from-orange-100 to-yellow-100 text-orange-700 border-orange-200';
    return 'from-green-100 to-emerald-100 text-green-700 border-green-200';
  };

  const getCodeStatusText = (code: AccessCode) => {
    if (!code.is_active) return '🔒 Inactif';
    if (code.current_uses >= code.max_uses) return '✅ Épuisé';
    if (code.expires_at && new Date(code.expires_at) < new Date()) return '⏰ Expiré';
    return '🟢 Actif';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Jamais';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Key className="w-8 h-8 text-purple-600" />
              Codes d'Accès Secrets
            </h2>
            <p className="text-gray-600 mt-1">{accessCodes.length} code(s) créé(s)</p>
          </div>

          <Button
            onClick={() => {
              setFormData({
                code: generateRandomCode(),
                description: '',
                access_type: 'days',
                access_duration: 30,
                max_uses: 1,
                expires_at: ''
              });
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouveau Code
          </Button>
        </div>

        {/* Statistiques des codes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Key className="w-8 h-8" />
              <div className="text-2xl font-bold">{accessCodes.length}</div>
            </div>
            <div className="text-purple-100">Codes créés</div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Gift className="w-8 h-8" />
              <div className="text-2xl font-bold">{accessCodes.filter(c => c.is_active).length}</div>
            </div>
            <div className="text-green-100">Codes actifs</div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8" />
              <div className="text-2xl font-bold">{redemptions.length}</div>
            </div>
            <div className="text-blue-100">Codes utilisés</div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-8 h-8" />
              <div className="text-2xl font-bold">
                {accessCodes.filter(c => c.access_type === 'lifetime').length}
              </div>
            </div>
            <div className="text-orange-100">Accès à vie</div>
          </div>
        </div>

        {/* Liste des codes */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Codes d'Accès</h3>
          </div>

          {accessCodes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Code</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Description</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Accès</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Utilisation</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Statut</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {accessCodes.map((code, index) => (
                    <tr
                      key={code.id}
                      className="hover:bg-gray-50 transition-colors animate-fadeIn"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="font-mono text-lg font-bold text-purple-600 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
                            {code.code}
                          </div>
                          <button
                            onClick={() => copyToClipboard(code.code)}
                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Copier le code"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{code.description || 'Aucune description'}</div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {getAccessTypeLabel(code.access_type, code.access_duration)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {code.current_uses} / {code.max_uses}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(code.current_uses / code.max_uses) * 100}%` }}
                          />
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-gradient-to-r ${getCodeStatusColor(code)}`}>
                          {getCodeStatusText(code)}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyToClipboard(code.code)}
                            className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-110"
                            title="Copier"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Key className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun code créé</h4>
              <p className="text-gray-500 mb-6">Créez votre premier code d'accès secret</p>
              <Button 
                onClick={() => {
                  setFormData({
                    code: generateRandomCode(),
                    description: '',
                    access_type: 'days',
                    access_duration: 30,
                    max_uses: 1,
                    expires_at: ''
                  });
                  setShowCreateModal(true);
                }}
              >
                Créer un code
              </Button>
            </div>
          )}
        </div>

        {/* Historique des utilisations */}
        {redemptions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="w-6 h-6 text-green-600" />
                Historique des Utilisations ({redemptions.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Code</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Utilisateur</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Utilisé le</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Accès jusqu'au</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {redemptions.slice(0, 20).map((redemption, index) => {
                    const isLifetime = redemption.code?.access_type === 'lifetime';
                    const isExpired = redemption.access_granted_until && new Date(redemption.access_granted_until) < new Date();
                    
                    return (
                      <tr
                        key={redemption.id}
                        className="hover:bg-gray-50 transition-colors animate-fadeIn"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-6 py-4">
                          <div className="font-mono text-sm font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-200">
                            {redemption.code?.code}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{redemption.user?.email}</div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{formatDate(redemption.redeemed_at)}</div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {isLifetime ? (
                              <span className="inline-flex items-center gap-1 text-green-600 font-bold">
                                <Zap className="w-4 h-4" />
                                À vie
                              </span>
                            ) : (
                              formatDate(redemption.access_granted_until)
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            isLifetime 
                              ? 'bg-green-100 text-green-700'
                              : isExpired
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {isLifetime ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Actif à vie
                              </>
                            ) : isExpired ? (
                              <>
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Expiré
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 mr-1" />
                                Actif
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de création */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Créer un Code d'Accès"
          size="md"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code secret
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  required
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 font-mono"
                  placeholder="ABCD1234"
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, code: generateRandomCode() }))}
                  className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
                  title="Générer un code aléatoire"
                >
                  <Zap className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                placeholder="Description du code (optionnel)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d'accès
                </label>
                <select
                  value={formData.access_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, access_type: e.target.value as any }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                >
                  <option value="days">Jours</option>
                  <option value="weeks">Semaines</option>
                  <option value="months">Mois</option>
                  <option value="lifetime">À vie</option>
                </select>
              </div>

              {formData.access_type !== 'lifetime' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.access_duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, access_duration: parseInt(e.target.value) || 1 }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Utilisations maximum
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_uses}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_uses: parseInt(e.target.value) || 1 }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expire le (optionnel)
                </label>
                <input
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                />
              </div>
            </div>

            {/* Aperçu */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
              <h4 className="font-bold text-purple-800 mb-2">Aperçu du code</h4>
              <div className="text-purple-700 text-sm space-y-1">
                <div>• Code: <strong>{formData.code || 'XXXXXXXX'}</strong></div>
                <div>• Accès: <strong>{getAccessTypeLabel(formData.access_type, formData.access_duration)}</strong></div>
                <div>• Utilisations: <strong>{formData.max_uses} fois maximum</strong></div>
                {formData.expires_at && (
                  <div>• Expire: <strong>{formatDate(formData.expires_at)}</strong></div>
                )}
                <div className="mt-2 pt-2 border-t border-purple-300">
                  <div className="text-xs text-purple-600">
                    💡 <strong>Conseil :</strong> Les codes à vie sont parfaits pour les partenaires ou clients VIP
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateCode}
                loading={saving}
                disabled={!formData.code.trim()}
                className="flex-1"
              >
                Créer le Code
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
