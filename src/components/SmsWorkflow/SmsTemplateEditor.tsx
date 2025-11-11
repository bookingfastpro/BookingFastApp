import React, { useState, useEffect } from 'react';
import { X, Save, MessageSquare, Info } from 'lucide-react';
import { SmsTemplate } from '../../types/sms';

interface SmsTemplateEditorProps {
  template: SmsTemplate | null;
  onSave: (template: Partial<SmsTemplate>) => Promise<void>;
  onClose: () => void;
}

const MAX_SMS_LENGTH = 160;

const AVAILABLE_VARIABLES = [
  { key: '{{client_firstname}}', description: 'Prénom du client' },
  { key: '{{client_lastname}}', description: 'Nom du client' },
  { key: '{{client_phone}}', description: 'Téléphone du client' },
  { key: '{{service_name}}', description: 'Nom du service' },
  { key: '{{booking_date}}', description: 'Date de réservation (format court)' },
  { key: '{{booking_time}}', description: 'Heure de réservation' },
  { key: '{{booking_quantity}}', description: 'Nombre de participants' },
  { key: '{{total_amount}}', description: 'Montant total' },
  { key: '{{payment_link}}', description: 'Lien de paiement' },
  { key: '{{business_name}}', description: 'Nom de votre entreprise' }
];

export function SmsTemplateEditor({ template, onSave, onClose }: SmsTemplateEditorProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: ''
  });
  const [saving, setSaving] = useState(false);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        content: template.content
      });
      setCharCount(template.content.length);
    }
  }, [template]);

  const handleContentChange = (value: string) => {
    if (value.length <= MAX_SMS_LENGTH) {
      setFormData({ ...formData, content: value });
      setCharCount(value.length);
    }
  };

  const insertVariable = (variable: string) => {
    const newContent = formData.content + variable;
    if (newContent.length <= MAX_SMS_LENGTH) {
      setFormData({ ...formData, content: newContent });
      setCharCount(newContent.length);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Le nom du template est requis');
      return;
    }

    if (!formData.content.trim()) {
      alert('Le contenu du SMS est requis');
      return;
    }

    if (formData.content.length > MAX_SMS_LENGTH) {
      alert(`Le contenu dépasse ${MAX_SMS_LENGTH} caractères`);
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-teal-500 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {template ? 'Modifier le template SMS' : 'Nouveau template SMS'}
              </h2>
              <p className="text-green-100 text-sm">Créez vos messages SMS personnalisés</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-blue-900 mb-1">Limite SMS</h3>
                    <p className="text-sm text-blue-700">
                      Les SMS sont limités à {MAX_SMS_LENGTH} caractères. Soyez concis et efficace!
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nom du template *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: Confirmation réservation"
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
                  placeholder="Description du template"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Contenu du SMS *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 font-mono text-sm"
                  rows={6}
                  placeholder="Entrez le contenu de votre SMS..."
                  required
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">
                    Utilisez les variables ci-contre pour personnaliser votre message
                  </span>
                  <span className={`text-sm font-bold ${charCount > MAX_SMS_LENGTH - 20 ? 'text-red-600' : 'text-gray-600'}`}>
                    {charCount} / {MAX_SMS_LENGTH}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-2">Aperçu SMS</h4>
                <div className="bg-white rounded-lg p-3 border border-gray-300 min-h-[100px]">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {formData.content || 'Votre message apparaîtra ici...'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Variables disponibles</h3>
              <p className="text-sm text-gray-600 mb-4">
                Cliquez sur une variable pour l'insérer dans votre message
              </p>
              <div className="space-y-2">
                {AVAILABLE_VARIABLES.map((variable) => (
                  <button
                    key={variable.key}
                    type="button"
                    onClick={() => insertVariable(variable.key)}
                    className="w-full text-left p-3 bg-gradient-to-r from-green-50 to-teal-50 hover:from-green-100 hover:to-teal-100 rounded-xl border border-green-200 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="font-mono text-sm text-green-700 font-bold">
                      {variable.key}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {variable.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-6 pt-6 border-t">
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
