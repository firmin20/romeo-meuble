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
  Phone,
  Stamp,
  ShieldCheck
} from 'lucide-react';
import { Quote, CompanySettings } from '../types';
import { formatFCFA, formatDate, formatDateNumeric, buildWhatsAppUrl, QUOTE_STATUS_LABELS } from '../lib/formatters';
import { generateQuotePDF, downloadPDF } from '../lib/pdfGenerator';
import { BRAND_LOGO_SRC, BRAND_STAMP_SRC, BRAND_SIGNATURE_SRC } from '../lib/brand';
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
  const stampAvailable = !!(company.stamp_url || BRAND_STAMP_SRC);
  const [includeStamp, setIncludeStamp] = React.useState<boolean>(
    quote?.include_stamp !== false && stampAvailable
  );

  React.useEffect(() => {
    if (quote) {
      setIncludeStamp(quote.include_stamp !== false && stampAvailable);
    }
  }, [quote, company.stamp_url, stampAvailable]);

  if (!isOpen || !quote) return null;

  const handleDownload = async () => {
    try {
      const activeQuote: Quote = {
        ...quote,
        include_stamp: includeStamp,
      };
      const doc = await generateQuotePDF(activeQuote, company);
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

            {stampAvailable && (
              <button
                type="button"
                onClick={() => setIncludeStamp(prev => !prev)}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  includeStamp 
                    ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700' 
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title="Activer ou désactiver l'apposition du cachet officiel sur le devis"
              >
                <Stamp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{includeStamp ? 'Cachet officiel actif' : 'Sans cachet'}</span>
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
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-slate-200">
              <div className="flex items-start gap-4">
                {(company.logo_url || BRAND_LOGO_SRC) && (
                  <img
                    src={company.logo_url || BRAND_LOGO_SRC}
                    alt={company.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-xl border border-amber-900/10 p-1.5 bg-white shadow-xs shrink-0"
                    referrerPolicy="no-referrer"
                  />
                )}
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
              </div>

              <div className="sm:text-right shrink-0">
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
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <p className="font-bold text-amber-800 uppercase tracking-wider text-xs">
                  Émetteur / Atelier
                </p>
                <p className="font-bold text-slate-900 text-base">{company.manager_name}</p>
                <p className="text-slate-700 text-xs sm:text-sm font-medium">Menuisier & Tapissier d'art</p>
                <p className="text-slate-500 text-xs">{company.city} — {company.country}</p>
                <p className="text-[11px] text-slate-400">Repère : 100m av. station Blessing, à côté Sorepco</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <p className="font-bold text-amber-800 uppercase tracking-wider text-xs">
                  Destinataire / Client
                </p>
                <p className="font-bold text-slate-900 text-base">{quote.client_name}</p>
                <p className="text-slate-800 text-xs sm:text-sm font-semibold">Tél : {quote.client_phone}</p>
                <p className="text-slate-600 text-xs sm:text-sm">Adresse : {quote.client_address}</p>
                {quote.client_email && <p className="text-slate-500 text-xs">Email : {quote.client_email}</p>}
              </div>
            </div>

            {/* Project / Object Details Card */}
            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-1.5">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-bold text-amber-900 uppercase tracking-wider text-xs">
                  Objet du devis :
                </span>
                <span className="font-extrabold text-slate-900 text-base">
                  {quote.project_object || 'Travaux de menuiserie et tapisserie'}
                </span>
              </div>
              {quote.project_description && (
                <p className="text-slate-700 text-xs sm:text-sm mt-1 leading-relaxed">
                  {quote.project_description}
                </p>
              )}
              {(quote.execution_location || quote.estimated_duration) && (
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pt-1 text-xs text-slate-600">
                  {quote.execution_location && (
                    <span>Lieu d'exécution : <strong className="text-slate-800 font-bold">{quote.execution_location}</strong></span>
                  )}
                  {quote.estimated_duration && (
                    <span>Durée estimée : <strong className="text-slate-800 font-bold">{quote.estimated_duration}</strong></span>
                  )}
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
              <table className="w-full text-left text-sm">
                <thead className="bg-amber-950 text-white font-bold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5 w-12 text-center">N°</th>
                    <th className="py-3 px-3.5">Désignation & Prestations</th>
                    <th className="py-3 px-3.5 text-center w-20">Quantité</th>
                    <th className="py-3 px-3.5 text-center w-24">Unité</th>
                    <th className="py-3 px-3.5 text-right w-32">P.U. (FCFA)</th>
                    <th className="py-3 px-3.5 text-right w-36">Total (FCFA)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quote.items.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                      <td className="py-3 px-3.5 text-center text-slate-500 font-mono font-bold">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 text-sm">{item.designation}</div>
                        {item.description && (
                          <div className="text-xs text-slate-500 mt-0.5 leading-snug">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono font-semibold text-slate-800">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-3.5 text-center text-slate-700">
                        {item.unit || 'pièce'}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-medium text-slate-800">
                        {formatFCFA(item.unit_price).replace(' FCFA', '')}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-extrabold text-slate-950 text-sm">
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
              <div className="sm:col-span-7 space-y-3">
                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs text-amber-800">
                    Conditions du Devis
                  </h4>
                  <p className="text-slate-600 text-xs sm:text-sm mt-1.5 leading-relaxed whitespace-pre-line">
                    {quote.terms_and_conditions || company.default_terms}
                  </p>
                </div>

                {quote.notes && (
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80">
                    <span className="font-bold text-amber-900 block text-xs">Note au client :</span>
                    <span className="text-slate-800 italic text-xs sm:text-sm">{quote.notes}</span>
                  </div>
                )}
              </div>

              {/* Totals on right */}
              <div className="sm:col-span-5 bg-slate-50 rounded-xl p-5 border border-slate-200 text-sm space-y-2.5">
                <div className="flex justify-between text-slate-700">
                  <span>Sous-total brut :</span>
                  <span className="font-mono font-semibold text-slate-900">{formatFCFA(quote.subtotal)}</span>
                </div>

                {quote.discount_amount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Remise ({quote.discount_type === 'percent' ? `${quote.discount_value}%` : 'Fixe'}) :</span>
                    <span className="font-mono font-bold">- {formatFCFA(quote.discount_amount)}</span>
                  </div>
                )}

                <div className="py-2.5 px-3 bg-amber-950 text-white rounded-lg -mx-1">
                  <div className="flex justify-between items-center text-sm sm:text-base font-extrabold">
                    <span>TOTAL NET :</span>
                    <span className="font-mono text-base sm:text-lg text-amber-300">{formatFCFA(quote.total_amount)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <div className="flex justify-between text-amber-900 font-bold">
                    <span>Acompte demandé :</span>
                    <span className="font-mono">{formatFCFA(quote.deposit_requested)}</span>
                  </div>
                  <div className="flex justify-between text-rose-700 font-extrabold text-sm sm:text-base">
                    <span>Reste à payer :</span>
                    <span className="font-mono">{formatFCFA(quote.balance_due)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature & Cachet Area */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200 text-xs">
              <div className="p-3.5 border border-dashed border-slate-300 rounded-xl min-h-[110px] flex flex-col justify-between">
                <div>
                  <p className="font-bold text-slate-800">Bon pour accord et commande</p>
                  <p className="text-[10px] text-slate-400">Date et signature du client précédées de 'Lu et approuvé' :</p>
                </div>
                <div className="h-8" />
              </div>

              <div className="p-3.5 border border-dashed border-slate-300 rounded-xl min-h-[125px] flex flex-col justify-between relative bg-slate-50/50">
                {((includeStamp && (company.stamp_url || BRAND_STAMP_SRC)) || company.signature_url || BRAND_SIGNATURE_SRC) ? (
                  <div className="flex flex-col items-center justify-between h-full py-0.5 text-center">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                      Cachet &amp; Signature
                    </span>

                    <div className="my-1.5 flex items-center justify-center gap-3">
                      {includeStamp && (company.stamp_url || BRAND_STAMP_SRC) && (
                        <img
                          src={company.stamp_url || BRAND_STAMP_SRC}
                          alt="Cachet Officiel ROMÉO MEUBLE"
                          className="max-h-[68px] max-w-[95px] object-contain drop-shadow-xs"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      {(company.signature_url || BRAND_SIGNATURE_SRC) && (
                        <img
                          src={company.signature_url || BRAND_SIGNATURE_SRC}
                          alt="Signature Officielle Mouaffo Roméo"
                          className="max-h-[50px] max-w-[125px] object-contain"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-[11px] font-bold text-slate-900">{company.manager_name}</p>
                      <p className="text-[9px] font-semibold text-amber-900 uppercase tracking-wider">{company.name}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <p className="font-bold text-slate-800">Pour {company.name}</p>
                      <p className="text-[10px] text-slate-500">Le Responsable : {company.manager_name}</p>
                    </div>
                    <p className="text-[10px] text-right text-slate-400 font-semibold">Signature / Cachet</p>
                  </div>
                )}
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
