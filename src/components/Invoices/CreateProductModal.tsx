import React, { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { Package, Euro, Percent } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { Product } from '../../types';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated?: () => void;
  editingProduct?: Product | null;
}

export function CreateProductModal({ isOpen, onClose, onProductCreated, editingProduct }: CreateProductModalProps) {
  const { createProduct, updateProduct } = useProducts();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_ht: '',
    tva_rate: '20',
    unit: 'unité'
  });

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        description: editingProduct.description || '',
        price_ht: editingProduct.price_ht.toString(),
        tva_rate: editingProduct.tva_rate.toString(),
        unit: editingProduct.unit || 'unité'
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price_ht: '',
        tva_rate: '20',
        unit: 'unité'
      });
    }
  }, [editingProduct, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const priceHT = parseFloat(formData.price_ht);
    const tvaRate = parseFloat(formData.tva_rate);

    if (!formData.name || isNaN(priceHT) || priceHT <= 0) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (isNaN(tvaRate) || tvaRate < 0) {
      alert('Le taux de TVA doit être un nombre valide');
      return;
    }

    try {
      setLoading(true);

      const price_ttc = priceHT * (1 + tvaRate / 100);

      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: formData.name,
          description: formData.description,
          price_ht: priceHT,
          price_ttc,
          tva_rate: tvaRate,
          unit: formData.unit
        });
        alert('✅ Produit modifié avec succès !');
      } else {
        await createProduct({
          name: formData.name,
          description: formData.description,
          price_ht: priceHT,
          price_ttc,
          tva_rate: tvaRate,
          unit: formData.unit,
          is_active: true
        });
        alert('✅ Produit créé avec succès !');
      }
      
      // Réinitialiser le formulaire
      setFormData({
        name: '',
        description: '',
        price_ht: '',
        tva_rate: '20',
        unit: 'unité'
      });

      if (onProductCreated) {
        onProductCreated();
      }

      onClose();
    } catch (error) {
      console.error('Erreur création produit:', error);
      alert('❌ Erreur lors de la création du produit');
    } finally {
      setLoading(false);
    }
  };

  const calculatePriceTTC = () => {
    const priceHT = parseFloat(formData.price_ht);
    const tvaRate = parseFloat(formData.tva_rate);
    
    if (isNaN(priceHT) || isNaN(tvaRate)) return '0.00';
    
    return (priceHT * (1 + tvaRate / 100)).toFixed(2);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingProduct ? "Modifier le produit" : "Créer un produit"} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nom du produit */}
        <div>
          <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
            <Package className="w-4 h-4 mr-2 text-purple-600" />
            Nom du produit *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Entretien Jet ski Complet"
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description détaillée du produit/service..."
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        {/* Prix HT et TVA */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
              <Euro className="w-4 h-4 mr-2 text-green-600" />
              Prix HT (€) *
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={formData.price_ht}
              onChange={(e) => {
                const value = e.target.value;
                // Permet les nombres décimaux avec point ou virgule
                if (value === '' || /^\d*[.,]?\d*$/.test(value)) {
                  setFormData({ ...formData, price_ht: value.replace(',', '.') });
                }
              }}
              placeholder="0.00"
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-semibold"
              required
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
              <Percent className="w-4 h-4 mr-2 text-orange-600" />
              TVA (%)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={formData.tva_rate}
              onChange={(e) => {
                const value = e.target.value;
                // Permet les nombres décimaux avec point ou virgule
                if (value === '' || /^\d*[.,]?\d*$/.test(value)) {
                  setFormData({ ...formData, tva_rate: value.replace(',', '.') });
                }
              }}
              placeholder="20"
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg font-semibold"
            />
          </div>
        </div>

        {/* Unité */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Unité
          </label>
          <input
            type="text"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            placeholder="unité, heure, jour..."
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        {/* Aperçu Prix TTC */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-gray-700">Prix TTC:</span>
            <span className="text-lg font-black text-purple-600">
              {calculatePriceTTC()}€
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={loading}
          >
            {loading ? 'Création...' : 'Créer le produit'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
