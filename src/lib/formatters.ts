import { QuoteStatus, OrderStatus, PaymentMethod } from '../types';

/**
 * Format a number as FCFA / XAF currency without useless decimals
 * Example: 450000 -> "450 000 FCFA"
 */
export function formatFCFA(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0 FCFA';
  }
  const rounded = Math.round(amount);
  // Group thousands with spaces
  const parts = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${parts} FCFA`;
}

/**
 * Format date string into French readable format
 * e.g., "2026-09-29" -> "29 sept. 2026"
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Format date into DD/MM/YYYY
 */
export function formatDateNumeric(dateString: string | undefined): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  } catch {
    return dateString;
  }
}

/**
 * Sanitize Cameroon phone numbers to digits for WhatsApp (wa.me)
 * Cameroon phones start with +237 or 6XX XX XX XX / 2XX XX XX XX
 */
export function getWhatsAppDigits(phone: string): string {
  if (!phone) return '';
  // Remove all non-digits
  let digits = phone.replace(/\D/g, '');
  
  // If starts with 00237, strip 00
  if (digits.startsWith('00237')) {
    digits = digits.slice(2);
  }
  
  // If it's 9 digits starting with 6 (e.g., 688757194), prepend 237
  if (digits.length === 9 && (digits.startsWith('6') || digits.startsWith('2'))) {
    digits = '237' + digits;
  }
  
  // Default to 237 prefix if not already present
  if (!digits.startsWith('237') && digits.length > 6) {
    digits = '237' + digits;
  }
  
  return digits;
}

/**
 * Generate a direct WhatsApp click-to-chat URL
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = getWhatsAppDigits(phone);
  const encodedText = encodeURIComponent(message);
  if (!digits) {
    return `https://wa.me/?text=${encodedText}`;
  }
  return `https://wa.me/${digits}?text=${encodedText}`;
}

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, { label: string; textClass: string; bgClass: string }> = {
  brouillon: { label: 'Brouillon', textClass: 'text-slate-600', bgClass: 'bg-slate-100' },
  envoye: { label: 'Envoyé', textClass: 'text-blue-700', bgClass: 'bg-blue-50' },
  en_attente: { label: 'En attente', textClass: 'text-amber-700', bgClass: 'bg-amber-50' },
  accepte: { label: 'Accepté', textClass: 'text-emerald-700', bgClass: 'bg-emerald-50' },
  refuse: { label: 'Refusé', textClass: 'text-rose-700', bgClass: 'bg-rose-50' },
  expire: { label: 'Expiré', textClass: 'text-zinc-600', bgClass: 'bg-zinc-100' },
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, { label: string; textClass: string; bgClass: string }> = {
  a_realiser: { label: 'À réaliser', textClass: 'text-slate-700', bgClass: 'bg-slate-100' },
  en_fabrication: { label: 'En fabrication', textClass: 'text-amber-700', bgClass: 'bg-amber-50' },
  en_finition: { label: 'En finition', textClass: 'text-indigo-700', bgClass: 'bg-indigo-50' },
  prete: { label: 'Prête en atelier', textClass: 'text-cyan-700', bgClass: 'bg-cyan-50' },
  livree: { label: 'Livrée au client', textClass: 'text-teal-700', bgClass: 'bg-teal-50' },
  terminee: { label: 'Terminée & Réglée', textClass: 'text-emerald-700', bgClass: 'bg-emerald-50' },
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  especes: 'Espèces',
  mobile_money_mtn: 'MTN Mobile Money',
  mobile_money_orange: 'Orange Money',
  virement: 'Virement bancaire',
  autre: 'Autre mode',
};
