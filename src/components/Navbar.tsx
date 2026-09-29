import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  ShoppingBag, 
  Users, 
  Settings, 
  Plus, 
  LogOut,
  Sparkles
} from 'lucide-react';
import { CompanySettings, UserProfile } from '../types';
import { BRAND_LOGO_SRC } from '../lib/brand';

interface NavbarProps {
  currentTab: 'dashboard' | 'quotes' | 'orders' | 'clients' | 'settings';
  onSelectTab: (tab: 'dashboard' | 'quotes' | 'orders' | 'clients' | 'settings') => void;
  onNewQuote: () => void;
  company: CompanySettings;
  user: UserProfile;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onNewQuote,
  company,
  user,
  onOpenAuth,
  onLogout,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'quotes', label: 'Devis', icon: FileText },
    { id: 'orders', label: 'Commandes', icon: ShoppingBag },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ] as const;

  return (
    <>
      {/* DESKTOP TOP BAR (Contract: Zone 1 Brand, Zone 2 Links, Zone 3 Action) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-amber-950 flex items-center justify-center shrink-0 border border-amber-900/20 shadow-sm">
                <img
                  src={company.logo_url || BRAND_LOGO_SRC}
                  alt={company.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback to text initials
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
                <span className="text-white font-bold text-sm tracking-wider">RM</span>
              </div>
              <div>
                <span className="font-display font-extrabold text-slate-900 text-lg sm:text-xl tracking-tight leading-none group-hover:text-amber-800 transition-colors">
                  {company.name}
                </span>
                <span className="hidden sm:block text-[11px] font-medium text-amber-700 tracking-wide">
                  {company.activity} · Nkoabang, Yaoundé
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: 4-6 clean text navigation links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-50 text-amber-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-700' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onNewQuote}
              className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-amber-800 rounded-lg hover:bg-amber-900 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm shadow-amber-900/20 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">Nouveau Devis</span>
              <span className="xs:hidden">Devis</span>
            </button>

            {/* User Profile / Multi-tenant switch */}
            <div className="flex items-center pl-2 border-l border-slate-200">
              <button
                onClick={onOpenAuth}
                title={`Connecté en tant que ${user.full_name}`}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white text-xs font-semibold flex items-center justify-center">
                  {user.full_name.charAt(0)}
                </div>
                <div className="hidden xl:block text-xs">
                  <div className="font-semibold text-slate-800 leading-tight truncate max-w-[110px]">
                    {user.full_name}
                  </div>
                  <div className="text-slate-400 text-[10px]">Menuisier Admin</div>
                </div>
              </button>

              <button
                onClick={onLogout}
                title="Déconnexion"
                className="hidden sm:flex p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR (Thumb-Zone Pattern, Height <= 64px, Hitbox >= 48px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg pb-safe">
        <nav className="grid grid-cols-5 items-center h-14">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex flex-col items-center justify-center h-full min-h-[44px] rounded-lg transition-colors ${
                  isActive ? 'text-amber-800 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-700" />
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-1 truncate max-w-[64px]">
                  {item.label === 'Tableau de bord' ? 'Accueil' : item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};
