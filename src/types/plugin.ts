export interface Plugin {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: string;
  price: number;
  stripe_price_id: string | null;
  features: string[];
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface PluginSubscription {
  id: string;
  user_id: string;
  plugin_id: string;
  status: 'trial' | 'active' | 'cancelled' | 'expired';
  is_trial: boolean;
  trial_ends_at: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  activated_features: string[];
  created_at: string;
  updated_at: string;
  plugin?: Plugin;
}

export interface UserPlugin {
  plugin_id: string;
  plugin_name: string;
  plugin_slug: string;
  plugin_icon: string;
  plugin_category: string;
  activated_features: string[];
  settings: Record<string, any>;
  subscription_status?: string;
  current_period_end?: string;
}

export interface PluginConfiguration {
  id: string;
  user_id: string;
  plugin_id: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}
