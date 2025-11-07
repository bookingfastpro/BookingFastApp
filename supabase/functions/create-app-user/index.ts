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
    // Créer le client Supabase avec la clé service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Vérifier l'authentification de l'utilisateur qui fait la demande
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: corsHeaders }
      )
    }

    // Vérifier que l'utilisateur actuel a les permissions d'admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: corsHeaders }
      )
    }

    // Vérifier si l'utilisateur a les permissions d'admin avec gestion d'erreur
    let isAdmin = false;
    try {
      const { data: userData, error: userError } = await supabaseClient
        .from('users')
        .select('is_super_admin')
        .eq('id', user.id)
        .single()

      if (userError) {
        console.error('❌ Erreur vérification permissions:', userError);
        // En cas d'erreur, vérifier si c'est le premier utilisateur
        const { count, error: countError } = await supabaseClient
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        if (!countError && count === 0) {
          console.log('🎯 Premier utilisateur - accès accordé');
          isAdmin = true;
        } else {
          console.log('❌ Utilisateur non autorisé');
          isAdmin = false;
        }
      } else {
        isAdmin = userData?.is_super_admin === true;
        console.log('✅ Vérification permissions réussie - Super admin:', isAdmin);
      }
    } catch (permError) {
      console.error('❌ Erreur critique permissions:', permError);
      // Fallback: vérifier si c'est le premier utilisateur
      try {
        const { count, error: countError } = await supabaseClient
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        if (!countError && count === 0) {
          console.log('🎯 Premier utilisateur (fallback) - accès accordé');
          isAdmin = true;
        } else {
          isAdmin = false;
        }
      } catch (fallbackError) {
        console.error('❌ Erreur fallback:', fallbackError);
        isAdmin = false;
      }
    }

    if (!isAdmin) {
      console.log('❌ Accès refusé - utilisateur non admin:', user.email);
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: corsHeaders }
      )
    }

    // Lire les données de la requête
    let requestData;
    try {
      requestData = await req.json();
    } catch (jsonError) {
      console.error('❌ Erreur parsing JSON:', jsonError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { email, password, full_name, role_ids } = requestData;

    if (!email || !password) {
      console.error('❌ Données manquantes - email:', !!email, 'password:', !!password);
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validation mot de passe
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters long' }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('🔄 Création utilisateur:', email)

    // Créer l'utilisateur dans auth.users avec les privilèges admin
    const { data: authData, error: authError2 } = await supabaseClient.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || null
      }
    })

    if (authError2) {
      console.error('❌ Erreur création auth user:', authError2)
      return new Response(
        JSON.stringify({ 
          error: authError2.message,
          details: 'Failed to create authentication user'
        }),
        { status: 400, headers: corsHeaders }
      )
    }

    if (!authData.user) {
      console.error('❌ Aucun utilisateur retourné par auth.admin.createUser');
      return new Response(
        JSON.stringify({ error: 'Failed to create user - no user data returned' }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('✅ Utilisateur auth créé:', authData.user.id)

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
    // Créer l'entrée dans la table users
    const { data: userData2, error: userError2 } = await supabaseClient
      .from('users')
      .insert([{
        id: authData.user.id,
        email: email,
        full_name: full_name || null,
        is_super_admin: false,
        subscription_status: inheritedSubscriptionStatus,
        trial_started_at: new Date().toISOString(),
        trial_ends_at: inheritedTrialEndsAt
      }])
      .select()
      .single()

    if (userError2) {
      console.error('❌ Erreur création user profile:', userError2)
      // Nettoyer l'utilisateur auth si la création du profil échoue
      try {
        await supabaseClient.auth.admin.deleteUser(authData.user.id);
        console.log('🧹 Utilisateur auth nettoyé après échec profil');
      } catch (cleanupError) {
        console.error('❌ Erreur nettoyage utilisateur auth:', cleanupError);
      }
      return new Response(
        JSON.stringify({ 
          error: userError2.message,
          details: 'Failed to create user profile'
        }),
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('✅ Profil utilisateur créé')

    // Assigner les rôles si fournis
    if (role_ids && Array.isArray(role_ids) && role_ids.length > 0) {
      console.log('🔄 Assignation des rôles:', role_ids);
      const roleAssignments = role_ids.map(roleId => ({
        user_id: authData.user.id,
        role_id: roleId,
        granted_by: user.id
      }))

      const { error: rolesError } = await supabaseClient
        .from('user_roles')
        .insert(roleAssignments)

      if (rolesError) {
        console.error('❌ Erreur assignation rôles:', rolesError)
        // Ne pas échouer complètement pour les rôles, mais logger
        console.log('⚠️ Utilisateur créé mais rôles non assignés');
      } else {
        console.log('✅ Rôles assignés:', role_ids.length);
      }
    } else {
      console.log('ℹ️ Aucun rôle à assigner');
    }
    console.log('🎉 Utilisateur créé avec succès:')
    console.log('  - Email:', email)
    console.log('  - Statut abonnement hérité:', inheritedSubscriptionStatus)
    console.log('  - Fin essai héritée:', inheritedTrialEndsAt || 'Aucune (abonnement actif)')
    console.log('  - Rôles assignés:', role_ids?.length || 0)

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: authData.user.id,
          email: email,
          full_name: full_name,
          subscription_status: inheritedSubscriptionStatus,
          trial_ends_at: inheritedTrialEndsAt,
          created: true
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erreur création utilisateur:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Unexpected error during user creation',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
