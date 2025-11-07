import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Unavailability } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { unavailabilityEvents } from '../lib/unavailabilityEvents';

export function useUnavailabilities() {
  const { user } = useAuth();
  const [unavailabilities, setUnavailabilities] = useState<Unavailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnavailabilities = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setUnavailabilities([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let targetUserId = user.id;
      
      try {
        const { data: membershipData } = await supabase!
          .from('team_members')
          .select('owner_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (membershipData?.owner_id) {
          targetUserId = membershipData.owner_id;
        }
      } catch (teamError) {
        console.warn('Erreur vérification équipe:', teamError);
      }

      const { data, error } = await supabase!
        .from('unavailabilities')
        .select('*')
        .eq('user_id', targetUserId)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('❌ useUnavailabilities.fetchUnavailabilities - Erreur Supabase:', error);
        throw error;
      }

      console.log('✅ useUnavailabilities.fetchUnavailabilities - Données chargées:', data?.length || 0);
      setUnavailabilities(data || []);
    } catch (err) {
      console.error('❌ useUnavailabilities.fetchUnavailabilities - Erreur:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
      setUnavailabilities([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const addUnavailability = async (unavailabilityData: Omit<Unavailability, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!isSupabaseConfigured || !user) {
      throw new Error('Supabase non configuré ou utilisateur non connecté');
    }

    try {
      console.log('➕ useUnavailabilities.addUnavailability - Début création');

      let targetUserId = user.id;
      
      try {
        const { data: membershipData } = await supabase!
          .from('team_members')
          .select('owner_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (membershipData?.owner_id) {
          targetUserId = membershipData.owner_id;
        }
      } catch (teamError) {
        console.warn('Erreur vérification équipe:', teamError);
      }

      const insertData = { 
        ...unavailabilityData, 
        user_id: targetUserId 
      };

      const { data, error } = await supabase!
        .from('unavailabilities')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('❌ useUnavailabilities.addUnavailability - Erreur Supabase:', error);
        throw error;
      }

      console.log('✅ useUnavailabilities.addUnavailability - Création réussie:', data);

      if (data) {
        setUnavailabilities(prev => [...prev, data]);
        unavailabilityEvents.emit('unavailabilityCreated', data);
        return data;
      }
    } catch (err) {
      console.error('❌ useUnavailabilities.addUnavailability - Erreur:', err);
      throw err;
    }
  };

  const updateUnavailability = async (id: string, updates: Partial<Unavailability>) => {
    if (!isSupabaseConfigured || !user) {
      throw new Error('Supabase non configuré ou utilisateur non connecté');
    }

    try {
      console.log('🔄 useUnavailabilities.updateUnavailability - Début mise à jour ID:', id);

      const { data, error } = await supabase!
        .from('unavailabilities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ useUnavailabilities.updateUnavailability - Erreur Supabase:', error);
        throw error;
      }

      console.log('✅ useUnavailabilities.updateUnavailability - Mise à jour réussie:', data);

      if (data) {
        setUnavailabilities(prev => prev.map(u => u.id === id ? data : u));
        unavailabilityEvents.emit('unavailabilityUpdated', data);
        return data;
      }
    } catch (err) {
      console.error('❌ useUnavailabilities.updateUnavailability - Erreur:', err);
      throw err;
    }
  };

  const deleteUnavailability = async (id: string) => {
    if (!isSupabaseConfigured || !user) {
      throw new Error('Supabase non configuré ou utilisateur non connecté');
    }

    try {
      console.log('🗑️ useUnavailabilities.deleteUnavailability - Début suppression ID:', id);
      
      const { error } = await supabase!
        .from('unavailabilities')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ useUnavailabilities.deleteUnavailability - Erreur Supabase:', error);
        throw error;
      }

      console.log('✅ useUnavailabilities.deleteUnavailability - Suppression DB réussie');
      
      setUnavailabilities(prev => {
        const filtered = prev.filter(u => u.id !== id);
        console.log('📊 useUnavailabilities.deleteUnavailability - Avant:', prev.length, 'Après:', filtered.length);
        return filtered;
      });
      
      unavailabilityEvents.emit('unavailabilityDeleted', { id });
      console.log('📢 useUnavailabilities.deleteUnavailability - Événement émis');
    } catch (err) {
      console.error('❌ useUnavailabilities.deleteUnavailability - Erreur:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnavailabilities();
    } else {
      setUnavailabilities([]);
      setLoading(false);
    }
  }, [user?.id, fetchUnavailabilities]);

  return {
    unavailabilities,
    loading,
    error,
    refetch: fetchUnavailabilities,
    addUnavailability,
    updateUnavailability,
    deleteUnavailability
  };
}
