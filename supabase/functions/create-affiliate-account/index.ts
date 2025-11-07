import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    console.log('🔄 Création compte affiliation...')
    
    // Créer le client Supabase avec la clé service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: corsHeaders }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: corsHeaders }
      )
    }

    console.log('✅ Utilisateur authentifié:', user.email)

    // Lire les données de la requête
    const { user_id } = await req.json()

    if (!user_id || user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Invalid user_id' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Vérifier si l'utilisateur a déjà un compte d'affiliation
    const { data: existingAffiliate, error: checkError } = await supabaseClient
      .from('affiliates')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (existingAffiliate && !checkError) {
      console.log('✅ Compte affiliation existant trouvé')
      return new Response(
        JSON.stringify({ 
          success: true, 
          affiliate: existingAffiliate,
          message: 'Compte d\'affiliation déjà existant'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Générer un code d'affiliation unique
    const { data: affiliateCode, error: codeError } = await supabaseClient
      .rpc('generate_affiliate_code')

    if (codeError || !affiliateCode) {
      console.error('❌ Erreur génération code:', codeError)
      return new Response(
        JSON.stringify({ error: 'Failed to generate affiliate code' }),
        { status: 500, headers: corsHeaders }
      )
    }

    console.log('✅ Code d\'affiliation généré:', affiliateCode)

    // Créer le compte d'affiliation
    const { data: newAffiliate, error: createError } = await supabaseClient
      .from('affiliates')
      .insert([{
        user_id: user_id,
        affiliate_code: affiliateCode,
        total_referrals: 0,
        successful_conversions: 0,
        total_commissions: 0,
        pending_commissions: 0,
        paid_commissions: 0,
        is_active: true
      }])
      .select()
      .single()

    if (createError) {
      console.error('❌ Erreur création compte affiliation:', createError)
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('✅ Compte affiliation créé avec succès')

    return new Response(
      JSON.stringify({ 
        success: true, 
        affiliate: newAffiliate,
        message: 'Compte d\'affiliation créé avec succès'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erreur création compte affiliation:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
