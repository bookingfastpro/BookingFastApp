import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, Check, X, Sparkles } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Plugin, PluginFeature } from '../../types/plugin';
import { LoadingSpinner } from '../UI/LoadingSpinner';

export function PluginManagement() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlugin, setEditingPlugin] = useState<Plugin | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchPlugins();
  }, []);

  const fetchPlugins = async () => {
    try {
      // Vérifier si Supabase est configuré
      if (!supabase) {
        console.log('⚠️ Supabase non configuré');
        setPlugins([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('plugins')
        .select('*')
        .order('name');

      if (error) throw error;
      setPlugins(data || []);
    } catch (err) {
      console.error('Erreur chargement plugins:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (pluginId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce plugin ?')) return;

    try {
      const { error } = await supabase
        .from('plugins')
        .delete()
        .eq('id', pluginId);

      if (error) throw error;
      await fetchPlugins();
    } catch (err) {
      console.error('Erreur suppression plugin:', err);
      alert('Erreur lors de la suppression du plugin');
    }
  };

  const toggleActive = async (plugin: Plugin) => {
    try {
      const { error } = await supabase
        .from('plugins')
        .update({ is_active: !plugin.is_active })
        .eq('id', plugin.id);

      if (error) throw error;
      await fetchPlugins();
    } catch (err) {
      console.error('Erreur mise à jour plugin:', err);
      alert('Erreur lors de la mise à jour du plugin');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Plugins</h2>
          <p className="text-gray-600 mt-1">Créez et gérez les plugins disponibles</p>
        </div>
        <button
          onClick={() => {
            setEditingPlugin(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nouveau Plugin
        </button>
      </div>

      {/* Liste des plugins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {plugins.map(plugin => (
          <PluginCard
            key={plugin.id}
            plugin={plugin}
            onEdit={() => {
              setEditingPlugin(plugin);
              setShowForm(true);
            }}
            onDelete={() => handleDelete(plugin.id)}
            onToggleActive={() => toggleActive(plugin)}
          />
        ))}
      </div>

      {/* Formulaire */}
      {showForm && (
        <PluginForm
          plugin={editingPlugin}
          onClose={() => {
            setShowForm(false);
            setEditingPlugin(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingPlugin(null);
            fetchPlugins();
          }}
        />
      )}
    </div>
  );
}

interface PluginCardProps {
  plugin: Plugin;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

function PluginCard({ plugin, onEdit, onDelete, onToggleActive }: PluginCardProps) {
  const IconComponent = (LucideIcons as any)[plugin.icon] || Package;
  const includedFeatures = plugin.features.filter(f => f.included);

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{plugin.name}</h3>
              <p className="text-sm text-gray-600">{plugin.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {plugin.is_featured && (
              <Sparkles className="w-5 h-5 text-yellow-500" />
            )}
            <button
              onClick={onToggleActive}
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                plugin.is_active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {plugin.is_active ? 'Actif' : 'Inactif'}
            </button>
          </div>
        </div>
        <p className="text-gray-700">{plugin.description}</p>
      </div>

      {/* Prix et fonctionnalités */}
      <div className="p-6">
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-bold text-gray-900">{plugin.base_price}€</span>
          <span className="text-gray-600">/mois</span>
        </div>

        <div className="space-y-2 mb-6">
          <p className="text-sm font-bold text-gray-900">
            {includedFeatures.length} fonctionnalités incluses
          </p>
          <p className="text-sm text-gray-600">
            {plugin.features.length - includedFeatures.length} fonctionnalités additionnelles
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-xl font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Modifier
          </button>
          <button
            onClick={onDelete}
            className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

interface PluginFormProps {
  plugin: Plugin | null;
  onClose: () => void;
  onSave: () => void;
}

function PluginForm({ plugin, onClose, onSave }: PluginFormProps) {
  const [formData, setFormData] = useState({
    name: plugin?.name || '',
    slug: plugin?.slug || '',
    description: plugin?.description || '',
    icon: plugin?.icon || 'Package',
    category: plugin?.category || 'general',
    base_price: plugin?.base_price || 0,
    is_featured: plugin?.is_featured || false,
    features: plugin?.features || []
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (plugin) {
        // Mise à jour
        const { error } = await supabase
          .from('plugins')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', plugin.id);

        if (error) throw error;
      } else {
        // Création
        const { error } = await supabase
          .from('plugins')
          .insert(formData);

        if (error) throw error;
      }

      onSave();
    } catch (err) {
      console.error('Erreur sauvegarde plugin:', err);
      alert('Erreur lors de la sauvegarde du plugin');
    } finally {
      setSaving(false);
    }
  };

  const addFeature = () => {
    setFormData({
      ...formData,
      features: [
        ...formData.features,
        {
          id: `feature_${Date.now()}`,
          name: '',
          description: '',
          included: true
        }
      ]
    });
  };

  const updateFeature = (index: number, updates: Partial<PluginFeature>) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = { ...newFeatures[index], ...updates };
    setFormData({ ...formData, features: newFeatures });
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {plugin ? 'Modifier le plugin' : 'Nouveau plugin'}
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du plugin *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug (identifiant) *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icône (Lucide React)
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={e => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix mensuel (€) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.base_price}
                onChange={e => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={e => setFormData({ ...formData, is_featured: e.target.checked })}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">Plugin en vedette</span>
            </label>
          </div>

          {/* Fonctionnalités */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Fonctionnalités</h3>
              <button
                type="button"
                onClick={addFeature}
                className="bg-purple-100 text-purple-600 px-4 py-2 rounded-xl font-medium hover:bg-purple-200 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>

            <div className="space-y-4">
              {formData.features.map((feature, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Nom de la fonctionnalité"
                        value={feature.name}
                        onChange={e => updateFeature(index, { name: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Description"
                        value={feature.description}
                        onChange={e => updateFeature(index, { description: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={feature.included}
                        onChange={e => updateFeature(index, { included: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Incluse dans le prix de base</span>
                    </label>

                    {!feature.included && (
                      <input
                        type="number"
                        placeholder="Prix additionnel (€)"
                        min="0"
                        step="0.01"
                        value={feature.price || ''}
                        onChange={e => updateFeature(index, { price: parseFloat(e.target.value) || 0 })}
                        className="w-40 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Enregistrement...
                </span>
              ) : (
                plugin ? 'Mettre à jour' : 'Créer le plugin'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
