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
    const marketId = `mkt-${matchId}-1`;

    const market: Market = {
      id: marketId,
      matchId,
      type: '1X2',
      name: 'Resultado Final (1X2)',
      status: 'OPEN',
      selections: [
        { id: `sel-${marketId}-1`, marketId, outcome: '1', label: homeTeam, odds: odds.home, status: 'ACTIVE' },
        { id: `sel-${marketId}-X`, marketId, outcome: 'X', label: 'Empate', odds: odds.draw, status: 'ACTIVE' },
        { id: `sel-${marketId}-2`, marketId, outcome: '2', label: awayTeam, odds: odds.away, status: 'ACTIVE' },
      ],
    };

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
      markets: [market],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.matches.set(matchId, newMatch);

    AuditService.log(adminId, adminEmail, 'CREATE_MATCH', 'Match', matchId, undefined, newMatch, ip);

    // Real-time synchronization with Supabase
    supabaseService.syncMatchRealtime(newMatch).catch(console.error);

    return newMatch;
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
