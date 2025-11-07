export interface TeamMember {
  id: string;
  owner_id: string;
  user_id: string;
  email: string;
  full_name?: string;
  role_name: string;
  permissions: string[];
  is_active: boolean;
  invited_by?: string;
  invited_at: string;
  joined_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TeamPermission {
  id: string;
  name: string;
  description: string;
  category: 'dashboard' | 'calendar' | 'services' | 'clients' | 'emails' | 'admin' | 'financial';
  level: 'read' | 'write' | 'admin';
}

export interface TeamRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  color: string;
  level: number; // 1 = Employé, 2 = Manager, 3 = Admin, 4 = Propriétaire
}

// Permissions disponibles avec niveaux d'accès
export const AVAILABLE_PERMISSIONS: TeamPermission[] = [
  // Dashboard - Lecture seule
  { id: 'view_dashboard', name: 'Voir le dashboard', description: 'Accès à la vue d\'ensemble', category: 'dashboard', level: 'read' },
  { id: 'view_stats', name: 'Voir les statistiques', description: 'Consulter les métriques de base', category: 'dashboard', level: 'read' },
  { id: 'view_revenue', name: 'Voir le chiffre d\'affaires', description: 'Accès aux données financières', category: 'financial', level: 'read' },
  
  // Calendrier - Différents niveaux
  { id: 'view_calendar', name: 'Voir le planning', description: 'Consulter le calendrier des réservations', category: 'calendar', level: 'read' },
  { id: 'create_booking', name: 'Créer des réservations', description: 'Ajouter de nouvelles réservations', category: 'calendar', level: 'write' },
  { id: 'edit_own_bookings', name: 'Modifier ses réservations', description: 'Modifier seulement ses réservations assignées', category: 'calendar', level: 'write' },
  { id: 'edit_all_bookings', name: 'Modifier toutes les réservations', description: 'Modifier toutes les réservations', category: 'calendar', level: 'admin' },
  { id: 'delete_booking', name: 'Supprimer des réservations', description: 'Supprimer des réservations', category: 'calendar', level: 'admin' },
  { id: 'assign_bookings', name: 'Assigner des réservations', description: 'Assigner des réservations aux membres', category: 'calendar', level: 'admin' },
  
  // Services - Différents niveaux
  { id: 'view_services', name: 'Voir les services', description: 'Consulter la liste des services', category: 'services', level: 'read' },
  { id: 'create_service', name: 'Créer des services', description: 'Ajouter de nouveaux services', category: 'services', level: 'write' },
  { id: 'edit_service', name: 'Modifier des services', description: 'Modifier les services existants', category: 'services', level: 'write' },
  { id: 'delete_service', name: 'Supprimer des services', description: 'Supprimer des services', category: 'services', level: 'admin' },
  
  // Clients - Différents niveaux
  { id: 'view_clients', name: 'Voir les clients', description: 'Consulter la liste des clients', category: 'clients', level: 'read' },
  { id: 'create_client', name: 'Créer des clients', description: 'Ajouter de nouveaux clients', category: 'clients', level: 'write' },
  { id: 'edit_client', name: 'Modifier des clients', description: 'Modifier les informations clients', category: 'clients', level: 'write' },
  { id: 'delete_client', name: 'Supprimer des clients', description: 'Supprimer des clients', category: 'clients', level: 'admin' },
  { id: 'view_client_details', name: 'Voir détails clients', description: 'Accès aux informations détaillées des clients', category: 'clients', level: 'read' },
  
  // Emails - Différents niveaux
  { id: 'view_emails', name: 'Voir les emails', description: 'Consulter les workflows email', category: 'emails', level: 'read' },
  { id: 'send_manual_email', name: 'Envoyer des emails', description: 'Envoyer des emails manuellement', category: 'emails', level: 'write' },
  { id: 'create_workflow', name: 'Créer des workflows', description: 'Créer des workflows email', category: 'emails', level: 'write' },
  { id: 'edit_workflow', name: 'Modifier des workflows', description: 'Modifier les workflows existants', category: 'emails', level: 'admin' },
  { id: 'delete_workflow', name: 'Supprimer des workflows', description: 'Supprimer des workflows', category: 'emails', level: 'admin' },
  
  // Paiements - Différents niveaux
  { id: 'view_payments', name: 'Voir les paiements', description: 'Consulter les informations de paiement', category: 'financial', level: 'read' },
  { id: 'create_payment_link', name: 'Créer liens de paiement', description: 'Générer des liens de paiement', category: 'financial', level: 'write' },
  { id: 'manage_transactions', name: 'Gérer les transactions', description: 'Ajouter/modifier les transactions', category: 'financial', level: 'write' },
  { id: 'view_financial_reports', name: 'Rapports financiers', description: 'Accès aux rapports financiers détaillés', category: 'financial', level: 'admin' },
  
  // Administration - Réservé aux niveaux élevés
  { id: 'view_admin', name: 'Voir les réglages', description: 'Accès aux paramètres d\'administration', category: 'admin', level: 'admin' },
  { id: 'edit_business_settings', name: 'Modifier les paramètres', description: 'Modifier les paramètres de l\'entreprise', category: 'admin', level: 'admin' },
  { id: 'manage_team', name: 'Gérer l\'équipe', description: 'Inviter et gérer les membres d\'équipe', category: 'admin', level: 'admin' },
  { id: 'view_team_stats', name: 'Statistiques équipe', description: 'Voir les performances de l\'équipe', category: 'admin', level: 'admin' }
];

