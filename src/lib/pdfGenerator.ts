import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quote, CompanySettings, Order, Payment } from '../types';
import { formatFCFA, formatDateNumeric } from './formatters';
import { BRAND_LOGO_SRC, BRAND_STAMP_SRC, BRAND_SIGNATURE_SRC } from './brand';

export const STATIC_LOGO_PATH = '/assets/logo.png';
export const STATIC_CACHET_PATH = '/assets/cachet.png';
export const STATIC_SIGNATURE_PATH = '/assets/signature.png';

interface PreparedImageInfo {
  dataUrl: string;
  width: number;
  height: number;
  format: 'PNG' | 'JPEG';
}

/**
 * Robust image preloader converting local paths or remote URLs to base64 Data URLs for jsPDF
 */
function loadAndPrepareImage(src: string): Promise<PreparedImageInfo | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 400;
        canvas.height = img.naturalHeight || 400;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const isJpg = src.toLowerCase().includes('.jpg') || src.toLowerCase().includes('.jpeg');
        const format: 'PNG' | 'JPEG' = isJpg ? 'JPEG' : 'PNG';
        const dataUrl = canvas.toDataURL(isJpg ? 'image/jpeg' : 'image/png');
        resolve({
          dataUrl,
          width: canvas.width,
          height: canvas.height,
          format,
        });
      } catch (err) {
        console.warn('Canvas conversion failed:', err);
        const format: 'PNG' | 'JPEG' = (src.toLowerCase().includes('.jpg') || src.toLowerCase().includes('.jpeg')) ? 'JPEG' : 'PNG';
        resolve({
          dataUrl: src,
          width: img.naturalWidth || 200,
          height: img.naturalHeight || 200,
          format,
        });
      }
    };
    img.onerror = (err) => {
      console.warn('Image failed to load in PDF generator:', src, err);
      resolve(null);
    };
    img.src = src;
  });
}

/**
 * Determine format for jsPDF addImage
 */
function getImageFormat(src: string): 'PNG' | 'JPEG' | 'WEBP' {
  if (
    src.startsWith('data:image/jpeg') || 
    src.startsWith('data:image/jpg') || 
    src.toLowerCase().endsWith('.jpg') || 
    src.toLowerCase().endsWith('.jpeg')
  ) {
    return 'JPEG';
  }
  if (src.startsWith('data:image/webp') || src.toLowerCase().endsWith('.webp')) {
    return 'WEBP';
  }
  return 'PNG';
}

/**
 * Generate and download a high-end vector PDF for a Devis (Quote)
 */
