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
    console.log('🔄 Début invitation membre d\'équipe...')
    
    // Créer le client Supabase avec la clé service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('❌ Header Authorization manquant')
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: corsHeaders }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      console.error('❌ Authentification invalide:', authError?.message)
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: corsHeaders }
      )
    }

    console.log('✅ Utilisateur authentifié:', user.email)

    // Lire les données de la requête
    const { owner_id, email, password, full_name, role_name, permissions } = await req.json()

    if (!owner_id || !email || !password) {
      console.error('❌ Données manquantes')
      return new Response(
        JSON.stringify({ error: 'owner_id, email and password are required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Vérifier que l'utilisateur est bien le propriétaire
    if (user.id !== owner_id) {
      console.error('❌ Utilisateur non autorisé')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: corsHeaders }
      )
    }

    console.log('🔄 Création utilisateur pour équipe:', email)

    // Vérifier si l'utilisateur existe déjà
    const { data: existingUsers, error: listError } = await supabaseClient.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Erreur récupération utilisateurs:', listError)
      return new Response(
        JSON.stringify({ error: 'Failed to check existing users' }),
        { status: 500, headers: corsHeaders }
      )
    }

    const existingUser = existingUsers.users.find(u => u.email === email.trim().toLowerCase())
    let targetUserId: string

    if (existingUser) {
      console.log('👤 Utilisateur existant trouvé:', existingUser.id)
      
      // Vérifier si l'utilisateur est déjà membre de cette équipe
      const { data: existingMember, error: memberCheckError } = await supabaseClient
        .from('team_members')
        .select('id')
        .eq('owner_id', owner_id)
        .eq('user_id', existingUser.id)
        .single()

      if (!memberCheckError && existingMember) {
        console.log('⚠️ Utilisateur déjà membre de l\'équipe')
        return new Response(
          JSON.stringify({ error: 'User is already a member of this team' }),
          { status: 400, headers: corsHeaders }
        )
      }

      targetUserId = existingUser.id
      console.log('✅ Utilisateur existant sera ajouté à l\'équipe')
    } else {
      // Créer un nouvel utilisateur
      console.log('🆕 Création nouvel utilisateur')
      const { data: authData, error: authError2 } = await supabaseClient.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: full_name || null
        }
      })

      if (authError2) {
        console.error('❌ Erreur création auth user:', authError2)
        return new Response(
          JSON.stringify({ error: authError2.message }),
          { status: 400, headers: corsHeaders }
        )
      }

      if (!authData.user) {
        console.error('❌ Aucun utilisateur retourné')
        return new Response(
          JSON.stringify({ error: 'Failed to create user' }),
          { status: 500, headers: corsHeaders }
        )
      }

      targetUserId = authData.user.id
      console.log('✅ Nouvel utilisateur créé:', targetUserId)

      // Créer l'entrée dans la table users pour le nouvel utilisateur
      // Récupérer les informations d'abonnement du créateur (compte principal)
      console.log('🔍 Récupération statut abonnement du propriétaire...')
      const { data: creatorData, error: creatorError } = await supabaseClient
        .from('users')
        .select('subscription_status, trial_ends_at')
        .eq('id', user.id)
        .single()

      let inheritedSubscriptionStatus = 'trial'
      let inheritedTrialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

      if (!creatorError && creatorData) {
        console.log('📊 Données du créateur récupérées:', creatorData)
        
        // Hériter EXACTEMENT du même statut que le propriétaire
        inheritedSubscriptionStatus = creatorData.subscription_status || 'trial'
        inheritedTrialEndsAt = creatorData.trial_ends_at
        
        console.log('✅ Héritage EXACT du statut propriétaire:', {
          status: inheritedSubscriptionStatus,
          trial_ends_at: inheritedTrialEndsAt
        })
      } else {
        console.warn('⚠️ Impossible de récupérer les données du créateur, utilisation des valeurs par défaut')
      }

      const { error: userError } = await supabaseClient
        .from('users')
        .insert([{
          id: targetUserId,
          email: email.trim().toLowerCase(),
          full_name: full_name || null,
          is_super_admin: false,
          subscription_status: inheritedSubscriptionStatus,
          trial_started_at: new Date().toISOString(),
          trial_ends_at: inheritedTrialEndsAt
        }])

      if (userError && !userError.message.includes('duplicate key')) {
        console.error('❌ Erreur création profil utilisateur:', userError)
        // Nettoyer l'utilisateur auth
        await supabaseClient.auth.admin.deleteUser(targetUserId)
        return new Response(
          JSON.stringify({ error: userError.message }),
          { status: 400, headers: corsHeaders }
        )
      }

      console.log('✅ Profil utilisateur créé')
    }

    // Ajouter le membre à l'équipe
    const { data: memberData, error: memberError } = await supabaseClient
      .from('team_members')
      .insert([{
        owner_id: owner_id,
        user_id: targetUserId,
        email: email.trim().toLowerCase(),
        full_name: full_name || null,
        permissions: permissions || [],
        invited_by: user.id,
        joined_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (memberError) {
      console.error('❌ Erreur ajout membre équipe:', memberError)
      // Nettoyer l'utilisateur créé seulement si c'était un nouvel utilisateur
      if (!existingUser) {
        await supabaseClient.auth.admin.deleteUser(targetUserId)
        await supabaseClient.from('users').delete().eq('id', targetUserId)
      }
      return new Response(
        JSON.stringify({ error: memberError.message }),
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('✅ Membre ajouté à l\'équipe avec succès')

    return new Response(
      JSON.stringify({ 
        success: true, 
        member: memberData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erreur invitation membre:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
