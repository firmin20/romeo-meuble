import React, { useState } from 'react';
import { X, Lock, Mail, Building2, User, KeyRound } from 'lucide-react';
import { UserProfile } from '../types';
import { StorageService, DEFAULT_USER, DEFAULT_COMPANY } from '../lib/storage';
import { useToast } from './Toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUserChanged: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
}) => {
  const { showToast } = useToast();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('error', 'Champs incomplets', 'Veuillez saisir votre email et mot de passe.');
      return;
    }

    // Default admin login or custom
    const user: UserProfile = {
      id: `usr_${Date.now()}`,
      email,
      full_name: email.split('@')[0],
      company_id: currentUser.company_id,
      role: 'admin',
    };
    StorageService.setCurrentUser(user);
    onUserChanged(user);
    showToast('success', 'Connexion réussie', `Bienvenue ${user.full_name}`);
    onClose();
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !companyName) {
      showToast('error', 'Champs requis', 'Tous les champs sont obligatoires.');
      return;
    }

    const newCompanyId = `comp_${Date.now()}`;
    // Create new tenant company settings
    StorageService.updateCompany({
      id: newCompanyId,
      name: companyName,
      manager_name: fullName,
      email,
    });

    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      email,
      full_name: fullName,
      company_id: newCompanyId,
      role: 'admin',
    };
    StorageService.setCurrentUser(newUser);
    onUserChanged(newUser);
    showToast('success', 'Compte créé avec succès !', `Bienvenue dans votre atelier ${companyName}`);
    onClose();
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('error', 'Email manquant');
      return;
    }
    showToast('info', 'Lien envoyé', `Un email de réinitialisation a été simulé vers ${email}.`);
    setMode('login');
  };

  const handleSwitchToRomeo = () => {
    StorageService.setCurrentUser(DEFAULT_USER);
    StorageService.updateCompany(DEFAULT_COMPANY);
    onUserChanged(DEFAULT_USER);
    showToast('success', 'Session ROMÉO MEUBLE active', 'Connecté en tant que Mouaffo Roméo (Nkoabang, Yaoundé).');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-base">
              {mode === 'login' && 'Connexion Menuisier'}
              {mode === 'register' && 'Créer un compte Atelier'}
              {mode === 'forgot' && 'Mot de passe oublié'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="mouaffo.romeo@romeo-meuble.cm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-800 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Mot de passe
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-amber-800 hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-800 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-sm font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-lg transition-colors cursor-pointer"
              >
                Se connecter
              </button>

              <div className="pt-2 text-center text-xs text-slate-500">
                Vous n'avez pas de compte ?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="font-bold text-amber-800 hover:underline"
                >
                  Créer un compte
                </button>
              </div>

              {/* Quick switch to official demo */}
              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSwitchToRomeo}
                  className="w-full py-2 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                >
                  ⚡ Reconnecter le profil officiel ROMÉO MEUBLE
                </button>
              </div>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom de votre atelier / entreprise
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Ex: ROMÉO MEUBLE"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-800 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Votre nom complet (Responsable)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Ex: Mouaffo Roméo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-800 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email professionnel
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="contact@monatelier.cm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-800 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-800 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-sm font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-lg transition-colors cursor-pointer"
              >
                Créer mon compte atelier
              </button>

              <div className="pt-2 text-center text-xs text-slate-500">
                Vous avez déjà un compte ?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-bold text-amber-800 hover:underline"
                >
                  Se connecter
                </button>
              </div>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-3.5">
              <p className="text-xs text-slate-600">
                Saisissez votre adresse email pour recevoir les instructions de réinitialisation.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="contact@romeo-meuble.cm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-800 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-sm font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-lg transition-colors cursor-pointer"
              >
                Envoyer le lien
              </button>

              <div className="text-center text-xs">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-bold text-amber-800 hover:underline"
                >
                  Retour à la connexion
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
