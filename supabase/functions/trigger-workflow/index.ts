import { createClient } from 'npm:@supabase/supabase-js@2'

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
    console.log('🚀 Début déclenchement workflow...')
    
    // Créer le client Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Lire les données de la requête
    const { trigger, booking_data, user_id } = await req.json()

    if (!trigger || !booking_data || !user_id) {
      console.error('❌ Paramètres manquants:', { trigger, has_booking_data: !!booking_data, user_id })
      return new Response(
        JSON.stringify({ error: 'trigger, booking_data and user_id are required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('📋 Déclenchement workflow:', trigger)
    console.log('👤 User ID:', user_id)
    console.log('📧 Client:', booking_data.client_email)
    console.log('🛍️ Service:', booking_data.service?.name || 'Service inconnu')

    // Charger les workflows actifs pour ce déclencheur
    console.log('🔍 Recherche workflows pour trigger:', trigger, 'user_id:', user_id)
    const { data: workflows, error: workflowsError } = await supabaseClient
      .from('email_workflows')
      .select('*')
      .eq('user_id', user_id)
      .eq('trigger', trigger)
      .eq('active', true)

    if (workflowsError) {
      console.error('❌ Erreur chargement workflows:', workflowsError)
      return new Response(
        JSON.stringify({ error: 'Failed to load workflows', details: workflowsError.message }),
        { status: 500, headers: corsHeaders }
      )
    }

    console.log('📊 Workflows trouvés:', workflows?.length || 0)
    if (workflows && workflows.length > 0) {
      console.log('📋 Liste workflows:', workflows.map(w => ({ id: w.id, name: w.name, template_id: w.template_id })))
    }

    if (!workflows || workflows.length === 0) {
      console.log('ℹ️ Aucun workflow actif pour le déclencheur:', trigger)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No active workflows found for trigger',
          trigger: trigger,
          workflows_found: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Charger les templates
    const templateIds = workflows.map(w => w.template_id)
    console.log('🔍 Chargement templates:', templateIds)
    const { data: templates, error: templatesError } = await supabaseClient
      .from('email_templates')
      .select('*')
      .in('id', templateIds)

    if (templatesError) {
      console.error('❌ Erreur chargement templates:', templatesError)
      return new Response(
        JSON.stringify({ error: 'Failed to load templates', details: templatesError.message }),
        { status: 500, headers: corsHeaders }
      )
    }
    
    console.log('📊 Templates trouvés:', templates?.length || 0)

    // Récupérer les paramètres business pour l'envoi d'emails
    const { data: settings, error: settingsError } = await supabaseClient
      .from('business_settings')
      .select('brevo_enabled, brevo_api_key, brevo_sender_email, brevo_sender_name, business_name')
      .eq('user_id', user_id)
      .single()

    if (settingsError || !settings) {
      console.warn('⚠️ Paramètres business non trouvés, utilisation des valeurs par défaut')
    }

    let successCount = 0
    let errorCount = 0

    // Exécuter chaque workflow
    for (const workflow of workflows) {
      try {
        console.log('⚡ EXÉCUTION WORKFLOW:', workflow.name)
        console.log('📧 Template ID:', workflow.template_id)
      
        // Trouver le template
        const template = templates?.find(t => t.id === workflow.template_id)
        if (!template) {
          console.error(`❌ Template non trouvé: ${workflow.template_id}`)
          errorCount++
          continue
        }
        
        console.log('✅ Template trouvé:', template.name)

        // Vérifier les conditions du workflow
        if (workflow.conditions && workflow.conditions.length > 0) {
          console.log('🔍 Vérification des conditions du workflow...')
          
          const conditionsMet = workflow.conditions.every(condition => {
            let fieldValue: any
            
            switch (condition.field) {
              case 'booking_status':
                fieldValue = booking_data.booking_status
                break
              case 'payment_status':
                fieldValue = booking_data.payment_status
                break
              case 'service_name':
                fieldValue = booking_data.service?.name
                break
              case 'total_amount':
                fieldValue = booking_data.total_amount
                break
              case 'client_email':
                fieldValue = booking_data.client_email
                break
              default:
                return false
            }

            switch (condition.operator) {
              case 'equals':
                return fieldValue === condition.value
              case 'not_equals':
                return fieldValue !== condition.value
              case 'contains':
                return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase())
              case 'greater_than':
                return Number(fieldValue) > Number(condition.value)
              case 'less_than':
                return Number(fieldValue) < Number(condition.value)
              default:
                return false
            }
          })

          if (!conditionsMet) {
            console.log('⏭️ Conditions non remplies pour workflow:', workflow.name)
            continue
          }
        }
      
        // Attendre le délai si spécifié
        if (workflow.delay && workflow.delay > 0) {
          console.log('⏳ Attente de', workflow.delay, 'minutes...')
          // En production, utilisez un système de queue
          // Ici on simule juste un délai court pour la démo
          await new Promise(resolve => setTimeout(resolve, Math.min(workflow.delay * 1000, 10000))) // Max 10 secondes
        }
      
        // Préparer les variables pour le template
        const templateVariables = {
          '{{client_firstname}}': booking_data.client_firstname || '',
          '{{client_lastname}}': booking_data.client_name || '',
          '{{client_email}}': booking_data.client_email || '',
          '{{client_phone}}': booking_data.client_phone || '',
          '{{service_name}}': booking_data.service?.name || 'Service',
          '{{service_description}}': booking_data.service?.description || '',
          '{{service_price}}': booking_data.service?.price_ttc?.toFixed(2) || '0.00',
          '{{service_duration}}': booking_data.duration_minutes?.toString() || '0',
          '{{booking_date}}': new Date(booking_data.date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          '{{booking_time}}': booking_data.time?.slice(0, 5) || '',
          '{{booking_quantity}}': booking_data.quantity?.toString() || '1',
          '{{total_amount}}': booking_data.total_amount?.toFixed(2) || '0.00',
          '{{payment_amount}}': (booking_data.payment_amount || 0).toFixed(2),
          '{{remaining_amount}}': (booking_data.total_amount - (booking_data.payment_amount || 0)).toFixed(2),
          '{{payment_link}}': booking_data.payment_link || '#',
          '{{business_name}}': settings?.business_name || 'BookingFast',
          '{{current_date}}': new Date().toLocaleDateString('fr-FR'),
          '{{current_time}}': new Date().toLocaleTimeString('fr-FR')
        }
        
        console.log('📧 Variables template préparées:', Object.keys(templateVariables).length, 'variables')

        // Remplacer les variables dans le contenu
        let finalSubject = template.subject
        let finalHtmlContent = template.html_content
        let finalTextContent = template.text_content

        Object.entries(templateVariables).forEach(([key, value]) => {
          const regex = new RegExp(key.replace(/[{}]/g, '\\$&'), 'g')
          finalSubject = finalSubject.replace(regex, String(value))
          finalHtmlContent = finalHtmlContent.replace(regex, String(value))
          finalTextContent = finalTextContent.replace(regex, String(value))
        })
      
        // Envoyer l'email si Brevo est configuré
        if (settings?.brevo_enabled && settings?.brevo_api_key) {
          console.log('📤 Envoi email via Brevo à:', booking_data.client_email)
          
          const emailData = {
            sender: {
              name: settings.brevo_sender_name || settings.business_name || 'BookingFast',
              email: settings.brevo_sender_email
            },
            to: [
              {
                email: booking_data.client_email,
                name: `${booking_data.client_firstname} ${booking_data.client_name}`
              }
            ],
            subject: finalSubject,
            htmlContent: finalHtmlContent,
            textContent: finalTextContent
          }

          const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'api-key': settings.brevo_api_key
            },
            body: JSON.stringify(emailData)
          })

          if (brevoResponse.ok) {
            const brevoResult = await brevoResponse.json()
            console.log('✅ Email envoyé avec succès via Brevo:', brevoResult.messageId)
            successCount++
            
            // Mettre à jour les statistiques du workflow
            await supabaseClient
              .from('email_workflows')
              .update({
                sent_count: (workflow.sent_count || 0) + 1,
                updated_at: new Date().toISOString()
              })
              .eq('id', workflow.id)
          } else {
            const brevoError = await brevoResponse.text()
            console.error('❌ Erreur envoi email Brevo:', brevoError)
            errorCount++
          }
        } else {
          console.log('📧 Brevo non configuré - workflow simulé')
          successCount++
          
          // Mettre à jour les statistiques même si l'email n'est pas envoyé
          await supabaseClient
            .from('email_workflows')
            .update({
              sent_count: (workflow.sent_count || 0) + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', workflow.id)
        }
        
        console.log('✅ Workflow', workflow.name, 'exécuté avec succès')
        
      } catch (error) {
        console.error('❌ Erreur workflow', workflow.name, ':', error)
        errorCount++
      }
    }

    console.log('🏁 FIN EXÉCUTION WORKFLOWS')
    console.log('📊 Résultats:', { successCount, errorCount, total: workflows.length })

    return new Response(
      JSON.stringify({ 
        success: true,
        workflows_executed: workflows.length,
        success_count: successCount,
        error_count: errorCount,
        trigger: trigger
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erreur générale workflow:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Workflow execution failed',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
