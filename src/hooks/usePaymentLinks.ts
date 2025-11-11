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
  short_code?: string;
  created_at: string;
}

const generateShortCode = (length: number = 7): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export function usePaymentLinks() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPaymentLink = async (
    bookingId: string,
    amount: number,
    expiryMinutes: number = 30,
    options?: { sendEmail?: boolean; sendSms?: boolean }
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

      // Générer un code court unique
      let shortCode = '';
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        shortCode = generateShortCode();

        // Vérifier si le code existe déjà
        const { data: existing } = await supabase
          .from('payment_links')
          .select('id')
          .eq('short_code', shortCode)
          .maybeSingle();

        if (!existing) {
          break;
        }

        attempts++;
      }

      if (!shortCode) {
        throw new Error('Impossible de générer un code court unique');
      }

      console.log('🔑 Code court généré:', shortCode);

      // Créer le lien de paiement dans la base de données
      const { data: paymentLink, error: insertError } = await supabase
        .from('payment_links')
        .insert({
          booking_id: bookingId,
          user_id: user.id,
          amount: amount,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
          short_code: shortCode
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

      // 🔥 GÉNÉRER L'URL COURTE AVEC LE SHORT CODE
      const baseUrl = window.location.origin;
      const paymentUrl = `${baseUrl}/p/${paymentLink.short_code}`;

      console.log('🔗 URL courte générée:', paymentUrl);

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

      // 🔥 METTRE À JOUR LA RÉSERVATION AVEC LE LIEN DE PAIEMENT
      try {
        console.log('🔄 Mise à jour réservation avec payment_link:', paymentUrl);
        const { error: updateBookingError } = await supabase
          .from('bookings')
          .update({ payment_link: paymentUrl })
          .eq('id', bookingId);

        if (updateBookingError) {
          console.error('⚠️ Erreur mise à jour réservation:', updateBookingError);
        } else {
          console.log('✅ Réservation mise à jour avec payment_link');

          // 🔥 DÉCLENCHER LES WORKFLOWS SEULEMENT SI LES OPTIONS SONT ACTIVÉES
          const { sendEmail = true, sendSms = true } = options || {};

          console.log('📧 Options notifications:', { sendEmail, sendSms });

          if (sendEmail || sendSms) {
            // Récupérer la réservation complète pour les workflows
            const { data: bookingData, error: bookingError } = await supabase
              .from('bookings')
              .select('*, service:services(*)')
              .eq('id', bookingId)
              .single();

            if (bookingError) {
              console.error('⚠️ Erreur récupération réservation:', bookingError);
            } else if (bookingData) {
              console.log('📝 Réservation récupérée pour workflows:', bookingData);

              // Importer dynamiquement les fonctions de workflow
              const { triggerWorkflow } = await import('../lib/workflowEngine');
              const { triggerSmsWorkflow } = await import('../lib/smsWorkflowEngine');

              if (sendEmail) {
                try {
                  console.log('📧 Déclenchement workflow email payment_link_created');
                  await triggerWorkflow('payment_link_created', bookingData, user.id);
                } catch (workflowError) {
                  console.error('❌ Erreur workflow email:', workflowError);
                }
              }

              if (sendSms) {
                try {
                  console.log('📱 Déclenchement workflow SMS payment_link_created');
                  await triggerSmsWorkflow('payment_link_created', bookingData, user.id);
                } catch (smsError) {
                  console.error('❌ Erreur workflow SMS:', smsError);
                }
              }
            }
          } else {
            console.log('⏭️ Notifications désactivées - Aucun workflow déclenché');
          }
        }
      } catch (updateError) {
        console.error('❌ Erreur complète mise à jour:', updateError);
      }

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
