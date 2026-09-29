import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Copy, 
  Eye, 
  Save, 
  FileDown, 
  MessageCircle, 
  UserPlus, 
  Sparkles,
  Info,
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';
import { Quote, Client, QuoteItem, CompanySettings, DiscountType, QuoteStatus } from '../types';
import { StorageService } from '../lib/storage';
import { formatFCFA, buildWhatsAppUrl } from '../lib/formatters';
import { PRESET_CATALOG, PresetCatalogItem } from '../lib/brand';
import { useToast } from './Toast';

interface QuoteEditorProps {
  initialQuote?: Quote | null;
  clients: Client[];
  company: CompanySettings;
  onSave: (savedQuote: Quote) => void;
  onCancel: () => void;
  onPreview: (quote: Quote) => void;
  onDownloadPDF: (quote: Quote) => void;
}

export const QuoteEditor: React.FC<QuoteEditorProps> = ({
  initialQuote,
  clients,
  company,
  onSave,
  onCancel,
  onPreview,
  onDownloadPDF,
}) => {
  const { showToast } = useToast();

  // Quote identity
  const [quoteNumber, setQuoteNumber] = useState(
    initialQuote?.quote_number || StorageService.getNextQuoteNumber()
  );
  const [date, setDate] = useState(
    initialQuote?.date || new Date().toISOString().slice(0, 10)
  );
  const [validityDays, setValidityDays] = useState<number>(
    initialQuote?.validity_days || 30
  );
  const [status, setStatus] = useState<QuoteStatus>(
    initialQuote?.status || 'brouillon'
  );

  // Client Selection & Details
  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialQuote?.client_id || ''
  );
  const [isCreatingNewClient, setIsCreatingNewClient] = useState(false);
  const [clientName, setClientName] = useState(initialQuote?.client_name || '');
  const [clientPhone, setClientPhone] = useState(initialQuote?.client_phone || '');
  const [clientWhatsapp, setClientWhatsapp] = useState(initialQuote?.client_whatsapp || '');
  const [clientAddress, setClientAddress] = useState(initialQuote?.client_address || '');
  const [clientEmail, setClientEmail] = useState(initialQuote?.client_email || '');

  // Line items
  const [items, setItems] = useState<QuoteItem[]>(
    initialQuote?.items?.length
      ? initialQuote.items
      : [
          {
            id: `itm_${Date.now()}_1`,
            designation: 'Canapé 3 places grand confort',
            description: 'Structure bois dur traité, mousse haute résilience 35kg/m³, velours antitache au choix',
            quantity: 1,
            unit: 'pièce',
            unit_price: 280000,
            total_price: 280000,
          },
        ]
  );

  // Discount & Deposit
  const [discountType, setDiscountType] = useState<DiscountType>(
    initialQuote?.discount_type || 'none'
  );
  const [discountValue, setDiscountValue] = useState<number>(
    initialQuote?.discount_value || 0
  );
  const [depositRequested, setDepositRequested] = useState<number>(
    initialQuote?.deposit_requested || 0
  );

  // Notes & terms
  const [notes, setNotes] = useState(initialQuote?.notes || '');
  const [terms, setTerms] = useState(
    initialQuote?.terms_and_conditions || company.default_terms
  );

  // When picking an existing client from dropdown
  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    if (!clientId) {
      setClientName('');
      setClientPhone('');
      setClientWhatsapp('');
      setClientAddress('');
      setClientEmail('');
      return;
    }
    const found = clients.find(c => c.id === clientId);
    if (found) {
      setClientName(found.name);
      setClientPhone(found.phone);
      setClientWhatsapp(found.whatsapp || found.phone.replace(/\D/g, ''));
      setClientAddress(found.address);
      setClientEmail(found.email || '');
      setIsCreatingNewClient(false);
    }
  };

  // Line Item Handlers
  const handleAddItem = (preset?: PresetCatalogItem) => {
    const newItem: QuoteItem = preset
      ? {
          id: `itm_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          designation: preset.designation,
          description: preset.defaultDescription,
          quantity: 1,
          unit: preset.unit,
          unit_price: preset.defaultPrice,
          total_price: preset.defaultPrice,
        }
      : {
          id: `itm_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          designation: '',
          description: '',
          quantity: 1,
          unit: 'pièce',
          unit_price: 0,
          total_price: 0,
        };

    setItems(prev => [...prev, newItem]);
  };

  const handleUpdateItem = (id: string, updates: Partial<QuoteItem>) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        // Recalculate total_price
        const q = Math.max(0, Number(updated.quantity) || 0);
        const pu = Math.max(0, Number(updated.unit_price) || 0);
        updated.total_price = Math.round(q * pu);
        return updated;
      })
    );
  };

  const handleDeleteItem = (id: string) => {
    if (items.length <= 1) {
      showToast('info', 'Attention', 'Un devis doit comporter au moins une prestation.');
      return;
    }
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleDuplicateItem = (item: QuoteItem) => {
    const duplicated: QuoteItem = {
      ...item,
      id: `itm_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      designation: `${item.designation} (Copie)`,
    };
    setItems(prev => [...prev, duplicated]);
  };

  // Computations
  const subtotal = items.reduce((acc, it) => acc + (it.total_price || 0), 0);

  let discountAmount = 0;
  if (discountType === 'percent') {
    discountAmount = Math.round((subtotal * Math.min(100, Math.max(0, discountValue))) / 100);
  } else if (discountType === 'fixed') {
    discountAmount = Math.min(subtotal, Math.max(0, discountValue));
  }

  const totalAmount = Math.max(0, subtotal - discountAmount);
  const safeDeposit = Math.min(totalAmount, Math.max(0, depositRequested));
  const balanceDue = Math.max(0, totalAmount - safeDeposit);

  // Construct current transient quote object
  const buildCurrentQuote = (): Quote => {
    return {
      id: initialQuote?.id || `quo_${Date.now()}`,
      company_id: company.id,
      quote_number: quoteNumber.trim(),
      date,
      validity_days: Number(validityDays) || 30,
      status,
      client_id: selectedClientId || `cli_${Date.now()}`,
      client_name: clientName.trim(),
      client_phone: clientPhone.trim(),
      client_whatsapp: clientWhatsapp.trim() || clientPhone.replace(/\D/g, ''),
      client_address: clientAddress.trim(),
      client_email: clientEmail.trim() || undefined,
      items,
      subtotal,
      discount_type: discountType,
      discount_value: discountValue,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      deposit_requested: safeDeposit,
      balance_due: balanceDue,
      notes: notes.trim() || undefined,
      terms_and_conditions: terms.trim() || company.default_terms,
      converted_to_order_id: initialQuote?.converted_to_order_id,
      created_at: initialQuote?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  // Validation
  const validateForm = (): boolean => {
    if (!clientName.trim()) {
      showToast('error', 'Client manquant', 'Veuillez renseigner le nom du client ou sélectionner un client existant.');
      return false;
    }
    if (!clientPhone.trim()) {
      showToast('error', 'Téléphone manquant', 'Veuillez saisir un numéro de téléphone pour le client.');
      return false;
    }
    if (!quoteNumber.trim()) {
      showToast('error', 'Numéro de devis manquant', 'Le numéro de devis est obligatoire (ex: RM-2026-0001).');
      return false;
    }
    if (items.length === 0) {
      showToast('error', 'Prestation manquante', 'Ajoutez au moins une ligne d\'article ou de prestation.');
      return false;
    }
    for (let i = 0; i < items.length; i++) {
      if (!items[i].designation.trim()) {
        showToast('error', 'Désignation vide', `La ligne n°${i + 1} n'a pas de désignation.`);
        return false;
      }
      if (items[i].quantity <= 0) {
        showToast('error', 'Quantité invalide', `La quantité de la ligne "${items[i].designation}" doit être supérieure à zéro.`);
        return false;
      }
    }
    if (depositRequested > totalAmount) {
      showToast('error', 'Acompte excessif', 'Le montant de l\'acompte ne peut pas dépasser le total du devis.');
      return false;
    }
    return true;
  };

  const handleSaveQuote = () => {
    if (!validateForm()) return;

    // If client is new or modified, also persist/update client
    let finalClientId = selectedClientId;
    if (isCreatingNewClient || !selectedClientId) {
      const savedCli = StorageService.saveClient({
        name: clientName,
        phone: clientPhone,
        whatsapp: clientWhatsapp || clientPhone.replace(/\D/g, ''),
        address: clientAddress || 'Yaoundé',
        email: clientEmail,
      });
      finalClientId = savedCli.id;
    }

    const currentQuote = buildCurrentQuote();
    currentQuote.client_id = finalClientId;

    const saved = StorageService.saveQuote(currentQuote);
    showToast('success', 'Devis enregistré avec succès !', `Le devis ${saved.quote_number} a été sauvegardé.`);
    onSave(saved);
  };

  const handleOpenPreview = () => {
    if (!validateForm()) return;
    onPreview(buildCurrentQuote());
  };

  const handleDownloadPDFClick = () => {
    if (!validateForm()) return;
    onDownloadPDF(buildCurrentQuote());
  };

  const handleShareWhatsApp = () => {
    if (!validateForm()) return;
    const current = buildCurrentQuote();
    const msg = `Bonjour ${current.client_name},\n\nVotre devis ROMÉO MEUBLE N° ${current.quote_number} est disponible.\nMontant total : ${formatFCFA(current.total_amount)}.\nAcompte demandé : ${formatFCFA(current.deposit_requested)}.\n\nVous trouverez le devis PDF ci-joint.\n\nMerci pour votre confiance.\n\nROMÉO MEUBLE\nMenuiserie & Tapisserie\nWhatsApp : ${company.phone_primary}`;
    const url = buildWhatsAppUrl(current.client_whatsapp || current.client_phone, msg);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-28 md:pb-12 max-w-5xl mx-auto">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Retour à la liste"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              {initialQuote ? `Modifier le Devis ${initialQuote.quote_number}` : 'Créer un Devis Professionnel'}
            </h1>
            <p className="text-xs text-slate-500">
              Menuiserie & Tapisserie · Calcul automatique en FCFA
            </p>
          </div>
        </div>

        {/* Status selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Statut :</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as QuoteStatus)}
            className="text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 bg-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-800"
          >
            <option value="brouillon">Brouillon</option>
            <option value="envoye">Envoyé</option>
            <option value="en_attente">En attente</option>
            <option value="accepte">Accepté</option>
            <option value="refuse">Refusé</option>
            <option value="expire">Expiré</option>
          </select>
        </div>
      </div>

      {/* STEP 1: INFORMATIONS DU CLIENT */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-800 text-white font-bold text-xs flex items-center justify-center">
              1
            </span>
            <h2 className="font-display font-bold text-base text-slate-900">
              Informations du Client
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsCreatingNewClient(!isCreatingNewClient);
              if (!isCreatingNewClient) {
                setSelectedClientId('');
                setClientName('');
                setClientPhone('+237 ');
                setClientWhatsapp('');
                setClientAddress('Yaoundé');
              }
            }}
            className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isCreatingNewClient ? 'Choisir un client existant' : '+ Nouveau client'}</span>
          </button>
        </div>

        {/* Existing client picker */}
        {!isCreatingNewClient && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sélectionner un client enregistré
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => handleSelectClient(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 bg-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-800"
            >
              <option value="">-- Sélectionner dans la liste des clients --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone}) — {c.address}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Client Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nom complet du client <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: M. Tagne Patrice"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-800"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Téléphone <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: +237 699 12 34 56"
              value={clientPhone}
              onChange={(e) => {
                setClientPhone(e.target.value);
                if (!clientWhatsapp) {
                  setClientWhatsapp(e.target.value.replace(/\D/g, ''));
                }
              }}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-800"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Numéro WhatsApp
            </label>
            <input
              type="text"
              placeholder="Ex: 237699123456"
              value={clientWhatsapp}
              onChange={(e) => setClientWhatsapp(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Adresse / Quartier à Yaoundé
            </label>
            <input
              type="text"
              placeholder="Ex: Bastos, face ambassade"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email (facultatif)
            </label>
            <input
              type="email"
              placeholder="Ex: client@gmail.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-800"
            />
          </div>
        </div>
      </div>

      {/* STEP 2: INFORMATIONS DU DEVIS */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <span className="w-6 h-6 rounded-full bg-amber-800 text-white font-bold text-xs flex items-center justify-center">
            2
          </span>
          <h2 className="font-display font-bold text-base text-slate-900">
            Détails & Validité du Devis
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Numéro unique de devis <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={quoteNumber}
              onChange={(e) => setQuoteNumber(e.target.value)}
              className="w-full text-sm font-mono font-bold text-amber-900 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-800 bg-amber-50/40"
              required
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Format : RM-ANNÉE-NUMÉRO</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Date du devis
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Durée de validité
            </label>
            <div className="grid grid-cols-3 gap-1">
              {[7, 15, 30].map(days => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setValidityDays(days)}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    validityDays === days
                      ? 'bg-amber-800 text-white border-amber-800'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {days} jours
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* STEP 3: PRESTATIONS & ARTICLES */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-800 text-white font-bold text-xs flex items-center justify-center">
              3
            </span>
            <h2 className="font-display font-bold text-base text-slate-900">
              Articles & Prestations
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAddItem()}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-800 hover:bg-amber-900 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter une ligne</span>
            </button>
          </div>
        </div>

        {/* Quick Add Suggestions Chips */}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Raccourcis catalogue d'atelier (cliquez pour ajouter instantanément) :</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_CATALOG.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddItem(preset)}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 border border-slate-200 rounded-md transition-all cursor-pointer whitespace-nowrap"
              >
                + {preset.designation}
              </button>
            ))}
          </div>
        </div>

        {/* Lines Table / Cards */}
        <div className="space-y-3 pt-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-800">
                  Ligne #{index + 1}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleDuplicateItem(item)}
                    title="Dupliquer cette ligne"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    title="Supprimer cette ligne"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Designation & Description */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-6">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Désignation de la prestation <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Canapé 3 places, Lit capitonné, Réfection salon..."
                    value={item.designation}
                    onChange={(e) => handleUpdateItem(item.id, { designation: e.target.value })}
                    className="w-full text-sm font-medium rounded-lg border border-slate-300 bg-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-800"
                  />
                </div>

                <div className="md:col-span-6">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Description, dimensions, tissu & finition
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Bois Iroko, velours antitache gris, mousse 35kg/m³..."
                    value={item.description || ''}
                    onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                    className="w-full text-sm rounded-lg border border-slate-300 bg-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-800"
                  />
                </div>
              </div>

              {/* Quantité, Unité, Prix Unitaire, Total Ligne */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Quantité
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) => handleUpdateItem(item.id, { quantity: Number(e.target.value) })}
                    className="w-full text-sm text-center font-bold font-mono rounded-lg border border-slate-300 bg-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Unité
                  </label>
                  <select
                    value={item.unit}
                    onChange={(e) => handleUpdateItem(item.id, { unit: e.target.value })}
                    className="w-full text-sm rounded-lg border border-slate-300 bg-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-800"
                  >
                    <option value="pièce">pièce (U)</option>
                    <option value="ensemble">ensemble</option>
                    <option value="paire">paire</option>
                    <option value="m²">m²</option>
                    <option value="ml">mètre linéaire (ml)</option>
                    <option value="forfait">forfait</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Prix unitaire (FCFA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={item.unit_price}
                    onChange={(e) => handleUpdateItem(item.id, { unit_price: Number(e.target.value) })}
                    className="w-full text-sm text-right font-mono font-bold rounded-lg border border-slate-300 bg-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Total ligne (FCFA)
                  </label>
                  <div className="w-full text-sm text-right font-mono font-extrabold text-slate-900 bg-slate-100 rounded-lg px-3 py-1.5 border border-slate-200">
                    {formatFCFA(item.total_price)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => handleAddItem()}
          className="w-full py-2.5 text-xs sm:text-sm font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-dashed border-amber-300 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Ajouter une prestation supplémentaire</span>
        </button>
      </div>

      {/* STEP 4: REMISE, ACOMPTE ET TOTAL FCFA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Remise & Acompte Configuration */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-full bg-amber-800 text-white font-bold text-xs flex items-center justify-center">
              4
            </span>
            <h2 className="font-display font-bold text-base text-slate-900">
              Remise & Modalités d'Acompte
            </h2>
          </div>

          {/* Section Remise */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Application d'une remise commerciale
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDiscountType('none');
                  setDiscountValue(0);
                }}
                className={`py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  discountType === 'none'
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Aucune remise
              </button>
              <button
                type="button"
                onClick={() => setDiscountType('percent')}
                className={`py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  discountType === 'percent'
                    ? 'bg-amber-800 text-white border-amber-800'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Pourcentage (%)
              </button>
              <button
                type="button"
                onClick={() => setDiscountType('fixed')}
                className={`py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  discountType === 'fixed'
                    ? 'bg-amber-800 text-white border-amber-800'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Montant fixe (FCFA)
              </button>
            </div>

            {discountType !== 'none' && (
              <div className="mt-3 p-3 bg-amber-50/60 rounded-lg border border-amber-200">
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  {discountType === 'percent' ? 'Valeur du rabais (%)' : 'Montant de la remise (FCFA)'}
                </label>
                <input
                  type="number"
                  min="0"
                  max={discountType === 'percent' ? 100 : subtotal}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                  className="w-full text-sm font-mono font-bold rounded-lg border border-amber-300 bg-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-800"
                />
              </div>
            )}
          </div>

          {/* Section Acompte Demandé */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Acompte demandé au client (FCFA)
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDepositRequested(Math.round(totalAmount * 0.5))}
                  className="text-[11px] font-semibold text-amber-800 hover:underline px-1.5 py-0.5 rounded bg-amber-50"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => setDepositRequested(Math.round(totalAmount * 0.6))}
                  className="text-[11px] font-semibold text-amber-800 hover:underline px-1.5 py-0.5 rounded bg-amber-50"
                >
                  60%
                </button>
                <button
                  type="button"
                  onClick={() => setDepositRequested(totalAmount)}
                  className="text-[11px] font-semibold text-amber-800 hover:underline px-1.5 py-0.5 rounded bg-amber-50"
                >
                  100%
                </button>
              </div>
            </div>

            <input
              type="number"
              min="0"
              max={totalAmount}
              step="5000"
              value={depositRequested}
              onChange={(e) => setDepositRequested(Number(e.target.value) || 0)}
              className="w-full text-base font-mono font-bold rounded-lg border border-slate-300 px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-amber-800"
              placeholder="Ex: 200 000"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Généralement 50% à 60% pour l'achat du bois noble, des mousses et tissus d'ameublement.
            </span>
          </div>
        </div>

        {/* Right: High-Contrast Live Financial Breakdown */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-amber-950 text-white rounded-xl p-5 sm:p-6 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider block mb-2">
              Bilan Financier du Devis
            </span>

            <div className="space-y-2.5 text-sm text-slate-300">
              <div className="flex items-center justify-between">
                <span>Sous-total brut :</span>
                <span className="font-mono-num font-semibold text-white">{formatFCFA(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-rose-300">
                  <span>Remise accordée :</span>
                  <span className="font-mono-num font-bold">- {formatFCFA(discountAmount)}</span>
                </div>
              )}

              <div className="border-t border-slate-700/60 pt-3 my-2">
                <div className="flex items-center justify-between text-base sm:text-lg font-bold text-white">
                  <span>TOTAL À PAYER :</span>
                  <span className="font-mono-num text-amber-300 text-xl sm:text-2xl">{formatFCFA(totalAmount)}</span>
                </div>
              </div>

              <div className="bg-white/10 rounded-lg p-3 space-y-2 mt-4">
                <div className="flex items-center justify-between text-xs sm:text-sm text-amber-200">
                  <span>ACOMPTE DEMANDÉ :</span>
                  <span className="font-mono-num font-bold text-white text-base">{formatFCFA(safeDeposit)}</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm text-rose-200 border-t border-white/10 pt-2">
                  <span>RESTE À PAYER :</span>
                  <span className="font-mono-num font-extrabold text-white text-base">{formatFCFA(balanceDue)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-3">
            Atelier ROMÉO MEUBLE · Devis valable {validityDays} jours.
          </div>
        </div>
      </div>

      {/* STEP 5: NOTES ET CONDITIONS */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <span className="w-6 h-6 rounded-full bg-amber-800 text-white font-bold text-xs flex items-center justify-center">
            5
          </span>
          <h2 className="font-display font-bold text-base text-slate-900">
            Notes au Client & Conditions Générales
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes personnalisées pour le client
            </label>
            <textarea
              rows={3}
              placeholder="Ex: Teinte de vernis mat choisie, livraison fin de semaine, tissu velours beige référence #402..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Conditions de réalisation & paiement
            </label>
            <textarea
              rows={3}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-800"
            />
          </div>
        </div>
      </div>

      {/* FLOATING ACTION BAR (Mobile-First Touch Zone) */}
      <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:p-4 shadow-xl">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-mono-num">
            <span>Devis : <strong>{quoteNumber}</strong></span>
            <span>·</span>
            <span>Total : <strong className="text-slate-900">{formatFCFA(totalAmount)}</strong></span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleOpenPreview}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Aperçu</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDFClick}
              className="hidden xs:flex px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>PDF A4</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="hidden md:flex px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors items-center justify-center gap-1.5 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleSaveQuote}
              className="flex-1 sm:flex-initial px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-amber-800 hover:bg-amber-900 active:scale-[0.98] rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-900/20 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer le devis</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
