import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Download, 
  MessageCircle, 
  CheckCircle2, 
  CreditCard, 
  Clock, 
  Banknote,
  FileText
} from 'lucide-react';
import { Order, Payment, CompanySettings, OrderStatus, PaymentMethod } from '../types';
import { formatFCFA, formatDate, formatDateNumeric, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, buildWhatsAppUrl } from '../lib/formatters';
import { StorageService } from '../lib/storage';
import { generateOrderPDF, downloadPDF } from '../lib/pdfGenerator';
import { useToast } from './Toast';

interface OrderDetailsModalProps {
  order: Order | null;
  payments: Payment[];
  company: CompanySettings;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  payments,
  company,
  isOpen,
  onClose,
  onOrderUpdated,
}) => {
  const { showToast } = useToast();

  // Payment form states
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money_mtn');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  if (!isOpen || !order) return null;

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = Math.max(0, order.total_amount - totalPaid);

  const handleStatusChange = (newStatus: OrderStatus) => {
    StorageService.updateOrderStatus(order.id, newStatus);
    showToast('success', 'Statut de commande mis à jour', `La commande est maintenant : ${ORDER_STATUS_LABELS[newStatus].label}`);
    onOrderUpdated();
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) {
      showToast('error', 'Montant invalide', 'Le montant du paiement doit être supérieur à zéro.');
      return;
    }
    if (paymentAmount > remainingBalance) {
      showToast('error', 'Montant supérieur au solde', `Le solde restant dû est de ${formatFCFA(remainingBalance)}.`);
      return;
    }

    StorageService.savePayment({
      order_id: order.id,
      quote_id: order.quote_id,
      client_id: order.client_id,
      amount: paymentAmount,
      payment_date: paymentDate,
      payment_method: paymentMethod,
      reference: paymentReference,
      note: paymentNote,
    });

    // If remaining is now 0 and order was prête/livrée, prompt or suggest completion
    if (paymentAmount >= remainingBalance) {
      showToast('success', 'Paiement intégral soldé !', 'La commande est entièrement payée.');
    } else {
      showToast('success', 'Paiement enregistré avec succès', `${formatFCFA(paymentAmount)} encaissés.`);
    }

    setShowPaymentForm(false);
    setPaymentAmount(0);
    setPaymentReference('');
    setPaymentNote('');
    onOrderUpdated();
  };

  const handleDeletePayment = (paymentId: string) => {
    StorageService.deletePayment(paymentId);
    showToast('info', 'Paiement supprimé', 'L\'encaissement a été retiré.');
    onOrderUpdated();
  };

  const handleDownloadOrderPDF = async () => {
    try {
      const doc = await generateOrderPDF(order, payments, company);
      downloadPDF(doc, `Bon_Commande_${order.order_number}_${order.client_name.replace(/\s+/g, '_')}.pdf`);
      showToast('success', 'Bon de commande téléchargé !');
    } catch (err) {
      console.error(err);
      showToast('error', 'Erreur de génération PDF');
    }
  };

  const currentStatusMeta = ORDER_STATUS_LABELS[order.status];

  const statusProgression: OrderStatus[] = [
    'a_realiser',
    'en_fabrication',
    'en_finition',
    'prete',
    'livree',
    'terminee',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Clock className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="truncate">
              <span className="font-bold text-base sm:text-lg">Commande {order.order_number}</span>
              {order.quote_number && (
                <span className="text-xs text-slate-300 ml-2">(Réf. Devis {order.quote_number})</span>
              )}
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${currentStatusMeta.bgClass} ${currentStatusMeta.textClass}`}>
              {currentStatusMeta.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadOrderPDF}
              className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bon de Commande PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Status Progression Bar */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Étape d'avancement à l'atelier de Yaoundé
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5">
              {statusProgression.map((st) => {
                const isCurrent = order.status === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStatusChange(st)}
                    className={`py-2 px-1 text-[11px] font-semibold rounded-lg border transition-all text-center cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-800 text-white border-amber-800 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {ORDER_STATUS_LABELS[st].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Client & Delivery Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <span className="font-bold text-amber-800 uppercase tracking-wider text-[10px] block">
                Client & Contact
              </span>
              <p className="font-bold text-slate-900 text-sm">{order.client_name}</p>
              <p className="text-slate-600">Téléphone : {order.client_phone}</p>
              <p className="text-slate-600">Adresse : {order.client_address}</p>
              <div className="pt-2">
                <a
                  href={buildWhatsAppUrl(
                    order.client_whatsapp || order.client_phone,
                    `Bonjour ${order.client_name}, un point sur votre commande ${order.order_number} en cours à l'atelier ROMÉO MEUBLE.`
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Écrire sur WhatsApp</span>
                </a>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-amber-800 uppercase tracking-wider text-[10px] block">
                Planning de Fabrication
              </span>
              <p className="text-slate-700">Date commande : <strong>{formatDate(order.date)}</strong></p>
              <p className="text-slate-700">
                Livraison estimée : <strong>{formatDate(order.estimated_delivery_date) || 'À convenir'}</strong>
              </p>
              {order.notes && (
                <p className="text-slate-500 italic border-t border-slate-200 pt-1.5 mt-1">
                  Note : {order.notes}
                </p>
              )}
            </div>
          </div>

          {/* Items In Production */}
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-2.5">
              Articles en fabrication ({order.items.length})
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Article & Description</th>
                    <th className="py-2.5 px-3 text-center w-24">Quantité</th>
                    <th className="py-2.5 px-3 text-right w-28">P.U. (FCFA)</th>
                    <th className="py-2.5 px-3 text-right w-32">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((it) => {
                    const isLabor = it.item_type === 'main_d_oeuvre';
                    return (
                      <tr key={it.id}>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            {isLabor ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                                🛠️ Main d'œuvre
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                🪵 Fourniture
                              </span>
                            )}
                            <span className="font-semibold text-slate-800">{it.designation}</span>
                          </div>
                          {it.description && <div className="text-[11px] text-slate-500 ml-1 mt-0.5">{it.description}</div>}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">{it.quantity} {it.unit}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{formatFCFA(it.unit_price)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatFCFA(it.total_price)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payments & Financial Ledger Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Encaissements & Règlements
                </h3>
                <p className="text-xs text-slate-500">
                  Acomptes et tranches versés par le client
                </p>
              </div>

              {remainingBalance > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentForm(!showPaymentForm);
                    setPaymentAmount(remainingBalance);
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Encaisser un versement</span>
                </button>
              )}
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] font-semibold text-slate-500 block">Total Commande</span>
                <span className="text-sm sm:text-base font-extrabold text-slate-900 font-mono-num">
                  {formatFCFA(order.total_amount)}
                </span>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                <span className="text-[11px] font-semibold text-emerald-700 block">Total Encaissé</span>
                <span className="text-sm sm:text-base font-extrabold text-emerald-800 font-mono-num">
                  {formatFCFA(totalPaid)}
                </span>
              </div>

              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-center">
                <span className="text-[11px] font-semibold text-rose-700 block">Reste à Payer</span>
                <span className="text-sm sm:text-base font-extrabold text-rose-800 font-mono-num">
                  {formatFCFA(remainingBalance)}
                </span>
              </div>
            </div>

            {/* Inline Payment Entry Form */}
            {showPaymentForm && (
              <form onSubmit={handleAddPayment} className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm text-emerald-950 flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>Nouveau Versement Client</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Annuler
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Montant reçu (FCFA) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={remainingBalance}
                      step="5000"
                      value={paymentAmount || ''}
                      onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                      className="w-full text-sm font-mono font-bold rounded-lg border border-slate-300 bg-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Date du règlement *
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full text-sm rounded-lg border border-slate-300 bg-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mode de paiement *
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full text-sm rounded-lg border border-slate-300 bg-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    >
                      <option value="mobile_money_mtn">MTN Mobile Money</option>
                      <option value="mobile_money_orange">Orange Money</option>
                      <option value="especes">Espèces à l'atelier</option>
                      <option value="virement">Virement bancaire</option>
                      <option value="autre">Autre moyen</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Référence / N° Transaction (facultatif)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: TXN-MTN-098231"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="w-full text-sm rounded-lg border border-slate-300 bg-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Note / Circonstance
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Deuxième acompte après vérification du châssis"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      className="w-full text-sm rounded-lg border border-slate-300 bg-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
                >
                  Enregistrer l'encaissement de {formatFCFA(paymentAmount)}
                </button>
              </form>
            )}

            {/* Payments List */}
            {payments.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                Aucun paiement n'a encore été enregistré pour cette commande.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {payments.map((p) => (
                  <div key={p.id} className="p-3 bg-white flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">
                          {PAYMENT_METHOD_LABELS[p.payment_method]}
                        </span>
                        <span className="text-slate-400">· {formatDate(p.payment_date)}</span>
                        {p.reference && (
                          <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                            {p.reference}
                          </span>
                        )}
                      </div>
                      {p.note && <p className="text-slate-500 mt-0.5">{p.note}</p>}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono-num font-bold text-emerald-800 text-sm">
                        + {formatFCFA(p.amount)}
                      </span>
                      <button
                        onClick={() => handleDeletePayment(p.id)}
                        className="text-slate-300 hover:text-rose-600 p-1 transition-colors"
                        title="Supprimer ce paiement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
