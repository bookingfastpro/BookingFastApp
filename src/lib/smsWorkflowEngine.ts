import { SmsWorkflow, SmsTemplate } from '../types/sms';
import { Booking } from '../types';
import { supabase } from './supabase';

const processedSmsWorkflows = new Map<string, number>();
const DEBOUNCE_TIME = 5000;

const isSupabaseConfigured = (): boolean => {
  const configured = !!supabase && !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
  console.log('🔍 SMS isSupabaseConfigured:', configured);
  return configured;
};

const replaceVariables = (content: string, booking: Booking): string => {
  const variables: Record<string, string> = {
    '{{client_firstname}}': booking.client_firstname || '',
    '{{client_lastname}}': booking.client_name || '',
    '{{client_email}}': booking.client_email || '',
    '{{client_phone}}': booking.client_phone || '',
    '{{service_name}}': booking.service?.name || 'Service',
    '{{service_description}}': booking.service?.description || '',
    '{{service_price}}': booking.service?.price_ttc?.toFixed(2) || '0.00',
    '{{service_duration}}': booking.duration_minutes?.toString() || '0',
    '{{booking_date}}': new Date(booking.date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit'
    }),
    '{{booking_time}}': booking.time?.slice(0, 5) || '',
    '{{booking_quantity}}': booking.quantity?.toString() || '1',
    '{{total_amount}}': booking.total_amount?.toFixed(2) || '0.00',
    '{{payment_amount}}': (booking.payment_amount || 0).toFixed(2),
    '{{remaining_amount}}': (booking.total_amount - (booking.payment_amount || 0)).toFixed(2),
    '{{payment_link}}': booking.payment_link || '#',
    '{{business_name}}': 'BookingFast'
  };

  let result = content;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
  });

  return result;
};

const checkWorkflowConditions = (workflow: SmsWorkflow, booking: Booking): boolean => {
  if (!workflow.conditions || workflow.conditions.length === 0) {
    return true;
  }

  return workflow.conditions.every(condition => {
    let fieldValue: any;

    switch (condition.field) {
      case 'booking_status':
        fieldValue = booking.booking_status;
        break;
      case 'payment_status':
        fieldValue = booking.payment_status;
        break;
      case 'service_name':
        fieldValue = booking.service?.name;
        break;
      case 'service_id':
        fieldValue = booking.service_id;
        break;
      case 'total_amount':
        fieldValue = booking.total_amount;
        break;
      case 'client_phone':
        fieldValue = booking.client_phone;
        break;
      default:
        return false;
    }

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      default:
        return false;
    }
  });
};

