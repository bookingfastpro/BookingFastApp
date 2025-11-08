import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Plus, Trash2, Search, Package, Hash, Euro, Percent, UserPlus, PackagePlus } from 'lucide-react';
import { Button } from '../UI/Button';
import { useClients } from '../../hooks/useClients';
import { useProducts } from '../../hooks/useProducts';
import { useInvoices } from '../../hooks/useInvoices';
import { Client, Product, InvoiceItem } from '../../types';
import { CreateClientModal } from './CreateClientModal';
import { CreateProductModal } from './CreateProductModal';
import { DatePicker } from '../BookingModal/DatePicker';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceCreated?: () => void;
}

export function CreateInvoiceModal({ isOpen, onClose, onInvoiceCreated }: CreateInvoiceModalProps) {
  const { clients, fetchClients } = useClients();
  const { products, fetchProducts } = useProducts();
  const { createInvoice } = useInvoices();

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [items, setItems] = useState<Partial<InvoiceItem>[]>([]);
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  
  // États pour les modals
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Bloquer le scroll du body
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      // Créer le conteneur modal-root s'il n'existe pas
      if (!document.getElementById('modal-root')) {
        const modalRoot = document.createElement('div');
        modalRoot.id = 'modal-root';
        document.body.appendChild(modalRoot);
      }

      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  const addItem = (product?: Product) => {
    const newItem: Partial<InvoiceItem> = {
      product_id: product?.id,
      description: product?.name || '',
      quantity: 1,
      unit_price_ht: product?.price_ht || 0,
      tva_rate: product?.tva_rate || 20,
      discount_percent: 0
    };
    setItems([...items, newItem]);
    setSearchTerm('');
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    let subtotal_ht = 0;
    let total_tva = 0;

    items.forEach(item => {
      const itemTotal = (item.quantity || 0) * (item.unit_price_ht || 0);
      const discount = itemTotal * ((item.discount_percent || 0) / 100);
      const totalHT = itemTotal - discount;
      const tva = totalHT * ((item.tva_rate || 20) / 100);
      
      subtotal_ht += totalHT;
      total_tva += tva;
    });

    return {
      subtotal_ht,
      total_tva,
      total_ttc: subtotal_ht + total_tva
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🚀 handleSubmit appelé');

    if (!selectedClient) {
      alert('Veuillez sélectionner un client');
      return;
    }

    if (items.length === 0) {
      alert('Veuillez ajouter au moins un produit');
      return;
    }

    try {
      setLoading(true);
      console.log('⏳ Création du devis...');

      await createInvoice(
        {
          client_id: selectedClient.id,
          invoice_date: invoiceDate,
          due_date: dueDate,
          status: 'draft',
          notes,
          payment_conditions: 'Paiement à réception de facture'
        },
        items
      );

      console.log('✅ Devis créé avec succès !');
      alert('✅ Devis créé avec succès !');
      
      // Réinitialiser le formulaire
      setSelectedClient(null);
      setItems([]);
      setNotes('');
      setSearchTerm('');
      
      console.log('🚪 Fermeture du modal...');
      
      if (onInvoiceCreated) {
        onInvoiceCreated();
      } else {
        onClose();
      }
    } catch (error) {
      console.error('❌ Erreur création devis:', error);
      alert('❌ Erreur lors de la création du devis');
    } finally {
      setLoading(false);
    }
  };

  const handleClientCreated = async (clientId: string) => {
    await fetchClients();
    const newClient = clients.find(c => c.id === clientId);
    if (newClient) {
      setSelectedClient(newClient);
    }
  };

  const handleProductCreated = async () => {
    await fetchProducts();
    setSearchTerm('');
  };

  const totals = calculateTotals();
  
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn z-[9998]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 z-[9999]">
        <div className="bg-white w-full sm:max-w-4xl max-h-full sm:max-h-[90vh] sm:rounded-3xl shadow-2xl transform animate-slideUp flex flex-col">
          {/* Header avec safe area */}
          <div 
            className="flex-shrink-0 relative overflow-hidden sm:rounded-t-3xl"
            style={{
              paddingTop: 'env(safe-area-inset-top, 0px)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
            
            <div className="relative z-10 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-white drop-shadow-lg">
                      Nouveau devis
                    </h2>
                    <p className="text-white/80 text-sm sm:text-base mt-0.5 sm:mt-1">Créer un nouveau devis</p>
                  </div>
                </div>
                
                <button
                  onClick={onClose}
                  className="p-2 sm:p-3 text-white hover:bg-white/20 rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-110"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Contenu scrollable avec safe area */}
          <div 
            className="flex-1 overflow-y-auto"
            style={{
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Sélection client avec bouton créer */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Client *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCreateClientModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all text-xs sm:text-sm font-medium"
                  >
                    <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Nouveau client</span>
                    <span className="sm:hidden">Nouveau</span>
                  </button>
                </div>
                <select
                  value={selectedClient?.id || ''}
                  onChange={(e) => {
                    const client = clients.find(c => c.id === e.target.value);
                    setSelectedClient(client || null);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                  required
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.firstname} {client.lastname} - {client.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates avec DatePicker */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePicker
                  label="Date"
                  value={invoiceDate}
                  onChange={setInvoiceDate}
                  required
                />
                
                <DatePicker
                  label="Date d'échéance"
                  value={dueDate}
                  onChange={setDueDate}
                  required
                />
              </div>

              {/* Produits avec recherche et bouton créer */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-bold text-gray-700">
                    Produits/Services *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCreateProductModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all text-xs sm:text-sm font-medium"
                  >
                    <PackagePlus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Créer un produit</span>
                    <span className="sm:hidden">Créer</span>
                  </button>
                </div>

                {/* Barre de recherche */}
                <div className="mb-4 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Rechercher un produit..."
                      className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm font-medium"
                    />
                  </div>

                  {/* Liste des produits - TOUJOURS AFFICHÉE */}
                  <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                    {filteredProducts.length > 0 ? (
                      <>
                        {filteredProducts.map(product => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => addItem(product)}
                            className="w-full text-left p-3 sm:p-4 bg-white rounded-xl border-2 border-purple-200 hover:border-purple-500 hover:bg-purple-50 transition-all group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors text-sm sm:text-base">
                                  {product.name}
                                </div>
                                {product.description && (
                                  <div className="text-xs sm:text-sm text-gray-600 mt-1">
                                    {product.description}
                                  </div>
                                )}
                              </div>
                              <div className="text-right ml-3 sm:ml-4">
                                <div className="font-bold text-purple-600 text-sm sm:text-base">
                                  {product.price_ht.toFixed(2)}€ HT
                                </div>
                                <div className="text-xs text-gray-500">
                                  TVA {product.tva_rate}%
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                        
                        {/* Bouton produit personnalisé */}
                        <button
                          type="button"
                          onClick={() => addItem()}
                          className="w-full text-left p-3 sm:p-4 bg-white rounded-xl border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-all"
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                            <div className="font-bold text-purple-600 text-sm sm:text-base">
                              Ajouter un produit personnalisé
                            </div>
                          </div>
                        </button>
                      </>
                    ) : (
                      <div className="text-center py-6 sm:py-8">
                        <Package className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-gray-600 font-medium text-sm sm:text-base">
                          {searchTerm ? 'Aucun produit trouvé' : 'Aucun produit disponible'}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          {searchTerm ? 'Essayez un autre terme de recherche' : 'Créez votre premier produit'}
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowCreateProductModal(true)}
                          className="mt-3 sm:mt-4 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
                        >
                          Créer un produit
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Liste des items ajoutés */}
                <div className="space-y-3 sm:space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl border-2 border-purple-200">
                      {/* Description */}
                      <div className="mb-3">
                        <label className="flex items-center text-xs font-bold text-gray-700 mb-1">
                          <Package className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-purple-600" />
                          Description du produit/service
                        </label>
                        <input
                          type="text"
                          value={item.description || ''}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          placeholder="Ex: Entretien Jet ski Complet"
                          className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                          required
                        />
                      </div>

                      {/* Grille des champs numériques */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                        {/* Quantité */}
                        <div>
                          <label className="flex items-center text-xs font-bold text-gray-700 mb-1">
                            <Hash className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-blue-600" />
                            <span className="hidden sm:inline">Quantité</span>
                            <span className="sm:hidden">Qté</span>
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.quantity || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || /^\d*[.,]?\d*$/.test(value)) {
                                updateItem(index, 'quantity', value === '' ? 0 : parseFloat(value.replace(',', '.')));
                              }
                            }}
                            placeholder="1"
                            className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                            required
                          />
                        </div>

                        {/* Prix unitaire HT */}
                        <div>
                          <label className="flex items-center text-xs font-bold text-gray-700 mb-1">
                            <Euro className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-green-600" />
                            <span className="hidden sm:inline">Prix HT</span>
                            <span className="sm:hidden">Prix</span>
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.unit_price_ht || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || /^\d*[.,]?\d*$/.test(value)) {
                                updateItem(index, 'unit_price_ht', value === '' ? 0 : parseFloat(value.replace(',', '.')));
                              }
                            }}
                            placeholder="0.00"
                            className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 font-medium text-sm"
                            required
                          />
                        </div>

                        {/* TVA - Sur mobile, prend toute la largeur */}
                        <div className="col-span-2 sm:col-span-1">
                          <label className="flex items-center text-xs font-bold text-gray-700 mb-1">
                            <Percent className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-orange-600" />
                            TVA (%)
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.tva_rate || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || /^\d*[.,]?\d*$/.test(value)) {
                                updateItem(index, 'tva_rate', value === '' ? 0 : parseFloat(value.replace(',', '.')));
                              }
                            }}
                            placeholder="20"
                            className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 font-medium text-sm"
                            required
                          />
                        </div>

                        {/* Bouton supprimer - Sur desktop seulement */}
                        <div className="hidden sm:flex items-end">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="w-full p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-bold flex items-center justify-center gap-2"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden lg:inline">Supprimer</span>
                          </button>
                        </div>
                      </div>

                      {/* Sur mobile, bouton supprimer et total sur la même ligne */}
                      <div className="mt-3 pt-3 border-t border-purple-200 flex items-center justify-between sm:hidden">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-bold flex items-center gap-1 text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                          Supprimer
                        </button>
                        <div className="text-right">
                          <span className="text-xs text-gray-600">Total HT: </span>
                          <span className="font-bold text-purple-600 text-sm">
                            {((item.quantity || 0) * (item.unit_price_ht || 0)).toFixed(2)}€
                          </span>
                        </div>
                      </div>

                      {/* Sur desktop, affichage du total seul */}
                      <div className="hidden sm:block mt-3 pt-3 border-t border-purple-200">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total ligne HT:</span>
                          <span className="font-bold text-purple-600">
                            {((item.quantity || 0) * (item.unit_price_ht || 0)).toFixed(2)}€
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {items.length === 0 && (
                    <div className="text-center py-6 sm:py-8 text-gray-500">
                      <Package className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm sm:text-base">Aucun produit ajouté</p>
                      <p className="text-xs sm:text-sm">Sélectionnez un produit ci-dessus</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm resize-none"
                  placeholder="Notes additionnelles..."
                />
              </div>

              {/* Totaux */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 sm:p-6 border border-purple-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-700 text-sm sm:text-base">
                    <span>Sous-total HT:</span>
                    <span className="font-bold">{totals.subtotal_ht.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-gray-700 text-sm sm:text-base">
                    <span>TVA:</span>
                    <span className="font-bold">{totals.total_tva.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-lg sm:text-xl font-black text-purple-600 pt-2 border-t-2 border-purple-300">
                    <span>Total TTC:</span>
                    <span>{totals.total_ttc.toFixed(2)}€</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pb-4 sm:pb-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  className="w-full sm:w-auto sm:min-w-[120px]"
                  disabled={loading}
                >
                  Annuler
                </Button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {loading ? 'Création...' : 'Créer le devis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal création client */}
      {showCreateClientModal && (
        <CreateClientModal
          isOpen={showCreateClientModal}
          onClose={() => setShowCreateClientModal(false)}
          onClientCreated={handleClientCreated}
        />
      )}

      {/* Modal création produit */}
      {showCreateProductModal && (
        <CreateProductModal
          isOpen={showCreateProductModal}
          onClose={() => setShowCreateProductModal(false)}
          onProductCreated={handleProductCreated}
        />
      )}
    </>
  );

  // Utiliser le portail React
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return ReactDOM.createPortal(modalContent, modalRoot);
}
