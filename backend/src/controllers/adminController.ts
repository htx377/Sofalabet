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
    const voidBets = allBets.filter((b) => b.status === 'VOID').length;

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

    const todayStr = new Date().toISOString().split('T')[0];

    // Today's metrics
    let wageredToday = 0;
    let betsTodayCount = 0;
    let wonTodayCount = 0;
    let paidOutToday = 0;

    for (const b of allBets) {
      const isToday = b.createdAt && b.createdAt.startsWith(todayStr);
      if (isToday) {
        wageredToday = Money.add(wageredToday, b.stake);
        betsTodayCount++;
      }
      if (b.status === 'WON') {
        const isSettledToday = (b.settledAt && b.settledAt.startsWith(todayStr)) || isToday;
        if (isSettledToday) {
          paidOutToday = Money.add(paidOutToday, b.potentialReturn);
          wonTodayCount++;
        }
      }
    }

    // Deposits and withdrawals volume
    let totalDepositsVolume = 0;
    let totalWithdrawalsVolume = 0;
    let depositsToday = 0;
    let withdrawalsToday = 0;

    for (const tx of db.transactions) {
      const isToday = tx.createdAt && tx.createdAt.startsWith(todayStr);
      if (tx.type === 'DEPOSIT') {
        totalDepositsVolume = Money.add(totalDepositsVolume, tx.amount);
        if (isToday) depositsToday = Money.add(depositsToday, tx.amount);
      } else if (tx.type === 'WITHDRAWAL') {
        const amt = Math.abs(tx.amount);
        totalWithdrawalsVolume = Money.add(totalWithdrawalsVolume, amt);
        if (isToday) withdrawalsToday = Money.add(withdrawalsToday, amt);
      }
    }

    // Total balance in all user wallets
    let totalUsersBalance = 0;
    for (const wal of db.wallets.values()) {
      totalUsersBalance = Money.add(totalUsersBalance, wal.balance);
    }

    // Lucro da casa (GGR = Total apostado - Total pago em prémios)
    const houseProfit = Money.subtract(totalBetVolume, totalDisbursedPayout);
    const houseProfitToday = Money.subtract(wageredToday, paidOutToday);
    const profitMarginPercent = totalBetVolume > 0 ? Math.round(((houseProfit / totalBetVolume) * 100) * 10) / 10 : 0;

    // Saldo da casa: Reserva operacional da casa (fundos disponíveis + retenções líquidas)
    // House liquid vault = Net platform deposits (Deposits - Withdrawals)
    const houseLiquidBalance = Math.max(0, Money.subtract(totalDepositsVolume, totalWithdrawalsVolume));

    // Daily breakdown for last 14 days
    const dailyMap = new Map<string, { date: string; wagered: number; paidOut: number; profit: number; betsCount: number; deposits: number; withdrawals: number; newUsers: number }>();
    
    // Seed last 14 days
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      dailyMap.set(ds, { date: ds, wagered: 0, paidOut: 0, profit: 0, betsCount: 0, deposits: 0, withdrawals: 0, newUsers: 0 });
    }

    for (const b of allBets) {
      const ds = b.createdAt?.split('T')[0];
      if (ds && dailyMap.has(ds)) {
        const item = dailyMap.get(ds)!;
        item.wagered = Money.add(item.wagered, b.stake);
        item.betsCount++;
        if (b.status === 'WON') {
          item.paidOut = Money.add(item.paidOut, b.potentialReturn);
        }
        item.profit = Money.subtract(item.wagered, item.paidOut);
      }
    }

    for (const tx of db.transactions) {
      const ds = tx.createdAt?.split('T')[0];
      if (ds && dailyMap.has(ds)) {
        const item = dailyMap.get(ds)!;
        if (tx.type === 'DEPOSIT') {
          item.deposits = Money.add(item.deposits, tx.amount);
        } else if (tx.type === 'WITHDRAWAL') {
          item.withdrawals = Money.add(item.withdrawals, Math.abs(tx.amount));
        }
      }
    }

    for (const u of db.users.values()) {
      const ds = u.createdAt?.split('T')[0];
      if (ds && dailyMap.has(ds)) {
        const item = dailyMap.get(ds)!;
        item.newUsers++;
      }
    }

    const dailyReports = Array.from(dailyMap.values()).sort((a, b) => b.date.localeCompare(a.date));

    res.status(200).json({
      stats: {
        totalUsers,
        activeMatches,
        finishedMatches,
        pendingBets,
        wonBets,
        lostBets,
        voidBets,
        totalBetVolume,
        totalDisbursedPayout,
        totalBalanceMoved,
        totalTransactions: db.transactions.length,

        // Solicitados explicitamente na árvore:
        houseBalance: houseLiquidBalance,
        totalUsersBalance,
        wageredToday,
        paidOutToday,
        houseProfit,
        houseProfitToday,
        profitMarginPercent,
        betsTodayCount,
        wonTodayCount,
        totalDepositsVolume,
        totalWithdrawalsVolume,
        depositsToday,
        withdrawalsToday,
        dailyReports,
      },
    });
  }

  static createUser(req: AuthenticatedRequest, res: Response): void {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { name, phone, email, password, initialBalance, role } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'O nome completo do jogador é obrigatório.' });
      return;
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
      res.status(400).json({ error: 'Número de telemóvel inválido (ex: +258 84 123 4567).' });
      return;
    }

    const cleanPhone = phone.trim();
    const cleanEmail = email && typeof email === 'string' && email.includes('@')
      ? email.trim().toLowerCase()
      : `${cleanPhone.replace(/\D/g, '')}@zonabet.mz`;

    // Check if phone or email already exists
    const existingUser = Array.from(db.users.values()).find(
      (u) => u.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '') || u.email.toLowerCase() === cleanEmail
    );

    if (existingUser) {
      res.status(409).json({ error: 'Já existe um jogador registado com este telemóvel ou email.' });
      return;
    }

    const userPassword = password && typeof password === 'string' && password.length >= 6
      ? password
      : 'Zona123!';

    const userRole = role === 'ADMIN' ? 'ADMIN' : 'USER';
    const initBalance = typeof initialBalance === 'number' && initialBalance > 0 ? initialBalance : 0;

    const digitsOnly = cleanPhone.replace(/\D/g, '');
    const nationalNumber = digitsOnly.startsWith('258') ? digitsOnly.slice(3) : digitsOnly;
    let referralCode = `ZONA${nationalNumber || Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    if (db.getUserByReferralCode(referralCode)) {
      let uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      referralCode = `${referralCode}-${uniqueSuffix}`;
      while (db.getUserByReferralCode(referralCode)) {
        referralCode = `ZONA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      }
    }

    const host = req.get('host') || 'localhost:3000';
    const proto = (req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https') ? 'https' : 'http';
    const individualReferralLink = `${proto}://${host}/?ref=${referralCode}`;

    const newUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      passwordHash: bcrypt.hashSync(userPassword, 10),
      role: userRole as any,
      isBlocked: false,
      referralCode,
      referralLink: individualReferralLink,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.set(newUser.id, newUser);

    // Initialize wallet
    const newWallet = {
      id: `wal-${Date.now()}-${newUser.id.substring(0, 8)}`,
      userId: newUser.id,
      balance: initBalance,
      lockedBalance: 0,
      updatedAt: new Date().toISOString(),
    };
    db.wallets.set(newUser.id, newWallet);

    if (initBalance > 0) {
      db.transactions.push({
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        walletId: newWallet.id,
        userId: newUser.id,
        type: 'DEPOSIT',
        amount: initBalance,
        previousBalance: 0,
        nextBalance: initBalance,
        reference: `CAD-ADMIN-${Date.now().toString().slice(-6)}`,
        description: `Depósito inicial concedido no registo administrativo por ${req.user.email}`,
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
      });
    }

    AuditService.log(
      req.user.userId,
      req.user.email,
      'CREATE_USER',
      'User',
      newUser.id,
      {},
      { name: newUser.name, phone: newUser.phone, email: newUser.email, role: newUser.role, initialBalance: initBalance },
      req.ip
    );

    supabaseService.syncUserRealtime(newUser).catch(console.error);

    res.status(201).json({
      message: `Jogador "${newUser.name}" cadastrado com sucesso!`,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        balance: initBalance,
        referralCode: newUser.referralCode,
        referralLink: newUser.referralLink,
        tempPassword: userPassword,
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
    const host = req.get('host') || 'localhost:3000';
    const proto = (req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https') ? 'https' : 'http';

    const users = Array.from(db.users.values()).map((u) => {
      const wallet = db.wallets.get(u.id);
      const code = u.referralCode || `ZONA${u.phone.replace(/\D/g, '').slice(-9)}`;
      const referralLink = u.referralLink || `${proto}://${host}/?ref=${code}`;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        isBlocked: u.isBlocked,
        balance: wallet?.balance || 0,
        referralCode: code,
        referralLink,
        referredBy: u.referredBy,
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
          const newTx = {
            id: transactionId,
            walletId: wallet.id,
            userId: bet.userId,
            type: 'REFUND' as const,
            amount: bet.stake,
            previousBalance,
            nextBalance: wallet.balance,
            reference: bet.id,
            description: `Reembolso por cancelamento/exclusão do Jogo (Aposta #${bet.id})`,
            status: 'COMPLETED' as const,
            createdAt: new Date().toISOString(),
          };
          db.transactions.push(newTx);

          // Void the bet
          bet.status = 'VOID';
          bet.settledAt = new Date().toISOString();
          
          supabaseService.syncWalletRealtime(wallet).catch(console.error);
          supabaseService.syncTransactionRealtime(newTx).catch(console.error);
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
