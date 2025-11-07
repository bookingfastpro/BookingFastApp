export interface User {
  id: string;
  email: string;
  full_name?: string;
  is_super_admin: boolean;
  trial_started_at?: string;
  trial_ends_at?: string;
  subscription_status: 'trial' | 'active' | 'expired' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price_monthly: number;
  price_yearly?: number;
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'trialing';
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  trial_start?: string;
  trial_end?: string;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
  user?: User;
}

export interface AccessCode {
  id: string;
  code: string;
  description?: string;
  access_type: 'days' | 'weeks' | 'months' | 'lifetime';
  access_duration?: number;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  created_by?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CodeRedemption {
  id: string;
  code_id: string;
  user_id: string;
  redeemed_at: string;
  access_granted_until?: string;
  created_at: string;
  updated_at: string;
  code?: AccessCode;
  user?: User;
}

// Types pour les statistiques
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  trialUsers: number;
  expiredUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  conversionRate: number;
  churnRate: number;
  activeCodes: number;
  usedCodes: number;
}
