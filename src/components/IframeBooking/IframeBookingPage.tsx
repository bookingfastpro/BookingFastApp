import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Calendar, Clock, User, Mail, Phone, CreditCard, Package, MapPin, Star, ArrowRight, ArrowLeft, Check, Building2, Euro, Users, Timer, ChevronRight, Sparkles, UserCheck, CheckCircle, ExternalLink, Loader2, Download, Share2 } from 'lucide-react';
import { Service, BusinessSettings, Booking, Unavailability, TeamMember } from '../../types';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { getBusinessTimezone, getCurrentDateInTimezone, formatInBusinessTimezone } from '../../lib/timezone';
import { validateBookingDateTime, getNextAvailableDateTime } from '../../lib/bookingValidation';
import { DatePicker } from './DatePicker';

interface PublicBookingData {
  user: any;
  services: Service[];
  settings: BusinessSettings;
  bookings: Booking[];
  unavailabilities: Unavailability[];
  teamMembers: TeamMember[];
  blockedDateRanges: Array<{
    id: string;
    start_date: string;
    end_date: string;
    reason?: string;
  }>;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export function IframeBookingPage() {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<PublicBookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedTeamMember, setSelectedTeamMember] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [clientData, setClientData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const [stripeSessionId, setStripeSessionId] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  // 🌐 Capturer l'origine du parent (site externe)
  const [parentOrigin, setParentOrigin] = useState<string | null>(null);

  // Récupérer les services autorisés depuis l'URL
  const allowedServices = searchParams.get('services')?.split(',').filter(Boolean) || [];
  
  // Vérifier si on revient d'un paiement
  const paymentStatus = searchParams.get('payment');
  const sessionId = searchParams.get('session_id');
  const returnOrigin = searchParams.get('origin');

  // 🌐 Détecter si on est dans un iframe
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    const inIframe = window.self !== window.top;
    setIsInIframe(inIframe);
    console.log('🌐 Dans un iframe:', inIframe);

    if (inIframe) {
      try {
        const origin = document.referrer ? new URL(document.referrer).origin : null;
        if (origin && origin !== window.location.origin) {
          setParentOrigin(origin);
          console.log('🌐 Origine parent détectée:', origin);
          sessionStorage.setItem('parentOrigin', origin);
        }
      } catch (err) {
        console.error('❌ Erreur détection origine:', err);
      }
    }

    const storedOrigin = sessionStorage.getItem('parentOrigin');
    if (storedOrigin && !parentOrigin) {
      setParentOrigin(storedOrigin);
      console.log('🔄 Origine récupérée depuis sessionStorage:', storedOrigin);
    }
  }, []);

  // 🔄 Polling pour vérifier le statut du paiement
  useEffect(() => {
    if (!waitingForPayment || !stripeSessionId) return;

    console.log('🔄 Démarrage polling paiement pour session:', stripeSessionId);

    const checkPaymentStatus = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
        const response = await fetch(`${supabaseUrl}/functions/v1/check-payment-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ sessionId: stripeSessionId })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('📊 Statut paiement:', result);

          if (result.status === 'complete' && result.payment_status === 'paid') {
            console.log('✅ Paiement confirmé !');
            
            // 🎯 Charger les détails complets de la réservation
            if (result.booking_id) {
              await loadBookingDetails(result.booking_id);
            }
            
            setWaitingForPayment(false);
            setCurrentStep(5);
            window.history.replaceState({}, '', window.location.pathname);
          }
        }
      } catch (err) {
        console.error('❌ Erreur vérification paiement:', err);
      }
    };

    const interval = setInterval(checkPaymentStatus, 3000);
    const timeout = setTimeout(() => {
      console.log('⏱️ Timeout polling paiement');
      setWaitingForPayment(false);
      setError('Le paiement prend trop de temps. Veuillez vérifier votre email de confirmation.');
    }, 10 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [waitingForPayment, stripeSessionId]);

  // 🎯 Charger les détails de la réservation
  const loadBookingDetails = async (bookingId: string) => {
    try {
      console.log('📥 Chargement détails réservation:', bookingId);
      
      if (!isSupabaseConfigured) {
        console.log('🎭 Mode démo - pas de chargement');
        return;
      }

      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (*)
        `)
        .eq('id', bookingId)
        .single();

      if (error) {
        console.error('❌ Erreur chargement réservation:', error);
        return;
      }

      console.log('✅ Réservation chargée:', booking);
      console.log('💰 deposit_amount:', booking.deposit_amount);
      console.log('💰 payment_amount:', booking.payment_amount);
      console.log('💰 total_amount:', booking.total_amount);

      // 🎯 CORRECTION CRITIQUE - Mettre à jour confirmedBooking avec TOUTES les données
      setConfirmedBooking(booking);
      setSelectedService(booking.services);
      setSelectedDate(booking.date);
      setSelectedTime(booking.time);
      setQuantity(booking.quantity || 1);
      setClientData({
        firstname: booking.client_firstname || '',
        lastname: booking.client_name || '',
        email: booking.client_email || '',
        phone: booking.client_phone || ''
      });
      
      if (booking.assigned_user_id) {
        setSelectedTeamMember(booking.assigned_user_id);
      }

    } catch (err) {
      console.error('❌ Erreur chargement détails:', err);
    }
  };

  // Gérer le retour de paiement
  useEffect(() => {
    if (paymentStatus === 'success' && sessionId) {
      console.log('✅ Retour paiement réussi, session:', sessionId);
      
      if (returnOrigin) {
        setParentOrigin(returnOrigin);
        sessionStorage.setItem('parentOrigin', returnOrigin);
        console.log('🔄 Origine restaurée depuis URL:', returnOrigin);
      }
      
      setStripeSessionId(sessionId);
      setWaitingForPayment(true);
    } else if (paymentStatus === 'cancelled') {
      console.log('❌ Paiement annulé');
      setCurrentStep(4);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [paymentStatus, sessionId, returnOrigin]);

  const fetchPublicData = async () => {
    if (!userId) {
      setError('ID utilisateur manquant');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      if (!isSupabaseConfigured) {
        console.log('🎭 Mode démo - données par défaut');
        const demoData: PublicBookingData = {
          user: { id: userId, email: 'demo@example.com', full_name: 'Démo Utilisateur' },
          services: [
            {
              id: 'demo-1',
              name: 'Massage relaxant',
              price_ttc: 80.00,
              image_url: 'https://images.pexels.com/photos/3757942/pexels-photo-3757942.jpeg',
              description: 'Massage de détente de 60 minutes pour évacuer le stress',
              duration_minutes: 60,
              capacity: 1,
              price_ht: 66.67,
              user_id: userId
            },
            {
              id: 'demo-2',
              name: 'Soin du visage',
              price_ttc: 50.00,
              image_url: 'https://images.pexels.com/photos/3985360/pexels-photo-3985360.jpeg',
              description: 'Soin complet du visage avec nettoyage et hydratation',
              duration_minutes: 45,
              capacity: 1,
              price_ht: 41.67,
              user_id: userId
            }
          ],
          settings: {
            id: 'demo',
            user_id: userId,
            business_name: 'Salon de Beauté Démo',
            primary_color: '#3B82F6',
            secondary_color: '#8B5CF6',
            opening_hours: {
              monday: { ranges: [{ start: '08:00', end: '18:00' }], closed: false },
              tuesday: { ranges: [{ start: '08:00', end: '18:00' }], closed: false },
              wednesday: { ranges: [{ start: '08:00', end: '18:00' }], closed: false },
              thursday: { ranges: [{ start: '08:00', end: '18:00' }], closed: false },
              friday: { ranges: [{ start: '08:00', end: '18:00' }], closed: false },
              saturday: { ranges: [{ start: '09:00', end: '17:00' }], closed: false },
              sunday: { ranges: [{ start: '10:00', end: '16:00' }], closed: true }
            },
            buffer_minutes: 15,
            default_deposit_percentage: 30,
            minimum_booking_delay_hours: 24,
            payment_link_expiry_minutes: 30,
            deposit_type: 'percentage',
            deposit_fixed_amount: 20,
            email_notifications: true,
            brevo_enabled: false,
            brevo_api_key: '',
            brevo_sender_email: '',
            brevo_sender_name: 'BookingFast',
            stripe_enabled: false,
            stripe_public_key: '',
            stripe_secret_key: '',
            stripe_webhook_secret: '',
            timezone: 'Europe/Paris',
            multiply_deposit_by_services: false,
            iframe_enable_team_selection: false
          },
          bookings: [],
          unavailabilities: [],
          teamMembers: [],
          blockedDateRanges: []
        };
        setData(demoData);
        setLoading(false);
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
      const functionUrl = `${supabaseUrl}/functions/v1/public-booking-data?user_id=${userId}`;
      
      console.log('🔍 Appel API:', functionUrl);
      
      const response = await fetch(functionUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });

      console.log('📡 Réponse API:', response.status, response.statusText);

      if (!response.ok) {
        console.warn(`⚠️ Erreur HTTP ${response.status} - utilisation des données par défaut`);
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Données reçues:', result);
      console.log('🚫 Plages bloquées reçues:', result.blockedDateRanges);
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la récupération des données');
      }

      let filteredServices = result.services || [];
      
      filteredServices = filteredServices.filter(service => 
        service.description !== 'Service personnalisé'
      );
      
      if (allowedServices.length > 0) {
        filteredServices = filteredServices.filter(service => 
          allowedServices.includes(service.id)
        );
      } else if (result.settings?.iframe_services && result.settings.iframe_services.length > 0) {
        filteredServices = filteredServices.filter(service => 
          result.settings.iframe_services.includes(service.id)
        );
      }
      
      setData({
        ...result,
        services: filteredServices,
        unavailabilities: result.unavailabilities || [],
        teamMembers: result.teamMembers || [],
        blockedDateRanges: result.blockedDateRanges || []
      });
    } catch (err) {
      console.error('❌ Erreur chargement données publiques:', err);
      setError('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicData();
  }, [userId]);

  useEffect(() => {
    if (data?.settings && !selectedDate) {
      const { date } = getNextAvailableDateTime(data.settings);
      setSelectedDate(date);
    }
  }, [data?.settings, selectedDate]);

  // 🚫 Vérifier si une date est bloquée - CORRECTION FORMAT
  const isDateBlocked = (date: string): boolean => {
    if (!data?.blockedDateRanges || data.blockedDateRanges.length === 0) {
      console.log('🚫 Aucune plage bloquée définie');
      return false;
    }

    // Normaliser la date au format YYYY-MM-DD
    const checkDate = new Date(date + 'T00:00:00');
    const checkDateStr = checkDate.toISOString().split('T')[0];
    
    console.log('🔍 Vérification date:', checkDateStr);
    
    const isBlocked = data.blockedDateRanges.some(range => {
      const startDate = new Date(range.start_date + 'T00:00:00');
      const endDate = new Date(range.end_date + 'T00:00:00');
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const blocked = checkDateStr >= startDateStr && checkDateStr <= endDateStr;
      
      if (blocked) {
        console.log('🚫 Date BLOQUÉE:', checkDateStr, 'dans plage:', startDateStr, '-', endDateStr);
      }
      
      return blocked;
    });
    
    console.log('🚫 Résultat isDateBlocked:', isBlocked);
    return isBlocked;
  };

  const isTimeBlockedByUnavailability = (date: string, time: string, durationMinutes: number): boolean => {
    if (!data?.unavailabilities || data.unavailabilities.length === 0) {
      return false;
    }

    const [startHour, startMinute] = time.split(':').map(Number);
    const slotStartMinutes = startHour * 60 + startMinute;
    const slotEndMinutes = slotStartMinutes + durationMinutes;

    const relevantUnavailabilities = selectedTeamMember
      ? data.unavailabilities.filter(u => 
          u.date === date && 
          (!u.assigned_user_id || u.assigned_user_id === selectedTeamMember)
        )
      : data.unavailabilities.filter(u => u.date === date);

    for (const unavailability of relevantUnavailabilities) {
      const [unavailStartHour, unavailStartMinute] = unavailability.start_time.split(':').map(Number);
      const [unavailEndHour, unavailEndMinute] = unavailability.end_time.split(':').map(Number);
      
      const unavailStartMinutes = unavailStartHour * 60 + unavailStartMinute;
      const unavailEndMinutes = unavailEndHour * 60 + unavailEndMinute;

      const hasOverlap = (slotStartMinutes < unavailEndMinutes && slotEndMinutes > unavailStartMinutes);
      
      if (hasOverlap) {
        return true;
      }
    }

    return false;
  };

  const generateTimeSlots = (date: string): TimeSlot[] => {
    if (!data?.settings || !date) {
      return [];
    }

    // 🚫 VÉRIFICATION CRITIQUE - Si la date est bloquée, retourner aucun créneau
    if (isDateBlocked(date)) {
      console.log('🚫 Date bloquée - Aucun créneau généré pour:', date);
      return [];
    }
    
    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const daySettings = data.settings.opening_hours[dayName];
    
    if (!daySettings || daySettings.closed) {
      return [];
    }
    
    const slots: TimeSlot[] = [];
    const ranges = daySettings.ranges || [];
    
    ranges.forEach(range => {
      if (!range.start || !range.end) return;
      
      const [startHour, startMinute] = range.start.split(':').map(Number);
      const [endHour, endMinute] = range.end.split(':').map(Number);
      
      let currentHour = startHour;
      let currentMinute = startMinute;
      
      while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        const time = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        
        const isAvailable = isTimeSlotAvailable(time, selectedService);
        
        slots.push({ time, available: isAvailable });
        
        currentMinute += 30;
        if (currentMinute >= 60) {
          currentMinute = 0;
          currentHour++;
        }
      }
    });
    
    return slots.sort((a, b) => a.time.localeCompare(b.time));
  };

  const isTimeSlotAvailable = (time: string, service: Service | null): boolean => {
    if (!service || !selectedDate) return false;

    // 🚫 VÉRIFICATION CRITIQUE - Vérifier si la date est bloquée
    if (isDateBlocked(selectedDate)) {
      console.log('🚫 Créneau refusé - Date bloquée:', selectedDate);
      return false;
    }
    
    const validation = validateBookingDateTime(selectedDate, time, data?.settings, true);
    if (!validation.isValid) {
      return false;
    }
    
    if (isTimeBlockedByUnavailability(selectedDate, time, service.duration_minutes)) {
      return false;
    }
    
    const [startHour, startMinute] = time.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = startTime + service.duration_minutes;
    
    let dayBookings = data?.bookings?.filter(booking => booking.date === selectedDate) || [];
    if (selectedTeamMember) {
      dayBookings = dayBookings.filter(booking => 
        !booking.assigned_user_id || booking.assigned_user_id === selectedTeamMember
      );
    }
    
    for (const booking of dayBookings) {
      const [bookingHour, bookingMinute] = booking.time.split(':').map(Number);
      const bookingStartTime = bookingHour * 60 + bookingMinute;
      const bookingEndTime = bookingStartTime + booking.duration_minutes;
      
      const hasOverlap = (startTime < bookingEndTime && endTime > bookingStartTime);
      
      if (hasOverlap) {
        if (booking.service_id === service.id) {
          const existingParticipants = dayBookings
            .filter(b => 
              b.service_id === service.id && 
              b.time === booking.time && 
              b.booking_status !== 'cancelled'
            )
            .reduce((sum, b) => sum + (b.quantity || 1), 0);
          
          if (existingParticipants >= service.capacity) {
            return false;
          }
        } else {
          return false;
        }
      }
    }
    
    return true;
  };

  const handleServiceSelect = (service: Service) => {
    console.log('🎯 Service sélectionné:', service.name);
    setSelectedService(service);
    setSelectedTime('');
    setCurrentStep(2);
  };

  const handleDateTimeSelect = (date: string, time: string) => {
    console.log('📅 Date/heure sélectionnée:', date, time);
    setSelectedDate(date);
    setSelectedTime(time);
    setCurrentStep(3);
  };

  const handlePayment = async () => {
    if (!selectedService || !data?.settings) return;

    setProcessingPayment(true);

    try {
      const totalAmount = selectedService.price_ttc * quantity;
      const depositPercentage = data.settings.default_deposit_percentage || 30;
      
      let depositAmount: number;
      
      if (data.settings.deposit_type === 'fixed_amount') {
        const baseDeposit = data.settings.deposit_fixed_amount || 20;
        depositAmount = data.settings.multiply_deposit_by_services 
          ? baseDeposit * quantity 
          : baseDeposit;
      } else {
        depositAmount = data.settings.multiply_deposit_by_services 
          ? (selectedService.price_ttc * depositPercentage / 100) * quantity
          : (totalAmount * depositPercentage) / 100;
      }

      console.log('💳 Création session Stripe:', {
        amount: depositAmount,
        service: selectedService.name,
        client: clientData.email,
        parentOrigin
      });

      const baseUrl = parentOrigin || window.location.origin;
      const successUrl = `${baseUrl}${window.location.pathname}?payment=success&session_id={CHECKOUT_SESSION_ID}&origin=${encodeURIComponent(baseUrl)}`;
      const cancelUrl = `${baseUrl}${window.location.pathname}?payment=cancelled&origin=${encodeURIComponent(baseUrl)}`;

      console.log('🔗 URLs de redirection:', { success: successUrl, cancel: cancelUrl });

      // 🔥 MÉTADONNÉES COMPLÈTES AVEC CHAMPS SÉPARÉS
      const metadata = {
        user_id: userId,
        service_id: selectedService.id,
        date: selectedDate,
        time: selectedTime,
        quantity: quantity.toString(),
        client_firstname: clientData.firstname, // ✅ SÉPARÉ
        client_lastname: clientData.lastname,   // ✅ SÉPARÉ
        client_email: clientData.email,
        client_phone: clientData.phone || '',
        payment_type: 'booking_deposit',
        return_origin: baseUrl
      };

      // Ajouter assigned_user_id seulement s'il existe
      if (selectedTeamMember) {
        metadata['assigned_user_id'] = selectedTeamMember;
      }

      console.log('📦 Métadonnées complètes:', metadata);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
      const response = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          amount: depositAmount,
          currency: 'eur',
          customer_email: clientData.email,
          service_name: selectedService.name,
          success_url: successUrl,
          cancel_url: cancelUrl,
          parent_url: baseUrl,
          metadata: metadata
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erreur API:', errorData);
        throw new Error(errorData.error || 'Erreur lors de la création de la session de paiement');
      }

      const { url, sessionId } = await response.json();
      
      if (url && sessionId) {
        console.log('🚀 Ouverture Stripe dans nouvel onglet:', url);
        setStripeSessionId(sessionId);
        
        const paymentWindow = window.open(url, '_blank');
        
        if (!paymentWindow) {
          alert('⚠️ Veuillez autoriser les popups pour effectuer le paiement');
          setProcessingPayment(false);
          return;
        }
        
        setWaitingForPayment(true);
        setProcessingPayment(false);
      } else {
        throw new Error('URL ou Session ID manquant');
      }
    } catch (err) {
      console.error('❌ Erreur paiement:', err);
      alert('Erreur lors de la création du paiement. Veuillez réessayer.');
      setProcessingPayment(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !clientData.email) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (data?.settings?.stripe_enabled) {
      await handlePayment();
      return;
    }

    setSubmitting(true);
    
    try {
      const totalAmount = selectedService.price_ttc * quantity;
      
      if (isSupabaseConfigured) {
        const bookingData: any = {
          user_id: userId,
          service_id: selectedService.id,
          date: selectedDate,
          time: selectedTime,
          duration_minutes: selectedService.duration_minutes,
          quantity,
          client_name: clientData.lastname,
          client_firstname: clientData.firstname,
          client_email: clientData.email,
          client_phone: clientData.phone,
          total_amount: totalAmount,
          payment_status: 'pending',
          payment_amount: 0,
          booking_status: 'pending'
        };

        if (selectedTeamMember) {
          bookingData.assigned_user_id = selectedTeamMember;
        }

        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .insert(bookingData)
          .select()
          .single();

        if (bookingError) {
          throw bookingError;
        }

        console.log('✅ Réservation créée:', booking.id);
        setConfirmedBooking(booking);
        setCurrentStep(5);
      } else {
        console.log('🎭 Mode démo - simulation réservation');
        await new Promise(resolve => setTimeout(resolve, 1000));
        setCurrentStep(5);
      }
    } catch (err) {
      console.error('Erreur création réservation:', err);
      alert(`Erreur lors de la création de la réservation: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getAvailableDates = () => {
    if (!data?.settings) {
      return [];
    }
    
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 90; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dateString = date.toISOString().split('T')[0];

      // 🚫 VÉRIFICATION CRITIQUE - Exclure les dates bloquées
      if (isDateBlocked(dateString)) {
        console.log('🚫 Date bloquée exclue du calendrier:', dateString);
        continue;
      }

      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const daySettings = data.settings.opening_hours[dayName];
      
      if (daySettings && !daySettings.closed) {
        const validation = validateBookingDateTime(dateString, '09:00', data.settings, true);
        if (validation.isValid) {
          dates.push({
            date: dateString,
            label: date.toLocaleDateString('fr-FR', { 
              weekday: 'short', 
              day: 'numeric', 
              month: 'short' 
            }),
            isToday: i === 0
          });
        }
      }
    }
    
    return dates;
  };

  const getMemberDisplayName = (member: TeamMember) => {
    if (member.firstname && member.lastname) {
      return `${member.firstname} ${member.lastname}`;
    }
    if (member.full_name) {
      return member.full_name;
    }
    if (member.firstname) {
      return member.firstname;
    }
    return member.email || 'Membre';
  };

  const timeSlots = selectedDate && selectedService ? generateTimeSlots(selectedDate) : [];
  const availableDates = getAvailableDates();
  const showTeamSelection = data?.settings?.iframe_enable_team_selection && data?.teamMembers && data.teamMembers.length > 0;

  const calculateDepositAmount = () => {
    if (!selectedService || !data?.settings) return 0;
    
    const totalAmount = selectedService.price_ttc * quantity;
    const depositPercentage = data.settings.default_deposit_percentage || 30;
    
    if (data.settings.deposit_type === 'fixed_amount') {
      const baseDeposit = data.settings.deposit_fixed_amount || 20;
      return data.settings.multiply_deposit_by_services 
        ? baseDeposit * quantity 
        : baseDeposit;
    } else {
      return data.settings.multiply_deposit_by_services 
        ? (selectedService.price_ttc * depositPercentage / 100) * quantity
        : (totalAmount * depositPercentage) / 100;
    }
  };

  const depositAmount = calculateDepositAmount();
  const isStripeEnabled = data?.settings?.stripe_enabled;

  // 🔥 FIX CRITIQUE - Calculer le montant payé et le solde restant
  const getPaidAmount = () => {
    if (!confirmedBooking) {
      console.log('⚠️ getPaidAmount: confirmedBooking est null');
      return 0;
    }
    
    console.log('💰 getPaidAmount - confirmedBooking:', {
      deposit_amount: confirmedBooking.deposit_amount,
      payment_amount: confirmedBooking.payment_amount,
      total_amount: confirmedBooking.total_amount
    });
    
    // 🎯 CORRECTION: Lire deposit_amount au lieu de payment_amount
    const amount = confirmedBooking.deposit_amount || 0;
    console.log('💰 getPaidAmount retourne:', amount);
    return amount;
  };

  const getRemainingBalance = () => {
    if (!confirmedBooking || !selectedService) {
      console.log('⚠️ getRemainingBalance: confirmedBooking ou selectedService manquant');
      return 0;
    }
    
    const totalAmount = selectedService.price_ttc * quantity;
    const paidAmount = getPaidAmount();
    const remaining = totalAmount - paidAmount;
    
    console.log('💰 getRemainingBalance:', {
      totalAmount,
      paidAmount,
      remaining
    });
    
    return remaining;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="w-16 h-16 border-4 border-purple-200 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-purple-600 rounded-full animate-spin border-t-transparent"></div>
          </div>
          <p className="text-gray-600 text-lg">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl max-w-md border border-gray-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Service indisponible</h2>
          <p className="text-gray-600">{error || 'Impossible de charger les données'}</p>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 1, title: 'Service', icon: Package, description: 'Choisissez votre service' },
    { id: 2, title: 'Date & Heure', icon: Calendar, description: 'Sélectionnez un créneau' },
    { id: 3, title: 'Informations', icon: User, description: 'Vos coordonnées' },
    { id: 4, title: 'Confirmation', icon: Check, description: 'Récapitulatif' }
  ];

  if (waitingForPayment) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="w-24 h-24 border-4 border-blue-200 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-24 h-24 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
            <CreditCard className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-blue-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Paiement en cours...
          </h2>
          
          <p className="text-gray-600 mb-6">
            Veuillez compléter le paiement dans l'onglet Stripe qui vient de s'ouvrir.
          </p>
          
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200 mb-6">
            <p className="text-sm text-blue-700">
              💡 <strong>Astuce :</strong> Une fois le paiement effectué, cette page se mettra à jour automatiquement.
            </p>
          </div>
          
          <p className="text-sm text-gray-500">
            Vérification automatique en cours...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            {steps.map((step) => (
              <div key={step.id} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                currentStep >= step.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                  : currentStep === step.id
                  ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-500'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
              </div>
            ))}
          </div>
        </div>

        {currentStep === 1 && (
          <div className="space-y-6 sm:space-y-8">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Choisissez votre service
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Sélectionnez le service qui vous intéresse
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {data.services.map((service, index) => (
                <div
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className="group bg-white rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:scale-[1.02] overflow-hidden animate-fadeIn border border-gray-100"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden">
                    {service.image_url ? (
                      <img
                        src={service.image_url}
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center" style={{ display: service.image_url ? 'none' : 'flex' }}>
                      <Package className="w-16 h-16 text-white" />
                    </div>
                    
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-xl font-bold text-sm sm:text-base shadow-lg">
                      {service.price_ttc.toFixed(2)}€
                    </div>
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="absolute bottom-4 left-4 right-4 transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button className="w-full bg-white text-gray-900 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg">
                        <Sparkles className="w-5 h-5" />
                        Sélectionner
                      </button>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base mb-4 line-clamp-2">
                      {service.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Timer className="w-4 h-4" />
                          <span>{service.duration_minutes}min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>Max {service.capacity} {service.unit_name || 'pers.'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-green-600 font-medium">
                        <Euro className="w-4 h-4" />
                        <span>{service.price_ttc.toFixed(2)}€</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {data.services.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Aucun service disponible</h3>
                <p className="text-gray-500">Aucun service n'est actuellement proposé</p>
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && selectedService && (
          <div className="space-y-6 sm:space-y-8">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Choisissez votre créneau
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Sélectionnez une date et une heure pour {selectedService.name}
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-4 sm:p-6 border-2 border-blue-200">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{selectedService.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span className="flex items-center gap-1">
                      <Timer className="w-4 h-4" />
                      {selectedService.duration_minutes}min
                    </span>
                    <span className="flex items-center gap-1">
                      <Euro className="w-4 h-4" />
                      {selectedService.price_ttc.toFixed(2)}€
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 bg-white rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Changer
                </button>
              </div>
            </div>

            {showTeamSelection && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-purple-800">Choisissez votre praticien</h3>
                    <p className="text-purple-600">Sélectionnez le membre de l'équipe de votre choix</p>
                  </div>
                </div>

                <select
                  value={selectedTeamMember}
                  onChange={(e) => {
                    setSelectedTeamMember(e.target.value);
                    setSelectedTime('');
                  }}
                  className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white"
                >
                  <option value="">Aucune préférence</option>
                  {data.teamMembers.map(member => (
                    <option key={member.user_id} value={member.user_id}>
                      {getMemberDisplayName(member)}
                    </option>
                  ))}
                </select>

                {selectedTeamMember && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-purple-700 bg-purple-100 px-4 py-2 rounded-lg">
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      Réservation avec <strong>{getMemberDisplayName(data.teamMembers.find(m => m.user_id === selectedTeamMember)!)}</strong>
                    </span>
                  </div>
                )}
              </div>
            )}

            <DatePicker
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              availableDates={availableDates}
              settings={data.settings}
            />

            {selectedDate && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">Horaires disponibles</h3>
                
                {timeSlots.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-3xl">
                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Aucun créneau disponible</h3>
                    <p className="text-gray-500">
                      {isDateBlocked(selectedDate) 
                        ? 'Cette date est bloquée. Veuillez sélectionner une autre date.'
                        : 'Veuillez sélectionner une autre date'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => slot.available && handleDateTimeSelect(selectedDate, slot.time)}
                        disabled={!slot.available}
                        className={`p-4 rounded-2xl text-center font-medium transition-all duration-300 ${
                          selectedTime === slot.time
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-xl scale-105'
                            : slot.available
                            ? 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-2 border-gray-200 hover:border-blue-300'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Clock className="w-5 h-5 mx-auto mb-2" />
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 bg-gray-100 text-gray-700 py-4 px-6 rounded-2xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Retour
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 sm:space-y-8">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Vos informations
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Complétez vos coordonnées pour finaliser la réservation
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={clientData.firstname}
                    onChange={(e) => setClientData({ ...clientData, firstname: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="Votre prénom"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={clientData.lastname}
                    onChange={(e) => setClientData({ ...clientData, lastname: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="Votre nom"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={clientData.email}
                  onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="votre@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={clientData.phone}
                  onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de {selectedService?.unit_name || 'participants'}
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedService?.capacity || 1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(parseInt(e.target.value) || 1, selectedService?.capacity || 1))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex-1 bg-gray-100 text-gray-700 py-4 px-6 rounded-2xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Retour
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                disabled={!clientData.firstname || !clientData.lastname || !clientData.email}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 px-6 rounded-2xl font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continuer
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 4 && selectedService && (
          <div className="space-y-6 sm:space-y-8">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Récapitulatif
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Vérifiez les informations avant de confirmer
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-2xl">
                  <Package className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">Service</h3>
                    <p className="text-gray-600">{selectedService.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{selectedService.duration_minutes} minutes</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{selectedService.price_ttc.toFixed(2)}€</p>
                    <p className="text-sm text-gray-500">x {quantity}</p>
                  </div>
                </div>

                {selectedTeamMember && (
                  <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-2xl">
                    <UserCheck className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">Praticien</h3>
                      <p className="text-gray-600">
                        {getMemberDisplayName(data.teamMembers.find(m => m.user_id === selectedTeamMember)!)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-2xl">
                  <Calendar className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">Date et heure</h3>
                    <p className="text-gray-600">
                      {new Date(selectedDate).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-gray-600 mt-1">{selectedTime}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-green-50 rounded-2xl">
                  <User className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">Vos informations</h3>
                    <p className="text-gray-600">{clientData.firstname} {clientData.lastname}</p>
                    <p className="text-gray-600">{clientData.email}</p>
                    {clientData.phone && <p className="text-gray-600">{clientData.phone}</p>}
                  </div>
                </div>
              </div>

              <div className="border-t-2 border-gray-200 pt-6 space-y-3">
                <div className="flex justify-between items-center text-lg">
                  <span className="text-gray-700">Total</span>
                  <span className="font-bold text-gray-900">{(selectedService.price_ttc * quantity).toFixed(2)}€</span>
                </div>
                
                {isStripeEnabled && (
                  <div className="flex justify-between items-center text-lg">
                    <span className="text-gray-700">Acompte à payer</span>
                    <span className="font-bold text-blue-600">{depositAmount.toFixed(2)}€</span>
                  </div>
                )}
              </div>

              {isStripeEnabled && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-blue-900">Paiement sécurisé</h4>
                  </div>
                  <p className="text-sm text-blue-700">
                    Un acompte de {depositAmount.toFixed(2)}€ sera demandé pour confirmer votre réservation. 
                    Le solde de {((selectedService.price_ttc * quantity) - depositAmount).toFixed(2)}€ sera à régler sur place.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(3)}
                className="flex-1 bg-gray-100 text-gray-700 py-4 px-6 rounded-2xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Retour
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || processingPayment}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 px-6 rounded-2xl font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processingPayment ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Ouverture paiement...
                  </>
                ) : submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Confirmation...
                  </>
                ) : (
                  <>
                    {isStripeEnabled ? (
                      <>
                        <ExternalLink className="w-5 h-5" />
                        Payer l'acompte
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Confirmer la réservation
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                Réservation confirmée !
              </h2>
              <p className="text-gray-600 text-lg">
                Votre rendez-vous a été enregistré avec succès
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Package className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-1">{selectedService?.name}</h3>
                    <p className="text-white/90">{selectedService?.duration_minutes} minutes</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{selectedService?.price_ttc.toFixed(2)}€</div>
                    {quantity > 1 && <div className="text-white/90">x {quantity}</div>}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1">Date et heure</h4>
                    <p className="text-gray-700 font-medium">
                      {new Date(selectedDate).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className="text-purple-700 font-bold">{selectedTime}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-2">Vos coordonnées</h4>
                    <div className="space-y-1">
                      <p className="text-gray-700 font-medium">
                        {clientData.firstname} {clientData.lastname}
                      </p>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{clientData.email}</span>
                      </div>
                      {clientData.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{clientData.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedTeamMember && data?.teamMembers && (
                  <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <UserCheck className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-1">Praticien</h4>
                      <p className="text-gray-700 font-medium">
                        {getMemberDisplayName(data.teamMembers.find(m => m.user_id === selectedTeamMember)!)}
                      </p>
                    </div>
                  </div>
                )}

                {isStripeEnabled && (
                  <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2">Paiement</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Acompte payé</span>
                          <span className="font-bold text-green-600">{getPaidAmount().toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Solde à régler sur place</span>
                          <span className="font-bold text-gray-900">
                            {getRemainingBalance().toFixed(2)}€
                          </span>
                        </div>
                        <div className="pt-2 mt-2 border-t border-green-200">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-900">Total</span>
                            <span className="font-bold text-gray-900 text-lg">
                              {((selectedService?.price_ttc || 0) * quantity).toFixed(2)}€
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6 border border-blue-200">
              <div className="flex items-start gap-3">
                <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-blue-900 mb-2">Email de confirmation envoyé</h4>
                  <p className="text-blue-700 text-sm">
                    Un email de confirmation a été envoyé à <strong>{clientData.email}</strong> avec tous les détails de votre réservation.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => {
                  setCurrentStep(1);
                  setSelectedService(null);
                  setSelectedDate('');
                  setSelectedTime('');
                  setSelectedTeamMember('');
                  setQuantity(1);
                  setClientData({ firstname: '', lastname: '', email: '', phone: '' });
                  setConfirmedBooking(null);
                  window.history.replaceState({}, '', window.location.pathname);
                }}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 px-6 rounded-2xl font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Nouvelle réservation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
