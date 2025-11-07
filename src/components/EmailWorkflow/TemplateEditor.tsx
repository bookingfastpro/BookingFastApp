import React, { useState, useEffect } from 'react';
import { X, Save, Eye, Code, Type, Image, Link, Bold, Italic, List } from 'lucide-react';
import { EmailTemplate } from '../../types/email';
import { Modal } from '../UI/Modal';

interface TemplateEditorProps {
  template: EmailTemplate | null;
  onSave: (template: Partial<EmailTemplate>) => void;
  onClose: () => void;
}

export function TemplateEditor({ template, onSave, onClose }: TemplateEditorProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    html_content: '',
    text_content: ''
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'html' | 'text'>('html');

  const variables = [
    { key: '{{client_firstname}}', description: 'Prénom du client' },
    { key: '{{client_lastname}}', description: 'Nom du client' },
    { key: '{{client_email}}', description: 'Email du client' },
    { key: '{{client_phone}}', description: 'Téléphone du client' },
    { key: '{{service_name}}', description: 'Nom du service' },
    { key: '{{service_description}}', description: 'Description du service' },
    { key: '{{service_price}}', description: 'Prix du service' },
    { key: '{{service_duration}}', description: 'Durée du service' },
    { key: '{{booking_date}}', description: 'Date de réservation' },
    { key: '{{booking_time}}', description: 'Heure de réservation' },
    { key: '{{booking_quantity}}', description: 'Nombre de participants' },
    { key: '{{total_amount}}', description: 'Montant total' },
    { key: '{{payment_amount}}', description: 'Montant payé' },
    { key: '{{remaining_amount}}', description: 'Montant restant' },
    { key: '{{payment_link}}', description: 'Lien de paiement' },
    { key: '{{business_name}}', description: 'Nom de l\'entreprise' },
    { key: '{{current_date}}', description: 'Date actuelle' },
    { key: '{{current_time}}', description: 'Heure actuelle' }
  ];

  const templates = {
    confirmation: {
      subject: 'Confirmation de votre réservation - {{service_name}}',
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">{{business_name}}</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Confirmation de réservation</p>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <h2 style="color: #333; margin-top: 0;">Bonjour {{client_firstname}},</h2>
    
    <p style="color: #666; line-height: 1.6;">
      Votre réservation a été confirmée avec succès ! Voici les détails :
    </p>
    
    <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #334155; margin-top: 0;">Détails de votre réservation</h3>
      <p><strong>Service :</strong> {{service_name}}</p>
      <p><strong>Date :</strong> {{booking_date}}</p>
      <p><strong>Heure :</strong> {{booking_time}}</p>
      <p><strong>Durée :</strong> {{service_duration}} minutes</p>
      <p><strong>Participants :</strong> {{booking_quantity}}</p>
      <p><strong>Montant total :</strong> {{total_amount}}€</p>
    </div>
    
    <p style="color: #666; line-height: 1.6;">
      Nous avons hâte de vous accueillir ! Si vous avez des questions, n'hésitez pas à nous contacter.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{payment_link}}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Finaliser le paiement
      </a>
    </div>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 14px;">
    <p>{{business_name}} - {{current_date}}</p>
  </div>
</div>`,
      text: `Bonjour {{client_firstname}},

Votre réservation a été confirmée avec succès !

Détails de votre réservation :
- Service : {{service_name}}
- Date : {{booking_date}}
- Heure : {{booking_time}}
- Durée : {{service_duration}} minutes
- Participants : {{booking_quantity}}
- Montant total : {{total_amount}}€

Lien de paiement : {{payment_link}}

Nous avons hâte de vous accueillir !

{{business_name}}`
    },
    reminder: {
      subject: 'Rappel : Votre rendez-vous demain - {{service_name}}',
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fef3c7;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Rappel</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Votre rendez-vous approche</p>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <h2 style="color: #333; margin-top: 0;">Bonjour {{client_firstname}},</h2>
    
    <p style="color: #666; line-height: 1.6;">
      Nous vous rappelons que vous avez un rendez-vous demain :
    </p>
    
    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <h3 style="color: #92400e; margin-top: 0;">Votre rendez-vous</h3>
      <p><strong>Service :</strong> {{service_name}}</p>
      <p><strong>Date :</strong> {{booking_date}}</p>
      <p><strong>Heure :</strong> {{booking_time}}</p>
    </div>
    
    <p style="color: #666; line-height: 1.6;">
      À bientôt !
    </p>
  </div>
</div>`,
      text: `Bonjour {{client_firstname}},

Rappel : Vous avez un rendez-vous demain

Service : {{service_name}}
Date : {{booking_date}}
Heure : {{booking_time}}

À bientôt !

{{business_name}}`
    }
  };

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        subject: template.subject,
        html_content: template.html_content,
        text_content: template.text_content
      });
    }
  }, [template]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById(activeTab === 'html' ? 'html-content' : 'text-content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const content = activeTab === 'html' ? formData.html_content : formData.text_content;
      const newContent = content.substring(0, start) + variable + content.substring(end);
      
      setFormData(prev => ({
        ...prev,
        [activeTab === 'html' ? 'html_content' : 'text_content']: newContent
      }));
      
      // Remettre le focus et la position du curseur
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const loadTemplate = (templateKey: keyof typeof templates) => {
    const selectedTemplate = templates[templateKey];
    setFormData(prev => ({
      ...prev,
      subject: selectedTemplate.subject,
      html_content: selectedTemplate.html,
      text_content: selectedTemplate.text
    }));
  };

  const getPreviewContent = () => {
    const sampleData = {
      '{{client_firstname}}': 'Jean',
      '{{client_lastname}}': 'Dupont',
      '{{client_email}}': 'jean.dupont@email.com',
      '{{client_phone}}': '06 12 34 56 78',
      '{{service_name}}': 'Massage relaxant',
      '{{service_description}}': 'Massage de détente de 60 minutes',
      '{{service_price}}': '80.00',
      '{{service_duration}}': '60',
      '{{booking_date}}': '15 janvier 2024',
      '{{booking_time}}': '14:30',
      '{{booking_quantity}}': '1',
      '{{total_amount}}': '80.00',
      '{{payment_amount}}': '24.00',
      '{{remaining_amount}}': '56.00',
      '{{payment_link}}': '#',
      '{{business_name}}': 'BookingPro',
      '{{current_date}}': new Date().toLocaleDateString('fr-FR'),
      '{{current_time}}': new Date().toLocaleTimeString('fr-FR')
    };

    let content = formData.html_content;
    Object.entries(sampleData).forEach(([key, value]) => {
      content = content.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });
    
    return content;
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={template ? 'Modifier le template' : 'Nouveau template'}
      size="full"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
        {/* Sidebar - Variables */}
        <div className="lg:col-span-1 bg-gray-50 rounded-lg p-4 overflow-y-auto">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Code className="w-5 h-5 text-purple-600" />
            Variables disponibles
          </h3>
          
          <div className="space-y-2">
            {variables.map((variable, index) => (
              <button
                key={index}
                type="button"
                onClick={() => insertVariable(variable.key)}
                className="w-full text-left p-3 bg-white rounded-lg hover:bg-purple-50 hover:border-purple-200 border border-gray-200 transition-all duration-200 group"
              >
                <div className="font-mono text-sm text-purple-600 group-hover:text-purple-700">
                  {variable.key}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {variable.description}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6">
            <h4 className="font-bold text-gray-900 mb-3">Templates prédéfinis</h4>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => loadTemplate('confirmation')}
                className="w-full p-3 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
              >
                📧 Confirmation
              </button>
              <button
                type="button"
                onClick={() => loadTemplate('reminder')}
                className="w-full p-3 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium"
              >
                ⏰ Rappel
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="h-full flex flex-col">
            {/* Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du template *
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
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                  placeholder="Description du template"
                />
              </div>
            </div>

            {/* Subject */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sujet de l'email *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                placeholder="Ex: Confirmation de votre réservation"
              />
            </div>

            {/* Content Tabs */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('html')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      activeTab === 'html'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Code className="w-4 h-4 inline mr-2" />
                    HTML
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('text')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      activeTab === 'text'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Type className="w-4 h-4 inline mr-2" />
                    Texte
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                    previewMode
                      ? 'bg-green-500 text-white'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  {previewMode ? 'Éditer' : 'Aperçu'}
                </button>
              </div>

              {/* Content Editor */}
              <div className="flex-1">
                {previewMode ? (
                  <div className="h-full border border-gray-300 rounded-lg overflow-auto">
                    <div 
                      className="p-4 h-full"
                      dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
                    />
                  </div>
                ) : (
                  <textarea
                    id={activeTab === 'html' ? 'html-content' : 'text-content'}
                    value={activeTab === 'html' ? formData.html_content : formData.text_content}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      [activeTab === 'html' ? 'html_content' : 'text_content']: e.target.value
                    }))}
                    className="w-full h-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 font-mono text-sm resize-none"
                    placeholder={activeTab === 'html' ? 'Contenu HTML de l\'email...' : 'Contenu texte de l\'email...'}
                  />
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t border-gray-200 mt-6">
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
                {template ? 'Modifier' : 'Créer'} le template
              </button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}
