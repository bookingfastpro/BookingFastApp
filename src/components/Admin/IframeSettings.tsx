import React, { useState } from 'react';
import { ExternalLink, Copy, Eye, Globe, QrCode, Share2, CheckCircle, Code, Smartphone, Monitor, Package, Plus, X, Settings, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import { useServices } from '../../hooks/useServices';
import { Button } from '../UI/Button';
import { Modal } from '../UI/Modal';

export function IframeSettings() {
  const { user } = useAuth();
  const { settings, updateSettings } = useBusinessSettings();
  const { services } = useServices();
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>(settings?.iframe_services || []);
  const [enableTeamSelection, setEnableTeamSelection] = useState(settings?.iframe_enable_team_selection || false);
  const [saving, setSaving] = useState(false);

  // Mettre à jour selectedServices et enableTeamSelection quand settings change
  React.useEffect(() => {
    if (settings?.iframe_services) {
      setSelectedServices(settings.iframe_services);
    }
    if (settings?.iframe_enable_team_selection !== undefined) {
      setEnableTeamSelection(settings.iframe_enable_team_selection);
    }
  }, [settings?.iframe_services, settings?.iframe_enable_team_selection]);

  const getBookingUrl = () => {
    if (!user) return '';
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/booking/${user.id}`;
    
    // Ajouter les services sélectionnés comme paramètres d'URL
    if (selectedServices.length > 0) {
      const params = new URLSearchParams();
      params.set('services', selectedServices.join(','));
      return `${url}?${params.toString()}`;
    }
    
    return url;
  };

  const getIframeCode = (width = '100%', height = '600px') => {
    const bookingUrl = getBookingUrl();
    return `<iframe 
  src="${bookingUrl}" 
  width="${width}" 
  height="${height}" 
  frameborder="0" 
  style="border: none; border-radius: 12px;"
  title="Réservation en ligne - ${settings?.business_name || 'BookingFast'}">
</iframe>`;
  };

  const copyToClipboard = async (text: string, type: 'link' | 'code') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
    } catch (err) {
      console.error('Erreur copie:', err);
      alert('Erreur lors de la copie');
    }
  };

  const handleSaveServices = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      await updateSettings({
        iframe_services: selectedServices
      });
      setShowServiceModal(false);
      alert('Services iframe sauvegardés avec succès !');
    } catch (error) {
      alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTeamSelection = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const newValue = !enableTeamSelection;
      await updateSettings({
        iframe_enable_team_selection: newValue
      });
      setEnableTeamSelection(newValue);
      alert(newValue 
        ? 'Sélection de membre d\'équipe activée !' 
        : 'Sélection de membre d\'équipe désactivée !'
      );
    } catch (error) {
      alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const selectAllServices = () => {
    setSelectedServices(services.map(s => s.id));
  };

  const clearAllServices = () => {
    setSelectedServices([]);
  };

  const availableServices = services.filter(s => s.description !== 'Service personnalisé');
  const selectedCount = selectedServices.length;
  const totalCount = availableServices.length;

  const openInNewTab = () => {
    window.open(getBookingUrl(), '_blank');
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
            <ExternalLink className="w-8 h-8 text-blue-600" />
            Lien de Réservation Iframe
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Intégrez le système de réservation sur votre site web
          </p>
        </div>

        {/* Lien de réservation */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-800">Votre Lien de Réservation</h3>
              <p className="text-blue-600">Partagez ce lien avec vos clients</p>
            </div>
          </div>

          <div className="bg-white border border-blue-300 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={getBookingUrl()}
                readOnly
                className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm"
              />
              <Button
                onClick={() => copyToClipboard(getBookingUrl(), 'link')}
                variant={copiedLink ? 'success' : 'primary'}
                className="flex items-center gap-2"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copié !
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copier
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={openInNewTab}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Ouvrir dans un nouvel onglet
            </Button>
            <Button
              onClick={() => setShowPreviewModal(true)}
              className="flex items-center gap-2"
            >
              <Monitor className="w-4 h-4" />
              Aperçu iframe
            </Button>
          </div>
        </div>

        {/* Configuration sélection membre d'équipe */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-purple-800">Sélection de Membre d'Équipe</h3>
              <p className="text-purple-600">Permettre aux clients de choisir un membre</p>
            </div>
            <button
              onClick={handleToggleTeamSelection}
              disabled={saving}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                enableTeamSelection ? 'bg-green-500' : 'bg-gray-300'
              } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  enableTeamSelection ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="bg-white border border-purple-300 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                enableTeamSelection 
                  ? 'bg-green-100' 
                  : 'bg-gray-100'
              }`}>
                {enableTeamSelection ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <X className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h4 className={`font-bold mb-2 ${
                  enableTeamSelection ? 'text-green-800' : 'text-gray-700'
                }`}>
                  {enableTeamSelection ? '✅ Activé' : '❌ Désactivé'}
                </h4>
                <div className="text-sm space-y-1">
                  {enableTeamSelection ? (
                    <>
                      <div className="text-green-700">• Les clients peuvent choisir leur membre d'équipe préféré</div>
                      <div className="text-green-700">• Un menu déroulant apparaîtra dans l'iframe de réservation</div>
                      <div className="text-green-700">• La réservation sera automatiquement assignée au membre choisi</div>
                    </>
                  ) : (
                    <>
                      <div className="text-gray-600">• Les clients ne peuvent pas choisir de membre spécifique</div>
                      <div className="text-gray-600">• Les réservations seront non assignées par défaut</div>
                      <div className="text-gray-600">• Vous pourrez assigner manuellement après réservation</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
            <h4 className="font-bold text-blue-800 mb-2">💡 Comment ça marche</h4>
            <div className="text-blue-700 text-sm space-y-1">
              <div>• Activez cette option pour afficher un sélecteur de membre dans l'iframe</div>
              <div>• Les clients verront la liste de vos membres d'équipe disponibles</div>
              <div>• Ils pourront choisir avec qui ils souhaitent réserver</div>
              <div>• Parfait pour les salons, cabinets médicaux, centres de bien-être...</div>
            </div>
          </div>
        </div>

        {/* Configuration des services */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-800">Services Visibles sur l'Iframe</h3>
              <p className="text-green-600">Choisissez quels services afficher</p>
            </div>
          </div>

          <div className="bg-white border border-green-300 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-green-700">
                <strong>{selectedCount}</strong> service(s) sélectionné(s) sur <strong>{totalCount}</strong>
              </div>
              <Button
                onClick={() => setShowServiceModal(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Configurer
              </Button>
            </div>
            
            {selectedCount === 0 ? (
              <div className="text-center py-4 text-green-600">
                <Package className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <p className="text-sm">Tous les services seront affichés</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedServices.map(serviceId => {
                  const service = services.find(s => s.id === serviceId);
                  return service ? (
                    <span
                      key={serviceId}
                      className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      <Package className="w-3 h-3" />
                      {service.name}
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-bold text-blue-800 mb-2">💡 Comment ça marche</h4>
            <div className="text-blue-700 text-sm space-y-1">
              <div>• Si aucun service n'est sélectionné, tous vos services seront visibles</div>
              <div>• Vous pouvez créer plusieurs iframes avec des services différents</div>
              <div>• Parfait pour des pages spécialisées (ex: page massage, page soins...)</div>
            </div>
          </div>
        </div>

        {/* Code iframe */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Code className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-purple-800">Code d'Intégration</h3>
              <p className="text-purple-600">Copiez ce code dans votre site web</p>
            </div>
          </div>

          <div className="bg-white border border-purple-300 rounded-xl p-4 mb-4">
            <textarea
              value={getIframeCode()}
              readOnly
              rows={6}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => copyToClipboard(getIframeCode(), 'code')}
              variant={copiedCode ? 'success' : 'primary'}
              className="flex items-center gap-2"
            >
              {copiedCode ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Code copié !
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copier le code
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowCodeModal(true)}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Code className="w-4 h-4" />
              Options avancées
            </Button>
          </div>
        </div>

        {/* Guide d'utilisation */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
          <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
            <Share2 className="w-6 h-6" />
            Comment utiliser
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-green-800 mb-3">📱 Partage direct</h4>
              <div className="space-y-2 text-green-700 text-sm">
                <div>• Copiez le lien de réservation</div>
                <div>• Partagez-le par email, SMS ou réseaux sociaux</div>
                <div>• Vos clients réservent directement</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-green-800 mb-3">🌐 Intégration site web</h4>
              <div className="space-y-2 text-green-700 text-sm">
                <div>• Copiez le code iframe</div>
                <div>• Collez-le dans votre site web</div>
                <div>• Personnalisez la taille si nécessaire</div>
              </div>
            </div>
          </div>
        </div>

        {/* Avantages */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            Avantages de l'Iframe
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Responsive</h4>
              <p className="text-gray-600 text-sm">S'adapte automatiquement à tous les écrans</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Sécurisé</h4>
              <p className="text-gray-600 text-sm">Paiements sécurisés et données protégées</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Intégration facile</h4>
              <p className="text-gray-600 text-sm">Aucune configuration technique requise</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal aperçu */}
      {showPreviewModal && (
        <Modal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title="Aperçu de l'iframe"
          size="xl"
        >
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-xl p-4">
              <iframe
                src={getBookingUrl()}
                width="100%"
                height="600"
                style={{ border: 'none', borderRadius: '12px' }}
                title={`Réservation en ligne - ${settings?.business_name || 'BookingFast'}`}
              />
            </div>
            
            <div className="text-center">
              <Button
                onClick={() => setShowPreviewModal(false)}
                variant="secondary"
              >
                Fermer l'aperçu
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal options avancées */}
      {showCodeModal && (
        <Modal
          isOpen={showCodeModal}
          onClose={() => setShowCodeModal(false)}
          title="Options d'intégration avancées"
          size="lg"
        >
          <div className="space-y-6">
            <div>
              <h4 className="font-bold text-gray-900 mb-3">Tailles prédéfinies</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'Compact', width: '400px', height: '500px' },
                  { name: 'Standard', width: '100%', height: '600px' },
                  { name: 'Large', width: '100%', height: '800px' },
                  { name: 'Mobile', width: '320px', height: '600px' }
                ].map((size, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="font-medium text-gray-900 mb-2">{size.name}</div>
                    <div className="text-sm text-gray-600 mb-3">
                      {size.width} × {size.height}
                    </div>
                    <textarea
                      value={getIframeCode(size.width, size.height)}
                      readOnly
                      rows={4}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg font-mono text-xs resize-none"
                    />
                    <button
                      onClick={() => copyToClipboard(getIframeCode(size.width, size.height), 'code')}
                      className="mt-2 w-full bg-blue-500 text-white py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                    >
                      Copier ce code
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-bold text-blue-800 mb-2">💡 Conseils d'intégration</h4>
              <div className="text-blue-700 text-sm space-y-1">
                <div>• Ajustez la hauteur selon vos besoins (minimum 500px recommandé)</div>
                <div>• L'iframe est responsive et s'adapte automatiquement</div>
                <div>• Testez sur mobile et desktop avant publication</div>
                <div>• Le style peut être personnalisé via l'attribut style</div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowCodeModal(false)}
                className="flex-1"
              >
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal sélection des services */}
      {showServiceModal && (
        <Modal
          isOpen={showServiceModal}
          onClose={() => setShowServiceModal(false)}
          title="Configurer les services de l'iframe"
          size="lg"
        >
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-bold text-blue-800 mb-2">🎯 Configuration des services</h4>
              <div className="text-blue-700 text-sm space-y-1">
                <div>• Sélectionnez les services à afficher sur votre iframe de réservation</div>
                <div>• Si aucun service n'est sélectionné, tous seront visibles</div>
                <div>• Créez des iframes spécialisés pour différentes pages de votre site</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-gray-900">
                Services disponibles ({availableServices.length})
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={selectAllServices}
                  variant="secondary"
                  size="sm"
                >
                  Tout sélectionner
                </Button>
                <Button
                  onClick={clearAllServices}
                  variant="secondary"
                  size="sm"
                >
                  Tout désélectionner
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {availableServices.map((service, index) => (
                <div
                  key={service.id}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] animate-fadeIn ${
                    selectedServices.includes(service.id)
                      ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => toggleService(service.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      selectedServices.includes(service.id)
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Package className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 flex items-center gap-2">
                        {service.name}
                        {selectedServices.includes(service.id) && (
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 line-clamp-1">{service.description}</div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="font-medium text-green-600">{service.price_ttc.toFixed(2)}€</span>
                        <span>{service.duration_minutes}min</span>
                        <span>Max {service.capacity} pers.</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {availableServices.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun service disponible</h4>
                <p className="text-gray-500">Créez d'abord des services pour les configurer sur l'iframe</p>
              </div>
            )}

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-green-600" />
                <h4 className="font-bold text-green-800">Aperçu de la sélection</h4>
              </div>
              <div className="text-green-700 text-sm">
                {selectedCount === 0 ? (
                  <div>🌟 <strong>Tous les services</strong> seront visibles sur l'iframe</div>
                ) : (
                  <div>🎯 <strong>{selectedCount} service(s)</strong> sélectionné(s) seront visibles sur l'iframe</div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="secondary"
                onClick={() => setShowServiceModal(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSaveServices}
                loading={saving}
                className="flex-1"
              >
                <Package className="w-4 h-4" />
                Sauvegarder
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
