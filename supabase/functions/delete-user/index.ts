import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Non autorisé');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Non autorisé');
    }

    // Vérifier que l'utilisateur est super admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.is_super_admin) {
      throw new Error('Accès refusé - Super Admin requis');
    }

    // Récupérer l'ID de l'utilisateur à supprimer
    const { user_id } = await req.json();

    if (!user_id) {
      throw new Error('ID utilisateur manquant');
    }

    console.log('Suppression utilisateur:', user_id);

    // 1. Supprimer les abonnements
    const { error: subscriptionsError } = await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('user_id', user_id);

    if (subscriptionsError) {
      console.error('Erreur suppression abonnements:', subscriptionsError);
    }

    // 2. Supprimer les plugin_subscriptions
    const { error: pluginSubsError } = await supabaseAdmin
      .from('plugin_subscriptions')
      .delete()
      .eq('user_id', user_id);

    if (pluginSubsError) {
      console.error('Erreur suppression plugin_subscriptions:', pluginSubsError);
    }

    // 3. Supprimer les réservations
    const { error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('user_id', user_id);

    if (bookingsError) {
      console.error('Erreur suppression réservations:', bookingsError);
    }

    // 4. Supprimer les services
    const { error: servicesError } = await supabaseAdmin
      .from('services')
      .delete()
      .eq('user_id', user_id);

    if (servicesError) {
      console.error('Erreur suppression services:', servicesError);
    }

    // 5. Supprimer les clients
    const { error: clientsError } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('user_id', user_id);

    if (clientsError) {
      console.error('Erreur suppression clients:', clientsError);
    }

    // 6. Supprimer de la table users
    const { error: userDeleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', user_id);

    if (userDeleteError) {
      console.error('Erreur suppression users:', userDeleteError);
      throw userDeleteError;
    }

    // 7. Supprimer de auth.users
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

    if (authDeleteError) {
      console.error('Erreur suppression auth.users:', authDeleteError);
      // On continue même si ça échoue
    }

    console.log('Utilisateur supprimé avec succès');

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erreur:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
