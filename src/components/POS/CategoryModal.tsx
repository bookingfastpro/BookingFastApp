import React, { useState, useEffect } from 'react';
import { Folder, Palette } from 'lucide-react';
import { Modal } from '../UI/Modal';
import { ModalFooter } from '../UI/ModalFooter';
import { POSCategory } from '../../types/pos';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: POSCategory | null;
  onSave: (category: Partial<POSCategory>) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const COLORS = [
  { value: 'blue', label: 'Bleu', class: 'from-blue-500 to-cyan-500' },
  { value: 'green', label: 'Vert', class: 'from-green-500 to-emerald-500' },
  { value: 'red', label: 'Rouge', class: 'from-red-500 to-pink-500' },
  { value: 'purple', label: 'Violet', class: 'from-purple-500 to-pink-500' },
  { value: 'orange', label: 'Orange', class: 'from-orange-500 to-red-500' }
];

export function CategoryModal({ isOpen, onClose, category, onSave, onDelete }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    color: 'blue'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        color: category.color
      });
    } else {
      setFormData({
        name: '',
        color: 'blue'
      });
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  const footerButtons = [
    ...(onDelete ? [{
      label: 'Supprimer',
      onClick: onDelete,
      variant: 'danger' as const,
      disabled: saving,
      icon: '🗑️'
    }] : []),
    {
      label: 'Annuler',
      onClick: onClose,
      variant: 'secondary' as const,
      disabled: saving
    },
    {
      label: 'Enregistrer',
      onClick: () => {},
      variant: 'primary' as const,
      disabled: saving,
      loading: saving,
      icon: '💾'
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Folder className="w-4 h-4 inline mr-2" />
            Nom de la catégorie *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Ex: Coiffure"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Palette className="w-4 h-4 inline mr-2" />
            Couleur
          </label>
          <div className="grid grid-cols-5 gap-2">
            {COLORS.map(color => (
              <button
                key={color.value}
                type="button"
                onClick={() => setFormData({ ...formData, color: color.value })}
                className={`h-12 rounded-xl bg-gradient-to-r ${color.class} ${
                  formData.color === color.value ? 'ring-4 ring-offset-2 ring-purple-500' : ''
                }`}
                title={color.label}
              />
            ))}
          </div>
        </div>

        <ModalFooter buttons={footerButtons} />
      </form>
    </Modal>
  );
}
