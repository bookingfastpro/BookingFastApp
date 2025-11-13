export interface AffiliateSettings {
  id: string;
  commission_percentage: number;
  extended_trial_days: number;
  minimum_payout_amount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Affiliate {
  id: string;
  user_id: string;
  code: string;
  commission_rate: number;
  total_earnings: number;
  status: string;
  payment_info: any;
  created_at: string;
  updated_at: string;
  // Computed fields
  total_referrals?: number;
  successful_conversions?: number;
  total_commissions?: number;
  pending_commissions?: number;
  paid_commissions?: number;
  affiliate_code?: string;
  is_active?: boolean;
}

export interface AffiliateReferral {
  id: string;
  affiliate_id: string;
  referred_user_id: string;
  affiliate_code: string;
  conversion_date?: string;
  subscription_status: string;
  total_paid: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  referred_user?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export interface AffiliateCommission {
  id: string;
  affiliate_id: string;
  referral_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paid_at?: string;
  payment_reference?: string;
  created_at: string;
  updated_at: string;
  referral?: AffiliateReferral;
}

export interface AffiliateStats {
  totalReferrals: number;
  successfulConversions: number;
  conversionRate: number;
  totalCommissions: number;
  pendingCommissions: number;
  paidCommissions: number;
  monthlyCommissions: number;
  topPerformers: Array<{
    affiliate: Affiliate;
    user: any;
    commissions: number;
  }>;
}
