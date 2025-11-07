import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Clock, Calendar, AlertCircle, UserCheck } from 'lucide-react';
import { Unavailability } from '../../types';
import { useTeamMembers } from '../../hooks/useTeamMembers';
import { usePlugins } from '../../hooks/usePlugins';
import { useTeam } from '../../hooks/useTeam';

interface UnavailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (unavailability: Omit<Unavailability, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  editingUnavailability?: Unavailability | null;
  selectedDate?: string;
}

export function UnavailabilityModal({
  isOpen,
  onClose,
  onSave,
  editingUnavailability,
  selectedDate
}: UnavailabilityModalProps) {
  const [date, setDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [reason, setReason] = useState('');
  const [assignedUserId, setAssignedUserId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { teamMembers } = useTeamMembers();
  const { hasPluginAccess } = usePlugins();
  const { isOwner } = useTeam();
  const [showUserAssignment, setShowUserAssignment] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const multiUserActive = await hasPluginAccess('multi-user');
      setShowUserAssignment(isOwner && multiUserActive);
    };
    checkAccess();
  }, [hasPluginAccess, isOwner]);

  useEffect(() => {
    if (editingUnavailability) {
      setDate(editingUnavailability.date);
      setStartTime(editingUnavailability.start_time.slice(0, 5));
      setEndTime(editingUnavailability.end_time.slice(0, 5));
      setReason(editingUnavailability.reason || '');
      setAssignedUserId(editingUnavailability.assigned_user_id || '');
    } else if (selectedDate) {
      setDate(selectedDate);
    }
  }, [editingUnavailability, selectedDate]);

  useEffect(() => {
    if (isOpen) {
      // Bloquer le scroll du body
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      // Créer le conteneur modal-root s'il n'existe pas
      if (!document.getElementById('modal-root')) {
        const modalRoot = document.createElement('div');
        modalRoot.id = 'modal-root';
        document.body.appendChild(modalRoot);
      }

      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (startTime >= endTime) {
      setError('L\'heure de fin doit être après l\'heure de début');
      return;
    }

    setSaving(true);

    try {
      await onSave({
        date,
        start_time: startTime,
        end_time: endTime,
        reason: reason.trim() || undefined,
        assigned_user_id: assignedUserId || null
      });
      
      onClose();
      
      // Reset form
      setDate(new Date().toISOString().split('T')[0]);
      setStartTime('09:00');
      setEndTime('10:00');
      setReason('');
      setAssignedUserId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const getMemberDisplayName = (member: typeof teamMembers[0]) => {
    if (member.firstname && member.lastname) {
      return `${member.firstname} ${member.lastname}`;
    }
    if (member.full_name) {
      return member.full_name;
    }
    if (member.firstname) {
      return member.firstname;
    }
    return member.email || 'Membre sans nom';
  };

  const modalContent = (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn z-[9998]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 z-[9999]">
        <div className="bg-white w-full sm:max-w-2xl max-h-full sm:max-h-[90vh] sm:rounded-3xl shadow-2xl transform animate-slideUp flex flex-col">
          {/* Header avec safe area */}
          <div 
            className="flex-shrink-0 relative overflow-hidden sm:rounded-t-3xl"
            style={{
              paddingTop: 'env(safe-area-inset-top, 0px)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-orange-600 to-yellow-600"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
            
            <div className="relative z-10 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-white">
                      {editingUnavailability ? 'Modifier l\'indisponibilité' : 'Nouvelle indisponibilité'}
                    </h2>
                    <p className="text-sm text-white/80 mt-1">
                      Bloquer un créneau horaire
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={onClose}
                  className="p-2 sm:p-3 text-white hover:bg-white/20 rounded-xl transition-all"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Form avec safe area */}
          <div 
            className="flex-1 overflow-y-auto"
            style={{
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Heures */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    Heure de début
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    Heure de fin
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Assignation utilisateur */}
              {showUserAssignment && teamMembers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-gray-500" />
                    Assigner à un membre (optionnel)
                  </label>
                  <select
                    value={assignedUserId}
                    onChange={(e) => setAssignedUserId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Tous les membres</option>
                    {teamMembers.map(member => (
                      <option key={member.user_id} value={member.user_id}>
                        {getMemberDisplayName(member)}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Si non assigné, l'indisponibilité s'appliquera à tous les membres
                  </p>
                </div>
              )}

              {/* Raison */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison (optionnel)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Pause déjeuner, Réunion, Congés..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:flex-1 bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-orange-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Enregistrement...' : editingUnavailability ? 'Modifier' : 'Créer l\'indisponibilité'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );

  // Utiliser le portail React
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return ReactDOM.createPortal(modalContent, modalRoot);
}
