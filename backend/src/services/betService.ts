import { db } from '../db/store.ts';
import { Bet, BetItem, BetType } from '../types/index.ts';
import { Money } from '../utils/money.ts';
import { config } from '../config/index.ts';
import { WalletService } from './walletService.ts';
import { betMutex } from '../utils/mutex.ts';

export class BetService {
  static async placeBet(params: {
    userId: string;
    items: { matchId: string; marketId: string; selectionId: string }[];
    stake: number;
    idempotencyKey?: string;
  }): Promise<Bet> {
    const { userId, items, stake, idempotencyKey } = params;

    // Check idempotency if key provided
    if (idempotencyKey) {
      const existing = Array.from(db.bets.values()).find(
        (b) => b.userId === userId && b.idempotencyKey === idempotencyKey
      );
      if (existing) {
        return existing;
      }
    }

    const user = db.users.get(userId);
    if (!user) throw new Error('Utilizador não encontrado');
    if (user.isBlocked) throw new Error('Conta bloqueada. Não é possível efetuar apostas.');

    // Validate stake limits
    if (stake < config.limits.minimumStake) {
      throw new Error(`O montante mínimo por aposta é ${config.limits.minimumStake} MZN`);
    }
    if (stake > config.limits.maximumStake) {
      throw new Error(`O montante máximo por aposta é ${config.limits.maximumStake} MZN`);
    }

    // Acquire bet mutex to serialize bet placements
    return await betMutex.acquire(userId, async () => {
      // Validate all items and freeze their current odds
      const validatedItems: BetItem[] = [];
      let totalOdds = 1.0;
      const seenMatches = new Set<string>();

      for (const item of items) {
        // Prevent duplicate selections on the same match in an accumulator
        if (seenMatches.has(item.matchId)) {
          throw new Error('Não é permitido adicionar múltiplas seleções do mesmo jogo no mesmo boletim');
        }
        seenMatches.add(item.matchId);

        const match = db.matches.get(item.matchId);
        if (!match) throw new Error(`Jogo ${item.matchId} não encontrado`);

        if (match.status !== 'OPEN') {
          throw new Error(`O jogo ${match.homeTeam} vs ${match.awayTeam} não está aberto para apostas (Estado: ${match.status})`);
        }

        // Check if kickoff has already passed
        const kickoffDateTime = new Date(`${match.kickoffDate}T${match.kickoffTime}:00`);
        if (!isNaN(kickoffDateTime.getTime()) && kickoffDateTime.getTime() <= Date.now()) {
          throw new Error(`O jogo ${match.homeTeam} vs ${match.awayTeam} já iniciou`);
        }

        const market = match.markets.find((m) => m.id === item.marketId);
        if (!market || market.status !== 'OPEN') {
          throw new Error(`Mercado indisponível para o jogo ${match.homeTeam} vs ${match.awayTeam}`);
        }

        const selection = market.selections.find((s) => s.id === item.selectionId);
        if (!selection || selection.status !== 'ACTIVE') {
          throw new Error(`Seleção indisponível para o jogo ${match.homeTeam} vs ${match.awayTeam}`);
        }

        if (selection.odds <= 1.0) {
          throw new Error(`Odd inválida (${selection.odds}) para a seleção`);
        }

        // Freeze odds at the exact moment of confirmation
        const frozenOdds = selection.odds;
        totalOdds = totalOdds * frozenOdds;

        validatedItems.push({
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          betId: '', // populated below
          matchId: match.id,
          matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
          competitionName: match.competitionName,
          kickoff: `${match.kickoffDate} ${match.kickoffTime}`,
          marketId: market.id,
          marketName: market.name,
          selectionId: selection.id,
          outcome: selection.outcome,
          oddsAtBetTime: frozenOdds,
          status: 'PENDING',
        });
      }

      // Round total odds to 2 decimal places
      const finalTotalOdds = Math.round(totalOdds * 100) / 100;
      const potentialReturn = Money.multiply(stake, finalTotalOdds);

      if (potentialReturn > config.limits.maximumPotentialWin) {
        throw new Error(
          `O retorno potencial máximo permitido é ${config.limits.maximumPotentialWin} MZN. Retorno calculado: ${potentialReturn} MZN`
        );
      }

      const betId = `bet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      for (const item of validatedItems) {
        item.betId = betId;
      }

      const betType: BetType = validatedItems.length > 1 ? 'MULTIPLE' : 'SINGLE';

      // Deduct balance atomically from user's wallet with ledger entry
      await WalletService.executeTransaction({
        userId,
        type: 'BET',
        amount: stake,
        reference: betId,
        description: `Aposta ${betType === 'SINGLE' ? 'Simples' : 'Múltipla'} (${validatedItems.length} seleções, Odd ${finalTotalOdds.toFixed(2)})`,
      });

      const bet: Bet = {
        id: betId,
        userId,
        userName: user.name,
        userEmail: user.email,
        type: betType,
        stake,
        totalOdds: finalTotalOdds,
        potentialReturn,
        status: 'PENDING',
        items: validatedItems,
        idempotencyKey,
        settledAt: null,
        createdAt: new Date().toISOString(),
      };

      db.bets.set(betId, bet);

      return bet;
    });
  }

  static getUserBets(userId: string): Bet[] {
    return db.getBets(userId);
  }

  static getAllBets(): Bet[] {
    return db.getBets();
  }

  static getBetById(id: string): Bet | undefined {
    return db.getBet(id);
  }
}
