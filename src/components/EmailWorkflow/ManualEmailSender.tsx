import React, { useState } from 'react';
import { Send, User, Mail, FileText, Eye, TestTube, CheckCircle, AlertCircle } from 'lucide-react';
import { useClients } from '../../hooks/useClients';
import { useEmailWorkflows } from '../../hooks/useEmailWorkflows';
import { sendManualEmail } from '../../lib/workflowEngine';
import { useAuth } from '../../contexts/AuthContext';

export function ManualEmailSender() {
  const { clients } = useClients();
  const { templates } = useEmailWorkflows();
  const { user } = useAuth();
  
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [useTemplate, setUseTemplate] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const selectedClientData = clients.find(c => c.id === selectedClient);
  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  const replaceVariables = (content: string) => {
    if (!selectedClientData) return content;
    
    const variables: Record<string, string> = {
      '{{client_firstname}}': selectedClientData.firstname,
      '{{client_lastname}}': selectedClientData.lastname,
      '{{client_email}}': selectedClientData.email,
      '{{client_phone}}': selectedClientData.phone,
      '{{business_name}}': 'BookingPro',
      '{{current_date}}': new Date().toLocaleDateString('fr-FR'),
      '{{current_time}}': new Date().toLocaleTimeString('fr-FR')
    };

    let result = content;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    return result;
  };

  const getEmailContent = () => {
    if (useTemplate && selectedTemplateData) {
      return {
        subject: replaceVariables(selectedTemplateData.subject),
        htmlContent: replaceVariables(selectedTemplateData.html_content),
        textContent: replaceVariables(selectedTemplateData.text_content)
      };
    } else {
      return {
        subject: customSubject,
        htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Bonjour ${selectedClientData?.firstname || ''},</h2>
          <div style="white-space: pre-wrap;">${customMessage}</div>
          <br>
          <p>Cordialement,<br>BookingPro</p>
        </div>`,
        textContent: `Bonjour ${selectedClientData?.firstname || ''},\n\n${customMessage}\n\nCordialement,\nBookingPro`
      };
    }
  };

  const handleSendEmail = async () => {
    if (!selectedClientData || !user) {
      setSendResult('❌ Veuillez sélectionner un client');
      return;
    }

    if (useTemplate && !selectedTemplateData) {
      setSendResult('❌ Veuillez sélectionner un template');
      return;
    }

    if (!useTemplate && (!customSubject || !customMessage)) {
      setSendResult('❌ Veuillez remplir le sujet et le message');
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const emailContent = getEmailContent();
      
      const success = await sendManualEmail(
        user.id,
        selectedClientData.email,
        `${selectedClientData.firstname} ${selectedClientData.lastname}`,
        emailContent.subject,
        emailContent.htmlContent,
        emailContent.textContent
      );
      
      if (success) {
        setSendResult('✅ Email envoyé avec succès !');
        
        // Réinitialiser le formulaire
        if (!useTemplate) {
          setCustomSubject('');
          setCustomMessage('');
        }
      } else {
        setSendResult('❌ Erreur lors de l\'envoi de l\'email');
      }
      setSendResult('✅ Email envoyé avec succès !');
      
      // Réinitialiser le formulaire
      if (!useTemplate) {
        setCustomSubject('');
        setCustomMessage('');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi:', error);
      setSendResult(`❌ ${error instanceof Error ? error.message : 'Erreur lors de l\'envoi'}`);
    } finally {
      setSending(false);
      // Effacer le message après 5 secondes
      setTimeout(() => setSendResult(null), 5000);
    }
  };

  const emailContent = getEmailContent();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Envoi manuel d'emails</h2>
          <p className="text-gray-600">Envoyez des emails personnalisés à vos clients</p>
        </div>
        
        <button
          onClick={() => setPreviewMode(!previewMode)}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
            previewMode
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
              : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
          }`}
        >
          <Eye className="w-4 h-4" />
          {previewMode ? 'Mode édition' : 'Aperçu'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulaire */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Destinataire
            </h3>
            
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
            >
              <option value="">Sélectionner un client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.firstname} {client.lastname} ({client.email})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Contenu de l'email
            </h3>
            
            {/* Toggle Template/Custom */}
            <div className="flex gap-2 mb-4 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setUseTemplate(true)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                  useTemplate
                    ? 'bg-white text-purple-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Utiliser un template
              </button>
              <button
                onClick={() => setUseTemplate(false)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                  !useTemplate
                    ? 'bg-white text-purple-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Message personnalisé
              </button>
            </div>

            {useTemplate ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
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
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sujet
                  </label>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                    placeholder="Sujet de l'email"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={8}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                    placeholder="Votre message personnalisé..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Résultat d'envoi */}
          {sendResult && (
            <div className={`p-4 rounded-lg border-2 ${
              sendResult.startsWith('✅')
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {sendResult.startsWith('✅') ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                {sendResult}
              </div>
            </div>
          )}

          {/* Bouton d'envoi */}
          <button
            onClick={handleSendEmail}
            disabled={sending || !selectedClient || (useTemplate && !selectedTemplate) || (!useTemplate && (!customSubject || !customMessage))}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-2xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg font-bold flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Envoyer l'email
              </>
            )}
          </button>
        </div>

        {/* Aperçu */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-green-600" />
            Aperçu de l'email
          </h3>
          
          {selectedClientData ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">À:</div>
                <div className="font-medium">{selectedClientData.email}</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Sujet:</div>
                <div className="font-medium">{emailContent.subject || 'Aucun sujet'}</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="text-sm text-gray-600 mb-2">Contenu:</div>
                {previewMode && emailContent.htmlContent ? (
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: emailContent.htmlContent }}
                  />
                ) : (
                  <div className="text-gray-800 whitespace-pre-wrap">
                    {emailContent.textContent || 'Aucun contenu'}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>Sélectionnez un client pour voir l'aperçu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
