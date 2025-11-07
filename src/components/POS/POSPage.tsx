import React, { useState } from 'react';
import { ShoppingCart, Package, Plus, Minus, Trash2, CreditCard, User, Mail, Phone, FileText, Settings, BarChart3, Edit, Search, Calendar, X, Banknote, Smartphone, FileCheck, ArrowLeftRight, ChevronLeft, Menu, Clock, Sparkles } from 'lucide-react';
import { usePOS } from '../../hooks/usePOS';
import { useClients } from '../../hooks/useClients';
import { useBookings } from '../../hooks/useBookings';
import { POSProduct, POSCategory } from '../../types/pos';
import { Booking } from '../../types';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { Modal } from '../UI/Modal';
import { ProductModal } from './ProductModal';
import { CategoryModal } from './CategoryModal';
import { TransactionHistory } from './TransactionHistory';
import { POSSettings } from './POSSettings';
import { ReservationPayment } from './ReservationPayment';

type View = 'services' | 'reservations';

interface PaymentTransaction {
  method: 'cash' | 'card' | 'check' | 'transfer';
  amount: number;
}

export function POSPage() {
  const {
    categories,
    products,
    cart,
    transactions,
    settings,
    loading,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    calculateCartTotal,
    createTransaction,
    createProduct,
    updateProduct,
    deleteProduct,
    createCategory,
    updateCategory,
    deleteCategory,
    updateSettings
  } = usePOS();

  const { clients } = useClients();
  const { bookings, updateBooking } = useBookings();

  const [currentView, setCurrentView] = useState<View>('services');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingProduct, setEditingProduct] = useState<POSProduct | null>(null);
  const [editingCategory, setEditingCategory] = useState<POSCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [processing, setProcessing] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const { subtotal, taxAmount, total, taxRate } = calculateCartTotal();

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory ? p.category_id === selectedCategory : true;
    const matchesSearch = searchQuery ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    return matchesCategory && matchesSearch;
  });

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const totalPaid = paymentTransactions.reduce((sum, t) => sum + t.amount, 0);
  const remainingAmount = selectedBooking 
    ? (selectedBooking.total_amount - (selectedBooking.payment_amount || 0)) - totalPaid
    : total - totalPaid;

  const handlePaymentMethodClick = async (method: 'cash' | 'card' | 'check' | 'transfer') => {
    const amount = parseFloat(paymentAmount);
    
    if (!amount || amount <= 0) {
      alert('Veuillez saisir un montant valide');
      return;
    }

    const currentRemaining = selectedBooking 
      ? (selectedBooking.total_amount - (selectedBooking.payment_amount || 0)) - totalPaid
      : total - totalPaid;

    const netAmount = amount > currentRemaining ? currentRemaining : amount;
    const change = amount > currentRemaining ? amount - currentRemaining : 0;

    const newTransaction: PaymentTransaction = { method, amount: netAmount };
    const updatedTransactions = [...paymentTransactions, newTransaction];
    setPaymentTransactions(updatedTransactions);

    const newTotalPaid = updatedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const newRemaining = selectedBooking 
      ? (selectedBooking.total_amount - (selectedBooking.payment_amount || 0)) - newTotalPaid
      : total - newTotalPaid;

    if (newRemaining <= 0 || change > 0) {
      await confirmPayment(updatedTransactions, change);
    } else {
      setPaymentAmount('');
    }
  };

  const confirmPayment = async (transactions: PaymentTransaction[], change: number = 0) => {
    setProcessing(true);
    try {
      if (selectedBooking) {
        const newTransactions = [...(selectedBooking.transactions || [])];
        
        transactions.forEach(t => {
          newTransactions.push({
            method: t.method,
            amount: t.amount,
            status: 'completed' as const,
            note: 'Paiement POS',
            created_at: new Date().toISOString()
          });
        });

        const totalBookingPaid = newTransactions
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0);

        let paymentStatus: 'pending' | 'partial' | 'completed' = 'pending';
        if (totalBookingPaid >= selectedBooking.total_amount) {
          paymentStatus = 'completed';
        } else if (totalBookingPaid > 0) {
          paymentStatus = 'partial';
        }

        await updateBooking(selectedBooking.id, {
          transactions: newTransactions,
          payment_status: paymentStatus,
          payment_amount: totalBookingPaid
        });

        let message = 'Paiement de réservation enregistré avec succès !';
        if (change > 0) {
          message += `\n\nMonnaie à rendre : ${change.toFixed(2)} €`;
        }

        setShowCheckout(false);
        setSelectedBooking(null);
        setPaymentTransactions([]);
        setPaymentAmount('');
        setSelectedClientId('');
        setCustomerInfo({ name: '', email: '', phone: '', notes: '' });
        alert(message);
      } else {
        const clientData = selectedClient ? {
          name: `${selectedClient.firstname} ${selectedClient.lastname}`,
          email: selectedClient.email,
          phone: selectedClient.phone,
          notes: customerInfo.notes
        } : customerInfo;

        await createTransaction(clientData);
        
        let message = 'Transaction enregistrée avec succès !';
        if (change > 0) {
          message += `\n\nMonnaie à rendre : ${change.toFixed(2)} €`;
        }

        setShowCheckout(false);
        setSelectedClientId('');
        setCustomerInfo({ name: '', email: '', phone: '', notes: '' });
        setPaymentTransactions([]);
        setPaymentAmount('');
        alert(message);
      }
    } catch (err) {
      console.error('Erreur paiement:', err);
      alert('Erreur lors du paiement');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveTransaction = (index: number) => {
    setPaymentTransactions(paymentTransactions.filter((_, i) => i !== index));
  };

  const handleAddToCart = (e: React.MouseEvent, product: POSProduct) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  const handleRemoveFromCart = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeFromCart(productId);
  };

  const handleUpdateQuantity = (e: React.MouseEvent, productId: string, quantity: number) => {
    e.preventDefault();
    e.stopPropagation();
    updateCartQuantity(productId, quantity);
  };

  const handleClearCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cart.length === 0 && !selectedBooking) return;
    if (confirm('Voulez-vous vraiment vider le panier ?')) {
      clearCart();
      setSelectedBooking(null);
      setPaymentTransactions([]);
      setPaymentAmount('');
    }
  };

  const handleOpenCheckout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cart.length === 0 && !selectedBooking) {
      alert('Le panier est vide');
      return;
    }
    
    if (selectedBooking) {
      const remaining = selectedBooking.total_amount - (selectedBooking.payment_amount || 0);
      setPaymentAmount(remaining.toFixed(2));
    } else {
      setPaymentAmount(total.toFixed(2));
    }
    
    setShowCheckout(true);
  };

  const handleCloseCheckout = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowCheckout(false);
    setSelectedClientId('');
    setPaymentTransactions([]);
    setPaymentAmount('');
  };

  const handleCategoryChange = (e: React.MouseEvent, categoryId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCategory(categoryId);
  };

  const handleViewChange = (e: React.MouseEvent, view: View) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentView(view);
    setShowMobileMenu(false);
  };

  const handleAddProduct = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (e: React.MouseEvent, product: POSProduct) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product._isBookingService) {
      alert('Les services de réservation ne peuvent pas être modifiés depuis le POS. Utilisez la page Services.');
      return;
    }
    
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleAddCategory = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  const handleShowHistory = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowHistory(true);
    setShowMobileMenu(false);
  };

  const handleShowSettings = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowSettings(true);
    setShowMobileMenu(false);
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setCustomerInfo({
        name: `${client.firstname} ${client.lastname}`,
        email: client.email,
        phone: client.phone,
        notes: ''
      });
    }
  };

  const handleSelectBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    clearCart();
    const remainingAmount = booking.total_amount - (booking.payment_amount || 0);
    setPaymentAmount(remainingAmount.toFixed(2));
    
    const client = clients.find(c => c.email === booking.client_email);
    if (client) {
      setSelectedClientId(client.id);
      setCustomerInfo({
        name: `${client.firstname} ${client.lastname}`,
        email: client.email,
        phone: client.phone,
        notes: ''
      });
    }
  };

  const handleRemoveBooking = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedBooking(null);
    setPaymentTransactions([]);
    setPaymentAmount('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getColorClasses = (color: string) => {
    const colors: Record<string, { gradient: string; shadow: string; hover: string }> = {
      blue: { 
        gradient: 'from-blue-500 via-blue-600 to-cyan-600',
        shadow: 'shadow-blue-500/30',
        hover: 'hover:shadow-blue-500/50'
      },
      green: { 
        gradient: 'from-green-500 via-green-600 to-emerald-600',
        shadow: 'shadow-green-500/30',
        hover: 'hover:shadow-green-500/50'
      },
      red: { 
        gradient: 'from-red-500 via-red-600 to-pink-600',
        shadow: 'shadow-red-500/30',
        hover: 'hover:shadow-red-500/50'
      },
      purple: { 
        gradient: 'from-purple-500 via-purple-600 to-pink-600',
        shadow: 'shadow-purple-500/30',
        hover: 'hover:shadow-purple-500/50'
      },
      orange: { 
        gradient: 'from-orange-500 via-orange-600 to-red-600',
        shadow: 'shadow-orange-500/30',
        hover: 'hover:shadow-orange-500/50'
      }
    };
    return colors[color] || colors.blue;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Espèces',
      card: 'Carte bancaire',
      check: 'Chèque',
      transfer: 'Virement'
    };
    return labels[method] || method;
  };

  const hasItems = cart.length > 0 || selectedBooking !== null;
  const cartItemCount = selectedBooking ? 1 : cart.reduce((sum, item) => sum + item.quantity, 0);
  const hasTTCProducts = cart.some(item => item.product._isTTCPrice);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header - Responsive */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-lg sm:text-2xl font-bold text-gray-900">
              {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 hidden sm:block">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex gap-2">
            <button
              type="button"
              onClick={(e) => handleViewChange(e, 'services')}
              className={`px-4 xl:px-6 py-2 rounded-xl font-bold transition-all shadow-lg text-sm xl:text-base ${
                currentView === 'services'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Package className="w-4 xl:w-5 h-4 xl:h-5 inline mr-2" />
              Services
            </button>
            <button
              type="button"
              onClick={(e) => handleViewChange(e, 'reservations')}
              className={`px-4 xl:px-6 py-2 rounded-xl font-bold transition-all shadow-lg text-sm xl:text-base ${
                currentView === 'reservations'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Calendar className="w-4 xl:w-5 h-4 xl:h-5 inline mr-2" />
              Réservations
            </button>
            <button
              type="button"
              onClick={handleShowHistory}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 xl:px-6 py-2 rounded-xl font-bold hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg text-sm xl:text-base"
            >
              <BarChart3 className="w-4 xl:w-5 h-4 xl:h-5 inline mr-2" />
              Historique
            </button>
            <button
              type="button"
              onClick={handleShowSettings}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 xl:px-6 py-2 rounded-xl font-bold hover:from-orange-600 hover:to-red-600 transition-all shadow-lg text-sm xl:text-base"
            >
              <Settings className="w-4 xl:w-5 h-4 xl:h-5 inline mr-2" />
              Paramètres
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden bg-gradient-to-r from-purple-500 to-pink-500 text-white p-2 rounded-xl"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {showMobileMenu && (
          <div className="lg:hidden mt-3 space-y-2">
            <button
              type="button"
              onClick={(e) => handleViewChange(e, 'services')}
              className={`w-full px-4 py-3 rounded-xl font-bold transition-all shadow-lg text-sm ${
                currentView === 'services'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-white text-gray-700'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Services
            </button>
            <button
              type="button"
              onClick={(e) => handleViewChange(e, 'reservations')}
              className={`w-full px-4 py-3 rounded-xl font-bold transition-all shadow-lg text-sm ${
                currentView === 'reservations'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-white text-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Réservations
            </button>
            <button
              type="button"
              onClick={handleShowHistory}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-3 rounded-xl font-bold text-sm"
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Historique
            </button>
            <button
              type="button"
              onClick={handleShowSettings}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 rounded-xl font-bold text-sm"
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Paramètres
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Main Content - Responsive */}
        <div className="flex-1 p-2 sm:p-4 overflow-y-auto">
          {currentView === 'services' ? (
            <>
              <div className="mb-3 sm:mb-4">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h2 className="text-base sm:text-xl font-bold text-gray-900">
                    Tous les services
                    <span className="ml-2 text-[10px] sm:text-xs font-normal text-gray-600">
                      {filteredProducts.length} services
                    </span>
                  </h2>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 sm:px-3 py-1.5 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg text-[10px] sm:text-xs"
                    >
                      <Plus className="w-3 h-3 inline mr-1" />
                      <span className="hidden sm:inline">Catégorie</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddProduct}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 sm:px-3 py-1.5 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg text-[10px] sm:text-xs"
                    >
                      <Plus className="w-3 h-3 inline mr-1" />
                      <span className="hidden sm:inline">Service</span>
                    </button>
                  </div>
                </div>

                <div className="mb-2 sm:mb-3">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher..."
                      className="w-full pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-1.5 mb-3 sm:mb-4 overflow-x-auto pb-2">
                  <button
                    type="button"
                    onClick={(e) => handleCategoryChange(e, null)}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all text-[10px] sm:text-xs ${
                      selectedCategory === null
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    Tous
                  </button>
                  {categories.map(category => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={(e) => handleCategoryChange(e, category.id)}
                      className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all text-[10px] sm:text-xs ${
                        selectedCategory === category.id
                          ? `bg-gradient-to-r ${getColorClasses(category.color).gradient} text-white shadow-lg`
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grille de services - NOUVEAU DESIGN */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3">
                {filteredProducts.map(product => {
                  const colorClasses = getColorClasses(product.color);
                  return (
                    <div
                      key={product.id}
                      className="group relative"
                    >
                      {/* Card Container */}
                      <div className={`relative bg-white rounded-2xl overflow-hidden shadow-lg ${colorClasses.shadow} ${colorClasses.hover} transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1`}>
                        {/* Gradient Header */}
                        <div className={`bg-gradient-to-br ${colorClasses.gradient} p-3 sm:p-4 relative overflow-hidden`}>
                          {/* Decorative Pattern */}
                          <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full -mr-10 -mt-10"></div>
                            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white rounded-full -ml-8 -mb-8"></div>
                          </div>

                          {/* Edit Button */}
                          {!product._isBookingService && (
                            <button
                              type="button"
                              onClick={(e) => handleEditProduct(e, product)}
                              className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                            >
                              <Edit className="w-3 h-3 text-white" />
                            </button>
                          )}

                          {/* Booking Badge */}
                          {product._isBookingService && (
                            <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg z-10">
                              <Calendar className="w-3 h-3 text-white" />
                            </div>
                          )}

                          {/* Service Name */}
                          <h3 className="text-white font-bold text-sm sm:text-base leading-tight line-clamp-2 mb-2 relative z-10">
                            {product.name}
                          </h3>

                          {/* Duration Badge */}
                          {product.duration_minutes && (
                            <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg relative z-10">
                              <Clock className="w-3 h-3 text-white" />
                              <span className="text-xs font-semibold text-white">
                                {product.duration_minutes}min
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-3 sm:p-4">
                          {/* Price Section */}
                          <div className="mb-3">
                            <div className="flex items-baseline gap-1 mb-1">
                              <span className="text-2xl sm:text-3xl font-black text-gray-900">
                                {product.price.toFixed(0)}
                              </span>
                              <span className="text-lg sm:text-xl font-bold text-gray-900">
                                .{(product.price % 1).toFixed(2).split('.')[1]}
                              </span>
                              <span className="text-sm font-bold text-gray-600 ml-1">€</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {product._isTTCPrice && (
                                <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                  TTC
                                </span>
                              )}
                              {product.track_stock && (
                                <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                  Stock: {product.stock}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Add to Cart Button */}
                          <button
                            type="button"
                            onClick={(e) => handleAddToCart(e, product)}
                            className={`w-full bg-gradient-to-r ${colorClasses.gradient} text-white py-2.5 sm:py-3 rounded-xl font-bold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group-hover:scale-105`}
                          >
                            <Plus className="w-4 h-4" />
                            <span className="text-sm">Ajouter</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <ReservationPayment
              bookings={bookings}
              clients={clients}
              onSelectBooking={handleSelectBooking}
            />
          )}
        </div>

        {/* Desktop Cart Sidebar */}
        <div className="hidden lg:flex w-80 xl:w-96 bg-white border-l border-gray-200 flex-col h-full">
          <div className="p-4 xl:p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg xl:text-xl font-bold text-gray-900">Panier</h3>
              <div className={`w-8 xl:w-10 h-8 xl:h-10 rounded-xl flex items-center justify-center font-bold text-sm xl:text-base ${
                selectedBooking 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
              }`}>
                {cartItemCount}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 xl:p-6 min-h-0">
            {!hasItems ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ShoppingCart className="w-12 xl:w-16 h-12 xl:h-16 mb-4" />
                <p className="text-center text-sm xl:text-base">Panier vide<br />Ajoutez des services ou sélectionnez une réservation</p>
              </div>
            ) : selectedBooking ? (
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 xl:p-4 border-2 border-purple-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 xl:w-5 h-4 xl:h-5 text-purple-600" />
                        <h4 className="font-bold text-gray-900 text-sm xl:text-base">Réservation</h4>
                      </div>
                      <div className="text-xs xl:text-sm text-gray-600 mb-2">
                        {new Date(selectedBooking.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        })} à {selectedBooking.time}
                      </div>
                      {selectedBooking.service && (
                        <div className="text-xs xl:text-sm font-medium text-gray-900 mb-2">
                          {selectedBooking.service.name}
                        </div>
                      )}
                      <div className="text-xs xl:text-sm text-gray-600">
                        Client: {selectedBooking.client_name}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveBooking}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <X className="w-4 xl:w-5 h-4 xl:h-5" />
                    </button>
                  </div>

                  <div className="border-t border-purple-200 pt-3 space-y-2">
                    <div className="flex justify-between text-xs xl:text-sm">
                      <span className="text-gray-600">Montant total</span>
                      <span className="font-medium">{selectedBooking.total_amount.toFixed(2)} €</span>
                    </div>
                    {selectedBooking.payment_amount > 0 && (
                      <div className="flex justify-between text-xs xl:text-sm">
                        <span className="text-gray-600">Déjà payé</span>
                        <span className="font-medium text-green-600">
                          -{selectedBooking.payment_amount.toFixed(2)} €
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-base xl:text-lg font-bold pt-2 border-t border-purple-200">
                      <span className="text-gray-900">Reste à payer</span>
                      <span className="text-purple-600">
                        {(selectedBooking.total_amount - (selectedBooking.payment_amount || 0)).toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.product.id} className="bg-gray-50 rounded-xl p-3 xl:p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-sm xl:text-base">{item.product.name}</h4>
                        <div className="text-xs xl:text-sm text-gray-600">
                          {item.product.price.toFixed(2)} € {item.product._isTTCPrice && '(TTC)'}
                        </div>
                        {item.product._isBookingService && (
                          <div className="text-xs text-purple-600 mt-1">📅 Service de réservation</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveFromCart(e, item.product.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 xl:w-5 h-4 xl:h-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleUpdateQuantity(e, item.product.id, item.quantity - 1)}
                          className="w-7 xl:w-8 h-7 xl:h-8 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                          <Minus className="w-3 xl:w-4 h-3 xl:h-4" />
                        </button>
                        <span className="w-6 xl:w-8 text-center font-bold text-sm xl:text-base">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={(e) => handleUpdateQuantity(e, item.product.id, item.quantity + 1)}
                          className="w-7 xl:w-8 h-7 xl:h-8 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                          <Plus className="w-3 xl:w-4 h-3 xl:h-4" />
                        </button>
                      </div>
                      <div className="font-bold text-base xl:text-lg">
                        {(item.product.price * item.quantity).toFixed(2)} €
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 xl:p-6 border-t border-gray-200 space-y-4 flex-shrink-0">
            {!selectedBooking && (
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600 text-sm xl:text-base">
                  <span>Sous-total HT</span>
                  <span className="font-medium">{subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-gray-600 text-sm xl:text-base">
                  <span>TVA {hasTTCProducts ? '(incluse)' : `(${taxRate}%)`}</span>
                  <span className="font-medium">{taxAmount.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-lg xl:text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total TTC</span>
                  <span className="text-green-600">{total.toFixed(2)} €</span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClearCart}
                disabled={!hasItems}
                className="flex-1 bg-gray-200 text-gray-700 py-2.5 xl:py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm xl:text-base"
              >
                Vider
              </button>
              <button
                type="button"
                onClick={handleOpenCheckout}
                disabled={!hasItems}
                className={`flex-1 py-2.5 xl:py-3 rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm xl:text-base ${
                  selectedBooking
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                }`}
              >
                <CreditCard className="w-4 xl:w-5 h-4 xl:h-5 inline mr-2" />
                Paiement
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Cart Button */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-lg">
        <button
          type="button"
          onClick={() => setShowCart(true)}
          className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
            selectedBooking
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
              : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span>Panier ({cartItemCount})</span>
          {hasItems && (
            <span className="ml-auto font-bold">
              {selectedBooking 
                ? (selectedBooking.total_amount - (selectedBooking.payment_amount || 0)).toFixed(2)
                : total.toFixed(2)
              } €
            </span>
          )}
        </button>
      </div>

      {/* Mobile Cart Modal */}
      {showCart && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full max-h-[85vh] rounded-t-3xl flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Panier</h3>
              <button
                type="button"
                onClick={() => setShowCart(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {!hasItems ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <ShoppingCart className="w-16 h-16 mb-4" />
                  <p className="text-center">Panier vide<br />Ajoutez des services ou sélectionnez une réservation</p>
                </div>
              ) : selectedBooking ? (
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-5 h-5 text-purple-600" />
                          <h4 className="font-bold text-gray-900">Réservation</h4>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {new Date(selectedBooking.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })} à {selectedBooking.time}
                        </div>
                        {selectedBooking.service && (
                          <div className="text-sm font-medium text-gray-900 mb-2">
                            {selectedBooking.service.name}
                          </div>
                        )}
                        <div className="text-sm text-gray-600">
                          Client: {selectedBooking.client_name}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveBooking}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="border-t border-purple-200 pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Montant total</span>
                        <span className="font-medium">{selectedBooking.total_amount.toFixed(2)} €</span>
                      </div>
                      {selectedBooking.payment_amount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Déjà payé</span>
                          <span className="font-medium text-green-600">
                            -{selectedBooking.payment_amount.toFixed(2)} €
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold pt-2 border-t border-purple-200">
                        <span className="text-gray-900">Reste à payer</span>
                        <span className="text-purple-600">
                          {(selectedBooking.total_amount - (selectedBooking.payment_amount || 0)).toFixed(2)} €
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.product.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">{item.product.name}</h4>
                          <div className="text-sm text-gray-600">
                            {item.product.price.toFixed(2)} € {item.product._isTTCPrice && '(TTC)'}
                          </div>
                          {item.product._isBookingService && (
                            <div className="text-xs text-purple-600 mt-1">📅 Service de réservation</div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveFromCart(e, item.product.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleUpdateQuantity(e, item.product.id, item.quantity - 1)}
                            className="w-9 h-9 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-bold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={(e) => handleUpdateQuantity(e, item.product.id, item.quantity + 1)}
                            className="w-9 h-9 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="font-bold text-lg">
                          {(item.product.price * item.quantity).toFixed(2)} €
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 space-y-4">
              {!selectedBooking && (
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Sous-total HT</span>
                    <span className="font-medium">{subtotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>TVA {hasTTCProducts ? '(incluse)' : `(${taxRate}%)`}</span>
                    <span className="font-medium">{taxAmount.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total TTC</span>
                    <span className="text-green-600">{total.toFixed(2)} €</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClearCart}
                  disabled={!hasItems}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Vider
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    setShowCart(false);
                    handleOpenCheckout(e);
                  }}
                  disabled={!hasItems}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedBooking
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                  }`}
                >
                  <CreditCard className="w-5 h-5 inline mr-2" />
                  Paiement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCheckout && (
        <Modal
          isOpen={showCheckout}
          onClose={handleCloseCheckout}
          title={selectedBooking ? "Paiement de réservation" : "Finaliser la transaction"}
          size="md"
        >
          <div className="space-y-4 sm:space-y-6">
            <div className={`rounded-2xl p-4 sm:p-6 border-2 ${
              selectedBooking 
                ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200'
                : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
            }`}>
              <div className="text-center mb-4">
                <div className={`text-3xl sm:text-4xl font-bold ${
                  selectedBooking ? 'text-purple-600' : 'text-green-600'
                }`}>
                  {selectedBooking 
                    ? (selectedBooking.total_amount - (selectedBooking.payment_amount || 0)).toFixed(2)
                    : total.toFixed(2)
                  } €
                </div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">
                  {selectedBooking ? 'Reste à payer' : 'Montant à payer'}
                </div>
              </div>
              {!selectedBooking && (
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sous-total HT</span>
                    <span className="font-medium">{subtotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">TVA {hasTTCProducts ? '(incluse)' : `(${taxRate}%)`}</span>
                    <span className="font-medium">{taxAmount.toFixed(2)} €</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                  Montant à encaisser
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 sm:py-4 text-xl sm:text-2xl font-bold text-center rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                  Méthode de paiement
                </label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => handlePaymentMethodClick('cash')}
                    disabled={processing}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-3 sm:p-4 rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                  >
                    <Banknote className="w-5 sm:w-6 h-5 sm:h-6 mx-auto mb-1 sm:mb-2" />
                    Espèces
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePaymentMethodClick('card')}
                    disabled={processing}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-3 sm:p-4 rounded-xl font-bold hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                  >
                    <CreditCard className="w-5 sm:w-6 h-5 sm:h-6 mx-auto mb-1 sm:mb-2" />
                    Carte bancaire
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePaymentMethodClick('check')}
                    disabled={processing}
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 sm:p-4 rounded-xl font-bold hover:from-orange-600 hover:to-red-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                  >
                    <FileCheck className="w-5 sm:w-6 h-5 sm:h-6 mx-auto mb-1 sm:mb-2" />
                    Chèque
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePaymentMethodClick('transfer')}
                    disabled={processing}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 sm:p-4 rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                  >
                    <ArrowLeftRight className="w-5 sm:w-6 h-5 sm:h-6 mx-auto mb-1 sm:mb-2" />
                    Virement
                  </button>
                </div>
              </div>

              {paymentTransactions.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base">Transactions</h4>
                  </div>
                  {paymentTransactions.map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between bg-white rounded-lg p-2 sm:p-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="text-xs sm:text-sm font-medium text-gray-900">
                          {getPaymentMethodLabel(transaction.method)}
                        </div>
                        <div className="text-base sm:text-lg font-bold text-gray-900">
                          {transaction.amount.toFixed(2)} €
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTransaction(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-3 space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Total encaissé</span>
                      <span className="font-medium">{totalPaid.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-base sm:text-lg font-bold">
                      <span className="text-gray-900">Reste</span>
                      <span className={remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}>
                        {remainingAmount.toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!selectedBooking && (
              <>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    <User className="w-3 sm:w-4 h-3 sm:h-4 inline mr-2" />
                    Sélectionner un client (optionnel)
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                  >
                    <option value="">Paiement rapide (sans client)</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.firstname} {client.lastname} - {client.email}
                      </option>
                    ))}
                  </select>
                </div>

                {!selectedClientId && (
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        <User className="w-3 sm:w-4 h-3 sm:h-4 inline mr-2" />
                        Nom du client (optionnel)
                      </label>
                      <input
                        type="text"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                        placeholder="Jean Dupont"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-3 sm:w-4 h-3 sm:h-4 inline mr-2" />
                        Email (optionnel)
                      </label>
                      <input
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                        placeholder="jean@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-3 sm:w-4 h-3 sm:h-4 inline mr-2" />
                        Téléphone (optionnel)
                      </label>
                      <input
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                        placeholder="06 12 34 56 78"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-3 sm:w-4 h-3 sm:h-4 inline mr-2" />
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={customerInfo.notes}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                    rows={3}
                    placeholder="Notes supplémentaires..."
                  />
                </div>
              </>
            )}

            {processing && (
              <div className="flex items-center justify-center gap-2 text-gray-600 text-sm sm:text-base">
                <LoadingSpinner size="sm" />
                <span>Traitement en cours...</span>
              </div>
            )}

            <div className="flex gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleCloseCheckout}
                disabled={processing}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 sm:py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm sm:text-base"
              >
                Annuler
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showProductModal && (
        <ProductModal
          isOpen={showProductModal}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
          product={editingProduct}
          categories={categories}
          onSave={async (productData) => {
            try {
              if (editingProduct) {
                await updateProduct(editingProduct.id, productData);
              } else {
                await createProduct(productData);
              }
              setShowProductModal(false);
              setEditingProduct(null);
            } catch (err) {
              console.error('Erreur sauvegarde produit:', err);
              alert('Erreur lors de la sauvegarde');
            }
          }}
          onDelete={editingProduct ? async () => {
            if (confirm('Voulez-vous vraiment supprimer ce service ?')) {
              try {
                await deleteProduct(editingProduct.id);
                setShowProductModal(false);
                setEditingProduct(null);
              } catch (err) {
                console.error('Erreur suppression produit:', err);
                alert('Erreur lors de la suppression');
              }
            }
          } : undefined}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          isOpen={showCategoryModal}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
          category={editingCategory}
          onSave={async (categoryData) => {
            try {
              if (editingCategory) {
                await updateCategory(editingCategory.id, categoryData);
              } else {
                await createCategory(categoryData);
              }
              setShowCategoryModal(false);
              setEditingCategory(null);
            } catch (err) {
              console.error('Erreur sauvegarde catégorie:', err);
              alert('Erreur lors de la sauvegarde');
            }
          }}
          onDelete={editingCategory ? async () => {
            if (confirm('Voulez-vous vraiment supprimer cette catégorie ?')) {
              try {
                await deleteCategory(editingCategory.id);
                setShowCategoryModal(false);
                setEditingCategory(null);
              } catch (err) {
                console.error('Erreur suppression catégorie:', err);
                alert('Erreur lors de la suppression');
              }
            }
          } : undefined}
        />
      )}

      {showHistory && (
        <TransactionHistory
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          transactions={transactions}
        />
      )}

      {showSettings && settings && (
        <POSSettings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          settings={settings}
          onSave={async (settingsData) => {
            try {
              await updateSettings(settingsData);
              setShowSettings(false);
            } catch (err) {
              console.error('Erreur sauvegarde paramètres:', err);
              alert('Erreur lors de la sauvegarde');
            }
          }}
        />
      )}
    </div>
  );
}
