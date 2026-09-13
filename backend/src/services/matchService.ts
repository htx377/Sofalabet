import { db } from '../db/store.ts';
import { Match, Market, Selection } from '../types/index.ts';
import { AuditService } from './auditService.ts';
import { supabaseService } from '../db/supabase.ts';

export class MatchService {
  /**
   * Retrieves all matches with their markets and selections from Supabase
   */
  static async getAllMatches(filters?: { status?: string; competitionId?: string; category?: string }): Promise<Match[]> {
    const client = supabaseService.getClient();
    if (client) {
      let query = client
        .from('matches')
        .select(`
          *,
          markets (
            *,
            selections (*)
          )
        `);
      
      if (filters?.status) {
        const dbStatus = filters.status === 'OPEN' ? 'PRE_MATCH' : filters.status;
        query = query.eq('status', dbStatus);
      }
      if (filters?.competitionId) {
        query = query.eq('competition_id', filters.competitionId);
      }
      if (filters?.category) {
        query = query.eq('competition_category', filters.category);
      }

      const { data: matchesData, error } = await query.order('start_time', { ascending: true });
      
      if (!error && matchesData) {
        return matchesData.map(m => ({
          id: m.id,
          competitionId: m.competition_id,
          competitionName: m.competition_name,
          competitionCategory: m.competition_category || 'Futebol',
          homeTeam: m.home_team,
          awayTeam: m.away_team,
          kickoffDate: m.start_time.split('T')[0],
          kickoffTime: m.start_time.split('T')[1].substring(0, 5),
          status: m.status === 'PRE_MATCH' ? 'OPEN' : m.status,
          homeScore: m.home_score,
          awayScore: m.away_score,
          isFeatured: m.is_featured,
          markets: m.markets.map((mk: any) => ({
            id: mk.id,
            name: mk.name,
            type: mk.type,
            status: mk.status,
            maxExposure: mk.max_exposure,
            maxStake: mk.max_stake,
            selections: mk.selections.map((s: any) => ({
              id: s.id,
              outcome: s.outcome,
              label: s.label,
              odds: Number(s.odds),
              status: s.status
            }))
          })),
          createdAt: m.created_at,
          updatedAt: m.created_at
        }));
      }
    }
    return Array.from(db.matches.values());
  }

  static async getMatchById(id: string): Promise<Match | null> {
    const client = supabaseService.getClient();
    if (client) {
      const { data, error } = await client
        .from('matches')
        .select(`
          *,
          markets (
            *,
            selections (*)
          )
        `)
        .eq('id', id)
        .single();
      
      if (!error && data) {
        return {
          id: data.id,
          competitionId: data.competition_id,
          competitionName: data.competition_name,
          competitionCategory: data.competition_category || 'Futebol',
          homeTeam: data.home_team,
          awayTeam: data.away_team,
          kickoffDate: data.start_time.split('T')[0],
          kickoffTime: data.start_time.split('T')[1].substring(0, 5),
          status: data.status === 'PRE_MATCH' ? 'OPEN' : data.status,
          homeScore: data.home_score,
          awayScore: data.away_score,
          isFeatured: data.is_featured,
          markets: data.markets.map((mk: any) => ({
            id: mk.id,
            name: mk.name,
            type: mk.type,
            status: mk.status,
            maxExposure: mk.max_exposure,
            maxStake: mk.max_stake,
            selections: mk.selections.map((s: any) => ({
              id: s.id,
              outcome: s.outcome,
              label: s.label,
              odds: Number(s.odds),
              status: s.status
            }))
          })),
          createdAt: data.created_at,
          updatedAt: data.created_at
        };
      }
    }
    return db.matches.get(id) || null;
  }

