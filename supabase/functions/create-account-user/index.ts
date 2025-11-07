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
    console.log('🔄 Début création utilisateur compte...')
    
    // Validate required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variables d\'environnement manquantes')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: corsHeaders }
      )
    }

    // Create Supabase client with service role key
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('❌ Header Authorization manquant')
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: corsHeaders }
      )
    }

    const userToken = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(userToken)
    
    if (userError || !user) {
      console.error('❌ Authentification invalide:', userError?.message)
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: corsHeaders }
      )
    }

    console.log('✅ Utilisateur authentifié:', user.email)

    // Parse request body
    const requestData = await req.json()
    const { email, password, full_name, role, permissions } = requestData

    if (!email || !password) {
      console.error('❌ Email ou mot de passe manquant')
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('📧 Création utilisateur pour email:', email)

    // Get account owner's subscription info to inherit
    console.log('🔍 Récupération infos abonnement du propriétaire...')
    const { data: ownerProfile, error: ownerError } = await supabaseClient
      .from('users')
      .select('subscription_status, trial_ends_at')
      .eq('id', user.id)
      .single()

    let inheritedStatus = 'trial'
    let inheritedTrialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    if (ownerError) {
      console.warn('⚠️ Impossible de récupérer les infos du propriétaire, utilisation des valeurs par défaut:', ownerError.message)
    } else if (ownerProfile) {
      console.log('✅ Infos propriétaire récupérées:', ownerProfile)
      inheritedStatus = ownerProfile.subscription_status || 'trial'
      inheritedTrialEnd = ownerProfile.trial_ends_at || inheritedTrialEnd
    }

    // Create user in auth.users
    console.log('🔄 Création utilisateur auth...')
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || null
      }
    })

    if (authError) {
      console.error('❌ Erreur création auth user:', authError)
      return new Response(
        JSON.stringify({ 
          error: `Auth creation failed: ${authError.message}`,
          details: authError
        }),
        { status: 400, headers: corsHeaders }
      )
    }

    if (!authData?.user) {
      console.error('❌ Aucun utilisateur retourné par auth.admin.createUser')
      return new Response(
        JSON.stringify({ error: 'No user data returned from auth creation' }),
        { status: 500, headers: corsHeaders }
      )
    }

    console.log('✅ Utilisateur auth créé:', authData.user.id)

    // Récupérer les informations d'abonnement du propriétaire du compte
    console.log('🔍 Récupération statut abonnement du propriétaire...')
    const { data: ownerData, error: ownerError } = await supabaseClient
      .from('users')
      .select('subscription_status, trial_ends_at')
      .eq('id', user.id)
      .single()

    let inheritedSubscriptionStatus = 'trial'
    let inheritedTrialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    if (!ownerError && ownerData) {
      console.log('📊 Données du propriétaire récupérées:', ownerData)
      
      // Hériter EXACTEMENT du même statut que le propriétaire
      inheritedSubscriptionStatus = ownerData.subscription_status || 'trial'
      inheritedTrialEndsAt = ownerData.trial_ends_at
      
      console.log('✅ Héritage EXACT du statut propriétaire:', {
        status: inheritedSubscriptionStatus,
        trial_ends_at: inheritedTrialEndsAt
      })
    } else {
      console.warn('⚠️ Impossible de récupérer les données du propriétaire, utilisation des valeurs par défaut')
    }

    // Create user profile in public.users with all required fields
    console.log('🔄 Création profil utilisateur...')
    const userProfileData = {
      id: authData.user.id,
    }
    
    // Use upsert to handle cases where user profile might already exist
    const { data: profileData, error: profileError } = await supabaseClient
      .from('users')
      .upsert([{
        id: authData.user.id,
        email: email.trim().toLowerCase(),
        full_name: full_name || null,
        is_super_admin: false,
        subscription_status: inheritedStatus,
        trial_started_at: new Date().toISOString(),
        trial_ends_at: inheritedTrialEnd,
        updated_at: new Date().toISOString()
      }], {
        onConflict: 'id'
      })
      .select()
      .single()

    if (profileError) {
      console.error('❌ Erreur création profil utilisateur:', profileError)
      console.error('❌ Détails erreur:', {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code
      })
      
      // Clean up auth user if profile creation fails
      try {
        await supabaseClient.auth.admin.deleteUser(authData.user.id)
        console.log('🧹 Utilisateur auth nettoyé après échec profil')
      } catch (cleanupError) {
        console.error('❌ Erreur nettoyage:', cleanupError)
      }
      
      return new Response(
        JSON.stringify({ 
          error: `Failed to create user profile: ${profileError.message}`,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        }),
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('✅ Profil utilisateur créé:', profileData?.id)

    // Add user to account_users table
    console.log('🔄 Ajout utilisateur au compte...')
    const { error: accountUserError } = await supabaseClient
    console.log('✅ Profil utilisateur créé avec héritage d\'abonnement')
      .insert([{
        account_id: user.id, // Using the authenticated user's ID as account_id
        user_id: authData.user.id,
        email: email.trim().toLowerCase(),
        full_name: full_name || null,
        role: role || 'employee',
        permissions: permissions || [],
        email: email,
        full_name: full_name || null,
        subscription_status: inheritedSubscriptionStatus,
        trial_started_at: new Date().toISOString(),
        is_active: true,
        trial_ends_at: inheritedTrialEndsAt
      }])

    if (accountUserError) {
      console.error('❌ Erreur ajout utilisateur au compte:', accountUserError)
      // Don't fail completely, but log the error
      console.warn('⚠️ Utilisateur créé mais pas ajouté au compte')
    } else {
      console.log('✅ Utilisateur ajouté au compte avec succès')
    }

    // Assign roles if provided
    if (role && permissions && Array.isArray(permissions)) {
      console.log('🔄 Attribution des permissions...')
      
      try {
    console.log('🎉 Utilisateur de compte créé avec succès:')
    console.log('  - Email:', email)
    console.log('  - Statut abonnement hérité:', inheritedSubscriptionStatus)
    console.log('  - Fin essai héritée:', inheritedTrialEndsAt || 'Aucune (abonnement actif)')
    console.log('  - Rôle:', role || 'member')
    console.log('  - Permissions:', permissions?.length || 0)

        // Check if roles table exists and create role if needed
        const { data: existingRole, error: roleCheckError } = await supabaseClient
          .from('roles')
          .select('id')
          .eq('id', role)
          .single()

        if (roleCheckError && roleCheckError.code === 'PGRST116') {
          // Role doesn't exist, create it
          console.log('🔄 Création du rôle:', role)
          const { error: roleCreateError } = await supabaseClient
            .from('roles')
            .insert([{
              id: role,
              name: role.charAt(0).toUpperCase() + role.slice(1),
              description: `Rôle ${role}`,
              permissions: permissions,
              is_default: false
            }])

          if (roleCreateError) {
            console.warn('⚠️ Impossible de créer le rôle:', roleCreateError.message)
          }
        }

        // Assign role to user
        const { error: roleAssignError } = await supabaseClient
          .from('user_roles')
          .insert([{
            user_id: authData.user.id,
            role_id: role,
            granted_by: user.id
          }])

        if (roleAssignError) {
          console.warn('⚠️ Impossible d\'assigner le rôle:', roleAssignError.message)
          // Don't fail the entire operation for role assignment
        } else {
          console.log('✅ Rôle assigné avec succès')
        }
      } catch (roleError) {
        console.warn('⚠️ Erreur gestion des rôles:', roleError)
        // Continue without failing
      }
    }

    console.log('🎉 Utilisateur créé avec succès!')

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: authData.user.id,
          email: email.trim().toLowerCase(),
          full_name: full_name || null,
          subscription_status: inheritedSubscriptionStatus,
          trial_ends_at: inheritedTrialEndsAt,
          subscription_status: inheritedStatus,
          trial_ends_at: inheritedTrialEnd
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erreur inattendue:', error)
    return new Response(
      JSON.stringify({ 
        error: `Unexpected error: ${error.message}`,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
