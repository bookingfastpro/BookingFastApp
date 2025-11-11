import React, { useState, useEffect } from 'react';
import { X, Save, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { SmsWorkflow, SmsTemplate, SmsTrigger } from '../../types/sms';

interface SmsWorkflowEditorProps {
  workflow: SmsWorkflow | null;
  templates: SmsTemplate[];
  onSave: (workflow: Partial<SmsWorkflow>) => Promise<void>;
  onClose: () => void;
}

const TRIGGERS: { value: SmsTrigger; label: string; description: string }[] = [
  { value: 'booking_created', label: 'Nouvelle réservation', description: 'Envoyé lors de la création d\'une réservation' },
  { value: 'booking_updated', label: 'Réservation modifiée', description: 'Envoyé lors de la modification d\'une réservation' },
  { value: 'booking_cancelled', label: 'Réservation annulée', description: 'Envoyé lors de l\'annulation' },
  { value: 'payment_link_created', label: 'Lien de paiement créé', description: 'Envoyé quand un lien de paiement est généré' },
  { value: 'payment_link_paid', label: 'Paiement effectué', description: 'Envoyé après un paiement réussi' },
  { value: 'reminder_24h', label: 'Rappel 24h avant', description: 'Rappel automatique 24h avant le RDV' },
  { value: 'reminder_1h', label: 'Rappel 1h avant', description: 'Rappel automatique 1h avant le RDV' }
];

export function SmsWorkflowEditor({ workflow, templates, onSave, onClose }: SmsWorkflowEditorProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger: 'booking_created' as SmsTrigger,
    template_id: '',
    delay: 0,
    active: true,
    conditions: []
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (workflow) {
      setFormData({
        name: workflow.name,
        description: workflow.description || '',
        trigger: workflow.trigger as SmsTrigger,
        template_id: workflow.template_id,
        delay: workflow.delay || 0,
        active: workflow.active,
        conditions: workflow.conditions || []
      });
    }
  }, [workflow]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Le nom du workflow est requis');
      return;
    }

    if (!formData.template_id) {
      alert('Veuillez sélectionner un template SMS');
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du workflow');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-teal-500 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {workflow ? 'Modifier le workflow SMS' : 'Nouveau workflow SMS'}
              </h2>
              <p className="text-green-100 text-sm">Automatisez vos notifications SMS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Nom du workflow *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
              placeholder="Ex: SMS de confirmation"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
              placeholder="Description du workflow"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Déclencheur *
            </label>
            <select
              value={formData.trigger}
              onChange={(e) => setFormData({ ...formData, trigger: e.target.value as SmsTrigger })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
              required
            >
              {TRIGGERS.map((trigger) => (
                <option key={trigger.value} value={trigger.value}>
                  {trigger.label} - {trigger.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Template SMS *
            </label>
            <select
              value={formData.template_id}
              onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Sélectionnez un template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            {templates.length === 0 && (
              <p className="text-sm text-orange-600 mt-2">
                Aucun template SMS disponible. Créez-en un d'abord dans l'onglet Templates.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Délai avant envoi (secondes)
            </label>
            <input
              type="number"
              value={formData.delay}
              onChange={(e) => setFormData({ ...formData, delay: parseInt(e.target.value) || 0 })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
              min="0"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Temps d'attente avant l'envoi du SMS (0 = envoi immédiat)
            </p>
          </div>

          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
            />
            <label htmlFor="active" className="text-sm font-bold text-gray-700 cursor-pointer">
              Activer ce workflow
            </label>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h4 className="font-bold text-yellow-900 mb-2">💡 Rappel important</h4>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>Les SMS sont limités à 160 caractères</li>
              <li>Les numéros de téléphone doivent être au format international (+33...)</li>
              <li>Vérifiez que vos clients ont fourni leur numéro de téléphone</li>
              <li>Chaque SMS est facturé par Twilio</li>
            </ul>
          </div>

          <div className="flex gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-bold"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl hover:from-green-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
