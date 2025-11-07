import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[INFO] Demande de données publiques de réservation reçue')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        }
      }
    )

    const url = new URL(req.url)
    const userId = url.searchParams.get('user_id')

    if (!userId) {
      console.error('[ERROR] user_id manquant')
      return new Response(
        JSON.stringify({ error: 'user_id parameter required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[DEBUG] Récupération données pour userId:', userId)

    const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(userId)

    if (userError || !userData.user) {
      console.error('[ERROR] Utilisateur non trouvé:', userId, userError)
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[SUCCESS] Utilisateur trouvé:', userData.user.email)

    const { data: servicesData, error: servicesError } = await supabaseClient
      .from('services')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (servicesError) {
      console.error('[ERROR] Erreur chargement services:', servicesError)
      return new Response(
        JSON.stringify({ error: 'Failed to load services', details: servicesError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[SUCCESS] Services récupérés:', servicesData?.length || 0)

    const { data: settingsData, error: settingsError } = await supabaseClient
      .from('business_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (settingsError) {
      console.warn('[WARN] Erreur chargement paramètres:', settingsError)
    }

    console.log('[SUCCESS] Paramètres récupérés:', !!settingsData)

    const { data: bookingsData, error: bookingsError } = await supabaseClient
      .from('bookings')
      .select('date, time, duration_minutes, service_id, booking_status, quantity, assigned_user_id')
      .eq('user_id', userId)
      .in('booking_status', ['pending', 'confirmed'])

    if (bookingsError) {
      console.warn('[WARN] Erreur chargement réservations:', bookingsError)
    }

    console.log('[SUCCESS] Réservations récupérées:', bookingsData?.length || 0)

    console.log('[DEBUG] Tentative de récupération des indisponibilités pour userId:', userId)
    
    const { data: unavailabilitiesData, error: unavailabilitiesError } = await supabaseClient
      .from('unavailabilities')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (unavailabilitiesError) {
      console.error('[ERROR] ERREUR chargement indisponibilités:', unavailabilitiesError)
    } else {
      console.log('[SUCCESS] Indisponibilités récupérées:', unavailabilitiesData?.length || 0)
    }

    console.log('[DEBUG] Tentative de récupération des membres d\'équipe pour userId:', userId)
    
    const { data: teamMembersData, error: teamMembersError } = await supabaseClient
      .from('team_members')
      .select('user_id, email, firstname, lastname, full_name, role_name')
      .eq('owner_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (teamMembersError) {
      console.error('[ERROR] ERREUR chargement membres d\'équipe:', teamMembersError)
    } else {
      console.log('[SUCCESS] Membres d\'équipe récupérés:', teamMembersData?.length || 0)
      if (teamMembersData && teamMembersData.length > 0) {
        console.log('[DEBUG] Liste des membres:', teamMembersData.map(m => ({
          id: m.user_id,
          name: m.full_name || `${m.firstname} ${m.lastname}` || m.email
        })))
      }
    }

    console.log('[BLOCKED_DATES] DEBUT récupération plages bloquées pour userId:', userId)
    
    // CRITICAL: Utiliser .rpc() pour bypasser RLS avec SERVICE_ROLE
    const { data: blockedDateRangesData, error: blockedDateRangesError } = await supabaseClient
      .rpc('get_blocked_date_ranges', { p_user_id: userId })

    if (blockedDateRangesError) {
      console.error('[BLOCKED_DATES] ERREUR chargement plages bloquées:', blockedDateRangesError)
      console.error('[BLOCKED_DATES] Détails erreur:', JSON.stringify(blockedDateRangesError, null, 2))
    } else {
      console.log('[BLOCKED_DATES] Plages bloquées récupérées:', blockedDateRangesData?.length || 0)
      if (blockedDateRangesData && blockedDateRangesData.length > 0) {
        console.log('[BLOCKED_DATES] Liste des plages bloquées:', blockedDateRangesData.map(r => ({
          id: r.id,
          start: r.start_date,
          end: r.end_date,
          reason: r.reason
        })))
      } else {
        console.warn('[BLOCKED_DATES] Aucune plage bloquée trouvée pour userId:', userId)
      }
    }

    const responseData = { 
      success: true,
      user: {
        id: userData.user.id,
        email: userData.user.email,
        full_name: userData.user.user_metadata?.full_name || userData.user.email
      },
      services: servicesData || [],
      settings: settingsData,
      bookings: bookingsData || [],
      unavailabilities: unavailabilitiesData || [],
      teamMembers: teamMembersData || [],
      blockedDateRanges: blockedDateRangesData || []
    }

    console.log('[BLOCKED_DATES] Réponse finale - blockedDateRanges:', responseData.blockedDateRanges?.length || 0)
    if (responseData.blockedDateRanges && responseData.blockedDateRanges.length > 0) {
      console.log('[BLOCKED_DATES] Contenu blockedDateRanges:', JSON.stringify(responseData.blockedDateRanges, null, 2))
    }

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[ERROR] Erreur fonction publique données réservation:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Unexpected error during public booking data fetch'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