// Rôles prédéfinis avec permissions et limites
export const TEAM_ROLES: Record<string, TeamRole> = {
  owner: {
    id: 'owner',
    name: 'Propriétaire',
    description: 'Accès complet à toutes les fonctionnalités',
    permissions: AVAILABLE_PERMISSIONS.map(p => p.id),
    color: 'from-purple-500 to-pink-500',
    level: 4
  },
  admin: {
    id: 'admin',
    name: 'Administrateur',
    description: 'Gestion complète sauf gestion d\'équipe',
    permissions: [
      'view_dashboard', 'view_stats', 'view_revenue',
      'view_calendar', 'create_booking', 'edit_all_bookings', 'delete_booking', 'assign_bookings',
      'view_services', 'create_service', 'edit_service', 'delete_service',
      'view_clients', 'create_client', 'edit_client', 'delete_client', 'view_client_details',
      'view_emails', 'send_manual_email', 'create_workflow', 'edit_workflow', 'delete_workflow',
      'view_payments', 'create_payment_link', 'manage_transactions', 'view_financial_reports',
      'view_admin', 'edit_business_settings', 'view_team_stats'
    ],
    color: 'from-red-500 to-orange-500',
    level: 3
  },
  manager: {
    id: 'manager',
    name: 'Manager',
    description: 'Gestion des réservations et services',
    permissions: [
      'view_dashboard', 'view_stats',
      'view_calendar', 'create_booking', 'edit_all_bookings', 'assign_bookings',
      'view_services', 'create_service', 'edit_service',
      'view_clients', 'create_client', 'edit_client', 'view_client_details',
      'view_emails', 'send_manual_email', 'create_workflow',
      'view_payments', 'create_payment_link', 'manage_transactions'
    ],
    color: 'from-blue-500 to-cyan-500',
    level: 2
  },
  employee: {
    id: 'employee',
    name: 'Employé',
    description: 'Gestion des réservations assignées',
    permissions: [
      'view_dashboard', 'view_stats',
      'view_calendar', 'create_booking', 'edit_own_bookings',
      'view_services',
      'view_clients', 'create_client', 'edit_client', 'view_client_details',
      'view_emails', 'send_manual_email',
      'view_payments', 'create_payment_link', 'manage_transactions'
    ],
    color: 'from-green-500 to-emerald-500',
    level: 1
  },
  receptionist: {
    id: 'receptionist',
    name: 'Réceptionniste',
    description: 'Accueil et réservations',
    permissions: [
      'view_dashboard',
      'view_calendar', 'create_booking', 'edit_own_bookings',
      'view_services',
      'view_clients', 'create_client', 'edit_client', 'view_client_details',
      'view_payments', 'create_payment_link'
    ],
    color: 'from-teal-500 to-green-500',
    level: 1
  },
  viewer: {
    id: 'viewer',
    name: 'Consultation',
    description: 'Accès en lecture seule',
    permissions: [
      'view_dashboard',
      'view_calendar',
      'view_services',
      'view_clients', 'view_client_details',
      'view_emails',
      'view_payments'
    ],
    color: 'from-gray-500 to-gray-600',
    level: 0
  }
};

// Fonction pour obtenir le rôle d'un utilisateur
export const getUserRole = (permissions: string[]): TeamRole => {
  // Trouver le rôle qui correspond le mieux aux permissions
  const roleEntries = Object.entries(TEAM_ROLES);
  
  for (const [roleId, role] of roleEntries.reverse()) { // Commencer par les rôles les plus élevés
    const hasAllPermissions = role.permissions.every(permission => 
      permissions.includes(permission)
    );
    
    if (hasAllPermissions) {
      return role;
    }
  }
  
  // Par défaut, retourner le rôle viewer
  return TEAM_ROLES.viewer;
};

// Fonction pour vérifier si un utilisateur peut effectuer une action
export const canPerformAction = (
  userPermissions: string[], 
  requiredPermission: string,
  isOwner: boolean = false
): boolean => {
  // Le propriétaire peut tout faire
  if (isOwner) return true;
  
  // Vérifier si l'utilisateur a la permission spécifique
  return userPermissions.includes(requiredPermission);
};

// Fonction pour obtenir les permissions par catégorie
export const getPermissionsByCategory = (category: string): TeamPermission[] => {
  return AVAILABLE_PERMISSIONS.filter(p => p.category === category);
};

// Fonction pour obtenir le niveau d'accès d'un utilisateur
export const getUserAccessLevel = (permissions: string[]): number => {
  const role = getUserRole(permissions);
  return role.level;
};