  /**
   * Creates a new match and its default markets in Supabase
   */
  static async createMatch(params: {
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
  }): Promise<Match> {
    const { homeTeam, awayTeam, kickoffDate, kickoffTime, odds } = params;

    const match: Match = {
      id: `m-${Date.now()}`,
      competitionId: params.competitionId,
      competitionName: params.description || 'Moçambola',
      competitionCategory: 'Futebol',
      homeTeam,
      awayTeam,
      kickoffDate,
      kickoffTime,
      status: 'OPEN',
      isFeatured: false,
      markets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Create default markets
    const mainMarket: Market = {
      id: `mk-${Date.now()}-1`,
      name: 'Resultado Final (1X2)',
      type: '1X2',
      status: 'OPEN',
      selections: [
        { id: `s-${Date.now()}-1`, outcome: '1', label: homeTeam, odds: odds.home, status: 'ACTIVE' },
        { id: `s-${Date.now()}-2`, outcome: 'X', label: 'Empate', odds: odds.draw, status: 'ACTIVE' },
        { id: `s-${Date.now()}-3`, outcome: '2', label: awayTeam, odds: odds.away, status: 'ACTIVE' },
      ],
    };
    match.markets.push(mainMarket);

    // Create Correct Score Market
    const correctScoreMarket: Market = {
      id: `mk-${Date.now()}-cs`,
      name: 'Resultado Correto',
      type: 'CORRECT_SCORE',
      status: 'OPEN',
      maxExposure: 50000,
      selections: this.generateDefaultCorrectScores(homeTeam, awayTeam),
    };
    match.markets.push(correctScoreMarket);

    // Persist to Supabase
    const client = supabaseService.getClient();
    if (client) {
      const { data: mData, error: mError } = await client
        .from('matches')
        .insert({
          id: match.id,
          competition_id: match.competitionId,
          competition_name: match.competitionName,
          home_team: match.homeTeam,
          away_team: match.awayTeam,
          start_time: `${kickoffDate}T${kickoffTime}:00Z`,
          status: 'PRE_MATCH',
          is_featured: match.isFeatured,
          created_at: match.createdAt
        })
        .select()
        .single();

      if (mError) throw mError;

      // Insert Markets
      for (const market of match.markets) {
        const { error: mkError } = await client
          .from('markets')
          .insert({
            id: market.id,
            match_id: match.id,
            name: market.name,
            type: market.type,
            status: market.status,
            max_exposure: market.maxExposure
          });
        
        if (mkError) throw mkError;

        // Insert Selections
        const selectionsToInsert = market.selections.map(s => ({
          id: s.id,
          market_id: market.id,
          outcome: s.outcome,
          label: s.label,
          odds: s.odds,
          status: 'ACTIVE'
        }));

        const { error: sError } = await client
          .from('selections')
          .insert(selectionsToInsert);

        if (sError) throw sError;
      }
    }

    db.matches.set(match.id, match);
    AuditService.log(params.adminId, params.adminEmail, 'CREATE_MATCH', 'Match', match.id, null, match, params.ip);

    return match;
  }

  static async updateOdds(params: {
    adminId: string;
    adminEmail: string;
    matchId: string;
    odds: { home: number; draw: number; away: number };
    ip?: string;
  }): Promise<Match> {
    const match = await this.getMatchById(params.matchId);
    if (!match) throw new Error('Jogo não encontrado');

    const mainMarket = match.markets.find((m) => m.type === '1X2');
    if (!mainMarket) throw new Error('Mercado principal não encontrado');

    const oldMatch = JSON.parse(JSON.stringify(match));

    mainMarket.selections.find((s) => s.outcome === '1')!.odds = params.odds.home;
    mainMarket.selections.find((s) => s.outcome === 'X')!.odds = params.odds.draw;
    mainMarket.selections.find((s) => s.outcome === '2')!.odds = params.odds.away;
    match.updatedAt = new Date().toISOString();

    // Update in Supabase
    const client = supabaseService.getClient();
    if (client) {
      for (const sel of mainMarket.selections) {
        await client
          .from('selections')
          .update({ odds: sel.odds })
          .eq('id', sel.id);
      }
    }

    db.matches.set(match.id, match);
    AuditService.log(params.adminId, params.adminEmail, 'UPDATE_ODDS', 'Match', match.id, oldMatch, match, params.ip);
    return match;
  }

  static async updateStatus(params: {
    adminId: string;
    adminEmail: string;
    matchId: string;
    status: Match['status'];
    reason?: string;
    ip?: string;
  }): Promise<Match> {
    const match = await this.getMatchById(params.matchId);
    if (!match) throw new Error('Jogo não encontrado');

    const oldMatch = JSON.parse(JSON.stringify(match));
    match.status = params.status;
    match.updatedAt = new Date().toISOString();

    const client = supabaseService.getClient();
    if (client) {
      await client
        .from('matches')
        .update({ status: params.status === 'OPEN' ? 'PRE_MATCH' : params.status })
        .eq('id', params.matchId);
    }

    db.matches.set(match.id, match);
    AuditService.log(params.adminId, params.adminEmail, 'UPDATE_STATUS', 'Match', match.id, oldMatch, match, params.ip);
    return match;
  }

  static async updateMarketStatus(params: any): Promise<Market> {
    const match = await this.getMatchById(params.matchId);
    if (!match) throw new Error('Jogo não encontrado');

    const market = match.markets.find((m) => m.id === params.marketId);
    if (!market) throw new Error('Mercado não encontrado');

    market.status = params.status;
    
    const client = supabaseService.getClient();
    if (client) {
      await client
        .from('markets')
        .update({ status: params.status })
        .eq('id', params.marketId);
    }

    db.matches.set(match.id, match);
    return market;
  }

  static async updateMarketOdds(params: any): Promise<Market> {
    const match = await this.getMatchById(params.matchId);
    if (!match) throw new Error('Jogo não encontrado');

    const market = match.markets.find((m) => m.id === params.marketId);
    if (!market) throw new Error('Mercado não encontrado');

    const client = supabaseService.getClient();
    for (const selUpdate of params.selections) {
      const sel = market.selections.find((s) => s.id === selUpdate.id);
      if (sel) {
        sel.odds = selUpdate.odds;
        if (client) {
          await client.from('selections').update({ odds: sel.odds }).eq('id', sel.id);
        }
      }
    }

    db.matches.set(match.id, match);
    return market;
  }

  static async addMarketSelection(params: any): Promise<Market> {
    const match = await this.getMatchById(params.matchId);
    if (!match) throw new Error('Jogo não encontrado');

    const market = match.markets.find((m) => m.id === params.marketId);
    if (!market) throw new Error('Mercado não encontrado');

    const newSelection: Selection = {
      id: `s-new-${Date.now()}`,
      marketId: market.id,
      outcome: params.outcome,
      label: params.label,
      odds: params.odds,
      status: 'ACTIVE',
    };

    market.selections.push(newSelection);

    const client = supabaseService.getClient();
    if (client) {
      await client.from('selections').insert({
        id: newSelection.id,
        market_id: market.id,
        outcome: newSelection.outcome,
        label: newSelection.label,
        odds: newSelection.odds,
        status: 'ACTIVE'
      });
    }

    db.matches.set(match.id, match);
    return market;
  }

  private static generateDefaultCorrectScores(home: string, away: string): Selection[] {
    const baseId = `s-cs-${Date.now()}`;
    const scores = [
      { score: '0-0', odds: 8.0 },
      { score: '1-0', odds: 6.5 },
      { score: '1-1', odds: 6.0 },
      { score: '0-1', odds: 7.5 },
      { score: '2-0', odds: 10.0 },
      { score: '2-1', odds: 9.0 },
      { score: '1-2', odds: 11.0 },
      { score: '0-2', odds: 14.0 },
      { score: '2-2', odds: 12.0 },
      { score: '3-0', odds: 18.0 },
      { score: '3-1', odds: 16.0 },
      { score: '3-2', odds: 22.0 },
      { score: '0-3', odds: 25.0 },
      { score: '1-3', odds: 22.0 },
      { score: '2-3', odds: 28.0 },
      { score: '3-3', odds: 45.0 },
      { score: 'OTHER', odds: 15.0, label: 'Qualquer Outro' }
    ];

    return scores.map((s, idx) => ({
      id: `${baseId}-${idx}`,
      outcome: s.score,
      label: s.label || s.score,
      odds: s.odds,
      status: 'ACTIVE'
    }));
  }
}
