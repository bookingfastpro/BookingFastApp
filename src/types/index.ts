export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  client_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface Payment {
  id: string;
  user_id: string;
  client_id: string;
  appointment_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  stripe_payment_id?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  client?: Client;
  appointment?: Appointment;
}

export interface Subscription {
  id: string;
  user_id: string;
  client_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: 'active' | 'cancelled' | 'past_due' | 'incomplete';
  plan_name: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  price_ht: number;
  price_ttc: number;
  tva_rate: number;
  unit: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id?: string;
  description: string;
  quantity: number;
  unit_price_ht: number;
  tva_rate: number;
  discount_percent: number;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string;
  invoice_number: string;
  quote_number?: string;
  document_type: 'invoice' | 'quote';
  invoice_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  subtotal_ht: number;
  total_tva: number;
  total_ttc: number;
  notes?: string;
  payment_conditions?: string;
  sent_at?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  client?: Client;
  items?: InvoiceItem[];
}

export interface CompanyInfo {
  id: string;
  user_id: string;
  company_name: string;
  legal_form?: string;
  siret?: string;
  tva_number?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  bank_name?: string;
  iban?: string;
  bic?: string;
  pdf_primary_color?: string;
  pdf_accent_color?: string;
  pdf_text_color?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  payment_method: 'especes' | 'carte' | 'virement' | 'cheque';
  amount: number;
  payment_date: string;
  reference?: string;
  notes?: string;
  created_at: string;
}
