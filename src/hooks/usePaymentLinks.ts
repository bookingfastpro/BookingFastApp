import { useState } from 'react';
import { supabase } from '../lib/supabase';

export interface PaymentLink {
  id: string;
  booking_id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  expires_at: string;
  payment_url: string;
  created_at: string;
}

export function usePaymentLinks() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPaymentLink = async (
    bookingId: string,
    amount: number,
    expiryMinutes: number = 30
  ): Promise<PaymentLink | null> => {
    console.log('🔵 [usePaymentLinks] createPaymentLink appelé');
    console.log('📋 Booking ID:', bookingId);
    console.log('💰 Montant:', amount);
    console.log('⏰ Expiration:', expiryMinutes, 'minutes');

    setLoading(true);
    setError(null);

    try {
      if (!supabase) {
        throw new Error('Supabase non configuré');
      }

      // Calculer la date d'expiration
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

      console.log('📅 Date d\'expiration:', expiresAt.toISOString());

      // Récupérer l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      console.log('👤 User ID:', user.id);

      // Créer le lien de paiement dans la base de données
      const { data: paymentLink, error: insertError } = await supabase
        .from('payment_links')
        .insert({
          booking_id: bookingId,
          user_id: user.id,
          amount: amount,
          status: 'pending',
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erreur insertion:', insertError);
        throw insertError;
      }

      if (!paymentLink) {
        throw new Error('Échec de création du lien');
      }

      console.log('✅ Payment link créé:', paymentLink);

      // 🔥 GÉNÉRER L'URL AVEC UNIQUEMENT LE link_id
      const baseUrl = window.location.origin;
      const paymentUrl = `${baseUrl}/payment?link_id=${paymentLink.id}`;

      console.log('🔗 URL générée:', paymentUrl);

      // Mettre à jour le lien avec l'URL complète
      const { data: updatedLink, error: updateError } = await supabase
        .from('payment_links')
        .update({ payment_url: paymentUrl })
        .eq('id', paymentLink.id)
        .select()
        .single();

      if (updateError) {
        console.error('⚠️ Erreur mise à jour URL:', updateError);
        // On continue quand même, l'URL peut être reconstruite
      }

      const finalLink = updatedLink || { ...paymentLink, payment_url: paymentUrl };

      console.log('✅ Lien final:', finalLink);

      setLoading(false);
      return finalLink;
    } catch (err) {
      console.error('❌ Erreur createPaymentLink:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setLoading(false);
      return null;
    }
  };

  const getPaymentLink = async (linkId: string): Promise<PaymentLink | null> => {
    try {
      if (!supabase) {
        throw new Error('Supabase non configuré');
      }

      const { data, error } = await supabase
        .from('payment_links')
        .select('*')
        .eq('id', linkId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erreur récupération lien:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return null;
    }
  };

  const updatePaymentLinkStatus = async (
    linkId: string,
    status: PaymentLink['status']
  ): Promise<boolean> => {
    try {
      if (!supabase) {
        throw new Error('Supabase non configuré');
      }

      const { error } = await supabase
        .from('payment_links')
        .update({ status })
        .eq('id', linkId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return false;
    }
  };

  return {
    createPaymentLink,
    getPaymentLink,
    updatePaymentLinkStatus,
    loading,
    error
  };
}
