import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔔 Demande de liste des utilisateurs reçue')
    
    // Créer le client Supabase avec la clé service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Vérifier l'authentification de l'utilisateur qui fait la demande
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('❌ Header Authorization manquant')
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: corsHeaders }
      )
    }

    // Vérifier que l'utilisateur actuel a les permissions d'admin
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

    // Vérifier si l'utilisateur a les permissions d'admin
    let isAdmin = false;
    try {
      const { data: userData, error: userError } = await supabaseClient
        .from('users')
        .select('is_super_admin')
        .eq('id', user.id)
        .single()

      if (userError) {
        console.warn('⚠️ Erreur vérification permissions, vérification fallback...')
        // Fallback: vérifier si c'est le premier utilisateur
        const { count, error: countError } = await supabaseClient
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        if (!countError && count === 0) {
          console.log('🎯 Premier utilisateur - accès accordé')
          isAdmin = true;
        }
      } else {
        isAdmin = userData?.is_super_admin === true;
        console.log('✅ Vérification permissions - Super admin:', isAdmin)
      }
    } catch (permError) {
      console.error('❌ Erreur critique permissions:', permError)
      isAdmin = false;
    }

    if (!isAdmin) {
      console.log('❌ Accès refusé - utilisateur non admin:', user.email)
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: corsHeaders }
      )
    }

    console.log('🔄 Récupération de tous les utilisateurs...')

    // Récupérer tous les utilisateurs depuis auth.users avec les privilèges service role
    const { data: authUsers, error: authError2 } = await supabaseClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })
    
    if (authError2) {
      console.error('❌ Erreur récupération utilisateurs auth:', authError2)
      return new Response(
        JSON.stringify({ error: authError2.message }),
        { status: 500, headers: corsHeaders }
      )
    }

    console.log('✅ Utilisateurs auth récupérés:', authUsers?.users?.length || 0)

    // Récupérer les profils utilisateurs pour enrichir les données
    const { data: userProfiles, error: profilesError } = await supabaseClient
      .from('users')
      .select('id, email, full_name, is_super_admin, subscription_status, trial_started_at, trial_ends_at, created_at, updated_at')
      .limit(1000)
    
    if (profilesError) {
      console.warn('⚠️ Erreur chargement profils utilisateurs:', profilesError)
    }
    
    console.log('✅ Profils utilisateurs récupérés:', userProfiles?.length || 0)
    
    // Debug: Afficher tous les emails trouvés
    console.log('📧 Emails auth.users:', authUsers?.users?.map(u => u.email) || [])
    console.log('📧 Emails profils:', userProfiles?.map(u => u.email) || [])
    
    // Fusionner les données auth.users avec les profils
    const mergedUsers = authUsers?.users?.map(authUser => {
      const profile = userProfiles?.find(p => p.id === authUser.id);
      return {
        id: authUser.id,
        email: authUser.email || '',
        full_name: profile?.full_name || authUser.user_metadata?.full_name || '',
        is_super_admin: profile?.is_super_admin || false,
        subscription_status: profile?.subscription_status || 'trial',
        trial_started_at: profile?.trial_started_at || authUser.created_at,
        trial_ends_at: profile?.trial_ends_at,
        created_at: authUser.created_at || profile?.created_at || new Date().toISOString(),
        updated_at: profile?.updated_at || authUser.updated_at || new Date().toISOString()
      };
    }) || [];
    
    console.log('✅ Utilisateurs fusionnés:', mergedUsers.length)
    console.log('📋 Liste fusionnée:', mergedUsers.map(u => ({ email: u.email, is_super_admin: u.is_super_admin })))

    // Récupérer les rôles des utilisateurs
    const userIds = mergedUsers.map(u => u.id);
    let userRolesData = [];
    
    if (userIds.length > 0) {
      const { data: rolesData, error: rolesError } = await supabaseClient
        .from('user_roles')
        .select(`
          id, user_id, role_id, granted_by, created_at,
          role:roles(id, name, description, permissions, is_default, created_at, updated_at)
        `)
        .in('user_id', userIds)
        .limit(1000);

      if (rolesError) {
        console.warn('⚠️ Erreur chargement rôles utilisateurs:', rolesError)
      } else {
        userRolesData = rolesData || [];
        console.log('✅ Rôles utilisateurs récupérés:', userRolesData.length)
      }
    }

    // Fusionner les données utilisateurs avec leurs rôles
    const usersWithRoles = mergedUsers.map(user => ({
      ...user,
      roles: userRolesData.filter(userRole => userRole.user_id === user.id)
    }));

    console.log('✅ Données finales préparées:', usersWithRoles.length, 'utilisateurs')
    console.log('📋 Utilisateurs finaux:', usersWithRoles.map(u => ({ 
      email: u.email, 
      is_super_admin: u.is_super_admin,
      subscription_status: u.subscription_status 
    })))

    return new Response(
      JSON.stringify({ 
        success: true, 
        users: usersWithRoles,
        total: usersWithRoles.length,
        debug: {
          auth_users_count: authUsers?.users?.length || 0,
          profiles_count: userProfiles?.length || 0,
          merged_count: mergedUsers.length,
          final_count: usersWithRoles.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erreur liste utilisateurs:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Unexpected error during user listing'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
