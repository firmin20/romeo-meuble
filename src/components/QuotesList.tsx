import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit3, 
  Copy, 
  Download, 
  MessageCircle, 
  Trash2, 
  CheckCircle,
  Clock,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { Quote, CompanySettings, QuoteStatus } from '../types';
import { formatFCFA, formatDate, buildWhatsAppUrl, buildQuoteWhatsAppMessage, QUOTE_STATUS_LABELS } from '../lib/formatters';
import { StorageService } from '../lib/storage';
import { useToast } from './Toast';

interface QuotesListProps {
  quotes: Quote[];
  company: CompanySettings;
  onNewQuote: () => void;
  onEditQuote: (quote: Quote) => void;
  onViewQuote: (quote: Quote) => void;
  onDownloadPDF: (quote: Quote) => void;
  onQuotesUpdated: () => void;
  onConvertToOrder: (quoteId: string) => void;
}

export const QuotesList: React.FC<QuotesListProps> = ({
  quotes,
  company,
  onNewQuote,
  onEditQuote,
  onViewQuote,
  onDownloadPDF,
  onQuotesUpdated,
  onConvertToOrder,
}) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | QuoteStatus>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filtered and searched quotes
  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        quote.quote_number.toLowerCase().includes(query) ||
        quote.client_name.toLowerCase().includes(query) ||
        quote.client_phone.toLowerCase().includes(query) ||
        quote.client_address.toLowerCase().includes(query) ||
        (quote.project_object && quote.project_object.toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [quotes, statusFilter, searchQuery]);

  const handleDuplicate = (quote: Quote) => {
    const duplicated = StorageService.duplicateQuote(quote.id);
    if (duplicated) {
      showToast('success', 'Devis dupliqué !', `Nouveau devis créé : ${duplicated.quote_number}`);
      onQuotesUpdated();
    } else {
      showToast('error', 'Erreur', 'Impossible de dupliquer ce devis.');
    }
  };

  const handleDelete = (quoteId: string) => {
    StorageService.deleteQuote(quoteId);
    setDeleteConfirmId(null);
    showToast('info', 'Devis supprimé', 'Le devis a été retiré de votre historique.');
    onQuotesUpdated();
  };

  const handleStatusChange = (quoteId: string, newStatus: QuoteStatus) => {
    StorageService.updateQuoteStatus(quoteId, newStatus);
    showToast('success', 'Statut mis à jour', `Nouveau statut : ${QUOTE_STATUS_LABELS[newStatus].label}`);
    onQuotesUpdated();
  };

  const filterTabs: Array<{ id: 'all' | QuoteStatus; label: string; count: number }> = [
    { id: 'all', label: 'Tous', count: quotes.length },
    { id: 'brouillon', label: 'Brouillons', count: quotes.filter(q => q.status === 'brouillon').length },
    { id: 'envoye', label: 'Envoyés', count: quotes.filter(q => q.status === 'envoye').length },
    { id: 'en_attente', label: 'En attente', count: quotes.filter(q => q.status === 'en_attente').length },
    { id: 'accepte', label: 'Acceptés', count: quotes.filter(q => q.status === 'accepte').length },
    { id: 'refuse', label: 'Refusés', count: quotes.filter(q => q.status === 'refuse').length },
    { id: 'expire', label: 'Expirés', count: quotes.filter(q => q.status === 'expire').length },
  ];

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Page Title & Top CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Gestion des Devis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Établissez, dupliquez et partagez vos devis professionnels en FCFA
          </p>
        </div>

        <button
          onClick={onNewQuote}
          className="px-4 py-2.5 text-sm font-bold text-white bg-amber-800 hover:bg-amber-900 active:scale-[0.98] rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ NOUVEAU DEVIS</span>
        </button>
      </div>

      {/* Search & Segmented Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par N° de devis (ex: RM-2026-0001), nom de client ou téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-800"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {filterTabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quotes Cards / Table */}
      {filteredQuotes.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Aucun devis trouvé</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'Aucun résultat ne correspond à votre recherche.'
              : 'Commencez par créer votre premier devis de menuiserie.'}
          </p>
          <button
            onClick={onNewQuote}
            className="mt-4 px-4 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer"
          >
            + Créer un devis
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuotes.map((quote) => {
            const statusMeta = QUOTE_STATUS_LABELS[quote.status];
            return (
              <div
                key={quote.id}
                className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Identity and Client */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-extrabold text-sm sm:text-base text-slate-900">
                      {quote.quote_number}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${statusMeta.bgClass} ${statusMeta.textClass}`}
                    >
                      {statusMeta.label}
                    </span>
                    <span className="text-xs text-slate-400">· {formatDate(quote.date)}</span>
                    <span className="text-xs text-slate-400">· Valable {quote.validity_days}j</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate">
                      {quote.client_name}
                    </h3>
                    <span className="text-xs text-slate-400">({quote.client_phone})</span>
                  </div>

                  {quote.project_object && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/80 text-xs font-semibold">
                      <span>Objet :</span>
                      <span>{quote.project_object}</span>
                    </div>
                  )}

                  {quote.items.some(i => i.item_type === 'main_d_oeuvre') && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-900 border border-indigo-200">
                      🛠️ Fournitures & Main d'œuvre
                    </span>
                  )}

                  <p className="text-xs text-slate-500 truncate max-w-2xl">
                    {quote.items.map(it => `${it.quantity}x ${it.designation}`).join(', ')}
                  </p>
                </div>

                {/* Center: Financials */}
                <div className="flex items-center gap-4 sm:gap-6 border-y md:border-y-0 md:border-l md:border-r border-slate-100 py-2 md:py-0 md:px-6 shrink-0">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
                    <span className="text-base sm:text-lg font-extrabold text-slate-900 font-mono-num">
                      {formatFCFA(quote.total_amount)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-700 block">Acompte</span>
                    <span className="text-xs sm:text-sm font-bold text-amber-800 font-mono-num">
                      {formatFCFA(quote.deposit_requested)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-rose-600 block">Reste</span>
                    <span className="text-xs sm:text-sm font-bold text-rose-700 font-mono-num">
                      {formatFCFA(quote.balance_due)}
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0 justify-end">
                  {/* Status Dropdown */}
                  <select
                    value={quote.status}
                    onChange={(e) => handleStatusChange(quote.id, e.target.value as QuoteStatus)}
                    className="text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-800"
                    title="Changer le statut"
                  >
                    <option value="brouillon">Brouillon</option>
                    <option value="envoye">Envoyé</option>
                    <option value="en_attente">En attente</option>
                    <option value="accepte">Accepté</option>
                    <option value="refuse">Refusé</option>
                    <option value="expire">Expiré</option>
                  </select>

                  {/* Convert to order button if accepted */}
                  {quote.status === 'accepte' && !quote.converted_to_order_id && (
                    <button
                      onClick={() => onConvertToOrder(quote.id)}
                      className="px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      title="Créer la commande en atelier"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span className="hidden xl:inline">Commande</span>
                    </button>
                  )}

                  <button
                    onClick={() => onViewQuote(quote)}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Aperçu du devis"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDownloadPDF(quote)}
                    className="p-2 text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                    title="Télécharger PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <a
                    href={buildWhatsAppUrl(
                      quote.client_whatsapp || quote.client_phone,
                      buildQuoteWhatsAppMessage(quote, company)
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Partager sur WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => onEditQuote(quote)}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Modifier"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDuplicate(quote)}
                    className="p-2 text-slate-500 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                    title="Dupliquer ce devis"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeleteConfirmId(quote.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-900 text-base">Supprimer ce devis ?</h3>
            <p className="text-xs text-slate-600">
              Cette action est irréversible. Le devis sera définitivement supprimé de votre base.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
