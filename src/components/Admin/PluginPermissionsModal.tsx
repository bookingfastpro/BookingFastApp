import React, { useState, useEffect } from 'react';
import { Shield, Save, X, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { usePluginPermissions } from '../../hooks/usePluginPermissions';
import { useAuth } from '../../contexts/AuthContext';
import { TeamMemberPluginAccess } from '../../types/plugin';

interface PluginPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export function PluginPermissionsModal({ isOpen, onClose, member }: PluginPermissionsModalProps) {
  const { user } = useAuth();
  const { getTeamMemberPluginPermissions, bulkUpdatePluginPermissions } = usePluginPermissions();
  const [permissions, setPermissions] = useState<TeamMemberPluginAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadPermissions();
    }
  }, [isOpen, user, member.id]);

  const loadPermissions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('🔍 Chargement permissions pour:', { owner: user.id, member: member.id });
      
      // ✅ CORRECTION : Utiliser user.id comme owner_id (propriétaire connecté)
      const data = await getTeamMemberPluginPermissions(user.id, member.id);
      
      console.log('✅ Permissions reçues:', data);
      setPermissions(data);
    } catch (error) {
      console.error('❌ Erreur chargement permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (pluginId: string) => {
    setPermissions(prev =>
      prev.map(p =>
        p.plugin_id === pluginId
          ? { ...p, can_access: !p.can_access }
          : p
      )
    );
  };

  const selectAll = () => {
    setPermissions(prev => prev.map(p => ({ ...p, can_access: true })));
  };

  const deselectAll = () => {
    setPermissions(prev => prev.map(p => ({ ...p, can_access: false })));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = permissions.map(p => ({
        pluginId: p.plugin_id,
        canAccess: p.can_access
      }));

      await bulkUpdatePluginPermissions(member.id, updates);
      alert('✅ Permissions mises à jour avec succès !');
      onClose();
    } catch (error) {
      console.error('❌ Erreur sauvegarde permissions:', error);
      alert('❌ Erreur lors de la sauvegarde des permissions');
    } finally {
      setSaving(false);
    }
  };

  const getPluginIcon = (iconName: string) => {
    const icons: Record<string, string> = {
      'BarChart3': '📊',
      'Car': '🚗',
      'Users': '👥',
      'Megaphone': '📢',
      'Package': '📦',
      'ShoppingCart': '🛒'
    };
    return icons[iconName] || '🔌';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Permissions des Plugins"
      size="lg"
    >
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900">
                {member.full_name || member.email}
              </div>
              <div className="text-sm text-gray-600">{member.email}</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : permissions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              Aucun plugin disponible
            </h4>
            <p className="text-gray-600">
              Vous devez d'abord vous abonner à des plugins pour pouvoir donner des accès.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {permissions.filter(p => p.can_access).length} / {permissions.length} plugin(s) activé(s)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 transition-colors font-medium"
                >
                  Tout activer
                </button>
                <button
                  onClick={deselectAll}
                  className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition-colors font-medium"
                >
                  Tout désactiver
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {permissions.map((permission, index) => (
                <div
                  key={permission.plugin_id}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 animate-fadeIn ${
                    permission.can_access
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl ${
                      permission.can_access
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                        : 'bg-gray-200'
                    }`}>
                      {getPluginIcon(permission.plugin_icon)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">
                        {permission.plugin_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {permission.plugin_slug}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => togglePermission(permission.plugin_id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      permission.can_access
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {permission.can_access ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Activé</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Désactivé</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={saving}
          >
            <X className="w-4 h-4" />
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading || permissions.length === 0}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Sauvegarder
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
