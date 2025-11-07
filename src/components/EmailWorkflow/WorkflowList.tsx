import React from 'react';
import { Play, Pause, CreditCard as Edit, Trash2, Mail, Clock, User, Zap } from 'lucide-react';
import { EmailWorkflow, EmailTemplate } from '../../types/email';

interface WorkflowListProps {
  workflows: EmailWorkflow[];
  templates: EmailTemplate[];
  onEdit: (workflow: EmailWorkflow) => void;
  onDelete: (workflow: EmailWorkflow) => void;
  onToggle: (workflow: EmailWorkflow) => void;
}

export function WorkflowList({ workflows, templates, onEdit, onDelete, onToggle }: WorkflowListProps) {
  const getTriggerLabel = (trigger: string) => {
    const labels: Record<string, string> = {
      'booking_created': '📅 Nouvelle réservation',
      'booking_updated': '✏️ Réservation modifiée',
      'payment_link_created': '💳 Lien de paiement créé',
      'payment_link_paid': '💰 Lien de paiement payé',
      'payment_completed': '✅ Paiement complété',
      'booking_cancelled': '❌ Réservation annulée',
      'reminder_24h': '⏰ Rappel 24h avant',
      'reminder_1h': '🔔 Rappel 1h avant',
      'follow_up': '📧 Suivi post-service'
    };
    return labels[trigger] || trigger;
  };

  const getTemplateName = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    return template?.name || 'Template supprimé';
  };

  if (workflows.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun workflow</h3>
        <p className="text-gray-500 mb-6">Créez votre premier workflow d'automatisation</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {workflows.map((workflow, index) => (
        <div
          key={workflow.id}
          className={`bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-fadeIn ${
            workflow.active ? 'border-l-4 border-green-500' : 'border-l-4 border-gray-300'
          }`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                workflow.active 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                  : 'bg-gradient-to-r from-gray-400 to-gray-500'
              }`}>
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{workflow.name}</h3>
                <p className="text-sm text-gray-600">{workflow.description}</p>
              </div>
            </div>
            
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              workflow.active 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {workflow.active ? 'Actif' : 'Inactif'}
            </div>
          </div>

          {/* Trigger */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Déclencheur</span>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="font-medium text-purple-800">
                {getTriggerLabel(workflow.trigger)}
              </div>
              {workflow.delay && workflow.delay > 0 && (
                <div className="text-sm text-purple-600 mt-1">
                  Délai: {workflow.delay} minute(s)
                </div>
              )}
            </div>
          </div>

          {/* Template */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Template</span>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="font-medium text-blue-800">
                {getTemplateName(workflow.template_id)}
              </div>
            </div>
          </div>

          {/* Conditions */}
          {workflow.conditions && workflow.conditions.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">Conditions</span>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                {workflow.conditions.map((condition, idx) => (
                  <div key={idx} className="text-sm text-orange-800">
                    {condition.field} {condition.operator} {condition.value}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{workflow.sent_count || 0}</div>
              <div className="text-xs text-green-700">Envoyés</div>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{workflow.success_rate || 0}%</div>
              <div className="text-xs text-blue-700">Succès</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => onToggle(workflow)}
              className={`flex-1 px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 font-medium ${
                workflow.active
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
              }`}
            >
              {workflow.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {workflow.active ? 'Pause' : 'Activer'}
            </button>
            <button
              onClick={() => onEdit(workflow)}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 font-medium"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </button>
            <button
              onClick={() => onDelete(workflow)}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
