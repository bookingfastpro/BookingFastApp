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
    console.log('🔔 Demande de services publics reçue')
    
    // Créer le client Supabase avec la clé service role pour contourner RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Récupérer l'userId depuis l'URL
    const url = new URL(req.url)
    const userId = url.searchParams.get('user_id')

    if (!userId) {
      console.error('❌ user_id manquant')
      return new Response(
        JSON.stringify({ error: 'user_id parameter required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('🔍 Récupération services pour userId:', userId)

    // Vérifier d'abord que l'utilisateur existe
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id, email, full_name')
      .eq('id', userId)
      .maybeSingle()

    if (userError) {
      console.error('❌ Erreur vérification utilisateur:', userError)
      return new Response(
        JSON.stringify({ error: 'User verification failed', details: userError.message }),
        { status: 404, headers: corsHeaders }
      )
    }

    if (!userData) {
      console.error('❌ Utilisateur non trouvé:', userId)
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: corsHeaders }
      )
    }

    console.log('✅ Utilisateur trouvé:', userData.email)

    // Récupérer les services avec les privilèges service role (contourne RLS)
    const { data: servicesData, error: servicesError } = await supabaseClient
      .from('services')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (servicesError) {
      console.error('❌ Erreur chargement services:', servicesError)
      return new Response(
        JSON.stringify({ error: 'Failed to load services', details: servicesError.message }),
        { status: 500, headers: corsHeaders }
      )
    }

    console.log('✅ Services récupérés:', servicesData?.length || 0)

    // Récupérer les paramètres business
    const { data: settingsData, error: settingsError } = await supabaseClient
      .from('business_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (settingsError) {
      console.warn('⚠️ Erreur chargement paramètres:', settingsError)
    }

    console.log('✅ Paramètres récupérés:', !!settingsData)

    // Récupérer les réservations existantes
    const { data: bookingsData, error: bookingsError } = await supabaseClient
      .from('bookings')
      .select('date, time, duration_minutes, service_id, booking_status')
      .eq('user_id', userId)
      .in('booking_status', ['pending', 'confirmed'])

    if (bookingsError) {
      console.warn('⚠️ Erreur chargement réservations:', bookingsError)
    }

    console.log('✅ Réservations récupérées:', bookingsData?.length || 0)

    return new Response(
      JSON.stringify({ 
        success: true,
        user: userData,
        services: servicesData || [],
        settings: settingsData,
        bookings: bookingsData || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erreur fonction publique services:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Unexpected error during public services fetch'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
