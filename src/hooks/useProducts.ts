import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Product } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function useProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    if (!user || !isSupabaseConfigured()) {
      setProducts([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase!
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Erreur chargement produits:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData: Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Product> => {
    if (!user || !isSupabaseConfigured()) {
      throw new Error('Supabase non configuré');
    }

    try {
      setError(null);

      const { data, error } = await supabase!
        .from('products')
        .insert({
          ...productData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      await fetchProducts();
      return data;
    } catch (err) {
      console.error('Erreur création produit:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    }
  };

  const updateProduct = async (productId: string, updates: Partial<Product>): Promise<void> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase non configuré');
    }

    try {
      setError(null);

      const { error } = await supabase!
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) throw error;
      await fetchProducts();
    } catch (err) {
      console.error('Erreur mise à jour produit:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    }
  };

  const deleteProduct = async (productId: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase non configuré');
    }

    try {
      setError(null);

      const { error } = await supabase!
        .from('products')
        .update({ is_active: false })
        .eq('id', productId);

      if (error) throw error;
      await fetchProducts();
    } catch (err) {
      console.error('Erreur suppression produit:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user?.id]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct
  };
}
