import React from 'react';
import { Users } from 'lucide-react';
import { useTeam } from '../../hooks/useTeam';
import { LoadingSpinner } from '../UI/LoadingSpinner';

interface TeamMemberSelectorProps {
  value: string | null;
  onChange: (userId: string | null) => void;
}

export function TeamMemberSelector({ value, onChange }: TeamMemberSelectorProps) {
  const { teamMembers, loading } = useTeam();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Assigner à un membre
      </label>
      <div className="relative">
        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-base bg-white"
        >
          <option value="">Non assigné</option>
          {teamMembers.map((member) => (
            <option key={member.id} value={member.user_id}>
              {member.full_name || member.email}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Assignez cette réservation à un membre spécifique de votre équipe
      </p>
    </div>
  );
}
