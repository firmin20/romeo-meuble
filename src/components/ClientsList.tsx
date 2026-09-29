import React, { useState, useMemo } from 'react';
import { 
  Search, 
  UserPlus, 
  Users, 
  MessageCircle, 
  Plus, 
  Edit3, 
  Trash2, 
  FileText, 
  ShoppingBag, 
  ExternalLink,
  ChevronRight,
  PhoneCall,
  MapPin
} from 'lucide-react';
import { Client, Quote, Order } from '../types';
import { formatFCFA, buildWhatsAppUrl, formatDate } from '../lib/formatters';
import { StorageService } from '../lib/storage';
import { useToast } from './Toast';
import { ClientModal } from './ClientModal';

interface ClientsListProps {
  clients: Client[];
  quotes: Quote[];
  orders: Order[];
  onClientsUpdated: () => void;
  onCreateQuoteForClient: (client: Client) => void;
  onViewQuote: (quote: Quote) => void;
}

export const ClientsList: React.FC<ClientsListProps> = ({
  clients,
  quotes,
  orders,
  onClientsUpdated,
  onCreateQuoteForClient,
  onViewQuote,
}) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClientForDetails, setSelectedClientForDetails] = useState<Client | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredClients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      (c.notes && c.notes.toLowerCase().includes(q))
    );
  }, [clients, searchQuery]);

  const handleDeleteClient = (clientId: string) => {
    StorageService.deleteClient(clientId);
    setDeleteConfirmId(null);
    showToast('info', 'Client supprimé');
    onClientsUpdated();
  };

  // Helper stats per client
  const getClientStats = (clientId: string) => {
    const clientQuotes = quotes.filter(q => q.client_id === clientId);
    const clientOrders = orders.filter(o => o.client_id === clientId);
    const totalInvoiced = clientQuotes
      .filter(q => q.status === 'accepte')
      .reduce((sum, q) => sum + (q.total_amount || 0), 0);
    const remainingToPay = clientQuotes
      .filter(q => q.status === 'accepte')
      .reduce((sum, q) => sum + (q.balance_due || 0), 0);

    return {
      quoteCount: clientQuotes.length,
      orderCount: clientOrders.length,
      totalInvoiced,
      remainingToPay,
      quotes: clientQuotes,
      orders: clientOrders,
    };
  };

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Fichier Clients
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Coordonnées, historique des devis et contact WhatsApp direct
          </p>
        </div>

        <button
          onClick={() => {
            setEditingClient(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 text-sm font-bold text-white bg-amber-800 hover:bg-amber-900 active:scale-[0.98] rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ NOUVEAU CLIENT</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, quartier à Yaoundé, téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-800"
          />
        </div>
      </div>

      {/* Clients Cards Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Aucun client trouvé</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'Aucun résultat ne correspond à votre recherche.'
              : 'Ajoutez votre premier client pour commencer à créer des devis.'}
          </p>
          <button
            onClick={() => {
              setEditingClient(null);
              setIsModalOpen(true);
            }}
            className="mt-4 px-4 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer"
          >
            + Ajouter un client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClients.map((client) => {
            const stats = getClientStats(client.id);

            return (
              <div
                key={client.id}
                className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 leading-tight">
                        {client.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{client.address}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingClient(client);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                        title="Modifier le client"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(client.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Supprimer le client"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Phone & WhatsApp Contact line */}
                  <div className="mt-3 flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="font-mono text-slate-700 font-semibold">{client.phone}</span>
                    <a
                      href={buildWhatsAppUrl(
                        client.whatsapp || client.phone,
                        `Bonjour ${client.name}, l'atelier ROMÉO MEUBLE est à votre disposition.`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>

                  {client.notes && (
                    <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 italic">
                      "{client.notes}"
                    </p>
                  )}
                </div>

                {/* Financial & Activity Summary */}
                <div className="border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-[10px] text-slate-400 block font-medium">Devis</span>
                      <span className="font-bold text-slate-800 font-mono-num">{stats.quoteCount}</span>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-[10px] text-slate-400 block font-medium">Commandes</span>
                      <span className="font-bold text-slate-800 font-mono-num">{stats.orderCount}</span>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-[10px] text-slate-400 block font-medium">Reste dû</span>
                      <span className="font-bold text-rose-600 font-mono-num">
                        {formatFCFA(stats.remainingToPay)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="flex items-center gap-2 mt-3 pt-1">
                    <button
                      onClick={() => onCreateQuoteForClient(client)}
                      className="flex-1 py-2 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Créer un devis</span>
                    </button>

                    <button
                      onClick={() => setSelectedClientForDetails(client)}
                      className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Fiche complète</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Client Edit/Add Modal */}
      {isModalOpen && (
        <ClientModal
          client={editingClient}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingClient(null);
          }}
          onClientSaved={() => {
            onClientsUpdated();
          }}
        />
      )}

      {/* Client Detail Sheet Modal */}
      {selectedClientForDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base sm:text-lg">{selectedClientForDetails.name}</h3>
                <p className="text-xs text-slate-300">Fiche client détaillée</p>
              </div>
              <button
                onClick={() => setSelectedClientForDetails(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Téléphone</span>
                  <span className="font-semibold text-slate-800">{selectedClientForDetails.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">WhatsApp</span>
                  <span className="font-semibold text-emerald-700">{selectedClientForDetails.whatsapp}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[11px]">Adresse</span>
                  <span className="font-semibold text-slate-800">{selectedClientForDetails.address}</span>
                </div>
                {selectedClientForDetails.notes && (
                  <div className="col-span-2 border-t border-slate-200 pt-2 mt-1">
                    <span className="text-slate-400 block text-[11px]">Notes d'atelier</span>
                    <span className="text-slate-700 italic">{selectedClientForDetails.notes}</span>
                  </div>
                )}
              </div>

              {/* Historic quotes for this client */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">Historique des devis</h4>
                <div className="space-y-1.5">
                  {quotes
                    .filter(q => q.client_id === selectedClientForDetails.id)
                    .map(q => (
                      <div
                        key={q.id}
                        className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-2"
                      >
                        <div>
                          <span className="font-mono font-bold text-slate-900">{q.quote_number}</span>
                          <span className="text-slate-400 text-xs ml-2">· {formatDate(q.date)}</span>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {q.items.map(i => i.designation).join(', ')}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold font-mono-num text-slate-900 block">
                            {formatFCFA(q.total_amount)}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedClientForDetails(null);
                              onViewQuote(q);
                            }}
                            className="text-xs font-semibold text-amber-800 hover:underline cursor-pointer"
                          >
                            Voir devis
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-900 text-base">Supprimer ce client ?</h3>
            <p className="text-xs text-slate-600">
              Le client sera retiré de votre liste de contacts. Ses devis déjà existants resteront archivés.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteClient(deleteConfirmId)}
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
