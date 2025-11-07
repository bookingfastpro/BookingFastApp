import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { subscription_id } = await req.json()

    if (!subscription_id) {
      return new Response(
        JSON.stringify({ error: 'subscription_id requis' }),
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('🔄 Annulation abonnement:', subscription_id)

    // Initialiser Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 🔑 RÉCUPÉRER LA CLÉ STRIPE DEPUIS LA BASE DE DONNÉES
    console.log('🔍 Récupération clé Stripe depuis platform_settings...')
    
    const { data: settings, error: settingsError } = await supabaseClient
      .from('platform_settings')
      .select('stripe_secret_key')
      .eq('id', 1)
      .single()

    if (settingsError || !settings?.stripe_secret_key) {
      console.error('❌ Erreur récupération clé Stripe:', settingsError)
      throw new Error('Configuration Stripe manquante. Veuillez configurer la clé API dans platform_settings.')
    }

    const STRIPE_KEY = settings.stripe_secret_key
    console.log('✅ Clé Stripe récupérée depuis la base de données')
    console.log('🔑 Clé commence par:', STRIPE_KEY.substring(0, 15) + '...')

    // Initialiser Stripe avec la clé de la base de données
    const stripe = new Stripe(STRIPE_KEY, {
      apiVersion: '2024-12-18.acacia',
      appInfo: {
        name: 'BookingFast',
        version: '1.0.0',
      },
    })

    console.log('✅ Stripe initialisé')

    // Annuler l'abonnement à la fin de la période
    const subscription = await stripe.subscriptions.update(subscription_id, {
      cancel_at_period_end: true
    })

    console.log('✅ Abonnement programmé pour annulation:', subscription.id)
    console.log('📅 Annulation effective le:', new Date(subscription.cancel_at! * 1000).toISOString())
    console.log('📅 Fin période actuelle:', new Date(subscription.current_period_end * 1000).toISOString())

    // Mettre à jour la base de données
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString()
    
    const { error: updateError } = await supabaseClient
      .from('users')
      .update({
        cancel_at_period_end: true,
        current_period_end: currentPeriodEnd,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription_id)

    if (updateError) {
      console.error('❌ Erreur mise à jour base:', updateError)
    } else {
      console.log('✅ Base de données mise à jour avec annulation programmée')
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        cancel_at: subscription.cancel_at,
        current_period_end: subscription.current_period_end,
        current_period_end_iso: currentPeriodEnd,
        message: 'Abonnement programmé pour annulation à la fin de la période. Vous conservez l\'accès jusqu\'au ' + new Date(subscription.current_period_end * 1000).toLocaleDateString('fr-FR')
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erreur annulation:', error)
    
    // Message d'erreur plus explicite
    let errorMessage = error.message || 'Erreur lors de l\'annulation'
    
    if (error.type === 'StripeAuthenticationError') {
      errorMessage = '🔑 Clé API Stripe invalide ou expirée. Veuillez mettre à jour la clé dans platform_settings.'
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        type: error.type,
        code: error.code
      }),
      { status: 500, headers: corsHeaders }
    )
  }
})
