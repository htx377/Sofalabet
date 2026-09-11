import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { db } from '../db/store.ts';
import { MatchService } from '../services/matchService.ts';
import { SettlementService } from '../services/settlementService.ts';
import { WalletService } from '../services/walletService.ts';
import { AuditService } from '../services/auditService.ts';
import {
  createMatchSchema,
  updateOddsSchema,
  updateMatchStatusSchema,
  matchResultSchema,
  balanceAdjustmentSchema,
} from '../validators/schemas.ts';
import { Money } from '../utils/money.ts';
import { supabaseService } from '../db/supabase.ts';

export class AdminController {
  static getDashboardStats(req: AuthenticatedRequest, res: Response): void {
    const totalUsers = Array.from(db.users.values()).filter((u) => u.role === 'USER').length;
    const allMatches = Array.from(db.matches.values());
    const activeMatches = allMatches.filter((m) => m.status === 'OPEN').length;
    const finishedMatches = allMatches.filter((m) => m.status === 'FINISHED').length;

    const allBets = Array.from(db.bets.values());
    const pendingBets = allBets.filter((b) => b.status === 'PENDING').length;
    const wonBets = allBets.filter((b) => b.status === 'WON').length;
    const lostBets = allBets.filter((b) => b.status === 'LOST').length;

    let totalBetVolume = 0;
    for (const b of allBets) {
      totalBetVolume = Money.add(totalBetVolume, b.stake);
    }

    let totalDisbursedPayout = 0;
    for (const b of allBets) {
      if (b.status === 'WON') {
        totalDisbursedPayout = Money.add(totalDisbursedPayout, b.potentialReturn);
      }
    }

    let totalBalanceMoved = 0;
    for (const tx of db.transactions) {
      totalBalanceMoved = Money.add(totalBalanceMoved, Math.abs(tx.amount));
    }

    res.status(200).json({
      stats: {
        totalUsers,
        activeMatches,
        finishedMatches,
        pendingBets,
        wonBets,
        lostBets,
        totalBetVolume,
        totalDisbursedPayout,
        totalBalanceMoved,
        totalTransactions: db.transactions.length,
      },
    });
  }

