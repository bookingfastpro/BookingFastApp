import React, { useState, useEffect } from 'react';
import { Settings, Percent, DollarSign, FileText, Plus, Edit } from 'lucide-react';
import { Modal } from '../UI/Modal';
import { POSSettings as POSSettingsType, POSCategory, POSProduct } from '../../types/pos';

interface POSSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: POSSettingsType;
  onSave: (settings: Partial<POSSettingsType>) => Promise<void>;
  categories?: POSCategory[];
  onAddCategory?: () => void;
  onAddProduct?: () => void;
}

export function POSSettings({ isOpen, onClose, settings, onSave, categories = [], onAddCategory, onAddProduct }: POSSettingsProps) {
  const [formData, setFormData] = useState({
    tax_rate: '',
    currency: 'EUR',
    receipt_header: '',
    receipt_footer: '',
    auto_print: false
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData({
      tax_rate: settings.tax_rate.toString(),
      currency: settings.currency,
      receipt_header: settings.receipt_header || '',
      receipt_footer: settings.receipt_footer || '',
      auto_print: settings.auto_print
    });
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await onSave({
        tax_rate: parseFloat(formData.tax_rate),
        currency: formData.currency,
        receipt_header: formData.receipt_header || null,
        receipt_footer: formData.receipt_footer || null,
        auto_print: formData.auto_print
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Paramètres POS"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Gestion des catégories et services */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Gestion des données</h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={onAddCategory}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg text-sm flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter une catégorie
            </button>
            <button
              type="button"
              onClick={onAddProduct}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg text-sm flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter un service
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Percent className="w-4 h-4 inline mr-2" />
            Taux de TVA (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            required
            value={formData.tax_rate}
            onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="w-4 h-4 inline mr-2" />
            Devise
          </label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="EUR">Euro (€)</option>
            <option value="USD">Dollar ($)</option>
            <option value="GBP">Livre (£)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline mr-2" />
            En-tête du ticket
          </label>
          <textarea
            value={formData.receipt_header}
            onChange={(e) => setFormData({ ...formData, receipt_header: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={3}
            placeholder="Nom de votre entreprise, adresse..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pied de page du ticket
          </label>
          <textarea
            value={formData.receipt_footer}
            onChange={(e) => setFormData({ ...formData, receipt_footer: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={3}
            placeholder="Merci de votre visite..."
          />
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.auto_print}
              onChange={(e) => setFormData({ ...formData, auto_print: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Impression automatique des tickets
            </span>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
