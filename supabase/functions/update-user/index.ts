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

    // Récupérer les données de la requête
    const { user_id, updates } = await req.json();

    if (!user_id || !updates) {
      throw new Error('Paramètres manquants');
    }

    console.log('Mise à jour utilisateur:', user_id, updates);

    // Mettre à jour dans la table users
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        full_name: updates.full_name,
        is_super_admin: updates.is_super_admin,
        subscription_status: updates.subscription_status,
        trial_ends_at: updates.trial_ends_at,
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur mise à jour:', updateError);
      throw updateError;
    }

    // Si l'utilisateur n'existe pas dans la table users, le créer
    if (!updatedUser) {
      console.log('Utilisateur non trouvé dans users, création...');
      
      // Récupérer les infos depuis auth.users
      const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(user_id);
      
      if (authUserError || !authUser.user) {
        throw new Error('Utilisateur non trouvé dans auth.users');
      }

      // Créer l'entrée dans users
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: user_id,
          email: authUser.user.email,
          full_name: updates.full_name || authUser.user.user_metadata?.full_name,
          is_super_admin: updates.is_super_admin || false,
          subscription_status: updates.subscription_status || 'trial',
          trial_ends_at: updates.trial_ends_at || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: authUser.user.created_at,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Erreur création utilisateur:', insertError);
        throw insertError;
      }

      return new Response(
        JSON.stringify({ success: true, user: newUser }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, user: updatedUser }),
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
