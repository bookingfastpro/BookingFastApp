import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { EmailWorkflow, EmailTemplate } from '../types/email';
import { useAuth } from '../contexts/AuthContext';

const getDefaultWorkflows = (userId: string): EmailWorkflow[] => [
  {
    id: `demo-1-${userId}`,
    user_id: userId,
    name: 'Confirmation de réservation',
    description: 'Email automatique envoyé lors d\'une nouvelle réservation',
    trigger: 'booking_created',
    template_id: `template-1-${userId}`,
    delay: 0,
    active: true,
    sent_count: 45,
    success_rate: 98,
    conditions: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: `demo-2-${userId}`,
    user_id: userId,
    name: 'Rappel 24h avant',
    description: 'Rappel envoyé 24h avant le rendez-vous',
    trigger: 'reminder_24h',
    template_id: `template-2-${userId}`,
    delay: 0,
    active: true,
    sent_count: 32,
    success_rate: 95,
    conditions: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: `demo-3-${userId}`,
    user_id: userId,
    name: 'Lien de paiement créé',
    description: 'Email automatique avec le lien de paiement',
    trigger: 'payment_link_created',
    template_id: `template-3-${userId}`,
    delay: 0,
    active: true,
    sent_count: 18,
    success_rate: 100,
    conditions: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const getDefaultTemplates = (userId: string): EmailTemplate[] => [
  {
    id: `template-1-${userId}`,
    user_id: userId,
    name: 'Confirmation de réservation',
    description: 'Template pour confirmer une réservation',
    subject: 'Confirmation de votre réservation - {{service_name}}',
    html_content: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">BookingFast</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Confirmation de réservation</p>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <h2 style="color: #333; margin-top: 0;">Bonjour {{client_firstname}},</h2>
    
    <p style="color: #666; line-height: 1.6;">
      Votre réservation a été confirmée avec succès ! Voici les détails :
    </p>
    
    <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #334155; margin-top: 0;">Détails de votre réservation</h3>
      <p><strong>Service :</strong> {{service_name}}</p>
      <p><strong>Date :</strong> {{booking_date}}</p>
      <p><strong>Heure :</strong> {{booking_time}}</p>
      <p><strong>Durée :</strong> {{service_duration}} minutes</p>
      <p><strong>Participants :</strong> {{booking_quantity}}</p>
      <p><strong>Montant total :</strong> {{total_amount}}€</p>
    </div>
    
    <p style="color: #666; line-height: 1.6;">
      Nous avons hâte de vous accueillir ! Si vous avez des questions, n'hésitez pas à nous contacter.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 14px;">
    <p>BookingFast - {{current_date}}</p>
  </div>
</div>`,
    text_content: `Bonjour {{client_firstname}},

Votre réservation a été confirmée avec succès !

Détails de votre réservation :
- Service : {{service_name}}
- Date : {{booking_date}}
- Heure : {{booking_time}}
- Durée : {{service_duration}} minutes
- Participants : {{booking_quantity}}
- Montant total : {{total_amount}}€

Nous avons hâte de vous accueillir !

BookingFast`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: `template-2-${userId}`,
    user_id: userId,
    name: 'Rappel de rendez-vous',
    description: 'Template pour rappeler un rendez-vous',
    subject: 'Rappel : Votre rendez-vous demain - {{service_name}}',
    html_content: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fef3c7;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Rappel</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Votre rendez-vous approche</p>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <h2 style="color: #333; margin-top: 0;">Bonjour {{client_firstname}},</h2>
    
    <p style="color: #666; line-height: 1.6;">
      Nous vous rappelons que vous avez un rendez-vous demain :
    </p>
    
    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <h3 style="color: #92400e; margin-top: 0;">Votre rendez-vous</h3>
      <p><strong>Service :</strong> {{service_name}}</p>
      <p><strong>Date :</strong> {{booking_date}}</p>
      <p><strong>Heure :</strong> {{booking_time}}</p>
    </div>
    
    <p style="color: #666; line-height: 1.6;">
      À bientôt !
    </p>
  </div>
</div>`,
    text_content: `Bonjour {{client_firstname}},

Rappel : Vous avez un rendez-vous demain

Service : {{service_name}}
Date : {{booking_date}}
Heure : {{booking_time}}

À bientôt !

{{business_name}}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: `template-3-${userId}`,
    user_id: userId,
    name: 'Lien de paiement',
    description: 'Template pour envoyer un lien de paiement',
    subject: 'Lien de paiement pour votre réservation - {{service_name}}',
    html_content: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f0f9ff;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">💳 Lien de paiement</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Finalisez votre réservation</p>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <h2 style="color: #333; margin-top: 0;">Bonjour {{client_firstname}},</h2>
    
    <p style="color: #666; line-height: 1.6;">
      Votre réservation est presque finalisée ! Cliquez sur le lien ci-dessous pour effectuer le paiement :
    </p>
    
    <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #334155; margin-top: 0;">Détails de votre réservation</h3>
      <p><strong>Service :</strong> {{service_name}}</p>
      <p><strong>Date :</strong> {{booking_date}}</p>
      <p><strong>Heure :</strong> {{booking_time}}</p>
      <p><strong>Montant à payer :</strong> {{remaining_amount}}€</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{payment_link}}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">
        💳 Payer maintenant
      </a>
    </div>
    
    <p style="color: #666; line-height: 1.6; font-size: 14px;">
      <strong>⏰ Important :</strong> Ce lien expire dans 30 minutes pour votre sécurité.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 14px;">
    <p>{{business_name}} - Paiement sécurisé</p>
  </div>
</div>`,
    text_content: `Bonjour {{client_firstname}},

Votre réservation est presque finalisée !

Détails de votre réservation :
- Service : {{service_name}}
- Date : {{booking_date}}
- Heure : {{booking_time}}
- Montant à payer : {{remaining_amount}}€

Lien de paiement : {{payment_link}}

Important : Ce lien expire dans 30 minutes.

{{business_name}}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export function useEmailWorkflows() {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<EmailWorkflow[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = async () => {
    if (!user) {
      setWorkflows([]);
      setLoading(false);
      return;
    }

    if (!supabase) {
      setWorkflows(getDefaultWorkflows(user.id));
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      const supabaseQuery = supabase
        .from('email_workflows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1000);

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout chargement workflows')), 30000)
      );

      const { data, error } = await Promise.race([supabaseQuery, timeoutPromise]);

      if (error) {
        throw error;
      }

      setWorkflows(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des workflows:', err);
      
      // Ne pas afficher d'erreur pour les timeouts
      if (err instanceof Error && err.message.includes('Timeout')) {
        console.log('⏰ Timeout workflows - utilisation des données par défaut');
        setError(null);
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement';
        setError(errorMessage);
      }
      
      setWorkflows(getDefaultWorkflows(user.id));
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    if (!user) {
      setTemplates([]);
      return;
    }

    if (!supabase) {
      setTemplates(getDefaultTemplates(user.id));
      return;
    }

    try {
      const supabaseQuery = supabase
        .from('email_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1000);

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout chargement templates')), 30000)
      );

      const { data, error } = await Promise.race([supabaseQuery, timeoutPromise]);

      if (error) {
        throw error;
      }

      setTemplates(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des templates:', err);
      
      // Ne pas afficher d'erreur pour les timeouts
      if (err instanceof Error && err.message.includes('Timeout')) {
        console.log('⏰ Timeout templates - utilisation des données par défaut');
      }
      
      setTemplates(getDefaultTemplates(user.id));
    }
  };

  const addWorkflow = async (workflow: Partial<EmailWorkflow>) => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    if (!supabase) {
      const newWorkflow: EmailWorkflow = {
        id: `demo-${Date.now()}-${user.id}`,
        user_id: user.id,
        name: workflow.name || '',
        description: workflow.description || '',
        trigger: workflow.trigger || 'booking_created',
        template_id: workflow.template_id || '',
        delay: workflow.delay || 0,
        active: workflow.active ?? true,
        sent_count: 0,
        success_rate: 0,
        conditions: workflow.conditions || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const updatedWorkflows = [newWorkflow, ...workflows];
      setWorkflows(updatedWorkflows);
      return newWorkflow;
    }

    try {
      const workflowData = {
        ...workflow,
        id: workflow.id || crypto.randomUUID(),
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('email_workflows')
        .insert([workflowData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setWorkflows(prev => [data, ...prev]);
        return data;
      }
    } catch (err) {
      console.error('Erreur ajout workflow:', err);
      throw err;
    }
  };

  const updateWorkflow = async (id: string, updates: Partial<EmailWorkflow>) => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    if (!supabase) {
      const updatedWorkflows = workflows.map(w => 
        w.id === id ? { ...w, ...updates, updated_at: new Date().toISOString() } : w
      );
      setWorkflows(updatedWorkflows);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('email_workflows')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setWorkflows(prev => prev.map(w => w.id === id ? data : w));
        return data;
      }
    } catch (err) {
      console.error('Erreur mise à jour workflow:', err);
      throw err;
    }
  };

  const deleteWorkflow = async (id: string) => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    if (!supabase) {
      const updatedWorkflows = workflows.filter(w => w.id !== id);
      setWorkflows(updatedWorkflows);
      return;
    }

    try {
      const { error } = await supabase
        .from('email_workflows')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setWorkflows(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      console.error('Erreur suppression workflow:', err);
      throw err;
    }
  };

  const addTemplate = async (template: Partial<EmailTemplate>) => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    if (!supabase) {
      const newTemplate: EmailTemplate = {
        id: `template-${Date.now()}-${user.id}`,
        name: template.name || '',
        description: template.description || '',
        subject: template.subject || '',
        html_content: template.html_content || '',
        text_content: template.text_content || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const updatedTemplates = [newTemplate, ...templates];
      setTemplates(updatedTemplates);
      return newTemplate;
    }

    try {
      const templateData = {
        ...template,
        id: template.id || crypto.randomUUID(),
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('email_templates')
        .insert([templateData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setTemplates(prev => [data, ...prev]);
        return data;
      }
    } catch (err) {
      console.error('Erreur ajout template:', err);
      throw err;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<EmailTemplate>) => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    if (!supabase) {
      const updatedTemplates = templates.map(t => 
        t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
      );
      setTemplates(updatedTemplates);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('email_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setTemplates(prev => prev.map(t => t.id === id ? data : t));
        return data;
      }
    } catch (err) {
      console.error('Erreur mise à jour template:', err);
      throw err;
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    if (!supabase) {
      const updatedTemplates = templates.filter(t => t.id !== id);
      setTemplates(updatedTemplates);
      return;
    }

    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Erreur suppression template:', err);
      throw err;
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (mounted && user) {
        await fetchWorkflows();
        await fetchTemplates();
      }
    };
    
    loadData();
    
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  return {
    workflows,
    templates,
    loading,
    error,
    refetch: () => {
      fetchWorkflows();
      fetchTemplates();
    },
    addWorkflow,
    updateWorkflow,
    deleteWorkflow,
    addTemplate,
    updateTemplate,
    deleteTemplate
  };
}
