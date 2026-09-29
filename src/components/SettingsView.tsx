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
  FileCode
} from 'lucide-react';
import { CompanySettings } from '../types';
import { StorageService, DEFAULT_COMPANY } from '../lib/storage';
import { BRAND_LOGO_SRC } from '../lib/brand';
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

        {/* 2. Coordonnées & Localisation à Yaoundé */}
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
    </div>
  );
};
