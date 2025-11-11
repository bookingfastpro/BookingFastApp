import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SmsWorkflow, SmsTemplate } from '../types/sms';
import { useAuth } from '../contexts/AuthContext';

const getDefaultWorkflows = (userId: string): SmsWorkflow[] => [
  {
    id: `sms-demo-1-${userId}`,
    user_id: userId,
    name: 'Confirmation SMS',
    description: 'SMS automatique envoyé lors d\'une nouvelle réservation',
    trigger: 'booking_created',
    template_id: `sms-template-1-${userId}`,
    delay: 0,
    active: true,
    sent_count: 15,
    success_rate: 98,
    conditions: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: `sms-demo-2-${userId}`,
    user_id: userId,
    name: 'Rappel SMS 24h',
    description: 'SMS de rappel 24h avant le rendez-vous',
    trigger: 'reminder_24h',
    template_id: `sms-template-2-${userId}`,
    delay: 0,
    active: true,
    sent_count: 8,
    success_rate: 100,
    conditions: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const getDefaultTemplates = (userId: string): SmsTemplate[] => [
  {
    id: `sms-template-1-${userId}`,
    user_id: userId,
    name: 'Confirmation réservation',
    description: 'SMS de confirmation de réservation',
    content: 'Bonjour {{client_firstname}}, votre réservation pour {{service_name}} le {{booking_date}} à {{booking_time}} est confirmée. À bientôt!',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: `sms-template-2-${userId}`,
    user_id: userId,
    name: 'Rappel 24h',
    description: 'SMS de rappel 24h avant le rendez-vous',
    content: 'Rappel: RDV demain {{booking_date}} à {{booking_time}} pour {{service_name}}. À bientôt!',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: `sms-template-3-${userId}`,
    user_id: userId,
    name: 'Lien de paiement',
    description: 'SMS avec lien de paiement',
    content: 'Bonjour {{client_firstname}}, finalisez votre réservation: {{payment_link}}',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export function useSmsWorkflows() {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<SmsWorkflow[]>([]);
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
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
        .from('sms_workflows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1000);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout chargement SMS workflows')), 30000)
      );

      const { data, error } = await Promise.race([supabaseQuery, timeoutPromise]) as any;

      if (error) {
        throw error;
      }

      setWorkflows(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des SMS workflows:', err);

      if (err instanceof Error && err.message.includes('Timeout')) {
        console.log('⏰ Timeout SMS workflows - utilisation des données par défaut');
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
        .from('sms_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1000);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout chargement SMS templates')), 30000)
      );

      const { data, error } = await Promise.race([supabaseQuery, timeoutPromise]) as any;

      if (error) {
        throw error;
      }

      setTemplates(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des SMS templates:', err);

      if (err instanceof Error && err.message.includes('Timeout')) {
        console.log('⏰ Timeout SMS templates - utilisation des données par défaut');
      }

      setTemplates(getDefaultTemplates(user.id));
    }
  };

  const addWorkflow = async (workflow: Partial<SmsWorkflow>) => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    if (!supabase) {
      const newWorkflow: SmsWorkflow = {
        id: `sms-demo-${Date.now()}-${user.id}`,
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
        .from('sms_workflows')
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
      console.error('Erreur ajout SMS workflow:', err);
      throw err;
    }
  };

  const updateWorkflow = async (id: string, updates: Partial<SmsWorkflow>) => {
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
        .from('sms_workflows')
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
      console.error('Erreur mise à jour SMS workflow:', err);
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
        .from('sms_workflows')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setWorkflows(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      console.error('Erreur suppression SMS workflow:', err);
      throw err;
    }
  };

  const addTemplate = async (template: Partial<SmsTemplate>) => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    if (template.content && template.content.length > 160) {
      throw new Error('Le contenu du SMS ne peut pas dépasser 160 caractères');
    }

    if (!supabase) {
      const newTemplate: SmsTemplate = {
        id: `sms-template-${Date.now()}-${user.id}`,
        name: template.name || '',
        description: template.description || '',
        content: template.content || '',
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
        .from('sms_templates')
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
      console.error('Erreur ajout SMS template:', err);
      throw err;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<SmsTemplate>) => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    if (updates.content && updates.content.length > 160) {
      throw new Error('Le contenu du SMS ne peut pas dépasser 160 caractères');
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
        .from('sms_templates')
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
      console.error('Erreur mise à jour SMS template:', err);
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
        .from('sms_templates')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Erreur suppression SMS template:', err);
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
