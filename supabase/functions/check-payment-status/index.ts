const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔍 [CHECK-PAYMENT] Début requête')
    
    // Parse body
    const body = await req.json()
    console.log('📦 [CHECK-PAYMENT] Body reçu:', body)

    const { sessionId } = body

    if (!sessionId) {
      console.error('❌ [CHECK-PAYMENT] Session ID manquant')
      return new Response(
        JSON.stringify({ error: 'Session ID manquant' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔑 [CHECK-PAYMENT] Session ID:', sessionId)

    // Variables d'environnement
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ [CHECK-PAYMENT] Variables environnement manquantes')
      return new Response(
        JSON.stringify({ error: 'Configuration serveur manquante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Normaliser session ID
    const stripeSessionId = sessionId.includes('cs_') ? sessionId : `cs_${sessionId}`
    console.log('🎯 [CHECK-PAYMENT] Session ID normalisé:', stripeSessionId)

    // 🔥 APPEL REST API DIRECT (sans client Supabase)
    console.log('🔍 [CHECK-PAYMENT] Recherche booking via REST API...')
    
    const apiUrl = `${supabaseUrl}/rest/v1/bookings?stripe_session_id=eq.${stripeSessionId}&select=id,booking_status,payment_status`
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [CHECK-PAYMENT] Erreur API REST:', response.status, errorText)
      return new Response(
        JSON.stringify({ 
          error: 'Erreur base de données', 
          details: errorText 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const bookings = await response.json()
    console.log('📊 [CHECK-PAYMENT] Résultat API:', bookings)

    const existingBooking = bookings && bookings.length > 0 ? bookings[0] : null

    if (existingBooking) {
      console.log('✅ [CHECK-PAYMENT] Réservation trouvée:', existingBooking)
      return new Response(
        JSON.stringify({
          status: 'complete',
          payment_status: 'paid',
          booking_id: existingBooking.id,
          booking: existingBooking
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('⏳ [CHECK-PAYMENT] Réservation pas encore créée')
    return new Response(
      JSON.stringify({
        status: 'pending',
        payment_status: 'pending'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ [CHECK-PAYMENT] Erreur globale:', error)
    console.error('📋 [CHECK-PAYMENT] Stack:', error.stack)
    return new Response(
      JSON.stringify({ 
        error: 'Erreur serveur', 
        message: error.message,
        stack: error.stack 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
