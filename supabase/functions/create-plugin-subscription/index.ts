import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔄 Début création abonnement plugin...');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      );
    }

    const { plugin_id, user_id, subscription_id } = await req.json();

    if (!plugin_id || !user_id || !subscription_id) {
      console.error('❌ Paramètres manquants:', { plugin_id, user_id, subscription_id });
      return new Response(
        JSON.stringify({ error: 'Paramètres requis manquants: plugin_id, user_id, subscription_id' }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('📊 Données reçues:', { plugin_id, user_id, subscription_id });

    // ÉTAPE 1: Récupérer les informations du plugin
    const { data: plugin, error: pluginError } = await supabaseClient
      .from('plugins')
      .select('*')
      .eq('id', plugin_id)
      .single();

    if (pluginError || !plugin) {
      console.error('❌ Plugin non trouvé:', pluginError);
      return new Response(
        JSON.stringify({ error: 'Plugin non trouvé' }),
        { status: 404, headers: corsHeaders }
      );
    }

    console.log('✅ Plugin trouvé:', plugin.name, plugin.base_price);

    // ÉTAPE 2: Récupérer les informations utilisateur
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('email, full_name')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      console.error('❌ Utilisateur non trouvé:', userError);
      return new Response(
        JSON.stringify({ error: 'Utilisateur non trouvé' }),
        { status: 404, headers: corsHeaders }
      );
    }

    console.log('✅ Utilisateur trouvé:', user.email);

    // ÉTAPE 3: Récupérer la configuration Stripe de l'utilisateur
    const { data: settings, error: settingsError } = await supabaseClient
      .from('business_settings')
      .select('stripe_enabled, stripe_secret_key')
      .eq('user_id', user_id)
      .single();

    if (settingsError || !settings) {
      console.error('❌ Configuration non trouvée:', settingsError);
      return new Response(
        JSON.stringify({ error: 'Configuration Stripe non trouvée' }),
        { status: 404, headers: corsHeaders }
      );
    }

    if (!settings.stripe_enabled || !settings.stripe_secret_key) {
      console.error('❌ Stripe non configuré');
      return new Response(
        JSON.stringify({ error: 'Stripe non activé ou clé secrète manquante' }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('✅ Configuration Stripe récupérée');

    // ÉTAPE 4: Initialiser Stripe
    const stripe = new Stripe(settings.stripe_secret_key, {
      appInfo: {
        name: 'BookingFast',
        version: '1.0.0',
      },
    });

    console.log('✅ Stripe initialisé');

    // ÉTAPE 5: Créer ou récupérer le client Stripe
    let customerId;
    
    try {
      const existingCustomers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });
      
      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
        console.log('✅ Client Stripe existant:', customerId);
      } else {
        const newCustomer = await stripe.customers.create({
          email: user.email,
          name: user.full_name || undefined,
          metadata: {
            user_id: user_id,
            plugin_id: plugin_id,
          },
        });
        customerId = newCustomer.id;
        console.log('✅ Nouveau client Stripe créé:', customerId);
      }
    } catch (customerError) {
      console.error('❌ Erreur gestion client:', customerError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la création du client Stripe' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // ÉTAPE 6: Créer le produit Stripe pour le plugin
    let productId;
    
    try {
      const existingProducts = await stripe.products.search({
        query: `metadata['plugin_id']:'${plugin_id}'`,
        limit: 1,
      });
      
      if (existingProducts.data.length > 0) {
        productId = existingProducts.data[0].id;
        console.log('✅ Produit Stripe existant:', productId);
      } else {
        const newProduct = await stripe.products.create({
          name: `Plugin: ${plugin.name}`,
          description: plugin.description,
          metadata: {
            plugin_id: plugin_id,
            plugin_slug: plugin.slug,
          },
        });
        productId = newProduct.id;
        console.log('✅ Nouveau produit Stripe créé:', productId);
      }
    } catch (productError) {
      console.error('❌ Erreur création produit:', productError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la création du produit Stripe' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // ÉTAPE 7: Créer le prix récurrent
    let priceId;
    
    try {
      const existingPrices = await stripe.prices.list({
        product: productId,
        active: true,
        type: 'recurring',
        limit: 1,
      });
      
      if (existingPrices.data.length > 0) {
        priceId = existingPrices.data[0].id;
        console.log('✅ Prix Stripe existant:', priceId);
      } else {
        const newPrice = await stripe.prices.create({
          product: productId,
          unit_amount: Math.round(plugin.base_price * 100),
          currency: 'eur',
          recurring: {
            interval: 'month',
          },
        });
        priceId = newPrice.id;
        console.log('✅ Nouveau prix Stripe créé:', priceId);
      }
    } catch (priceError) {
      console.error('❌ Erreur création prix:', priceError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la création du prix Stripe' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // ÉTAPE 8: Créer la session de checkout
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.headers.get('origin')}/plugins?success=true&plugin=${plugin.slug}`,
        cancel_url: `${req.headers.get('origin')}/plugins?canceled=true`,
        metadata: {
          user_id: user_id,
          plugin_id: plugin_id,
          subscription_id: subscription_id,
        },
        subscription_data: {
          metadata: {
            user_id: user_id,
            plugin_id: plugin_id,
            subscription_id: subscription_id,
          },
        },
      });

      console.log('✅ Session checkout créée:', session.id);

      // ÉTAPE 9: Mettre à jour la souscription avec l'ID de session
      const { error: updateError } = await supabaseClient
        .from('plugin_subscriptions')
        .update({
          stripe_subscription_id: session.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription_id);

      if (updateError) {
        console.error('⚠️ Erreur mise à jour souscription:', updateError);
      }

      return new Response(
        JSON.stringify({
          sessionId: session.id,
          url: session.url,
          success: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (stripeError) {
      console.error('❌ Erreur création session:', stripeError);
      
      let errorMessage = 'Erreur lors de la création de la session de paiement';
      
      if (stripeError.message.includes('Invalid API Key')) {
        errorMessage = 'Clé API Stripe invalide';
      } else if (stripeError.message.includes('amount')) {
        errorMessage = 'Montant invalide';
      }
      
      return new Response(
        JSON.stringify({
          error: errorMessage,
          details: stripeError.message,
        }),
        { status: 500, headers: corsHeaders }
      );
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    return new Response(
      JSON.stringify({
        error: 'Erreur interne du serveur',
        details: error.message,
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
