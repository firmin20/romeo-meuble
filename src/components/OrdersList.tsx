import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ShoppingBag, 
  Clock, 
  Eye, 
  Download, 
  MessageCircle, 
  Trash2, 
  Filter, 
  CheckCircle2,
  Plus
} from 'lucide-react';
import { Order, CompanySettings, OrderStatus, Payment } from '../types';
import { formatFCFA, formatDate, ORDER_STATUS_LABELS, buildWhatsAppUrl } from '../lib/formatters';
import { StorageService } from '../lib/storage';
import { generateOrderPDF, downloadPDF } from '../lib/pdfGenerator';
import { useToast } from './Toast';
import { OrderDetailsModal } from './OrderDetailsModal';

interface OrdersListProps {
  orders: Order[];
  company: CompanySettings;
  onOrdersUpdated: () => void;
  onNewOrderDirect?: () => void;
}

export const OrdersList: React.FC<OrdersListProps> = ({
  orders,
  company,
  onOrdersUpdated,
}) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        order.order_number.toLowerCase().includes(q) ||
        (order.quote_number && order.quote_number.toLowerCase().includes(q)) ||
        order.client_name.toLowerCase().includes(q) ||
        order.client_phone.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchQuery]);

  const handleDelete = (orderId: string) => {
    StorageService.deleteOrder(orderId);
    setDeleteConfirmId(null);
    showToast('info', 'Commande supprimée', 'La commande a été retirée.');
    onOrdersUpdated();
  };

  const handleDownloadPDF = async (order: Order) => {
    try {
      const payments = StorageService.getPayments(order.id);
      const doc = await generateOrderPDF(order, payments, company);
      downloadPDF(doc, `Bon_Commande_${order.order_number}.pdf`);
      showToast('success', 'Bon de commande téléchargé !');
    } catch {
      showToast('error', 'Erreur de génération PDF');
    }
  };

  // Get active payments for selected order
  const selectedOrderPayments = selectedOrder ? StorageService.getPayments(selectedOrder.id) : [];

  const filterTabs: Array<{ id: 'all' | OrderStatus; label: string }> = [
    { id: 'all', label: 'Toutes' },
    { id: 'a_realiser', label: 'À réaliser' },
    { id: 'en_fabrication', label: 'En fabrication' },
    { id: 'en_finition', label: 'En finition' },
    { id: 'prete', label: 'Prête en atelier' },
    { id: 'livree', label: 'Livrée' },
    { id: 'terminee', label: 'Terminée' },
  ];

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Suivi des Commandes en Atelier
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Fabrication, livraisons et historique des encaissements en FCFA
          </p>
        </div>
      </div>

      {/* Search & Status Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par N° commande, devis, nom du client ou téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-800"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {filterTabs.map((tab) => {
            const count = tab.id === 'all' ? orders.length : orders.filter(o => o.status === tab.id).length;
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
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List Cards */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Aucune commande trouvée</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'Aucun résultat ne correspond à votre recherche.'
              : 'Pour créer une commande, validez un devis existant puis cliquez sur "Convertir en commande".'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const statusMeta = ORDER_STATUS_LABELS[order.status];
            const orderPayments = StorageService.getPayments(order.id);
            const totalPaid = orderPayments.reduce((acc, p) => acc + p.amount, 0);
            const remaining = Math.max(0, order.total_amount - totalPaid);

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left info */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-extrabold text-sm sm:text-base text-slate-900">
                      {order.order_number}
                    </span>
                    {order.quote_number && (
                      <span className="text-xs font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Devis {order.quote_number}
                      </span>
                    )}
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${statusMeta.bgClass} ${statusMeta.textClass}`}
                    >
                      {statusMeta.label}
                    </span>
                    <span className="text-xs text-slate-400">· {formatDate(order.date)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate">
                      {order.client_name}
                    </h3>
                    <span className="text-xs text-slate-400">({order.client_phone})</span>
                  </div>

                  <p className="text-xs text-slate-500 truncate max-w-2xl">
                    {order.items.map(it => `${it.quantity}x ${it.designation}`).join(', ')}
                  </p>
                </div>

                {/* Center Financials */}
                <div className="flex items-center gap-4 sm:gap-6 border-y md:border-y-0 md:border-l md:border-r border-slate-100 py-2 md:py-0 md:px-6 shrink-0">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
                    <span className="text-base sm:text-lg font-extrabold text-slate-900 font-mono-num">
                      {formatFCFA(order.total_amount)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">Encaissé</span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-700 font-mono-num">
                      {formatFCFA(totalPaid)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-rose-600 block">Solde dû</span>
                    <span className="text-xs sm:text-sm font-bold text-rose-700 font-mono-num">
                      {formatFCFA(remaining)}
                    </span>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1.5 shrink-0 justify-end">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="px-3 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Détails & Paiements</span>
                  </button>

                  <button
                    onClick={() => handleDownloadPDF(order)}
                    className="p-2 text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                    title="Télécharger Bon de Commande"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <a
                    href={buildWhatsAppUrl(
                      order.client_whatsapp || order.client_phone,
                      `Bonjour ${order.client_name}, nous avançons sur votre commande ${order.order_number} chez ROMÉO MEUBLE.`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => setDeleteConfirmId(order.id)}
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

      {/* Order Details & Payments Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          payments={selectedOrderPayments}
          company={company}
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdated={() => {
            onOrdersUpdated();
            if (selectedOrder) {
              const refreshed = StorageService.getOrderById(selectedOrder.id);
              setSelectedOrder(refreshed || null);
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-900 text-base">Supprimer cette commande ?</h3>
            <p className="text-xs text-slate-600">
              Cette action supprimera également tous les paiements rattachés à cette commande.
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
