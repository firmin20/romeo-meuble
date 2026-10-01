import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, 
  ArrowRight,
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
  ChevronDown,
  Stamp,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Edit3,
  MapPin,
  Clock,
  Phone,
  ArrowUp,
  ArrowDown,
  Percent,
  Check,
  X,
  FileText
} from 'lucide-react';
import { Quote, Client, QuoteItem, CompanySettings, DiscountType, QuoteStatus } from '../types';
import { StorageService } from '../lib/storage';
import { formatFCFA, buildWhatsAppUrl, buildQuoteWhatsAppMessage, formatDateNumeric } from '../lib/formatters';
import { PRESET_CATALOG, PresetCatalogItem, BRAND_STAMP_SRC, BRAND_SIGNATURE_SRC } from '../lib/brand';
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

type WizardStep = 1 | 2 | 3 | 4 | 5;

const STEP_TITLES = [
  { step: 1, title: 'Client', subtitle: 'Coordonnées du client' },
  { step: 2, title: 'Projet', subtitle: 'Objet & détails des travaux' },
  { step: 3, title: 'Prestations', subtitle: 'Articles, quantités & prix' },
  { step: 4, title: 'Paiement', subtitle: 'Remise, acompte & conditions' },
  { step: 5, title: 'Vérification', subtitle: 'Résumé avant génération' },
];

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

  // Wizard active step (1 to 5)
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Quote identity
  const [quoteNumber] = useState(
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

  // Step 1: Client Selection & Details
  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialQuote?.client_id || ''
  );
  const [clientName, setClientName] = useState(initialQuote?.client_name || '');
  const [clientPhone, setClientPhone] = useState(initialQuote?.client_phone || '');
  const [clientWhatsapp, setClientWhatsapp] = useState(initialQuote?.client_whatsapp || '');
  const [clientAddress, setClientAddress] = useState(initialQuote?.client_address || '');
  const [clientEmail, setClientEmail] = useState(initialQuote?.client_email || '');
  const [saveNewClientInBook, setSaveNewClientInBook] = useState(true);

  // Step 2: Project Details
  const [projectObject, setProjectObject] = useState(
    initialQuote?.project_object || ''
  );
  const [projectDescription, setProjectDescription] = useState(
    initialQuote?.project_description || ''
  );
  const [executionLocation, setExecutionLocation] = useState(
    initialQuote?.execution_location || ''
  );
  const [estimatedDuration, setEstimatedDuration] = useState(
    initialQuote?.estimated_duration || ''
  );

  // Step 3: Line Items (Prestations)
  const [items, setItems] = useState<QuoteItem[]>(
    initialQuote?.items?.length
      ? initialQuote.items
      : [
          {
            id: `itm_${Date.now()}_1`,
            designation: 'Porte 5 panneaux',
            description: 'Porte en bois massif 5 panneaux avec finitions et moulures soignées',
            quantity: 1,
            unit: 'pièce',
            unit_price: 75000,
            total_price: 75000,
          },
        ]
  );
  const [showCatalogDrawer, setShowCatalogDrawer] = useState(false);

  // Step 4: Discount, Deposit & Conditions
  const [discountType, setDiscountType] = useState<DiscountType>(
    initialQuote?.discount_type || 'none'
  );
  const [discountValue, setDiscountValue] = useState<number>(
    initialQuote?.discount_value || 0
  );
  const [depositRequested, setDepositRequested] = useState<number>(
    initialQuote?.deposit_requested || 0
  );
  const [notes, setNotes] = useState(initialQuote?.notes || '');
  const [terms, setTerms] = useState(
    initialQuote?.terms_and_conditions || company.default_terms
  );
  const [includeStamp, setIncludeStamp] = useState<boolean>(
    initialQuote?.include_stamp !== undefined ? initialQuote.include_stamp : (company.show_stamp_on_quotes ?? true)
  );

  // Success dialog after quote generation
  const [generatedQuote, setGeneratedQuote] = useState<Quote | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Sync execution location with client address if empty
  useEffect(() => {
    if (!executionLocation && clientAddress) {
      setExecutionLocation(clientAddress);
    }
  }, [clientAddress, executionLocation]);

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
    }
  };

  // Line Item Handlers
  const handleAddItem = (preset?: PresetCatalogItem) => {
    const newItem: QuoteItem = preset
      ? {
          id: `itm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          designation: preset.designation,
          description: preset.defaultDescription,
          quantity: 1,
          unit: preset.unit,
          unit_price: preset.defaultPrice,
          total_price: preset.defaultPrice,
        }
      : {
          id: `itm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          designation: '',
          description: '',
          quantity: 1,
          unit: 'pièce',
          unit_price: 0,
          total_price: 0,
        };

    setItems(prev => [...prev, newItem]);
    if (preset) {
      showToast('success', 'Prestation ajoutée', preset.designation);
    }
  };

  const handleUpdateItem = (id: string, updates: Partial<QuoteItem>) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        const q = Math.max(0, Number(updated.quantity) || 0);
        const pu = Math.max(0, Number(updated.unit_price) || 0);
        updated.total_price = Math.round(q * pu);
        return updated;
      })
    );
  };

  const handleDeleteItem = (id: string) => {
    if (items.length <= 1) {
      showToast('error', 'Action impossible', 'Un devis doit comporter au moins une prestation.');
      return;
    }
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleDuplicateItem = (item: QuoteItem) => {
    const duplicated: QuoteItem = {
      ...item,
      id: `itm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      designation: `${item.designation} (Copie)`,
    };
    setItems(prev => [...prev, duplicated]);
    showToast('info', 'Ligne dupliquée', duplicated.designation);
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    setItems(newItems);
  };

  // Financial Calculations
  const subtotal = items.reduce((acc, it) => acc + (it.total_price || 0), 0);

  let discountAmount = 0;
  if (discountType === 'percent') {
    discountAmount = Math.round((subtotal * Math.min(100, Math.max(0, discountValue))) / 100);
  } else if (discountType === 'fixed') {
    discountAmount = Math.min(subtotal, Math.max(0, discountValue));
  }

  const totalAmount = Math.max(0, subtotal - discountAmount);
  const balanceDue = Math.max(0, totalAmount - depositRequested);

  // Deposit Shortcuts
  const setDepositPercent = (percent: number) => {
    const calculated = Math.round((totalAmount * percent) / 100);
    setDepositRequested(calculated);
  };

  // Validation per step
  const validateStep = (step: WizardStep): boolean => {
    if (step === 1) {
      if (!clientName.trim()) {
        showToast('error', 'Nom obligatoire', 'Veuillez saisir le nom ou la raison sociale du client.');
        return false;
      }
      if (!clientPhone.trim()) {
        showToast('error', 'Téléphone obligatoire', 'Veuillez renseigner le numéro de téléphone du client.');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!projectObject.trim()) {
        showToast('error', 'Objet obligatoire', 'Veuillez préciser l\'objet du devis (ex: Devis de finition bâtiment).');
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (items.length === 0) {
        showToast('error', 'Prestation requise', 'Veuillez ajouter au moins une prestation au devis.');
        return false;
      }
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.designation.trim()) {
          showToast('error', 'Désignation manquante', `La désignation de la prestation N° ${i + 1} est vide.`);
          return false;
        }
        if (item.quantity <= 0) {
          showToast('error', 'Quantité invalide', `La quantité de la prestation N° ${i + 1} doit être supérieure à 0.`);
          return false;
        }
        if (item.unit_price < 0) {
          showToast('error', 'Prix négatif', `Le prix unitaire de la prestation N° ${i + 1} ne peut pas être négatif.`);
          return false;
        }
      }
      return true;
    }

    if (step === 4) {
      if (depositRequested > totalAmount) {
        showToast('error', 'Acompte excessif', 'L\'acompte demandé ne peut pas dépasser le montant total du devis.');
        return false;
      }
      if (depositRequested < 0) {
        showToast('error', 'Acompte invalide', 'L\'acompte ne peut pas être négatif.');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNextStep = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Construct final Quote object
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
      project_object: projectObject.trim() || 'Travaux de menuiserie et tapisserie',
      project_description: projectDescription.trim() || undefined,
      execution_location: executionLocation.trim() || undefined,
      estimated_duration: estimatedDuration.trim() || undefined,
      items,
      subtotal,
      discount_type: discountType,
      discount_value: discountValue,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      deposit_requested: depositRequested,
      balance_due: balanceDue,
      notes: notes.trim() || undefined,
      terms_and_conditions: terms.trim() || company.default_terms,
      include_stamp: includeStamp,
      converted_to_order_id: initialQuote?.converted_to_order_id,
      created_at: initialQuote?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  // Save & Generate Quote
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all steps
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      return;
    }

    // If new client and user requested saving to client book
    let finalClientId = selectedClientId;
    if (!selectedClientId && saveNewClientInBook) {
      try {
        const newClient = StorageService.saveClient({
          name: clientName.trim(),
          phone: clientPhone.trim(),
          whatsapp: clientWhatsapp.trim() || clientPhone.replace(/\D/g, ''),
          address: clientAddress.trim(),
          email: clientEmail.trim() || undefined,
        });
        finalClientId = newClient.id;
      } catch (err) {
        console.warn('Could not auto-save client:', err);
      }
    }

    const quoteToSave = {
      ...buildCurrentQuote(),
      client_id: finalClientId || `cli_${Date.now()}`,
    };

    const saved = StorageService.saveQuote(quoteToSave);
    setGeneratedQuote(saved);
    setShowSuccessModal(true);

    // Launch confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#b45309', '#d97706', '#f59e0b', '#1e293b'],
      });
    } catch {
      // Ignored
    }

    showToast('success', 'Devis généré avec succès !', `N° ${saved.quote_number} enregistré pour ${saved.client_name}`);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 pb-24 md:pb-12">
      {/* Top Sticky Header */}
      <div className="sticky top-0 z-30 bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 -ml-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Retour aux devis"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-base sm:text-lg text-white truncate">
                  {initialQuote ? 'Modifier le devis' : 'Nouveau devis'}
                </h1>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {quoteNumber}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                ROMÉO MEUBLE · Menuiserie & Tapisserie
              </p>
            </div>
          </div>

          {/* Top Total Badge & Cancel */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Total devis</span>
              <span className="text-sm sm:text-base font-extrabold font-mono text-amber-400">
                {formatFCFA(totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Stepper Progress Bar (Mobile-First) */}
        <div className="bg-slate-950/80 border-t border-slate-800/80 px-2 sm:px-4 py-2">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-5 gap-1 sm:gap-2">
              {STEP_TITLES.map((s) => {
                const isActive = currentStep === s.step;
                const isPast = currentStep > s.step;
                return (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => {
                      if (validateStep(currentStep) || s.step < currentStep) {
                        setCurrentStep(s.step as WizardStep);
                      }
                    }}
                    className={`py-1.5 px-1 sm:px-2 rounded-lg text-center transition-all flex flex-col items-center cursor-pointer ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : isPast
                        ? 'bg-slate-800 text-amber-300 hover:bg-slate-750'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                        isActive
                          ? 'bg-slate-950 text-amber-400'
                          : isPast
                          ? 'bg-amber-400/30 text-amber-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {isPast ? '✓' : s.step}
                      </span>
                      <span className="text-xs truncate hidden xs:inline">{s.title}</span>
                    </div>
                    <span className="text-[10px] truncate xs:hidden font-medium">
                      {s.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Wizard Form Container */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <form onSubmit={handleFinalSubmit} className="space-y-6">

          {/* ======================================================== */}
          {/* ÉTAPE 1 — CLIENT                                         */}
          {/* ======================================================== */}
          {currentStep === 1 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-extrabold flex items-center justify-center text-sm">
                      1
                    </span>
                    <div>
                      <h2 className="font-display font-bold text-lg text-slate-900">
                        Informations du Client
                      </h2>
                      <p className="text-xs text-slate-500">
                        Sélectionnez un client existant ou saisissez les coordonnées d'un nouveau client.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Select Client Dropdown */}
              {clients.length > 0 && (
                <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2">
                  <label className="block text-xs font-bold text-amber-950">
                    Sélectionner un client déjà enregistré dans l'atelier :
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedClientId}
                      onChange={(e) => handleSelectClient(e.target.value)}
                      className="w-full text-xs sm:text-sm bg-white border border-amber-300 rounded-lg py-2.5 px-3 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
                    >
                      <option value="">-- Nouveau client (saisie manuelle) --</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} · {c.phone} {c.address ? `(${c.address})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nom */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nom / Raison sociale du client <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex : Mr DOZO ou Société SOREPCO"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-300 p-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-medium"
                  />
                </div>

                {/* Téléphone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Numéro de téléphone <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      inputMode="tel"
                      placeholder="Ex : 657 445 749 ou +237 6XX XX XX XX"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full text-sm rounded-xl border border-slate-300 py-3 pl-10 pr-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-medium font-mono-num"
                    />
                  </div>
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp (si différent du téléphone)
                  </label>
                  <div className="relative">
                    <MessageCircle className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      inputMode="tel"
                      placeholder="Ex : 657445749 (optionnel)"
                      value={clientWhatsapp}
                      onChange={(e) => setClientWhatsapp(e.target.value)}
                      className="w-full text-sm rounded-xl border border-slate-300 py-3 pl-10 pr-3 focus:ring-2 focus:ring-amber-500 font-mono-num"
                    />
                  </div>
                </div>

                {/* Adresse */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Adresse ou quartier du client
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="Ex : Nkoabang, nouveau quartier Bami ou Bastos, Yaoundé"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      className="w-full text-sm rounded-xl border border-slate-300 py-3 pl-10 pr-3 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email du client (facultatif)
                  </label>
                  <input
                    type="email"
                    inputMode="email"
                    placeholder="client@gmail.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-300 p-3 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Save New Client Checkbox */}
              {!selectedClientId && (
                <div className="pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveNewClientInBook}
                      onChange={(e) => setSaveNewClientInBook(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-800 focus:ring-amber-800 border-slate-300"
                    />
                    <span className="text-xs font-medium text-slate-700">
                      Enregistrer ce client dans le carnet d'adresses de ROMÉO MEUBLE pour les prochains devis
                    </span>
                  </label>
                </div>
              )}

              {/* Step 1 Actions */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-3 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-3 text-xs sm:text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-sm active:scale-[0.98] flex items-center gap-2 cursor-pointer"
                >
                  <span>Continuer vers le Projet</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ÉTAPE 2 — PROJET                                         */}
          {/* ======================================================== */}
          {currentStep === 2 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-extrabold flex items-center justify-center text-sm">
                    2
                  </span>
                  <div>
                    <h2 className="font-display font-bold text-lg text-slate-900">
                      Détails du Projet / Travaux
                    </h2>
                    <p className="text-xs text-slate-500">
                      Définissez l'objet précis du devis, la description et le lieu d'exécution des travaux.
                    </p>
                  </div>
                </div>
              </div>

              {/* Project Object */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Objet du devis <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Devis de finition bâtiment"
                  value={projectObject}
                  onChange={(e) => setProjectObject(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-300 p-3 focus:ring-2 focus:ring-amber-500 font-medium"
                />

                {/* Quick suggestions chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 self-center mr-1">Suggestions :</span>
                  {[
                    'Devis de finition bâtiment',
                    'Fabrication salon complet 7 places',
                    'Confection table à manger en Iroko',
                    'Aménagement chambre parentale',
                    'Réfection canapés & fauteuils',
                    'Pose portes & couvre-joints',
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setProjectObject(sug)}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 transition-colors cursor-pointer border border-slate-200"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Project Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description du projet / travaux (facultatif)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex : Travaux de finition et traitement des éléments en bois, ponçage méticuleux et vernissage de protection."
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-300 p-3 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Lieu d'exécution */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lieu d'exécution des travaux
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="Ex : Nkoabang, nouveau quartier Bami ou En atelier ROMÉO MEUBLE"
                    value={executionLocation}
                    onChange={(e) => setExecutionLocation(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-300 py-3 pl-10 pr-3 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Date, Durée, Validité */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date du devis
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-amber-500 font-mono-num"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Durée estimée des travaux
                  </label>
                  <input
                    type="text"
                    placeholder="Ex : 7 jours ouvrés"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Validité du devis
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={180}
                      value={validityDays}
                      onChange={(e) => setValidityDays(Number(e.target.value) || 30)}
                      className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-amber-500 font-mono-num"
                    />
                    <span className="text-xs text-slate-500 shrink-0">jours</span>
                  </div>
                </div>
              </div>

              {/* Step 2 Actions */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-3 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Retour (Client)</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-3 text-xs sm:text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-sm active:scale-[0.98] flex items-center gap-2 cursor-pointer"
                >
                  <span>Continuer vers les Prestations</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ÉTAPE 3 — PRESTATIONS / ARTICLES                         */}
          {/* ======================================================== */}
          {currentStep === 3 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-extrabold flex items-center justify-center text-sm">
                    3
                  </span>
                  <div>
                    <h2 className="font-display font-bold text-lg text-slate-900">
                      Prestations & Articles du Devis
                    </h2>
                    <p className="text-xs text-slate-500">
                      Ajoutez les fournitures, travaux de menuiserie, matériaux et main d'œuvre.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCatalogDrawer(!showCatalogDrawer)}
                    className="px-3 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    <span>{showCatalogDrawer ? 'Masquer modèles' : 'Modèles rapides'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Preset Catalog Box */}
              {showCatalogDrawer && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Cliquez sur un modèle pour l'ajouter instantanément au devis :
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCatalogDrawer(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Fermer ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {PRESET_CATALOG.slice(0, 9).map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddItem(preset)}
                        className="p-2.5 text-left bg-white hover:bg-amber-50 hover:border-amber-300 rounded-lg border border-slate-200 transition-all text-xs flex flex-col justify-between cursor-pointer group shadow-2xs"
                      >
                        <div className="font-bold text-slate-900 group-hover:text-amber-900">
                          + {preset.designation}
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                          <span>Unité: {preset.unit}</span>
                          <span className="font-mono font-semibold text-slate-700">
                            {formatFCFA(preset.defaultPrice)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-3 relative"
                  >
                    {/* Item Header */}
                    <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 text-xs font-mono font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          Prestation N° {index + 1}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveItem(index, 'up')}
                          title="Déplacer vers le haut"
                          className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === items.length - 1}
                          onClick={() => handleMoveItem(index, 'down')}
                          title="Déplacer vers le bas"
                          className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateItem(item)}
                          title="Dupliquer cette ligne"
                          className="p-1.5 text-slate-400 hover:text-amber-800 rounded cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          title="Supprimer cette ligne"
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Designation & Description */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-7">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Désignation de la prestation / fourniture <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex : Porte 5 panneaux, Vernis bois, Main d'œuvre..."
                          value={item.designation}
                          onChange={(e) => handleUpdateItem(item.id, { designation: e.target.value })}
                          className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2.5 bg-white font-medium focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Précisions / dimensions (optionnel)
                        </label>
                        <input
                          type="text"
                          placeholder="Ex : Bois massif traité, 140x200, coloris camel"
                          value={item.description || ''}
                          onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                          className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    {/* Quantity, Unit, Unit Price, Line Total */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-end pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Quantité <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          inputMode="decimal"
                          min={0.1}
                          step="any"
                          required
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                          className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2 bg-white font-mono-num font-bold text-center"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Unité
                        </label>
                        <select
                          value={item.unit}
                          onChange={(e) => handleUpdateItem(item.id, { unit: e.target.value })}
                          className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2 bg-white font-medium"
                        >
                          <option value="pièce">pièce</option>
                          <option value="ensemble">ensemble</option>
                          <option value="forfait">forfait</option>
                          <option value="L">L (Litre)</option>
                          <option value="m">m (Mètre)</option>
                          <option value="m²">m² (Surface)</option>
                          <option value="m³">m³ (Volume)</option>
                          <option value="kg">kg (Poids)</option>
                          <option value="rouleau">rouleau</option>
                          <option value="paire">paire</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Prix unitaire (FCFA) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          step={50}
                          required
                          value={item.unit_price}
                          onChange={(e) => handleUpdateItem(item.id, { unit_price: parseInt(e.target.value, 10) || 0 })}
                          className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2 bg-white font-mono-num font-bold text-right"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          Total ligne
                        </label>
                        <div className="w-full text-xs sm:text-sm rounded-lg bg-slate-200/80 p-2 font-mono font-extrabold text-slate-900 text-right">
                          {formatFCFA(item.total_price)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Prestation Button */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleAddItem()}
                  className="w-full sm:w-auto px-5 py-3 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>+ Ajouter une prestation</span>
                </button>

                <div className="w-full sm:ml-auto p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between sm:max-w-xs text-xs">
                  <span className="font-semibold text-amber-950">Sous-total prestations :</span>
                  <span className="font-mono font-bold text-sm text-amber-900">
                    {formatFCFA(subtotal)}
                  </span>
                </div>
              </div>

              {/* Step 3 Actions */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-3 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Retour (Projet)</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-3 text-xs sm:text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-sm active:scale-[0.98] flex items-center gap-2 cursor-pointer"
                >
                  <span>Continuer vers le Paiement</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ÉTAPE 4 — PAIEMENT & CONDITIONS                          */}
          {/* ======================================================== */}
          {currentStep === 4 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-extrabold flex items-center justify-center text-sm">
                    4
                  </span>
                  <div>
                    <h2 className="font-display font-bold text-lg text-slate-900">
                      Remise, Acompte & Conditions
                    </h2>
                    <p className="text-xs text-slate-500">
                      Ajustez les conditions financières et contractuelles de la commande.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section Remise */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Remise Commerciale
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'none', label: 'Aucune remise' },
                    { id: 'percent', label: 'Pourcentage (%)' },
                    { id: 'fixed', label: 'Montant fixe (FCFA)' },
                  ].map((rt) => (
                    <button
                      key={rt.id}
                      type="button"
                      onClick={() => setDiscountType(rt.id as DiscountType)}
                      className={`py-2 px-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        discountType === rt.id
                          ? 'bg-amber-800 text-white border-amber-800 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {rt.label}
                    </button>
                  ))}
                </div>

                {discountType !== 'none' && (
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <div className="w-full sm:w-48">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {discountType === 'percent' ? 'Valeur du rabais (%)' : 'Montant déduit (FCFA)'}
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={discountType === 'percent' ? 100 : subtotal}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                        className="w-full text-sm font-mono-num font-bold rounded-lg border border-slate-300 p-2 bg-white"
                      />
                    </div>
                    <div className="text-xs text-rose-700 font-semibold self-center pt-3">
                      Montant déduit : - {formatFCFA(discountAmount)}
                    </div>
                  </div>
                )}
              </div>

              {/* Section Acompte & Reste à Payer */}
              <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 space-y-4">
                <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  Acompte Demandé & Reste à Payer
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Montant de l'acompte (FCFA)
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={totalAmount}
                      value={depositRequested}
                      onChange={(e) => setDepositRequested(parseInt(e.target.value, 10) || 0)}
                      className="w-full text-base font-mono-num font-extrabold rounded-xl border border-amber-300 p-3 bg-white text-slate-900 focus:ring-2 focus:ring-amber-500"
                    />

                    {/* Quick percentage shortcuts */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-500 self-center">Raccourcis :</span>
                      {[
                        { label: '0%', p: 0 },
                        { label: '30%', p: 30 },
                        { label: '50%', p: 50 },
                        { label: '70%', p: 70 },
                        { label: '100%', p: 100 },
                      ].map((sc) => (
                        <button
                          key={sc.p}
                          type="button"
                          onClick={() => setDepositPercent(sc.p)}
                          className="px-2 py-0.5 text-[11px] font-semibold bg-white hover:bg-amber-200 text-amber-950 rounded border border-amber-300 transition-colors cursor-pointer"
                        >
                          {sc.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Calculations Summary Card */}
                  <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Sous-total brut :</span>
                      <span className="font-mono font-semibold">{formatFCFA(subtotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>Remise déduite :</span>
                        <span className="font-mono font-bold">- {formatFCFA(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-900 font-extrabold pt-1 border-t border-slate-200 text-sm">
                      <span>TOTAL DU DEVIS :</span>
                      <span className="font-mono text-amber-900">{formatFCFA(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-amber-800 font-semibold">
                      <span>Acompte demandé :</span>
                      <span className="font-mono">{formatFCFA(depositRequested)}</span>
                    </div>
                    <div className="flex justify-between text-rose-700 font-extrabold pt-1 border-t border-slate-100 text-sm">
                      <span>RESTE À PAYER :</span>
                      <span className="font-mono text-base">{formatFCFA(balanceDue)}</span>
                    </div>
                  </div>
                </div>

                {depositRequested > totalAmount && (
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>L'acompte ne peut pas excéder le montant total ({formatFCFA(totalAmount)}).</span>
                  </div>
                )}
              </div>

              {/* Conditions / Observations */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Conditions / observations contractuelles
                </label>
                <textarea
                  rows={4}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 p-3 leading-relaxed focus:ring-2 focus:ring-amber-500"
                />

                {/* Quick clause chips */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-400 self-center">Ajouter clause :</span>
                  {[
                    "Début des travaux après confirmation et encaissement de l'acompte.",
                    "Devis valable pendant 15 jours à compter de son émission.",
                    "Les matériaux supplémentaires non prévus feront l'objet d'une facturation complémentaire.",
                    "Livraison et installation soignées à Yaoundé incluses.",
                  ].map((clause, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTerms(prev => `${prev}\n- ${clause}`.trim())}
                      className="px-2 py-1 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                    >
                      + {clause.slice(0, 32)}...
                    </button>
                  ))}
                </div>

                {/* Official Stamp & Signature Toggle */}
                <div className="pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeStamp}
                      onChange={(e) => setIncludeStamp(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-800 focus:ring-amber-800 border-slate-300"
                    />
                    <span className="text-xs font-medium text-slate-700">
                      Apposer le cachet officiel et la signature manuscrite de l'atelier sur le PDF
                    </span>
                  </label>
                </div>
              </div>

              {/* Step 4 Actions */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-3 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Retour (Prestations)</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-3 text-xs sm:text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-sm active:scale-[0.98] flex items-center gap-2 cursor-pointer"
                >
                  <span>Vérifier le devis</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ÉTAPE 5 — VÉRIFICATION DU DEVIS                          */}
          {/* ======================================================== */}
          {currentStep === 5 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-sm">
                      5
                    </span>
                    <div>
                      <h2 className="font-display font-bold text-lg text-slate-900">
                        Vérification du Devis
                      </h2>
                      <p className="text-xs text-slate-500">
                        Passez en revue chaque section avant la génération définitive du devis PDF.
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 bg-amber-50 text-amber-900 font-mono font-bold text-sm rounded-lg border border-amber-200">
                    {quoteNumber}
                  </span>
                </div>
              </div>

              {/* 1. Client Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                    Client
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs font-bold text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Modifier</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Nom : </span>
                    <strong className="text-slate-900 font-bold text-sm">{clientName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Téléphone : </span>
                    <strong className="text-slate-900 font-mono">{clientPhone}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Adresse : </span>
                    <span className="text-slate-800">{clientAddress || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Email : </span>
                    <span className="text-slate-800">{clientEmail || '—'}</span>
                  </div>
                </div>
              </div>

              {/* 2. Projet Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                    Projet
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-xs font-bold text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Modifier</span>
                  </button>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-500">Objet du devis : </span>
                    <strong className="text-slate-900 text-sm font-bold">{projectObject}</strong>
                  </div>
                  {projectDescription && (
                    <p className="text-slate-600 italic">{projectDescription}</p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-slate-600">
                    <div>Lieu : <strong className="text-slate-800">{executionLocation || 'Atelier'}</strong></div>
                    <div>Date : <strong className="text-slate-800">{formatDateNumeric(date)}</strong></div>
                    <div>Validité : <strong className="text-slate-800">{validityDays} jours</strong></div>
                  </div>
                </div>
              </div>

              {/* 3. Prestations Table */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                    Prestations ({items.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="text-xs font-bold text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Modifier</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-200/80 text-slate-700 font-bold">
                      <tr>
                        <th className="p-2">Désignation</th>
                        <th className="p-2 text-center">Qté</th>
                        <th className="p-2 text-center">Unité</th>
                        <th className="p-2 text-right">P.U.</th>
                        <th className="p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {items.map((it, idx) => (
                        <tr key={it.id} className="bg-white">
                          <td className="p-2 font-medium text-slate-900">
                            {it.designation}
                            {it.description && <div className="text-[10px] text-slate-500">{it.description}</div>}
                          </td>
                          <td className="p-2 text-center font-mono">{it.quantity}</td>
                          <td className="p-2 text-center text-slate-500">{it.unit}</td>
                          <td className="p-2 text-right font-mono">{formatFCFA(it.unit_price).replace(' FCFA', '')}</td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">{formatFCFA(it.total_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Totaux & Financier Card */}
              <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                    Synthèse Financière
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="text-xs font-bold text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Modifier</span>
                  </button>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span>Sous-total brut :</span>
                    <span className="font-mono font-semibold">{formatFCFA(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-rose-700">
                      <span>Remise commerciale :</span>
                      <span className="font-mono font-bold">- {formatFCFA(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-900 text-sm font-extrabold pt-2 border-t border-amber-300">
                    <span>TOTAL DU DEVIS :</span>
                    <span className="font-mono text-base text-amber-950">{formatFCFA(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-amber-900 font-bold">
                    <span>Acompte convenu :</span>
                    <span className="font-mono">{formatFCFA(depositRequested)}</span>
                  </div>
                  <div className="flex justify-between text-rose-700 text-sm font-extrabold pt-1 border-t border-amber-200">
                    <span>SOLDE RESTANT DÛ :</span>
                    <span className="font-mono text-base">{formatFCFA(balanceDue)}</span>
                  </div>
                </div>
              </div>

              {/* 5. Conditions Recap */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Conditions du devis
                </span>
                <p className="text-slate-600 whitespace-pre-line text-[11px] leading-relaxed">
                  {terms}
                </p>
              </div>

              {/* 6. Cachet Officiel & Signature Manuscrite */}
              <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px] uppercase tracking-wider">
                    <Stamp className="w-3.5 h-3.5 text-amber-800" />
                    <span>Authentification & Signature de l'Atelier</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    {includeStamp
                      ? "Le cachet officiel et la signature manuscrite de Mouaffo Roméo seront apposés sur le PDF."
                      : "Document sans cachet officiel (cadre de signature vierge pour signature manuelle)."}
                  </p>
                </div>
                {includeStamp && (
                  <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-amber-200 shrink-0 shadow-xs">
                    <img
                      src={company.stamp_url || BRAND_STAMP_SRC}
                      alt="Cachet officiel"
                      className="w-12 h-12 object-contain"
                    />
                    <div className="border-l border-slate-200 pl-3 flex flex-col justify-center">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Pour l'Atelier</span>
                      <img
                        src={company.signature_url || BRAND_SIGNATURE_SRC}
                        alt="Signature de Mouaffo Roméo"
                        className="h-7 w-auto object-contain max-w-[90px]"
                      />
                      <span className="text-[9px] font-bold text-slate-700">Mouaffo Roméo</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Final Submit Button */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="w-full sm:w-auto px-4 py-3.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Retour (Paiement)</span>
                </button>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-4 text-sm sm:text-base font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <CheckCircle className="w-5 h-5 text-slate-950" />
                  <span>GÉNÉRER LE DEVIS ({formatFCFA(totalAmount)})</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* ======================================================== */}
      {/* SUCCESS MODAL — DIRECT ACTIONS & WHATSAPP SHARING        */}
      {/* ======================================================== */}
      {showSuccessModal && generatedQuote && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-amber-900 to-slate-900 text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-lg text-white">
                  Devis généré avec succès !
                </h3>
                <p className="text-xs text-amber-200">
                  N° {generatedQuote.quote_number} · ROMÉO MEUBLE
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Summary Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Client :</span>
                  <strong className="text-slate-900 font-bold">{generatedQuote.client_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Objet :</span>
                  <strong className="text-slate-900">{generatedQuote.project_object}</strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-700 font-bold">Montant Total :</span>
                  <span className="font-mono font-extrabold text-amber-900 text-sm">
                    {formatFCFA(generatedQuote.total_amount)}
                  </span>
                </div>
                {generatedQuote.deposit_requested > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Acompte demandé :</span>
                    <span className="font-mono font-semibold">{formatFCFA(generatedQuote.deposit_requested)}</span>
                  </div>
                )}
                <div className="flex justify-between text-rose-700 font-bold">
                  <span>Reste à payer :</span>
                  <span className="font-mono">{formatFCFA(generatedQuote.balance_due)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                {/* 1. Share on WhatsApp */}
                <a
                  href={buildWhatsAppUrl(
                    generatedQuote.client_whatsapp || generatedQuote.client_phone,
                    buildQuoteWhatsAppMessage(generatedQuote, company)
                  )}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    StorageService.updateQuoteStatus(generatedQuote.id, 'envoye');
                  }}
                  className="w-full py-3.5 px-4 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Partager sur WhatsApp</span>
                </a>

                {/* 2. Download PDF */}
                <button
                  type="button"
                  onClick={() => onDownloadPDF(generatedQuote)}
                  className="w-full py-3.5 px-4 text-xs sm:text-sm font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileDown className="w-5 h-5" />
                  <span>Télécharger le PDF A4</span>
                </button>

                {/* 3. View Quote */}
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    onPreview(generatedQuote);
                  }}
                  className="w-full py-3 px-4 text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Voir le devis (Aperçu)</span>
                </button>
              </div>

              {/* Close & Return */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    onSave(generatedQuote);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline cursor-pointer"
                >
                  Terminer et retourner à la liste des devis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
