import React, { useState } from 'react';
import { Calendar, Plus, Trash2, Edit2, Save, X, AlertTriangle } from 'lucide-react';
import { useBlockedDateRanges, BlockedDateRange } from '../../hooks/useBlockedDateRanges';
import { Button } from '../UI/Button';
import { LoadingSpinner } from '../UI/LoadingSpinner';

export function BlockedDateRanges() {
  const { blockedRanges, loading, addBlockedRange, updateBlockedRange, deleteBlockedRange } = useBlockedDateRanges();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!formData.start_date || !formData.end_date) {
      alert('Veuillez remplir les dates de début et de fin');
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      alert('La date de fin doit être après la date de début');
      return;
    }

    setSaving(true);
    try {
      await addBlockedRange(
        formData.start_date,
        formData.end_date,
        formData.reason || undefined
      );
      setFormData({ start_date: '', end_date: '', reason: '' });
      setIsAdding(false);
      alert('✅ Plage de dates bloquée avec succès !');
    } catch (error) {
      console.error('Erreur ajout:', error);
      alert('❌ Erreur lors de l\'ajout de la plage bloquée');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!formData.start_date || !formData.end_date) {
      alert('Veuillez remplir les dates de début et de fin');
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      alert('La date de fin doit être après la date de début');
      return;
    }

    setSaving(true);
    try {
      await updateBlockedRange(id, {
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason || undefined
      });
      setFormData({ start_date: '', end_date: '', reason: '' });
      setEditingId(null);
      alert('✅ Plage de dates mise à jour avec succès !');
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      alert('❌ Erreur lors de la mise à jour de la plage bloquée');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette plage bloquée ?')) {
      return;
    }

    try {
      await deleteBlockedRange(id);
      alert('✅ Plage de dates supprimée avec succès !');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('❌ Erreur lors de la suppression de la plage bloquée');
    }
  };

  const startEdit = (range: BlockedDateRange) => {
    setEditingId(range.id);
    setFormData({
      start_date: range.start_date,
      end_date: range.end_date,
      reason: range.reason || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ start_date: '', end_date: '', reason: '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Plages de dates bloquées</h3>
          <p className="text-sm text-gray-600 mt-1">
            Bloquez des périodes pour empêcher les réservations sur la page iframe
          </p>
        </div>
        {!isAdding && (
          <Button
            onClick={() => setIsAdding(true)}
            variant="primary"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            Ajouter une plage
          </Button>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <strong>💡 Comment ça fonctionne :</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Les dates bloquées ne seront pas disponibles sur la page de réservation iframe</li>
              <li>Les clients ne pourront pas sélectionner ces dates</li>
              <li>Vous pouvez toujours créer des réservations manuellement dans l'admin</li>
              <li>Exemple : Bloquer du 21/08/2025 au 12/12/2025 pour les vacances</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
          <h4 className="font-bold text-purple-900 mb-4">Nouvelle plage bloquée</h4>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de début *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de fin *
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison (optionnel)
              </label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                placeholder="Ex: Vacances d'été, Fermeture annuelle..."
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleAdd}
                loading={saving}
                variant="primary"
                className="flex-1"
              >
                <Save className="w-4 h-4" />
                Enregistrer
              </Button>
              <Button
                onClick={() => {
                  setIsAdding(false);
                  setFormData({ start_date: '', end_date: '', reason: '' });
                }}
                variant="secondary"
                disabled={saving}
              >
                <X className="w-4 h-4" />
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {blockedRanges.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Aucune plage bloquée
          </h3>
          <p className="text-gray-500">
            Ajoutez des plages de dates pour bloquer les réservations
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {blockedRanges.map((range) => (
            <div
              key={range.id}
              className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-purple-300 transition-all"
            >
              {editingId === range.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de début *
                      </label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de fin *
                      </label>
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Raison (optionnel)
                    </label>
                    <input
                      type="text"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                      placeholder="Ex: Vacances d'été, Fermeture annuelle..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleUpdate(range.id)}
                      loading={saving}
                      variant="primary"
                      size="sm"
                      className="flex-1"
                    >
                      <Save className="w-4 h-4" />
                      Enregistrer
                    </Button>
                    <Button
                      onClick={cancelEdit}
                      variant="secondary"
                      size="sm"
                      disabled={saving}
                    >
                      <X className="w-4 h-4" />
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg">
                          {new Date(range.start_date).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                          {' → '}
                          {new Date(range.end_date).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </div>
                        {range.reason && (
                          <p className="text-gray-600 text-sm mt-1">{range.reason}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                      <AlertTriangle className="w-4 h-4" />
                      <span>
                        Les clients ne pourront pas réserver pendant cette période
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(range)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(range.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
