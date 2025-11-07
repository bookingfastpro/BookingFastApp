import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface MultiUserSetting {
  id: string;
  user_id: string;
  team_member_id: string;
  restricted_visibility: boolean;
  created_at: string;
  updated_at: string;
}

export function useMultiUserSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<MultiUserSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    if (!user || !supabase) {
      setSettings([]);
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Chargement paramètres pour user:', user.id);
      
      // ✅ CORRECTION : Lire depuis team_members
      const { data, error } = await supabase
        .from('team_members')
        .select('id, user_id, restricted_visibility, created_at, updated_at')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur chargement:', error);
        throw error;
      }
      
      console.log('✅ Paramètres chargés:', data);
      
      // Mapper vers le format attendu
      const mappedData = (data || []).map(member => ({
        id: member.id,
        user_id: member.user_id,
        team_member_id: member.id,
        restricted_visibility: member.restricted_visibility || false,
        created_at: member.created_at,
        updated_at: member.updated_at
      }));
      
      setSettings(mappedData);
    } catch (error) {
      console.error('❌ Erreur chargement paramètres multi-user:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (teamMemberId: string, restrictedVisibility: boolean) => {
    if (!user || !supabase) {
      throw new Error('Utilisateur non connecté ou Supabase non configuré');
    }

    try {
      console.log('🔄 Mise à jour team_members:', { 
        team_member_id: teamMemberId, 
        restricted_visibility: restrictedVisibility 
      });

      // ✅ CORRECTION : Mettre à jour team_members.restricted_visibility
      const { error: updateError } = await supabase
        .from('team_members')
        .update({
          restricted_visibility: restrictedVisibility,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamMemberId);

      if (updateError) {
        console.error('❌ Erreur UPDATE team_members:', updateError);
        throw updateError;
      }
      
      console.log('✅ UPDATE team_members réussi');

      await fetchSettings();
    } catch (error) {
      console.error('❌ Erreur mise à jour paramètre:', error);
      throw error;
    }
  };

  const getSettingForMember = (teamMemberId: string): boolean => {
    const setting = settings.find(s => s.team_member_id === teamMemberId);
    return setting?.restricted_visibility || false;
  };

  useEffect(() => {
    fetchSettings();
  }, [user?.id]);

  return {
    settings,
    loading,
    updateSetting,
    getSettingForMember,
    refetch: fetchSettings
  };
}
