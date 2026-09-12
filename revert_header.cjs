const fs = require('fs');
const content = fs.readFileSync('src/components/Header.tsx', 'utf8');

const newHeaderBlock = `      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-15 sm:h-16 flex items-center justify-between gap-2">
          
          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-1 md:hidden shrink-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1 sm:p-2 -ml-1 sm:-ml-2 text-slate-300 hover:text-white rounded-xl active:bg-slate-800"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
          
          {/* Brand Logo - Secret 5-Click Trigger */}
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none active:opacity-90"
            onClick={handleLogoClick}
            title="ZONABET Moçambique"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-black text-base sm:text-xl text-slate-950 shadow-md shadow-emerald-500/20 shrink-0">
              Z
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="font-extrabold text-base sm:text-xl tracking-tight text-white">
                  ZONA<span className="text-emerald-400">BET</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 uppercase tracking-wider">
                  MZN
                </span>
                {isLiveConnected && (
                  <span
                    title="Conectado ao Supabase Realtime (Sincronização em direto)"
                    className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="hidden sm:inline">LIVE</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block truncate">
                Apostas em Futebol Moçambicano
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2 px-2 lg:px-6 flex-1 justify-center">
            <button
              onClick={() => handleNav('sportsbook')}
              className={\`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 \${
                currentView === 'sportsbook' ? 'bg-slate-800/80 text-emerald-400 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }\`}
            >
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Moçambola & Nacional</span>
            </button>
            <button
              onClick={() => {
                if (user) {
                  onOpenBets && onOpenBets();
                } else {
                  openAuthModal('login');
                }
              }}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all flex items-center gap-2"
            >
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Minhas Apostas</span>
            </button>
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => handleNav('admin')}
                className={\`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 \${
                  currentView === 'admin' ? 'bg-slate-800/80 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/50'
                }\`}
              >
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Admin</span>
              </button>
            )}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Desktop view: Live Balance & Quick Deposit */}
                <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
                  <div className="flex flex-col items-end pr-2 border-r border-slate-700/60">
                    <span className="text-[10px] text-slate-400 font-medium leading-none">Saldo Disponível</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="font-black text-sm text-emerald-400">
                        {user.balance.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-emerald-400/80">MZN</span>
                    </div>
                  </div>
                  {onOpenDeposit && (
                    <button
                      id="header-deposit-btn"
                      onClick={onOpenDeposit}
                      title="Painel de Depósito"
                      className="p-2 sm:px-3 sm:py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold transition-colors shadow-sm flex items-center gap-1"
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      <span className="hidden lg:inline text-sm">Depositar</span>
                    </button>
                  )}
                </div>

                {/* Mobile view: Minimalist balance badge */}
                <button
                  id="user-balance-badge"
                  onClick={() => handleNav('account')}
                  title="Aceder à Carteira"
                  className="sm:hidden flex items-center gap-1.5 bg-slate-800/80 border border-emerald-500/20 rounded-lg px-2.5 py-1.5"
                >
                  <WalletIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-bold text-xs text-emerald-400 whitespace-nowrap">
                    {user.balance.toFixed(0)} <span className="text-[9px] text-emerald-400/80 font-normal">MT</span>
                  </span>
                </button>

                {/* Profile quick button */}
                <button
                  id="user-profile-btn"
                  onClick={() => handleNav('account')}
                  title="Minha Conta"
                  className="flex items-center gap-2 pl-1 pr-3 py-1 sm:pl-1.5 sm:pr-4 sm:py-1.5 rounded-full border border-slate-700/80 bg-slate-800/40 hover:bg-slate-800 transition-colors"
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-slate-200 hidden md:inline truncate max-w-[100px]">
                    {user.name.split(' ')[0]}
                  </span>
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
          </div>
        </div>
      </header>`;

const regex = /<header className="sticky top-0 z-40 bg-\[#0A101A\] border-b border-slate-800 text-white">[\s\S]*?<\/header>/;
const newContent = content.replace(regex, newHeaderBlock);
fs.writeFileSync('src/components/Header.tsx', newContent);
