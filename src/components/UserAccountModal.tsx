import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Bet, WalletTransaction } from '../types.ts';
import { api } from '../api.ts';
import { DepositPanel } from './DepositPanel.tsx';
import { WithdrawalPanel } from './WithdrawalPanel.tsx';
import {
  Wallet,
  History,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  CreditCard,
  RefreshCw,
  Shield,
  Plus,
} from 'lucide-react';

interface UserAccountModalProps {
  onClose?: () => void;
  defaultTab?: 'wallet' | 'deposit' | 'withdraw' | 'bets' | 'transactions';
  onNavigateToAdmin?: () => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({ defaultTab = 'wallet', onNavigateToAdmin }) => {
  const { user, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState<'wallet' | 'deposit' | 'withdraw' | 'bets' | 'transactions'>(defaultTab);

  const [bets, setBets] = useState<Bet[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [betsRes, txRes] = await Promise.all([
        api.getUserBets(),
        api.getTransactions(),
      ]);
      setBets(betsRes.bets);
      setTransactions(txRes.transactions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, activeTab]);

  if (!user) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden text-white">
      {/* Account Profile Header */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800/80 to-slate-900 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-black text-2xl text-emerald-400">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white">{user.name}</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{user.email} • {user.phone}</p>
            </div>
          </div>

          {/* Balance card & Quick Actions */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Saldo Disponível</span>
              <span className="text-2xl font-black text-emerald-400 tracking-tight">
                {user.balance.toFixed(2)} <span className="text-sm font-bold text-slate-400">MZN</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="account-quick-deposit-btn"
                onClick={() => setActiveTab('deposit')}
                className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-98"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Depositar</span>
              </button>
              <button
                id="account-quick-withdraw-btn"
                onClick={() => setActiveTab('withdraw')}
                className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-black transition-all flex items-center gap-1.5 active:scale-98"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Levantar</span>
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className="px-2.5 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 hidden md:flex"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Extrato</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 px-3 sm:px-6 overflow-x-auto scrollbar-none">
        <button
          id="tab-wallet-overview"
          onClick={() => setActiveTab('wallet')}
          className={`py-3 sm:py-3.5 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
            activeTab === 'wallet'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Carteira & Resumo</span>
        </button>

        <button
          id="tab-deposit"
          onClick={() => setActiveTab('deposit')}
          className={`py-3 sm:py-3.5 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
            activeTab === 'deposit'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
          <span>Painel de Depósito</span>
        </button>

        <button
          id="tab-withdraw"
          onClick={() => setActiveTab('withdraw')}
          className={`py-3 sm:py-3.5 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
            activeTab === 'withdraw'
              ? 'border-amber-500 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-amber-400" />
          <span>Painel de Levantamento</span>
        </button>

        <button
          id="tab-bets"
          onClick={() => setActiveTab('bets')}
          className={`py-3 sm:py-3.5 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
            activeTab === 'bets'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Minhas Apostas ({bets.length})</span>
        </button>

        <button
          id="tab-transactions"
          onClick={() => setActiveTab('transactions')}
          className={`py-3 sm:py-3.5 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
            activeTab === 'transactions'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Extrato (Ledger)</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="p-3.5 sm:p-6">
        {/* ================= TAB: WALLET OVERVIEW ================= */}
        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Wallet Balance & Financial Summary */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-4">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-extrabold text-base text-white">Saldo da Conta Principal</h3>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Conta Ativa
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-medium text-slate-400 block">Saldo Real em Caixa</span>
                    <div className="text-3xl font-black text-emerald-400 tracking-tight mt-0.5">
                      {user.balance.toFixed(2)} <span className="text-base font-bold text-slate-400">MZN</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      id="account-wallet-deposit-btn"
                      onClick={() => setActiveTab('deposit')}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-98"
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      <span>Fazer Depósito</span>
                    </button>
                    <button
                      id="account-wallet-withdraw-btn"
                      onClick={() => setActiveTab('withdraw')}
                      className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 active:scale-98"
                    >
                      <ArrowUpRight className="w-4 h-4 text-amber-400" />
                      <span>Levantar Fundos</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('transactions')}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Extrato</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                  <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-3">
                    <span className="text-[11px] text-slate-400 block">Total de Apostas</span>
                    <span className="text-base font-bold text-white mt-1 block">{bets.length}</span>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-3">
                    <span className="text-[11px] text-slate-400 block">Apostas Abertas</span>
                    <span className="text-base font-bold text-amber-400 mt-1 block">
                      {bets.filter((b) => b.status === 'PENDING').length}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-3 col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-slate-400 block">Moeda do Sistema</span>
                    <span className="text-base font-bold text-emerald-400 mt-1 block">MZN (Metical)</span>
                  </div>
                </div>
              </div>

              {/* Recent Ledger Transactions Preview */}
              <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>Últimas Movimentações Financeiras</span>
                  </h4>
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="text-xs text-emerald-400 hover:underline font-semibold"
                  >
                    Ver Todas &rarr;
                  </button>
                </div>
                {transactions.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">Sem movimentações financeiras registadas.</p>
                ) : (
                  <div className="space-y-2">
                    {transactions.slice(0, 3).map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          {tx.type === 'DEPOSIT' || tx.type === 'WINNING_PAYOUT' ? (
                            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-rose-400" />
                          )}
                          <div>
                            <span className="font-bold text-white block">{tx.description}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(tx.createdAt).toLocaleDateString('pt-MZ')}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`font-black ${
                            tx.type === 'DEPOSIT' || tx.type === 'WINNING_PAYOUT'
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {tx.type === 'DEPOSIT' || tx.type === 'WINNING_PAYOUT' ? '+' : '-'}
                          {tx.amount.toFixed(2)} MZN
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Account Financial Parameters & Operations */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-5 space-y-3">
                <h3 className="font-extrabold text-sm text-white">Parâmetros Financeiros</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-700/50">
                    <span className="text-slate-400">Moeda Oficial:</span>
                    <span className="font-bold text-white">Metical Moçambicano (MZN)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-700/50">
                    <span className="text-slate-400">Tipo de Liquidação:</span>
                    <span className="font-bold text-emerald-400">Atómica & Auditável (Ledger)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-700/50">
                    <span className="text-slate-400">Aposta Mínima:</span>
                    <span className="font-bold text-white">10.00 MZN</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-700/50">
                    <span className="text-slate-400">Aposta Máxima:</span>
                    <span className="font-bold text-white">50,000.00 MZN</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Proteção Saldo Negativo:</span>
                    <span className="font-bold text-emerald-400">Garantida 100%</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/30 border border-slate-700/60 rounded-2xl p-4 text-xs text-slate-300">
                <p className="font-bold text-white mb-1.5 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Depósitos e Levantamentos:</span>
                </p>
                <p className="text-slate-400 leading-relaxed">
                  As creditações de saldo, prémios de vitórias e levantamentos de fundos em MZN são auditados e validados pelo Super Administrador da SofalaBet através do sistema oficial de tesouraria.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: DEPOSIT PANEL ================= */}
        {activeTab === 'deposit' && (
          <div className="max-w-2xl mx-auto bg-slate-850/60 border border-slate-800 rounded-2xl p-4 sm:p-7 shadow-xl">
            <DepositPanel
              onSuccess={() => {
                fetchData();
              }}
            />
          </div>
        )}

        {/* ================= TAB: WITHDRAWAL PANEL ================= */}
        {activeTab === 'withdraw' && (
          <div className="max-w-2xl mx-auto bg-slate-850/60 border border-slate-800 rounded-2xl p-4 sm:p-7 shadow-xl">
            <WithdrawalPanel
              onSuccess={() => {
                fetchData();
              }}
            />
          </div>
        )}

        {/* ================= TAB: BETS HISTORY ================= */}
        {activeTab === 'bets' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2">
              <p className="text-xs text-slate-400">Consulte o histórico de todas as apostas efetuadas nesta conta</p>
              <button
                onClick={fetchData}
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>

            {bets.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Clock className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-400">Ainda não realizou nenhuma aposta</p>
                <p className="text-xs text-slate-500">Navegue pelos jogos disponíveis e selecione as suas equipas favoritas.</p>
              </div>
            ) : (
              bets.map((bet) => (
                <div
                  key={bet.id}
                  className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4 space-y-3"
                >
                  {/* Bet Top bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 text-[11px]">#{bet.id.substring(0, 12)}</span>
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-700 text-slate-300">
                        {bet.type}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(bet.createdAt).toLocaleString('pt-PT')}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {bet.status === 'PENDING' && (
                        <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> PENDENTE
                        </span>
                      )}
                      {bet.status === 'WON' && (
                        <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> GANHA (+{bet.potentialReturn.toFixed(2)} MZN)
                        </span>
                      )}
                      {bet.status === 'LOST' && (
                        <span className="text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-md flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> PERDIDA
                        </span>
                      )}
                      {bet.status === 'VOID' && (
                        <span className="text-[11px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-md flex items-center gap-1">
                          <RotateCcw className="w-3.5 h-3.5" /> ANULADA (REEMBOLSADA)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bet items */}
                  <div className="space-y-1.5">
                    {bet.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-900/60 rounded-xl p-2.5 text-xs flex items-center justify-between border border-slate-800"
                      >
                        <div>
                          <p className="font-bold text-white">{item.matchTitle}</p>
                          <p className="text-[11px] text-slate-400">
                            {item.marketName} • Seleção: <strong className="text-emerald-400">{item.outcome}</strong>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-emerald-400">Odd {item.oddsAtBetTime.toFixed(2)}</span>
                          <span className={`block text-[10px] font-bold ${
                            item.status === 'WON' ? 'text-emerald-400' : item.status === 'LOST' ? 'text-rose-400' : 'text-slate-400'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bet Financial Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5 border-t border-slate-700/50 text-xs">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <div>
                        <span className="text-slate-400">Apostado: </span>
                        <strong className="text-white">{bet.stake.toFixed(2)} MZN</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Odd Total: </span>
                        <strong className="text-emerald-400">{bet.totalOdds.toFixed(2)}</strong>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 bg-slate-900/60 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                      <span className="text-slate-400">Possível Retorno: </span>
                      <strong className="text-emerald-400 font-black text-sm">{bet.potentialReturn.toFixed(2)} MZN</strong>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ================= TAB: FINANCIAL LEDGER TRANSACTIONS ================= */}
        {activeTab === 'transactions' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2">
              <p className="text-xs text-slate-400">
                Extrato imutável de todas as movimentações financeiras da carteira
              </p>
              <button
                onClick={fetchData}
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>

            {transactions.length === 0 ? (
              <p className="text-center text-slate-500 py-8 text-sm">Nenhuma transação registada.</p>
            ) : (
              <>
                {/* Mobile Cards View (< sm) */}
                <div className="block sm:hidden space-y-2.5">
                  {transactions.map((tx) => {
                    const isCredit = tx.type === 'DEPOSIT' || tx.type === 'WIN' || tx.type === 'REFUND' || (tx.type === 'ADJUSTMENT' && tx.amount > 0);
                    return (
                      <div key={tx.id} className="p-3 bg-slate-800/70 border border-slate-700/80 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCredit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {isCredit ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {tx.type}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(tx.createdAt).toLocaleDateString('pt-PT')} {new Date(tx.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="text-xs text-slate-200">
                          <p className="font-semibold">{tx.description}</p>
                          <p className="font-mono text-[10px] text-slate-500 mt-0.5">Ref: {tx.reference}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 text-xs">
                          <div className="text-[10px] text-slate-400">
                            <span>Saldo: </span>
                            <span className="font-medium text-slate-300">{tx.previousBalance.toFixed(2)}</span>
                            <span className="mx-1">→</span>
                            <span className="font-bold text-white">{tx.nextBalance.toFixed(2)} MZN</span>
                          </div>
                          <span className={`font-black text-sm ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isCredit ? '+' : '-'}{Math.abs(tx.amount).toFixed(2)} MZN
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tablet / Desktop Table View (>= sm) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3 whitespace-nowrap">Data / Hora</th>
                        <th className="py-2.5 px-3">Tipo</th>
                        <th className="py-2.5 px-3">Descrição & Ref</th>
                        <th className="py-2.5 px-3 text-right">Valor</th>
                        <th className="py-2.5 px-3 text-right whitespace-nowrap">Saldo Anterior</th>
                        <th className="py-2.5 px-3 text-right whitespace-nowrap">Saldo Posterior</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-medium">
                      {transactions.map((tx) => {
                        const isCredit = tx.type === 'DEPOSIT' || tx.type === 'WIN' || tx.type === 'REFUND' || (tx.type === 'ADJUSTMENT' && tx.amount > 0);
                        return (
                          <tr key={tx.id} className="hover:bg-slate-800/40">
                            <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                              {new Date(tx.createdAt).toLocaleString('pt-PT')}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                isCredit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                              }`}>
                                {isCredit ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                {tx.type}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-300">
                              <div>{tx.description}</div>
                              <div className="font-mono text-[10px] text-slate-500">Ref: {tx.reference}</div>
                            </td>
                            <td className={`py-3 px-3 text-right font-bold whitespace-nowrap ${
                              isCredit ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {isCredit ? '+' : '-'}{Math.abs(tx.amount).toFixed(2)} MZN
                            </td>
                            <td className="py-3 px-3 text-right text-slate-400 whitespace-nowrap">
                              {tx.previousBalance.toFixed(2)} MZN
                            </td>
                            <td className="py-3 px-3 text-right text-slate-200 font-bold whitespace-nowrap">
                              {tx.nextBalance.toFixed(2)} MZN
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
