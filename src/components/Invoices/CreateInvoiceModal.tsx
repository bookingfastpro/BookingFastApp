import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Plus, Trash2, Search, UserPlus, PackagePlus, Calendar, FileText, User, Mail, Phone } from 'lucide-react';
import { useClients } from '../../hooks/useClients';
import { useProducts } from '../../hooks/useProducts';
import { useInvoices } from '../../hooks/useInvoices';
import { Client, Product, InvoiceItem } from '../../types';
import { CreateClientModal } from './CreateClientModal';
import { CreateProductModal } from './CreateProductModal';

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
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';

      if (!document.getElementById('modal-root')) {
        const modalRoot = document.createElement('div');
        modalRoot.id = 'modal-root';
        document.body.appendChild(modalRoot);
      }

      return () => {
        document.body.style.overflow = '';
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
    setShowProductDropdown(false);
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

      alert('✅ Devis créé avec succès !');

      setSelectedClient(null);
      setItems([]);
      setNotes('');
      setSearchTerm('');
      setClientSearchTerm('');

      if (onInvoiceCreated) {
        onInvoiceCreated();
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Erreur création devis:', error);
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

  const filteredClients = clients.filter(c =>
    `${c.firstname} ${c.lastname}`.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  const modalContent = (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn z-[9998]"
        onClick={onClose}
      />

      <div className="fixed inset-0 flex items-end lg:items-center justify-center z-[9999] p-0 lg:p-4">
        <div className="bg-white w-full lg:max-w-5xl max-h-[95vh] lg:max-h-[90vh] lg:rounded-2xl shadow-2xl flex flex-col animate-slideUp">
          {/* Header */}
          <div className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 px-4 lg:px-6 py-4 lg:rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold text-white">Nouveau devis</h2>
                  <p className="text-sm text-white/80 mt-0.5">Créez un devis pour votre client</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
            {/* Section Client */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Client</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateClientModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden lg:inline">Nouveau</span>
                </button>
              </div>

              {selectedClient ? (
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-2">
                        {selectedClient.firstname} {selectedClient.lastname}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          {selectedClient.email}
                        </div>
                        {selectedClient.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            {selectedClient.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedClient(null)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={clientSearchTerm}
                    onChange={(e) => {
                      setClientSearchTerm(e.target.value);
                      setShowClientDropdown(true);
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    placeholder="Rechercher un client..."
                    className="w-full pl-10 pr-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  {showClientDropdown && filteredClients.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {filteredClients.map(client => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => {
                            setSelectedClient(client);
                            setClientSearchTerm('');
                            setShowClientDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                        >
                          <div className="font-medium text-gray-900">
                            {client.firstname} {client.lastname}
                          </div>
                          <div className="text-sm text-gray-600">{client.email}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section Dates */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" />
                  Date du devis
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  required
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" />
                  Date d'échéance
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Section Produits */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Produits / Services</h3>
                <button
                  type="button"
                  onClick={() => setShowCreateProductModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <PackagePlus className="w-4 h-4" />
                  <span className="hidden lg:inline">Nouveau</span>
                </button>
              </div>

              {/* Recherche de produit */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowProductDropdown(true);
                  }}
                  onFocus={() => setShowProductDropdown(true)}
                  placeholder="Rechercher un produit ou service..."
                  className="w-full pl-10 pr-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
                {showProductDropdown && searchTerm && filteredProducts.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {filteredProducts.map(product => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addItem(product)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                      >
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-600">
                          {product.price_ht.toFixed(2)}€ HT
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Liste des items */}
              {items.length > 0 ? (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-purple-200">
                      <div className="flex items-start justify-between mb-3">
                        <input
                          type="text"
                          value={item.description || ''}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          placeholder="Description"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Quantité</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity || 1}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Prix HT</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price_ht || 0}
                            onChange={(e) => updateItem(index, 'unit_price_ht', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">TVA %</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.tva_rate || 20}
                            onChange={(e) => updateItem(index, 'tva_rate', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Remise %</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount_percent || 0}
                            onChange={(e) => updateItem(index, 'discount_percent', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total ligne HT</span>
                          <span className="font-bold text-gray-900">
                            {(
                              ((item.quantity || 0) * (item.unit_price_ht || 0)) *
                              (1 - ((item.discount_percent || 0) / 100))
                            ).toFixed(2)}€
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucun produit ajouté</p>
                  <p className="text-sm mt-1">Recherchez un produit ou créez-en un nouveau</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => addItem()}
                className="w-full mt-3 px-4 py-3 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Ajouter une ligne
              </button>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Notes (optionnel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ajoutez des notes ou conditions particulières..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
              />
            </div>

            {/* Totaux */}
            {items.length > 0 && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total HT</span>
                    <span className="font-semibold text-gray-900">
                      {totals.subtotal_ht.toFixed(2)}€
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total TVA</span>
                    <span className="font-semibold text-gray-900">
                      {totals.total_tva.toFixed(2)}€
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-300">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">Total TTC</span>
                      <span className="text-2xl font-bold text-purple-600">
                        {totals.total_ttc.toFixed(2)}€
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4 lg:p-6 bg-gray-50 lg:rounded-b-2xl">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !selectedClient || items.length === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-colors font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Création...' : 'Créer le devis'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals imbriqués */}
      {showCreateClientModal && (
        <CreateClientModal
          isOpen={showCreateClientModal}
          onClose={() => setShowCreateClientModal(false)}
          onClientCreated={handleClientCreated}
        />
      )}

      {showCreateProductModal && (
        <CreateProductModal
          isOpen={showCreateProductModal}
          onClose={() => setShowCreateProductModal(false)}
          onProductCreated={handleProductCreated}
        />
      )}
    </>
  );

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return ReactDOM.createPortal(modalContent, modalRoot);
}
