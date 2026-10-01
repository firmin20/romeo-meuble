import React, { useState } from 'react';
import { 
  Building2, 
  Phone, 
  MapPin, 
  Image as ImageIcon, 
  FileText, 
  MessageCircle, 
  Database, 
  Save, 
  RotateCcw, 
  Upload, 
  Trash2,
  CheckCircle,
  DownloadCloud,
  FileCode,
  Stamp,
  Eye,
  ShieldCheck,
  PenTool,
  RefreshCw,
  X
} from 'lucide-react';
import { CompanySettings } from '../types';
import { StorageService, DEFAULT_COMPANY } from '../lib/storage';
import { BRAND_LOGO_SRC, BRAND_STAMP_SRC, BRAND_SIGNATURE_SRC } from '../lib/brand';
import { saveSupabaseConfig } from '../lib/supabase';
import { useToast } from './Toast';

interface SettingsViewProps {
  company: CompanySettings;
  onCompanyUpdated: (updated: CompanySettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  company,
  onCompanyUpdated,
}) => {
  const { showToast } = useToast();

  const [form, setForm] = useState<CompanySettings>({ ...company });
  const [logoPreview, setLogoPreview] = useState<string>(company.logo_url || BRAND_LOGO_SRC);
  const [stampPreview, setStampPreview] = useState<string>(company.stamp_url || BRAND_STAMP_SRC);
  const [showStampPreviewModal, setShowStampPreviewModal] = useState<boolean>(false);

  // Supabase connection keys state
  const [supabaseUrl, setSupabaseUrl] = useState(
    localStorage.getItem('romeo_supabase_url') || ''
  );
  const [supabaseKey, setSupabaseKey] = useState(
    localStorage.getItem('romeo_supabase_key') || ''
  );
  const [showSqlSchemaModal, setShowSqlSchemaModal] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('error', 'Fichier trop volumineux', 'Le logo ne doit pas dépasser 2 Mo.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setForm(prev => ({ ...prev, logo_url: result }));
        showToast('success', 'Logo chargé', 'Cliquez sur enregistrer pour valider.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview('');
    setForm(prev => ({ ...prev, logo_url: '' }));
  };

  const [signaturePreview, setSignaturePreview] = useState<string>(company.signature_url || BRAND_SIGNATURE_SRC);
  const [showSignaturePreviewModal, setShowSignaturePreviewModal] = useState<boolean>(false);
  const [showSignaturePadModal, setShowSignaturePadModal] = useState<boolean>(false);

  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('error', 'Fichier trop volumineux', 'Le cachet ne doit pas dépasser 2 Mo.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setStampPreview(result);
        setForm(prev => ({ ...prev, stamp_url: result }));
        showToast('success', 'Cachet importé avec succès !', 'Cliquez sur enregistrer pour l\'appliquer à tous les futurs devis.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveStamp = () => {
    if (confirm('Voulez-vous vraiment retirer le cachet officiel de ROMÉO MEUBLE ?')) {
      setStampPreview('');
      setForm(prev => ({ ...prev, stamp_url: '' }));
      showToast('info', 'Cachet supprimé', 'Les devis afficheront désormais un cadre de signature classique.');
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('error', 'Fichier trop volumineux', 'La signature ne doit pas dépasser 2 Mo.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setSignaturePreview(result);
        setForm(prev => ({ ...prev, signature_url: result }));
        showToast('success', 'Signature importée avec succès !', 'Cliquez sur enregistrer pour l\'appliquer.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetSignature = () => {
    setSignaturePreview(BRAND_SIGNATURE_SRC);
    setForm(prev => ({ ...prev, signature_url: BRAND_SIGNATURE_SRC }));
    showToast('info', 'Signature officielle rétablie', 'La signature de Mouaffo Roméo a été réinitialisée.');
  };

  const handleRemoveSignature = () => {
    if (confirm('Voulez-vous supprimer la signature ?')) {
      setSignaturePreview('');
      setForm(prev => ({ ...prev, signature_url: '' }));
      showToast('info', 'Signature supprimée', 'Les devis afficheront un espace réservé pour signature manuelle.');
    }
  };

  const handleSaveDrawnSignature = (dataUrl: string) => {
    setSignaturePreview(dataUrl);
    setForm(prev => ({ ...prev, signature_url: dataUrl }));
    showToast('success', 'Signature enregistrée !', 'Votre signature manuscrite a été enregistrée.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = StorageService.updateCompany(form);
    onCompanyUpdated(updated);
    showToast('success', 'Paramètres sauvegardés avec succès !', 'Les devis et PDF utiliseront désormais ces informations.');
  };

  const handleSaveSupabase = () => {
    saveSupabaseConfig(supabaseUrl, supabaseKey);
    showToast('success', 'Paramètres Supabase mis à jour !', 'Les identifiants de connexion ont été sauvegardés.');
  };

  const handleExportData = () => {
    const data = {
      company: StorageService.getCompany(),
      clients: StorageService.getClients(),
      quotes: StorageService.getQuotes(),
      orders: StorageService.getOrders(),
      payments: StorageService.getPayments(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ROMEO_MEUBLE_SAAS_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Export terminé', 'Sauvegarde complète JSON téléchargée.');
  };

  const handleResetDemo = () => {
    if (confirm('Voulez-vous réinitialiser toutes les données aux valeurs de démonstration ROMÉO MEUBLE ?')) {
      StorageService.resetToDemo();
      showToast('info', 'Données réinitialisées', 'La base a été rechargée avec les données témoins.');
      setTimeout(() => window.location.reload(), 600);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Paramètres de l'Entreprise
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Identité commerciale, logo officiel, coordonnées WhatsApp et conditions de vente
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Identité de l'entreprise & Logo */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-5 h-5 text-amber-800" />
            <h2 className="font-display font-bold text-base text-slate-900">
              Identité de l'Atelier & Logo
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-amber-950 flex items-center justify-center shrink-0 border border-amber-900/20 shadow-sm relative group">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt={form.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-black text-2xl tracking-wider">RM</span>
              )}
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <h3 className="font-bold text-sm text-slate-900">
                Logo de ROMÉO MEUBLE
              </h3>
              <p className="text-xs text-slate-500">
                Ce logo apparaîtra automatiquement sur l'en-tête de vos devis et bons de commande PDF.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <label className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Importer un logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>

                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nom commercial de l'entreprise *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full text-sm font-bold text-slate-900 rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-amber-800 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Activité / Métier *
              </label>
              <input
                type="text"
                value={form.activity}
                onChange={(e) => setForm({ ...form, activity: e.target.value })}
                className="w-full text-sm font-semibold text-slate-800 rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-amber-800 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Responsable / Maître Artisan *
              </label>
              <input
                type="text"
                value={form.manager_name}
                onChange={(e) => setForm({ ...form, manager_name: e.target.value })}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-amber-800 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Devise utilisée
              </label>
              <input
                type="text"
                value={form.currency}
                disabled
                className="w-full text-sm font-mono font-bold bg-slate-100 text-slate-600 rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* 2. Cachet Professionnel de l'Entreprise */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Stamp className="w-5 h-5 text-amber-800" />
              <div>
                <h2 className="font-display font-bold text-base text-slate-900">
                  Cachet de l'Entreprise
                </h2>
                <p className="text-xs text-slate-500">
                  Cachet officiel de l'atelier ROMÉO MEUBLE (Mouaffo Roméo — Nkoabang, Yaoundé)
                </p>
              </div>
            </div>

            {stampPreview && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Cachet actif</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Visual Box / Simulation */}
            <div className="md:col-span-5 flex flex-col items-center">
              <span className="text-[11px] font-semibold text-slate-500 mb-2">
                Rendu dans le devis PDF (Zone Signature & Cachet) :
              </span>

              <div className="w-full max-w-xs bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 text-center flex flex-col items-center justify-between min-h-[150px] shadow-inner relative overflow-hidden">
                {stampPreview ? (
                  <>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-900">
                      CACHET
                    </span>

                    <div className="my-2 p-1 bg-white/70 backdrop-blur-xs rounded-lg border border-slate-200/80 flex items-center justify-center max-w-[170px] max-h-[75px]">
                      <img
                        src={stampPreview}
                        alt="Cachet ROMÉO MEUBLE"
                        className="max-h-[68px] max-w-[160px] object-contain"
                      />
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900">{form.manager_name}</p>
                      <p className="text-[10px] font-semibold text-amber-800">{form.name}</p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-4 text-slate-400 space-y-2">
                    <Stamp className="w-8 h-8 opacity-40 text-slate-500" />
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-700">Signature / Cachet</p>
                      <p className="text-[10px] text-slate-400">
                        Espace réservé à la signature manuelle si aucun cachet n'est importé.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions & Explanations */}
            <div className="md:col-span-7 space-y-4">
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs space-y-1 text-slate-700">
                <p className="font-bold text-amber-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-800" />
                  <span>Authenticité et valeur probante de vos devis</span>
                </p>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  Importez le véritable cachet de votre atelier. Formats acceptés : <strong>PNG, JPG, JPEG</strong> (idéalement <strong>PNG avec fond transparent</strong> pour un résultat net sans rectangle blanc).
                </p>
                <p className="text-[11px] text-slate-500">
                  Taille maximale conseillée : 2 Mo. Le SaaS ajuste automatiquement les proportions sans déformation.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <label className="px-3.5 py-2 text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{stampPreview ? 'Remplacer le cachet' : 'Ajouter le cachet'}</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleStampUpload}
                    className="hidden"
                  />
                </label>

                {stampPreview && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowStampPreviewModal(true)}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Aperçu du cachet</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRemoveStamp}
                      className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer le cachet</span>
                    </button>
                  </>
                )}
              </div>

              {/* Auto stamp checkbox */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.show_stamp_on_quotes !== false}
                    onChange={(e) => setForm({ ...form, show_stamp_on_quotes: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-800 focus:ring-amber-800 border-slate-300"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    Apposer automatiquement ce cachet sur tous les futurs devis et PDF
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 2bis. Signature Manuscrite Officielle du Responsable */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-amber-800" />
              <div>
                <h2 className="font-display font-bold text-base text-slate-900">
                  Signature Manuscrite Officielle (Mouaffo Roméo)
                </h2>
                <p className="text-xs text-slate-500">
                  Signature apposée aux côtés du cachet sur les devis et bons de commande PDF
                </p>
              </div>
            </div>

            {signaturePreview && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Signature active</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Visual Preview */}
            <div className="md:col-span-5 flex flex-col items-center">
              <span className="text-[11px] font-semibold text-slate-500 mb-2">
                Aperçu dans l'encadré d'atelier :
              </span>

              <div className="w-full max-w-xs bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 text-center flex flex-col items-center justify-between min-h-[140px] shadow-inner relative overflow-hidden">
                {signaturePreview ? (
                  <>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                      Signature du Responsable
                    </span>

                    <div className="my-2 p-2 bg-white/80 backdrop-blur-xs rounded-lg border border-slate-200/80 flex items-center justify-center max-w-[200px] max-h-[70px]">
                      <img
                        src={signaturePreview}
                        alt="Signature Mouaffo Roméo"
                        className="max-h-[55px] max-w-[180px] object-contain"
                      />
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900">{form.manager_name}</p>
                      <p className="text-[10px] font-semibold text-amber-800">{form.name}</p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-4 text-slate-400 space-y-2">
                    <PenTool className="w-8 h-8 opacity-40 text-slate-500" />
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-700">Aucune signature</p>
                      <p className="text-[10px] text-slate-400">
                        Espace réservé à la signature manuelle sur papier.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions & Explanations */}
            <div className="md:col-span-7 space-y-4">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs space-y-1 text-slate-700">
                <p className="font-bold text-blue-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-800" />
                  <span>Validation conjointe Cachet + Signature</span>
                </p>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  La signature manuscrite de Mouaffo Roméo s'intègre harmonieusement à côté du cachet officiel pour garantir une authenticité contractuelle irréprochable auprès de vos clients et partenaires.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <label className="px-3.5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{signaturePreview ? 'Changer l\'image' : 'Importer une image'}</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleSignatureUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setShowSignaturePadModal(true)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <PenTool className="w-3.5 h-3.5 text-amber-800" />
                  <span>Dessiner à l'écran</span>
                </button>

                {signaturePreview && (
                  <button
                    type="button"
                    onClick={() => setShowSignaturePreviewModal(true)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Agrandir</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleResetSignature}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Rétablir la signature officielle par défaut"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Rétablir signature officielle</span>
                </button>

                {signaturePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveSignature}
                    className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Retirer</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Coordonnées & Localisation à Yaoundé */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Phone className="w-5 h-5 text-amber-800" />
            <h2 className="font-display font-bold text-base text-slate-900">
              Coordonnées & Emplacement de l'Atelier
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Téléphone principal (WhatsApp) *
              </label>
              <input
                type="text"
                value={form.phone_primary}
                onChange={(e) => setForm({ ...form, phone_primary: e.target.value })}
                className="w-full text-sm font-mono rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-amber-800 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deuxième téléphone (WhatsApp) *
              </label>
              <input
                type="text"
                value={form.phone_secondary}
                onChange={(e) => setForm({ ...form, phone_secondary: e.target.value })}
                className="w-full text-sm font-mono rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-amber-800 focus:outline-none"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Adresse précise de l'atelier à Yaoundé *
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-amber-800 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email de contact
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-amber-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ville & Pays
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-amber-800 focus:outline-none"
                />
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-amber-800 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Conditions & Messages WhatsApp par défaut */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MessageCircle className="w-5 h-5 text-amber-800" />
            <h2 className="font-display font-bold text-base text-slate-900">
              Modèles de Textes & Conditions par Défaut
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Conditions générales figurant sur les devis PDF
            </label>
            <textarea
              rows={3}
              value={form.default_terms}
              onChange={(e) => setForm({ ...form, default_terms: e.target.value })}
              className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-3 focus:ring-2 focus:ring-amber-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Modèle du message de partage WhatsApp
            </label>
            <textarea
              rows={4}
              value={form.default_whatsapp_message}
              onChange={(e) => setForm({ ...form, default_whatsapp_message: e.target.value })}
              className="w-full text-xs sm:text-sm font-mono rounded-lg border border-slate-300 p-3 focus:ring-2 focus:ring-amber-800 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Variables disponibles : <code>{'{client_name}'}</code>, <code>{'{quote_number}'}</code>, <code>{'{total_amount}'}</code>, <code>{'{deposit_amount}'}</code>
            </p>
          </div>
        </div>

        {/* Save button for settings */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="px-6 py-3 text-sm font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer tous les paramètres</span>
          </button>
        </div>
      </form>

      {/* 4. Base de Données Supabase & Sauvegardes */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-800" />
            <h2 className="font-display font-bold text-base text-slate-900">
              Connexion Supabase (PostgreSQL Cloud)
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setShowSqlSchemaModal(true)}
            className="text-xs font-semibold text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Voir le script SQL Supabase</span>
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Pour héberger la base de données en production sur Supabase (avec Row Level Security pour chaque entreprise), renseignez ci-dessous vos clés de projet Supabase ou définissez-les dans vos variables d'environnement Vercel :
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              SUPABASE_URL (ou VITE_SUPABASE_URL)
            </label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="w-full text-xs font-mono rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-amber-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              SUPABASE_ANON_KEY (ou VITE_SUPABASE_ANON_KEY)
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              className="w-full text-xs font-mono rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-amber-800 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handleSaveSupabase}
            className="px-4 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
          >
            Sauvegarder la connexion Supabase
          </button>

          <span className="text-[11px] text-slate-400">
            Stockage actuel : Local DB haute performance + Synchronisation
          </span>
        </div>
      </div>

      {/* 5. Données & Sauvegardes */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900">
            Sauvegarde & Restauration des données
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Exportez tous vos devis, commandes et clients au format JSON.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportData}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>Exporter JSON</span>
          </button>

          <button
            type="button"
            onClick={handleResetDemo}
            className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser démo</span>
          </button>
        </div>
      </div>

      {/* SQL Schema Preview Modal */}
      {showSqlSchemaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm">Script SQL Supabase (supabase-schema.sql)</span>
              <button
                onClick={() => setShowSqlSchemaModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed">
              <pre>
{`-- Exécutez ce script dans l'Éditeur SQL de votre tableau de bord Supabase :
-- Création des tables companies, users, clients, quotes, quote_items, orders, payments
-- Politiques de sécurité multi-tenant Row Level Security (RLS) incluses.`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Stamp High-Res Preview Modal */}
      {showStampPreviewModal && stampPreview && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stamp className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-sm">Aperçu du Cachet Officiel</span>
              </div>
              <button
                onClick={() => setShowStampPreviewModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex flex-col items-center justify-center space-y-4">
              <div 
                className="p-8 rounded-xl border border-slate-200 flex items-center justify-center max-w-full"
                style={{
                  backgroundImage: `linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)`,
                  backgroundSize: `16px 16px`,
                  backgroundPosition: `0 0, 0 8px, 8px -8px, -8px 0px`
                }}
              >
                <img
                  src={stampPreview}
                  alt="Aperçu Cachet"
                  className="max-h-60 max-w-full object-contain filter drop-shadow-sm"
                />
              </div>

              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-slate-800">
                  Cachet officiel : {form.name} — {form.manager_name}
                </p>
                <p className="text-[11px] text-slate-500">
                  Le motif en damier indique la transparence PNG. Les zones transparentes s'adapteront directement au fond blanc du papier lors de l'impression.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowStampPreviewModal(false)}
                className="w-full py-2.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Fermer l'aperçu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature High-Res Preview Modal */}
      {showSignaturePreviewModal && signaturePreview && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-sm">Aperçu de la Signature Officielle</span>
              </div>
              <button
                onClick={() => setShowSignaturePreviewModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex flex-col items-center justify-center space-y-4">
              <div 
                className="p-8 rounded-xl border border-slate-200 flex items-center justify-center max-w-full"
                style={{
                  backgroundImage: `linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)`,
                  backgroundSize: `16px 16px`,
                  backgroundPosition: `0 0, 0 8px, 8px -8px, -8px 0px`
                }}
              >
                <img
                  src={signaturePreview}
                  alt="Aperçu Signature"
                  className="max-h-48 max-w-full object-contain filter drop-shadow-sm"
                />
              </div>

              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-slate-800">
                  Signature officielle : {form.manager_name} (Responsable {form.name})
                </p>
                <p className="text-[11px] text-slate-500">
                  Transparence PNG préservée. S'intègre sans fond blanc sur les devis et bons de commande PDF.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSignaturePreviewModal(false)}
                className="w-full py-2.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Fermer l'aperçu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Draw Pad Modal */}
      {showSignaturePadModal && (
        <SignatureDrawModal
          onClose={() => setShowSignaturePadModal(false)}
          onSave={handleSaveDrawnSignature}
        />
      )}
    </div>
  );
};

interface SignatureDrawModalProps {
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}

const SignatureDrawModal: React.FC<SignatureDrawModalProps> = ({ onClose, onSave }) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [hasDrawn, setHasDrawn] = React.useState(false);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#162e5b';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ('touches' in e) {
      e.stopPropagation();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    setHasDrawn(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if ('touches' in e) {
      e.stopPropagation();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-sm">Dessiner la signature du responsable</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500">
            Signez directement dans la boîte ci-dessous avec votre doigt, stylet ou souris. Le fond sera transparent sur vos devis.
          </p>

          <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 relative overflow-hidden touch-none select-none">
            <canvas
              ref={canvasRef}
              width={600}
              height={260}
              className="w-full h-48 cursor-crosshair block"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <div className="absolute bottom-2 left-4 text-[10px] text-slate-400 pointer-events-none">
              Zone de signature — Mouaffo Roméo
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Effacer
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={!hasDrawn}
                onClick={handleConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Enregistrer la signature
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
