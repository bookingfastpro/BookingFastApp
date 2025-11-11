export interface WorkflowCondition {
  field: string;
  operator: string;
  value: string;
}

export interface SmsWorkflow {
  id: string;
  user_id?: string;
  name: string;
  description: string;
  trigger: string;
  template_id: string;
  delay: number;
  active: boolean;
  conditions: WorkflowCondition[];
  sent_count?: number;
  success_rate?: number;
  created_at: string;
  updated_at: string;
}

export interface SmsTemplate {
  id: string;
  user_id?: string;
  name: string;
  description: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface SmsLog {
  id: string;
  user_id: string;
  workflow_id?: string;
  booking_id?: string;
  to_phone: string;
  content: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  twilio_sid?: string;
  error_message?: string;
  sent_at: string;
}

export type SmsTrigger =
  | 'booking_created'
  | 'booking_updated'
  | 'payment_link_created'
  | 'payment_link_paid'
  | 'payment_completed'
  | 'booking_cancelled'
  | 'reminder_24h'
  | 'reminder_1h'
  | 'follow_up';

export interface TwilioConfig {
  enabled: boolean;
  account_sid: string;
  auth_token: string;
  phone_number: string;
}
