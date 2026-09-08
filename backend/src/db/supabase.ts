import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { dbStore } from './store.ts';
import { User, Wallet, WalletTransaction, Match, Bet, DepositProof, AuditLog } from '../types/index.ts';

dotenv.config();

export interface SupabaseStatus {
  isConfigured: boolean;
  connected: boolean;
  realtimeEnabled: boolean;
  autoSyncActive: boolean;
  url: string | null;
  hasServiceKey: boolean;
  hasAnonKey: boolean;
  error?: string | null;
  tables?: {
    users: number;
    wallets: number;
    matches: number;
    bets: number;
    transactions: number;
    depositProofs: number;
    auditLogs: number;
  };
}

class SupabaseService {
  private client: SupabaseClient | null = null;
  private url: string | null = null;
  private key: string | null = null;
  private autoSyncInterval: NodeJS.Timeout | null = null;
  private isAutoSyncing: boolean = false;

  constructor() {
    this.init();
    this.startPeriodicSync();
  }

  public init() {
    this.url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || null;
    this.key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      null;

    if (this.url && this.key && this.url.startsWith('http')) {
      try {
        this.client = createClient(this.url, this.key, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
        console.log(`[Supabase] Conectado ao endpoint em tempo real: ${this.url}`);
      } catch (err) {
        console.error('[Supabase] Erro ao inicializar cliente:', err);
        this.client = null;
      }
    } else {
      console.log('[Supabase] Modo local/em memória ativo com fila de sincronização em tempo real pronta para quando as chaves forem fornecidas.');
    }
  }

  public getClient(): SupabaseClient | null {
    if (!this.client) {
      this.init();
    }
    return this.client;
  }

  public isAvailable(): boolean {
    return Boolean(this.getClient());
  }

  /**
   * Ciclo de sincronização automática de fundo (executa a cada 60 segundos)
   */
  private startPeriodicSync() {
    if (this.autoSyncInterval) return;
    this.autoSyncInterval = setInterval(async () => {
      if (this.isAvailable() && !this.isAutoSyncing) {
        try {
          this.isAutoSyncing = true;
          await this.syncLocalDataToSupabase();
        } catch (e) {
          // Ignorar erros silenciosos no ciclo de fundo
        } finally {
          this.isAutoSyncing = false;
        }
      }
    }, 60000);
  }

  public async getStatus(): Promise<SupabaseStatus> {
    const isConfigured = Boolean(this.url && this.key && this.url.startsWith('http'));
    if (!isConfigured || !this.client) {
      return {
        isConfigured: false,
        connected: false,
        realtimeEnabled: true,
        autoSyncActive: true,
        url: this.url || null,
        hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        hasAnonKey: Boolean(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
        error: 'Chaves de ligação ao Supabase não configuradas no ficheiro .env. O sistema está a gravar localmente e sincronizará automaticamente assim que as chaves forem inseridas.',
        tables: {
          users: Array.from(dbStore.users.values()).length,
          wallets: Array.from(dbStore.wallets.values()).length,
          matches: dbStore.getMatches().length,
          bets: Array.from(dbStore.bets.values()).length,
          transactions: dbStore.transactions.length,
          depositProofs: dbStore.depositProofs.length,
          auditLogs: dbStore.auditLogs.length,
        },
      };
    }

    try {
      const { error } = await this.client.from('users').select('id', { count: 'exact', head: true });
      if (error) {
        return {
          isConfigured: true,
          connected: false,
          realtimeEnabled: true,
          autoSyncActive: true,
          url: this.url,
          hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
          hasAnonKey: Boolean(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
          error: `Erro ao aceder à tabela 'users': ${error.message}. Execute o script SQL no editor do Supabase.`,
        };
      }

      return {
        isConfigured: true,
        connected: true,
        realtimeEnabled: true,
        autoSyncActive: true,
        url: this.url,
        hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        hasAnonKey: Boolean(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
        tables: {
          users: Array.from(dbStore.users.values()).length,
          wallets: Array.from(dbStore.wallets.values()).length,
          matches: dbStore.getMatches().length,
          bets: Array.from(dbStore.bets.values()).length,
          transactions: dbStore.transactions.length,
          depositProofs: dbStore.depositProofs.length,
          auditLogs: dbStore.auditLogs.length,
        },
      };
    } catch (err: any) {
      return {
        isConfigured: true,
        connected: false,
        realtimeEnabled: true,
        autoSyncActive: true,
        url: this.url,
        hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        hasAnonKey: Boolean(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
        error: err.message || 'Falha ao ligar ao Supabase',
      };
    }
  }

  // =========================================================================
  // GATILHOS DE SINCRONIZAÇÃO AUTOMÁTICA EM TEMPO REAL (REAL-TIME SYNC HOOKS)
  // Chamados imediatamente em cada operação (registo, aposta, depósito, etc.)
  // =========================================================================

  public async syncUserRealtime(user: User): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.from('users').upsert({
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email || null,
        password_hash: user.passwordHash,
        role: user.role,
        is_blocked: user.isBlocked,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      }, { onConflict: 'id' });
    } catch (err) {
      console.warn('[Supabase Realtime Sync] Erro ao sincronizar utilizador:', err);
    }
  }

  public async syncWalletRealtime(wallet: Wallet): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.from('wallets').upsert({
        user_id: wallet.userId,
        balance: wallet.balance,
        currency: 'MZN',
        updated_at: wallet.updatedAt,
      }, { onConflict: 'user_id' });
    } catch (err) {
      console.warn('[Supabase Realtime Sync] Erro ao sincronizar carteira:', err);
    }
  }

  public async syncTransactionRealtime(tx: WalletTransaction): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.from('wallet_transactions').upsert({
        id: tx.id,
        user_id: tx.userId,
        type: tx.type,
        amount: tx.amount,
        balance_before: tx.previousBalance,
        balance_after: tx.nextBalance,
        reference: tx.reference,
        notes: tx.description || null,
        status: tx.status,
        created_at: tx.createdAt,
      }, { onConflict: 'id' });
    } catch (err) {
      console.warn('[Supabase Realtime Sync] Erro ao sincronizar transação:', err);
    }
  }

  public async syncMatchRealtime(match: Match): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.from('matches').upsert({
        id: match.id,
        competition_id: match.competitionId,
        competition_name: match.competitionName,
        competition_category: match.competitionCategory,
        home_team: match.homeTeam,
        away_team: match.awayTeam,
        kickoff_date: match.kickoffDate,
        kickoff_time: match.kickoffTime,
        status: match.status,
        home_score: match.homeScore ?? null,
        away_score: match.awayScore ?? null,
        markets: match.markets,
        created_at: match.createdAt,
        updated_at: match.updatedAt,
      }, { onConflict: 'id' });
    } catch (err) {
      console.warn('[Supabase Realtime Sync] Erro ao sincronizar jogo:', err);
    }
  }

  public async deleteMatchRealtime(matchId: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.from('matches').delete().eq('id', matchId);
    } catch (err) {
      console.warn('[Supabase Realtime Sync] Erro ao excluir jogo:', err);
    }
  }

  public async syncBetRealtime(bet: Bet): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.from('bets').upsert({
        id: bet.id,
        user_id: bet.userId,
        stake: bet.stake,
        total_odds: bet.totalOdds,
        potential_win: bet.potentialReturn,
        actual_payout: bet.status === 'WON' ? bet.potentialReturn : 0,
        status: bet.status,
        type: bet.type,
        selections: bet.items,
        placed_at: bet.createdAt,
        settled_at: bet.settledAt || null,
      }, { onConflict: 'id' });
    } catch (err) {
      console.warn('[Supabase Realtime Sync] Erro ao sincronizar aposta:', err);
    }
  }

  public async syncDepositProofRealtime(proof: DepositProof): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.from('deposit_proofs').upsert({
        id: proof.id,
        user_id: proof.userId,
        user_name: proof.userName,
        user_phone: proof.userPhone,
        amount: proof.amount,
        method: proof.method,
        reference_code: proof.referenceCode,
        operator_tx_id: proof.operatorTxId || null,
        receipt_data_url: proof.receiptDataUrl || null,
        receipt_file_name: proof.receiptFileName || null,
        notes: proof.notes || null,
        status: proof.status,
        review_notes: proof.reviewNotes || null,
        created_at: proof.createdAt,
        reviewed_at: proof.updatedAt || null,
      }, { onConflict: 'id' });
    } catch (err) {
      console.warn('[Supabase Realtime Sync] Erro ao sincronizar comprovativo:', err);
    }
  }

  public async syncAuditLogRealtime(log: AuditLog): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.from('audit_logs').upsert({
        id: log.id,
        user_id: log.adminId || null,
        action: log.action,
        target_type: log.entity,
        target_id: log.entityId || null,
        details: {
          adminEmail: log.adminEmail,
          oldValue: log.oldValue,
          newValue: log.newValue,
          ip: log.ip,
        },
        created_at: log.timestamp,
      }, { onConflict: 'id' });
    } catch (err) {
      console.warn('[Supabase Realtime Sync] Erro ao sincronizar registo de auditoria:', err);
    }
  }

  /**
   * Sincroniza integralmente todos os dados locais para o Supabase (users, wallets, matches, bets, transactions, deposit_proofs, audit_logs)
   */
  public async syncLocalDataToSupabase(): Promise<{ success: boolean; message: string; details?: any }> {
    if (!this.client) {
      return {
        success: false,
        message: 'Supabase não está configurado no ficheiro .env. Insira SUPABASE_URL e SUPABASE_ANON_KEY.',
      };
    }

    try {
      // 1. Sync Competitions
      const comps = dbStore.competitions.map((c) => ({
        id: c.id,
        name: c.name,
        country: c.country,
        code: c.code,
        category: c.category,
      }));
      if (comps.length > 0) {
        await this.client.from('competitions').upsert(comps, { onConflict: 'id' });
      }

      // 2. Sync Users
      const users = Array.from(dbStore.users.values()).map((u) => ({
        id: u.id,
        phone: u.phone,
        name: u.name,
        email: u.email || null,
        password_hash: u.passwordHash,
        role: u.role,
        is_blocked: u.isBlocked,
        created_at: u.createdAt,
        updated_at: u.updatedAt,
      }));
      if (users.length > 0) {
        await this.client.from('users').upsert(users, { onConflict: 'id' });
      }

      // 3. Sync Wallets
      const wallets = Array.from(dbStore.wallets.values()).map((w) => ({
        user_id: w.userId,
        balance: w.balance,
        currency: 'MZN',
        updated_at: w.updatedAt,
      }));
      if (wallets.length > 0) {
        await this.client.from('wallets').upsert(wallets, { onConflict: 'user_id' });
      }

      // 4. Sync Wallet Transactions
      const txs = dbStore.transactions.map((tx) => ({
        id: tx.id,
        user_id: tx.userId,
        type: tx.type,
        amount: tx.amount,
        balance_before: tx.previousBalance,
        balance_after: tx.nextBalance,
        reference: tx.reference,
        notes: tx.description || null,
        status: tx.status,
        created_at: tx.createdAt,
      }));
      if (txs.length > 0) {
        await this.client.from('wallet_transactions').upsert(txs, { onConflict: 'id' });
      }

      // 5. Sync Matches
      const matches = dbStore.getMatches().map((m) => ({
        id: m.id,
        competition_id: m.competitionId,
        competition_name: m.competitionName,
        competition_category: m.competitionCategory,
        home_team: m.homeTeam,
        away_team: m.awayTeam,
        kickoff_date: m.kickoffDate,
        kickoff_time: m.kickoffTime,
        status: m.status,
        home_score: m.homeScore ?? null,
        away_score: m.awayScore ?? null,
        markets: m.markets,
        created_at: m.createdAt,
        updated_at: m.updatedAt,
      }));
      if (matches.length > 0) {
        await this.client.from('matches').upsert(matches, { onConflict: 'id' });
      }

      // 6. Sync Bets
      const bets = Array.from(dbStore.bets.values()).map((b) => ({
        id: b.id,
        user_id: b.userId,
        stake: b.stake,
        total_odds: b.totalOdds,
        potential_win: b.potentialReturn,
        actual_payout: b.status === 'WON' ? b.potentialReturn : 0,
        status: b.status,
        type: b.type,
        selections: b.items,
        placed_at: b.createdAt,
        settled_at: b.settledAt || null,
      }));
      if (bets.length > 0) {
        await this.client.from('bets').upsert(bets, { onConflict: 'id' });
      }

      // 7. Sync Deposit Proofs
      const proofs = dbStore.depositProofs.map((p) => ({
        id: p.id,
        user_id: p.userId,
        user_name: p.userName,
        user_phone: p.userPhone,
        amount: p.amount,
        method: p.method,
        reference_code: p.referenceCode,
        operator_tx_id: p.operatorTxId || null,
        receipt_data_url: p.receiptDataUrl || null,
        receipt_file_name: p.receiptFileName || null,
        notes: p.notes || null,
        status: p.status,
        review_notes: p.reviewNotes || null,
        created_at: p.createdAt,
        reviewed_at: p.updatedAt || null,
      }));
      if (proofs.length > 0) {
        await this.client.from('deposit_proofs').upsert(proofs, { onConflict: 'id' });
      }

      // 8. Sync Audit Logs
      const logs = dbStore.auditLogs.map((l) => ({
        id: l.id,
        user_id: l.adminId || null,
        action: l.action,
        target_type: l.entity,
        target_id: l.entityId || null,
        details: {
          adminEmail: l.adminEmail,
          oldValue: l.oldValue,
          newValue: l.newValue,
          ip: l.ip,
        },
        created_at: l.timestamp,
      }));
      if (logs.length > 0) {
        await this.client.from('audit_logs').upsert(logs, { onConflict: 'id' });
      }

      return {
        success: true,
        message: `Migração e Sincronização em Tempo Real concluídas com sucesso! ${comps.length} competições, ${users.length} utilizadores, ${matches.length} jogos, ${bets.length} apostas, ${txs.length} transações e ${proofs.length} comprovativos foram migrados para o Supabase.`,
        details: {
          competitions: comps.length,
          users: users.length,
          wallets: wallets.length,
          matches: matches.length,
          bets: bets.length,
          transactions: txs.length,
          depositProofs: proofs.length,
          auditLogs: logs.length,
        },
      };
    } catch (err: any) {
      console.error('[Supabase Sync Error]:', err);
      return {
        success: false,
        message: `Erro na sincronização: ${err.message}. Verifique se executou o script SQL das tabelas no Supabase.`,
      };
    }
  }
}

export const supabaseService = new SupabaseService();
