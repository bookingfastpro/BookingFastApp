import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📧 Début envoi email Brevo...')

    // Lire les données de la requête
    const { 
      brevo_api_key,
      brevo_sender_email,
      brevo_sender_name,
      to_email, 
      to_name, 
      subject, 
      html_content, 
      text_content,
      attachments = []
    } = await req.json()

    // Validation des paramètres
    if (!brevo_api_key || !brevo_sender_email || !to_email || !subject) {
      console.error('❌ Paramètres manquants')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Paramètres manquants. Vérifiez la configuration Brevo dans Paramètres > Entreprise.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📧 Envoi email à:', to_email)
    console.log('📧 Sujet:', subject)
    console.log('📧 Expéditeur:', brevo_sender_email)
    console.log('📧 Pièces jointes:', attachments.length)

    // Préparer les données pour l'API Brevo
    const emailData: any = {
      sender: {
        name: brevo_sender_name || 'BookingPro',
        email: brevo_sender_email
      },
      to: [
        {
          email: to_email,
          name: to_name || to_email.split('@')[0]
        }
      ],
      subject: subject,
      htmlContent: html_content,
      textContent: text_content || 'Contenu de l\'email.'
    }

    // Ajouter les pièces jointes si présentes
    if (attachments && attachments.length > 0) {
      emailData.attachment = attachments.map((att: any) => ({
        name: att.name,
        content: att.content,
        type: att.type || 'application/pdf'
      }))
      console.log('📎 Pièces jointes ajoutées:', emailData.attachment.length)
    }

    console.log('📧 Données email Brevo:', {
      sender: emailData.sender,
      to: emailData.to,
      subject: emailData.subject,
      hasHtml: !!emailData.htmlContent,
      hasText: !!emailData.textContent,
      attachments: emailData.attachment?.length || 0
    })

    // Envoyer l'email via l'API Brevo
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevo_api_key
      },
      body: JSON.stringify(emailData)
    })

    const responseText = await brevoResponse.text()
    console.log('📧 Réponse Brevo status:', brevoResponse.status)
    console.log('📧 Réponse Brevo body:', responseText)

    if (!brevoResponse.ok) {
      let errorMessage = 'Erreur envoi email'
      try {
        const errorData = JSON.parse(responseText)
        errorMessage = errorData.message || errorData.error || errorMessage
        console.error('❌ Erreur Brevo détaillée:', errorData)
      } catch (parseError) {
        console.error('❌ Erreur parsing réponse Brevo:', parseError)
        errorMessage = `HTTP ${brevoResponse.status}: ${responseText}`
      }
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: errorMessage,
          status: brevoResponse.status,
          details: responseText
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let brevoResult
    try {
      brevoResult = JSON.parse(responseText)
    } catch (parseError) {
      console.warn('⚠️ Impossible de parser la réponse Brevo, mais status OK')
      brevoResult = { messageId: 'unknown' }
    }

    console.log('✅ Email envoyé avec succès via Brevo')
    console.log('📧 Message ID:', brevoResult.messageId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: brevoResult.messageId,
        provider: 'brevo',
        to: to_email,
        subject: subject
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erreur envoi email Brevo:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: 'Erreur inattendue lors de l\'envoi de l\'email'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
