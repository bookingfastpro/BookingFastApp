import React from 'react';
import { BarChart3, TrendingUp, Mail, Clock, CheckCircle, XCircle, Users, Zap } from 'lucide-react';
import { EmailWorkflow } from '../../types/email';
import { getWorkflowLogs } from '../../lib/workflowEngine';
import { useAuth } from '../../contexts/AuthContext';

interface WorkflowStatsProps {
  workflows: EmailWorkflow[];
}

export function WorkflowStats({ workflows }: WorkflowStatsProps) {
  const { user } = useAuth();
  const logs = getWorkflowLogs(user?.id || '');
  const recentLogs = logs.slice(0, 10);
  
  const totalWorkflows = workflows.length;
  const activeWorkflows = workflows.filter(w => w.active).length;
  const totalSent = workflows.reduce((sum, w) => sum + (w.sent_count || 0), 0);
  const averageSuccessRate = workflows.length > 0 
    ? workflows.reduce((sum, w) => sum + (w.success_rate || 0), 0) / workflows.length 
    : 0;

  const triggerStats = workflows.reduce((acc, workflow) => {
    acc[workflow.trigger] = (acc[workflow.trigger] || 0) + (workflow.sent_count || 0);
    return acc;
  }, {} as Record<string, number>);

  const getTriggerLabel = (trigger: string) => {
    const labels: Record<string, string> = {
      'booking_created': 'Nouvelles réservations',
      'booking_updated': 'Réservations modifiées',
      'payment_link_created': 'Liens de paiement',
      'payment_link_paid': 'Liens de paiement payés',
      'payment_completed': 'Paiements complétés',
      'booking_cancelled': 'Annulations',
      'reminder_24h': 'Rappels 24h',
      'reminder_1h': 'Rappels 1h',
      'follow_up': 'Suivis'
    };
    return labels[trigger] || trigger;
  };

  return (
    <>
      <div className="space-y-8">
      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white transform hover:scale-105 transition-all duration-300 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 text-blue-200" />
          </div>
          <div className="text-3xl font-bold mb-2">{totalWorkflows}</div>
          <div className="text-blue-100 text-sm">Workflows créés</div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white transform hover:scale-105 transition-all duration-300 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-200" />
          </div>
          <div className="text-3xl font-bold mb-2">{activeWorkflows}</div>
          <div className="text-green-100 text-sm">Workflows actifs</div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white transform hover:scale-105 transition-all duration-300 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 text-purple-200" />
          </div>
          <div className="text-3xl font-bold mb-2">{totalSent}</div>
          <div className="text-purple-100 text-sm">Emails envoyés</div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white transform hover:scale-105 transition-all duration-300 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 text-orange-200" />
          </div>
          <div className="text-3xl font-bold mb-2">{averageSuccessRate.toFixed(1)}%</div>
          <div className="text-orange-100 text-sm">Taux de succès moyen</div>
        </div>
      </div>

      {/* Statistiques par déclencheur */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Emails par déclencheur</h3>
            <p className="text-gray-600 text-sm">Répartition des envois par type d'événement</p>
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(triggerStats)
            .sort(([,a], [,b]) => b - a)
            .map(([trigger, count]) => {
              const percentage = totalSent > 0 ? (count / totalSent) * 100 : 0;
              
              return (
                <div key={trigger} className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium text-gray-700 truncate">
                    {getTriggerLabel(trigger)}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-16 text-right">
                    <div className="text-sm font-bold text-gray-900">{count}</div>
                    <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
        </div>

        {Object.keys(triggerStats).length === 0 && (
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Aucune donnée</h4>
            <p className="text-gray-500">Les statistiques apparaîtront une fois que vos workflows auront envoyé des emails</p>
          </div>
        )}
      </div>

      {/* Performance des workflows */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Performance des workflows</h3>
            <p className="text-gray-600 text-sm">Taux de succès et nombre d'envois par workflow</p>
          </div>
        </div>

        <div className="space-y-4">
          {workflows.map((workflow, index) => (
            <div
              key={workflow.id}
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-blue-200 animate-fadeIn"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`w-3 h-3 rounded-full ${workflow.active ? 'bg-green-500' : 'bg-gray-400'}`} />
              
              <div className="flex-1">
                <div className="font-medium text-gray-900">{workflow.name}</div>
                <div className="text-sm text-gray-600">{getTriggerLabel(workflow.trigger)}</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{workflow.sent_count || 0}</div>
                <div className="text-xs text-gray-500">Envoyés</div>
              </div>
              
              <div className="text-center">
                <div className={`text-lg font-bold ${
                  (workflow.success_rate || 0) >= 90 ? 'text-green-600' :
                  (workflow.success_rate || 0) >= 70 ? 'text-orange-600' : 'text-red-600'
                }`}>
                  {workflow.success_rate || 0}%
                </div>
                <div className="text-xs text-gray-500">Succès</div>
              </div>
            </div>
          ))}
        </div>

        {workflows.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun workflow</h4>
            <p className="text-gray-500">Créez votre premier workflow pour voir les statistiques</p>
          </div>
        )}
      </div>
      </div>

      {/* Logs récents */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Activité récente</h3>
            <p className="text-gray-600 text-sm">Dernières exécutions de workflows</p>
          </div>
        </div>

        <div className="space-y-3">
          {recentLogs.length > 0 ? (
            recentLogs.map((log, index) => (
              <div
                key={log.id}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 animate-fadeIn ${
                  log.status === 'success' 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                    : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  log.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {log.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <XCircle className="w-5 h-5 text-white" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="font-bold text-gray-900">{log.workflowName}</div>
                  <div className="text-sm text-gray-600">{log.clientEmail}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleString('fr-FR')}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-sm font-bold ${
                    log.status === 'success' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {log.status === 'success' ? '✅ Envoyé' : '❌ Échec'}
                  </div>
                  <div className="text-xs text-gray-500">{log.message}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Aucune activité</h4>
              <p className="text-gray-500">Les exécutions de workflows apparaîtront ici</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
