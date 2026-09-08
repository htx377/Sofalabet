import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { BetSlipProvider, useBetSlip } from './context/BetSlipContext.tsx';
import { Header } from './components/Header.tsx';
import { MatchList } from './components/MatchList.tsx';
import { BetSlip } from './components/BetSlip.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { UserAccountModal } from './components/UserAccountModal.tsx';
import { WalletActionModal } from './components/WalletActionModal.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { SecretAdminModal } from './components/SecretAdminModal.tsx';
import { Shield, Flame, Wallet as WalletIcon, Trophy, Ticket, User as UserIcon, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react';

function MainLayout() {
  const { user } = useAuth();
  const { items, setIsOpenMobile } = useBetSlip();
  const [currentView, setCurrentView] = useState<'sportsbook' | 'account' | 'admin'>('sportsbook');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [walletModalTab, setWalletModalTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [secretAdminModalOpen, setSecretAdminModalOpen] = useState(false);
  const [adminToast, setAdminToast] = useState<string | null>(null);

  const footerClicksRef = useRef(0);
  const lastFooterClickTimeRef = useRef(0);

  // If user is not admin, admin view is strictly hidden
  useEffect(() => {
    if (currentView === 'admin' && user?.role !== 'ADMIN') {
      setCurrentView('sportsbook');
    }
  }, [currentView, user]);

  const triggerSecretAdmin = () => {
    if (user?.role === 'ADMIN') {
      setCurrentView('admin');
      setAdminToast('Modo Super Administrador ativado.');
      setTimeout(() => setAdminToast(null), 3500);
    } else {
      setSecretAdminModalOpen(true);
    }
  };

  // Secret Trick 1 & 2: Keyboard shortcuts (Ctrl+Shift+A or typing sequence "admin")
  useEffect(() => {
    let keyBuffer = '';
    let bufferTimer: any = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events from inputs or textareas
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Shortcut: Ctrl + Shift + A or Cmd + Shift + A
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        triggerSecretAdmin();
        return;
      }

      // Secret sequence typing: "admin"
      const key = e.key.toLowerCase();
      if (/^[a-z0-9]$/.test(key)) {
        keyBuffer += key;
        clearTimeout(bufferTimer);
        bufferTimer = setTimeout(() => {
          keyBuffer = '';
        }, 2200);

        if (keyBuffer.endsWith('admin')) {
          keyBuffer = '';
          triggerSecretAdmin();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(bufferTimer);
    };
  }, [user]);

  // Secret Trick 3: URL Hash or Query (#admin, #superadmin, ?admin=true)
  useEffect(() => {
    const checkUrlTriggers = () => {
      const hash = window.location.hash.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      if (
        hash === '#admin' ||
        hash === '#superadmin' ||
        params.get('admin') === 'true' ||
        params.get('mode') === 'admin'
      ) {
        triggerSecretAdmin();
      }
    };

    checkUrlTriggers();
    window.addEventListener('hashchange', checkUrlTriggers);
    return () => window.removeEventListener('hashchange', checkUrlTriggers);
  }, [user]);

  // Secret Trick 4: 5 Clicks on Footer text
  const handleFooterSecretClick = () => {
    const now = Date.now();
    if (now - lastFooterClickTimeRef.current > 2200) {
      footerClicksRef.current = 1;
    } else {
      footerClicksRef.current += 1;
    }
    lastFooterClickTimeRef.current = now;

    if (footerClicksRef.current >= 5) {
      footerClicksRef.current = 0;
      triggerSecretAdmin();
    }
  };

  const openAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const openWalletAction = (tab: 'deposit' | 'withdraw') => {
    if (!user) {
      openAuth('login');
      return;
    }
    setWalletModalTab(tab);
    setWalletModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Toast Notification when Super Admin is triggered */}
      {adminToast && (
        <div className="fixed top-20 right-4 z-50 px-4 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black text-xs shadow-2xl shadow-amber-500/30 flex items-center gap-2 animate-in slide-in-from-top-2">
          <Shield className="w-4 h-4" />
          <span>{adminToast}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        openAuthModal={openAuth}
        onOpenDeposit={() => openWalletAction('deposit')}
        onOpenWithdraw={() => openWalletAction('withdraw')}
        onTriggerSecretAdmin={triggerSecretAdmin}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8">
        
        {/* Banner: Hero */}
        <div className="mb-4 sm:mb-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 p-3.5 sm:p-5 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wide flex items-center gap-1.5">
                  <span>🇲🇿</span> FUTEBOL MOÇAMBICANO • SOFALABET
                </span>
                <span className="text-[11px] sm:text-xs text-slate-400">• Moçambola, Provinciais & Distritais</span>
              </div>
              <h2 className="text-base sm:text-xl font-black text-white tracking-tight">
                Plataforma Oficial de Apostas Desportivas SofalaBet
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-300 max-w-2xl leading-relaxed">
                Odds 1X2 atualizadas em tempo real, depósitos e levantamentos instantâneos via M-Pesa, e-Mola e mKesh em Meticais (MZN).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              {!user ? (
                <button
                  id="hero-quick-start-btn"
                  onClick={() => openAuth('register')}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                >
                  <Flame className="w-4 h-4" />
                  <span>CRIAR CONTA</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    id="hero-quick-deposit-btn"
                    onClick={() => openWalletAction('deposit')}
                    className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-1 shadow-md shadow-emerald-500/20 active:scale-95"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Depositar</span>
                  </button>
                  <button
                    id="hero-quick-withdraw-btn"
                    onClick={() => openWalletAction('withdraw')}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/30 font-bold rounded-xl text-xs transition-all flex items-center gap-1 active:scale-95"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                    <span>Levantar</span>
                  </button>
                  <button
                    id="hero-account-btn"
                    onClick={() => setCurrentView('account')}
                    className="px-3 py-2 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
                  >
                    <WalletIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Minha Carteira</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View Routing */}
        {currentView === 'sportsbook' && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left/Center Column: Match List */}
            <div className="flex-1 w-full min-w-0">
              <MatchList />
            </div>

            {/* Right Column: Bet Slip (Desktop & Mobile) */}
            <BetSlip onOpenAuth={() => openAuth('login')} />
          </div>
        )}

        {currentView === 'account' && (
          <UserAccountModal onNavigateToAdmin={() => setCurrentView('admin')} />
        )}

        {currentView === 'admin' && user?.role === 'ADMIN' && (
          <AdminPanel onBackToSportsbook={() => setCurrentView('sportsbook')} />
        )}

      </main>

      {/* Mobile Bottom App Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-3 py-2 flex items-center justify-around shadow-2xl">
        <button
          id="mobile-nav-sportsbook"
          onClick={() => setCurrentView('sportsbook')}
          className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all ${
            currentView === 'sportsbook' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Jogos</span>
        </button>

        <button
          id="mobile-nav-betslip"
          onClick={() => setIsOpenMobile(true)}
          className="relative flex flex-col items-center gap-1 p-1 rounded-xl text-slate-400 hover:text-emerald-400 transition-all"
        >
          <div className="relative">
            <Ticket className="w-5 h-5" />
            {items.length > 0 && (
              <span className="absolute -top-1 -right-2.5 w-4 h-4 bg-emerald-500 text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center animate-pulse">
                {items.length}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight font-medium">Boletim</span>
        </button>

        <button
          id="mobile-nav-deposit"
          onClick={() => openWalletAction('deposit')}
          className="flex flex-col items-center gap-1 p-1 rounded-xl text-emerald-400 hover:text-emerald-350 transition-all font-bold"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
          </div>
          <span className="text-[10px] tracking-tight">Depositar</span>
        </button>

        <button
          id="mobile-nav-account"
          onClick={() => {
            if (user) {
              setCurrentView('account');
            } else {
              openAuth('login');
            }
          }}
          className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all ${
            currentView === 'account' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Conta</span>
        </button>

        {/* Mobile bottom nav: Only shows exit if admin mode is currently active */}
        {currentView === 'admin' && (
          <button
            id="mobile-nav-admin"
            onClick={() => setCurrentView('sportsbook')}
            className="flex flex-col items-center gap-1 p-1 rounded-xl text-amber-400 font-bold transition-all"
          >
            <Shield className="w-5 h-5 text-amber-400" />
            <span className="text-[10px] tracking-tight font-bold text-amber-300">Sair Admin</span>
          </button>
        )}
      </nav>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 text-slate-500 py-6 sm:py-8 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-center md:text-left">
            <span className="font-extrabold text-white">SOFALABET</span>
            <span>•</span>
            {/* Secret Trick 4: 5 rapid clicks triggers Super Admin */}
            <span
              onClick={handleFooterSecretClick}
              className="cursor-default select-none hover:text-slate-400 transition-colors"
              title="SofalaBet"
            >
              Moçambique • Operações em Meticais (MZN)
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              Ambiente Seguro
            </span>
            <span>•</span>
            <span>Apenas Futebol Oficial</span>
            <span>•</span>
            <span>Jogo Responsável (+18)</span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      <WalletActionModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        initialTab={walletModalTab}
      />

      {/* Secret Super Admin Gate */}
      <SecretAdminModal
        isOpen={secretAdminModalOpen}
        onClose={() => setSecretAdminModalOpen(false)}
        onSuccess={() => {
          setCurrentView('admin');
          setAdminToast('Modo Super Administrador ativado.');
          setTimeout(() => setAdminToast(null), 3500);
        }}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BetSlipProvider>
        <MainLayout />
      </BetSlipProvider>
    </AuthProvider>
  );
}
