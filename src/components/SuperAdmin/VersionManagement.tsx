import React, { useState, useEffect } from 'react';
import { Settings, Plus, CreditCard as Edit, Trash2, CheckCircle, Clock, Save, X, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { LoadingSpinner } from '../UI/LoadingSpinner';

interface AppVersion {
  id: string;
  version: string;
  build: string;
  release_notes?: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export function VersionManagement() {
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVersion, setEditingVersion] = useState<AppVersion | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    version: '',
    build: '',
    release_notes: '',
    is_current: false
  });

  const fetchVersions = async () => {
    if (!supabase) {
      setVersions([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('app_versions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur chargement versions:', error);
        setVersions([]);
      } else {
        setVersions(data || []);
      }
    } catch (err) {
      console.error('Erreur chargement versions:', err);
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.version || !formData.build) {
      alert('Version et build sont requis');
      return;
    }

    setSaving(true);
    try {
      if (editingVersion) {
        // Modification
        const { error } = await supabase
          .from('app_versions')
          .update({
            version: formData.version,
            build: formData.build,
            release_notes: formData.release_notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingVersion.id);

        if (error) throw error;

        // Si on marque cette version comme actuelle
        if (formData.is_current && !editingVersion.is_current) {
          await setCurrentVersion(editingVersion.id);
        }
      } else {
        // Création
        const { data, error } = await supabase
          .from('app_versions')
          .insert([{
            version: formData.version,
            build: formData.build,
            release_notes: formData.release_notes,
            is_current: formData.is_current
          }])
          .select()
          .single();

        if (error) throw error;

        // Si on marque cette version comme actuelle
        if (formData.is_current && data) {
          await setCurrentVersion(data.id);
        }
      }

      await fetchVersions();
      setShowModal(false);
      resetForm();
      alert('Version sauvegardée avec succès !');
    } catch (error) {
      console.error('Erreur sauvegarde version:', error);
      alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  const setCurrentVersion = async (versionId: string) => {
    try {
      const { error } = await supabase.rpc('set_current_version', { version_id: versionId });
      
      if (error) throw error;
      
      await fetchVersions();
      alert('Version actuelle mise à jour !');
    } catch (error) {
      console.error('Erreur mise à jour version actuelle:', error);
      alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const deleteVersion = async (versionId: string) => {
    if (window.confirm('Supprimer cette version ?')) {
      try {
        const { error } = await supabase
          .from('app_versions')
          .delete()
          .eq('id', versionId);

        if (error) throw error;
        
        await fetchVersions();
        alert('Version supprimée !');
      } catch (error) {
        console.error('Erreur suppression version:', error);
        alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      version: '',
      build: '',
      release_notes: '',
      is_current: false
    });
    setEditingVersion(null);
  };

  const handleEdit = (version: AppVersion) => {
    setEditingVersion(version);
    setFormData({
      version: version.version,
      build: version.build,
      release_notes: version.release_notes || '',
      is_current: version.is_current
    });
    setShowModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    fetchVersions();
  }, []);

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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-600" />
              Gestion des Versions
            </h2>
            <p className="text-gray-600 mt-1">Gérez les versions affichées sur la page de connexion</p>
          </div>

          <Button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Version
          </Button>
        </div>

        {/* Version actuelle */}
        {versions.find(v => v.is_current) && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-800">Version Actuelle</h3>
                <p className="text-green-600">Affichée sur la page de connexion</p>
              </div>
            </div>
            
            {(() => {
              const currentVersion = versions.find(v => v.is_current)!;
              return (
                <div className="bg-white border border-green-300 rounded-xl p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-700 font-medium">Version:</span>
                      <div className="font-bold text-green-800 text-lg">{currentVersion.version}</div>
                    </div>
                    <div>
                      <span className="text-green-700 font-medium">Build:</span>
                      <div className="font-bold text-green-800 text-lg">{currentVersion.build}</div>
                    </div>
                    {currentVersion.release_notes && (
                      <div className="sm:col-span-2">
                        <span className="text-green-700 font-medium">Notes:</span>
                        <div className="text-green-800 mt-1">{currentVersion.release_notes}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Liste des versions */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Historique des Versions ({versions.length})</h3>
          </div>

          {versions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Version</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Build</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Notes</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Statut</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Créée le</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {versions.map((version, index) => (
                    <tr
                      key={version.id}
                      className="hover:bg-gray-50 transition-colors animate-fadeIn"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 text-lg">{version.version}</div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="font-mono text-gray-700">{version.build}</div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {version.release_notes || 'Aucune note'}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {version.is_current ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-700 border border-green-200">
                              <CheckCircle className="w-4 h-4" />
                              Actuelle
                            </span>
                          ) : (
                            <button
                              onClick={() => setCurrentVersion(version.id)}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-200 transition-all duration-300"
                            >
                              <Clock className="w-4 h-4" />
                              Activer
                            </button>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{formatDate(version.created_at)}</div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(version)}
                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {!version.is_current && (
                            <button
                              onClick={() => deleteVersion(version.id)}
                              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Aucune version</h4>
              <p className="text-gray-500 mb-6">Créez votre première version</p>
              <Button onClick={() => setShowModal(true)}>
                Créer une version
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de création/modification */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingVersion ? 'Modifier la version' : 'Nouvelle version'}
          size="md"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Version *
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  placeholder="1.2.3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Build *
                </label>
                <input
                  type="text"
                  value={formData.build}
                  onChange={(e) => setFormData(prev => ({ ...prev, build: e.target.value }))}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  placeholder="2025.01.28"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes de version
              </label>
              <textarea
                value={formData.release_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, release_notes: e.target.value }))}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                placeholder="Décrivez les nouveautés de cette version..."
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_current"
                checked={formData.is_current}
                onChange={(e) => setFormData(prev => ({ ...prev, is_current: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_current" className="text-sm font-medium text-gray-700">
                Définir comme version actuelle
              </label>
            </div>

            {formData.is_current && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Cette version sera affichée sur la page de connexion
                  </span>
                </div>
              </div>
            )}

            {/* Aperçu */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-4">
              <h4 className="font-bold text-gray-800 mb-2">Aperçu sur la page de connexion</h4>
              <div className="text-xs text-gray-400 font-mono bg-white border border-gray-200 rounded-lg p-3">
                Version {formData.version || '1.2.3'} - Build {formData.build || '2025.01.28'}
                {formData.release_notes && (
                  <div className="mt-1">{formData.release_notes}</div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="secondary"
                onClick={() => setShowModal(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                loading={saving}
                disabled={!formData.version || !formData.build}
                className="flex-1"
              >
                <Save className="w-4 h-4" />
                {editingVersion ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
