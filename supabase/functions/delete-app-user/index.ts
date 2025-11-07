import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
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

    // Vérifier si l'utilisateur a les permissions d'admin
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
      isAdmin = false;
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

    const { user_id } = requestData;

    if (!user_id) {
      console.error('❌ ID utilisateur manquant');
      console.error('📋 Données reçues:', requestData);
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('🗑️ Début suppression utilisateur:', user_id);

    // Vérifier si l'utilisateur à supprimer est un super admin
    const { data: userToDelete, error: userCheckError } = await supabaseClient
      .from('users')
      .select('email, is_super_admin')
      .eq('id', user_id)
      .single()

    if (!userCheckError && userToDelete) {
      console.log('👤 Utilisateur à supprimer:', userToDelete.email, 'Super admin:', userToDelete.is_super_admin)
      
      // Empêcher la suppression d'un super admin par un autre super admin
      if (userToDelete.is_super_admin && user_id !== user.id) {
        console.log('❌ Tentative de suppression d\'un super admin par un autre')
        return new Response(
          JSON.stringify({ error: 'Cannot delete another super admin' }),
          { status: 403, headers: corsHeaders }
        )
      }
    }

    // Supprimer les données liées à l'utilisateur dans l'ordre correct
    console.log('🔄 Suppression des données liées...')

    // 1. Supprimer les rédemptions de codes
    const { error: redemptionsError } = await supabaseClient
      .from('code_redemptions')
      .delete()
      .eq('user_id', user_id)

    if (redemptionsError) {
      console.warn('⚠️ Erreur suppression rédemptions:', redemptionsError)
    } else {
      console.log('✅ Rédemptions de codes supprimées')
    }

    // 2. Supprimer les abonnements
    const { error: subscriptionsError } = await supabaseClient
      .from('user_subscriptions')
      .delete()
      .eq('user_id', user_id)

    if (subscriptionsError) {
      console.warn('⚠️ Erreur suppression abonnements:', subscriptionsError)
    } else {
      console.log('✅ Abonnements supprimés')
    }

    // 3. Supprimer les données d'affiliation
    const { error: affiliateError } = await supabaseClient
      .from('affiliates')
      .delete()
      .eq('user_id', user_id)

    if (affiliateError) {
      console.warn('⚠️ Erreur suppression données affiliation:', affiliateError)
    } else {
      console.log('✅ Données d\'affiliation supprimées')
    }

    // 4. Supprimer les réservations
    const { error: bookingsError } = await supabaseClient
      .from('bookings')
      .delete()
      .eq('user_id', user_id)

    if (bookingsError) {
      console.warn('⚠️ Erreur suppression réservations:', bookingsError)
    } else {
      console.log('✅ Réservations supprimées')
    }

    // 5. Supprimer les services
    const { error: servicesError } = await supabaseClient
      .from('services')
      .delete()
      .eq('user_id', user_id)

    if (servicesError) {
      console.warn('⚠️ Erreur suppression services:', servicesError)
    } else {
      console.log('✅ Services supprimés')
    }

    // 6. Supprimer les clients
    const { error: clientsError } = await supabaseClient
      .from('clients')
      .delete()
      .eq('user_id', user_id)

    if (clientsError) {
      console.warn('⚠️ Erreur suppression clients:', clientsError)
    } else {
      console.log('✅ Clients supprimés')
    }

    // 7. Supprimer les paramètres business
    const { error: settingsError } = await supabaseClient
      .from('business_settings')
      .delete()
      .eq('user_id', user_id)

    if (settingsError) {
      console.warn('⚠️ Erreur suppression paramètres:', settingsError)
    } else {
      console.log('✅ Paramètres business supprimés')
    }

    // 8. Supprimer les membres d'équipe où cet utilisateur est propriétaire
    const { error: teamMembersError } = await supabaseClient
      .from('team_members')
      .delete()
      .eq('owner_id', user_id)

    if (teamMembersError) {
      console.warn('⚠️ Erreur suppression équipe:', teamMembersError)
    } else {
      console.log('✅ Équipe supprimée')
    }

    // 9. Supprimer les memberships où cet utilisateur est membre
    const { error: membershipError } = await supabaseClient
      .from('team_members')
      .delete()
      .eq('user_id', user_id)

    if (membershipError) {
      console.warn('⚠️ Erreur suppression membership:', membershipError)
    } else {
      console.log('✅ Membership supprimé')
    }

    // Supprimer d'abord les rôles de l'utilisateur
    const { error: rolesError } = await supabaseClient
      .from('user_roles')
      .delete()
      .eq('user_id', user_id);

    if (rolesError) {
      console.warn('⚠️ Erreur suppression rôles:', rolesError);
    } else {
      console.log('✅ Rôles utilisateur supprimés');
    }

    // Supprimer le profil utilisateur
    const { error: profileError } = await supabaseClient
      .from('users')
      .delete()
      .eq('id', user_id);

    if (profileError) {
      console.error('❌ Erreur suppression profil:', profileError);
      return new Response(
        JSON.stringify({ 
          error: profileError.message,
          details: 'Failed to delete user profile'
        }),
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('✅ Profil utilisateur supprimé');

    // Supprimer l'utilisateur auth (nécessite service role)
    try {
      const { error: authError } = await supabaseClient.auth.admin.deleteUser(user_id);
      if (authError) {
        console.error('❌ Erreur suppression auth user:', authError);
        return new Response(
          JSON.stringify({ 
            error: authError.message,
            details: 'Failed to delete authentication user'
          }),
          { status: 500, headers: corsHeaders }
        )
      } else {
        console.log('✅ Utilisateur auth supprimé');
      }
    } catch (authErr) {
      console.error('❌ Impossible de supprimer auth user:', authErr);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to delete authentication user',
          details: authErr.message
        }),
        { status: 500, headers: corsHeaders }
      )
    }

    console.log('✅ Utilisateur et toutes ses données supprimés avec succès');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User and all associated data deleted successfully',
        user_id: user_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erreur suppression utilisateur:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Unexpected error during user deletion',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
