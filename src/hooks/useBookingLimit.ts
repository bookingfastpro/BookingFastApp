import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface BookingLimitInfo {
  allowed: boolean;
  limit: number | null;
  current: number;
  remaining: number | null;
}

export function useBookingLimit() {
  const { user } = useAuth();
  const [limitInfo, setLimitInfo] = useState<BookingLimitInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkLimit = async () => {
    if (!user || !isSupabaseConfigured) {
      setLimitInfo(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let targetUserId = user.id;
      
      // Vérifier si l'utilisateur est membre d'une équipe
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
        console.warn('⚠️ Erreur vérification équipe:', teamError);
      }

      const { data, error: rpcError } = await supabase!
        .rpc('check_booking_limit', { user_id_param: targetUserId });

      if (rpcError) throw rpcError;

      setLimitInfo(data as BookingLimitInfo);
    } catch (err) {
      console.error('❌ Erreur vérification limite:', err);
      setError(err instanceof Error ? err.message : 'Erreur de vérification');
      setLimitInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkLimit();
    } else {
      setLimitInfo(null);
    }
  }, [user?.id]);

  return {
    limitInfo,
    loading,
    error,
    refetch: checkLimit,
    canCreateBooking: limitInfo?.allowed ?? true,
    isUnlimited: limitInfo?.limit === null
  };
}