const sendSmsViaTwilio = async (
  userId: string,
  toPhone: string,
  message: string,
  workflowId?: string,
  bookingId?: string
): Promise<boolean> => {
  console.log('📱 DÉBUT ENVOI SMS VIA TWILIO');
  console.log('📱 À:', toPhone);
  console.log('📱 Message:', message);
  console.log('📱 User ID:', userId);

  if (!isSupabaseConfigured()) {
    console.log('⚠️ SUPABASE NON CONFIGURÉ - SMS non envoyé');
    return false;
  }

  try {
    console.log('📱 ENVOI SMS RÉEL VIA TWILIO...');

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const response = await fetch(`${supabaseUrl}/functions/v1/send-twilio-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        user_id: userId,
        to_phone: toPhone,
        message: message,
        workflow_id: workflowId,
        booking_id: bookingId
      }),
    });

    console.log('📱 Statut réponse Twilio:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ SMS envoyé avec succès via Twilio:', result.message_sid);
      return true;
    } else {
      const errorData = await response.json();
      console.error('❌ Erreur envoi SMS Twilio:', errorData);
      console.log('⚠️ Le SMS n\'a pas été envoyé. Vérifiez que Twilio est activé dans Admin > Configuration.');
      return false;
    }
  } catch (error) {
    console.error('❌ ERREUR RÉSEAU ENVOI SMS:', error);
    console.log('⚠️ Le SMS n\'a pas été envoyé. Vérifiez votre configuration Twilio.');
    return false;
  }
};

const isSmsWorkflowProcessed = (workflowId: string, bookingId: string, trigger: string): boolean => {
  const key = `sms-${workflowId}-${bookingId}-${trigger}`;
  const lastProcessed = processedSmsWorkflows.get(key);
  const now = Date.now();

  if (lastProcessed && (now - lastProcessed) < DEBOUNCE_TIME) {
    console.log(`⏭️ SMS WORKFLOW DÉJÀ TRAITÉ: ${key} (il y a ${now - lastProcessed}ms)`);
    return true;
  }

  processedSmsWorkflows.set(key, now);

  for (const [k, v] of processedSmsWorkflows.entries()) {
    if (now - v > 60000) {
      processedSmsWorkflows.delete(k);
    }
  }

  return false;
};

export const triggerSmsWorkflow = async (trigger: string, booking: Booking, userId?: string): Promise<void> => {
  console.log('📱 ========================================');
  console.log('📱 DÉBUT DÉCLENCHEMENT SMS WORKFLOW');
  console.log('📱 ========================================');
  console.log('📋 Trigger:', trigger);
  console.log('📋 Réservation ID:', booking.id);
  console.log('📋 Client:', booking.client_email);
  console.log('📋 Téléphone:', booking.client_phone);
  console.log('📋 Service:', booking.service?.name || 'Service inconnu');
  console.log('📋 User ID:', userId);

  if (!userId) {
    console.log('⚠️ PAS D\'UTILISATEUR CONNECTÉ - SMS Workflow ignoré');
    return;
  }

  if (!booking.client_phone || booking.client_phone.trim() === '') {
    console.log('⚠️ PAS DE NUMÉRO DE TÉLÉPHONE - SMS ignoré');
    return;
  }

  if (trigger === 'payment_link_created') {
    console.log('💳 DEBUG PAYMENT_LINK_CREATED SMS:');
    console.log('💳 Payment link:', booking.payment_link);

    if (!booking.payment_link || booking.payment_link.trim() === '') {
      console.log('⚠️ PAS DE LIEN DE PAIEMENT - SMS payment_link_created ignoré');
      return;
    }
  }

  if (trigger === 'payment_link_paid') {
    console.log('💳 DEBUG PAYMENT_LINK_PAID SMS:');
    console.log('💳 Transactions:', booking.transactions?.length || 0);

    const hasStripePayment = booking.transactions?.some(t =>
      t.method === 'stripe' &&
      t.status === 'completed'
    );

    console.log('💳 A transaction Stripe complétée:', hasStripePayment);

    if (!hasStripePayment) {
      console.log('⚠️ AUCUNE TRANSACTION STRIPE COMPLÉTÉE - SMS payment_link_paid ignoré');
      return;
    }
  }

  const configured = isSupabaseConfigured();
  console.log('🔍 Supabase configuré:', configured);

  if (!configured) {
    console.log('⚠️ SUPABASE NON CONFIGURÉ - SMS Workflow ignoré');
    return;
  }

  try {
    console.log('🔍 Recherche SMS workflows pour trigger:', trigger, 'user_id:', userId);
    const { data: workflows, error: workflowsError } = await supabase!
      .from('sms_workflows')
      .select('*')
      .eq('user_id', userId)
      .eq('trigger', trigger)
      .eq('active', true);

    if (workflowsError) {
      console.error('❌ Erreur chargement SMS workflows:', workflowsError);
      return;
    }

    console.log('📊 SMS Workflows trouvés:', workflows?.length || 0);

    if (!workflows || workflows.length === 0) {
      console.log('ℹ️ Aucun SMS workflow actif pour le déclencheur:', trigger);
      return;
    }

    const templateIds = workflows.map(w => w.template_id);
    console.log('🔍 Chargement SMS templates:', templateIds);
    const { data: templates, error: templatesError } = await supabase!
      .from('sms_templates')
      .select('*')
      .in('id', templateIds);

    if (templatesError) {
      console.error('❌ Erreur chargement SMS templates:', templatesError);
      return;
    }

    console.log('📊 SMS Templates trouvés:', templates?.length || 0);

    const matchingWorkflows = workflows.filter(workflow => {
      const matches = checkWorkflowConditions(workflow, booking);
      console.log(`🔍 SMS Workflow "${workflow.name}" conditions:`, matches);
      return matches;
    });

    console.log('🔍 SMS Workflows correspondants aux conditions:', matchingWorkflows.length);

    for (const workflow of matchingWorkflows) {
      try {
        if (isSmsWorkflowProcessed(workflow.id, booking.id, trigger)) {
          console.log(`⏭️ SMS WORKFLOW IGNORÉ (déjà traité): ${workflow.name}`);
          continue;
        }

        console.log('⚡ ========================================');
        console.log('⚡ EXÉCUTION SMS WORKFLOW:', workflow.name);
        console.log('⚡ ========================================');
        console.log('📱 Template ID:', workflow.template_id);

        const template = templates?.find(t => t.id === workflow.template_id);
        if (!template) {
          console.error(`❌ SMS Template non trouvé: ${workflow.template_id}`);
          continue;
        }

        console.log('✅ SMS Template trouvé:', template.name);

        if (workflow.delay && workflow.delay > 0) {
          console.log('⏳ Attente de', workflow.delay, 'secondes...');
          await new Promise(resolve => setTimeout(resolve, workflow.delay * 1000));
        }

        const message = replaceVariables(template.content, booking);
        console.log('📱 Message préparé (longueur:', message.length, '):', message);

        if (message.length > 160) {
          console.error('❌ Message SMS trop long:', message.length, 'caractères');
          continue;
        }

        console.log('📤 Tentative envoi SMS à:', booking.client_phone);
        const success = await sendSmsViaTwilio(
          userId,
          booking.client_phone,
          message,
          workflow.id,
          booking.id
        );

        console.log('📱 Résultat envoi SMS:', success ? '✅ SUCCÈS' : '❌ ÉCHEC');

        if (success) {
          console.log('📊 Mise à jour statistiques SMS workflow...');
          await supabase!
            .from('sms_workflows')
            .update({
              sent_count: workflow.sent_count + 1
            })
            .eq('id', workflow.id);
          console.log('✅ Statistiques SMS mises à jour');
        }

        console.log(success ? '✅' : '❌', 'SMS Workflow', workflow.name, success ? 'réussi' : 'échoué');

      } catch (error) {
        console.error('❌ Erreur SMS workflow', workflow.name, ':', error);
      }
    }
  } catch (error) {
    console.error('❌ Erreur générale SMS workflow:', error);
  }

  console.log('🏁 ========================================');
  console.log('🏁 FIN EXÉCUTION SMS WORKFLOWS POUR:', trigger);
  console.log('🏁 ========================================');
};

export const sendManualSms = async (
  userId: string,
  toPhone: string,
  message: string
): Promise<boolean> => {
  console.log('📱 ENVOI SMS MANUEL');
  console.log('📱 User ID:', userId);
  console.log('📱 À:', toPhone);
  console.log('📱 Message:', message);

  if (!isSupabaseConfigured()) {
    console.log('⚠️ SUPABASE NON CONFIGURÉ - SMS manuel non envoyé');
    throw new Error('Supabase non configuré');
  }

  if (message.length > 160) {
    throw new Error('Le message SMS ne peut pas dépasser 160 caractères');
  }

  return await sendSmsViaTwilio(userId, toPhone, message);
};