  static createMatch(req: AuthenticatedRequest, res: Response): void {
    if (!req.user) return;
    const parse = createMatchSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0].message });
      return;
    }

    try {
      const match = MatchService.createMatch({
        adminId: req.user.userId,
        adminEmail: req.user.email,
        competitionId: parse.data.competitionId,
        homeTeam: parse.data.homeTeam,
        awayTeam: parse.data.awayTeam,
        kickoffDate: parse.data.kickoffDate,
        kickoffTime: parse.data.kickoffTime,
        description: parse.data.description,
        odds: parse.data.odds,
        ip: req.ip,
      });

      res.status(201).json({ message: 'Jogo criado com sucesso!', match });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static updateOdds(req: AuthenticatedRequest, res: Response): void {
    if (!req.user) return;
    const { id } = req.params;
    const parse = updateOddsSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0].message });
      return;
    }

    try {
      const match = MatchService.updateOdds({
        adminId: req.user.userId,
        adminEmail: req.user.email,
        matchId: id,
        odds: parse.data.odds,
        ip: req.ip,
      });

      res.status(200).json({ message: 'Odds atualizadas com sucesso!', match });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static updateMatchStatus(req: AuthenticatedRequest, res: Response): void {
    if (!req.user) return;
    const { id } = req.params;
    const parse = updateMatchStatusSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0].message });
      return;
    }

    try {
      const match = MatchService.updateStatus({
        adminId: req.user.userId,
        adminEmail: req.user.email,
        matchId: id,
        status: parse.data.status,
        reason: parse.data.reason,
        ip: req.ip,
      });

      res.status(200).json({ message: `Estado do jogo atualizado para ${match.status}`, match });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async enterResult(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) return;
    const { id } = req.params;
    const parse = matchResultSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0].message });
      return;
    }

    try {
      const settlement = await SettlementService.settleMatch({
        adminId: req.user.userId,
        adminEmail: req.user.email,
        matchId: id,
        homeScore: parse.data.homeScore,
        awayScore: parse.data.awayScore,
        ip: req.ip,
      });

      res.status(200).json({
        message: 'Resultado registado e apostas liquidadas com sucesso!',
        settlement,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async cancelMatch(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) return;
    const { id } = req.params;
    const reason = req.body.reason || 'Jogo cancelado por decisão administrativa';

    try {
      const result = await SettlementService.cancelMatch({
        adminId: req.user.userId,
        adminEmail: req.user.email,
        matchId: id,
        reason,
        ip: req.ip,
      });

      res.status(200).json({
        message: 'Jogo cancelado e apostas reembolsadas!',
        result,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static getUsers(req: AuthenticatedRequest, res: Response): void {
    const users = Array.from(db.users.values()).map((u) => {
      const wallet = db.wallets.get(u.id);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        isBlocked: u.isBlocked,
        balance: wallet?.balance || 0,
        createdAt: u.createdAt,
      };
    });

    res.status(200).json({ users });
  }

  static toggleUserBlock(req: AuthenticatedRequest, res: Response): void {
    if (!req.user) return;
    const { id } = req.params;
    const targetUser = db.users.get(id);
    if (!targetUser) {
      res.status(404).json({ error: 'Utilizador não encontrado' });
      return;
    }

    if (targetUser.role === 'ADMIN') {
      res.status(400).json({ error: 'Não é permitido bloquear uma conta de administrador' });
      return;
    }

    const previousStatus = targetUser.isBlocked;
    targetUser.isBlocked = !targetUser.isBlocked;
    targetUser.updatedAt = new Date().toISOString();

    AuditService.log(
      req.user.userId,
      req.user.email,
      targetUser.isBlocked ? 'BLOCK_USER' : 'UNBLOCK_USER',
      'User',
      targetUser.id,
      { isBlocked: previousStatus },
      { isBlocked: targetUser.isBlocked },
      req.ip
    );

    // Real-time synchronization with Supabase
    supabaseService.syncUserRealtime(targetUser).catch(console.error);

    res.status(200).json({
      message: `Utilizador ${targetUser.isBlocked ? 'bloqueado' : 'desbloqueado'} com sucesso.`,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        isBlocked: targetUser.isBlocked,
      },
    });
  }

  static async adjustBalance(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) return;
    const parse = balanceAdjustmentSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0].message });
      return;
    }

    const { userId, amount, reason } = parse.data;
    const targetUser = db.users.get(userId);
    if (!targetUser) {
      res.status(404).json({ error: 'Utilizador não encontrado' });
      return;
    }

    try {
      const reference = `ADJ-${Date.now()}`;
      let outcome;

      if (amount > 0) {
        outcome = await WalletService.executeTransaction({
          userId,
          type: 'ADJUSTMENT',
          amount,
          reference,
          description: `Ajuste manual de crédito: ${reason}`,
        });
      } else {
        outcome = await WalletService.executeDebitAdjustment({
          userId,
          amount: Math.abs(amount),
          reference,
          description: `Ajuste manual de débito: ${reason}`,
        });
      }

      AuditService.log(
        req.user.userId,
        req.user.email,
        'MANUAL_BALANCE_ADJUSTMENT',
        'Wallet',
        outcome.wallet.id,
        { previousBalance: outcome.transaction.previousBalance },
        {
          newBalance: outcome.transaction.nextBalance,
          amount,
          reason,
          reference,
          targetUserId: userId,
        },
        req.ip
      );

      res.status(200).json({
        message: 'Ajuste de saldo efetuado e auditado com sucesso.',
        wallet: outcome.wallet,
        transaction: outcome.transaction,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static getAuditLogs(req: AuthenticatedRequest, res: Response): void {
    const logs = AuditService.getLogs(100);
    res.status(200).json({ logs });
  }

  static getAllBets(req: AuthenticatedRequest, res: Response): void {
    const bets = Array.from(db.bets.values()).reverse();
    res.status(200).json({ bets });
  }

  static getAllTransactions(req: AuthenticatedRequest, res: Response): void {
    const transactions = [...db.transactions].reverse();
    res.status(200).json({ transactions });
  }

  static changeUserRole(req: AuthenticatedRequest, res: Response): void {
    if (!req.user) return;
    const { id } = req.params;
    const { role } = req.body;

    if (role !== 'USER' && role !== 'ADMIN') {
      res.status(400).json({ error: 'Função inválida. Utilize USER ou ADMIN.' });
      return;
    }

    const targetUser = db.users.get(id);
    if (!targetUser) {
      res.status(404).json({ error: 'Utilizador não encontrado' });
      return;
    }

    if (targetUser.id === req.user.userId && role === 'USER') {
      res.status(400).json({ error: 'Não é possível revogar os seus próprios privilégios de administrador.' });
      return;
    }

    const previousRole = targetUser.role;
    targetUser.role = role;
    targetUser.updatedAt = new Date().toISOString();

    AuditService.log(
      req.user.userId,
      req.user.email,
      'CHANGE_USER_ROLE',
      'User',
      targetUser.id,
      { previousRole },
      { newRole: role },
      req.ip
    );

    res.status(200).json({
      message: `Função do utilizador alterada para ${role} com sucesso.`,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
      },
    });
  }

  static resetUserPassword(req: AuthenticatedRequest, res: Response): void {
    if (!req.user) return;
    const { id } = req.params;
    const newPassword = req.body.newPassword || 'Zona123!';

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      res.status(400).json({ error: 'A palavra-passe deve ter pelo menos 6 caracteres.' });
      return;
    }

    const targetUser = db.users.get(id);
    if (!targetUser) {
      res.status(404).json({ error: 'Utilizador não encontrado' });
      return;
    }

    targetUser.passwordHash = bcrypt.hashSync(newPassword, 10);
    targetUser.updatedAt = new Date().toISOString();

    AuditService.log(
      req.user.userId,
      req.user.email,
      'RESET_USER_PASSWORD',
      'User',
      targetUser.id,
      {},
      { resetByAdmin: req.user.email },
      req.ip
    );

    // Real-time synchronization with Supabase
    supabaseService.syncUserRealtime(targetUser).catch(console.error);

    res.status(200).json({
      message: `Palavra-passe do utilizador ${targetUser.email} redefinida com sucesso para "${newPassword}".`,
      tempPassword: newPassword,
    });
  }

  static getUserBets(req: AuthenticatedRequest, res: Response): void {
    const { id } = req.params;
    const userBets = Array.from(db.bets.values())
      .filter((b) => b.userId === id)
      .reverse();
    res.status(200).json({ bets: userBets });
  }

  static getUserTransactions(req: AuthenticatedRequest, res: Response): void {
    const { id } = req.params;
    const userTransactions = db.transactions
      .filter((tx) => tx.userId === id)
      .reverse();
    res.status(200).json({ transactions: userTransactions });
  }

  static deleteUser(req: AuthenticatedRequest, res: Response): void {
    if (!req.user) return;
    const { id } = req.params;
    
    // Check if user is super admin and prevent self-deletion
    if (id === req.user.userId) {
      res.status(400).json({ error: 'Não é possível excluir a sua própria conta.' });
      return;
    }
    
    const userToDelete = db.users.get(id);
    if (!userToDelete) {
      res.status(404).json({ error: 'Utilizador não encontrado.' });
      return;
    }

    // Optional: could void active bets or just leave them. We'll leave them as is for history, but delete user.
    db.users.delete(id);
    db.wallets.delete(id); // delete wallet too

    AuditService.log(
      req.user.userId,
      req.user.email,
      'DELETE_USER',
      'User',
      id,
      { email: userToDelete.email },
      { deleted: true },
      req.ip
    );

    // Sync to frontend if using realtime (we don't have deleteUserRealtime in supabaseService right now, so we'll skip or just ignore)
    res.status(200).json({ message: `Utilizador ${userToDelete.name} excluído com sucesso.` });
  }

  static deleteMatch(req: AuthenticatedRequest, res: Response): void {
    if (!req.user) return;
    const { id } = req.params;
    const match = db.matches.get(id);
    if (!match) {
      res.status(404).json({ error: 'Jogo não encontrado' });
      return;
    }

    // Check if there are bets placed on this match
    const matchBets = Array.from(db.bets.values()).filter((b) =>
      b.items.some((item) => item.matchId === id)
    );

    // Auto-void bets to allow deletion
    if (matchBets.length > 0) {
      matchBets.forEach((bet) => {
        if (bet.status === 'PENDING') {
          // Refund user
          const wallet = WalletService.getWallet(bet.userId);
          const previousBalance = wallet.balance;
          wallet.balance += bet.stake;
          wallet.updatedAt = new Date().toISOString();

          // Log transaction
          const transactionId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          db.transactions.set(transactionId, {
            id: transactionId,
            walletId: wallet.id,
            userId: bet.userId,
            type: 'REFUND',
            amount: bet.stake,
            previousBalance,
            nextBalance: wallet.balance,
            reference: bet.id,
            description: `Reembolso por cancelamento/exclusão do Jogo (Aposta #${bet.id})`,
            status: 'COMPLETED',
            createdAt: new Date().toISOString(),
          });

          // Void the bet
          bet.status = 'VOID';
          bet.settledAt = new Date().toISOString();
          
          supabaseService.syncWalletRealtime(wallet).catch(console.error);
          supabaseService.syncTransactionRealtime(db.transactions.get(transactionId)!).catch(console.error);
        }
      });
    }

    db.matches.delete(id);

    AuditService.log(
      req.user.userId,
      req.user.email,
      'DELETE_MATCH',
      'Match',
      id,
      { homeTeam: match.homeTeam, awayTeam: match.awayTeam, competitionId: match.competitionId },
      { deleted: true },
      req.ip
    );

    // Real-time synchronization with Supabase
    supabaseService.deleteMatchRealtime(id).catch(console.error);

    res.status(200).json({
      message: `Jogo "${match.homeTeam} vs ${match.awayTeam}" excluído com sucesso do sistema.`,
    });
  }

  static getDepositProofs(req: AuthenticatedRequest, res: Response): void {
    const proofs = db.getDepositProofs();
    res.status(200).json({ proofs });
  }

  static async updateDepositProofStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      res.status(400).json({ error: 'Estado de comprovativo inválido.' });
      return;
    }

    const proof = db.getDepositProof(id);
    if (!proof) {
      res.status(404).json({ error: 'Comprovativo de depósito não encontrado.' });
      return;
    }

    const previousStatus = proof.status;
    const updated = db.updateDepositProofStatus(
      id,
      status,
      req.user.email,
      reviewNotes || undefined
    );

    AuditService.log(
      req.user.userId,
      req.user.email,
      'UPDATE_DEPOSIT_PROOF',
      'DepositProof',
      id,
      { status: previousStatus },
      { status, reviewNotes },
      req.ip
    );

    // Real-time synchronization with Supabase
    if (updated) {
      supabaseService.syncDepositProofRealtime(updated).catch(console.error);
    }

    res.status(200).json({
      message: `Comprovativo de depósito atualizado para ${status}.`,
      proof: updated,
    });
  }
}
