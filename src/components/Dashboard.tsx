import React from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Banknote, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Plus, 
  MessageCircle, 
  Eye, 
  Download, 
  ArrowRight,
  PhoneCall,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { CompanySettings, Quote, Client, Order } from '../types';
import { formatFCFA, formatDate, buildWhatsAppUrl, QUOTE_STATUS_LABELS } from '../lib/formatters';

interface DashboardProps {
  company: CompanySettings;
  quotes: Quote[];
  clients: Client[];
  orders: Order[];
  onNewQuote: () => void;
  onNewClient: () => void;
  onViewQuote: (quote: Quote) => void;
  onDownloadQuotePDF: (quote: Quote) => void;
  onGoToQuotes: () => void;
  onGoToClients: () => void;
  onGoToOrders: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  company,
  quotes,
  clients,
  orders,
  onNewQuote,
  onNewClient,
  onViewQuote,
  onDownloadQuotePDF,
  onGoToQuotes,
  onGoToClients,
  onGoToOrders,
}) => {
  // Financial computations
  const totalQuotesCount = quotes.length;
  const pendingQuotesCount = quotes.filter(q => q.status === 'en_attente' || q.status === 'envoye').length;
  const acceptedQuotesCount = quotes.filter(q => q.status === 'accepte').length;
  const rejectedQuotesCount = quotes.filter(q => q.status === 'refuse').length;

  const totalQuotesAmount = quotes.reduce((sum, q) => sum + (q.total_amount || 0), 0);
  const acceptedQuotesAmount = quotes
    .filter(q => q.status === 'accepte')
    .reduce((sum, q) => sum + (q.total_amount || 0), 0);

  // Active orders in workshop
  const activeOrders = orders.filter(o => o.status !== 'terminee');
  const totalRemainingToCollect = quotes
    .filter(q => q.status === 'accepte')
    .reduce((sum, q) => sum + (q.balance_due || 0), 0);

  const recentQuotes = [...quotes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
  const recentClients = [...clients].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* 1. Hero Workshop Presentation Banner */}
      <div className="bg-gradient-to-br from-amber-950 via-slate-900 to-amber-950 text-white rounded-2xl p-5 sm:p-7 shadow-lg border border-amber-900/30 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs sm:text-sm font-semibold tracking-wider uppercase mb-1">
              <span>Atelier de Menuiserie & Tapisserie</span>
              <span>·</span>
              <span>Yaoundé, Cameroun</span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              {company.name}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-1.5 max-w-2xl">
              Responsable : <span className="text-white font-medium">{company.manager_name}</span> · Maître Artisan Menuisier & Tapissier.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-amber-200/90 mt-2">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                {company.address}
              </span>
              <span className="hidden sm:inline">|</span>
              <span className="flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                {company.phone_primary} / {company.phone_secondary}
              </span>
            </div>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onNewQuote}
              className="w-full sm:w-auto px-5 py-3.5 text-sm sm:text-base font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>+ NOUVEAU DEVIS</span>
            </button>
            <button
              onClick={onNewClient}
              className="w-full sm:w-auto px-4 py-3.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>+ Nouveau Client</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Devis */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs sm:text-sm font-medium">Total devis</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono-num">
              {totalQuotesCount}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Montant cumulé : <span className="font-semibold text-slate-700 font-mono-num">{formatFCFA(totalQuotesAmount)}</span>
            </div>
          </div>
        </div>

        {/* Devis En Attente */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs sm:text-sm font-medium">En attente / Envoyés</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-800 font-mono-num">
              {pendingQuotesCount}
            </div>
            <div className="text-xs text-amber-700/80 mt-1">
              Prospects à relancer
            </div>
          </div>
        </div>

        {/* Devis Acceptés / CA */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs sm:text-sm font-medium">Devis acceptés</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-800 font-mono-num">
              {acceptedQuotesCount}
            </div>
            <div className="text-xs text-emerald-700 mt-1 font-mono-num">
              CA validé : <span className="font-semibold">{formatFCFA(acceptedQuotesAmount)}</span>
            </div>
          </div>
        </div>

        {/* Montant Restant à Encaisser */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs sm:text-sm font-medium">Reste à encaisser</span>
            <Banknote className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-rose-800 font-mono-num truncate">
              {formatFCFA(totalRemainingToCollect)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Sur les devis & commandes
            </div>
          </div>
        </div>
      </div>

      {/* 3. Operational Highlights: Active Orders & Fast Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Derniers Devis */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-base sm:text-lg text-slate-900">
                Derniers devis récents
              </h2>
              <p className="text-xs text-slate-500">Créés pour les clients de Yaoundé</p>
            </div>
            <button
              onClick={onGoToQuotes}
              className="text-xs sm:text-sm font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 transition-colors"
            >
              <span>Voir tous</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentQuotes.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Aucun devis créé pour l'instant. Cliquez sur "+ NOUVEAU DEVIS".
              </div>
            ) : (
              recentQuotes.map((quote) => {
                const statusMeta = QUOTE_STATUS_LABELS[quote.status];
                return (
                  <div
                    key={quote.id}
                    className="p-3.5 sm:p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs sm:text-sm text-slate-900">
                          {quote.quote_number}
                        </span>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${statusMeta.bgClass} ${statusMeta.textClass}`}>
                          {statusMeta.label}
                        </span>
                        <span className="text-xs text-slate-400 hidden sm:inline">· {formatDate(quote.date)}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 mt-0.5 truncate">
                        {quote.client_name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {quote.items.length} prestation{quote.items.length > 1 ? 's' : ''} : {quote.items[0]?.designation}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm sm:text-base font-bold text-slate-900 font-mono-num">
                        {formatFCFA(quote.total_amount)}
                      </div>
                      {quote.balance_due > 0 && (
                        <div className="text-[11px] text-rose-600 font-mono-num">
                          Reste: {formatFCFA(quote.balance_due)}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onViewQuote(quote)}
                        title="Aperçu & Détails"
                        className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDownloadQuotePDF(quote)}
                        title="Télécharger PDF A4"
                        className="p-2 text-slate-500 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <a
                        href={buildWhatsAppUrl(
                          quote.client_whatsapp || quote.client_phone,
                          `Bonjour ${quote.client_name},\nVotre devis ROMÉO MEUBLE N° ${quote.quote_number} de ${formatFCFA(quote.total_amount)} est disponible. Merci de votre confiance.`
                        )}
                        target="_blank"
                        rel="noreferrer"
                        title="Contacter sur WhatsApp"
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Clients récents & Commandes actives */}
        <div className="space-y-5">
          {/* Active Orders Widget */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-700" />
                <h3 className="font-display font-bold text-sm sm:text-base text-slate-900">
                  Commandes en atelier
                </h3>
              </div>
              <button
                onClick={onGoToOrders}
                className="text-xs font-semibold text-amber-800 hover:underline"
              >
                Gérer ({activeOrders.length})
              </button>
            </div>

            {activeOrders.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                Aucune commande en cours. Convertissez un devis accepté pour lancer la fabrication.
              </p>
            ) : (
              <div className="space-y-2.5">
                {activeOrders.slice(0, 3).map((order) => (
                  <div
                    key={order.id}
                    onClick={onGoToOrders}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{order.order_number}</span>
                      <span className="font-mono-num">{formatFCFA(order.total_amount)}</span>
                    </div>
                    <div className="text-slate-600 truncate mt-0.5">{order.client_name}</div>
                    <div className="text-[10px] text-amber-700 mt-1 flex items-center justify-between">
                      <span className="capitalize">{order.status.replace('_', ' ')}</span>
                      <span>Livraison: {formatDate(order.estimated_delivery_date) || 'À convenir'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Clients Widget */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-700" />
                <h3 className="font-display font-bold text-sm sm:text-base text-slate-900">
                  Derniers clients
                </h3>
              </div>
              <button
                onClick={onGoToClients}
                className="text-xs font-semibold text-amber-800 hover:underline"
              >
                Tous ({clients.length})
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentClients.map((client) => (
                <div key={client.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{client.name}</p>
                    <p className="text-slate-500 truncate">{client.address}</p>
                  </div>
                  <a
                    href={buildWhatsAppUrl(client.whatsapp || client.phone, `Bonjour ${client.name}, ici l'atelier ROMÉO MEUBLE.`)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md flex items-center gap-1 shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