export async function generateQuotePDF(quote: Quote, company: CompanySettings): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Primary brand palette
  const darkBrown = [39, 24, 18]; // Deep wood mahogany
  const amberAccent = [180, 83, 9]; // Warm amber/oak
  const slateDark = [30, 41, 59];
  const slateMuted = [100, 116, 139];
  const lightGrayBg = [248, 250, 252];
  const borderGray = [226, 232, 240];

  let currentY = margin;

  // 1. Top Decorative Bar
  doc.setFillColor(darkBrown[0], darkBrown[1], darkBrown[2]);
  doc.rect(margin, currentY, contentWidth, 3, 'F');
  currentY += 8;

  // 2. Company Brand & Contact Header
  let textStartX = margin;
  const logoSource = company.logo_url || STATIC_LOGO_PATH;
  if (logoSource) {
    try {
      const preparedLogo = await loadAndPrepareImage(logoSource);
      if (preparedLogo) {
        const maxLogoW = 24;
        const maxLogoH = 22;
        let logoW = maxLogoW;
        let logoH = maxLogoW * (preparedLogo.height / preparedLogo.width);
        if (logoH > maxLogoH) {
          logoH = maxLogoH;
          logoW = maxLogoH * (preparedLogo.width / preparedLogo.height);
        }
        doc.addImage(preparedLogo.dataUrl, preparedLogo.format, margin, currentY - 1, logoW, logoH);
        textStartX = margin + logoW + 5;
      }
    } catch (err) {
      console.warn('Could not draw logo in PDF:', err);
      textStartX = margin;
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(darkBrown[0], darkBrown[1], darkBrown[2]);
  doc.text(company.name.toUpperCase(), textStartX, currentY + 4.5);

  currentY += 8.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.text(company.activity.toUpperCase(), textStartX, currentY);

  currentY += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(company.address, textStartX, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.text(`Tél / WhatsApp : `, textStartX, currentY);
  const telLabelW = doc.getTextWidth(`Tél / WhatsApp : `);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(`${company.phone_primary}   |   ${company.phone_secondary}`, textStartX + telLabelW, currentY);

  // Right-aligned Document Badge (DEVIS)
  const headerRightX = pageWidth - margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(darkBrown[0], darkBrown[1], darkBrown[2]);
  doc.text('DEVIS', headerRightX, margin + 8, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.text(`N° ${quote.quote_number}`, headerRightX, margin + 15, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(`Date : ${formatDateNumeric(quote.date)}`, headerRightX, margin + 21, { align: 'right' });
  doc.text(`Validité : ${quote.validity_days} jours`, headerRightX, margin + 26, { align: 'right' });

  currentY = Math.max(currentY + 7, margin + 32);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  // 3. Client & Billing Card (Two-column layout with larger typography)
  const cardHeight = 34;
  const colWidth = (contentWidth - 6) / 2;

  // Left: Enterprise summary
  doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
  doc.roundedRect(margin, currentY, colWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, currentY, colWidth, cardHeight, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.text("ÉMETTEUR / ATELIER", margin + 4.5, currentY + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(company.manager_name, margin + 4.5, currentY + 12.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(`Responsable Menuisier Tapissier`, margin + 4.5, currentY + 17.5);
  doc.text(`${company.city} — ${company.country}`, margin + 4.5, currentY + 22.5);
  doc.setFontSize(9);
  doc.text(`Repère : 100m av. station Blessing, côté Sorepco`, margin + 4.5, currentY + 27.5);

  // Right: Client Info
  const clientCardX = margin + colWidth + 6;
  doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
  doc.roundedRect(clientCardX, currentY, colWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(clientCardX, currentY, colWidth, cardHeight, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.text("DESTINATAIRE / CLIENT", clientCardX + 4.5, currentY + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(quote.client_name || 'Client', clientCardX + 4.5, currentY + 12.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(`Tél / WhatsApp : `, clientCardX + 4.5, currentY + 17.5);
  const clientTelX = clientCardX + 4.5 + doc.getTextWidth(`Tél / WhatsApp : `);
  doc.setFont('helvetica', 'bold');
  doc.text(`${quote.client_phone || '—'}`, clientTelX, currentY + 17.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(`Adresse : ${quote.client_address || 'Yaoundé'}`, clientCardX + 4.5, currentY + 22.5);
  if (quote.client_email) {
    doc.text(`Email : ${quote.client_email}`, clientCardX + 4.5, currentY + 27.5);
  } else {
    doc.text(`Devise de facturation : ${company.currency}`, clientCardX + 4.5, currentY + 27.5);
  }

  currentY += cardHeight + 6;

  // 3bis. Project & Object Details Block
  const projectObj = quote.project_object || 'Travaux de menuiserie et tapisserie';
  doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const descLines = quote.project_description ? doc.splitTextToSize(quote.project_description, contentWidth - 14) : [];
  const hasMeta = Boolean(quote.execution_location || quote.estimated_duration);
  const pBoxH = 12 + (descLines.length * 4.2) + (hasMeta ? 5.5 : 0);

  doc.roundedRect(margin, currentY, contentWidth, pBoxH, 2, 2, 'F');
  doc.roundedRect(margin, currentY, contentWidth, pBoxH, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.text("OBJET DU DEVIS :", margin + 4.5, currentY + 5.5);

  const objLabelW = doc.getTextWidth("OBJET DU DEVIS : ") + 1;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(projectObj, margin + 4.5 + objLabelW, currentY + 5.5);

  let curPY = currentY + 10.5;
  if (descLines.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(descLines, margin + 4.5, curPY);
    curPY += descLines.length * 4.2;
  }

  if (hasMeta) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    const details = [
      quote.execution_location ? `Lieu d'exécution : ${quote.execution_location}` : null,
      quote.estimated_duration ? `Durée estimée : ${quote.estimated_duration}` : null,
    ].filter(Boolean).join('     |     ');
    doc.text(details, margin + 4.5, curPY);
  }

  currentY += pBoxH + 6;

  // 4. Line Items Table (Prestations & Main d'œuvre)
  const materialsSubtotal = (quote.materials_subtotal !== undefined)
    ? quote.materials_subtotal
    : quote.items.filter(it => it.item_type !== 'main_d_oeuvre').reduce((s, it) => s + (it.total_price || 0), 0);

  const laborSubtotal = (quote.labor_subtotal !== undefined)
    ? quote.labor_subtotal
    : quote.items.filter(it => it.item_type === 'main_d_oeuvre').reduce((s, it) => s + (it.total_price || 0), 0);

  const hasSeparateLabor = laborSubtotal > 0 && materialsSubtotal > 0;

  const tableRows = quote.items.map((item, index) => {
    const isLabor = item.item_type === 'main_d_oeuvre';
    const tag = isLabor ? '[MAIN D\'ŒUVRE] ' : '';
    const descriptionText = item.description ? `\n${item.description}` : '';
    return [
      String(index + 1).padStart(2, '0'),
      `${tag}${item.designation}${descriptionText}`,
      String(item.quantity),
      item.unit || 'pièce',
      formatFCFA(item.unit_price).replace(' FCFA', ''),
      formatFCFA(item.total_price),
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['N°', 'DÉSIGNATION & PRESTATIONS', 'QTÉ', 'UNITÉ', 'P.U. (FCFA)', 'TOTAL (FCFA)']],
    body: tableRows,
    theme: 'plain',
    margin: { left: margin, right: margin },
    styles: {
      font: 'helvetica',
      fontSize: 9.8,
      textColor: [30, 41, 59],
      cellPadding: 3.5,
      lineColor: borderGray as [number, number, number],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: darkBrown as [number, number, number],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: 3.8,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 'auto', fontStyle: 'bold' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
    didDrawCell: (data) => {
      // Light alternate row highlight
      if (data.section === 'body' && data.row.index % 2 === 1) {
        doc.setFillColor(252, 252, 253);
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
      }
    },
  });

  // Calculate table end position
  // @ts-expect-error - jspdf-autotable attaches lastAutoTable
  currentY = doc.lastAutoTable.finalY + 6;

  // Determine if official stamp and signature are enabled on this quote
  const hasStampConfigured = !!(company.stamp_url || STATIC_CACHET_PATH);
  const shouldIncludeStamp = (quote.include_stamp !== false) && hasStampConfigured;
  const signatureSource = company.signature_url || STATIC_SIGNATURE_PATH;
  const hasSignatureConfigured = !!signatureSource;
  const hasWorkshopEndorsement = shouldIncludeStamp || hasSignatureConfigured;
  const sigBoxHeight = hasWorkshopEndorsement ? 42 : 28;

  // 5. Totals & Financial Breakdown (Right-aligned card with enlarged typography)
  const totalsWidth = 86;
  const totalsX = pageWidth - margin - totalsWidth;
  const totalsY = currentY;
  const baseBoxHeight = quote.discount_amount > 0 ? 52 : 46;
  const totalsBoxHeight = hasSeparateLabor ? baseBoxHeight + 12 : baseBoxHeight;

  // Check if we need space for totals and signatures
  if (currentY > pageHeight - (hasWorkshopEndorsement ? 104 : 88) - (hasSeparateLabor ? 12 : 0)) {
    doc.addPage();
    currentY = margin + 10;
  }

  // Background for financial summary
  doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
  doc.roundedRect(totalsX, totalsY, totalsWidth, totalsBoxHeight, 2, 2, 'F');
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(totalsX, totalsY, totalsWidth, totalsBoxHeight, 2, 2, 'S');

  let finY = totalsY + 6.5;

  if (hasSeparateLabor) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text("Fournitures & Matériaux :", totalsX + 4.5, finY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(formatFCFA(materialsSubtotal), totalsX + totalsWidth - 4.5, finY, { align: 'right' });

    finY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text("Partie Main d'œuvre :", totalsX + 4.5, finY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(formatFCFA(laborSubtotal), totalsX + totalsWidth - 4.5, finY, { align: 'right' });

    finY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text("Sous-total brut :", totalsX + 4.5, finY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(formatFCFA(quote.subtotal), totalsX + totalsWidth - 4.5, finY, { align: 'right' });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text("Sous-total brut :", totalsX + 4.5, finY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(formatFCFA(quote.subtotal), totalsX + totalsWidth - 4.5, finY, { align: 'right' });
  }

  if (quote.discount_amount > 0) {
    finY += 6.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    const discountLabel = quote.discount_type === 'percent' ? `Remise (${quote.discount_value}%) :` : 'Remise commerciale :';
    doc.text(discountLabel, totalsX + 4.5, finY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(190, 18, 60); // Red/rose for discount
    doc.text(`- ${formatFCFA(quote.discount_amount)}`, totalsX + totalsWidth - 4.5, finY, { align: 'right' });
  }

  finY += 7.5;
  // Total Banner inside the box (high impact)
  doc.setFillColor(darkBrown[0], darkBrown[1], darkBrown[2]);
  doc.rect(totalsX, finY - 5, totalsWidth, 9.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL NET À PAYER :", totalsX + 4.5, finY + 1.2);
  doc.setFontSize(12);
  doc.text(formatFCFA(quote.total_amount), totalsX + totalsWidth - 4.5, finY + 1.2, { align: 'right' });

  finY += 10.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text("Acompte demandé :", totalsX + 4.5, finY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.text(formatFCFA(quote.deposit_requested), totalsX + totalsWidth - 4.5, finY, { align: 'right' });

  finY += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text("Reste à solder :", totalsX + 4.5, finY);
  doc.setFontSize(11.5);
  doc.setTextColor(190, 18, 60);
  doc.text(formatFCFA(quote.balance_due), totalsX + totalsWidth - 4.5, finY, { align: 'right' });

  // Left: Conditions and notes with enhanced typography
  const notesWidth = contentWidth - totalsWidth - 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.text("CONDITIONS & MODALITÉS", margin, totalsY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  const splitTerms = doc.splitTextToSize(quote.terms_and_conditions || company.default_terms, notesWidth);
  doc.text(splitTerms, margin, totalsY + 10.5, { lineHeightFactor: 1.35 });

  if (quote.notes) {
    const notesOffset = totalsY + 10.5 + (splitTerms.length * 4.2) + 3.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text("Note au client :", margin, notesOffset);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    const splitNotes = doc.splitTextToSize(quote.notes, notesWidth);
    doc.text(splitNotes, margin, notesOffset + 4.5, { lineHeightFactor: 1.3 });
  }

  currentY = totalsY + totalsBoxHeight + 6;

  // 6. Signatures and Official Stamp Block (Spacious & Legible)
  if (currentY + sigBoxHeight > pageHeight - 16) {
    doc.addPage();
    currentY = margin + 10;
  }

  const sigColWidth = (contentWidth - 10) / 2;
  const sigBoxY = currentY;

  // Left: Client signature box
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, sigBoxY, sigColWidth, sigBoxHeight, 2, 2, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text("BON POUR ACCORD ET COMMANDE", margin + 5, sigBoxY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text("Date et Signature du Client précédées de 'Lu et approuvé' :", margin + 5, sigBoxY + 11);

  // Right: Workshop signature & cachet box
  const sigWorkshopX = margin + sigColWidth + 10;
  doc.roundedRect(sigWorkshopX, sigBoxY, sigColWidth, sigBoxHeight, 2, 2, 'S');

  const stampSource = shouldIncludeStamp ? (company.stamp_url || STATIC_CACHET_PATH) : '';
  const sigSource = company.signature_url || STATIC_SIGNATURE_PATH;

  if (stampSource || sigSource) {
    try {
      const [preparedStamp, preparedSignature] = await Promise.all([
        stampSource ? loadAndPrepareImage(stampSource) : Promise.resolve(null),
        sigSource ? loadAndPrepareImage(sigSource) : Promise.resolve(null),
      ]);

      if (preparedStamp || preparedSignature) {
        // Top label: CACHET & SIGNATURE
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
        const headerText = (preparedStamp && preparedSignature)
          ? "CACHET & SIGNATURE"
          : preparedStamp
            ? "CACHET OFFICIEL"
            : "SIGNATURE DU RESPONSABLE";
        doc.text(headerText, sigWorkshopX + sigColWidth / 2, sigBoxY + 5.5, { align: 'center' });

        if (preparedStamp && preparedSignature) {
          // Both stamp & signature: Stamp on left, signature on right
          const stampMaxDim = 22;
          let sW = stampMaxDim;
          let sH = stampMaxDim * (preparedStamp.height / preparedStamp.width);
          if (sH > stampMaxDim) {
            sH = stampMaxDim;
            sW = stampMaxDim * (preparedStamp.width / preparedStamp.height);
          }
          const stampX = sigWorkshopX + 6;
          const stampY = sigBoxY + 7 + (stampMaxDim - sH) / 2;
          doc.addImage(preparedStamp.dataUrl, preparedStamp.format, stampX, stampY, sW, sH);

          // Signature on right
          const sigMaxW = 42;
          const sigMaxH = 20;
          let sigW = sigMaxW;
          let sigH = sigMaxW * (preparedSignature.height / preparedSignature.width);
          if (sigH > sigMaxH) {
            sigH = sigMaxH;
            sigW = sigMaxH * (preparedSignature.width / preparedSignature.height);
          }
          const sigX = sigWorkshopX + sigColWidth - sigW - 6;
          const sigY = sigBoxY + 7 + (sigMaxH - sigH) / 2;
          doc.addImage(preparedSignature.dataUrl, preparedSignature.format, sigX, sigY, sigW, sigH);
        } else if (preparedStamp) {
          // Stamp only: Centered
          const maxW = 34;
          const maxH = 22;
          let stampW = maxW;
          let stampH = maxW * (preparedStamp.height / preparedStamp.width);
          if (stampH > maxH) {
            stampH = maxH;
            stampW = maxH * (preparedStamp.width / preparedStamp.height);
          }
          const stampX = sigWorkshopX + (sigColWidth - stampW) / 2;
          const stampY = sigBoxY + 6.5;
          doc.addImage(preparedStamp.dataUrl, preparedStamp.format, stampX, stampY, stampW, stampH);
        } else if (preparedSignature) {
          // Signature only: Centered
          const maxW = 48;
          const maxH = 22;
          let sigW = maxW;
          let sigH = maxW * (preparedSignature.height / preparedSignature.width);
          if (sigH > maxH) {
            sigH = maxH;
            sigW = maxH * (preparedSignature.width / preparedSignature.height);
          }
          const sigX = sigWorkshopX + (sigColWidth - sigW) / 2;
          const sigY = sigBoxY + 7;
          doc.addImage(preparedSignature.dataUrl, preparedSignature.format, sigX, sigY, sigW, sigH);
        }

        // Mouaffo Roméo / ROMÉO MEUBLE beneath the visuals
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
        doc.text(company.manager_name, sigWorkshopX + sigColWidth / 2, sigBoxY + 33, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
        doc.text(`${company.name} · Menuiserie & Tapisserie`, sigWorkshopX + sigColWidth / 2, sigBoxY + 37.5, { align: 'center' });
      } else {
        throw new Error('Stamp and signature could not be loaded');
      }
    } catch (err) {
      console.warn('Could not render stamp/signature image:', err);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
      doc.text(`Le Responsable : ${company.manager_name}`, sigWorkshopX + 5, sigBoxY + 11);
      doc.text("Signature / Cachet", sigWorkshopX + sigColWidth - 5, sigBoxY + sigBoxHeight - 5, { align: 'right' });
    }
  } else {
    // Clean space with "Signature / Cachet"
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(`POUR ${company.name.toUpperCase()}`, sigWorkshopX + 5, sigBoxY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(`Le Responsable : ${company.manager_name}`, sigWorkshopX + 5, sigBoxY + 11);

    doc.text("Signature / Cachet", sigWorkshopX + sigColWidth - 5, sigBoxY + sigBoxHeight - 5, { align: 'right' });
  }

  // 7. Footer (Crisp, High Contrast)
  const footerY = pageHeight - 9;
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.text("Merci pour votre confiance. — ROMÉO MEUBLE, l'artisanat du bois et du confort sur-mesure.", margin, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(`Page 1 / 1`, pageWidth - margin, footerY, { align: 'right' });

  return doc;
}

/**
 * Generate PDF for Order (Bon de Commande) with payment ledger and stamp
 */
export async function generateOrderPDF(order: Order, payments: Payment[], company: CompanySettings): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  const darkBrown = [39, 24, 18];
  const amberAccent = [180, 83, 9];
  const slateDark = [30, 41, 59];
  const slateMuted = [100, 116, 139];
  const lightGrayBg = [248, 250, 252];
  const borderGray = [226, 232, 240];

  let currentY = margin;

  // Header band
  doc.setFillColor(darkBrown[0], darkBrown[1], darkBrown[2]);
  doc.rect(margin, currentY, contentWidth, 3, 'F');
  currentY += 8;

  // Brand
  let textStartX = margin;
  const orderLogoSource = company.logo_url || STATIC_LOGO_PATH;
  if (orderLogoSource) {
    try {
      const preparedLogo = await loadAndPrepareImage(orderLogoSource);
      if (preparedLogo) {
        const maxLogoW = 24;
        const maxLogoH = 22;
        let logoW = maxLogoW;
        let logoH = maxLogoW * (preparedLogo.height / preparedLogo.width);
        if (logoH > maxLogoH) {
          logoH = maxLogoH;
          logoW = maxLogoH * (preparedLogo.width / preparedLogo.height);
        }
        doc.addImage(preparedLogo.dataUrl, preparedLogo.format, margin, currentY - 1, logoW, logoH);
        textStartX = margin + logoW + 5;
      }
    } catch {
      textStartX = margin;
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(darkBrown[0], darkBrown[1], darkBrown[2]);
  doc.text(company.name.toUpperCase(), textStartX, currentY + 4.5);

  currentY += 8.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.text(`${company.activity.toUpperCase()} — BON DE COMMANDE`, textStartX, currentY);

  currentY += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(company.address, textStartX, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.text(`Tél / WhatsApp : `, textStartX, currentY);
  const ordTelHeadW = doc.getTextWidth(`Tél / WhatsApp : `);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(`${company.phone_primary}   |   ${company.phone_secondary}`, textStartX + ordTelHeadW, currentY);

  // Right details
  const headerRightX = pageWidth - margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(darkBrown[0], darkBrown[1], darkBrown[2]);
  doc.text('COMMANDE', headerRightX, margin + 8, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.text(`N° ${order.order_number}`, headerRightX, margin + 15, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(`Date commande : ${formatDateNumeric(order.date)}`, headerRightX, margin + 21, { align: 'right' });
  if (order.quote_number) {
    doc.text(`Réf. Devis : ${order.quote_number}`, headerRightX, margin + 26, { align: 'right' });
  }

  currentY = Math.max(currentY + 7, margin + 32);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  // Client block
  const cardHeight = 28;
  doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
  doc.roundedRect(margin, currentY, contentWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, currentY, contentWidth, cardHeight, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.text("CLIENT & LIEU DE LIVRAISON", margin + 4.5, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(order.client_name, margin + 4.5, currentY + 12.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(`Téléphone : `, margin + 4.5, currentY + 18);
  const ordClientTelX = margin + 4.5 + doc.getTextWidth(`Téléphone : `);
  doc.setFont('helvetica', 'bold');
  doc.text(`${order.client_phone || '—'}`, ordClientTelX, currentY + 18);
  const afterTelOrdX = ordClientTelX + doc.getTextWidth(`${order.client_phone || '—'}`) + 4;
  doc.setFont('helvetica', 'normal');
  doc.text(`   |   Adresse : ${order.client_address || 'Yaoundé'}`, afterTelOrdX, currentY + 18);

  currentY += cardHeight + 8;

  // Items table
  const tableRows = order.items.map((item, idx) => [
    String(idx + 1).padStart(2, '0'),
    `${item.designation}${item.description ? `\n${item.description}` : ''}`,
    `${item.quantity} ${item.unit || 'U'}`,
    formatFCFA(item.unit_price).replace(' FCFA', ''),
    formatFCFA(item.total_price),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['N°', 'ARTICLES EN COMMANDE', 'QTÉ', 'P.U. (FCFA)', 'TOTAL (FCFA)']],
    body: tableRows,
    theme: 'plain',
    margin: { left: margin, right: margin },
    styles: {
      font: 'helvetica',
      fontSize: 9.8,
      textColor: [30, 41, 59],
      cellPadding: 3.5,
      lineColor: borderGray as [number, number, number],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: darkBrown as [number, number, number],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: 3.8,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 'auto', fontStyle: 'bold' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
  });

  // @ts-expect-error - jspdf-autotable
  currentY = doc.lastAutoTable.finalY + 8;

  // Payments summary
  const paidTotal = payments.reduce((acc, p) => acc + p.amount, 0);
  const remaining = Math.max(0, order.total_amount - paidTotal);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(darkBrown[0], darkBrown[1], darkBrown[2]);
  doc.text("HISTORIQUE DES ENCAISSEMENTS", margin, currentY);
  currentY += 4.5;

  const paymentRows = payments.map((p) => [
    formatDateNumeric(p.payment_date),
    p.payment_method.toUpperCase().replace('_', ' '),
    p.note || p.reference || 'Acompte / Règlement',
    formatFCFA(p.amount),
  ]);

  if (paymentRows.length === 0) {
    paymentRows.push(['—', 'Aucun règlement enregistré', '—', '0 FCFA']);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['DATE', 'MODE', 'DÉTAILS / RÉFÉRENCE', 'MONTANT']],
    body: paymentRows,
    theme: 'plain',
    margin: { left: margin, right: margin },
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [71, 85, 105],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9.5,
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 40 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
  });

  // @ts-expect-error - jspdf-autotable
  currentY = doc.lastAutoTable.finalY + 8;

  // Order Balance card
  const balWidth = 86;
  const balX = pageWidth - margin - balWidth;
  doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
  doc.roundedRect(balX, currentY, balWidth, 32, 2, 2, 'F');
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(balX, currentY, balWidth, 32, 2, 2, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text("Montant total commande :", balX + 4.5, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(formatFCFA(order.total_amount), balX + balWidth - 4.5, currentY + 7, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text("Total encaissé :", balX + 4.5, currentY + 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text(formatFCFA(paidTotal), balX + balWidth - 4.5, currentY + 15, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(remaining > 0 ? 190 : 16, remaining > 0 ? 18 : 185, remaining > 0 ? 60 : 129);
  doc.text("Solde restant dû :", balX + 4.5, currentY + 24);
  doc.setFontSize(11.5);
  doc.text(formatFCFA(remaining), balX + balWidth - 4.5, currentY + 24, { align: 'right' });

  // Workshop stamp and signature on order bon de commande
  const orderStampSource = company.stamp_url || STATIC_CACHET_PATH;
  const orderSigSource = company.signature_url || STATIC_SIGNATURE_PATH;
  if (orderStampSource || orderSigSource) {
    try {
      const stampBoxW = 65;
      const stampBoxH = 32;
      const stampX = margin;
      const stampY = currentY;

      const [pStamp, pSig] = await Promise.all([
        orderStampSource ? loadAndPrepareImage(orderStampSource) : Promise.resolve(null),
        orderSigSource ? loadAndPrepareImage(orderSigSource) : Promise.resolve(null),
      ]);

      if (pStamp || pSig) {
        doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
        doc.roundedRect(stampX, stampY, stampBoxW, stampBoxH, 2, 2, 'S');

        if (pStamp && pSig) {
          // Stamp on left
          let sW = 18;
          let sH = 18 * (pStamp.height / pStamp.width);
          if (sH > 18) { sH = 18; sW = 18 * (pStamp.width / pStamp.height); }
          doc.addImage(pStamp.dataUrl, pStamp.format, stampX + 4, stampY + 3, sW, sH);

          // Signature on right
          let sigW = 34;
          let sigH = 34 * (pSig.height / pSig.width);
          if (sigH > 18) { sigH = 18; sigW = 18 * (pSig.width / pSig.height); }
          doc.addImage(pSig.dataUrl, pSig.format, stampX + stampBoxW - sigW - 4, stampY + 3, sigW, sigH);
        } else if (pStamp) {
          let sW = 28;
          let sH = 28 * (pStamp.height / pStamp.width);
          if (sH > 22) { sH = 22; sW = 22 * (pStamp.width / pStamp.height); }
          doc.addImage(pStamp.dataUrl, pStamp.format, stampX + (stampBoxW - sW) / 2, stampY + 2.5, sW, sH);
        } else if (pSig) {
          let sigW = 42;
          let sigH = 42 * (pSig.height / pSig.width);
          if (sigH > 20) { sigH = 20; sigW = 20 * (pSig.width / pSig.height); }
          doc.addImage(pSig.dataUrl, pSig.format, stampX + (stampBoxW - sigW) / 2, stampY + 2.5, sigW, sigH);
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
        doc.text("Atelier ROMÉO MEUBLE", stampX + stampBoxW / 2, stampY + stampBoxH - 2, { align: 'center' });
      }
    } catch {
      // Ignored
    }
  }

  return doc;
}

/**
 * Trigger browser file download for a generated PDF
 */
export function downloadPDF(doc: jsPDF, filename: string): void {
  const sanitized = filename.replace(/[^a-zA-Z0-9\-_.]/g, '_');
  doc.save(sanitized.endsWith('.pdf') ? sanitized : `${sanitized}.pdf`);
}
