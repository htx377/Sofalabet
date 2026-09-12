import { db } from '../db/store.ts';
import { Match, Market, MatchStatus } from '../types/index.ts';
import { AuditService } from './auditService.ts';
import { supabaseService } from '../db/supabase.ts';

export class MatchService {
  static getAllMatches(filter?: { status?: string; competitionId?: string; category?: string }): Match[] {
    return db.getMatches(filter);
  }

  static getMatchById(id: string): Match | undefined {
    return db.getMatch(id);
  }

  static createMatch(params: {
    adminId: string;
    adminEmail: string;
    competitionId: string;
    homeTeam: string;
    awayTeam: string;
    kickoffDate: string;
    kickoffTime: string;
    description?: string;
    odds: { home: number; draw: number; away: number };
    ip?: string;
  }): Match {
    const { adminId, adminEmail, competitionId, homeTeam, awayTeam, kickoffDate, kickoffTime, description, odds, ip } = params;

    const competition = db.competitions.find((c) => c.id === competitionId);
    const compName = competition ? competition.name : 'Moçambola';
    const compCategory = competition?.category || 'PROVINCIAL';

    const matchId = `match-${Date.now()}`;
    const marketId1X2 = `mkt-${matchId}-1`;
    const marketIdCS = `mkt-${matchId}-cs`;

    const market1X2: Market = {
      id: marketId1X2,
      matchId,
      type: '1X2',
      name: 'Resultado Final (1X2)',
      status: 'OPEN',
      selections: [
        { id: `sel-${marketId1X2}-1`, marketId: marketId1X2, outcome: '1', label: homeTeam, odds: odds.home, status: 'ACTIVE' },
        { id: `sel-${marketId1X2}-X`, marketId: marketId1X2, outcome: 'X', label: 'Empate', odds: odds.draw, status: 'ACTIVE' },
        { id: `sel-${marketId1X2}-2`, marketId: marketId1X2, outcome: '2', label: awayTeam, odds: odds.away, status: 'ACTIVE' },
      ],
    };

    const marketCorrectScore = MatchService.buildDefaultCorrectScoreMarket(
      matchId,
      marketIdCS,
      homeTeam,
      awayTeam,
      odds
    );

    const newMatch: Match = {
      id: matchId,
      competitionId,
      competitionName: compName,
      competitionCategory: compCategory,
      homeTeam,
      awayTeam,
      kickoffDate,
      kickoffTime,
      status: 'OPEN',
      description,
      markets: [market1X2, marketCorrectScore],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.matches.set(matchId, newMatch);

    AuditService.log(adminId, adminEmail, 'CREATE_MATCH', 'Match', matchId, undefined, newMatch, ip);

    // Real-time synchronization with Supabase
    supabaseService.syncMatchRealtime(newMatch).catch(console.error);

    return newMatch;
  }

  static buildDefaultCorrectScoreMarket(
    matchId: string,
    marketId: string,
    homeTeam: string,
    awayTeam: string,
    odds: { home: number; draw: number; away: number }
  ): Market {
    const bh = odds.home || 2.0;
    const bd = odds.draw || 3.0;
    const ba = odds.away || 3.5;

    const roundOdd = (val: number, minVal: number = 3.0) =>
      Math.max(minVal, Math.round(val * 10) / 10);

    const scoreConfigs: { score: string; label: string; oddCalc: number }[] = [
      // Home wins
      { score: '1-0', label: `${homeTeam} 1-0`, oddCalc: roundOdd(bh * 3.2, 4.5) },
      { score: '2-0', label: `${homeTeam} 2-0`, oddCalc: roundOdd(bh * 4.8, 6.0) },
      { score: '2-1', label: `${homeTeam} 2-1`, oddCalc: roundOdd(bh * 5.5, 7.5) },
      { score: '3-0', label: `${homeTeam} 3-0`, oddCalc: roundOdd(bh * 9.0, 11.0) },
      { score: '3-1', label: `${homeTeam} 3-1`, oddCalc: roundOdd(bh * 11.0, 14.0) },
      { score: '3-2', label: `${homeTeam} 3-2`, oddCalc: roundOdd(bh * 18.0, 22.0) },

      // Draws
      { score: '0-0', label: 'Empate 0-0', oddCalc: roundOdd(bd * 2.8, 6.5) },
      { score: '1-1', label: 'Empate 1-1', oddCalc: roundOdd(bd * 2.0, 5.0) },
      { score: '2-2', label: 'Empate 2-2', oddCalc: roundOdd(bd * 4.2, 12.0) },
      { score: '3-3', label: 'Empate 3-3', oddCalc: roundOdd(bd * 10.0, 28.0) },

      // Away wins
      { score: '0-1', label: `${awayTeam} 0-1`, oddCalc: roundOdd(ba * 3.2, 5.0) },
      { score: '0-2', label: `${awayTeam} 0-2`, oddCalc: roundOdd(ba * 4.8, 7.5) },
      { score: '1-2', label: `${awayTeam} 1-2`, oddCalc: roundOdd(ba * 5.5, 8.5) },
      { score: '0-3', label: `${awayTeam} 0-3`, oddCalc: roundOdd(ba * 9.0, 14.0) },
      { score: '1-3', label: `${awayTeam} 1-3`, oddCalc: roundOdd(ba * 11.0, 16.0) },
      { score: '2-3', label: `${awayTeam} 2-3`, oddCalc: roundOdd(ba * 18.0, 24.0) },

      // Other
      { score: 'Outro', label: 'Outro Resultado', oddCalc: 15.0 },
    ];

    return {
      id: marketId,
      matchId,
      type: 'CORRECT_SCORE',
      name: 'Resultado Correto',
      status: 'OPEN',
      selections: scoreConfigs.map((sc, idx) => ({
        id: `sel-${marketId}-${idx + 1}`,
        marketId,
        outcome: sc.score,
        label: sc.label,
        odds: sc.oddCalc,
        status: 'ACTIVE',
      })),
    };
  }

  static updateMarketStatus(params: {
    adminId: string;
    adminEmail: string;
    matchId: string;
    marketId: string;
    status: 'OPEN' | 'SUSPENDED' | 'CLOSED';
    reason?: string;
    ip?: string;
  }): Market {
    const { adminId, adminEmail, matchId, marketId, status, reason, ip } = params;
    const match = db.matches.get(matchId);
    if (!match) throw new Error('Jogo não encontrado');

    const market = match.markets.find((m) => m.id === marketId);
    if (!market) throw new Error('Mercado não encontrado');

    const oldStatus = market.status;
    market.status = status;
    match.updatedAt = new Date().toISOString();

    AuditService.log(
      adminId,
      adminEmail,
      'UPDATE_MARKET_STATUS',
      'Market',
      market.id,
      { status: oldStatus },
      { status, reason, matchTitle: `${match.homeTeam} vs ${match.awayTeam}` },
      ip
    );

    supabaseService.syncMatchRealtime(match).catch(console.error);
    return market;
  }

  static updateMarketOdds(params: {
    adminId: string;
    adminEmail: string;
    matchId: string;
    marketId: string;
    selections: { selectionId: string; odds: number }[];
    ip?: string;
  }): Market {
    const { adminId, adminEmail, matchId, marketId, selections, ip } = params;
    const match = db.matches.get(matchId);
    if (!match) throw new Error('Jogo não encontrado');

    const market = match.markets.find((m) => m.id === marketId);
    if (!market) throw new Error('Mercado não encontrado');

    const oldOdds = market.selections.map((s) => ({ id: s.id, outcome: s.outcome, odds: s.odds }));

    for (const update of selections) {
      const sel = market.selections.find((s) => s.id === update.selectionId);
      if (sel && update.odds >= 1.01) {
        sel.odds = Math.round(update.odds * 100) / 100;
      }
    }

    match.updatedAt = new Date().toISOString();

    AuditService.log(
      adminId,
      adminEmail,
      'UPDATE_MARKET_ODDS',
      'Market',
      market.id,
      oldOdds,
      market.selections.map((s) => ({ id: s.id, outcome: s.outcome, odds: s.odds })),
      ip
    );

    supabaseService.syncMatchRealtime(match).catch(console.error);
    return market;
  }

  static addMarketSelection(params: {
    adminId: string;
    adminEmail: string;
    matchId: string;
    marketId: string;
    outcome: string;
    label: string;
    odds: number;
    ip?: string;
  }): Market {
    const { adminId, adminEmail, matchId, marketId, outcome, label, odds, ip } = params;
    const match = db.matches.get(matchId);
    if (!match) throw new Error('Jogo não encontrado');

    const market = match.markets.find((m) => m.id === marketId);
    if (!market) throw new Error('Mercado não encontrado');

    const exists = market.selections.some((s) => s.outcome === outcome);
    if (exists) throw new Error(`Já existe uma seleção com o resultado ${outcome}`);

    const newSelection = {
      id: `sel-${market.id}-${Date.now()}`,
      marketId: market.id,
      outcome,
      label,
      odds: Math.max(1.01, Math.round(odds * 100) / 100),
      status: 'ACTIVE' as const,
    };

    market.selections.push(newSelection);
    match.updatedAt = new Date().toISOString();

    AuditService.log(
      adminId,
      adminEmail,
      'ADD_MARKET_SELECTION',
      'Market',
      market.id,
      undefined,
      newSelection,
      ip
    );

    supabaseService.syncMatchRealtime(match).catch(console.error);
    return market;
  }

  static updateOdds(params: {
    adminId: string;
    adminEmail: string;
    matchId: string;
    odds: { home: number; draw: number; away: number };
    ip?: string;
  }): Match {
    const { adminId, adminEmail, matchId, odds, ip } = params;
    const match = db.matches.get(matchId);
    if (!match) throw new Error('Jogo não encontrado');

    if (match.status === 'FINISHED' || match.status === 'CANCELLED') {
      throw new Error(`Não é possível alterar odds de um jogo com estado ${match.status}`);
    }

    const market = match.markets.find((m) => m.type === '1X2');
    if (!market) throw new Error('Mercado 1X2 não encontrado no jogo');

    const oldOdds = market.selections.map((s) => ({ outcome: s.outcome, odds: s.odds }));

    for (const sel of market.selections) {
      if (sel.outcome === '1') sel.odds = odds.home;
      if (sel.outcome === 'X') sel.odds = odds.draw;
      if (sel.outcome === '2') sel.odds = odds.away;
    }

    match.updatedAt = new Date().toISOString();

    AuditService.log(adminId, adminEmail, 'UPDATE_ODDS', 'Market', market.id, oldOdds, odds, ip);

    // Real-time synchronization with Supabase
    supabaseService.syncMatchRealtime(match).catch(console.error);

    return match;
  }

  static updateStatus(params: {
    adminId: string;
    adminEmail: string;
    matchId: string;
    status: MatchStatus;
    reason?: string;
    ip?: string;
  }): Match {
    const { adminId, adminEmail, matchId, status, reason, ip } = params;
    const match = db.matches.get(matchId);
    if (!match) throw new Error('Jogo não encontrado');

    if (match.status === 'FINISHED') {
      throw new Error('Jogo já terminado e liquidado. Não é possível alterar o estado.');
    }

    const oldStatus = match.status;
    match.status = status;
    match.updatedAt = new Date().toISOString();

    // Update market status accordingly
    for (const m of match.markets) {
      if (status === 'SUSPENDED') m.status = 'SUSPENDED';
      else if (status === 'CLOSED') m.status = 'CLOSED';
      else if (status === 'OPEN') m.status = 'OPEN';
    }

    AuditService.log(adminId, adminEmail, 'UPDATE_MATCH_STATUS', 'Match', matchId, { status: oldStatus }, { status, reason }, ip);

    // Real-time synchronization with Supabase
    supabaseService.syncMatchRealtime(match).catch(console.error);

    return match;
  }
}
