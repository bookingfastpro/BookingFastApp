import React, { useState } from 'react';
import { Users, Shield, Eye, EyeOff } from 'lucide-react';
import { useTeam } from '../../hooks/useTeam';
import { useMultiUserSettings } from '../../hooks/useMultiUserSettings';
import { LoadingSpinner } from '../UI/LoadingSpinner';

export function MultiUserSettingsPage() {
  const { teamMembers, loading: teamLoading } = useTeam();
  const { settings, loading: settingsLoading, updateSetting, getSettingForMember } = useMultiUserSettings();
  const [saving, setSaving] = useState<string | null>(null);
  const [localSettings, setLocalSettings] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const initial: Record<string, boolean> = {};
    teamMembers.forEach(member => {
      initial[member.id] = getSettingForMember(member.id);
    });
    setLocalSettings(initial);
  }, [teamMembers, settings]);

  const handleToggle = async (teamMemberId: string) => {
    const newValue = !localSettings[teamMemberId];
    setLocalSettings(prev => ({ ...prev, [teamMemberId]: newValue }));
    setSaving(teamMemberId);

    try {
      await updateSetting(teamMemberId, newValue);
      console.log('✅ Paramètre mis à jour:', { teamMemberId, restricted_visibility: newValue });
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      setLocalSettings(prev => ({ ...prev, [teamMemberId]: !newValue }));
    } finally {
      setSaving(null);
    }
  };

  if (teamLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Paramètres Multi-Utilisateurs</h2>
          <p className="text-gray-600">Gérez les permissions de visibilité des réservations</p>
        </div>
      </div>

      {teamMembers.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <Users className="w-12 h-12 text-blue-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun membre d'équipe</h3>
          <p className="text-gray-600">
            Ajoutez des membres à votre équipe depuis l'onglet Équipe pour configurer leurs permissions.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Membre</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Rôle</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">Visibilité restreinte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {teamMembers.map((member) => {
                  const isRestricted = localSettings[member.id] || false;
                  const isSaving = saving === member.id;

                  return (
                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                            {member.full_name?.charAt(0) || '?'}
                          </div>
                          <div className="font-medium text-gray-900">{member.full_name || 'Sans nom'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{member.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {member.role_name || 'viewer'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleToggle(member.id)}
                            disabled={isSaving}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                              isRestricted ? 'bg-green-500' : 'bg-gray-300'
                            } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <span
                              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                                isRestricted ? 'translate-x-7' : 'translate-x-1'
                              }`}
                            >
                              {isSaving ? (
                                <LoadingSpinner size="sm" />
                              ) : isRestricted ? (
                                <Eye className="w-4 h-4 text-green-500 m-1" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-gray-400 m-1" />
                              )}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="font-medium mb-1">À propos de la visibilité restreinte :</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Activé : Le membre voit uniquement les réservations qui lui sont assignées</li>
              <li>Désactivé : Le membre voit toutes les réservations</li>
              <li>Les propriétaires voient toujours toutes les réservations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
