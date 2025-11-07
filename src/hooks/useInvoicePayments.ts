import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { InvoicePayment } from '../types';

export function useInvoicePayments(invoiceId: string) {
  const [payments, setPayments] = useState<InvoicePayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async () => {
    if (!invoiceId || !isSupabaseConfigured()) {
      setPayments([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase!
        .from('invoice_payments')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      
      setPayments(data || []);
    } catch (err) {
      console.error('Erreur chargement paiements:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const addPayment = async (payment: Omit<InvoicePayment, 'id' | 'created_at'>): Promise<void> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase non configuré');
    }

    try {
      setError(null);

      const { error } = await supabase!
        .from('invoice_payments')
        .insert(payment);

      if (error) throw error;
      
      await fetchPayments();
    } catch (err) {
      console.error('Erreur ajout paiement:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    }
  };

  const deletePayment = async (paymentId: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase non configuré');
    }

    try {
      setError(null);

      const { error } = await supabase!
        .from('invoice_payments')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;
      
      await fetchPayments();
    } catch (err) {
      console.error('Erreur suppression paiement:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    }
  };

  const getTotalPaid = (): number => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  useEffect(() => {
    if (invoiceId) {
      fetchPayments();
    }
  }, [invoiceId]);

  return {
    payments,
    loading,
    error,
    fetchPayments,
    addPayment,
    deletePayment,
    getTotalPaid
  };
}
