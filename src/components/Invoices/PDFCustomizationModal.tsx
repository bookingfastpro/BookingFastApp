import React, { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { Palette, Save, Upload, X } from 'lucide-react';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface PDFCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PDFColors {
  primary: string;
  accent: string;
  text: string;
}

export function PDFCustomizationModal({ isOpen, onClose }: PDFCustomizationModalProps) {
  const { user } = useAuth();
  const { companyInfo, updateCompanyInfo } = useCompanyInfo();
  const [colors, setColors] = useState<PDFColors>({
    primary: '#9333ea',
    accent: '#ec4899',
    text: '#1f2937'
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Charger les couleurs depuis company_info
    if (companyInfo) {
      setColors({
        primary: companyInfo.pdf_primary_color || '#9333ea',
        accent: companyInfo.pdf_accent_color || '#ec4899',
        text: companyInfo.pdf_text_color || '#1f2937'
      });
      
      if (companyInfo.logo_url) {
        setLogoPreview(companyInfo.logo_url);
      }
    }
  }, [companyInfo]);

  const presetThemes = [
    {
      name: 'Violet & Rose (Défaut)',
      colors: { primary: '#9333ea', accent: '#ec4899', text: '#1f2937' }
    },
    {
      name: 'Bleu Professionnel',
      colors: { primary: '#2563eb', accent: '#0ea5e9', text: '#1e293b' }
    },
    {
      name: 'Vert Nature',
      colors: { primary: '#059669', accent: '#10b981', text: '#064e3b' }
    },
    {
      name: 'Orange Dynamique',
      colors: { primary: '#ea580c', accent: '#f59e0b', text: '#7c2d12' }
    },
    {
      name: 'Rouge Élégant',
      colors: { primary: '#dc2626', accent: '#f43f5e', text: '#7f1d1d' }
    },
    {
      name: 'Indigo Moderne',
      colors: { primary: '#4f46e5', accent: '#6366f1', text: '#312e81' }
    }
  ];

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        alert('❌ Veuillez sélectionner une image');
        return;
      }

      // Vérifier la taille (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('❌ L\'image ne doit pas dépasser 2MB');
        return;
      }

      setLogoFile(file);
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !user) return null;

    try {
      setUploading(true);

      // Créer un nom de fichier unique
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload vers Supabase Storage
      const { data, error } = await supabase!.storage
        .from('company-assets')
        .upload(filePath, logoFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase!.storage
        .from('company-assets')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Erreur upload logo:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Vérifier que company_info existe
      if (!companyInfo) {
        alert('❌ Veuillez d\'abord remplir les informations de votre entreprise dans les paramètres');
        return;
      }

      let logoUrl = companyInfo.logo_url || null;

      // Upload du logo si un nouveau fichier est sélectionné
      if (logoFile) {
        logoUrl = await uploadLogo();
      } else if (logoPreview === null && companyInfo.logo_url) {
        // Si l'utilisateur a supprimé le logo
        logoUrl = null;
      }

      // IMPORTANT: Inclure company_name (champ obligatoire)
      await updateCompanyInfo({
        company_name: companyInfo.company_name,
        pdf_primary_color: colors.primary,
        pdf_accent_color: colors.accent,
        pdf_text_color: colors.text,
        logo_url: logoUrl
      });

      alert('✅ Personnalisation enregistrée ! Les couleurs et le logo seront appliqués aux PDFs (aperçu ET emails).');
      onClose();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde');
    }
  };

  const handleReset = async () => {
    if (!companyInfo) {
      alert('❌ Veuillez d\'abord remplir les informations de votre entreprise');
      return;
    }

    const defaultColors = { primary: '#9333ea', accent: '#ec4899', text: '#1f2937' };
    setColors(defaultColors);
    setLogoFile(null);
    setLogoPreview(null);

    try {
      await updateCompanyInfo({
        company_name: companyInfo.company_name,
        pdf_primary_color: defaultColors.primary,
        pdf_accent_color: defaultColors.accent,
        pdf_text_color: defaultColors.text,
        logo_url: null
      });
      alert('✅ Réinitialisation effectuée !');
    } catch (error) {
      console.error('Erreur réinitialisation:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Personnaliser le design PDF" size="lg">
      <div className="space-y-6">
        {/* Aperçu */}
        <div className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl p-6 border-2 border-purple-200">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-600" />
            Aperçu des couleurs
          </h3>
          
          <div 
            className="rounded-xl p-6 mb-4 text-white relative"
            style={{ backgroundColor: colors.primary }}
          >
            {logoPreview && (
              <img 
                src={logoPreview} 
                alt="Logo" 
                className="absolute top-4 right-4 h-12 w-auto object-contain bg-white rounded p-1"
              />
            )}
            <div className="text-2xl font-bold mb-2">FACTURE</div>
            <div className="text-sm opacity-90">F2025-0001</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div 
              className="rounded-lg p-4 text-white text-center font-bold"
              style={{ backgroundColor: colors.accent }}
            >
              Couleur d'accent
            </div>
            <div 
              className="rounded-lg p-4 text-center font-bold border-2"
              style={{ 
                color: colors.text,
                borderColor: colors.primary 
              }}
            >
              Texte principal
            </div>
          </div>
        </div>

        {/* Upload Logo */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Logo de l'entreprise
          </label>
          
          {logoPreview ? (
            <div className="relative inline-block">
              <img 
                src={logoPreview} 
                alt="Logo preview" 
                className="h-24 w-auto object-contain border-2 border-gray-300 rounded-lg p-2 bg-white"
              />
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
                id="logo-upload"
              />
              <label 
                htmlFor="logo-upload" 
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Cliquez pour ajouter un logo
                </span>
                <span className="text-xs text-gray-500">
                  PNG, JPG, SVG (max 2MB)
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Sélecteurs de couleurs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Couleur principale (En-tête)
            </label>
            <div className="flex gap-3">
              <input
                type="color"
                value={colors.primary}
                onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                className="w-20 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={colors.primary}
                onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono"
                placeholder="#9333ea"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Couleur d'accent (Total TTC)
            </label>
            <div className="flex gap-3">
              <input
                type="color"
                value={colors.accent}
                onChange={(e) => setColors({ ...colors, accent: e.target.value })}
                className="w-20 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={colors.accent}
                onChange={(e) => setColors({ ...colors, accent: e.target.value })}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono"
                placeholder="#ec4899"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Couleur du texte
            </label>
            <div className="flex gap-3">
              <input
                type="color"
                value={colors.text}
                onChange={(e) => setColors({ ...colors, text: e.target.value })}
                className="w-20 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={colors.text}
                onChange={(e) => setColors({ ...colors, text: e.target.value })}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono"
                placeholder="#1f2937"
              />
            </div>
          </div>
        </div>

        {/* Thèmes prédéfinis */}
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-3">
            Thèmes prédéfinis
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {presetThemes.map((theme) => (
              <button
                key={theme.name}
                type="button"
                onClick={() => setColors(theme.colors)}
                className="p-3 rounded-lg border-2 border-gray-200 hover:border-purple-500 transition-all text-left group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                  <div 
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: theme.colors.accent }}
                  />
                </div>
                <div className="text-sm font-medium text-gray-700 group-hover:text-purple-600">
                  {theme.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleReset}
            className="flex-1"
            disabled={uploading}
          >
            Réinitialiser
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            disabled={uploading}
          >
            <Save className="w-4 h-4 mr-2" />
            {uploading ? 'Upload...' : 'Enregistrer'}
          </Button>
        </div>

        {/* Info */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            ✅ <strong>Les couleurs et le logo seront appliqués à TOUS les PDFs</strong> (aperçu ET emails envoyés aux clients).
          </p>
        </div>
      </div>
    </Modal>
  );
}
