import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface BlockedDateRange {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  created_at: string;
  updated_at: string;
}

export function useBlockedDateRanges() {
  const { user } = useAuth();
  const [blockedRanges, setBlockedRanges] = useState<BlockedDateRange[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlockedRanges = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setBlockedRanges([]);
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Chargement plages bloquées pour:', user.email);

      // Déterminer l'ID du propriétaire
      let targetUserId = user.id;
      
      const { data: membershipData } = await supabase!
        .from('team_members')
        .select('owner_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (membershipData?.owner_id) {
        targetUserId = membershipData.owner_id;
      }

      const { data, error } = await supabase!
        .from('blocked_date_ranges')
        .select('*')
        .eq('user_id', targetUserId)
        .order('start_date', { ascending: true });

      if (error) throw error;

      console.log('✅ Plages bloquées chargées:', data?.length || 0);
      setBlockedRanges(data || []);
    } catch (error) {
      console.error('❌ Erreur chargement plages bloquées:', error);
      setBlockedRanges([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addBlockedRange = useCallback(async (
    startDate: string,
    endDate: string,
    reason?: string
  ) => {
    if (!user || !isSupabaseConfigured) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      // Déterminer l'ID du propriétaire
      let targetUserId = user.id;
      
      const { data: membershipData } = await supabase!
        .from('team_members')
        .select('owner_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (membershipData?.owner_id) {
        targetUserId = membershipData.owner_id;
      }

      const { data, error } = await supabase!
        .from('blocked_date_ranges')
        .insert({
          user_id: targetUserId,
          start_date: startDate,
          end_date: endDate,
          reason: reason || null
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Plage bloquée ajoutée:', data.id);
      await fetchBlockedRanges();
      return data;
    } catch (error) {
      console.error('❌ Erreur ajout plage bloquée:', error);
      throw error;
    }
  }, [user, fetchBlockedRanges]);

  const updateBlockedRange = useCallback(async (
    id: string,
    updates: Partial<Pick<BlockedDateRange, 'start_date' | 'end_date' | 'reason'>>
  ) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase non configuré');
    }

    try {
      const { data, error } = await supabase!
        .from('blocked_date_ranges')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Plage bloquée mise à jour:', id);
      await fetchBlockedRanges();
      return data;
    } catch (error) {
      console.error('❌ Erreur mise à jour plage bloquée:', error);
      throw error;
    }
  }, [fetchBlockedRanges]);

  const deleteBlockedRange = useCallback(async (id: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase non configuré');
    }

    try {
      const { error } = await supabase!
        .from('blocked_date_ranges')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('✅ Plage bloquée supprimée:', id);
      await fetchBlockedRanges();
    } catch (error) {
      console.error('❌ Erreur suppression plage bloquée:', error);
      throw error;
    }
  }, [fetchBlockedRanges]);

  const isDateBlocked = useCallback((date: string): boolean => {
    const checkDate = new Date(date);
    
    return blockedRanges.some(range => {
      const startDate = new Date(range.start_date);
      const endDate = new Date(range.end_date);
      return checkDate >= startDate && checkDate <= endDate;
    });
  }, [blockedRanges]);

  useEffect(() => {
    fetchBlockedRanges();
  }, [fetchBlockedRanges]);

  return {
    blockedRanges,
    loading,
    addBlockedRange,
    updateBlockedRange,
    deleteBlockedRange,
    isDateBlocked,
    refetch: fetchBlockedRanges
  };
}
