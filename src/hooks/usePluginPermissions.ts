import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { TeamMemberPluginAccess } from '../types/plugin';

export function usePluginPermissions() {
  const [loading, setLoading] = useState(false);

  const getTeamMemberPluginPermissions = useCallback(async (
    ownerId: string,
    memberId: string
  ): Promise<TeamMemberPluginAccess[]> => {
    if (!supabase) {
      console.log('⚠️ Supabase non configuré');
      return [];
    }

    try {
      console.log('🔍 Chargement permissions plugins:', { ownerId, memberId });

      const { data, error } = await supabase
        .rpc('get_team_member_plugin_permissions', {
          p_owner_id: ownerId,
          p_member_id: memberId
        });

      if (error) {
        console.error('❌ Erreur RPC:', error);
        throw error;
      }

      console.log('✅ Permissions chargées:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Erreur chargement permissions:', error);
      throw error;
    }
  }, []);

  const bulkUpdatePluginPermissions = useCallback(async (
    memberId: string,
    updates: Array<{ pluginId: string; canAccess: boolean }>
  ) => {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }

    try {
      console.log('🔄 Mise à jour permissions:', { memberId, count: updates.length });

      // Récupérer l'owner_id depuis team_members
      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .select('owner_id')
        .eq('id', memberId)
        .single();

      if (memberError) throw memberError;

      const ownerId = memberData.owner_id;

      // Mettre à jour ou créer les permissions
      for (const update of updates) {
        const { error: upsertError } = await supabase
          .from('team_member_plugin_permissions')
          .upsert({
            team_member_id: memberId,  // ✅ CORRECT : team_member_id
            owner_id: ownerId,
            plugin_id: update.pluginId,
            can_access: update.canAccess,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'team_member_id,owner_id,plugin_id'  // ✅ CORRECT
          });

        if (upsertError) {
          console.error('❌ Erreur upsert permission:', upsertError);
          throw upsertError;
        }
      }

      console.log('✅ Permissions mises à jour');
    } catch (error) {
      console.error('❌ Erreur mise à jour permissions:', error);
      throw error;
    }
  }, []);

  return {
    loading,
    getTeamMemberPluginPermissions,
    bulkUpdatePluginPermissions
  };
}
