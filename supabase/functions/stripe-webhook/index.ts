const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Cache pour éviter les doublons
const processedSessions = new Map<string, { timestamp: number; result: any }>()

// Nettoyer le cache toutes les 10 minutes
setInterval(() => {
  const now = Date.now()
  const tenMinutes = 10 * 60 * 1000
  
  for (const [sessionId, data] of processedSessions.entries()) {
    if (now - data.timestamp > tenMinutes) {
      processedSessions.delete(sessionId)
    }
  }
}, 10 * 60 * 1000)

// Helper pour appeler l'API REST Supabase
async function supabaseRequest(
  endpoint: string,
  method: string = 'GET',
  body?: any
) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  
  const url = `${supabaseUrl}/rest/v1/${endpoint}`
  
  const headers: Record<string, string> = {
    'apikey': serviceRoleKey!,
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }
  
  const options: RequestInit = {
    method,
    headers
  }
  
  if (body) {
    options.body = JSON.stringify(body)
  }
  
  const response = await fetch(url, options)
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Supabase API error: ${response.status} - ${error}`)
  }
  
  const text = await response.text()
  return text ? JSON.parse(text) : null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔔 Webhook Stripe reçu')

    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      console.error('❌ Signature Stripe manquante')
      return new Response('Signature manquante', { status: 400, headers: corsHeaders })
    }

    let event
    try {
      event = JSON.parse(body)
      console.log('📦 Événement Stripe:', event.type)
    } catch (err) {
      console.error('❌ Erreur parsing JSON:', err)
      return new Response('JSON invalide', { status: 400, headers: corsHeaders })
    }

    // 🔥 IGNORER payment_intent.succeeded - ON ATTEND checkout.session.completed
    if (event.type === 'payment_intent.succeeded') {
      console.log('⏭️ IGNORÉ: payment_intent.succeeded - On attend checkout.session.completed')
      return new Response(JSON.stringify({ 
        received: true, 
        ignored: true,
        reason: 'Waiting for checkout.session.completed event'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Gérer les événements d'abonnement
    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object
      console.log('📊 Mise à jour abonnement:', subscription.id)

      await supabaseRequest(
        `users?stripe_subscription_id=eq.${subscription.id}`,
        'PATCH',
        {
          subscription_status: subscription.status === 'active' ? 'active' : 'cancelled',
          cancel_at_period_end: subscription.cancel_at_period_end || false,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }
      )

      console.log('✅ Abonnement mis à jour')

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Traiter checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const sessionId = session.id
      
      console.log('💳 Session de paiement complétée:', sessionId)
      console.log('📋 Metadata:', JSON.stringify(session.metadata, null, 2))
      
      // ⚠️ VÉRIFICATION CRITIQUE : Paiement complet ?
      if (session.status !== 'complete' || session.payment_status !== 'paid') {
        console.log('⚠️ PAIEMENT NON COMPLET - Session ignorée')
        return new Response(JSON.stringify({ 
          success: true, 
          type: 'payment_not_complete'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      // 🔒 Vérifier si déjà traité (éviter doublons)
      if (processedSessions.has(sessionId)) {
        const cached = processedSessions.get(sessionId)!
        console.log('🔒 SESSION DÉJÀ TRAITÉE')
        return new Response(JSON.stringify({ 
          success: true, 
          type: 'cached_duplicate_prevented',
          result: cached.result
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Marquer comme en cours de traitement
      processedSessions.set(sessionId, { 
        timestamp: Date.now(), 
        result: { processing: true } 
      })

      const metadata = session.metadata || {}

      // 💳 PAIEMENT VIA LIEN DE PAIEMENT (CODE ORIGINAL QUI FONCTIONNAIT)
      if (metadata.payment_type === 'payment_link') {
        console.log('💳 === PAIEMENT VIA LIEN === 💳')
        
        const paymentLinkId = metadata.payment_link_id
        const bookingId = metadata.booking_id
        const amount = session.amount_total / 100

        if (!paymentLinkId || !bookingId) {
          console.error('❌ payment_link_id ou booking_id manquant')
          processedSessions.delete(sessionId)
          return new Response('Données manquantes', { status: 400, headers: corsHeaders })
        }

        console.log('🔍 Traitement paiement lien:', {
          paymentLinkId,
          bookingId,
          amount
        })

        // 1️⃣ Récupérer la réservation
        console.log('🔍 Récupération réservation...')
        const bookings = await supabaseRequest(`bookings?id=eq.${bookingId}`)
        const booking = bookings?.[0]

        if (!booking) {
          console.error('❌ Réservation non trouvée')
          processedSessions.delete(sessionId)
          return new Response('Réservation non trouvée', { status: 404, headers: corsHeaders })
        }

        console.log('📋 Réservation trouvée:', {
          id: booking.id,
          total_amount: booking.total_amount,
          payment_amount: booking.payment_amount,
          payment_status: booking.payment_status,
          transactions: booking.transactions
        })

        // 2️⃣ 🔥 MISE À JOUR DE LA TRANSACTION EXISTANTE (CODE ORIGINAL)
        const transactions = booking.transactions || []
        
        // Chercher la transaction "pending" liée à ce payment_link_id
        const pendingTransactionIndex = transactions.findIndex((t: any) => 
          t.status === 'pending' && 
          (t.payment_link_id === paymentLinkId || t.note?.includes(paymentLinkId))
        )

        if (pendingTransactionIndex !== -1) {
          console.log('🔄 MISE À JOUR transaction existante:', transactions[pendingTransactionIndex].id)
          
          // Mettre à jour la transaction existante
          transactions[pendingTransactionIndex] = {
            ...transactions[pendingTransactionIndex],
            status: 'completed',
            stripe_session_id: sessionId,
            payment_link_id: paymentLinkId,
            note: `Paiement complété via lien de paiement - ${new Date().toLocaleString('fr-FR')}`
          }
        } else {
          console.log('⚠️ Aucune transaction pending trouvée, création nouvelle transaction')
          
          // Si aucune transaction pending n'est trouvée, en créer une nouvelle
          const newTransaction = {
            id: crypto.randomUUID(),
            amount: amount,
            method: 'stripe',
            status: 'completed',
            date: new Date().toISOString(),
            created_at: new Date().toISOString(),
            stripe_session_id: sessionId,
            payment_link_id: paymentLinkId,
            note: `Paiement complété via lien de paiement - ${new Date().toLocaleString('fr-FR')}`
          }
          transactions.push(newTransaction)
        }

        console.log('💰 Transactions après mise à jour:', transactions)

        // 3️⃣ Calculer le nouveau montant payé
        const newPaymentAmount = transactions
          .filter((t: any) => t.status === 'completed')
          .reduce((sum: number, t: any) => sum + t.amount, 0)

        console.log('💵 Calcul paiement:', {
          ancien: booking.payment_amount || 0,
          nouveau: newPaymentAmount,
          total: booking.total_amount
        })

        // 4️⃣ Déterminer le statut de paiement
        let paymentStatus = 'pending'
        if (newPaymentAmount >= booking.total_amount) {
          paymentStatus = 'completed'
          console.log('✅ Paiement COMPLET')
        } else if (newPaymentAmount > 0) {
          paymentStatus = 'partial'
          console.log('⚠️ Paiement PARTIEL')
        }

        // 5️⃣ Mettre à jour la réservation
        console.log('🔄 Mise à jour réservation...')
        const updateData = {
          transactions: transactions,
          payment_amount: newPaymentAmount,
          payment_status: paymentStatus,
          updated_at: new Date().toISOString()
        }

        console.log('📦 Données de mise à jour:', updateData)

        await supabaseRequest(
          `bookings?id=eq.${bookingId}`,
          'PATCH',
          updateData
        )

        // 6️⃣ Marquer le lien comme complété
        console.log('🔄 Marquage lien comme complété...')
        
        await supabaseRequest(
          `payment_links?id=eq.${paymentLinkId}`,
          'PATCH',
          {
            status: 'completed',
            stripe_session_id: sessionId,
            paid_at: new Date().toISOString()
          }
        )

        console.log('✅ PAIEMENT VIA LIEN TRAITÉ AVEC SUCCÈS')

        const result = { 
          success: true, 
          type: 'payment_link',
          bookingId: bookingId,
          amount: amount,
          newPaymentAmount: newPaymentAmount,
          paymentStatus: paymentStatus,
          transactionUpdated: pendingTransactionIndex !== -1,
          paymentLinkId: paymentLinkId
        }
        
        processedSessions.set(sessionId, { timestamp: Date.now(), result })
        
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // 📅 RÉSERVATION IFRAME (booking_deposit) - AVEC TRANSACTIONS
      if (metadata.payment_type === 'booking_deposit') {
        console.log('📅 === PAIEMENT RÉSERVATION IFRAME === 📅')
        
        const userId = metadata.user_id
        const serviceId = metadata.service_id
        const bookingId = metadata.booking_id
        const date = metadata.date
        const time = metadata.time
        const quantity = parseInt(metadata.quantity || '1')
        
        let clientFirstname = ''
        let clientLastname = ''
        let clientPhone = metadata.phone || metadata.client_phone || ''
        
        if (metadata.client) {
          const nameParts = metadata.client.trim().split(/\s+/)
          if (nameParts.length === 1) {
            clientFirstname = nameParts[0]
            clientLastname = nameParts[0]
          } else {
            clientFirstname = nameParts[0]
            clientLastname = nameParts.slice(1).join(' ')
          }
        }
        
        if (!clientFirstname && metadata.client_firstname) {
          clientFirstname = metadata.client_firstname
          clientLastname = metadata.client_lastname || metadata.client_firstname
        }
        
        if (!clientFirstname && session.customer_details?.name) {
          const nameParts = session.customer_details.name.trim().split(/\s+/)
          if (nameParts.length === 1) {
            clientFirstname = nameParts[0]
            clientLastname = nameParts[0]
          } else {
            clientFirstname = nameParts[0]
            clientLastname = nameParts.slice(1).join(' ')
          }
        }
        
        if (!clientFirstname) {
          const emailPart = session.customer_details.email.split('@')[0]
          clientFirstname = emailPart
          clientLastname = emailPart
        }
        
        const assignedUserId = metadata.assigned_user_id

        if (!userId || !serviceId || !date || !time) {
          console.error('❌ Données réservation manquantes')
          processedSessions.delete(sessionId)
          return new Response('Données réservation manquantes', { status: 400, headers: corsHeaders })
        }

        const services = await supabaseRequest(`services?id=eq.${serviceId}`)
        const service = services?.[0]

        if (!service) {
          console.error('❌ Service non trouvé')
          processedSessions.delete(sessionId)
          return new Response('Service non trouvé', { status: 404, headers: corsHeaders })
        }

        const totalAmount = service.price_ttc * quantity
        const depositAmount = session.amount_total / 100

        // 🔥 CRÉER LA TRANSACTION POUR LE PAIEMENT IFRAME
        console.log('💰 === CRÉATION TRANSACTION IFRAME === 💰')
        const iframeTransaction = {
          id: crypto.randomUUID(),
          amount: depositAmount,
          method: 'stripe',
          status: 'completed',
          date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          stripe_session_id: sessionId,
          note: `Acompte payé via iframe - ${new Date().toLocaleString('fr-FR')}`
        }
        console.log('📋 Transaction iframe créée:', iframeTransaction)

        if (bookingId) {
          console.log('🔄 === MISE À JOUR RÉSERVATION EXISTANTE === 🔄')

          const existingBookings = await supabaseRequest(`bookings?id=eq.${bookingId}`)
          const existingBooking = existingBookings?.[0]

          if (!existingBooking) {
            console.error('❌ Réservation non trouvée:', bookingId)
            processedSessions.delete(sessionId)
            return new Response('Réservation non trouvée', { status: 404, headers: corsHeaders })
          }

          // 🔥 AJOUTER LA TRANSACTION AU TABLEAU EXISTANT
          const existingTransactions = existingBooking.transactions || []
          const updatedTransactions = [...existingTransactions, iframeTransaction]
          
          console.log('📋 Transactions existantes:', existingTransactions)
          console.log('📋 Transactions mises à jour:', updatedTransactions)

          const updateData: any = {
            payment_status: 'paid',
            payment_amount: depositAmount,
            booking_status: 'confirmed',
            stripe_session_id: sessionId,
            deposit_amount: depositAmount,
            transactions: updatedTransactions,
            updated_at: new Date().toISOString()
          }

          console.log('📦 Données de mise à jour:', updateData)

          await supabaseRequest(
            `bookings?id=eq.${bookingId}`,
            'PATCH',
            updateData
          )

          console.log('✅ RÉSERVATION MISE À JOUR AVEC TRANSACTION:', bookingId)

          const result = { 
            success: true, 
            type: 'booking_updated',
            bookingId: bookingId,
            transaction: iframeTransaction
          }
          
          processedSessions.set(sessionId, { timestamp: Date.now(), result })
          
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })

        } else {
          console.log('➕ === CRÉATION NOUVELLE RÉSERVATION === ➕')

          const existingBookings = await supabaseRequest(`bookings?stripe_session_id=eq.${sessionId}`)
          const existingBooking = existingBookings?.[0]

          if (existingBooking) {
            console.log('⚠️ Réservation déjà créée:', existingBooking.id)
            const result = { 
              success: true, 
              type: 'booking_already_exists',
              bookingId: existingBooking.id
            }
            processedSessions.set(sessionId, { timestamp: Date.now(), result })
            return new Response(JSON.stringify(result), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          const bookingData: any = {
            user_id: userId,
            service_id: serviceId,
            date: date,
            time: time,
            duration_minutes: service.duration_minutes,
            quantity: quantity,
            client_name: clientLastname,
            client_firstname: clientFirstname,
            client_email: session.customer_details.email,
            client_phone: clientPhone,
            total_amount: totalAmount,
            payment_status: 'paid',
            payment_amount: depositAmount,
            deposit_amount: depositAmount,
            booking_status: 'confirmed',
            stripe_session_id: sessionId,
            transactions: [iframeTransaction]
          }

          if (assignedUserId) {
            bookingData.assigned_user_id = assignedUserId
          }

          console.log('📦 Données réservation avec transaction:', bookingData)

          const bookings = await supabaseRequest('bookings', 'POST', bookingData)
          const booking = bookings?.[0]

          if (!booking) {
            console.error('❌ Erreur création réservation')
            processedSessions.delete(sessionId)
            return new Response('Erreur création réservation', { status: 500, headers: corsHeaders })
          }

          console.log('✅ RÉSERVATION CRÉÉE AVEC TRANSACTION:', booking.id)

          const result = { 
            success: true, 
            type: 'booking_created',
            bookingId: booking.id,
            transaction: iframeTransaction
          }
          
          processedSessions.set(sessionId, { timestamp: Date.now(), result })
          
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }

      // 🔌 ABONNEMENT PLUGIN
      if (session.client_reference_id && session.client_reference_id.includes('|')) {
        console.log('🔌 ABONNEMENT PLUGIN détecté')
        
        const [userId, pluginId] = session.client_reference_id.split('|')
        const stripeSubscriptionId = session.subscription

        const existingSubs = await supabaseRequest(
          `plugin_subscriptions?user_id=eq.${userId}&plugin_id=eq.${pluginId}`
        )
        const existingSub = existingSubs?.[0]

        if (existingSub) {
          await supabaseRequest(
            `plugin_subscriptions?id=eq.${existingSub.id}`,
            'PATCH',
            {
              status: 'active',
              is_trial: false,
              trial_ends_at: null,
              stripe_subscription_id: stripeSubscriptionId,
              stripe_customer_id: session.customer,
              current_period_start: new Date().toISOString(),
              current_period_end: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
              updated_at: new Date().toISOString()
            }
          )
        } else {
          await supabaseRequest('plugin_subscriptions', 'POST', {
            user_id: userId,
            plugin_id: pluginId,
            status: 'active',
            is_trial: false,
            stripe_subscription_id: stripeSubscriptionId,
            stripe_customer_id: session.customer,
            current_period_start: new Date().toISOString(),
            current_period_end: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
          })
        }
        
        const result = { 
          success: true, 
          type: 'plugin_subscription',
          userId: userId,
          pluginId: pluginId,
          status: 'active'
        }
        
        processedSessions.set(sessionId, { timestamp: Date.now(), result })
        
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // 💳 Abonnement plateforme
      if (metadata.payment_type === 'platform_subscription') {
        console.log('💳 ABONNEMENT PLATEFORME')
        
        const userId = metadata.user_id
        const planId = metadata.plan_id || metadata.plan_type
        
        if (!userId || !planId) {
          console.error('❌ Données abonnement manquantes')
          processedSessions.delete(sessionId)
          return new Response('Données abonnement manquantes', { status: 400, headers: corsHeaders })
        }
        
        let subscriptionTier = 'starter'
        if (planId === 'monthly' || planId === 'pro' || planId === 'yearly') {
          subscriptionTier = 'pro'
        }
        
        const stripeSubscriptionId = session.subscription

        await supabaseRequest(
          `users?id=eq.${userId}`,
          'PATCH',
          {
            subscription_tier: subscriptionTier,
            subscription_status: 'active',
            trial_ends_at: null,
            stripe_subscription_id: stripeSubscriptionId,
            stripe_customer_id: session.customer,
            current_period_end: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
            cancel_at_period_end: false,
            updated_at: new Date().toISOString()
          }
        )
        
        console.log('✅ ABONNEMENT ACTIVÉ')
        
        const result = { 
          success: true, 
          type: 'platform_subscription',
          userId: userId,
          planId: planId,
          subscriptionTier: subscriptionTier,
          status: 'active'
        }
        
        processedSessions.set(sessionId, { timestamp: Date.now(), result })
        
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log('⚠️ Type de paiement non reconnu')
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('ℹ️ Événement non traité:', event.type)
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Erreur webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
