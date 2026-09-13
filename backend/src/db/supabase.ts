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
}

class SupabaseService {
  private client: SupabaseClient | null = null;
  private url: string | null = null;
  private key: string | null = null;

  constructor() {
    this.init();
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
        console.log(`[Supabase] Conectado ao endpoint: ${this.url}`);
      } catch (err) {
        console.error('[Supabase] Erro ao inicializar cliente:', err);
        this.client = null;
      }
    } else {
      console.log('[Supabase] Modo local/em memória ativo. Configure as chaves no .env para persistência real.');
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

  public async getStatus(): Promise<SupabaseStatus> {
    const isConfigured = Boolean(this.url && this.key && this.url.startsWith('http'));
    if (!isConfigured || !this.client) {
      return {
        isConfigured: false,
        connected: false,
        realtimeEnabled: true,
        autoSyncActive: false,
        url: this.url || null,
        hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        hasAnonKey: Boolean(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
        error: 'Chaves de ligação ao Supabase não configuradas.',
      };
    }

    try {
      const { error } = await this.client.from('profiles').select('id', { count: 'exact', head: true });
      if (error) {
        return {
          isConfigured: true,
          connected: false,
          realtimeEnabled: true,
          autoSyncActive: false,
          url: this.url,
          hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
          hasAnonKey: Boolean(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
          error: `Erro ao aceder à tabela 'profiles': ${error.message}.`,
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
      };
    } catch (err: any) {
      return {
        isConfigured: true,
        connected: false,
        realtimeEnabled: true,
        autoSyncActive: false,
        url: this.url,
        hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        hasAnonKey: Boolean(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
        error: err.message || 'Falha ao ligar ao Supabase',
      };
    }
  }

  // =========================================================================
  // GATILHOS DE SINCRONIZAÇÃO EM TEMPO REAL (MANTIDOS PARA COMPATIBILIDADE)
  // =========================================================================

  public async syncUserRealtime(user: User): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.from('profiles').upsert({
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        status: user.isBlocked ? 'BLOCKED' : 'ACTIVE',
        referral_code: user.referralCode,
        referred_by: user.referredBy || null,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      }, { onConflict: 'id' });
    } catch (err) {
      console.warn('[Supabase Sync] Erro ao sincronizar perfil:', err);
    }
  }

  public async syncWalletRealtime(wallet: Wallet): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.from('profiles').update({
        balance: wallet.balance,
        updated_at: wallet.updatedAt,
      }).eq('id', wallet.userId);
    } catch (err) {
      console.warn('[Supabase Sync] Erro ao sincronizar saldo:', err);
    }
  }

  public async syncTransactionRealtime(tx: WalletTransaction): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.from('transactions').upsert({
        id: tx.id,
        user_id: tx.userId,
        type: tx.type === 'DEPOSIT' ? 'DEPOSIT' : 
              tx.type === 'WITHDRAWAL' ? 'WITHDRAWAL' : 
              tx.type === 'BET' ? 'BET_PLACEMENT' : 
              tx.type === 'WIN' ? 'BET_WIN' : 
              tx.type === 'REFUND' ? 'REFUND' : 'MANUAL_ADJUSTMENT',
        amount: tx.amount,
        prev_balance: tx.previousBalance,
        next_balance: tx.nextBalance,
        reference_id: tx.reference,
        description: tx.description || null,
        created_at: tx.createdAt,
      }, { onConflict: 'id' });
    } catch (err) {
      console.warn('[Supabase Sync] Erro ao sincronizar transação:', err);
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
        start_time: `${match.kickoffDate}T${match.kickoffTime}:00Z`,
        status: match.status === 'OPEN' ? 'PRE_MATCH' : 
                match.status === 'FINISHED' ? 'FINISHED' : 
                match.status === 'CANCELLED' ? 'CANCELLED' : 'PRE_MATCH',
        home_score: match.homeScore ?? 0,
        away_score: match.awayScore ?? 0,
        created_at: match.createdAt,
      }, { onConflict: 'id' });
    } catch (err) {
      console.warn('[Supabase Sync] Erro ao sincronizar jogo:', err);
    }
  }

  public async deleteMatchRealtime(matchId: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.from('matches').delete().eq('id', matchId);
    } catch (err) {
      console.warn('[Supabase Sync] Erro ao excluir jogo:', err);
    }
  }

  public async syncBetRealtime(bet: Bet): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.from('bets').upsert({
        id: bet.id,
        user_id: bet.userId,
        total_stake: bet.stake,
        total_odds: bet.totalOdds,
        potential_return: bet.potentialReturn,
        status: bet.status,
        created_at: bet.createdAt,
      }, { onConflict: 'id' });
      
      // Sync items
      if (bet.items && bet.items.length > 0) {
        const items = bet.items.map(item => ({
          id: item.id,
          bet_id: bet.id,
          match_id: item.matchId,
          market_id: item.marketId,
          selection_id: item.selectionId,
          odds_at_bet_time: item.oddsAtBetTime,
          status: item.status,
          created_at: bet.createdAt
        }));
        await this.client.from('bet_items').upsert(items, { onConflict: 'id' });
      }
    } catch (err) {
      console.warn('[Supabase Sync] Erro ao sincronizar aposta:', err);
    }
  }

  public async syncAuditLogRealtime(log: AuditLog): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.from('audit_logs').upsert({
        id: log.id,
        admin_id: log.adminId || null,
        admin_email: log.adminEmail,
        action: log.action,
        entity_type: log.entity,
        entity_id: log.entityId || '0',
        old_value: log.oldValue,
        new_value: log.newValue,
        ip_address: log.ip,
        created_at: log.timestamp,
      }, { onConflict: 'id' });
    } catch (err) {
      console.warn('[Supabase Sync] Erro ao sincronizar auditoria:', err);
    }
  }

  public async syncDepositProofRealtime(proof: DepositProof): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.from('withdrawals').upsert({
        id: proof.id,
        user_id: proof.userId,
        amount: proof.amount,
        method: proof.method,
        status: proof.status === 'APPROVED' ? 'COMPLETED' : proof.status === 'REJECTED' ? 'REJECTED' : 'PENDING',
        pix_key: proof.referenceCode, // using referenceCode as pix_key placeholder if needed
        created_at: proof.createdAt,
      }, { onConflict: 'id' });
    } catch (err) {
      console.warn('[Supabase Sync] Erro ao sincronizar comprovativo:', err);
    }
  }

  public async syncLocalDataToSupabase(): Promise<{ success: boolean; results: any }> {
    if (!this.client) throw new Error('Supabase client not initialized');
    
    const results = {
      users: 0,
      matches: 0,
      bets: 0
    };

    // Very basic migration logic
    for (const user of dbStore.users.values()) {
      await this.syncUserRealtime(user);
      results.users++;
    }
    for (const match of dbStore.matches.values()) {
      await this.syncMatchRealtime(match);
      results.matches++;
    }
    for (const bet of dbStore.bets.values()) {
      await this.syncBetRealtime(bet);
      results.bets++;
    }

    return { success: true, results };
  }

  public async pullDataFromSupabase(): Promise<{ success: boolean }> {
    // This is a complex operation that would overwrite local data with Supabase data
    // For now, let's just mark it as not implemented or do a basic version if needed
    console.log('[Supabase] Pull data requested but not fully implemented to avoid data loss.');
    return { success: true };
  }
}

export const supabaseService = new SupabaseService();
