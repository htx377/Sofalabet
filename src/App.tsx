import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { BetSlipProvider, useBetSlip } from './context/BetSlipContext.tsx';
import { RealtimeProvider } from './context/RealtimeContext.tsx';
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

  // Secret URL Hash trigger (#admin or ?admin=true) known only to the administrator
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 pb-24 md:pb-8">
        
        {/* View Routing */}
        {currentView === 'sportsbook' && (
          <div className="flex flex-col lg:flex-row gap-5 items-start">
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

        {/* Mobile bottom nav: Admin mode button */}
        {user?.role === 'ADMIN' && (
          <button
            id="mobile-nav-admin"
            onClick={() => setCurrentView(currentView === 'admin' ? 'sportsbook' : 'admin')}
            className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all ${
              currentView === 'admin' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <Shield className={`w-5 h-5 ${currentView === 'admin' ? 'text-amber-400' : 'text-slate-400'}`} />
            <span className="text-[10px] tracking-tight font-bold">{currentView === 'admin' ? 'Sair Admin' : 'Admin'}</span>
          </button>
        )}
      </nav>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 text-slate-500 py-6 sm:py-8 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-center md:text-left">
            <span className="font-extrabold text-white">SOFALABET</span>
            <span>•</span>
            <span className="text-slate-400">
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
      <RealtimeProvider>
        <BetSlipProvider>
          <MainLayout />
        </BetSlipProvider>
      </RealtimeProvider>
    </AuthProvider>
  );
}
