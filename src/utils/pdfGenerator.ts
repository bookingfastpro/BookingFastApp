import jsPDF from 'jspdf';
import { Invoice } from '../types';

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ]
    : [147, 51, 234]; // Couleur par défaut (violet)
}

function getColors(companyInfo?: any) {
  // Utiliser les couleurs personnalisées si disponibles
  if (companyInfo?.pdf_primary_color) {
    const primaryColor = hexToRgb(companyInfo.pdf_primary_color);
    const primaryLight: [number, number, number] = [
      Math.min(primaryColor[0] + 50, 255),
      Math.min(primaryColor[1] + 50, 255),
      Math.min(primaryColor[2] + 50, 255)
    ];
    const accentColor = hexToRgb(companyInfo.pdf_accent_color || '#ec4899');
    const textDark = hexToRgb(companyInfo.pdf_text_color || '#1f2937');
    
    return {
      primary: primaryColor,
      primaryLight,
      accent: accentColor,
      textDark,
      textMedium: [107, 114, 128] as [number, number, number],
      bgLight: [249, 250, 251] as [number, number, number],
      white: [255, 255, 255] as [number, number, number]
    };
  }
  
  // Couleurs par défaut (violet & rose)
  return {
    primary: [147, 51, 234] as [number, number, number],
    primaryLight: [197, 101, 255] as [number, number, number],
    accent: [236, 72, 153] as [number, number, number],
    textDark: [31, 41, 55] as [number, number, number],
    textMedium: [107, 114, 128] as [number, number, number],
    bgLight: [249, 250, 251] as [number, number, number],
    white: [255, 255, 255] as [number, number, number]
  };
}

export function generateInvoicePDF(invoice: Invoice, companyInfo?: any) {
  const doc = createInvoicePDF(invoice, companyInfo);
  const fileName = invoice.document_type === 'quote' 
    ? `Devis_${invoice.quote_number || invoice.invoice_number}.pdf`
    : `Facture_${invoice.invoice_number}.pdf`;
  doc.save(fileName);
}

export async function generateInvoicePDFBlob(invoice: Invoice, companyInfo?: any): Promise<Blob> {
  const doc = createInvoicePDF(invoice, companyInfo);
  return doc.output('blob');
}

export async function generateInvoicePDFDataUrl(invoice: Invoice, companyInfo?: any): Promise<string> {
  console.log('📄 Création PDF avec companyInfo:', companyInfo);
  const doc = createInvoicePDF(invoice, companyInfo);
  return doc.output('dataurlstring');
}

