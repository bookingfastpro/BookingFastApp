import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TeamInvitation } from '../types/team';

export function useTeamInvitations() {
  const { user } = useAuth();
  const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchInvitations();
    }
  }, [user]);

  const fetchInvitations = async () => {
    if (!isSupabaseConfigured || !user) {
      setPendingInvitations([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase!
        .from('team_invitations')
        .select('*')
        .eq('email', user.email)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('invited_at', { ascending: false });

      if (error) throw error;

      setPendingInvitations(data || []);
    } catch (err) {
      console.error('Erreur chargement invitations:', err);
      setPendingInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async (invitationId: string) => {
    if (!isSupabaseConfigured || !user) {
      throw new Error('Supabase non configuré');
    }

    try {
      const { error } = await supabase!.rpc('accept_team_invitation', {
        invitation_id: invitationId
      });

      if (error) throw error;

      await fetchInvitations();
    } catch (err) {
      console.error('Erreur acceptation invitation:', err);
      throw err;
    }
  };

  const rejectInvitation = async (invitationId: string) => {
    if (!isSupabaseConfigured || !user) {
      throw new Error('Supabase non configuré');
    }

    try {
      const { error } = await supabase!
        .from('team_invitations')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId)
        .eq('email', user.email);

      if (error) throw error;

      await fetchInvitations();
    } catch (err) {
      console.error('Erreur rejet invitation:', err);
      throw err;
    }
  };

  return {
    pendingInvitations,
    loading,
    acceptInvitation,
    rejectInvitation,
    refetch: fetchInvitations
  };
}
