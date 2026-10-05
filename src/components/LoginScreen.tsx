import React, { useState } from 'react';
import { Lock, Mail, KeyRound, Eye, EyeOff, ShieldCheck, ArrowRight, UserCheck, Wrench, CheckCircle } from 'lucide-react';
import { CompanySettings, UserProfile } from '../types';
import { StorageService, DEFAULT_USER } from '../lib/storage';
import { BRAND_LOGO_SRC } from '../lib/brand';
import { useToast } from './Toast';

interface LoginScreenProps {
  company: CompanySettings;
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ company, onLoginSuccess }) => {
  const { showToast } = useToast();
  const [identifier, setIdentifier] = useState('mouaffo.romeo@romeo-meuble.cm');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!password) {
      setErrorMsg('Veuillez saisir votre mot de passe.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const result = StorageService.login(identifier, password);
      setIsLoading(false);

      if (result.success) {
        const currentUser = StorageService.getCurrentUser();
        showToast('success', 'Connexion réussie', `Bienvenue dans l'espace gestion de ${company.name}`);
        onLoginSuccess(currentUser);
      } else {
        setErrorMsg(result.message || 'Identifiants ou mot de passe incorrects.');
        showToast('error', 'Échec de connexion', result.message || 'Vérifiez votre mot de passe.');
      }
    }, 250);
  };

  const handleQuickLoginRomeo = () => {
    setIdentifier('mouaffo.romeo@romeo-meuble.cm');
    setPassword('romeo2026');
    setErrorMsg('');
    setIsLoading(true);
    setTimeout(() => {
      StorageService.login('mouaffo.romeo@romeo-meuble.cm', 'romeo2026');
      setIsLoading(false);
      showToast('success', 'Session Gérant activée', 'Connecté en tant que Mouaffo Roméo.');
      onLoginSuccess(DEFAULT_USER);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-950 to-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-800">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand Header */}
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex p-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl mb-1">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-amber-950 flex items-center justify-center p-1.5 shadow-inner">
              <img
                src={company.logo_url || BRAND_LOGO_SRC}
                alt={company.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </div>

          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
            {company.name}
          </h1>
          <p className="text-amber-300 font-semibold text-xs uppercase tracking-wider">
            {company.activity} · Nkoabang, Yaoundé
          </p>
          <p className="text-slate-300 text-xs max-w-xs mx-auto pt-1 leading-relaxed">
            Application réservée aux personnes autorisées pour la gestion des devis, factures et ateliers.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Lock className="w-5 h-5 text-amber-800" />
            <h2 className="font-display font-bold text-base text-slate-900">
              Connexion à l'Atelier
            </h2>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
              <span className="font-bold shrink-0">✕</span>
              <div>{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Identifiant ou Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="mouaffo.romeo@romeo-meuble.cm"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-800 focus:outline-none bg-slate-50/50"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Mot de passe atelier *
                </label>
                <span className="text-[11px] text-slate-400">
                  Défaut : <strong className="text-amber-800 font-mono">romeo2026</strong>
                </span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-800 focus:outline-none bg-slate-50/50 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Connexion en cours...' : 'Entrer dans l\'application'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Manager Button */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleQuickLoginRomeo}
              className="w-full py-2.5 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-emerald-700" />
              <span>Connexion Rapide Gérant (Mouaffo Roméo)</span>
            </button>
          </div>

          {/* Security footnote */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/60">
            <ShieldCheck className="w-4 h-4 text-amber-800 shrink-0" />
            <span>Accès protégé · Les données, tarifs et clients restent confidentiels.</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-400 space-y-1">
          <p>ROMÉO MEUBLE · Yaoundé Nkoabang</p>
          <p>WhatsApp : {company.phone_primary} / {company.phone_secondary}</p>
        </div>

      </div>
    </div>
  );
};
