import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Zap, Clock, Mail, Filter } from 'lucide-react';
import { EmailWorkflow, EmailTemplate, WorkflowCondition } from '../../types/email';
import { Modal } from '../UI/Modal';
import { useServices } from '../../hooks/useServices';

interface WorkflowEditorProps {
  workflow: EmailWorkflow | null;
  templates: EmailTemplate[];
  onSave: (workflow: Partial<EmailWorkflow>) => void;
  onClose: () => void;
}

export function WorkflowEditor({ workflow, templates, onSave, onClose }: WorkflowEditorProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger: 'booking_created',
    template_id: '',
    delay: 0,
    active: true,
    conditions: [] as WorkflowCondition[]
  });

  const triggers = [
    { value: 'booking_created', label: '📅 Nouvelle réservation' },
    { value: 'booking_updated', label: '✏️ Réservation modifiée' },
    { value: 'payment_link_created', label: '💳 Lien de paiement créé' },
    { value: 'payment_link_paid', label: '💰 Lien de paiement payé' },
    { value: 'payment_completed', label: '✅ Paiement complété' },
    { value: 'booking_cancelled', label: '❌ Réservation annulée' },
    { value: 'reminder_24h', label: '⏰ Rappel 24h avant' },
    { value: 'reminder_1h', label: '🔔 Rappel 1h avant' },
    { value: 'follow_up', label: '📧 Suivi post-service' }
  ];

  const conditionFields = [
    { value: 'booking_status', label: 'Statut réservation' },
    { value: 'payment_status', label: 'Statut paiement' },
    { value: 'service_name', label: 'Nom du service' },
    { value: 'service_id', label: 'Service spécifique' },
    { value: 'total_amount', label: 'Montant total' },
    { value: 'client_email', label: 'Email client' }
  ];

  const operators = [
    { value: 'equals', label: 'Égal à' },
    { value: 'not_equals', label: 'Différent de' },
    { value: 'contains', label: 'Contient' },
    { value: 'greater_than', label: 'Supérieur à' },
    { value: 'less_than', label: 'Inférieur à' }
  ];

  // Récupérer les services pour les sélecteurs
  const { services } = useServices();

  // Options pour les statuts de réservation
  const bookingStatusOptions = [
    { value: 'pending', label: 'En attente' },
    { value: 'confirmed', label: 'Confirmée' },
    { value: 'cancelled', label: 'Annulée' }
  ];

  // Options pour les statuts de paiement
  const paymentStatusOptions = [
    { value: 'pending', label: 'Non payé' },
    { value: 'partial', label: 'Acompte' },
    { value: 'completed', label: 'Payé' }
  ];

  // Fonction pour obtenir les options selon le champ
  const getFieldOptions = (field: string) => {
    switch (field) {
      case 'booking_status':
        return bookingStatusOptions;
      case 'payment_status':
        return paymentStatusOptions;
      case 'service_id':
        return services.map(service => ({
          value: service.id,
          label: service.name
        }));
      default:
        return [];
    }
  };

  // Fonction pour déterminer si on doit afficher un sélecteur ou un input
  const shouldShowSelector = (field: string) => {
    return ['booking_status', 'payment_status', 'service_id'].includes(field);
  };

  useEffect(() => {
    if (workflow) {
      setFormData({
        name: workflow.name,
        description: workflow.description,
        trigger: workflow.trigger,
        template_id: workflow.template_id,
        delay: workflow.delay || 0,
        active: workflow.active,
        conditions: workflow.conditions || []
      });
    }
  }, [workflow]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        { field: 'booking_status', operator: 'equals', value: '' }
      ]
    }));
  };

  const updateCondition = (index: number, field: keyof WorkflowCondition, value: string) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, idx) =>
        idx === index ? { ...condition, [field]: value } : condition
      )
    }));
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, idx) => idx !== index)
    }));
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={workflow ? 'Modifier le workflow' : 'Nouveau workflow'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informations générales */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              Informations générales
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du workflow *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                placeholder="Ex: Confirmation de réservation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                placeholder="Décrivez ce workflow..."
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">
                Workflow actif
              </label>
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Configuration
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Déclencheur *
              </label>
              <select
                value={formData.trigger}
                onChange={(e) => setFormData(prev => ({ ...prev, trigger: e.target.value }))}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
              >
                {triggers.map(trigger => (
                  <option key={trigger.value} value={trigger.value}>
                    {trigger.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template email *
              </label>
              <select
                value={formData.template_id}
                onChange={(e) => setFormData(prev => ({ ...prev, template_id: e.target.value }))}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
              >
                <option value="">Sélectionner un template</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Délai d'envoi (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={formData.delay}
                onChange={(e) => setFormData(prev => ({ ...prev, delay: parseInt(e.target.value) || 0 }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                placeholder="0 = immédiat"
              />
            </div>
          </div>
        </div>

        {/* Conditions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Filter className="w-5 h-5 text-orange-600" />
              Conditions (optionnel)
            </h3>
            <button
              type="button"
              onClick={addCondition}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter condition
            </button>
          </div>

          <div className="space-y-3">
            {formData.conditions.map((condition, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <select
                  value={condition.field}
                  onChange={(e) => updateCondition(index, 'field', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  {conditionFields.map(field => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </select>

                <select
                  value={condition.operator}
                  onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  {operators.map(op => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={condition.value}
                  onChange={(e) => updateCondition(index, 'value', e.target.value)}
                  placeholder="Valeur"
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                {shouldShowSelector(condition.field) ? (
                  <select
                    value={condition.value}
                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Sélectionner...</option>
                    {getFieldOptions(condition.field).map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={condition.value}
                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                    placeholder="Valeur"
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                )}

                <button
                  type="button"
                  onClick={() => removeCondition(index)}
                  className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {formData.conditions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>Aucune condition définie</p>
                <p className="text-sm">Le workflow s'exécutera pour tous les événements</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-2xl hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 text-white px-6 py-3 rounded-2xl hover:from-purple-700 hover:via-pink-700 hover:to-red-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-medium flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {workflow ? 'Modifier' : 'Créer'} le workflow
          </button>
        </div>
      </form>
    </Modal>
  );
}
