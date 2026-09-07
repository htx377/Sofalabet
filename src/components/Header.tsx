import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useBetSlip } from '../context/BetSlipContext.tsx';
import { Shield, Wallet as WalletIcon, User, LogOut, Plus, Ticket, LayoutDashboard } from 'lucide-react';

interface HeaderProps {
  currentView: 'sportsbook' | 'account' | 'admin';
  setCurrentView: (view: 'sportsbook' | 'account' | 'admin') => void;
  openAuthModal: (mode: 'login' | 'register') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  openAuthModal,
}) => {
  const { user, logout } = useAuth();
  const { items, setIsOpenMobile } = useBetSlip();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Tag */}
        <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer" onClick={() => setCurrentView('sportsbook')}>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-black text-lg sm:text-xl text-slate-950 shadow-lg shadow-emerald-500/20 flex-shrink-0">
            S
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">SOFALA<span className="text-emerald-400">BET</span></span>
              <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                MZN
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block truncate">Futebol Moçambicano Oficial</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            id="nav-sportsbook-btn"
            onClick={() => setCurrentView('sportsbook')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentView === 'sportsbook'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Jogos & Odds
          </button>

          {user && (
            <button
              id="nav-account-btn"
              onClick={() => setCurrentView('account')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentView === 'account'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Minha Conta & Apostas
            </button>
          )}
        </nav>

        {/* User Account / Auth Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Live Balance Pill */}
              <button
                id="user-balance-badge"
                onClick={() => setCurrentView('account')}
                title="Aceder à Carteira"
                className="flex items-center gap-1.5 sm:gap-2 bg-slate-800/90 hover:bg-slate-850 hover:border-emerald-500/40 border border-slate-700 rounded-xl px-2 sm:px-3 py-1.5 shadow-sm transition-all text-left"
              >
                <WalletIcon className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">Saldo:</span>
                <span className="font-bold text-xs sm:text-sm text-emerald-400 whitespace-nowrap">
                  {user.balance.toFixed(2)} <span className="text-[9px] sm:text-[10px] text-slate-400">MZN</span>
                </span>
              </button>

              {/* User Avatar Menu */}
              <div className="flex items-center gap-1 sm:gap-2">
                {user.role === 'ADMIN' && (
                  <button
                    id="header-admin-toggle-btn"
                    onClick={() => setCurrentView(currentView === 'admin' ? 'sportsbook' : 'admin')}
                    title={currentView === 'admin' ? 'Voltar ao Sportsbook' : 'Área Administrativa'}
                    className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      currentView === 'admin'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-300 border border-slate-700'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="hidden sm:inline text-[11px] font-bold text-amber-300">
                      {currentView === 'admin' ? 'Voltar' : 'Gestão'}
                    </span>
                  </button>
                )}

                <button
                  id="user-profile-btn"
                  onClick={() => setCurrentView('account')}
                  title="Aceder ao Perfil"
                  className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="max-w-[80px] sm:max-w-[100px] truncate hidden md:inline">{user.name.split(' ')[0]}</span>
                </button>

                <button
                  id="header-logout-btn"
                  onClick={logout}
                  title="Terminar Sessão"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                id="header-login-btn"
                onClick={() => openAuthModal('login')}
                className="px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Entrar
              </button>
              <button
                id="header-register-btn"
                onClick={() => openAuthModal('register')}
                className="px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20 transition-all"
              >
                Registo
              </button>
            </div>
          )}

          {/* Mobile betslip badge button */}
          <button
            id="mobile-betslip-header-btn"
            onClick={() => setIsOpenMobile(true)}
            className="lg:hidden relative p-2 text-slate-300 hover:text-emerald-400 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center min-w-[36px] min-h-[36px]"
            title="Boletim de Apostas"
          >
            <Ticket className="w-4 h-4 sm:w-5 sm:h-5" />
            {items.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-slate-950 rounded-full text-[10px] font-black flex items-center justify-center shadow">
                {items.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
