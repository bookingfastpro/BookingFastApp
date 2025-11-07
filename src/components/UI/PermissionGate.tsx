import React from 'react';
import { Shield, AlertTriangle, Lock, Eye, EyeOff } from 'lucide-react';
import { useTeam } from '../../hooks/useTeam';
import { AVAILABLE_PERMISSIONS } from '../../types/team';

interface PermissionGateProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showMessage?: boolean;
  requireOwner?: boolean;
  minimumLevel?: number; // 0 = Viewer, 1 = Employé, 2 = Manager, 3 = Admin, 4 = Propriétaire
  alternative?: React.ReactNode; // Contenu alternatif pour les utilisateurs sans permission
}

export function PermissionGate({ 
  permission, 
  children, 
  fallback,
  showMessage = true,
  requireOwner = false,
  minimumLevel,
  alternative
}: PermissionGateProps) {
  const { hasPermission, isOwner, loading, getAccessLevel, getUserRoleInfo } = useTeam();

  if (loading) {
    return null;
  }

  // Vérification du niveau minimum requis
  if (minimumLevel !== undefined) {
    const userLevel = getAccessLevel();
    if (userLevel < minimumLevel) {
      if (alternative) {
        return <>{alternative}</>;
      }
      
      if (showMessage) {
        const roleInfo = getUserRoleInfo();
        const requiredRoleName = Object.values({
          0: 'Consultation',
          1: 'Employé',
          2: 'Manager', 
          3: 'Administrateur',
          4: 'Propriétaire'
        })[minimumLevel] || 'Niveau supérieur';
        
        return (
          <div className="flex items-center justify-center p-4 bg-orange-50 rounded-xl border border-orange-200">
            <div className="text-center">
              <Lock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-orange-700 font-medium text-sm">
                Niveau d'accès insuffisant
              </p>
              <p className="text-orange-600 text-xs mt-1">
                Votre rôle: <strong>{roleInfo.name}</strong> (niveau {roleInfo.level})
                <br />
                Requis: <strong>{requiredRoleName}</strong> (niveau {minimumLevel})
              </p>
            </div>
          </div>
        );
      }
      
      return null;
    }
  }

  // Vérification propriétaire requis
  if (requireOwner && !isOwner) {
    if (alternative) {
      return <>{alternative}</>;
    }
    
    if (showMessage) {
      return (
        <div className="flex items-center justify-center p-4 bg-red-50 rounded-xl border border-red-200">
          <div className="text-center">
            <Shield className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-700 font-medium text-sm">
              Accès réservé au propriétaire
            </p>
            <p className="text-red-600 text-xs mt-1">
              Seul le propriétaire du compte peut accéder à cette fonctionnalité
            </p>
          </div>
        </div>
      );
    }
    
    return null;
  }

  // Vérification permission spécifique
  if (isOwner || hasPermission(permission)) {
    return <>{children}</>;
  }

  // Si un fallback personnalisé est fourni
  if (fallback) {
    return <>{fallback}</>;
  }

  // Contenu alternatif pour les utilisateurs sans permission
  if (alternative) {
    return <>{alternative}</>;
  }

  // Message par défaut si showMessage est true
  if (showMessage) {
    const roleInfo = getUserRoleInfo();
    const permissionInfo = AVAILABLE_PERMISSIONS.find(p => p.id === permission);
    
    return (
      <div className="flex items-center justify-center p-4 bg-red-50 rounded-xl border border-red-200">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700 font-medium text-sm">
            Permission requise: {permissionInfo?.name || permission}
          </p>
          <p className="text-red-600 text-xs mt-1">
            Votre rôle: <strong>{roleInfo.name}</strong>
            <br />
            Contactez le propriétaire pour obtenir cette permission
          </p>
        </div>
      </div>
    );
  }

  // Ne rien afficher
  return null;
}

// Composant pour afficher les limites d'utilisation
export function UsageLimitIndicator({ 
  currentUsage, 
  permission, 
  children 
}: { 
  currentUsage: number; 
  permission: string;
  children: React.ReactNode;
}) {
  const { getUsageLimits, hasPermission, getUserRoleInfo } = useTeam();
  
  if (!hasPermission(permission)) {
    return null;
  }
  
  const limits = getUsageLimits();
  const roleInfo = getUserRoleInfo();
  
  // Déterminer la limite selon la permission
  let maxLimit: number | null = null;
  let limitType = '';
  
  if (permission === 'create_booking') {
    maxLimit = limits.maxBookingsPerDay;
    limitType = 'réservations par jour';
  } else if (permission === 'create_service') {
    maxLimit = limits.maxServicesCreated;
    limitType = 'services créés';
  } else if (permission === 'create_client') {
    maxLimit = limits.maxClientsCreated;
    limitType = 'clients créés';
  }
  
  // Si pas de limite (propriétaire/admin), afficher normalement
  if (!maxLimit) {
    return <>{children}</>;
  }
  
  const usagePercentage = (currentUsage / maxLimit) * 100;
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = currentUsage >= maxLimit;
  
  if (isAtLimit) {
    return (
      <div className="flex items-center justify-center p-4 bg-red-50 rounded-xl border border-red-200">
        <div className="text-center">
          <EyeOff className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700 font-medium text-sm">
            Limite atteinte
          </p>
          <p className="text-red-600 text-xs mt-1">
            Vous avez atteint votre limite de {maxLimit} {limitType}
            <br />
            Rôle: <strong>{roleInfo.name}</strong>
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {isNearLimit && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-orange-700 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>
              Attention: {currentUsage}/{maxLimit} {limitType} utilisées
            </span>
          </div>
          <div className="w-full bg-orange-200 rounded-full h-2 mt-2">
            <div 
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
