import { db } from '../db/store.ts';
import { Match, Bet } from '../types/index.ts';
import { WalletService } from './walletService.ts';
import { AuditService } from './auditService.ts';
import { Money } from '../utils/money.ts';

export class SettlementService {
  /**
   * Settles a football match with official manual score
   */
  static async settleMatch(params: {
    adminId: string;
    adminEmail: string;
    matchId: string;
    homeScore: number;
    awayScore: number;
    ip?: string;
  }): Promise<{ match: Match; settledBetsCount: number; wonBetsCount: number; totalPayout: number }> {
    const { adminId, adminEmail, matchId, homeScore, awayScore, ip } = params;

    const match = db.matches.get(matchId);
    if (!match) throw new Error('Jogo não encontrado');

    if (match.status === 'FINISHED') {
      throw new Error('Este jogo já foi finalizado e liquidado anteriormente. Liquidação duplicada impedida.');
    }

    // Determine 1X2 winning outcome
    let winningOutcome: '1' | 'X' | '2';
    if (homeScore > awayScore) {
      winningOutcome = '1';
    } else if (homeScore === awayScore) {
      winningOutcome = 'X';
    } else {
      winningOutcome = '2';
    }

    const previousStatus = match.status;

    // Update match score & status
    match.homeScore = homeScore;
    match.awayScore = awayScore;
    match.status = 'FINISHED';
    match.updatedAt = new Date().toISOString();

    // Update market selections
    for (const market of match.markets) {
      market.status = 'SETTLED';
      for (const sel of market.selections) {
        if (sel.outcome === winningOutcome) {
          sel.status = 'SETTLED_WIN';
        } else {
          sel.status = 'SETTLED_LOST';
        }
      }
    }

    let settledBetsCount = 0;
    let wonBetsCount = 0;
    let totalPayout = 0;

    // Process all pending bets in the system
    for (const bet of db.bets.values()) {
      if (bet.status !== 'PENDING') continue;

      // Check if this bet includes the finished match
      const matchingItems = bet.items.filter((item) => item.matchId === matchId);
      if (matchingItems.length === 0) continue;

      // Update the status of each matching item
      for (const item of matchingItems) {
        if (item.outcome === winningOutcome) {
          item.status = 'WON';
        } else {
          item.status = 'LOST';
        }
      }

      // Check overall bet status
      const hasLostItem = bet.items.some((item) => item.status === 'LOST');
      const allItemsDecided = bet.items.every((item) => item.status === 'WON' || item.status === 'VOID');

      if (hasLostItem) {
        bet.status = 'LOST';
        bet.settledAt = new Date().toISOString();
        settledBetsCount++;
      } else if (allItemsDecided) {
        // Recalculate potential return in case any item was VOID
        let activeOdds = 1.0;
        for (const item of bet.items) {
          if (item.status === 'WON') {
            activeOdds = activeOdds * item.oddsAtBetTime;
          }
          // VOID items act as odd 1.0
        }
        const finalOdds = Math.round(activeOdds * 100) / 100;
        const payout = Money.multiply(bet.stake, finalOdds);

        bet.status = 'WON';
        bet.settledAt = new Date().toISOString();
        settledBetsCount++;
        wonBetsCount++;
        totalPayout = Money.add(totalPayout, payout);

        // Credit user wallet with winnings atomically
        await WalletService.executeTransaction({
          userId: bet.userId,
          type: 'WIN',
          amount: payout,
          reference: bet.id,
          description: `Prémio de Aposta Vencedora #${bet.id.substring(0, 10)} (Odd ${finalOdds})`,
        });
      }
    }

    // Log settlement audit
    AuditService.log(
      adminId,
      adminEmail,
      'SETTLE_MATCH',
      'Match',
      matchId,
      { status: previousStatus },
      {
        status: 'FINISHED',
        homeScore,
        awayScore,
        winningOutcome,
        settledBetsCount,
        wonBetsCount,
        totalPayout,
      },
      ip
    );

    return { match, settledBetsCount, wonBetsCount, totalPayout };
  }

  /**
   * Cancels a match and voids/refunds all active bets
   */
  static async cancelMatch(params: {
    adminId: string;
    adminEmail: string;
    matchId: string;
    reason: string;
    ip?: string;
  }): Promise<{ match: Match; refundedBetsCount: number; totalRefunded: number }> {
    const { adminId, adminEmail, matchId, reason, ip } = params;

    const match = db.matches.get(matchId);
    if (!match) throw new Error('Jogo não encontrado');

    if (match.status === 'FINISHED') {
      throw new Error('Não é possível cancelar um jogo já finalizado e liquidado');
    }

    const previousStatus = match.status;
    match.status = 'CANCELLED';
    match.updatedAt = new Date().toISOString();

    for (const market of match.markets) {
      market.status = 'CLOSED';
      for (const sel of market.selections) {
        sel.status = 'VOID';
      }
    }

    let refundedBetsCount = 0;
    let totalRefunded = 0;

    for (const bet of db.bets.values()) {
      if (bet.status !== 'PENDING') continue;

      const item = bet.items.find((i) => i.matchId === matchId);
      if (!item) continue;

      item.status = 'VOID';

      if (bet.type === 'SINGLE') {
        // Full stake refund for single bet
        bet.status = 'VOID';
        bet.settledAt = new Date().toISOString();

        await WalletService.executeTransaction({
          userId: bet.userId,
          type: 'REFUND',
          amount: bet.stake,
          reference: bet.id,
          description: `Reembolso por jogo cancelado: ${match.homeTeam} vs ${match.awayTeam}`,
        });

        refundedBetsCount++;
        totalRefunded = Money.add(totalRefunded, bet.stake);
      } else {
        // For multiple bet: check if all remaining items are already settled or need re-evaluation
        const allVoid = bet.items.every((i) => i.status === 'VOID');
        if (allVoid) {
          bet.status = 'VOID';
          bet.settledAt = new Date().toISOString();
          await WalletService.executeTransaction({
            userId: bet.userId,
            type: 'REFUND',
            amount: bet.stake,
            reference: bet.id,
            description: `Reembolso de aposta múltipla totalmente anulada`,
          });
          refundedBetsCount++;
          totalRefunded = Money.add(totalRefunded, bet.stake);
        }
      }
    }

    AuditService.log(
      adminId,
      adminEmail,
      'CANCEL_MATCH',
      'Match',
      matchId,
      { status: previousStatus },
      { status: 'CANCELLED', reason, refundedBetsCount, totalRefunded },
      ip
    );

    return { match, refundedBetsCount, totalRefunded };
  }
}
