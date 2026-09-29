import React from 'react';
import { 
  X, 
  Download, 
  MessageCircle, 
  Printer, 
  Edit3, 
  CheckCircle,
  FileText,
  MapPin,
  Phone
} from 'lucide-react';
import { Quote, CompanySettings } from '../types';
import { formatFCFA, formatDate, formatDateNumeric, buildWhatsAppUrl, QUOTE_STATUS_LABELS } from '../lib/formatters';
import { generateQuotePDF, downloadPDF } from '../lib/pdfGenerator';
import { useToast } from './Toast';

interface QuotePreviewModalProps {
  quote: Quote | null;
  company: CompanySettings;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (quote: Quote) => void;
  onConvertToOrder?: (quoteId: string) => void;
}

export const QuotePreviewModal: React.FC<QuotePreviewModalProps> = ({
  quote,
  company,
  isOpen,
  onClose,
  onEdit,
  onConvertToOrder,
}) => {
  const { showToast } = useToast();

  if (!isOpen || !quote) return null;

  const handleDownload = async () => {
    try {
      const doc = await generateQuotePDF(quote, company);
      const filename = `Devis-${quote.quote_number}-${quote.client_name.replace(/\s+/g, '_')}.pdf`;
      downloadPDF(doc, filename);
      showToast('success', 'PDF généré avec succès !', `Fichier téléchargé : ${filename}`);
    } catch (err) {
      console.error(err);
      showToast('error', 'Erreur PDF', 'Impossible de générer le PDF. Réessayez.');
    }
  };

  const handleShareWhatsApp = () => {
    const defaultMsg = company.default_whatsapp_message
      .replace('{client_name}', quote.client_name)
      .replace('{quote_number}', quote.quote_number)
      .replace('{total_amount}', formatFCFA(quote.total_amount).replace(' FCFA', ''))
      .replace('{deposit_amount}', formatFCFA(quote.deposit_requested).replace(' FCFA', ''));

    const url = buildWhatsAppUrl(quote.client_whatsapp || quote.client_phone, defaultMsg);
    window.open(url, '_blank');
  };

  const statusMeta = QUOTE_STATUS_LABELS[quote.status];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Action Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="truncate">
              <span className="font-bold text-sm sm:text-base">Devis {quote.quote_number}</span>
              <span className="text-xs text-slate-300 ml-2 hidden sm:inline">· {quote.client_name}</span>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${statusMeta.bgClass} ${statusMeta.textClass}`}>
              {statusMeta.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onConvertToOrder && quote.status === 'accepte' && !quote.converted_to_order_id && (
              <button
                onClick={() => onConvertToOrder(quote.id)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Convertir en commande</span>
                <span className="sm:hidden">Commande</span>
              </button>
            )}

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              title="Télécharger le document PDF A4"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Télécharger PDF</span>
              <span className="xs:hidden">PDF</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              title="Ouvrir WhatsApp avec message prérempli"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">WhatsApp</span>
            </button>

            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(quote);
                }}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Modifier ce devis"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable A4 Document Sheet */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/80">
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-10 space-y-6 text-slate-800">
            {/* Top Brand Accent Line */}
            <div className="h-1.5 bg-amber-950 w-full rounded-full" />

            {/* Document Header */}
            <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-slate-200">
              <div>
                <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-amber-950 tracking-tight">
                  {company.name}
                </h1>
                <p className="font-bold text-xs uppercase tracking-wider text-amber-700 mt-0.5">
                  {company.activity}
                </p>
                <p className="text-xs text-slate-500 mt-2 max-w-sm">
                  {company.address}
                </p>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  WhatsApp : {company.phone_primary} / {company.phone_secondary}
                </p>
              </div>

              <div className="sm:text-right">
                <span className="inline-block px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 font-mono font-bold text-lg rounded-lg">
                  DEVIS N° {quote.quote_number}
                </span>
                <div className="mt-3 text-xs space-y-1 text-slate-500">
                  <p>Date : <strong className="text-slate-800">{formatDateNumeric(quote.date)}</strong></p>
                  <p>Validité : <strong className="text-slate-800">{quote.validity_days} jours</strong></p>
                  <p>Devise : <strong className="text-slate-800">FCFA (XAF)</strong></p>
                </div>
              </div>
            </div>

            {/* Two-column Sender / Client cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                <p className="font-bold text-amber-800 uppercase tracking-wider text-[10px]">
                  Émetteur / Atelier
                </p>
                <p className="font-bold text-slate-900 text-sm">{company.manager_name}</p>
                <p className="text-slate-600">Menuisier & Tapissier d'art</p>
                <p className="text-slate-500">Nkoabang, Yaoundé · Cameroun</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                <p className="font-bold text-amber-800 uppercase tracking-wider text-[10px]">
                  Destinataire / Client
                </p>
                <p className="font-bold text-slate-900 text-sm">{quote.client_name}</p>
                <p className="text-slate-600">Tél : {quote.client_phone}</p>
                <p className="text-slate-500">Adresse : {quote.client_address}</p>
                {quote.client_email && <p className="text-slate-500">Email : {quote.client_email}</p>}
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-amber-950 text-white font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">N°</th>
                    <th className="py-2.5 px-3">Désignation & Spécifications</th>
                    <th className="py-2.5 px-3 text-center w-24">Quantité</th>
                    <th className="py-2.5 px-3 text-right w-28">P.U. (FCFA)</th>
                    <th className="py-2.5 px-3 text-right w-32">Total (FCFA)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quote.items.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{item.designation}</div>
                        {item.description && (
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium">
                        {formatFCFA(item.unit_price).replace(' FCFA', '')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatFCFA(item.total_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary & Conditions */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-2">
              {/* Conditions on left */}
              <div className="sm:col-span-7 space-y-3 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-amber-800">
                    Conditions du Devis
                  </h4>
                  <p className="text-slate-500 text-[11px] mt-1 leading-relaxed whitespace-pre-line">
                    {quote.terms_and_conditions || company.default_terms}
                  </p>
                </div>

                {quote.notes && (
                  <div className="p-2.5 bg-amber-50/60 rounded border border-amber-200/80">
                    <span className="font-bold text-amber-900 block text-[11px]">Note au client :</span>
                    <span className="text-slate-700 italic text-[11px]">{quote.notes}</span>
                  </div>
                )}
              </div>

              {/* Totals on right */}
              <div className="sm:col-span-5 bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Sous-total brut :</span>
                  <span className="font-mono font-semibold text-slate-800">{formatFCFA(quote.subtotal)}</span>
                </div>

                {quote.discount_amount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Remise ({quote.discount_type === 'percent' ? `${quote.discount_value}%` : 'Fixe'}) :</span>
                    <span className="font-mono font-bold">- {formatFCFA(quote.discount_amount)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200">
                  <div className="flex justify-between items-center text-sm font-bold text-slate-900">
                    <span>TOTAL NET :</span>
                    <span className="font-mono text-base text-amber-900">{formatFCFA(quote.total_amount)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <div className="flex justify-between text-amber-800 font-semibold">
                    <span>Acompte demandé :</span>
                    <span className="font-mono">{formatFCFA(quote.deposit_requested)}</span>
                  </div>
                  <div className="flex justify-between text-rose-700 font-bold">
                    <span>Reste à payer :</span>
                    <span className="font-mono">{formatFCFA(quote.balance_due)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature & Cachet Area */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200 text-xs">
              <div className="p-3 border border-dashed border-slate-300 rounded-lg min-h-[90px] flex flex-col justify-between">
                <div>
                  <p className="font-bold text-slate-800">Bon pour accord et commande</p>
                  <p className="text-[10px] text-slate-400">Date et signature du client :</p>
                </div>
                <div className="h-6" />
              </div>

              <div className="p-3 border border-dashed border-slate-300 rounded-lg min-h-[90px] flex flex-col justify-between">
                <div>
                  <p className="font-bold text-slate-800">Pour {company.name}</p>
                  <p className="text-[10px] text-slate-500">Le Responsable : {company.manager_name}</p>
                </div>
                <p className="text-[10px] text-right text-slate-400">Cachet & Signature de l'Atelier</p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-4 border-t border-slate-100 text-[11px] text-slate-400">
              Merci pour votre confiance. ROMÉO MEUBLE · Nkoabang, Yaoundé · WhatsApp : {company.phone_primary}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
