import { supabase } from '../lib/supabase';
import { Invoice } from '../types';
import { generateInvoicePDFDataUrl } from './pdfGenerator';

export async function sendInvoiceEmail(invoice: Invoice): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase non configuré');
  }

  // Récupérer l'utilisateur connecté
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Utilisateur non connecté');
  }

  // Récupérer les paramètres Brevo depuis business_settings
  const { data: businessSettings, error: settingsError } = await supabase
    .from('business_settings')
    .select('brevo_enabled, brevo_api_key, brevo_sender_email, brevo_sender_name, business_name')
    .eq('user_id', user.id)
    .single();

  if (settingsError || !businessSettings) {
    throw new Error('Paramètres non trouvés. Veuillez configurer Brevo dans Paramètres > Général.');
  }

  // Vérifier que Brevo est configuré
  if (!businessSettings.brevo_enabled || !businessSettings.brevo_api_key || !businessSettings.brevo_sender_email) {
    throw new Error('Brevo non configuré. Veuillez activer et configurer Brevo dans Paramètres > Général.');
  }

  // ✅ Récupérer les infos de l'entreprise AVEC les couleurs personnalisées
  const { data: companyInfo } = await supabase
    .from('company_info')
    .select('*')
    .eq('user_id', user.id)
    .single();

  console.log('📧 Génération PDF pour email avec companyInfo:', companyInfo);

  // ✅ Générer le PDF avec les couleurs personnalisées (plus de distinction preview/email)
  const pdfDataUrl = await generateInvoicePDFDataUrl(invoice, companyInfo);
  
  // Extraire seulement la partie base64 (après "data:application/pdf;base64,")
  const pdfBase64 = pdfDataUrl.split(',')[1];

  console.log('📧 PDF généré avec couleurs personnalisées, taille base64:', pdfBase64.length);

  // Préparer le contenu HTML de l'email
  const businessName = businessSettings.business_name || companyInfo?.company_name || 'BookingPro';
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 10px; margin-top: 20px; }
        .invoice-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { color: #6b7280; }
        .detail-value { font-weight: bold; color: #111827; }
        .total { font-size: 24px; color: #9333ea; font-weight: bold; }
        .footer { text-align: center; color: #6b7280; margin-top: 30px; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Nouveau ${invoice.document_type === 'quote' ? 'Devis' : 'Facture'}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${invoice.document_type === 'quote' ? (invoice.quote_number || invoice.invoice_number) : invoice.invoice_number}</p>
        </div>
        
        <div class="content">
          <p>Bonjour ${invoice.client?.firstname} ${invoice.client?.lastname},</p>
          
          <p>Veuillez trouver ci-joint votre ${invoice.document_type === 'quote' ? 'devis' : 'facture'}.</p>
          
          <div class="invoice-details">
            <div class="detail-row">
              <span class="detail-label">Numéro:</span>
              <span class="detail-value">${invoice.document_type === 'quote' ? (invoice.quote_number || invoice.invoice_number) : invoice.invoice_number}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${new Date(invoice.invoice_date).toLocaleDateString('fr-FR')}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date d'échéance:</span>
              <span class="detail-value">${new Date(invoice.due_date).toLocaleDateString('fr-FR')}</span>
            </div>
            <div class="detail-row" style="border-bottom: none; padding-top: 20px;">
              <span class="detail-label" style="font-size: 18px;">Montant total TTC:</span>
              <span class="total">${invoice.total_ttc.toFixed(2)}€</span>
            </div>
          </div>
          
          <p>Le PDF est joint à cet email.</p>
          
          <p>Cordialement,<br>${businessName}</p>
        </div>
        
        <div class="footer">
          <p>${businessName}</p>
          ${companyInfo?.email ? `<p>${companyInfo.email}</p>` : ''}
          ${companyInfo?.phone ? `<p>${companyInfo.phone}</p>` : ''}
        </div>
      </div>
    </body>
    </html>
  `;

  const documentNumber = invoice.document_type === 'quote' 
    ? (invoice.quote_number || invoice.invoice_number)
    : invoice.invoice_number;

  const fileName = invoice.document_type === 'quote' 
    ? `Devis_${documentNumber}.pdf`
    : `Facture_${documentNumber}.pdf`;

  // Appeler l'Edge Function pour envoyer l'email
  const { data, error } = await supabase.functions.invoke('send-brevo-email', {
    body: {
      brevo_api_key: businessSettings.brevo_api_key,
      brevo_sender_email: businessSettings.brevo_sender_email,
      brevo_sender_name: businessSettings.brevo_sender_name || businessName,
      to_email: invoice.client?.email,
      to_name: `${invoice.client?.firstname} ${invoice.client?.lastname}`,
      subject: `${invoice.document_type === 'quote' ? 'Devis' : 'Facture'} ${documentNumber}`,
      html_content: emailHtml,
      text_content: `${invoice.document_type === 'quote' ? 'Devis' : 'Facture'} ${documentNumber} - Montant: ${invoice.total_ttc.toFixed(2)}€`,
      attachments: [
        {
          name: fileName,
          content: pdfBase64,
          type: 'application/pdf'
        }
      ]
    }
  });

  if (error) {
    console.error('Erreur Edge Function:', error);
    throw new Error(error.message || 'Erreur lors de l\'envoi de l\'email');
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Erreur lors de l\'envoi de l\'email');
  }

  console.log('✅ Email envoyé avec succès avec couleurs personnalisées');
}
