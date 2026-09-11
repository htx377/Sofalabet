import React, { useState, useEffect } from 'react';
import {
  Match,
  User,
  AuditLog,
  Competition,
  DashboardStats,
  Bet,
  WalletTransaction,
  DepositProof,
} from '../types.ts';
import { api } from '../api.ts';
import { AdjustBalanceModal } from './AdjustBalanceModal.tsx';
import { UserDetailModal } from './UserDetailModal.tsx';
import { broadcastSettlement } from '../utils/settlementEvents.ts';
import {
  Shield,
  Plus,
  Edit2,
  CheckCircle,
  AlertTriangle,
  Users,
  Trophy,
  History,
  Lock,
  Unlock,
  DollarSign,
  FileText,
  RefreshCw,
  X,
  Calendar,
  Clock,
  ArrowLeft,
  Eye,
  Trash2,
  Key,
  Search,
  ArrowDownLeft,
  FileCheck,
  ExternalLink,
  Download,
  Paperclip,
  Image as ImageIcon,
  Database,
  Copy,
  Check,
  Terminal,
  HardDrive,
  Sparkles,
} from 'lucide-react';

interface AdminPanelProps {
  onBackToSportsbook?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToSportsbook }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'results' | 'users' | 'bets' | 'transactions' | 'deposits' | 'audit' | 'supabase'>('overview');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [depositProofs, setDepositProofs] = useState<DepositProof[]>([]);
  const [selectedProof, setSelectedProof] = useState<DepositProof | null>(null);
  const [depositFilter, setDepositFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');
  const [proofSearch, setProofSearch] = useState('');
  const [reviewNotesInput, setReviewNotesInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modals
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [showOddsModal, setShowOddsModal] = useState<Match | null>(null);
  const [showResultModal, setShowResultModal] = useState<Match | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<Match | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState<User | null>(null);
  const [showUserDetailModal, setShowUserDetailModal] = useState<User | null>(null);

  // Filter states
  const [userFilter, setUserFilter] = useState<'ALL' | 'USER' | 'ADMIN' | 'BLOCKED' | 'ACTIVE'>('ALL');
  const [txSearch, setTxSearch] = useState('');

  // Form states: Create Match
  const [newCompetitionId, setNewCompetitionId] = useState('comp-mocambola');
  const [newHomeTeam, setNewHomeTeam] = useState('');
  const [newAwayTeam, setNewAwayTeam] = useState('');
  const [newKickoffDate, setNewKickoffDate] = useState(new Date().toISOString().split('T')[0]);
  const [newKickoffTime, setNewKickoffTime] = useState('18:00');
  const [newOddHome, setNewOddHome] = useState('2.00');
  const [newOddDraw, setNewOddDraw] = useState('3.10');
  const [newOddAway, setNewOddAway] = useState('3.50');
  const [newStatus, setNewStatus] = useState<'DRAFT' | 'OPEN'>('OPEN');
  const [newDescription, setNewDescription] = useState('');

  // Form states: Edit Odds
  const [editHome, setEditHome] = useState('2.00');
  const [editDraw, setEditDraw] = useState('3.00');
  const [editAway, setEditAway] = useState('3.00');

  // Form states: Settle Result
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);

  // Form states: Cancel Match
  const [cancelReason, setCancelReason] = useState('Condições meteorológicas adversas');

  // Form states: Adjust Balance
  const [adjustAmount, setAdjustAmount] = useState<number>(100);
  const [adjustReason, setAdjustReason] = useState('Bonificação / Ajuste manual de teste');

  // User search
  const [userSearch, setUserSearch] = useState('');

  // Safe In-App Modals (replacing window.confirm and window.prompt)
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);
  const [tempPasswordInput, setTempPasswordInput] = useState('Zona123!');
  const [copiedTempPassword, setCopiedTempPassword] = useState(false);
  const [isDeletingMatch, setIsDeletingMatch] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Match filters
  const [matchSearch, setMatchSearch] = useState('');
  const [matchStatusFilter, setMatchStatusFilter] = useState<'ALL' | 'OPEN' | 'SUSPENDED' | 'FINISHED' | 'CANCELLED'>('ALL');
  const [matchCategoryFilter, setMatchCategoryFilter] = useState<'ALL' | 'MOCAMBOLA' | 'PROVINCIAL' | 'DISTRITAL'>('ALL');

  // Supabase states
  const [supabaseStatus, setSupabaseStatus] = useState<{
    isConfigured: boolean;
    connected: boolean;
    url: string | null;
    hasServiceKey: boolean;
    hasAnonKey: boolean;
    error?: string | null;
    tables?: any;
  } | null>(null);
  const [supabaseSchemaSql, setSupabaseSchemaSql] = useState<string>('');
  const [syncingSupabase, setSyncingSupabase] = useState(false);
  const [pullingSupabase, setPullingSupabase] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const fetchSupabaseInfo = async () => {
    try {
      const [statusRes, schemaRes] = await Promise.all([
        api.getSupabaseStatus(),
        api.getSupabaseSchema().catch(() => ({ sql: '' })),
      ]);
      setSupabaseStatus(statusRes);
      if (schemaRes?.sql) {
        setSupabaseSchemaSql(schemaRes.sql);
      }
    } catch (e: any) {
      console.warn('Erro ao obter info do Supabase:', e);
    }
  };

  const handleSyncToSupabase = async () => {
    setSyncingSupabase(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await api.syncSupabase();
      if (res.success) {
        notifySuccess(res.message);
        await fetchSupabaseInfo();
      } else {
        notifyError(res.message);
      }
    } catch (err: any) {
      notifyError(err.message || 'Falha ao sincronizar dados com o Supabase');
    } finally {
      setSyncingSupabase(false);
    }
  };

  const handlePullFromSupabase = async () => {
    setPullingSupabase(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await api.pullSupabase();
      if (res.success) {
        notifySuccess(res.message);
        await loadData();
      } else {
        notifyError(res.message);
      }
    } catch (err: any) {
      notifyError(err.message || 'Falha ao puxar dados do Supabase');
    } finally {
      setPullingSupabase(false);
    }
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(supabaseSchemaSql);
      setCopiedSql(true);
      notifySuccess('Script SQL copiado com sucesso! Cole-o no SQL Editor do seu projeto Supabase.');
      setTimeout(() => setCopiedSql(false), 4000);
    } catch {
      notifyError('Não foi possível copiar para a área de transferência');
    }
  };

  const loadData = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const [dashRes, matchRes, compRes, userRes, auditRes, betsRes, txRes, proofsRes] = await Promise.all([
        api.getAdminDashboard(),
        api.getMatches(),
        api.getCompetitions(),
        api.getUsers(),
        api.getAdminAuditLogs(),
        api.getAdminBets(),
        api.getAdminTransactions(),
        api.getAdminDepositProofs(),
        fetchSupabaseInfo(),
      ]);

      setStats(dashRes.stats);
      setMatches(matchRes.matches);
      setCompetitions(compRes.competitions);
      setUsers(userRes.users);
      setAuditLogs(auditRes.logs);
      setBets(betsRes.bets);
      setTransactions(txRes.transactions);
      setDepositProofs(proofsRes.proofs || []);
    } catch (err: any) {
      setActionError(err.message || 'Erro ao carregar dados do painel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const notifySuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const notifyError = (msg: string) => {
    setActionError(msg);
    setTimeout(() => setActionError(null), 4000);
  };

  // 1. Create Match Handler
  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        competitionId: newCompetitionId,
        homeTeam: newHomeTeam,
        awayTeam: newAwayTeam,
        kickoffDate: newKickoffDate,
        kickoffTime: newKickoffTime,
        status: newStatus,
        description: newDescription,
        odds: {
          home: parseFloat(newOddHome),
          draw: parseFloat(newOddDraw),
          away: parseFloat(newOddAway),
        },
      };
      await api.createMatch(payload);
      setShowCreateMatch(false);
      notifySuccess(`Jogo "${newHomeTeam} vs ${newAwayTeam}" criado com sucesso!`);
      // Reset form
      setNewHomeTeam('');
      setNewAwayTeam('');
      await loadData();
    } catch (err: any) {
      notifyError(err.message || 'Erro ao criar jogo');
    }
  };

  // 2. Update Odds Handler
  const handleUpdateOdds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showOddsModal) return;
    try {
      await api.updateOdds(showOddsModal.id, {
        home: parseFloat(editHome),
        draw: parseFloat(editDraw),
        away: parseFloat(editAway),
      });
      setShowOddsModal(null);
      notifySuccess('Odds do jogo atualizadas com sucesso!');
      await loadData();
    } catch (err: any) {
      notifyError(err.message || 'Erro ao alterar odds');
    }
  };

  // 3. Update Match Status
  const handleStatusChange = async (matchId: string, status: string) => {
    try {
      await api.updateMatchStatus(matchId, status);
      notifySuccess(`Estado do jogo alterado para ${status}`);
      await loadData();
    } catch (err: any) {
      notifyError(err.message || 'Erro ao alterar estado');
    }
  };

  // 4. Settle Match Result
  const handleSettleResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResultModal) return;
    try {
      const res = await api.enterResult(showResultModal.id, homeScore, awayScore);
      broadcastSettlement({
        matchId: showResultModal.id,
        homeScore,
        awayScore,
        settlement: res.settlement,
      });
      setShowResultModal(null);
      const paidCount = res.settlement?.wonBetsCount ?? res.settlement?.totalWonBets ?? 0;
      notifySuccess(`Jogo liquidado com sucesso! Placar: ${homeScore} - ${awayScore}. Vencedores pagos: ${paidCount}.`);
      await loadData();
    } catch (err: any) {
      notifyError(err.message || 'Erro ao liquidar jogo');
    }
  };

  // 5. Cancel Match
  const handleCancelMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCancelModal) return;
    try {
      const res = await api.cancelMatch(showCancelModal.id, cancelReason);
      setShowCancelModal(null);
      notifySuccess(`Jogo cancelado com sucesso. ${res.result.voidedBetsCount} apostas foram anuladas (VOID) e reembolsadas.`);
      await loadData();
    } catch (err: any) {
      notifyError(err.message || 'Erro ao cancelar jogo');
    }
  };

  // 6. Toggle User Block
  const handleToggleBlock = async (userId: string) => {
    try {
      const res = await api.toggleUserBlock(userId);
      notifySuccess(res.message);
      await loadData();
    } catch (err: any) {
      notifyError(err.message || 'Erro ao alterar bloqueio');
    }
  };

  // 7. Delete Match (Safe In-App Action)
  const handleConfirmDeleteMatch = async () => {
    if (!matchToDelete) return;
    setIsDeletingMatch(true);
    try {
      const res = await api.deleteMatch(matchToDelete.id);
      notifySuccess(res.message);
      setMatchToDelete(null);
      await loadData();
    } catch (err: any) {
      notifyError(err.message || 'Erro ao excluir jogo');
    } finally {
      setIsDeletingMatch(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'USER' | 'ADMIN') => {
    try {
      const res = await api.changeUserRole(userId, newRole);
      notifySuccess(res.message);
      await loadData();
    } catch (err: any) {
      notifyError(err.message || 'Erro ao alterar função do utilizador');
    }
  };

  // 8. Reset Password (Safe In-App Modal)
  const handleConfirmResetPassword = async () => {
    if (!userToResetPassword) return;
    if (!tempPasswordInput.trim()) {
      notifyError('Por favor introduza a nova palavra-passe temporária.');
      return;
    }
    setIsResettingPassword(true);
    try {
      const res = await api.resetUserPassword(userToResetPassword.id, tempPasswordInput.trim());
      notifySuccess(`Palavra-passe alterada com sucesso! Nova senha: "${res.tempPassword}"`);
      setUserToResetPassword(null);
      await loadData();
    } catch (err: any) {
      notifyError(err.message || 'Erro ao redefinir senha');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const filteredMatches = matches.filter((m) => {
    const term = matchSearch.toLowerCase().trim();
    const matchesQuery =
      !term ||
      m.homeTeam.toLowerCase().includes(term) ||
      m.awayTeam.toLowerCase().includes(term) ||
      m.competitionName.toLowerCase().includes(term);

    if (!matchesQuery) return false;
    if (matchStatusFilter !== 'ALL' && m.status !== matchStatusFilter) return false;
    if (matchCategoryFilter !== 'ALL') {
      const isMocambola = m.competitionCategory === 'MOCAMBOLA' || m.competitionName.toLowerCase().includes('moçambola');
      const isProvincial = m.competitionCategory === 'PROVINCIAL' || m.competitionName.toLowerCase().includes('provincial');
      const isDistrital = m.competitionCategory === 'DISTRITAL' || m.competitionName.toLowerCase().includes('distrital');
      if (matchCategoryFilter === 'MOCAMBOLA' && !isMocambola) return false;
      if (matchCategoryFilter === 'PROVINCIAL' && !isProvincial) return false;
      if (matchCategoryFilter === 'DISTRITAL' && !isDistrital) return false;
    }
    return true;
  });

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone.includes(userSearch);

    if (!matchesSearch) return false;

    if (userFilter === 'USER') return u.role === 'USER';
    if (userFilter === 'ADMIN') return u.role === 'ADMIN';
    if (userFilter === 'BLOCKED') return u.isBlocked;
    if (userFilter === 'ACTIVE') return !u.isBlocked;
    return true;
  });

  const filteredTransactions = transactions.filter((tx) =>
    tx.reference.toLowerCase().includes(txSearch.toLowerCase()) ||
    tx.description.toLowerCase().includes(txSearch.toLowerCase()) ||
    tx.userId.toLowerCase().includes(txSearch.toLowerCase())
  );

  const handleUpdateProofStatus = async (id: string, newStatus: 'APPROVED' | 'REJECTED' | 'PENDING', notes?: string) => {
    try {
      const res = await api.updateDepositProofStatus(id, newStatus, notes);
      notifySuccess(res.message);
      if (selectedProof?.id === id) {
        setSelectedProof(res.proof);
      }
      await loadData();
    } catch (err: any) {
      notifyError(err.message || 'Erro ao atualizar estado do comprovativo');
    }
  };

  const filteredDepositProofs = depositProofs.filter((p) => {
    const matchesSearch =
      p.userName.toLowerCase().includes(proofSearch.toLowerCase()) ||
      p.userPhone.includes(proofSearch) ||
      p.referenceCode.toLowerCase().includes(proofSearch.toLowerCase()) ||
      (p.operatorTxId && p.operatorTxId.toLowerCase().includes(proofSearch.toLowerCase())) ||
      (p.notes && p.notes.toLowerCase().includes(proofSearch.toLowerCase()));

    if (!matchesSearch) return false;
    if (depositFilter === 'ALL') return true;
    return p.status === depositFilter;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden text-white space-y-6">
      
      {/* Top Banner */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white">Painel do Super Administrador</h1>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500 text-slate-950 shadow-sm">
                CONTROLO TOTAL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Gestão integral: criação de jogos, odds em tempo real, adição/dedução de saldo, bloqueio de contas e auditoria.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onBackToSportsbook && (
            <button
              onClick={onBackToSportsbook}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Sportsbook</span>
            </button>
          )}
          <button
            id="admin-create-match-trigger"
            onClick={() => setShowCreateMatch(true)}
            className="px-3.5 sm:px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ CRIAR NOVO JOGO</span>
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="px-4 sm:px-6">
        {actionSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
      </div>

      {/* Navigation Subtabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 px-3 sm:px-6 overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', label: 'Estatísticas Globais', icon: Trophy },
          { id: 'matches', label: 'Gestão de Jogos & Odds', icon: Trophy },
          { id: 'results', label: 'Resultados & Liquidação', icon: CheckCircle },
          { id: 'users', label: 'Utilizadores & Saldos', icon: Users },
          { id: 'bets', label: 'Apostas Globais', icon: History },
          { id: 'transactions', label: 'Livro-Razão (Ledger)', icon: DollarSign },
          { id: 'deposits', label: `Comprovativos (${depositProofs.length})`, icon: ArrowDownLeft },
          { id: 'audit', label: 'Registo de Auditoria', icon: FileText },
          { id: 'supabase', label: 'Supabase Cloud & BD', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeTab === 'overview' && stats && (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 block">Total de Utilizadores</span>
              <span className="text-2xl font-black text-white mt-1 block">{stats.totalUsers}</span>
              <span className="text-[10px] text-emerald-400 mt-1 block">Apostadores registados</span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 block">Jogos Activos / Abertos</span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">{stats.activeMatches}</span>
              <span className="text-[10px] text-slate-400 mt-1 block">{stats.finishedMatches} jogos terminados</span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 block">Volume Total Apostado</span>
              <span className="text-2xl font-black text-cyan-400 mt-1 block">{stats.totalBetVolume.toFixed(2)} MZN</span>
              <span className="text-[10px] text-slate-400 mt-1 block">{stats.pendingBets} apostas pendentes</span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 block">Total Pago em Prémios</span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">{stats.totalDisbursedPayout.toFixed(2)} MZN</span>
              <span className="text-[10px] text-slate-400 mt-1 block">{stats.wonBets} apostas vencedoras</span>
            </div>
          </div>

          {/* Quick Actions Panel for Administrator */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-extrabold text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Ações Rápidas de Gestão
              </span>
              <span className="text-[11px] text-slate-400">Atalhos diretos</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              <button
                id="overview-quick-create-match"
                onClick={() => setShowCreateMatch(true)}
                className="p-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-left transition-all group"
              >
                <Plus className="w-4 h-4 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="block text-xs font-bold text-white">Criar Jogo</span>
                <span className="text-[10px] text-emerald-300/80">Novo evento 1X2</span>
              </button>

              <button
                id="overview-quick-settle"
                onClick={() => setActiveTab('results')}
                className="p-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-left transition-all group"
              >
                <CheckCircle className="w-4 h-4 text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="block text-xs font-bold text-white">Liquidar Jogos</span>
                <span className="text-[10px] text-cyan-300/80">Inserir resultados</span>
              </button>

              <button
                id="overview-quick-deposits"
                onClick={() => setActiveTab('deposits')}
                className="p-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-left transition-all group relative"
              >
                <ArrowDownLeft className="w-4 h-4 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="block text-xs font-bold text-white">Comprovativos</span>
                <span className="text-[10px] text-amber-300/80">
                  {depositProofs.filter(p => p.status === 'PENDING').length} pendentes
                </span>
                {depositProofs.filter(p => p.status === 'PENDING').length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>

              <button
                id="overview-quick-users"
                onClick={() => setActiveTab('users')}
                className="p-3 rounded-xl bg-slate-750 hover:bg-slate-700 border border-slate-650 text-left transition-all group"
              >
                <Users className="w-4 h-4 text-slate-300 mb-1 group-hover:scale-110 transition-transform" />
                <span className="block text-xs font-bold text-white">Utilizadores</span>
                <span className="text-[10px] text-slate-400">Saldos & risco</span>
              </button>

              <button
                id="overview-quick-supabase"
                onClick={() => setActiveTab('supabase')}
                className="p-3 rounded-xl bg-slate-750 hover:bg-slate-700 border border-slate-650 text-left transition-all group"
              >
                <Database className="w-4 h-4 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="block text-xs font-bold text-white">Supabase BD</span>
                <span className="text-[10px] text-slate-400">Sincronização</span>
              </button>
            </div>
          </div>

          {/* Quick instructions for administrator */}
          <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-2">
            <h3 className="font-extrabold text-sm text-white">Manual Operacional do Administrador</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              1. <strong>Criação de Jogos:</strong> Clique em "+ CRIAR NOVO JOGO" e insira a competição, equipas, data, hora e odds 1X2.<br />
              2. <strong>Alteração de Odds:</strong> As odds podem ser alteradas livremente na aba "Gestão de Jogos" enquanto o estado for <em>OPEN</em>. As apostas já efetuadas mantêm as odds congeladas do momento da aposta.<br />
              3. <strong>Liquidação de Resultados:</strong> Na aba "Resultados & Liquidação", introduza os golos da equipa da casa e visitante. O motor calculará imediatamente as seleções vencedoras e creditará as carteiras dos apostadores no ledger de forma atómica.
            </p>
          </div>
        </div>
      )}

      {/* ================= TAB 2: MATCHES MANAGEMENT ================= */}
      {activeTab === 'matches' && (
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-base text-white">
                Jogos Registados no Sistema ({filteredMatches.length} de {matches.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pesquise, filtre por estado ou campeonato, altere odds e administre confrontos.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-60">
                <input
                  type="text"
                  placeholder="Buscar jogo ou equipa..."
                  value={matchSearch}
                  onChange={(e) => setMatchSearch(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 w-full focus:outline-none focus:border-emerald-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
              </div>

              <button
                id="admin-create-match-inline-btn"
                onClick={() => setShowCreateMatch(true)}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl whitespace-nowrap shadow flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Criar Jogo</span>
              </button>
            </div>
          </div>

          {/* Filters Bar: Status & Category */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Estado:</span>
              {[
                { id: 'ALL', label: `Todos (${matches.length})` },
                { id: 'OPEN', label: `Abertos (${matches.filter(m => m.status === 'OPEN').length})` },
                { id: 'SUSPENDED', label: `Suspensos (${matches.filter(m => m.status === 'SUSPENDED').length})` },
                { id: 'FINISHED', label: `Terminados (${matches.filter(m => m.status === 'FINISHED').length})` },
                { id: 'CANCELLED', label: `Cancelados (${matches.filter(m => m.status === 'CANCELLED').length})` },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setMatchStatusFilter(st.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                    matchStatusFilter === st.id
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Nível:</span>
              {[
                { id: 'ALL', label: 'Todos' },
                { id: 'MOCAMBOLA', label: 'Moçambola' },
                { id: 'PROVINCIAL', label: 'Provincial' },
                { id: 'DISTRITAL', label: 'Distrital' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setMatchCategoryFilter(cat.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                    matchCategoryFilter === cat.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Campeonato</th>
                  <th className="py-2.5 px-3">Confronto</th>
                  <th className="py-2.5 px-3">Data / Hora</th>
                  <th className="py-2.5 px-3 text-center">Odds (1 - X - 2)</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                  <th className="py-2.5 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {filteredMatches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                      Nenhum jogo encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredMatches.map((m) => {
                  const mkt = m.markets.find((x) => x.type === '1X2');
                  const h = mkt?.selections.find((s) => s.outcome === '1')?.odds;
                  const d = mkt?.selections.find((s) => s.outcome === 'X')?.odds;
                  const a = mkt?.selections.find((s) => s.outcome === '2')?.odds;

                  return (
                    <tr key={m.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{m.competitionName}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            m.competitionCategory === 'MOCAMBOLA' || m.competitionName.includes('Moçambola')
                              ? 'text-emerald-400'
                              : m.competitionCategory === 'PROVINCIAL' || m.competitionName.includes('Provincial')
                              ? 'text-amber-400'
                              : 'text-sky-400'
                          }`}>
                            {m.competitionCategory === 'MOCAMBOLA' || m.competitionName.includes('Moçambola')
                              ? '• Nacional'
                              : m.competitionCategory === 'PROVINCIAL' || m.competitionName.includes('Provincial')
                              ? '• Provincial'
                              : '• Distrital'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-bold text-white">
                        {m.homeTeam} vs {m.awayTeam}
                        {m.homeScore !== null && m.homeScore !== undefined && (
                          <span className="ml-2 text-emerald-400 font-black">({m.homeScore} - {m.awayScore})</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {m.kickoffDate} {m.kickoffTime}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        <span className="text-emerald-400 font-bold">{h?.toFixed(2)}</span> /{' '}
                        <span className="text-slate-300 font-bold">{d?.toFixed(2)}</span> /{' '}
                        <span className="text-cyan-400 font-bold">{a?.toFixed(2)}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.status === 'OPEN'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : m.status === 'FINISHED'
                            ? 'bg-cyan-500/10 text-cyan-400'
                            : m.status === 'SUSPENDED'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap space-x-1.5">
                        {m.status === 'OPEN' && (
                          <>
                            <button
                              onClick={() => {
                                setShowOddsModal(m);
                                setEditHome(String(h || 2.0));
                                setEditDraw(String(d || 3.0));
                                setEditAway(String(a || 3.0));
                              }}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-[11px] font-bold"
                            >
                              Odds
                            </button>
                            <button
                              onClick={() => handleStatusChange(m.id, 'SUSPENDED')}
                              className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded border border-amber-500/30 text-[11px] font-bold"
                            >
                              Suspender
                            </button>
                          </>
                        )}
                        {m.status === 'SUSPENDED' && (
                          <button
                            onClick={() => handleStatusChange(m.id, 'OPEN')}
                            className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30 text-[11px] font-bold"
                          >
                            Reabrir
                          </button>
                        )}
                        {m.status !== 'FINISHED' && m.status !== 'CANCELLED' && (
                          <>
                            <button
                              onClick={() => {
                                setShowResultModal(m);
                                setHomeScore(0);
                                setAwayScore(0);
                              }}
                              className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30 text-[11px] font-black"
                            >
                              Resultado
                            </button>
                            <button
                              onClick={() => setShowCancelModal(m)}
                              className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded border border-rose-500/30 text-[11px] font-bold"
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setMatchToDelete(m)}
                          title="Excluir Jogo"
                          className="p-1 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded border border-slate-700 hover:border-rose-500/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: RESULTS & SETTLEMENT ================= */}
      {activeTab === 'results' && (
        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-white">Introdução de Resultados & Liquidação de Prémios</h3>
            <p className="text-xs text-slate-400 mt-1">
              Introduza o resultado final oficial dos jogos para fechar o mercado e pagar automaticamente os vencedores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches
              .filter((m) => m.status !== 'FINISHED' && m.status !== 'CANCELLED')
              .map((match) => (
                <div key={match.id} className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-bold">{match.competitionName}</span>
                    <span className="text-slate-400">{match.kickoffDate} {match.kickoffTime}</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-y border-slate-700/50">
                    <span className="font-black text-sm text-white">{match.homeTeam}</span>
                    <span className="text-xs font-bold text-slate-500">VS</span>
                    <span className="font-black text-sm text-white">{match.awayTeam}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-400">Estado: <strong className="text-emerald-400">{match.status}</strong></span>
                    <button
                      onClick={() => {
                        setShowResultModal(match);
                        setHomeScore(0);
                        setAwayScore(0);
                      }}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-emerald-500/20"
                    >
                      INSERIR RESULTADO FINAL
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: USERS MANAGEMENT (SUPER ADMIN) ================= */}
      {activeTab === 'users' && (
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">Gestão Central de Utilizadores & Risco</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {users.length} Registados
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Controlo total: Adicionar saldo, bloquear/desbloquear, redefinir senhas, alterar funções e consultar extratos
              </p>
            </div>
            
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Pesquisar por nome, email ou telefone..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 w-full focus:outline-none focus:border-amber-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* User Category Filter Chips */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800">
            {[
              { id: 'ALL', label: `Todos (${users.length})` },
              { id: 'USER', label: `Apostadores (${users.filter((u) => u.role === 'USER').length})` },
              { id: 'ADMIN', label: `Super Admins (${users.filter((u) => u.role === 'ADMIN').length})` },
              { id: 'ACTIVE', label: `Ativos (${users.filter((u) => !u.isBlocked).length})` },
              { id: 'BLOCKED', label: `Bloqueados (${users.filter((u) => u.isBlocked).length})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setUserFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  userFilter === f.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm font-black'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-white hover:bg-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Nome / Apostador</th>
                  <th className="py-2.5 px-3">Email & Contacto</th>
                  <th className="py-2.5 px-3">Função</th>
                  <th className="py-2.5 px-3 text-right">Saldo (MZN)</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                  <th className="py-2.5 px-3 text-right">Ações Rápidas (Super Admin)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3">
                      <div className="font-bold text-white text-sm">{u.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">ID: {u.id}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      <div className="text-white font-medium">{u.email}</div>
                      <div className="text-[11px] text-slate-500">{u.phone}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {u.role === 'ADMIN' ? 'SUPER ADMIN' : 'APOSTADOR'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-black text-emerald-400 text-sm">
                      {u.balance.toFixed(2)} MZN
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.isBlocked ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {u.isBlocked ? 'BLOQUEADO' : 'ATIVO'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap space-x-1.5">
                      {/* Add Balance */}
                      <button
                        onClick={() => setShowAdjustModal(u)}
                        className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg border border-emerald-500/40 text-[11px] font-bold inline-flex items-center gap-1"
                        title="Adicionar ou Deduzir Saldo"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Saldo</span>
                      </button>

                      {/* Detailed inspection modal */}
                      <button
                        onClick={() => setShowUserDetailModal(u)}
                        className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded-lg border border-cyan-500/30 text-[11px] font-bold inline-flex items-center gap-1"
                        title="Ver Ficha e Extrato Completo"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ficha</span>
                      </button>

                      {/* Block / Unblock */}
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleToggleBlock(u.id)}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1 ${
                            u.isBlocked
                              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}
                          title={u.isBlocked ? 'Desbloquear Acesso' : 'Bloquear Acesso'}
                        >
                          {u.isBlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          <span>{u.isBlocked ? 'Desbloquear' : 'Bloquear'}</span>
                        </button>
                      )}

                      {/* Change role */}
                      <button
                        onClick={() => handleChangeRole(u.id, u.role === 'ADMIN' ? 'USER' : 'ADMIN')}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-[11px] font-bold inline-flex items-center gap-1"
                        title={u.role === 'ADMIN' ? 'Despromover para Apostador' : 'Promover para Super Admin'}
                      >
                        <Shield className="w-3.5 h-3.5 text-amber-400" />
                        <span>{u.role === 'ADMIN' ? 'Tornar User' : 'Tornar Admin'}</span>
                      </button>

                      {/* Reset Password */}
                      <button
                        onClick={() => {
                          setUserToResetPassword(u);
                          setTempPasswordInput('Zona123!');
                          setCopiedTempPassword(false);
                        }}
                        className="p-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg border border-slate-700"
                        title="Redefinir Palavra-passe do utilizador"
                      >
                        <Key className="w-3.5 h-3.5" />
                      </button>
                      
                      {/* Delete User */}
                      <button
                        onClick={() => {
                          if (window.confirm(`Tem certeza que deseja excluir o utilizador ${u.name}? Esta ação é irreversível e excluirá todo o histórico e saldo da carteira.`)) {
                            api.deleteUser(u.id)
                              .then(res => {
                                notifySuccess(res.message);
                                loadData();
                              })
                              .catch(err => {
                                notifyError(err.message || 'Erro ao excluir utilizador');
                              });
                          }
                        }}
                        className="p-1 bg-slate-800 hover:bg-red-900/50 text-red-400 rounded-lg border border-slate-700"
                        title="Excluir permanentemente este utilizador"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 5: GLOBAL BETS ================= */}
      {activeTab === 'bets' && (
        <div className="p-4 sm:p-6 space-y-4">
          <h3 className="font-extrabold text-base text-white">Todas as Apostas na Plataforma ({bets.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Apostador</th>
                  <th className="py-2.5 px-3">Tipo / Jogos</th>
                  <th className="py-2.5 px-3 text-right">Stake</th>
                  <th className="py-2.5 px-3 text-right">Odd Total</th>
                  <th className="py-2.5 px-3 text-right">Possível Retorno</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {bets.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(b.createdAt).toLocaleString('pt-PT')}
                    </td>
                    <td className="py-3 px-3 text-white">
                      <div>{b.userName}</div>
                      <div className="text-[10px] text-slate-500">{b.userEmail}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      <span className="font-bold">{b.type}</span> ({b.items.length} seleções)
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-white">{b.stake.toFixed(2)} MZN</td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-400">{b.totalOdds.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-black text-emerald-400">{b.potentialReturn.toFixed(2)} MZN</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.status === 'WON'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : b.status === 'LOST'
                          ? 'bg-rose-500/10 text-rose-400'
                          : b.status === 'VOID'
                          ? 'bg-cyan-500/10 text-cyan-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 6: GLOBAL LEDGER TRANSACTIONS ================= */}
      {activeTab === 'transactions' && (
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-base text-white">Livro-Razão Financeiro Global ({transactions.length})</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Registo de auditoria imutável de todas as movimentações financeiras: depósitos, apostas, prémios e ajustes
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Filtrar por referência, descrição ou ID..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 w-full focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Data / Hora</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Utilizador (ID)</th>
                  <th className="py-2.5 px-3">Referência & Descrição</th>
                  <th className="py-2.5 px-3 text-right">Montante</th>
                  <th className="py-2.5 px-3 text-right">Saldo Anterior</th>
                  <th className="py-2.5 px-3 text-right">Novo Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleString('pt-PT')}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.type === 'WIN' || tx.type === 'DEPOSIT'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : tx.type === 'BET'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : tx.type === 'REFUND'
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">
                      {tx.userId}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      <div>{tx.description}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{tx.reference}</div>
                    </td>
                    <td className={`py-3 px-3 text-right font-black ${
                      tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {tx.amount >= 0 ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)} MZN
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">{tx.previousBalance.toFixed(2)} MZN</td>
                    <td className="py-3 px-3 text-right font-bold text-white">{tx.nextBalance.toFixed(2)} MZN</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 6: AUDIT LOGS ================= */}
      {activeTab === 'audit' && (
        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-white">Registo Central de Auditoria</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Rastreamento imutável de todas as ações administrativas (criação de jogos, alteração de odds, liquidações, ajustes de saldo)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Data / Hora</th>
                  <th className="py-2.5 px-3">Administrador</th>
                  <th className="py-2.5 px-3">Acção</th>
                  <th className="py-2.5 px-3">Entidade & ID</th>
                  <th className="py-2.5 px-3">Alteração (Anterior ➔ Novo)</th>
                  <th className="py-2.5 px-3">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('pt-PT')}
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-bold">{log.adminEmail}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {log.entity} ({log.entityId.substring(0, 10)})
                    </td>
                    <td className="py-3 px-3 text-slate-300 max-w-xs truncate">
                      {log.oldValue && <span className="text-rose-400 line-through mr-1">{log.oldValue}</span>}
                      {log.newValue && <span className="text-emerald-400">{log.newValue}</span>}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[10px]">{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 7: DEPOSIT PROOFS (COMPROVATIVOS) ================= */}
      {activeTab === 'deposits' && (
        <div className="p-4 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <span>Comprovativos de Depósito da Administração</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Central de conferência e auditoria de talões, capturas de ecrã M-Pesa/e-Mola/mKesh e transferências bancárias enviadas pelos apostadores.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-orange-500/15 border border-orange-500/30 font-bold text-orange-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
                <span>e-Mola Oficial: <strong>867090687</strong> (Aninha Basto)</span>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 font-bold text-slate-300">
                Total Registados: <strong className="text-emerald-400">{depositProofs.length}</strong>
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-[11px] text-slate-400 block font-medium">Total Comprovativos</span>
              <span className="text-xl font-black text-white">{depositProofs.length}</span>
            </div>
            <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-[11px] text-slate-400 block font-medium">Volume em Depósitos</span>
              <span className="text-xl font-black text-emerald-400">
                {depositProofs.reduce((acc, p) => acc + p.amount, 0).toFixed(2)} <span className="text-xs font-normal">MZN</span>
              </span>
            </div>
            <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-[11px] text-slate-400 block font-medium">Aprovados / Confirmados</span>
              <span className="text-xl font-black text-emerald-400">
                {depositProofs.filter((p) => p.status === 'APPROVED').length}
              </span>
            </div>
            <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-[11px] text-slate-400 block font-medium">Pendentes de Revisão</span>
              <span className="text-xl font-black text-amber-400">
                {depositProofs.filter((p) => p.status === 'PENDING').length}
              </span>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex flex-wrap gap-1.5 text-xs">
              {(['ALL', 'APPROVED', 'PENDING', 'REJECTED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDepositFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-colors border ${
                    depositFilter === filter
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  {filter === 'ALL' && 'Todos'}
                  {filter === 'APPROVED' && 'Aprovados'}
                  {filter === 'PENDING' && 'Pendentes'}
                  {filter === 'REJECTED' && 'Rejeitados'}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={proofSearch}
                onChange={(e) => setProofSearch(e.target.value)}
                placeholder="Pesquisar por nome, celular, ref..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Proofs Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Data / Hora</th>
                  <th className="py-2.5 px-3">Apostador</th>
                  <th className="py-2.5 px-3">Montante</th>
                  <th className="py-2.5 px-3">Método</th>
                  <th className="py-2.5 px-3">Referência Sistema & Operadora</th>
                  <th className="py-2.5 px-3">Comprovativo</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {filteredDepositProofs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      Nenhum comprovativo encontrado para os critérios selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredDepositProofs.map((proof) => (
                    <tr key={proof.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {new Date(proof.createdAt).toLocaleString('pt-PT')}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{proof.userName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{proof.userPhone}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-black text-emerald-400 text-sm">
                          +{proof.amount.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">MZN</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          proof.method === 'MPESA'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : proof.method === 'EMOLA'
                            ? 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
                            : proof.method === 'MKESH'
                            ? 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30'
                            : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                        }`}>
                          {proof.method === 'MPESA' ? 'M-Pesa' : proof.method === 'EMOLA' ? 'e-Mola' : proof.method === 'MKESH' ? 'mKesh' : 'Banco'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">
                        <div className="text-slate-300 font-bold">{proof.referenceCode}</div>
                        {proof.operatorTxId && (
                          <div className="text-[10px] text-emerald-400 font-bold">
                            Op: {proof.operatorTxId}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {proof.receiptDataUrl ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProof(proof);
                              setReviewNotesInput(proof.reviewNotes || '');
                            }}
                            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-750 transition-colors group text-left"
                          >
                            <img
                              src={proof.receiptDataUrl}
                              alt="Comprovativo"
                              className="w-9 h-9 rounded object-cover border border-slate-700 group-hover:border-emerald-500 transition-colors shrink-0 bg-black"
                            />
                            <div className="max-w-[120px]">
                              <span className="text-[11px] font-bold text-slate-200 block truncate group-hover:text-emerald-400">
                                {proof.receiptFileName || 'Ver Imagem'}
                              </span>
                              <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                                <Eye className="w-3 h-3 text-emerald-400" />
                                <span>Ampliar</span>
                              </span>
                            </div>
                          </button>
                        ) : proof.receiptFileName ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProof(proof);
                              setReviewNotesInput(proof.reviewNotes || '');
                            }}
                            className="flex items-center gap-1.5 text-slate-300 hover:text-white"
                          >
                            <FileText className="w-4 h-4 text-slate-400" />
                            <span className="truncate max-w-[120px] underline">{proof.receiptFileName}</span>
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[11px] italic">Via SMS / App</span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          proof.status === 'APPROVED'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : proof.status === 'PENDING'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        }`}>
                          {proof.status === 'APPROVED' ? 'Aprovado' : proof.status === 'PENDING' ? 'Pendente' : 'Rejeitado'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProof(proof);
                            setReviewNotesInput(proof.reviewNotes || '');
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg border border-slate-700 text-xs transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Detalhes</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL: DETAILED PROOF INSPECTION ================= */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 text-white max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-extrabold text-white">
                  Auditoria de Comprovativo de Depósito
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProof(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Proof Image / Document View */}
            {selectedProof.receiptDataUrl ? (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-2">
                <span className="text-[11px] text-slate-400 block font-semibold">
                  Arquivo Anexado: {selectedProof.receiptFileName || 'Comprovativo de Pagamento'}
                </span>
                <div className="max-h-[50vh] overflow-auto flex items-center justify-center rounded-lg bg-black/40 p-2">
                  <img
                    src={selectedProof.receiptDataUrl}
                    alt="Comprovativo original"
                    className="max-h-[45vh] w-auto object-contain rounded border border-slate-800 shadow"
                  />
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <a
                    href={selectedProof.receiptDataUrl}
                    download={selectedProof.receiptFileName || 'comprovativo-zonabet.png'}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Descarregar Comprovativo</span>
                  </a>
                  <a
                    href={selectedProof.receiptDataUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                    <span>Abrir em Nova Aba</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <span>Nenhuma imagem ou talão digitalizado anexado. O depósito foi efetuado via canal de débito móvel instantâneo.</span>
              </div>
            )}

            {/* Detailed Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-sans block">Apostador:</span>
                <strong className="text-white font-sans">{selectedProof.userName}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-sans block">Contacto Celular:</span>
                <strong className="text-white">{selectedProof.userPhone}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-sans block">Montante Depositado:</span>
                <strong className="text-emerald-400 text-sm font-sans">
                  +{selectedProof.amount.toFixed(2)} MZN
                </strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-sans block">Método / Canal:</span>
                <strong className="text-amber-400 font-sans">{selectedProof.method}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-sans block">Referência do Sistema:</span>
                <strong className="text-slate-300">{selectedProof.referenceCode}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-sans block">Ref / ID da Operadora:</span>
                <strong className="text-emerald-300">{selectedProof.operatorTxId || 'Não informado'}</strong>
              </div>
            </div>

            {/* Notes submitted by user */}
            {selectedProof.notes && (
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">
                  Observação enviada pelo Apostador:
                </span>
                <p className="text-slate-200 italic font-sans">"{selectedProof.notes}"</p>
              </div>
            )}

            {/* Admin Review Notes & Actions */}
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Notas de Revisão da Administração:
                </label>
                <input
                  type="text"
                  value={reviewNotesInput}
                  onChange={(e) => setReviewNotesInput(e.target.value)}
                  placeholder="Ex: Talão verificado no extrato do Millennium BIM..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Estado Atual:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    selectedProof.status === 'APPROVED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : selectedProof.status === 'PENDING'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {selectedProof.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateProofStatus(selectedProof.id, 'APPROVED', reviewNotesInput)}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-xs transition-all shadow"
                  >
                    Aprovar Comprovativo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateProofStatus(selectedProof.id, 'REJECTED', reviewNotesInput)}
                    className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-bold rounded-lg text-xs transition-all border border-rose-500/30"
                  >
                    Rejeitar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateProofStatus(selectedProof.id, 'PENDING', reviewNotesInput)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-lg text-xs transition-all border border-slate-700"
                  >
                    Marcar Pendente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 8: SUPABASE CLOUD & BD ================= */}
      {activeTab === 'supabase' && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-base text-white">
                  Integração Supabase • Base de Dados em Nuvem
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Persistência remota segura, tabelas PostgreSQL, regras de segurança RLS e sincronização de apostadores e comprovativos.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchSupabaseInfo}
                disabled={loading}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
                <span>Testar Ligação</span>
              </button>

              <button
                onClick={handlePullFromSupabase}
                disabled={pullingSupabase}
                title="Puxar utilizadores, jogos e dados criados no Supabase"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${pullingSupabase ? 'animate-spin text-emerald-400' : ''}`} />
                <span>{pullingSupabase ? 'A Puxar...' : 'Importar do Supabase'}</span>
              </button>

              <button
                onClick={handleSyncToSupabase}
                disabled={syncingSupabase}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingSupabase ? 'animate-spin' : ''}`} />
                <span>{syncingSupabase ? 'A Sincronizar...' : 'Enviar para Supabase'}</span>
              </button>
            </div>
          </div>

          {/* Status & Diagnostics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Connection Status Card */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Estado da Conexão:</span>
                {supabaseStatus?.connected ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    CONECTADO (ONLINE)
                  </span>
                ) : supabaseStatus?.isConfigured ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    CONFIGURADO (PENDENTE)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    <HardDrive className="w-3 h-3 text-slate-400" />
                    MODO LOCAL / EM MEMÓRIA
                  </span>
                )}
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block font-mono">Endpoint Supabase:</span>
                <span className="text-xs font-bold text-slate-200 block truncate font-mono mt-0.5">
                  {supabaseStatus?.url || 'Não especificado no .env'}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Chave Anon:</span>
                <span className={supabaseStatus?.hasAnonKey ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {supabaseStatus?.hasAnonKey ? '✓ Detetada' : '✗ Ausente'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Service Role Key:</span>
                <span className={supabaseStatus?.hasServiceKey ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {supabaseStatus?.hasServiceKey ? '✓ Detetada' : '✗ Ausente'}
                </span>
              </div>
            </div>

            {/* Tables & Record Counts Card */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-2">
              <span className="text-xs font-bold text-slate-300 block mb-1">
                Registos Prontos para Sincronizar:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Utilizadores</span>
                  <span className="font-black text-white text-base">{users.length}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Jogos de Futebol</span>
                  <span className="font-black text-white text-base">{matches.length}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Apostas Realizadas</span>
                  <span className="font-black text-white text-base">{bets.length}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Comprovativos</span>
                  <span className="font-black text-emerald-400 text-base">{depositProofs.length}</span>
                </div>
              </div>
            </div>

            {/* Quick Instruction Guide */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/30 to-slate-800/80 border border-emerald-500/20 space-y-2.5">
              <span className="text-xs font-black text-emerald-400 block">
                Passo a Passo de Ligação:
              </span>
              <ol className="text-[11px] text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>Aceda a <strong>supabase.com</strong> e crie um projeto.</li>
                <li>Copie o <strong>Script SQL</strong> abaixo e execute-o no <strong>SQL Editor</strong>.</li>
                <li>Copie o URL e Chave do Projeto para o seu ficheiro <code>.env</code>.</li>
                <li>Clique em <strong>Sincronizar Dados</strong> para migrar tudo instantaneamente.</li>
              </ol>
            </div>
          </div>

          {/* Diagnostic Note / Error */}
          {supabaseStatus?.error && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Aviso de Diagnóstico:</span>
                <span>{supabaseStatus.error}</span>
              </div>
            </div>
          )}

          {/* SQL Schema Viewer & Copy Action */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-3.5 sm:p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">
                  Script SQL de Inicialização do Supabase (schema.sql)
                </span>
              </div>

              <button
                onClick={handleCopySql}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copiado!' : 'Copiar Script SQL'}</span>
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto font-mono text-[11px] text-slate-300 bg-slate-950 leading-relaxed select-all">
              <pre className="whitespace-pre-wrap">{supabaseSchemaSql || '-- Carregando schema...'}</pre>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 1: CREATE MATCH ================= */}
      {showCreateMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-extrabold flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                Criar Novo Jogo de Futebol
              </h2>
              <button onClick={() => setShowCreateMatch(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMatch} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Competição / Campeonato (Exclusivo Moçambique)</label>
                <select
                  value={newCompetitionId}
                  onChange={(e) => setNewCompetitionId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <optgroup label="🇲🇿 Campeonato Nacional">
                    {competitions.filter((c) => c.category === 'MOCAMBOLA' || c.code === 'MOC' || c.name.includes('Moçambola')).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.country})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="📍 Campeonatos Provinciais">
                    {competitions.filter((c) => c.category === 'PROVINCIAL' || c.name.includes('Provincial')).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.country})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🏟️ Campeonatos Distritais">
                    {competitions.filter((c) => c.category === 'DISTRITAL' || c.name.includes('Distrital')).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.country})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Equipa da Casa (1)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Ferroviário da Beira"
                    value={newHomeTeam}
                    onChange={(e) => setNewHomeTeam(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Equipa Visitante (2)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Black Bulls"
                    value={newAwayTeam}
                    onChange={(e) => setNewAwayTeam(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Quick Club Suggestions */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-400">Sugestões de Clubes Populares:</span>
                  <span className="text-[10px] text-slate-500">Clique para preencher</span>
                </div>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
                  {[
                    'Costa do Sol',
                    'Ferroviário de Maputo',
                    'Ferroviário da Beira',
                    'Black Bulls',
                    'UD Songo',
                    'Desportivo de Nacala',
                    'Textáfrica',
                    'Ferroviário de Nampula',
                    'Brera Tchumene',
                    'Baía de Pemba',
                    'Ferroviário de Lichinga',
                    'Ferroviário de Muanza',
                  ].map((team) => (
                    <button
                      key={team}
                      type="button"
                      onClick={() => {
                        if (!newHomeTeam) {
                          setNewHomeTeam(team);
                        } else if (!newAwayTeam && newHomeTeam !== team) {
                          setNewAwayTeam(team);
                        } else {
                          setNewHomeTeam(team);
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] transition-colors"
                    >
                      + {team}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Data do Jogo</label>
                  <input
                    type="date"
                    required
                    value={newKickoffDate}
                    onChange={(e) => setNewKickoffDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                  {/* Quick date presets */}
                  <div className="flex items-center gap-1.5 mt-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setNewKickoffDate(new Date().toISOString().split('T')[0])}
                      className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded border border-slate-700"
                    >
                      Hoje
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 1);
                        setNewKickoffDate(d.toISOString().split('T')[0]);
                      }}
                      className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded border border-slate-700"
                    >
                      Amanhã
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        const day = d.getDay();
                        const diff = (6 - day + 7) % 7 || 7;
                        d.setDate(d.getDate() + diff);
                        setNewKickoffDate(d.toISOString().split('T')[0]);
                      }}
                      className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded border border-slate-700"
                    >
                      Sábado
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Hora de Início</label>
                  <input
                    type="time"
                    required
                    value={newKickoffTime}
                    onChange={(e) => setNewKickoffTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* 1X2 Odds */}
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 space-y-2">
                <span className="font-extrabold text-white block">Odds Iniciais 1X2</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Vitória Casa (1)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1.01"
                      max="100.0"
                      required
                      value={newOddHome}
                      onChange={(e) => setNewOddHome(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 font-bold text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Empate (X)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1.01"
                      max="100.0"
                      required
                      value={newOddDraw}
                      onChange={(e) => setNewOddDraw(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 font-bold text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Vitória Fora (2)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1.01"
                      max="100.0"
                      required
                      value={newOddAway}
                      onChange={(e) => setNewOddAway(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 font-bold text-cyan-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Estado Inicial</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="OPEN">ABERTO (Apostas disponíveis imediatamente)</option>
                  <option value="DRAFT">RASCUNHO (Não visível aos apostadores)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Observações (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Estádio do Chiveve, Beira"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20"
              >
                REGISTAR & PUBLICAR JOGO
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: EDIT ODDS ================= */}
      {showOddsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 text-white max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-extrabold">Alterar Odds: {showOddsModal.homeTeam} vs {showOddsModal.awayTeam}</h2>
              <button onClick={() => setShowOddsModal(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateOdds} className="space-y-4">
              <p className="text-xs text-slate-400">
                Aviso: As novas odds serão aplicadas apenas a novas apostas. As apostas já registadas mantêm as odds congeladas do momento da aposta.
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Casa (1)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1.01"
                    required
                    value={editHome}
                    onChange={(e) => setEditHome(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 font-black text-emerald-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Empate (X)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1.01"
                    required
                    value={editDraw}
                    onChange={(e) => setEditDraw(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 font-black text-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Fora (2)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1.01"
                    required
                    value={editAway}
                    onChange={(e) => setEditAway(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 font-black text-cyan-400 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm"
              >
                GRAVAR NOVAS ODDS
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: SETTLE RESULT ================= */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 text-white max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-extrabold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-cyan-400" />
                Liquidar Jogo & Pagar Apostas
              </h2>
              <button onClick={() => setShowResultModal(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSettleResult} className="space-y-4">
              <p className="text-xs text-slate-300">
                Confronto: <strong>{showResultModal.homeTeam}</strong> vs <strong>{showResultModal.awayTeam}</strong>
              </p>

              <div className="grid grid-cols-2 gap-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                <div>
                  <label className="block text-xs font-bold text-emerald-400 mb-1">Golos {showResultModal.homeTeam}</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    required
                    value={homeScore}
                    onChange={(e) => setHomeScore(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-center text-2xl font-black text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-cyan-400 mb-1">Golos {showResultModal.awayTeam}</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    required
                    value={awayScore}
                    onChange={(e) => setAwayScore(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-center text-2xl font-black text-white"
                  />
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-xs text-amber-300">
                <p className="font-bold">Aviso de Liquidação Atómica:</p>
                <p className="text-[11px] mt-0.5">
                  Ao confirmar, o sistema liquidará todas as apostas correspondentes, creditando imediatamente os valores ganhos nas carteiras dos utilizadores de forma irreversível.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/20"
              >
                CONFIRMAR RESULTADO E LIQUIDAR APOSTAS
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: CANCEL MATCH ================= */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 text-white max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-extrabold text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Cancelar Jogo & Anular Apostas (VOID)
              </h2>
              <button onClick={() => setShowCancelModal(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCancelMatch} className="space-y-4">
              <p className="text-xs text-slate-300">
                Deseja cancelar <strong>{showCancelModal.homeTeam} vs {showCancelModal.awayTeam}</strong>? Todas as apostas simples serão marcadas como <em>VOID</em> e os montantes investidos serão 100% devolvidos aos utilizadores.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Motivo do Cancelamento (Obrigatório)</label>
                <input
                  type="text"
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-rose-500 hover:bg-rose-400 text-white font-black rounded-xl text-sm"
              >
                CONFIRMAR CANCELAMENTO E REEMBOLSO
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: ADJUST BALANCE (SUPER ADMIN) ================= */}
      <AdjustBalanceModal
        user={showAdjustModal}
        isOpen={!!showAdjustModal}
        onClose={() => setShowAdjustModal(null)}
        onSuccess={(msg) => {
          notifySuccess(msg);
          loadData();
        }}
      />

      {/* ================= MODAL 6: USER DETAIL & RISK CONTROL ================= */}
      <UserDetailModal
        user={showUserDetailModal}
        isOpen={!!showUserDetailModal}
        onClose={() => setShowUserDetailModal(null)}
        onAdjustBalance={(u) => {
          setShowUserDetailModal(null);
          setShowAdjustModal(u);
        }}
        onUserUpdated={loadData}
      />

      {/* ================= MODAL 7: CONFIRM DELETE MATCH ================= */}
      {matchToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-extrabold text-base text-white">Excluir Jogo Permanentemente</h3>
              </div>
              <button
                onClick={() => setMatchToDelete(null)}
                disabled={isDeletingMatch}
                className="p-1 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Tem a certeza que deseja remover este jogo da base de dados? Esta ação é irreversível e o confronto não estará mais visível para apostas.
              </p>

              <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1.5">
                <div className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">
                  {matchToDelete.competitionName}
                </div>
                <div className="text-sm font-extrabold text-white">
                  {matchToDelete.homeTeam} <span className="text-slate-400 font-normal">vs</span> {matchToDelete.awayTeam}
                </div>
                <div className="text-[11px] text-slate-400">
                  Data: {matchToDelete.kickoffDate} às {matchToDelete.kickoffTime} • Estado: <span className="font-bold text-slate-300">{matchToDelete.status}</span>
                </div>
              </div>

              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-300">
                <strong>Atenção:</strong> Se existirem apostas pendentes neste jogo, elas serão mantidas no histórico mas o mercado não poderá ser liquidado automaticamente.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setMatchToDelete(null)}
                disabled={isDeletingMatch}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMatch}
                disabled={isDeletingMatch}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl shadow-lg shadow-rose-600/20 flex items-center gap-1.5 transition-all"
              >
                {isDeletingMatch ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>A Excluir...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirmar Exclusão</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 8: RESET PASSWORD ================= */}
      {userToResetPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400">
                <Key className="w-5 h-5" />
                <h3 className="font-extrabold text-base text-white">Redefinir Palavra-passe</h3>
              </div>
              <button
                onClick={() => setUserToResetPassword(null)}
                disabled={isResettingPassword}
                className="p-1 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Defina uma nova palavra-passe temporária para o apostador aceder à sua conta.
              </p>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Utilizador:</span>
                  <span className="font-bold text-white">{userToResetPassword.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-mono text-slate-200">{userToResetPassword.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Telemóvel:</span>
                  <span className="font-mono text-slate-200">{userToResetPassword.phone}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Nova Palavra-passe Temporária:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempPasswordInput}
                    onChange={(e) => setTempPasswordInput(e.target.value)}
                    placeholder="Ex: Zona123!"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(tempPasswordInput);
                      setCopiedTempPassword(true);
                      setTimeout(() => setCopiedTempPassword(false), 2500);
                    }}
                    title="Copiar para partilhar com o cliente"
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors flex-shrink-0"
                  >
                    {copiedTempPassword ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                  <span>Sugestões rápidas:</span>
                  <button
                    type="button"
                    onClick={() => setTempPasswordInput('Zona123!')}
                    className="hover:text-cyan-400 underline"
                  >
                    Zona123!
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setTempPasswordInput('Mocambique2025!')}
                    className="hover:text-cyan-400 underline"
                  >
                    Mocambique2025!
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setTempPasswordInput('BeiraWinner99#')}
                    className="hover:text-cyan-400 underline"
                  >
                    BeiraWinner99#
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setUserToResetPassword(null)}
                disabled={isResettingPassword}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmResetPassword}
                disabled={isResettingPassword}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition-all"
              >
                {isResettingPassword ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>A Gravar...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5" />
                    <span>Gravar Nova Palavra-passe</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
