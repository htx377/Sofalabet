import React, { useState } from 'react';
import { WalletTransaction, DepositProof } from '../../types.ts';
import {
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  FileCheck,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  ExternalLink,
  Download,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface AdminFinanceiroViewProps {
  transactions: WalletTransaction[];
  depositProofs: DepositProof[];
  activeSubTab: 'depositos' | 'levantamentos' | 'transacoes';
  setActiveSubTab: (tab: 'depositos' | 'levantamentos' | 'transacoes') => void;
  onReviewDepositProof: (proofId: string, status: 'APPROVED' | 'REJECTED', notes?: string) => Promise<void>;
  setSelectedProof: (proof: DepositProof | null) => void;
}

export const AdminFinanceiroView: React.FC<AdminFinanceiroViewProps> = ({
  transactions,
  depositProofs,
  activeSubTab,
  setActiveSubTab,
  onReviewDepositProof,
  setSelectedProof,
}) => {
  // Deposit Proofs Filter
  const [proofFilter, setProofFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');
  const [proofSearch, setProofSearch] = useState('');
  const [processingProofId, setProcessingProofId] = useState<string | null>(null);

  // Transactions Filter
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<string>('ALL');

  // Withdrawals extracted from ledger
  const withdrawals = transactions.filter((t) => t.type === 'WITHDRAWAL');

  // Filtered proofs
  const filteredProofs = depositProofs.filter((p) => {
    if (proofFilter !== 'ALL' && p.status !== proofFilter) return false;
    if (proofSearch.trim()) {
      const term = proofSearch.toLowerCase();
      const matchName = p.userName?.toLowerCase().includes(term);
      const matchPhone = p.userPhone?.toLowerCase().includes(term);
      const matchRef = p.referenceCode?.toLowerCase().includes(term);
      const matchOp = p.operatorTxId?.toLowerCase().includes(term);
      if (!matchName && !matchPhone && !matchRef && !matchOp) return false;
    }
    return true;
  });

  // Filtered transactions
  const filteredTransactions = transactions.filter((t) => {
    if (txTypeFilter !== 'ALL' && t.type !== txTypeFilter) return false;
    if (txSearch.trim()) {
      const term = txSearch.toLowerCase();
      const matchRef = t.reference?.toLowerCase().includes(term);
      const matchDesc = t.description?.toLowerCase().includes(term);
      const matchUser = t.userId?.toLowerCase().includes(term);
      if (!matchRef && !matchDesc && !matchUser) return false;
    }
    return true;
  });

  const totalDepositsVolume = transactions
    .filter((t) => t.type === 'DEPOSIT')
    .reduce((acc, t) => acc + Math.abs(t.amount || 0), 0);

  const totalWithdrawalsVolume = withdrawals.reduce(
    (acc, t) => acc + Math.abs(t.amount || 0),
    0
  );

  const pendingProofs = depositProofs.filter((p) => p.status === 'PENDING');

  return (
    <div className="space-y-5">
      {/* Sub-navigation bar matching tree hierarchy */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-800/60 border border-slate-700/80 rounded-2xl">
        <div className="flex items-center gap-2">
          <span className="font-mono text-emerald-400 font-bold text-xs sm:text-sm">💰 FINANCEIRO</span>
          <span className="text-slate-500">/</span>
          <span className="text-xs text-slate-300 font-semibold">
            {activeSubTab === 'depositos' && `Depósitos & Comprovativos (${depositProofs.length})`}
            {activeSubTab === 'levantamentos' && `Levantamentos (${withdrawals.length})`}
            {activeSubTab === 'transacoes' && `Histórico de Transações (${transactions.length})`}
          </span>
        </div>

        {/* Tree Sub-tabs buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setActiveSubTab('depositos')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'depositos'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Depósitos ({depositProofs.length})</span>
            {pendingProofs.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('levantamentos')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'levantamentos'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Levantamentos ({withdrawals.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('transacoes')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'transacoes'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Histórico de transações</span>
          </button>
        </div>
      </div>

      {/* ================= SUB-VIEW 1: DEPÓSITOS & COMPROVATIVOS ================= */}
      {activeSubTab === 'depositos' && (
        <div className="space-y-4">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-xl">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">Volume de Depósitos</span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">
                {totalDepositsVolume.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT
              </span>
              <span className="text-[10px] text-slate-400">Total creditado na plataforma</span>
            </div>

            <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-xl">
              <span className="text-[11px] font-bold text-amber-400 block uppercase">Pendentes de Validação</span>
              <span className="text-2xl font-black text-amber-300 mt-1 block">
                {pendingProofs.length} talões
              </span>
              <span className="text-[10px] text-slate-400">Requerem conferência manual</span>
            </div>

            <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-xl">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">Canal Oficial e-Mola</span>
              <span className="text-lg font-black text-white mt-1 block">867090687</span>
              <span className="text-[10px] text-orange-400 font-bold">Titular: Aninha Basto</span>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setProofFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl font-bold border transition-colors ${
                    proofFilter === filter
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  {filter === 'ALL' && 'Todos os Comprovativos'}
                  {filter === 'PENDING' && `Pendentes (${pendingProofs.length})`}
                  {filter === 'APPROVED' && 'Aprovados'}
                  {filter === 'REJECTED' && 'Rejeitados'}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Pesquisar por apostador, ref..."
                value={proofSearch}
                onChange={(e) => setProofSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Proofs Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/90 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-700">
                <tr>
                  <th className="py-3 px-3.5">Data / Hora</th>
                  <th className="py-3 px-3">Apostador</th>
                  <th className="py-3 px-3">Montante</th>
                  <th className="py-3 px-3">Método</th>
                  <th className="py-3 px-3">Referência & Operadora</th>
                  <th className="py-3 px-3">Comprovativo</th>
                  <th className="py-3 px-3 text-center">Estado</th>
                  <th className="py-3 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {filteredProofs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      Nenhum comprovativo encontrado para esta seleção.
                    </td>
                  </tr>
                ) : (
                  filteredProofs.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3.5 text-slate-400 whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleString('pt-PT')}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{p.userName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{p.userPhone}</div>
                      </td>

                      <td className="py-3 px-3 font-black text-emerald-400 whitespace-nowrap text-sm">
                        +{p.amount.toFixed(2)} MT
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          p.method === 'EMOLA'
                            ? 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
                            : p.method === 'MPESA'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                        }`}>
                          {p.method}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px]">
                        <div className="text-slate-300 font-bold">{p.referenceCode}</div>
                        {p.operatorTxId && (
                          <div className="text-[10px] text-emerald-400 font-bold">
                            Op: {p.operatorTxId}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {p.receiptDataUrl ? (
                          <button
                            onClick={() => setSelectedProof(p)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg border border-slate-700 text-[10px] font-bold flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Ver Talão</span>
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[10px]">Sem anexo</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.status === 'APPROVED'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : p.status === 'REJECTED'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}>
                          {p.status === 'APPROVED' && 'Aprovado'}
                          {p.status === 'REJECTED' && 'Rejeitado'}
                          {p.status === 'PENDING' && 'Pendente'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {p.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              disabled={processingProofId === p.id}
                              onClick={async () => {
                                setProcessingProofId(p.id);
                                await onReviewDepositProof(p.id, 'APPROVED', 'Aprovado pelo administrador');
                                setProcessingProofId(null);
                              }}
                              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-[11px] shadow transition-colors"
                            >
                              Aprovar
                            </button>
                            <button
                              disabled={processingProofId === p.id}
                              onClick={async () => {
                                const reason = prompt('Motivo da rejeição:', 'Talão inválido ou valor não recebido na conta e-Mola');
                                if (reason) {
                                  setProcessingProofId(p.id);
                                  await onReviewDepositProof(p.id, 'REJECTED', reason);
                                  setProcessingProofId(null);
                                }
                              }}
                              className="px-2 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 rounded-lg border border-rose-500/30 text-[11px] font-bold transition-colors"
                            >
                              Rejeitar
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">Concluído</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= SUB-VIEW 2: LEVANTAMENTOS ================= */}
      {activeSubTab === 'levantamentos' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-xl">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">Total de Levantamentos</span>
              <span className="text-2xl font-black text-rose-400 mt-1 block">
                {totalWithdrawalsVolume.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT
              </span>
              <span className="text-[10px] text-slate-400">Total retirado via e-Mola</span>
            </div>

            <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-xl">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">Taxa de Levantamento</span>
              <span className="text-2xl font-black text-white mt-1 block">5.0%</span>
              <span className="text-[10px] text-emerald-400">Retida automaticamente pela banca</span>
            </div>

            <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-xl">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">Operações Registadas</span>
              <span className="text-2xl font-black text-cyan-400 mt-1 block">
                {withdrawals.length} pedidos
              </span>
              <span className="text-[10px] text-slate-400">Livro-razão sincronizado</span>
            </div>
          </div>

          {/* Withdrawals Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/90 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-700">
                <tr>
                  <th className="py-3 px-3.5">Data / Hora</th>
                  <th className="py-3 px-3">Apostador (ID)</th>
                  <th className="py-3 px-3">Referência & Detalhes</th>
                  <th className="py-3 px-3 text-right">Montante Retirado</th>
                  <th className="py-3 px-3 text-right">Saldo Restante</th>
                  <th className="py-3 px-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Nenhum levantamento registado até ao momento.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3.5 text-slate-400 whitespace-nowrap">
                        {new Date(w.createdAt).toLocaleString('pt-PT')}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-300 text-[11px]">
                        {w.userId}
                      </td>

                      <td className="py-3 px-3 text-slate-300">
                        <div>{w.description}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{w.reference}</div>
                      </td>

                      <td className="py-3 px-3 text-right font-black text-rose-400 whitespace-nowrap">
                        {w.amount.toFixed(2)} MT
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-white whitespace-nowrap">
                        {w.nextBalance.toFixed(2)} MT
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                          Processado
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= SUB-VIEW 3: HISTORICO DE TRANSACOES (LIVRO-RAZAO) ================= */}
      {activeSubTab === 'transacoes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {(['ALL', 'DEPOSIT', 'WITHDRAWAL', 'BET', 'WIN', 'REFUND', 'ADJUSTMENT'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTxTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-xl font-bold border transition-colors ${
                    txTypeFilter === type
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  {type === 'ALL' && 'Todas'}
                  {type === 'DEPOSIT' && 'Depósitos'}
                  {type === 'WITHDRAWAL' && 'Levantamentos'}
                  {type === 'BET' && 'Apostas'}
                  {type === 'WIN' && 'Prémios'}
                  {type === 'REFUND' && 'Reembolsos'}
                  {type === 'ADJUSTMENT' && 'Ajustes'}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Pesquisar por referência ou ID..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Transactions Ledger Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/90 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-700">
                <tr>
                  <th className="py-3 px-3.5">Data / Hora</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-3">Utilizador (ID)</th>
                  <th className="py-3 px-3">Referência & Descrição</th>
                  <th className="py-3 px-3 text-right">Montante</th>
                  <th className="py-3 px-3 text-right">Saldo Anterior</th>
                  <th className="py-3 px-3 text-right">Novo Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Nenhuma movimentação financeira encontrada.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3.5 text-slate-400 whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleString('pt-PT')}
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.type === 'WIN' || tx.type === 'DEPOSIT'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : tx.type === 'BET' || tx.type === 'WITHDRAWAL'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : tx.type === 'REFUND'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}>
                          {tx.type}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-slate-300">
                        {tx.userId}
                      </td>

                      <td className="py-3 px-3 text-slate-300">
                        <div>{tx.description}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{tx.reference}</div>
                      </td>

                      <td className={`py-3 px-3 text-right font-black whitespace-nowrap ${
                        tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {tx.amount >= 0 ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)} MT
                      </td>

                      <td className="py-3 px-3 text-right text-slate-400 whitespace-nowrap">
                        {tx.previousBalance.toFixed(2)} MT
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-white whitespace-nowrap">
                        {tx.nextBalance.toFixed(2)} MT
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
