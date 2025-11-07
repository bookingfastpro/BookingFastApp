import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Invoice, InvoiceItem } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function useInvoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotes, setQuotes] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchInvoices = async () => {
    console.log('🔄 fetchInvoices appelé, user:', user?.id);
    
    if (!user || !isSupabaseConfigured()) {
      console.log('❌ Pas de user ou Supabase non configuré');
      setInvoices([]);
      setQuotes([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📡 Requête Supabase en cours...');
      const { data, error } = await supabase!
        .from('invoices')
        .select(`
          *,
          client:clients(*),
          items:invoice_items(*)
        `)
        .eq('user_id', user.id)
        .order('invoice_date', { ascending: false });

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw error;
      }
      
      console.log('✅ Documents récupérés:', data?.length, 'documents');
      
      // Séparer devis et factures
      const allQuotes = data?.filter(doc => doc.document_type === 'quote') || [];
      const allInvoices = data?.filter(doc => doc.document_type === 'invoice') || [];
      
      console.log('📋 Devis:', allQuotes.length, '| Factures:', allInvoices.length);
      
      setQuotes([...allQuotes]);
      setInvoices([...allInvoices]);
      
      setRefreshKey(prev => prev + 1);
      console.log('🔑 RefreshKey incrémenté');
    } catch (err) {
      console.error('❌ Erreur chargement documents:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const generateQuoteNumber = async (): Promise<string> => {
    if (!user || !isSupabaseConfigured()) {
      return `D${new Date().getFullYear()}-0001`;
    }

    try {
      const { data, error } = await supabase!
        .rpc('generate_quote_number', { p_user_id: user.id });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erreur génération numéro devis:', err);
      const year = new Date().getFullYear();
      const count = quotes.filter(q => 
        q.invoice_date.startsWith(year.toString())
      ).length + 1;
      return `D${year}-${count.toString().padStart(4, '0')}`;
    }
  };

  const generateInvoiceNumber = async (): Promise<string> => {
    if (!user || !isSupabaseConfigured()) {
      return `F${new Date().getFullYear()}-0001`;
    }

    try {
      const { data, error } = await supabase!
        .rpc('generate_invoice_number', { p_user_id: user.id });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erreur génération numéro facture:', err);
      const year = new Date().getFullYear();
      const count = invoices.filter(inv => 
        inv.invoice_date.startsWith(year.toString())
      ).length + 1;
      return `F${year}-${count.toString().padStart(4, '0')}`;
    }
  };

  const createInvoice = async (invoiceData: Partial<Invoice>, items: Partial<InvoiceItem>[]): Promise<Invoice> => {
    console.log('🆕 createInvoice appelé');
    
    if (!user || !isSupabaseConfigured()) {
      throw new Error('Supabase non configuré');
    }

    try {
      setError(null);

      // Générer le numéro de devis
      const quoteNumber = await generateQuoteNumber();
      console.log('📝 Numéro de devis généré:', quoteNumber);

      // Calculer les totaux
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

      const total_ttc = subtotal_ht + total_tva;

      console.log('💰 Totaux calculés - HT:', subtotal_ht, 'TVA:', total_tva, 'TTC:', total_ttc);

      // Créer le devis (document_type = 'quote')
      console.log('📤 Insertion devis en base...');
      const { data: invoice, error: invoiceError } = await supabase!
        .from('invoices')
        .insert({
          ...invoiceData,
          user_id: user.id,
          document_type: 'quote',
          quote_number: quoteNumber,
          invoice_number: quoteNumber, // Utiliser le même numéro pour l'instant
          subtotal_ht,
          total_tva,
          total_ttc
        })
        .select()
        .single();

      if (invoiceError) {
        console.error('❌ Erreur insertion devis:', invoiceError);
        throw invoiceError;
      }

      console.log('✅ Devis créé:', invoice.id);

      // Créer les lignes
      const invoiceItems = items.map(item => {
        const itemTotal = (item.quantity || 0) * (item.unit_price_ht || 0);
        const discount = itemTotal * ((item.discount_percent || 0) / 100);
        const totalHT = itemTotal - discount;
        const tva = totalHT * ((item.tva_rate || 20) / 100);
        const totalTTC = totalHT + tva;

        return {
          ...item,
          invoice_id: invoice.id,
          total_ht: totalHT,
          total_tva: tva,
          total_ttc: totalTTC
        };
      });

      console.log('📤 Insertion items en base...');
      const { error: itemsError } = await supabase!
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) {
        console.error('❌ Erreur insertion items:', itemsError);
        throw itemsError;
      }

      console.log('✅ Items créés');

      // Refresh automatique
      console.log('🔄 Appel fetchInvoices pour refresh...');
      await fetchInvoices();
      console.log('✅ Refresh terminé');
      
      return invoice;
    } catch (err) {
      console.error('❌ Erreur création devis:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    }
  };

  const convertQuoteToInvoice = async (quoteId: string): Promise<void> => {
    console.log('🔄 Conversion devis → facture:', quoteId);
    
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase non configuré');
    }

    try {
      setError(null);

      // Générer le numéro de facture
      const invoiceNumber = await generateInvoiceNumber();
      console.log('📝 Numéro de facture généré:', invoiceNumber);

      // Convertir le devis en facture
      const { error } = await supabase!
        .from('invoices')
        .update({
          document_type: 'invoice',
          invoice_number: invoiceNumber,
          status: 'paid',
          converted_at: new Date().toISOString(),
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', quoteId);

      if (error) throw error;
      
      console.log('✅ Devis converti en facture');
      
      // Refresh automatique
      await fetchInvoices();
    } catch (err) {
      console.error('❌ Erreur conversion:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    }
  };

  const updateInvoice = async (invoiceId: string, updates: Partial<Invoice>): Promise<void> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase non configuré');
    }

    try {
      setError(null);

      const { error } = await supabase!
        .from('invoices')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (error) throw error;
      
      await fetchInvoices();
    } catch (err) {
      console.error('Erreur mise à jour:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    }
  };

  const deleteInvoice = async (invoiceId: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase non configuré');
    }

    try {
      setError(null);

      const { error } = await supabase!
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;
      
      await fetchInvoices();
    } catch (err) {
      console.error('Erreur suppression:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    }
  };

  useEffect(() => {
    console.log('🎯 useEffect useInvoices, user:', user?.id);
    if (user) {
      fetchInvoices();
    }
  }, [user?.id]);

  return {
    invoices,
    quotes,
    loading,
    error,
    refreshKey,
    fetchInvoices,
    generateQuoteNumber,
    generateInvoiceNumber,
    createInvoice,
    convertQuoteToInvoice,
    updateInvoice,
    deleteInvoice
  };
}
