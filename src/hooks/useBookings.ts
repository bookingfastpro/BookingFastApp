import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Booking } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { GoogleCalendarService } from '../lib/googleCalendar';
import { triggerWorkflow } from '../lib/workflowEngine';

export function useBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Utiliser useRef pour éviter les re-renders
  const fetchingRef = useRef(false);

  const fetchBookings = useCallback(async () => {
    // Éviter les appels multiples simultanés
    if (fetchingRef.current) {
      console.log('⏭️ fetchBookings déjà en cours, skip');
      return;
    }

    if (!user) {
      console.log('⚠️ fetchBookings - Pas d\'utilisateur');
      setBookings([]);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      console.log('⚠️ fetchBookings - Supabase non configuré');
      setBookings([]);
      setLoading(false);
      return;
    }

    fetchingRef.current = true;
    console.log('🔄 fetchBookings - Chargement en cours...');
    setLoading(true);
    setError(null);

    try {
      let targetUserId = user.id;
      let isRestrictedMember = false;
      
      console.log('🔍 fetchBookings - targetUserId initial:', targetUserId);
      
      try {
        console.log('🔍 fetchBookings - Vérification team_members...');
        const { data: membershipData, error: membershipError } = await supabase!
          .from('team_members')
          .select('owner_id, role_name, restricted_visibility')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        console.log('🔍 fetchBookings - membershipData:', membershipData);
        
        if (!membershipError && membershipData) {
          targetUserId = membershipData.owner_id;
          isRestrictedMember = membershipData.restricted_visibility === true;
          console.log('🔍 fetchBookings - targetUserId mis à jour:', targetUserId);
          console.log('🔍 fetchBookings - restricted_visibility:', isRestrictedMember);
        }
      } catch (teamError) {
        console.warn('⚠️ Erreur vérification équipe:', teamError);
      }

      console.log('🔍 fetchBookings - Requête bookings pour user_id:', targetUserId);
      
      // Construire la requête de base
      let query = supabase!
        .from('bookings')
        .select(`
          *,
          service:services(*)
        `)
        .eq('user_id', targetUserId);

      // Si l'utilisateur a la visibilité restreinte, filtrer par assigned_user_id
      if (isRestrictedMember) {
        console.log('🔒 fetchBookings - Application du filtre de visibilité restreinte pour:', user.id);
        query = query.eq('assigned_user_id', user.id);
      }

      const { data, error } = await query
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) {
        console.error('❌ Erreur chargement bookings:', error);
        throw error;
      }

      console.log('✅ Bookings chargés:', data?.length || 0, 'réservations');
      if (isRestrictedMember) {
        console.log('🔒 Réservations filtrées pour membre restreint');
      }
      
      // 🔥 CORRECTION: S'assurer que les transactions sont bien présentes
      const bookingsWithTransactions = data?.map(booking => ({
        ...booking,
        transactions: booking.transactions || []
      })) || [];
      
      console.log('📋 Bookings avec transactions:', bookingsWithTransactions);
      setBookings(bookingsWithTransactions);
    } catch (err) {
      console.error('❌ Erreur lors du chargement des réservations:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
      setBookings([]);
    } finally {
      console.log('🏁 fetchBookings - Terminé');
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [user?.id]);

  const addBooking = async (bookingData: Omit<Booking, 'id' | 'created_at' | 'user_id'>) => {
    console.log('🎯 ========================================');
    console.log('🎯 DÉBUT addBooking');
    console.log('🎯 ========================================');
    console.log('📋 Données réservation:', bookingData);
    
    if (!isSupabaseConfigured || !user) {
      throw new Error('Supabase non configuré ou utilisateur non connecté');
    }

    try {
      let targetUserId = user.id;
      
      try {
        const { data: membershipData } = await supabase!
          .from('team_members')
          .select('owner_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (membershipData?.owner_id) {
          targetUserId = membershipData.owner_id;
        }
      } catch (teamError) {
        console.warn('⚠️ Erreur vérification équipe:', teamError);
      }

      console.log('🔍 addBooking - targetUserId:', targetUserId);

      // Vérifier la limite de réservations
      const { data: limitCheck, error: limitError } = await supabase!
        .rpc('check_booking_limit', { user_id_param: targetUserId });

      if (limitError) {
        console.warn('⚠️ Erreur vérification limite:', limitError);
      } else if (limitCheck && !limitCheck.allowed) {
        throw new Error(
          `Limite de réservations atteinte ! Vous avez utilisé ${limitCheck.current}/${limitCheck.limit} réservations ce mois-ci. Passez au plan Pro pour des réservations illimitées.`
        );
      }

      console.log('💾 Insertion réservation dans la base de données...');
      const { data, error } = await supabase!
        .from('bookings')
        .insert([{ ...bookingData, user_id: targetUserId }])
        .select(`
          *,
          service:services(*)
        `)
        .single();

      if (error) {
        console.error('❌ Erreur insertion:', error);
        throw error;
      }

      console.log('✅ Réservation créée:', data);

      if (data) {
        setBookings(prev => [...prev, data]);
        
        // 🔥 DÉCLENCHEMENT DES WORKFLOWS
        console.log('🔥 ========================================');
        console.log('🔥 DÉCLENCHEMENT DES WORKFLOWS');
        console.log('🔥 ========================================');
        
        // Workflow: Réservation créée
        console.log('🔥 Trigger: booking_created');
        try {
          await triggerWorkflow('booking_created', data, targetUserId);
          console.log('✅ Workflow booking_created déclenché');
        } catch (workflowError) {
          console.error('❌ Erreur workflow booking_created:', workflowError);
        }
        
        // Workflow: Lien de paiement créé (si payment_link existe)
        if (data.payment_link) {
          console.log('🔥 Trigger: payment_link_created');
          console.log('🔥 Payment link:', data.payment_link);
          try {
            await triggerWorkflow('payment_link_created', data, targetUserId);
            console.log('✅ Workflow payment_link_created déclenché');
          } catch (workflowError) {
            console.error('❌ Erreur workflow payment_link_created:', workflowError);
          }
        } else {
          console.log('ℹ️ Pas de payment_link, workflow payment_link_created non déclenché');
        }
        
        console.log('🔥 ========================================');
        
        // Google Calendar
        try {
          await GoogleCalendarService.createEvent(data, targetUserId);
        } catch (calendarError) {
          console.warn('⚠️ Erreur synchronisation Google Calendar:', calendarError);
        }
        
        return data;
      }
    } catch (err) {
      console.error('❌ Erreur lors de l\'ajout de la réservation:', err);
      throw err;
    } finally {
      console.log('🏁 ========================================');
      console.log('🏁 FIN addBooking');
      console.log('🏁 ========================================');
    }
  };

  const updateBooking = async (id: string, updates: Partial<Booking>) => {
    console.log('🎯 ========================================');
    console.log('🎯 DÉBUT updateBooking');
    console.log('🎯 ========================================');
    console.log('📋 Booking ID:', id);
    console.log('📋 Updates:', updates);
    
    if (!isSupabaseConfigured || !user) {
      throw new Error('Supabase non configuré ou utilisateur non connecté');
    }

    try {
      let targetUserId = user.id;
      
      try {
        const { data: membershipData } = await supabase!
          .from('team_members')
          .select('owner_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (membershipData?.owner_id) {
          targetUserId = membershipData.owner_id;
        }
      } catch (teamError) {
        console.warn('⚠️ Erreur vérification équipe:', teamError);
      }

      // Récupérer l'ancienne réservation pour comparer
      console.log('🔍 Récupération ancienne réservation...');
      const { data: oldBooking } = await supabase!
        .from('bookings')
        .select(`
          *,
          service:services(*)
        `)
        .eq('id', id)
        .single();

      console.log('📋 Ancienne réservation:', oldBooking);

      // Nettoyer les données avant l'update - retirer les champs relationnels
      const cleanUpdates = { ...updates };
      delete (cleanUpdates as any).service;
      delete (cleanUpdates as any).created_at;
      delete (cleanUpdates as any).id;

      console.log('🔄 updateBooking - Données nettoyées:', cleanUpdates);

      // CORRECTION: Faire l'update SANS select, puis récupérer les données séparément
      const { error: updateError } = await supabase!
        .from('bookings')
        .update(cleanUpdates)
        .eq('id', id);

      if (updateError) {
        console.error('❌ updateBooking - Erreur update:', updateError);
        throw updateError;
      }

      console.log('✅ updateBooking - Update réussi');

      // Récupérer les données mises à jour dans une requête séparée
      const { data, error: fetchError } = await supabase!
        .from('bookings')
        .select(`
          *,
          service:services(*)
        `)
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('❌ updateBooking - Erreur fetch:', fetchError);
        throw fetchError;
      }

      console.log('✅ updateBooking - Données récupérées:', data);

      if (data) {
        // 🔥 CORRECTION: S'assurer que les transactions sont bien présentes
        const bookingWithTransactions = {
          ...data,
          transactions: data.transactions || []
        };
        
        setBookings(prev => prev.map(b => b.id === id ? bookingWithTransactions : b));
        
        // 🔥 DÉCLENCHEMENT DES WORKFLOWS
        console.log('🔥 ========================================');
        console.log('🔥 DÉCLENCHEMENT DES WORKFLOWS (UPDATE)');
        console.log('🔥 ========================================');
        
        // Workflow: Réservation mise à jour
        console.log('🔥 Trigger: booking_updated');
        try {
          await triggerWorkflow('booking_updated', bookingWithTransactions, targetUserId);
          console.log('✅ Workflow booking_updated déclenché');
        } catch (workflowError) {
          console.error('❌ Erreur workflow booking_updated:', workflowError);
        }
        
        // Workflow: Lien de paiement créé (si nouveau payment_link)
        if (bookingWithTransactions.payment_link && (!oldBooking || oldBooking.payment_link !== bookingWithTransactions.payment_link)) {
          console.log('🔥 Trigger: payment_link_created (nouveau lien)');
          console.log('🔥 Payment link:', bookingWithTransactions.payment_link);
          try {
            await triggerWorkflow('payment_link_created', bookingWithTransactions, targetUserId);
            console.log('✅ Workflow payment_link_created déclenché');
          } catch (workflowError) {
            console.error('❌ Erreur workflow payment_link_created:', workflowError);
          }
        }
        
        // Workflow: Statut de réservation changé
        if (oldBooking && oldBooking.booking_status !== bookingWithTransactions.booking_status) {
          console.log('🔥 Trigger: booking_status_changed');
          console.log('🔥 Ancien statut:', oldBooking.booking_status, '→ Nouveau:', bookingWithTransactions.booking_status);
          try {
            await triggerWorkflow('booking_status_changed', bookingWithTransactions, targetUserId);
            console.log('✅ Workflow booking_status_changed déclenché');
          } catch (workflowError) {
            console.error('❌ Erreur workflow booking_status_changed:', workflowError);
          }
        }
        
        console.log('🔥 ========================================');
        
        // Google Calendar
        try {
          await GoogleCalendarService.updateEvent(bookingWithTransactions, targetUserId);
        } catch (calendarError) {
          console.warn('⚠️ Erreur synchronisation Google Calendar:', calendarError);
        }
        
        return bookingWithTransactions;
      }
    } catch (err) {
      console.error('❌ updateBooking - Erreur globale:', err);
      throw err;
    } finally {
      console.log('🏁 ========================================');
      console.log('🏁 FIN updateBooking');
      console.log('🏁 ========================================');
    }
  };

  const deleteBooking = async (id: string) => {
    console.log('🗑️ useBookings.deleteBooking - Début suppression:', id);
    
    if (!isSupabaseConfigured || !user) {
      console.error('❌ Supabase non configuré ou utilisateur non connecté');
      throw new Error('Supabase non configuré ou utilisateur non connecté');
    }

    try {
      let targetUserId = user.id;
      
      try {
        const { data: membershipData } = await supabase!
          .from('team_members')
          .select('owner_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (membershipData?.owner_id) {
          targetUserId = membershipData.owner_id;
          console.log('🔍 useBookings.deleteBooking - targetUserId:', targetUserId);
        }
      } catch (teamError) {
        console.warn('⚠️ Erreur vérification équipe:', teamError);
      }

      // Récupérer les infos de la réservation avant suppression
      console.log('🔍 useBookings.deleteBooking - Récupération infos réservation...');
      const { data: bookingData } = await supabase!
        .from('bookings')
        .select('google_calendar_event_id')
        .eq('id', id)
        .single();

      console.log('🔍 useBookings.deleteBooking - Infos réservation:', bookingData);

      // Supprimer la réservation de la base de données
      console.log('🔄 useBookings.deleteBooking - Suppression de la base de données...');
      const { error } = await supabase!
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ useBookings.deleteBooking - Erreur suppression DB:', error);
        throw error;
      }

      console.log('✅ useBookings.deleteBooking - Suppression DB réussie');

      // Mettre à jour l'état local
      console.log('🔄 useBookings.deleteBooking - Mise à jour état local...');
      setBookings(prev => {
        const newBookings = prev.filter(b => b.id !== id);
        console.log('📊 useBookings.deleteBooking - Avant:', prev.length, 'Après:', newBookings.length);
        return newBookings;
      });
      
      // Supprimer l'événement Google Calendar si nécessaire
      if (bookingData?.google_calendar_event_id) {
        try {
          console.log('🔄 useBookings.deleteBooking - Suppression Google Calendar...');
          await GoogleCalendarService.deleteEvent(bookingData.google_calendar_event_id, targetUserId);
          console.log('✅ useBookings.deleteBooking - Suppression Google Calendar réussie');
        } catch (calendarError) {
          console.warn('⚠️ Erreur suppression événement Google Calendar:', calendarError);
        }
      }

      console.log('✅ useBookings.deleteBooking - Suppression terminée avec succès');
    } catch (err) {
      console.error('❌ useBookings.deleteBooking - Erreur:', err);
      throw err;
    }
  };

  useEffect(() => {
    console.log('🔍 useEffect - Déclenché, user:', user?.id);
    
    if (user) {
      console.log('✅ useEffect - Appel de fetchBookings');
      fetchBookings();
    } else {
      console.log('⚠️ useEffect - Pas d\'utilisateur, reset bookings');
      setBookings([]);
      setLoading(false);
    }
  }, [user?.id, fetchBookings]);

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings,
    addBooking,
    updateBooking,
    deleteBooking
  };
}
