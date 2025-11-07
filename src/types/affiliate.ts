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
  affiliate_code: string;
  total_referrals: number;
  successful_conversions: number;
  total_commissions: number;
  pending_commissions: number;
  paid_commissions: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  commission_month: string;
  status: 'pending' | 'paid' | 'cancelled';
  paid_at?: string;
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
