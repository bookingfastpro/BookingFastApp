export interface POSCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface POSProduct {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  cost: number;
  stock: number;
  track_stock: boolean;
  duration_minutes: number | null;
  color: string;
  is_active: boolean;
  is_ttc_price: boolean; // Nouveau champ pour indiquer si le prix est TTC
  created_at: string;
  updated_at: string;
  _isBookingService?: boolean; // Marqueur pour identifier les services de réservation
  _isTTCPrice?: boolean; // Flag runtime pour le calcul
}

export interface POSTransaction {
  id: string;
  user_id: string;
  transaction_number: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  payment_method: string;
  payment_status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface POSTransactionItem {
  id: string;
  transaction_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface POSSettings {
  id: string;
  user_id: string;
  tax_rate: number;
  currency: string;
  receipt_header: string | null;
  receipt_footer: string | null;
  auto_print: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product: POSProduct;
  quantity: number;
}
