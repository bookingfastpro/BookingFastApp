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

  // Supabase Realtime subscription pour synchronisation multi-appareils
  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;

    let targetUserId = user.id;
    let channelName = `unavailabilities:${user.id}`;

    // Fonction pour obtenir le targetUserId
    const setupSubscription = async () => {
      try {
        const { data: membershipData } = await supabase!
          .from('team_members')
          .select('owner_id, restricted_visibility')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (membershipData?.owner_id) {
          targetUserId = membershipData.owner_id;
          channelName = `unavailabilities:${targetUserId}`;
        }

        const isRestrictedMember = membershipData?.restricted_visibility === true;

        // S'abonner aux changements de la table unavailabilities
        const channel = supabase!
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'unavailabilities',
              filter: `user_id=eq.${targetUserId}`
            },
            async (payload) => {
              console.log('🔄 Realtime unavailability event:', payload.eventType, payload);

              if (payload.eventType === 'INSERT') {
                const newUnavailability = payload.new as Unavailability;

                // Vérifier si c'est pour cet utilisateur (restricted member)
                if (isRestrictedMember && newUnavailability.assigned_user_id !== user.id) {
                  return;
                }

                setUnavailabilities((prev) => {
                  // Éviter les duplications
                  if (prev.some(u => u.id === newUnavailability.id)) {
                    return prev;
                  }
                  return [...prev, newUnavailability];
                });
              } else if (payload.eventType === 'UPDATE') {
                const updatedUnavailability = payload.new as Unavailability;

                // Vérifier si c'est pour cet utilisateur (restricted member)
                if (isRestrictedMember && updatedUnavailability.assigned_user_id !== user.id) {
                  return;
                }

                setUnavailabilities((prev) =>
                  prev.map((u) =>
                    u.id === updatedUnavailability.id ? updatedUnavailability : u
                  )
                );
              } else if (payload.eventType === 'DELETE') {
                setUnavailabilities((prev) => prev.filter((u) => u.id !== payload.old.id));
              }
            }
          )
          .subscribe((status) => {
            console.log('📡 Realtime unavailabilities subscription status:', status);
          });

        return () => {
          console.log('🔌 Unsubscribing from realtime channel:', channelName);
          supabase!.removeChannel(channel);
        };
      } catch (error) {
        console.error('❌ Erreur setup realtime unavailabilities:', error);
      }
    };

    const cleanup = setupSubscription();

    return () => {
      cleanup.then(fn => fn && fn());
    };
  }, [user?.id]);

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
