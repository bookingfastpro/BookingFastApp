import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useServices } from './useServices';
import { POSCategory, POSProduct, POSTransaction, POSSettings, CartItem } from '../types/pos';
import { Service } from '../types';
import { calculateTaxAmount } from '../lib/taxCalculations';

export function usePOS() {
  const { user } = useAuth();
  const { services: bookingServices } = useServices();
  const [categories, setCategories] = useState<POSCategory[]>([]);
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [transactions, setTransactions] = useState<POSTransaction[]>([]);
  const [settings, setSettings] = useState<POSSettings | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, bookingServices]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchCategories(),
      fetchProducts(),
      fetchTransactions(),
      fetchSettings()
    ]);
    setLoading(false);
  };

  const fetchCategories = async () => {
    if (!supabase || !user) return;

    try {
      const { data, error } = await supabase
        .from('pos_categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      
      // Ajouter une catégorie par défaut pour les services de réservation
      const defaultCategory: POSCategory = {
        id: 'booking-services',
        user_id: user.id,
        name: 'Services de réservation',
        color: 'blue',
        icon: 'calendar',
        display_order: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setCategories([defaultCategory, ...(data || [])]);
    } catch (err) {
      console.error('Erreur chargement catégories:', err);
    }
  };

  const fetchProducts = async () => {
    if (!supabase || !user) return;

    try {
      const { data, error } = await supabase
        .from('pos_products')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      // Convertir les services de réservation en produits POS
      const bookingProducts: POSProduct[] = bookingServices
        .filter(service => service.description !== 'Service personnalisé')
        .map(service => ({
          id: `booking-${service.id}`,
          user_id: user.id,
          category_id: 'booking-services',
          name: service.name,
          description: service.description,
          price: service.price_ttc,
          cost: service.price_ht,
          stock: 999,
          track_stock: false,
          duration_minutes: service.duration_minutes,
          color: 'blue',
          is_active: true,
          is_ttc_price: true,
          created_at: service.created_at || new Date().toISOString(),
          updated_at: service.updated_at || new Date().toISOString(),
          _isBookingService: true,
          _isTTCPrice: true
        }));
      
      // Appliquer le flag _isTTCPrice aux produits POS selon leur configuration
      const posProducts = (data || []).map(product => ({
        ...product,
        _isTTCPrice: product.is_ttc_price || false
      }));
      
      setProducts([...bookingProducts, ...posProducts]);
    } catch (err) {
      console.error('Erreur chargement produits:', err);
    }
  };

  const fetchTransactions = async () => {
    if (!supabase || !user) return;

    try {
      const { data, error } = await supabase
        .from('pos_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Erreur chargement transactions:', err);
    }
  };

  const fetchSettings = async () => {
    if (!supabase || !user) return;

    try {
      const { data, error } = await supabase
        .from('pos_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from('pos_settings')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newSettings);
      } else {
        setSettings(data);
      }
    } catch (err) {
      console.error('Erreur chargement paramètres:', err);
    }
  };

  const addToCart = (product: POSProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const calculateCartTotal = () => {
    const taxRate = settings?.tax_rate || 20;
    
    // Séparer les produits TTC et HT
    const ttcItems = cart.filter(item => item.product._isTTCPrice);
    const htItems = cart.filter(item => !item.product._isTTCPrice);
    
    // Calculer le total TTC (prix déjà TTC, pas de TVA à ajouter)
    const ttcTotal = ttcItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    
    // Calculer le total HT (prix HT, TVA à ajouter)
    const htSubtotal = htItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const htTaxAmount = (htSubtotal * taxRate) / 100;
    const htTotal = htSubtotal + htTaxAmount;
    
    // Calculer la TVA incluse dans les produits TTC
    const ttcTaxAmount = ttcItems.reduce((sum, item) => {
      const itemTotal = item.product.price * item.quantity;
      return sum + calculateTaxAmount(itemTotal, taxRate);
    }, 0);
    
    // Totaux finaux
    const subtotal = htSubtotal + (ttcTotal - ttcTaxAmount); // Sous-total HT
    const taxAmount = htTaxAmount + ttcTaxAmount; // TVA totale
    const total = ttcTotal + htTotal; // Total TTC

    return { subtotal, taxAmount, total, taxRate };
  };

  const createTransaction = async (customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    notes?: string;
  }) => {
    if (!supabase || !user || cart.length === 0) {
      throw new Error('Panier vide ou configuration invalide');
    }

    try {
      const { subtotal, taxAmount, total, taxRate } = calculateCartTotal();

      const { data: transactionNumber } = await supabase
        .rpc('generate_transaction_number');

      const { data: transaction, error: transactionError } = await supabase
        .from('pos_transactions')
        .insert({
          user_id: user.id,
          transaction_number: transactionNumber,
          customer_name: customerInfo?.name,
          customer_email: customerInfo?.email,
          customer_phone: customerInfo?.phone,
          notes: customerInfo?.notes,
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total,
          payment_method: 'cash',
          payment_status: 'completed'
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      const items = cart.map(item => ({
        transaction_id: transaction.id,
        product_id: item.product._isBookingService ? null : item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('pos_transaction_items')
        .insert(items);

      if (itemsError) throw itemsError;

      clearCart();
      await fetchTransactions();
      await fetchProducts();

      return transaction;
    } catch (err) {
      console.error('Erreur création transaction:', err);
      throw err;
    }
  };

  const createProduct = async (product: Partial<POSProduct>) => {
    if (!supabase || !user) throw new Error('Configuration invalide');

    try {
      const { data, error } = await supabase
        .from('pos_products')
        .insert({ ...product, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      await fetchProducts();
      return data;
    } catch (err) {
      console.error('Erreur création produit:', err);
      throw err;
    }
  };

  const updateProduct = async (id: string, updates: Partial<POSProduct>) => {
    if (!supabase) throw new Error('Configuration invalide');

    try {
      const { error } = await supabase
        .from('pos_products')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchProducts();
    } catch (err) {
      console.error('Erreur mise à jour produit:', err);
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    if (!supabase) throw new Error('Configuration invalide');

    try {
      const { error } = await supabase
        .from('pos_products')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      await fetchProducts();
    } catch (err) {
      console.error('Erreur suppression produit:', err);
      throw err;
    }
  };

  const createCategory = async (category: Partial<POSCategory>) => {
    if (!supabase || !user) throw new Error('Configuration invalide');

    try {
      const { data, error } = await supabase
        .from('pos_categories')
        .insert({ ...category, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      await fetchCategories();
      return data;
    } catch (err) {
      console.error('Erreur création catégorie:', err);
      throw err;
    }
  };

  const updateCategory = async (id: string, updates: Partial<POSCategory>) => {
    if (!supabase) throw new Error('Configuration invalide');

    try {
      const { error } = await supabase
        .from('pos_categories')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchCategories();
    } catch (err) {
      console.error('Erreur mise à jour catégorie:', err);
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    if (!supabase) throw new Error('Configuration invalide');

    try {
      const { error } = await supabase
        .from('pos_categories')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      await fetchCategories();
    } catch (err) {
      console.error('Erreur suppression catégorie:', err);
      throw err;
    }
  };

  const updateSettings = async (updates: Partial<POSSettings>) => {
    if (!supabase || !user) throw new Error('Configuration invalide');

    try {
      const { error } = await supabase
        .from('pos_settings')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchSettings();
    } catch (err) {
      console.error('Erreur mise à jour paramètres:', err);
      throw err;
    }
  };

  return {
    categories,
    products,
    transactions,
    settings,
    cart,
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
    updateSettings,
    refetch: loadData
  };
}
