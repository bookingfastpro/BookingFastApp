import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const PLATFORM_STRIPE_SECRET_KEY = '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';

Deno.serve(async (req) => {
  console.log('🚀 === STRIPE-CHECKOUT V24 - COLUMN NAME FIX === 🚀')
  console.log('📍 Request URL:', req.url)
  console.log('📍 Request Method:', req.method)
  
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS request - returning CORS headers')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔧 Step 1: Reading environment variables')
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('🔧 Configuration Supabase:', {
      url: supabaseUrl ? '✅ Défini' : '❌ Manquant',
      serviceKey: supabaseServiceKey ? '✅ Défini' : '❌ Manquant'
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variables d\'environnement Supabase manquantes');
      return new Response(
        JSON.stringify({ 
          error: 'Configuration Supabase manquante',
          details: 'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY non défini'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method !== 'POST') {
      console.error('❌ Method not allowed:', req.method)
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔧 Step 2: Parsing request body')
    const body = await req.json();
    console.log('📥 Body reçu:', JSON.stringify(body, null, 2));

    const { amount, currency = 'eur', success_url, cancel_url, customer_email, metadata, service_name, parent_url } = body;

    console.log('🔧 Step 3: Validating required parameters')
    if (!success_url || !cancel_url || !customer_email || !service_name) {
      console.error('❌ Paramètres manquants:', {
        success_url: !!success_url,
        cancel_url: !!cancel_url,
        customer_email: !!customer_email,
        service_name: !!service_name
      });
      return new Response(
        JSON.stringify({ error: 'Paramètres requis manquants' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Paramètres validés:', {
      customer_email,
      service_name,
      payment_type: metadata?.payment_type,
      amount,
      parent_url
    })

    let stripeSecretKey: string | undefined;
    
    // 🔥 PAIEMENT VIA LIEN DE PAIEMENT
    if (metadata?.payment_type === 'payment_link') {
      console.log('💳 === PAIEMENT VIA LIEN DE PAIEMENT === 💳')
      
      const userId = metadata?.user_id
      const paymentLinkId = metadata?.payment_link_id
      
      console.log('🔍 Métadonnées critiques:', {
        user_id: userId,
        payment_link_id: paymentLinkId,
        booking_id: metadata?.booking_id
      });
      
      if (!userId) {
        console.error('❌ user_id manquant dans metadata');
        return new Response(
          JSON.stringify({ error: 'user_id requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!paymentLinkId) {
        console.error('❌ payment_link_id manquant dans metadata');
        return new Response(
          JSON.stringify({ error: 'payment_link_id requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('🔧 Step 4: Fetching Stripe configuration for user:', userId);
      console.log('🔗 API URL:', `${supabaseUrl}/rest/v1/business_settings?user_id=eq.${userId}`);

      const settingsResponse = await fetch(
        `${supabaseUrl}/rest/v1/business_settings?user_id=eq.${userId}&select=stripe_enabled,stripe_secret_key`,
        {
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        }
      );

      console.log('📡 API Response Status:', settingsResponse.status);

      if (!settingsResponse.ok) {
        const errorText = await settingsResponse.text();
        console.error('❌ Erreur API Supabase:', settingsResponse.status, errorText);
        return new Response(
          JSON.stringify({ 
            error: 'Erreur récupération configuration Stripe',
            details: errorText,
            status: settingsResponse.status
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const settingsData = await settingsResponse.json();
      console.log('📦 Résultat API business_settings:', {
        count: settingsData.length,
        data: settingsData
      });

      if (!settingsData || settingsData.length === 0) {
        console.error('❌ Aucune configuration trouvée pour user_id:', userId);
        return new Response(
          JSON.stringify({ error: 'Configuration Stripe non trouvée' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const settings = settingsData[0];
      console.log('🔍 Settings found:', {
        stripe_enabled: settings.stripe_enabled,
        has_secret_key: !!settings.stripe_secret_key
      });

      if (!settings.stripe_enabled) {
        console.error('❌ Stripe non activé pour cet utilisateur');
        return new Response(
          JSON.stringify({ error: 'Stripe non activé pour cet utilisateur' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!settings.stripe_secret_key) {
        console.error('❌ Clé secrète Stripe manquante');
        return new Response(
          JSON.stringify({ error: 'Configuration Stripe incomplète' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      stripeSecretKey = settings.stripe_secret_key
      console.log('✅ Clé Stripe utilisateur récupérée');

      console.log('🔧 Step 5: Initializing Stripe client');
      const stripe = new Stripe(stripeSecretKey, {
        appInfo: {
          name: 'BookingFast',
          version: '1.0.0',
        },
      })

      console.log('🔧 Step 6: Finding or creating Stripe customer');
      let customerId
      console.log('🔍 Recherche client Stripe avec email:', customer_email);
      
      const existingCustomers = await stripe.customers.list({
        email: customer_email,
        limit: 1,
      })
      
      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id
        console.log('✅ Client existant:', customerId)
      } else {
        const newCustomer = await stripe.customers.create({
          email: customer_email,
          metadata: metadata || {},
        })
        customerId = newCustomer.id
        console.log('✅ Nouveau client créé:', customerId)
      }

      console.log('🔧 Step 7: Creating Stripe checkout session for payment link');
      console.log('💳 Création session PAIEMENT UNIQUE (lien de paiement):', {
        amount,
        currency,
        service_name,
        payment_link_id: paymentLinkId
      });

      try {
        const sessionData = {
          customer: customerId,
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: currency,
                product_data: {
                  name: service_name,
                  description: `Paiement via lien - ${service_name}`,
                },
                unit_amount: Math.round(amount * 100),
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url,
          cancel_url,
          metadata: metadata || {},
        };

        console.log('📋 Données session Stripe:', JSON.stringify(sessionData, null, 2));

        const session = await stripe.checkout.sessions.create(sessionData);

        console.log('✅ Session PAIEMENT créée:', session.id)
        console.log('🔗 URL:', session.url)

        return new Response(
          JSON.stringify({ 
            sessionId: session.id, 
            url: session.url,
            success: true,
            type: 'payment'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (stripeError: any) {
        console.error('❌ Erreur Stripe:', {
          message: stripeError.message,
          type: stripeError.type,
          code: stripeError.code,
          param: stripeError.param
        });
        return new Response(
          JSON.stringify({ 
            error: 'Erreur Stripe',
            details: stripeError.message,
            type: stripeError.type,
            code: stripeError.code
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

    } else if (metadata?.payment_type === 'booking_deposit') {
      console.log('💳 === PAIEMENT RÉSERVATION IFRAME === 💳')
      
      const userId = metadata?.user_id
      const serviceId = metadata?.service_id
      
      console.log('🔍 Métadonnées critiques:', {
        user_id: userId,
        service_id: serviceId
      });
      
      if (!userId) {
        console.error('❌ user_id manquant dans metadata');
        return new Response(
          JSON.stringify({ error: 'user_id requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!serviceId) {
        console.error('❌ service_id manquant dans metadata');
        return new Response(
          JSON.stringify({ error: 'service_id requis pour créer la réservation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('🔧 Step 4: Fetching Stripe configuration for user:', userId);
      console.log('🔗 API URL:', `${supabaseUrl}/rest/v1/business_settings?user_id=eq.${userId}`);

      const settingsResponse = await fetch(
        `${supabaseUrl}/rest/v1/business_settings?user_id=eq.${userId}&select=stripe_enabled,stripe_secret_key`,
        {
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        }
      );

      console.log('📡 API Response Status:', settingsResponse.status);

      if (!settingsResponse.ok) {
        const errorText = await settingsResponse.text();
        console.error('❌ Erreur API Supabase:', settingsResponse.status, errorText);
        return new Response(
          JSON.stringify({ 
            error: 'Erreur récupération configuration Stripe',
            details: errorText,
            status: settingsResponse.status
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const settingsData = await settingsResponse.json();
      console.log('📦 Résultat API business_settings:', {
        count: settingsData.length,
        data: settingsData
      });

      if (!settingsData || settingsData.length === 0) {
        console.error('❌ Aucune configuration trouvée pour user_id:', userId);
        return new Response(
          JSON.stringify({ error: 'Configuration Stripe non trouvée' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const settings = settingsData[0];
      console.log('🔍 Settings found:', {
        stripe_enabled: settings.stripe_enabled,
        has_secret_key: !!settings.stripe_secret_key
      });

      if (!settings.stripe_enabled) {
        console.error('❌ Stripe non activé pour cet utilisateur');
        return new Response(
          JSON.stringify({ error: 'Stripe non activé pour cet utilisateur' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!settings.stripe_secret_key) {
        console.error('❌ Clé secrète Stripe manquante');
        return new Response(
          JSON.stringify({ error: 'Configuration Stripe incomplète' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      stripeSecretKey = settings.stripe_secret_key
      console.log('✅ Clé Stripe utilisateur récupérée');

      console.log('🔧 Step 5: Initializing Stripe client');
      const stripe = new Stripe(stripeSecretKey, {
        appInfo: {
          name: 'BookingFast',
          version: '1.0.0',
        },
      })

      console.log('🔧 Step 6: Finding or creating Stripe customer');
      let customerId
      console.log('🔍 Recherche client Stripe avec email:', customer_email);
      
      const existingCustomers = await stripe.customers.list({
        email: customer_email,
        limit: 1,
      })
      
      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id
        console.log('✅ Client existant:', customerId)
      } else {
        const newCustomer = await stripe.customers.create({
          email: customer_email,
          metadata: metadata || {},
        })
        customerId = newCustomer.id
        console.log('✅ Nouveau client créé:', customerId)
      }

      console.log('🔧 Step 7: Building redirect URLs')
      let redirectBaseUrl: string;
      
      if (parent_url && parent_url !== 'https://bookingfast.pro') {
        redirectBaseUrl = parent_url;
        console.log('🌐 Iframe externe détecté - redirect vers:', redirectBaseUrl);
      } else {
        redirectBaseUrl = success_url.includes('localhost') 
          ? success_url.split('/booking/')[0] 
          : 'https://bookingfast.pro';
        console.log('🏠 Iframe BookingFast - redirect vers:', redirectBaseUrl);
      }
      
      const iframeSuccessUrl = `${redirectBaseUrl}/booking/${userId}?payment=success&session_id={CHECKOUT_SESSION_ID}`;
      const iframeCancelUrl = `${redirectBaseUrl}/booking/${userId}?payment=cancelled`;

      console.log('🔗 URLs de redirection:', {
        success: iframeSuccessUrl,
        cancel: iframeCancelUrl
      });

      console.log('🔧 Step 8: Creating Stripe checkout session');
      console.log('💳 Création session PAIEMENT UNIQUE:', {
        amount,
        currency,
        service_name
      });

      const completeMetadata = {
        ...metadata,
        user_id: userId,
        service_id: serviceId,
        payment_type: 'booking_deposit'
      };

      console.log('📦 Métadonnées complètes pour Stripe:', JSON.stringify(completeMetadata, null, 2));

      try {
        const sessionData = {
          customer: customerId,
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: currency,
                product_data: {
                  name: service_name,
                  description: `Acompte - ${service_name}`,
                },
                unit_amount: Math.round(amount * 100),
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: iframeSuccessUrl,
          cancel_url: iframeCancelUrl,
          metadata: completeMetadata,
        };

        console.log('📋 Données session Stripe:', JSON.stringify(sessionData, null, 2));

        const session = await stripe.checkout.sessions.create(sessionData);

        console.log('✅ Session PAIEMENT créée:', session.id)
        console.log('🔗 URL:', session.url)

        return new Response(
          JSON.stringify({ 
            sessionId: session.id, 
            url: session.url,
            success: true,
            type: 'payment'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (stripeError: any) {
        console.error('❌ Erreur Stripe:', {
          message: stripeError.message,
          type: stripeError.type,
          code: stripeError.code,
          param: stripeError.param
        });
        return new Response(
          JSON.stringify({ 
            error: 'Erreur Stripe',
            details: stripeError.message,
            type: stripeError.type,
            code: stripeError.code
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

    } else if (metadata?.payment_type === 'platform_subscription' || metadata?.payment_type === 'plugin_subscription') {
      console.log('💳 === CRÉATION ABONNEMENT RÉCURRENT === 💳')
      console.log('🔑 PLATFORM_STRIPE_SECRET_KEY présent:', !!PLATFORM_STRIPE_SECRET_KEY)
      console.log('🔑 Longueur clé:', PLATFORM_STRIPE_SECRET_KEY?.length)
      console.log('🔑 Préfixe clé:', PLATFORM_STRIPE_SECRET_KEY?.substring(0, 10))
      
      stripeSecretKey = PLATFORM_STRIPE_SECRET_KEY;
      
      if (!stripeSecretKey) {
        console.error('❌ PLATFORM_STRIPE_SECRET_KEY non défini');
        return new Response(
          JSON.stringify({ error: 'Configuration Stripe manquante' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('✅ Clé Stripe plateforme trouvée');
      console.log('🔧 Initialisation client Stripe...');

      let stripe: Stripe;
      try {
        stripe = new Stripe(stripeSecretKey, {
          appInfo: {
            name: 'BookingFast',
            version: '1.0.0',
          },
        })
        console.log('✅ Client Stripe initialisé avec succès');
      } catch (stripeInitError: any) {
        console.error('❌ Erreur initialisation Stripe:', {
          message: stripeInitError.message,
          type: stripeInitError.constructor?.name,
          stack: stripeInitError.stack
        });
        return new Response(
          JSON.stringify({ 
            error: 'Erreur initialisation Stripe',
            details: stripeInitError.message
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      let customerId
      console.log('🔍 Recherche client Stripe avec email:', customer_email);
      
      try {
        const existingCustomers = await stripe.customers.list({
          email: customer_email,
          limit: 1,
        })
        
        if (existingCustomers.data.length > 0) {
          customerId = existingCustomers.data[0].id
          console.log('✅ Client existant:', customerId)
        } else {
          const newCustomer = await stripe.customers.create({
            email: customer_email,
            metadata: metadata || {},
          })
          customerId = newCustomer.id
          console.log('✅ Nouveau client créé:', customerId)
        }
      } catch (customerError: any) {
        console.error('❌ Erreur gestion client Stripe:', {
          message: customerError.message,
          type: customerError.type,
          code: customerError.code
        });
        return new Response(
          JSON.stringify({ 
            error: 'Erreur gestion client Stripe',
            details: customerError.message
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      let priceId: string | undefined;

      if (metadata?.payment_type === 'plugin_subscription') {
        console.log('🔌 === ABONNEMENT PLUGIN === 🔌')
        
        const pluginId = metadata?.plugin_id
        if (!pluginId) {
          console.error('❌ plugin_id manquant dans metadata');
          return new Response(
            JSON.stringify({ error: 'plugin_id requis' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('🔍 Requête API plugins pour ID:', pluginId);
        
        const pluginResponse = await fetch(
          `${supabaseUrl}/rest/v1/plugins?id=eq.${pluginId}&select=id,name,slug,stripe_price_id`,
          {
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('📡 Plugin API Response Status:', pluginResponse.status);

        if (!pluginResponse.ok) {
          const errorText = await pluginResponse.text();
          console.error('❌ Erreur API plugins:', pluginResponse.status, errorText);
          return new Response(
            JSON.stringify({ 
              error: 'Erreur lors de la récupération du plugin',
              details: errorText
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const pluginData = await pluginResponse.json();
        console.log('📦 Plugin data:', pluginData);

        if (!pluginData || pluginData.length === 0) {
          console.error('❌ Plugin non trouvé avec ID:', pluginId);
          return new Response(
            JSON.stringify({ error: 'Plugin non trouvé' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const plugin = pluginData[0];
        console.log('✅ Plugin trouvé:', plugin.name);

        if (!plugin.stripe_price_id) {
          console.error('❌ stripe_price_id manquant pour le plugin:', plugin.slug);
          return new Response(
            JSON.stringify({ 
              error: 'Configuration Stripe du plugin manquante',
              help: 'Ajoutez le stripe_price_id dans la table plugins pour ce plugin',
              plugin: plugin.slug
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        priceId = plugin.stripe_price_id
        console.log('✅ Price ID plugin récupéré:', priceId)

      } else {
        // 🔥 ABONNEMENT PLATEFORME - MAPPING UUID → plan_id
        const STRIPE_PRICES = {
          starter: 'price_1SG0crKiNbWQJGP32LZ3uBoT',
          monthly: 'price_1SG0bfKiNbWQJGP3IBm6hcbW',
          yearly: 'price_1SG0dzKiNbWQJGP3KYkvl0Xf'
        }

        const planIdFromMetadata = metadata?.plan_id || 'starter'
        console.log('🔍 Plan ID reçu:', planIdFromMetadata)

        // 🔥 SI C'EST UN UUID, ON INTERROGE LA TABLE subscription_plans
        let planIdentifier = planIdFromMetadata;
        
        if (planIdFromMetadata.includes('-')) {
          console.log('🔍 UUID détecté, requête API subscription_plans...');
          
          const planResponse = await fetch(
            `${supabaseUrl}/rest/v1/subscription_plans?id=eq.${planIdFromMetadata}&select=plan_id`,
            {
              headers: {
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log('📡 Plan API Response Status:', planResponse.status);

          if (!planResponse.ok) {
            const errorText = await planResponse.text();
            console.error('❌ Erreur API subscription_plans:', planResponse.status, errorText);
            return new Response(
              JSON.stringify({ 
                error: 'Erreur lors de la récupération du plan',
                details: errorText
              }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          const planData = await planResponse.json();
          console.log('📦 Plan data:', planData);

          if (!planData || planData.length === 0) {
            console.error('❌ Plan non trouvé avec UUID:', planIdFromMetadata);
            return new Response(
              JSON.stringify({ error: 'Plan non trouvé' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          planIdentifier = planData[0].plan_id;
          console.log('✅ plan_id récupéré:', planIdentifier);
        }

        priceId = STRIPE_PRICES[planIdentifier as keyof typeof STRIPE_PRICES]

        console.log('🔍 Plan identifier final:', planIdentifier)
        console.log('🔍 Price ID récupéré:', priceId)
        console.log('🔍 Tous les Price IDs disponibles:', STRIPE_PRICES)

        if (!priceId) {
          console.error('❌ Price ID non trouvé pour le plan:', planIdentifier)
          return new Response(
            JSON.stringify({ 
              error: 'Plan non reconnu',
              plan: planIdentifier,
              available_plans: Object.keys(STRIPE_PRICES)
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      console.log('💳 Création session ABONNEMENT avec Price ID:', priceId)
      console.log('📧 Email client:', customer_email)
      console.log('🆔 Customer ID:', customerId)
      
      try {
        const sessionData = {
          customer: customerId,
          payment_method_types: ['card'],
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          mode: 'subscription',
          success_url,
          cancel_url,
          metadata: metadata || {},
          subscription_data: {
            metadata: metadata || {},
          },
        };

        console.log('📋 Données session Stripe COMPLÈTES:', JSON.stringify(sessionData, null, 2));
        console.log('🚀 Appel Stripe API checkout.sessions.create...');

        const session = await stripe.checkout.sessions.create(sessionData);

        console.log('✅ Session ABONNEMENT créée avec SUCCÈS:', session.id)
        console.log('🔗 URL:', session.url)
        console.log('📊 Session complète:', JSON.stringify(session, null, 2))

        return new Response(
          JSON.stringify({ 
            sessionId: session.id, 
            url: session.url,
            success: true,
            type: 'subscription'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (stripeError: any) {
        console.error('❌ === ERREUR STRIPE API === ❌')
        console.error('Type:', stripeError.type)
        console.error('Code:', stripeError.code)
        console.error('Message:', stripeError.message)
        console.error('Param:', stripeError.param)
        console.error('Stack:', stripeError.stack)
        console.error('Raw error:', JSON.stringify(stripeError, null, 2))
        
        return new Response(
          JSON.stringify({ 
            error: 'Erreur Stripe API',
            details: stripeError.message,
            type: stripeError.type,
            code: stripeError.code,
            param: stripeError.param
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

    } else {
      console.error('❌ Type de paiement non reconnu:', metadata?.payment_type);
      return new Response(
        JSON.stringify({ error: 'Type de paiement non reconnu' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error: any) {
    console.error('❌ === ERREUR GLOBALE === ❌')
    console.error('Type:', error.constructor?.name)
    console.error('Message:', error.message)
    console.error('Stack:', error.stack)
    console.error('Raw error:', JSON.stringify(error, null, 2))
    
    return new Response(
      JSON.stringify({ 
        error: 'Erreur interne',
        details: error.message,
        type: error.constructor?.name,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
});
