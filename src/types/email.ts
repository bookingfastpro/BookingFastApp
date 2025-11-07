export interface WorkflowCondition {
  field: string;
  operator: string;
  value: string;
}

export interface EmailWorkflow {
  id: string;
  user_id?: string;
  name: string;
  description: string;
  trigger: string;
  template_id: string;
  delay: number; // en minutes
  active: boolean;
  conditions: WorkflowCondition[];
  sent_count?: number;
  success_rate?: number;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  user_id?: string;
  name: string;
  description: string;
  subject: string;
  html_content: string;
  text_content: string;
  created_at: string;
  updated_at: string;
}

export type WorkflowTrigger = 
  | 'booking_created'
  | 'booking_updated'
  | 'payment_link_created'
  | 'payment_link_paid'
  | 'payment_completed'
  | 'booking_cancelled'
  | 'reminder_24h'
  | 'reminder_1h'
  | 'follow_up';
