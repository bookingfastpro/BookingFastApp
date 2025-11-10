import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface TeamMember {
  id: string;
  user_id: string;
  owner_id: string;
  role: 'owner' | 'admin' | 'member';
  full_name: string;
  email: string;
  created_at: string;
}

interface TeamContextType {
  teamMembers: TeamMember[];
  currentUserRole: 'owner' | 'admin' | 'member' | null;
  isOwner: boolean;
  isAdmin: boolean;
  loading: boolean;
  refreshTeamMembers: () => Promise<void>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  let user = null;
  try {
    const auth = useAuth();
    user = auth.user;
  } catch (error) {
    // Page publique
  }

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<'owner' | 'admin' | 'member' | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTeamMembers = async () => {
    if (!user) {
      setTeamMembers([]);
      setCurrentUserRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data: currentMember, error: memberError } = await supabase
        .from('team_members')
        .select('owner_id, role_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (memberError) throw memberError;

      if (!currentMember) {
        setTeamMembers([]);
        setCurrentUserRole(null);
        setLoading(false);
        return;
      }

      const roleMap: Record<string, 'owner' | 'admin' | 'member'> = {
        'owner': 'owner',
        'admin': 'admin',
        'employee': 'member',
        'member': 'member'
      };

      setCurrentUserRole(roleMap[currentMember.role_name] || 'member');

      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .eq('owner_id', currentMember.owner_id)
        .order('created_at', { ascending: true });

      if (membersError) throw membersError;

      const formattedMembers = (members || []).map(member => ({
        id: member.id,
        user_id: member.user_id,
        owner_id: member.owner_id,
        role: roleMap[member.role_name] || 'member',
        full_name: member.full_name || member.firstname + ' ' + member.lastname || 'Utilisateur',
        email: member.email || '',
        created_at: member.created_at
      }));

      setTeamMembers(formattedMembers);
    } catch (error) {
      setTeamMembers([]);
      setCurrentUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, [user]);

  const value: TeamContextType = {
    teamMembers,
    currentUserRole,
    isOwner: currentUserRole === 'owner',
    isAdmin: currentUserRole === 'admin' || currentUserRole === 'owner',
    loading,
    refreshTeamMembers: fetchTeamMembers
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
}
