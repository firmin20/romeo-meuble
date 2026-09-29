import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quote, CompanySettings, Order, Payment } from '../types';
import { formatFCFA, formatDateNumeric } from './formatters';

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
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(darkBrown[0], darkBrown[1], darkBrown[2]);
  doc.text(company.name.toUpperCase(), margin, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.text(company.activity.toUpperCase(), margin, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(company.address, margin, currentY);

  currentY += 4;
  doc.text(`Tél / WhatsApp : ${company.phone_primary}  |  ${company.phone_secondary}`, margin, currentY);

  // Right-aligned Document Badge (DEVIS)
  const headerRightX = pageWidth - margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(darkBrown[0], darkBrown[1], darkBrown[2]);
  doc.text('DEVIS', headerRightX, margin + 8, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.text(`N° ${quote.quote_number}`, headerRightX, margin + 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(`Date : ${formatDateNumeric(quote.date)}`, headerRightX, margin + 19, { align: 'right' });
  doc.text(`Validité : ${quote.validity_days} jours`, headerRightX, margin + 23.5, { align: 'right' });

  currentY += 8;
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  // 3. Client & Billing Card (Two-column layout)
  const cardHeight = 28;
  const colWidth = (contentWidth - 6) / 2;

  // Left: Enterprise summary
  doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
  doc.roundedRect(margin, currentY, colWidth, cardHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, currentY, colWidth, cardHeight, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.text("ÉMETTEUR / ATELIER", margin + 4, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(company.manager_name, margin + 4, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(`Responsable Menuisier Tapissier`, margin + 4, currentY + 15.5);
  doc.text(`${company.city} — ${company.country}`, margin + 4, currentY + 20);
  doc.text(`Repère : Station Blessing / Sorepco`, margin + 4, currentY + 24.5);

  // Right: Client Info
  const clientCardX = margin + colWidth + 6;
  doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
  doc.roundedRect(clientCardX, currentY, colWidth, cardHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(clientCardX, currentY, colWidth, cardHeight, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.text("DESTINATAIRE / CLIENT", clientCardX + 4, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(quote.client_name || 'Client', clientCardX + 4, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(`Tél / WhatsApp : ${quote.client_phone || '—'}`, clientCardX + 4, currentY + 15.5);
  doc.text(`Adresse : ${quote.client_address || 'Yaoundé'}`, clientCardX + 4, currentY + 20);
  if (quote.client_email) {
    doc.text(`Email : ${quote.client_email}`, clientCardX + 4, currentY + 24.5);
  } else {
    doc.text(`Devise : ${company.currency}`, clientCardX + 4, currentY + 24.5);
  }

  currentY += cardHeight + 8;

  // 4. Line Items Table
  const tableRows = quote.items.map((item, index) => {
    const descriptionText = item.description ? `\n${item.description}` : '';
    return [
      String(index + 1).padStart(2, '0'),
      `${item.designation}${descriptionText}`,
      `${item.quantity} ${item.unit || 'U'}`,
      formatFCFA(item.unit_price).replace(' FCFA', ''),
      formatFCFA(item.total_price),
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['N°', 'DÉSIGNATION & SPÉCIFICATIONS', 'QTÉ', 'P.U. (FCFA)', 'TOTAL (FCFA)']],
    body: tableRows,
    theme: 'plain',
    margin: { left: margin, right: margin },
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      textColor: [30, 41, 59],
      cellPadding: 3,
      lineColor: borderGray as [number, number, number],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: darkBrown as [number, number, number],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto', fontStyle: 'normal' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
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

  // Check if we need space for totals and signatures
  if (currentY > pageHeight - 75) {
    doc.addPage();
    currentY = margin + 10;
  }

  // 5. Totals & Financial Breakdown (Right-aligned card)
  const totalsWidth = 80;
  const totalsX = pageWidth - margin - totalsWidth;
  const totalsY = currentY;

  // Background for financial summary
  doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
  doc.roundedRect(totalsX, totalsY, totalsWidth, 42, 2, 2, 'F');
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(totalsX, totalsY, totalsWidth, 42, 2, 2, 'S');

  let finY = totalsY + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text("Sous-total brut :", totalsX + 4, finY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(formatFCFA(quote.subtotal), totalsX + totalsWidth - 4, finY, { align: 'right' });

  if (quote.discount_amount > 0) {
    finY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    const discountLabel = quote.discount_type === 'percent' ? `Remise (${quote.discount_value}%) :` : 'Remise commerciale :';
    doc.text(discountLabel, totalsX + 4, finY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(190, 18, 60); // Red/rose for discount
    doc.text(`- ${formatFCFA(quote.discount_amount)}`, totalsX + totalsWidth - 4, finY, { align: 'right' });
  }

  finY += 7;
  // Total Banner inside the box
  doc.setFillColor(darkBrown[0], darkBrown[1], darkBrown[2]);
  doc.rect(totalsX, finY - 4.5, totalsWidth, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL NET À PAYER :", totalsX + 4, finY + 1);
  doc.text(formatFCFA(quote.total_amount), totalsX + totalsWidth - 4, finY + 1, { align: 'right' });

  finY += 9;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text("Acompte demandé :", totalsX + 4, finY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.text(formatFCFA(quote.deposit_requested), totalsX + totalsWidth - 4, finY, { align: 'right' });

  finY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text("Reste à solder :", totalsX + 4, finY);
  doc.text(formatFCFA(quote.balance_due), totalsX + totalsWidth - 4, finY, { align: 'right' });

  // Left: Conditions and notes
  const notesWidth = contentWidth - totalsWidth - 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.text("CONDITIONS & MODALITÉS", margin, totalsY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  const splitTerms = doc.splitTextToSize(quote.terms_and_conditions || company.default_terms, notesWidth);
  doc.text(splitTerms, margin, totalsY + 8.5);

  if (quote.notes) {
    const notesOffset = totalsY + 8.5 + (splitTerms.length * 3.5) + 3;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text("Note au client :", margin, notesOffset);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    const splitNotes = doc.splitTextToSize(quote.notes, notesWidth);
    doc.text(splitNotes, margin, notesOffset + 4);
  }

  currentY = totalsY + 48;

  // 6. Signatures and Approval Block
  const sigColWidth = (contentWidth - 10) / 2;
  const sigBoxY = currentY;

  // Client signature box
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, sigBoxY, sigColWidth, 24, 1.5, 1.5, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text("BON POUR ACCORD ET COMMANDE", margin + 4, sigBoxY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text("Date et Signature du Client précédées de 'Lu et approuvé' :", margin + 4, sigBoxY + 9);

  // Workshop signature box
  const sigWorkshopX = margin + sigColWidth + 10;
  doc.roundedRect(sigWorkshopX, sigBoxY, sigColWidth, 24, 1.5, 1.5, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(`POUR ${company.name.toUpperCase()}`, sigWorkshopX + 4, sigBoxY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(`Le Responsable : ${company.manager_name}`, sigWorkshopX + 4, sigBoxY + 9);
  doc.text(`Cachet & Signature de l'Atelier`, sigWorkshopX + 4, sigBoxY + 21);

  // 7. Footer
  const footerY = pageHeight - 8;
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.text("Merci pour votre confiance. — ROMÉO MEUBLE, l'artisanat du bois et du confort sur-mesure.", margin, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(`Page 1 / 1`, pageWidth - margin, footerY, { align: 'right' });

  return doc;
}

/**
 * Generate PDF for Order (Bon de Commande) with payment ledger
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
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(darkBrown[0], darkBrown[1], darkBrown[2]);
  doc.text(company.name.toUpperCase(), margin, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.text(`${company.activity.toUpperCase()} — BON DE COMMANDE`, margin, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(company.address, margin, currentY);

  currentY += 4;
  doc.text(`Tél / WhatsApp : ${company.phone_primary} | ${company.phone_secondary}`, margin, currentY);

  // Right details
  const headerRightX = pageWidth - margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(darkBrown[0], darkBrown[1], darkBrown[2]);
  doc.text('COMMANDE', headerRightX, margin + 8, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.text(`N° ${order.order_number}`, headerRightX, margin + 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(`Date commande : ${formatDateNumeric(order.date)}`, headerRightX, margin + 19, { align: 'right' });
  if (order.quote_number) {
    doc.text(`Réf. Devis : ${order.quote_number}`, headerRightX, margin + 23.5, { align: 'right' });
  }

  currentY += 8;
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  // Client block
  const cardHeight = 22;
  doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
  doc.roundedRect(margin, currentY, contentWidth, cardHeight, 1.5, 1.5, 'F');
  doc.roundedRect(margin, currentY, contentWidth, cardHeight, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.text("CLIENT & LIEU DE LIVRAISON", margin + 4, currentY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(order.client_name, margin + 4, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(`Téléphone : ${order.client_phone || '—'}  |  Adresse : ${order.client_address || 'Yaoundé'}`, margin + 4, currentY + 16.5);

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
      fontSize: 8.5,
      textColor: [30, 41, 59],
      cellPadding: 3,
      lineColor: borderGray as [number, number, number],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: darkBrown as [number, number, number],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
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
  doc.setFontSize(10);
  doc.setTextColor(darkBrown[0], darkBrown[1], darkBrown[2]);
  doc.text("HISTORIQUE DES ENCAISSEMENTS", margin, currentY);
  currentY += 4;

  const paymentRows = payments.map((p, idx) => [
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
      fontSize: 8,
      cellPadding: 2.5,
    },
    headStyles: {
      fillColor: [71, 85, 105],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
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
  const balWidth = 80;
  const balX = pageWidth - margin - balWidth;
  doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
  doc.roundedRect(balX, currentY, balWidth, 26, 1.5, 1.5, 'F');
  doc.roundedRect(balX, currentY, balWidth, 26, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text("Montant total commande :", balX + 4, currentY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(formatFCFA(order.total_amount), balX + balWidth - 4, currentY + 6, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text("Total encaissé :", balX + 4, currentY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text(formatFCFA(paidTotal), balX + balWidth - 4, currentY + 13, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(remaining > 0 ? 190 : 16, remaining > 0 ? 18 : 185, remaining > 0 ? 60 : 129);
  doc.text("Solde restant dû :", balX + 4, currentY + 20);
  doc.text(formatFCFA(remaining), balX + balWidth - 4, currentY + 20, { align: 'right' });

  return doc;
}

/**
 * Trigger browser file download for a generated PDF
 */
export function downloadPDF(doc: jsPDF, filename: string): void {
  // Clean filename for mobile/desktop
  const sanitized = filename.replace(/[^a-zA-Z0-9\-_.]/g, '_');
  doc.save(sanitized.endsWith('.pdf') ? sanitized : `${sanitized}.pdf`);
}
