import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TeamMember, TeamInvitation } from '../types/team';
import { Booking } from '../types';

interface UsageLimits {
  maxBookingsPerDay?: number;
  maxServicesPerBooking?: number;
  maxClientsTotal?: number;
}

interface UserRoleInfo {
  key: string;
  name: string;
  level: number;
}

export function useTeam() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const loadTeamData = async () => {
      if (!mounted || !user) {
        setLoading(false);
        return;
      }

      console.log('🔄 Chargement données équipe pour:', user.email);
      
      // Timeout de sécurité
      timeoutId = setTimeout(() => {
        if (mounted) {
          console.warn('⏰ Timeout chargement équipe - utilisation valeurs par défaut');
          setIsOwner(true);
          setOwnerId(user.id);
          setUserPermissions(['*']);
          setTeamMembers([]);
          setLoading(false);
        }
      }, 10000);

      await checkOwnerStatus();
      await fetchTeamData();
      
      clearTimeout(timeoutId);
    };

    if (user) {
      loadTeamData();
    } else {
      setLoading(false);
    }
    
    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user?.id]);

  const checkOwnerStatus = async () => {
    if (!supabase || !user) {
      setIsOwner(true);
      setOwnerId(user?.id || null);
      return;
    }

    try {
      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .select('owner_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (memberError && memberError.code !== 'PGRST116') {
        throw memberError;
      }

      if (memberData) {
        console.log('👥 Utilisateur est membre d\'équipe');
        setIsOwner(false);
        setOwnerId(memberData.owner_id);
      } else {
        console.log('👑 Utilisateur est propriétaire');
        setIsOwner(true);
        setOwnerId(user.id);
      }
    } catch (err) {
      console.error('Erreur vérification statut propriétaire:', err);
      setIsOwner(true);
      setOwnerId(user.id);
    }
  };

  const fetchTeamData = async () => {
    if (!supabase || !user) {
      setTeamMembers([]);
      setUserPermissions(['*']);
      setLoading(false);
      return;
    }

    try {
      setError(null);

      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .select('owner_id, permissions, role_name')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (memberError && memberError.code !== 'PGRST116') {
        throw memberError;
      }

      if (memberData) {
        console.log('✅ Permissions membre chargées:', memberData.permissions?.length || 0);
        setIsOwner(false);
        setOwnerId(memberData.owner_id);
        setUserPermissions(memberData.permissions || []);

        const { data: teamData, error: teamError } = await supabase
          .from('team_members')
          .select('*')
          .eq('owner_id', memberData.owner_id)
          .eq('is_active', true)
          .order('email');

        if (teamError) throw teamError;
        setTeamMembers(teamData || []);
      } else {
        console.log('✅ Propriétaire - permissions complètes');
        setIsOwner(true);
        setOwnerId(user.id);
        setUserPermissions(['*']);

        const { data: teamData, error: teamError } = await supabase
          .from('team_members')
          .select('*')
          .eq('owner_id', user.id)
          .eq('is_active', true)
          .order('email');

        if (teamError && teamError.code !== 'PGRST116') {
          throw teamError;
        }
        setTeamMembers(teamData || []);
      }
    } catch (err) {
      console.error('Erreur chargement données équipe:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
      setTeamMembers([]);
      setUserPermissions(['*']);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (isOwner) return true;
    if (userPermissions.includes('*')) return true;
    return userPermissions.includes(permission);
  };

  const canEditBooking = (booking: Booking): boolean => {
    if (isOwner) return true;
    if (!hasPermission('edit_booking')) return false;
    
    if (booking.assigned_user_id === user?.id) return true;
    
    return hasPermission('edit_all_bookings');
  };

  const canDeleteBooking = (booking: Booking): boolean => {
    if (isOwner) return true;
    if (!hasPermission('delete_booking')) return false;
    
    if (booking.assigned_user_id === user?.id) return true;
    
    return hasPermission('delete_all_bookings');
  };

  const canViewFinancialData = (): boolean => {
    if (isOwner) return true;
    return hasPermission('view_revenue') || hasPermission('view_payments');
  };

  const getUserRoleInfo = (): UserRoleInfo => {
    if (isOwner) {
      return {
        key: 'owner',
        name: 'Propriétaire',
        level: 10
      };
    }

    const permissionCount = userPermissions.length;
    const hasAllPermissions = userPermissions.includes('*');
    const hasManageSettings = hasPermission('manage_settings');
    const hasManageTeam = hasPermission('manage_team');
    const hasViewRevenue = hasPermission('view_revenue');

    if (hasAllPermissions) {
      return {
        key: 'admin',
        name: 'Administrateur',
        level: 9
      };
    }

    if (hasManageSettings && hasManageTeam) {
      return {
        key: 'manager',
        name: 'Manager',
        level: 7
      };
    }

    if (hasViewRevenue && permissionCount > 5) {
      return {
        key: 'employee',
        name: 'Employé',
        level: 5
      };
    }

    if (hasPermission('create_booking') && hasPermission('view_calendar')) {
      return {
        key: 'receptionist',
        name: 'Réceptionniste',
        level: 3
      };
    }

    return {
      key: 'viewer',
      name: 'Observateur',
      level: 1
    };
  };

  const getUsageLimits = (): UsageLimits => {
    if (isOwner) return {};

    return {
      maxBookingsPerDay: hasPermission('unlimited_bookings') ? undefined : 50,
      maxServicesPerBooking: 10,
      maxClientsTotal: hasPermission('unlimited_clients') ? undefined : 1000
    };
  };

  const inviteTeamMember = async (memberData: {
    email: string;
    full_name: string;
    role_name: string;
    permissions: string[];
  }) => {
    if (!supabase || !user) {
      throw new Error('Supabase non configuré');
    }

    if (!isOwner) {
      throw new Error('Seul le propriétaire peut inviter des membres');
    }

    try {
      console.log('📧 Création invitation pour:', memberData.email);

      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', memberData.email.toLowerCase())
        .maybeSingle();

      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }

      if (!existingUser) {
        throw new Error('Cet utilisateur n\'a pas de compte BookingFast. Il doit d\'abord créer un compte.');
      }

      const { data: existingMember, error: memberCheckError } = await supabase
        .from('team_members')
        .select('id')
        .eq('owner_id', user.id)
        .eq('user_id', existingUser.id)
        .maybeSingle();

      if (!memberCheckError && existingMember) {
        throw new Error('Cet utilisateur est déjà membre de votre équipe');
      }

      const { data: existingInvitation, error: invitationCheckError } = await supabase
        .from('team_invitations')
        .select('id')
        .eq('owner_id', user.id)
        .eq('email', memberData.email.toLowerCase())
        .eq('status', 'pending')
        .maybeSingle();

      if (!invitationCheckError && existingInvitation) {
        throw new Error('Une invitation est déjà en attente pour cet utilisateur');
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data: invitation, error: invitationError } = await supabase
        .from('team_invitations')
        .insert([{
          owner_id: user.id,
          email: memberData.email.toLowerCase(),
          firstname: memberData.full_name?.split(' ')[0] || null,
          lastname: memberData.full_name?.split(' ').slice(1).join(' ') || null,
          permissions: memberData.permissions,
          role_name: memberData.role_name,
          status: 'pending',
          expires_at: expiresAt.toISOString()
        }])
        .select()
        .single();

      if (invitationError) throw invitationError;

      console.log('✅ Invitation créée avec succès:', invitation.id);
      return invitation;
    } catch (err) {
      console.error('❌ Erreur invitation membre:', err);
      throw err;
    }
  };

  const updateMemberPermissions = async (
    memberId: string, 
    permissions: string[],
    roleName: string
  ) => {
    if (!supabase || !user) {
      throw new Error('Supabase non configuré');
    }

    if (!isOwner) {
      throw new Error('Seul le propriétaire peut modifier les permissions');
    }

    try {
      const { error } = await supabase
        .from('team_members')
        .update({ 
          permissions,
          role_name: roleName,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)
        .eq('owner_id', user.id);

      if (error) throw error;

      await fetchTeamData();
    } catch (err) {
      console.error('Erreur mise à jour permissions:', err);
      throw err;
    }
  };

  const removeMember = async (memberId: string) => {
    if (!supabase || !user) {
      throw new Error('Supabase non configuré');
    }

    if (!isOwner) {
      throw new Error('Seul le propriétaire peut retirer des membres');
    }

    try {
      const { error } = await supabase
        .from('team_members')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)
        .eq('owner_id', user.id);

      if (error) throw error;

      await fetchTeamData();
    } catch (err) {
      console.error('Erreur retrait membre:', err);
      throw err;
    }
  };

  return {
    teamMembers,
    userPermissions,
    isOwner,
    ownerId,
    loading,
    error,
    hasPermission,
    canEditBooking,
    canDeleteBooking,
    canViewFinancialData,
    getUserRoleInfo,
    getUsageLimits,
    inviteTeamMember,
    updateMemberPermissions,
    removeMember,
    refetch: fetchTeamData
  };
}