function createInvoicePDF(invoice: Invoice, companyInfo?: any): jsPDF {
  console.log('🏗️ Construction PDF, companyInfo reçu:', companyInfo);
  console.log('📋 Type de document:', invoice.document_type);
  
  const doc = new jsPDF();
  
  // ✅ Utiliser les couleurs personnalisées pour TOUS les PDFs (preview ET email)
  const colors = getColors(companyInfo);
  console.log('🎨 Couleurs utilisées:', colors);
  
  const primaryColor = colors.primary;
  const primaryLight = colors.primaryLight;
  const accentColor = colors.accent;
  const textDark = colors.textDark;
  const textMedium = colors.textMedium;
  const bgLight = colors.bgLight;
  const white = colors.white;

  let yPos = 20;

  const documentTitle = invoice.document_type === 'quote' ? 'DEVIS' : 'FACTURE';
  const documentNumber = invoice.document_type === 'quote' 
    ? (invoice.quote_number || invoice.invoice_number)
    : invoice.invoice_number;

  // ===== EN-TÊTE AVEC DÉGRADÉ =====
  doc.setFillColor(...primaryColor);
  doc.roundedRect(0, 0, 210, 50, 0, 0, 'F');
  
  doc.setFillColor(...accentColor);
  doc.circle(200, 10, 15, 'F');
  doc.setFillColor(...primaryLight);
  doc.circle(190, 45, 10, 'F');
  
  // ✅ Logo (si disponible) - MAINTENANT AUSSI POUR LES EMAILS
  if (companyInfo?.logo_url) {
    try {
      console.log('🖼️ Ajout du logo:', companyInfo.logo_url);
      doc.addImage(companyInfo.logo_url, 'PNG', 165, 10, 30, 30);
    } catch (error) {
      console.error('⚠️ Erreur ajout logo (non bloquant):', error);
    }
  }
  
  doc.setTextColor(...white);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text(documentTitle, 20, 28);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(documentNumber, 20, 40);

  // ===== SECTION ÉMETTEUR ET CLIENT =====
  yPos = 65;
  
  doc.setFillColor(...bgLight);
  doc.roundedRect(15, yPos, 85, 50, 3, 3, 'F');
  
  doc.setTextColor(...textMedium);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('ÉMETTEUR', 20, yPos + 6);
  
  let emitterYPos = yPos + 12;
  
  if (companyInfo) {
    doc.setTextColor(...textDark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    
    if (companyInfo.company_name) {
      doc.text(companyInfo.company_name, 20, emitterYPos);
      emitterYPos += 6;
    }
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    if (companyInfo.address) {
      const addressLines = doc.splitTextToSize(companyInfo.address, 75);
      doc.text(addressLines, 20, emitterYPos);
      emitterYPos += addressLines.length * 4;
    }
    
    if (companyInfo.postal_code || companyInfo.city) {
      const location = `${companyInfo.postal_code || ''} ${companyInfo.city || ''}`.trim();
      doc.text(location, 20, emitterYPos);
      emitterYPos += 4;
    }
    
    if (companyInfo.siret) {
      doc.setTextColor(...textMedium);
      doc.text(`SIRET: ${companyInfo.siret}`, 20, emitterYPos);
      emitterYPos += 4;
      doc.setTextColor(...textDark);
    }
    
    if (companyInfo.email) {
      doc.text(companyInfo.email, 20, emitterYPos);
      emitterYPos += 4;
    }
    
    if (companyInfo.phone) {
      doc.text(companyInfo.phone, 20, emitterYPos);
    }
  } else {
    doc.setTextColor(...textMedium);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('Informations non renseignées', 20, emitterYPos);
  }

  yPos = 65;
  doc.setFillColor(...bgLight);
  doc.roundedRect(110, yPos, 85, 50, 3, 3, 'F');
  
  doc.setTextColor(...textMedium);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT', 115, yPos + 6);
  
  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  yPos += 12;
  
  if (invoice.client) {
    doc.text(`${invoice.client.firstname} ${invoice.client.lastname}`, 115, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    if (invoice.client.email) {
      doc.text(invoice.client.email, 115, yPos);
      yPos += 4;
    }
    
    if (invoice.client.phone) {
      doc.text(invoice.client.phone, 115, yPos);
    }
  }

  // ===== DATES =====
  yPos = 125;
  doc.setFillColor(...primaryLight);
  doc.roundedRect(15, yPos, 180, 18, 3, 3, 'F');
  
  doc.setTextColor(...textDark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.document_type === 'quote' ? 'Date du devis:' : 'Date de facture:', 20, yPos + 7);
  doc.text('Date d\'échéance:', 20, yPos + 14);
  
  doc.setFont('helvetica', 'normal');
  const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR');
  doc.text(formatDate(invoice.invoice_date), 70, yPos + 7);
  doc.text(formatDate(invoice.due_date), 70, yPos + 14);

  // ===== TABLEAU DES PRODUITS =====
  yPos += 28;
  
  doc.setFillColor(...primaryColor);
  doc.roundedRect(15, yPos, 180, 12, 3, 3, 'F');
  
  doc.setTextColor(...white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 20, yPos + 8);
  doc.text('Qté', 125, yPos + 8, { align: 'center' });
  doc.text('Prix HT', 145, yPos + 8, { align: 'center' });
  doc.text('TVA', 165, yPos + 8, { align: 'center' });
  doc.text('Total TTC', 185, yPos + 8, { align: 'right' });
  
  yPos += 12;

  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  invoice.items?.forEach((item, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(...bgLight);
    } else {
      doc.setFillColor(...white);
    }
    doc.roundedRect(15, yPos, 180, 10, 2, 2, 'F');
    
    const description = item.description.length > 45 
      ? item.description.substring(0, 42) + '...' 
      : item.description;
    doc.text(description, 20, yPos + 6);
    doc.text(item.quantity.toString(), 125, yPos + 6, { align: 'center' });
    doc.text(`${item.unit_price_ht.toFixed(2)}€`, 145, yPos + 6, { align: 'center' });
    doc.text(`${item.tva_rate}%`, 165, yPos + 6, { align: 'center' });
    
    doc.setFont('helvetica', 'bold');
    doc.text(`${item.total_ttc.toFixed(2)}€`, 185, yPos + 6, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    
    yPos += 12;
    
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
  });

  // ===== TOTAUX =====
  yPos += 5;
  
  doc.setFillColor(...bgLight);
  doc.roundedRect(110, yPos, 85, 35, 3, 3, 'F');
  
  doc.setTextColor(...textDark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Sous-total HT:', 115, yPos + 8);
  doc.text(`${invoice.subtotal_ht.toFixed(2)}€`, 190, yPos + 8, { align: 'right' });
  
  doc.text('TVA:', 115, yPos + 16);
  doc.text(`${invoice.total_tva.toFixed(2)}€`, 190, yPos + 16, { align: 'right' });
  
  doc.setFillColor(...accentColor);
  doc.roundedRect(110, yPos + 20, 85, 15, 3, 3, 'F');
  
  doc.setTextColor(...white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL TTC:', 115, yPos + 30);
  doc.setFontSize(14);
  doc.text(`${invoice.total_ttc.toFixed(2)}€`, 190, yPos + 30, { align: 'right' });

  // ===== NOTES =====
  if (invoice.notes) {
    yPos += 45;
    
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFillColor(...bgLight);
    doc.roundedRect(15, yPos, 180, 30, 3, 3, 'F');
    
    doc.setTextColor(...textMedium);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTES', 20, yPos + 6);
    
    doc.setTextColor(...textDark);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const splitNotes = doc.splitTextToSize(invoice.notes, 170);
    doc.text(splitNotes, 20, yPos + 12);
  }

  // ===== PIED DE PAGE =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    doc.setFillColor(...primaryColor);
    doc.roundedRect(0, 282, 210, 15, 0, 0, 'F');
    
    doc.setFillColor(...accentColor);
    doc.circle(10, 289.5, 3, 'F');
    doc.circle(200, 289.5, 3, 'F');
    
    doc.setTextColor(...white);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${documentTitle} ${documentNumber} - Page ${i}/${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  console.log('✅ PDF créé avec succès avec couleurs personnalisées');
  return doc;
}
