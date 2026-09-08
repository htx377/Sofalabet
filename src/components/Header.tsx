import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useBetSlip } from '../context/BetSlipContext.tsx';
import {
  Shield,
  Wallet as WalletIcon,
  User,
  LogOut,
  Ticket,
  ArrowDownLeft,
  ArrowUpRight,
  Menu,
  X,
  Trophy,
  History,
  Database,
  Phone,
} from 'lucide-react';

interface HeaderProps {
  currentView: 'sportsbook' | 'account' | 'admin';
  setCurrentView: (view: 'sportsbook' | 'account' | 'admin') => void;
  openAuthModal: (mode: 'login' | 'register') => void;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
  onTriggerSecretAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  openAuthModal,
  onOpenDeposit,
  onOpenWithdraw,
  onTriggerSecretAdmin,
}) => {
  const { user, logout } = useAuth();
  const { items, setIsOpenMobile } = useBetSlip();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logoClicksRef = React.useRef(0);
  const lastLogoClickTimeRef = React.useRef(0);

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastLogoClickTimeRef.current > 2200) {
      logoClicksRef.current = 1;
    } else {
      logoClicksRef.current += 1;
    }
    lastLogoClickTimeRef.current = now;

    // Secret trick: 5 rapid clicks triggers Super Admin
    if (logoClicksRef.current >= 5) {
      logoClicksRef.current = 0;
      if (onTriggerSecretAdmin) {
        onTriggerSecretAdmin();
      }
      return;
    }

    handleNav('sportsbook');
  };

  const handleNav = (view: 'sportsbook' | 'account' | 'admin') => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-15 sm:h-16 flex items-center justify-between gap-2">
          
          {/* Brand Logo - Secret 5-Click Trigger */}
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none active:opacity-90"
            onClick={handleLogoClick}
            title="SofalaBet Moçambique"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-black text-base sm:text-xl text-slate-950 shadow-md shadow-emerald-500/20 shrink-0">
              S
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="font-extrabold text-base sm:text-xl tracking-tight text-white">
                  SOFALA<span className="text-emerald-400">BET</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 uppercase tracking-wider">
                  MZN
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block truncate">
                Apostas em Futebol Moçambicano
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              id="nav-sportsbook-btn"
              onClick={() => handleNav('sportsbook')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentView === 'sportsbook'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Jogos & Odds
            </button>

            {user && (
              <button
                id="nav-account-btn"
                onClick={() => handleNav('account')}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  currentView === 'account'
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Minha Conta & Apostas
              </button>
            )}

            {/* Concealed: Only shows exit button if admin mode is currently active */}
            {currentView === 'admin' && (
              <button
                id="nav-admin-exit-btn"
                onClick={() => handleNav('sportsbook')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Voltar às Apostas</span>
              </button>
            )}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {user ? (
              <>
                {/* Live Balance & Quick Deposit */}
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <button
                    id="user-balance-badge"
                    onClick={() => handleNav('account')}
                    title="Aceder à Carteira"
                    className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-800 hover:border-emerald-500/40 border border-slate-700 rounded-xl px-2 sm:px-3 py-1.5 transition-all text-left"
                  >
                    <WalletIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-black text-xs sm:text-sm text-emerald-400 whitespace-nowrap">
                      {user.balance.toFixed(2)}
                      <span className="text-[9px] sm:text-[10px] text-slate-400 ml-1 font-normal">MZN</span>
                    </span>
                  </button>

                  {onOpenDeposit && (
                    <button
                      id="header-deposit-btn"
                      onClick={onOpenDeposit}
                      title="Painel de Depósito"
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1 shadow-sm shadow-emerald-500/20 active:scale-95"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span className="hidden xs:inline sm:inline">Depositar</span>
                    </button>
                  )}

                  {onOpenWithdraw && (
                    <button
                      id="header-withdraw-btn"
                      onClick={onOpenWithdraw}
                      title="Painel de Levantamento"
                      className="hidden md:flex px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all items-center gap-1 active:scale-95"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                      <span>Levantar</span>
                    </button>
                  )}
                </div>

                {/* Profile quick button (desktop) */}
                <button
                  id="user-profile-btn"
                  onClick={() => handleNav('account')}
                  title="Minha Conta"
                  className="hidden sm:flex items-center gap-1.5 p-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-bold text-slate-200 transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                    <User className="w-3 h-3" />
                  </div>
                  <span className="max-w-[70px] md:max-w-[90px] truncate">{user.name.split(' ')[0]}</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  id="header-login-btn"
                  onClick={() => openAuthModal('login')}
                  className="px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Entrar
                </button>
                <button
                  id="header-register-btn"
                  onClick={() => openAuthModal('register')}
                  className="px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-md shadow-emerald-500/20 transition-all"
                >
                  Registo
                </button>
              </div>
            )}

            {/* Mobile BetSlip Toggle Button */}
            <button
              id="mobile-betslip-header-btn"
              onClick={() => setIsOpenMobile(true)}
              className="lg:hidden relative p-1.5 sm:p-2 text-slate-300 hover:text-emerald-400 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center"
              title="Abrir Boletim"
            >
              <Ticket className="w-4 h-4 sm:w-5 sm:h-5" />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-emerald-500 text-slate-950 rounded-full text-[9px] font-black flex items-center justify-center shadow">
                  {items.length}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Menu Button */}
            <button
              id="mobile-hamburger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 sm:p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 rounded-xl border border-slate-700 transition-colors"
              aria-label="Abrir Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer Navigation */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm md:hidden animate-in fade-in"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="fixed top-0 right-0 bottom-0 w-4/5 max-w-sm bg-slate-900 border-l border-slate-800 shadow-2xl p-5 flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-base">
                    S
                  </div>
                  <div>
                    <span className="font-black text-white text-base tracking-tight">SOFALA<span className="text-emerald-400">BET</span></span>
                    <span className="text-[10px] text-slate-400 block">Moçambique Oficial</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile Card if logged in */}
              {user ? (
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-emerald-400 text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-white block truncate">{user.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono block">{user.phone}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {user.role}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Saldo Disponível:</span>
                    <span className="text-base font-black text-emerald-400">
                      {user.balance.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">MZN</span>
                    </span>
                  </div>

                  {/* Drawer Quick Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenDeposit && onOpenDeposit();
                      }}
                      className="py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1 shadow-sm"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Depositar</span>
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenWithdraw && onOpenWithdraw();
                      }}
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/30 font-bold rounded-xl text-xs flex items-center justify-center gap-1"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                      <span>Levantar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-800/80 border border-emerald-500/20 space-y-3">
                  <p className="text-xs text-slate-300">
                    Junte-se à SofalaBet para apostar nos jogos do Moçambola e Provinciais.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openAuthModal('login');
                      }}
                      className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 border border-slate-700 text-center"
                    >
                      Entrar
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openAuthModal('register');
                      }}
                      className="flex-1 py-2 rounded-xl text-xs font-black text-slate-950 bg-emerald-500 text-center shadow-md shadow-emerald-500/20"
                    >
                      Criar Conta
                    </button>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <div className="space-y-1">
                <button
                  onClick={() => handleNav('sportsbook')}
                  className={`w-full p-3 rounded-xl text-left text-xs font-bold flex items-center gap-3 transition-colors ${
                    currentView === 'sportsbook'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Trophy className="w-4 h-4 text-emerald-400" />
                  <span>Jogos & Mercados 1X2</span>
                </button>

                {user && (
                  <button
                    onClick={() => handleNav('account')}
                    className={`w-full p-3 rounded-xl text-left text-xs font-bold flex items-center gap-3 transition-colors ${
                      currentView === 'account'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <History className="w-4 h-4 text-emerald-400" />
                    <span>Minha Conta & Histórico</span>
                  </button>
                )}

                {/* Concealed: only show exit if admin is currently active */}
                {currentView === 'admin' && (
                  <button
                    onClick={() => handleNav('sportsbook')}
                    className="w-full p-3 rounded-xl text-left text-xs font-bold flex items-center gap-3 bg-amber-500/15 text-amber-300 border border-amber-500/25 transition-colors"
                  >
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>Voltar às Apostas Desportivas</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsOpenMobile(true);
                  }}
                  className="w-full p-3 rounded-xl text-left text-xs font-bold flex items-center justify-between text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Ticket className="w-4 h-4 text-emerald-400" />
                    <span>Boletim de Apostas</span>
                  </div>
                  {items.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px]">
                      {items.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              {user && (
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Terminar Sessão</span>
                </button>
              )}
              <div className="text-[10px] text-slate-500 text-center">
                SofalaBet • Moçambique • M-Pesa & e-Mola
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
