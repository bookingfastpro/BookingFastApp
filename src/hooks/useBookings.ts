import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Booking } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { GoogleCalendarService } from '../lib/googleCalendar';
import { triggerWorkflow } from '../lib/workflowEngine';
import { logger } from '../utils/logger';

export function useBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchingRef = useRef(false);

  const fetchBookings = useCallback(async () => {
    if (fetchingRef.current) {
      logger.debug('⏭️ fetchBookings déjà en cours, skip');
      return;
    }

    if (!user) {
      setBookings([]);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setBookings([]);
      setLoading(false);
      return;
    }

    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      let targetUserId = user.id;
      let isRestrictedMember = false;

      try {
        const { data: membershipData, error: membershipError } = await supabase!
          .from('team_members')
          .select('owner_id, restricted_visibility')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (!membershipError && membershipData) {
          targetUserId = membershipData.owner_id;
          isRestrictedMember = membershipData.restricted_visibility === true;
        }
      } catch (teamError) {
        logger.error('⚠️ Erreur vérification équipe:', teamError);
      }

      let query = supabase!
        .from('bookings')
        .select('*, service:services(*)')
        .eq('user_id', targetUserId);

      if (isRestrictedMember) {
        query = query.eq('assigned_user_id', user.id);
      }

      const { data, error } = await query
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;

      const bookingsWithTransactions = data?.map(booking => ({
        ...booking,
        transactions: booking.transactions || []
      })) || [];

      setBookings(bookingsWithTransactions);
    } catch (err) {
      logger.error('❌ Erreur chargement réservations:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
      setBookings([]);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [user?.id]);

  const addBooking = async (bookingData: Omit<Booking, 'id' | 'created_at' | 'user_id'>) => {
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
        logger.error('⚠️ Erreur vérification équipe:', teamError);
      }

      const { data: limitCheck, error: limitError } = await supabase!
        .rpc('check_booking_limit', { user_id_param: targetUserId });

      if (limitError) {
        logger.error('⚠️ Erreur vérification limite:', limitError);
      } else if (limitCheck && !limitCheck.allowed) {
        throw new Error(
          `Limite de réservations atteinte ! Vous avez utilisé ${limitCheck.current}/${limitCheck.limit} réservations ce mois-ci. Passez au plan Pro pour des réservations illimitées.`
        );
      }

      const { data, error } = await supabase!
        .from('bookings')
        .insert([{ ...bookingData, user_id: targetUserId }])
        .select('*, service:services(*)')
        .single();

      if (error) throw error;

      if (data) {
        setBookings(prev => [...prev, data]);

        try {
          await triggerWorkflow('booking_created', data, targetUserId);
        } catch (workflowError) {
          logger.error('❌ Erreur workflow booking_created:', workflowError);
        }

        if (data.payment_link) {
          try {
            await triggerWorkflow('payment_link_created', data, targetUserId);
          } catch (workflowError) {
            logger.error('❌ Erreur workflow payment_link_created:', workflowError);
          }
        }

        try {
          await GoogleCalendarService.createEvent(data, targetUserId);
        } catch (calendarError) {
          logger.error('⚠️ Erreur Google Calendar:', calendarError);
        }

        return data;
      }
    } catch (err) {
      logger.error('❌ Erreur ajout réservation:', err);
      throw err;
    }
  };

  const updateBooking = async (id: string, updates: Partial<Booking>) => {
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
        logger.error('⚠️ Erreur vérification équipe:', teamError);
      }

      const { data: oldBooking } = await supabase!
        .from('bookings')
        .select('*, service:services(*)')
        .eq('id', id)
        .single();

      const cleanUpdates = { ...updates };
      delete (cleanUpdates as any).service;
      delete (cleanUpdates as any).created_at;
      delete (cleanUpdates as any).id;

      const { error: updateError } = await supabase!
        .from('bookings')
        .update(cleanUpdates)
        .eq('id', id);

      if (updateError) throw updateError;

      const { data, error: fetchError } = await supabase!
        .from('bookings')
        .select('*, service:services(*)')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        const bookingWithTransactions = {
          ...data,
          transactions: data.transactions || []
        };

        setBookings(prev => prev.map(b => b.id === id ? bookingWithTransactions : b));

        try {
          await triggerWorkflow('booking_updated', bookingWithTransactions, targetUserId);
        } catch (workflowError) {
          logger.error('❌ Erreur workflow booking_updated:', workflowError);
        }

        if (bookingWithTransactions.payment_link && (!oldBooking || oldBooking.payment_link !== bookingWithTransactions.payment_link)) {
          try {
            await triggerWorkflow('payment_link_created', bookingWithTransactions, targetUserId);
          } catch (workflowError) {
            logger.error('❌ Erreur workflow payment_link_created:', workflowError);
          }
        }

        if (oldBooking && oldBooking.booking_status !== bookingWithTransactions.booking_status) {
          try {
            await triggerWorkflow('booking_status_changed', bookingWithTransactions, targetUserId);
          } catch (workflowError) {
            logger.error('❌ Erreur workflow booking_status_changed:', workflowError);
          }
        }

        try {
          await GoogleCalendarService.updateEvent(bookingWithTransactions, targetUserId);
        } catch (calendarError) {
          logger.error('⚠️ Erreur Google Calendar:', calendarError);
        }

        return bookingWithTransactions;
      }
    } catch (err) {
      logger.error('❌ Erreur mise à jour réservation:', err);
      throw err;
    }
  };

  const deleteBooking = async (id: string) => {
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
        logger.error('⚠️ Erreur vérification équipe:', teamError);
      }

      const { data: bookingData } = await supabase!
        .from('bookings')
        .select('google_calendar_event_id')
        .eq('id', id)
        .single();

      const { error } = await supabase!
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBookings(prev => prev.filter(b => b.id !== id));

      if (bookingData?.google_calendar_event_id) {
        try {
          await GoogleCalendarService.deleteEvent(bookingData.google_calendar_event_id, targetUserId);
        } catch (calendarError) {
          logger.error('⚠️ Erreur Google Calendar:', calendarError);
        }
      }
    } catch (err) {
      logger.error('❌ Erreur suppression réservation:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchBookings();
    } else {
      setBookings([]);
      setLoading(false);
    }
  }, [user?.id, fetchBookings]);

  const memoizedReturn = useMemo(() => ({
    bookings,
    loading,
    error,
    refetch: fetchBookings,
    addBooking,
    updateBooking,
    deleteBooking
  }), [bookings, loading, error, fetchBookings]);

  return memoizedReturn;
}
