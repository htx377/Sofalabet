import bcrypt from 'bcryptjs';
import {
  User,
  Wallet,
  WalletTransaction,
  Match,
  Competition,
  Team,
  Bet,
  AuditLog,
} from '../types/index.ts';

export interface IdempotencyRecord {
  key: string;
  responseStatus: number;
  responseBody: any;
  createdAt: string;
}

class DatabaseStore {
  public users: Map<string, User> = new Map();
  public wallets: Map<string, Wallet> = new Map(); // keyed by userId
  public transactions: WalletTransaction[] = [];
  public competitions: Competition[] = [];
  public teams: Team[] = [];
  public matches: Map<string, Match> = new Map();
  public bets: Map<string, Bet> = new Map();
  public auditLogs: AuditLog[] = [];
  public idempotencyRecords: Map<string, IdempotencyRecord> = new Map();

  private initialized = false;

  constructor() {
    this.seed();
  }

  public seed() {
    if (this.initialized) return;
    this.initialized = true;

    // 1. Seed Competitions (Moçambola, Campeonatos Provinciais e Campeonatos Distritais)
    this.competitions = [
      {
        id: 'comp-mocambola',
        name: 'Moçambola',
        country: 'Moçambique (Nacional)',
        code: 'MOC',
        category: 'MOCAMBOLA',
      },
      {
        id: 'comp-prov-sofala',
        name: 'Campeonato Provincial de Sofala',
        country: 'Sofala, Moçambique',
        code: 'CPS',
        category: 'PROVINCIAL',
      },
      {
        id: 'comp-prov-manica',
        name: 'Campeonato Provincial de Manica',
        country: 'Manica, Moçambique',
        code: 'CPM',
        category: 'PROVINCIAL',
      },
      {
        id: 'comp-prov-nampula',
        name: 'Campeonato Provincial de Nampula',
        country: 'Nampula, Moçambique',
        code: 'CPN',
        category: 'PROVINCIAL',
      },
      {
        id: 'comp-prov-maputo',
        name: 'Campeonato Provincial de Maputo',
        country: 'Maputo, Moçambique',
        code: 'CPMP',
        category: 'PROVINCIAL',
      },
      {
        id: 'comp-dist-beira',
        name: 'Campeonato Distrital da Beira',
        country: 'Distrito da Beira, Sofala',
        code: 'CDB',
        category: 'DISTRITAL',
      },
      {
        id: 'comp-dist-dondo',
        name: 'Campeonato Distrital do Dondo',
        country: 'Distrito do Dondo, Sofala',
        code: 'CDD',
        category: 'DISTRITAL',
      },
      {
        id: 'comp-dist-nhamatanda',
        name: 'Campeonato Distrital de Nhamatanda',
        country: 'Distrito de Nhamatanda, Sofala',
        code: 'CDN',
        category: 'DISTRITAL',
      },
      {
        id: 'comp-dist-marromeu',
        name: 'Campeonato Distrital de Marromeu',
        country: 'Distrito de Marromeu, Sofala',
        code: 'CDM',
        category: 'DISTRITAL',
      },
    ];

    // 2. Seed Teams (Clubes Moçambicanos)
    this.teams = [
      // Moçambola
      { id: 'team-1', name: 'Ferroviário da Beira', shortName: 'CFB' },
      { id: 'team-2', name: 'Costa do Sol', shortName: 'CDS' },
      { id: 'team-3', name: 'Associação Black Bulls', shortName: 'ABB' },
      { id: 'team-4', name: 'UD Songo', shortName: 'UDS' },
      { id: 'team-5', name: 'Ferroviário de Maputo', shortName: 'CFM' },
      { id: 'team-6', name: 'Ferroviário de Nampula', shortName: 'CFN' },
      { id: 'team-7', name: 'Textáfrica de Chimoio', shortName: 'TEX' },
      { id: 'team-8', name: 'Desportivo de Nacala', shortName: 'NAC' },
      { id: 'team-9', name: 'Baía de Pemba FC', shortName: 'BAP' },
      { id: 'team-10', name: 'Brera Tchumene FC', shortName: 'BRE' },
      // Campeonatos Provinciais
      { id: 'team-11', name: 'Liga Desportiva de Sofala', shortName: 'LDS' },
      { id: 'team-12', name: 'Sporting Clube da Beira', shortName: 'SCB' },
      { id: 'team-13', name: 'Pipeline da Beira', shortName: 'PIP' },
      { id: 'team-14', name: 'Estrela Vermelha da Beira', shortName: 'EVB' },
      { id: 'team-15', name: 'Palmeiras de Púnguè', shortName: 'PAL' },
      { id: 'team-16', name: 'Chingale de Tete', shortName: 'CHI' },
      // Campeonatos Distritais
      { id: 'team-17', name: 'Atlético Clube do Dondo', shortName: 'ACD' },
      { id: 'team-18', name: 'Desportivo de Nhamatanda', shortName: 'DNH' },
      { id: 'team-19', name: 'Munhava Futebol Clube', shortName: 'MFC' },
      { id: 'team-20', name: 'Manga Sport Clube', shortName: 'MSC' },
      { id: 'team-21', name: 'Marromeu FC', shortName: 'MAR' },
      { id: 'team-22', name: 'Búzi Futebol Clube', shortName: 'BFC' },
    ];

    // 3. Seed Users
    // Admin user: admin@example.com / Admin123!ChangeMe
    const adminPasswordHash = bcrypt.hashSync('Admin123!ChangeMe', 10);
    const adminUser: User = {
      id: 'usr-admin-01',
      name: 'Administrador SofalaBet',
      email: 'admin@example.com',
      phone: '+258840000001',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isBlocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(adminUser.id, adminUser);

    const adminWallet: Wallet = {
      id: 'wal-admin-01',
      userId: adminUser.id,
      balance: 100000,
      lockedBalance: 0,
      updatedAt: new Date().toISOString(),
    };
    this.wallets.set(adminUser.id, adminWallet);

    // Test standard user: apostador@exemplo.co.mz / Apostador123!
    const userPasswordHash = bcrypt.hashSync('Apostador123!', 10);
    const testUser: User = {
      id: 'usr-test-01',
      name: 'Nelson Tembe',
      email: 'apostador@exemplo.co.mz',
      phone: '+258841234567',
      passwordHash: userPasswordHash,
      role: 'USER',
      isBlocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(testUser.id, testUser);

    const testWallet: Wallet = {
      id: 'wal-test-01',
      userId: testUser.id,
      balance: 1000.00, // 1,000 MZN initial virtual balance
      lockedBalance: 0,
      updatedAt: new Date().toISOString(),
    };
    this.wallets.set(testUser.id, testWallet);

    // Initial ledger entry for test user
    const initialDepositTx: WalletTransaction = {
      id: 'tx-seed-01',
      walletId: testWallet.id,
      userId: testUser.id,
      type: 'DEPOSIT',
      amount: 1000.00,
      previousBalance: 0.00,
      nextBalance: 1000.00,
      reference: 'BÓNUS-BOAS-VINDAS',
      description: 'Depósito inicial de boas-vindas da conta em MZN',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    };
    this.transactions.push(initialDepositTx);

    // 4. Seed Matches & 1X2 Markets (Moçambola, Provinciais e Distritais)
    const sampleMatches: Match[] = [
      {
        id: 'match-1',
        competitionId: 'comp-mocambola',
        competitionName: 'Moçambola',
        competitionCategory: 'MOCAMBOLA',
        homeTeam: 'Ferroviário da Beira',
        awayTeam: 'Costa do Sol',
        kickoffDate: '2026-09-12',
        kickoffTime: '15:00',
        status: 'OPEN',
        description: 'Clássico nacional no Estádio do Caldeirão do Chiveve (Beira).',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        markets: [
          {
            id: 'mkt-1-1',
            matchId: 'match-1',
            type: '1X2',
            name: 'Resultado Final (1X2)',
            status: 'OPEN',
            selections: [
              { id: 'sel-1-1-1', marketId: 'mkt-1-1', outcome: '1', label: 'Ferroviário da Beira', odds: 2.15, status: 'ACTIVE' },
              { id: 'sel-1-1-X', marketId: 'mkt-1-1', outcome: 'X', label: 'Empate', odds: 3.10, status: 'ACTIVE' },
              { id: 'sel-1-1-2', marketId: 'mkt-1-1', outcome: '2', label: 'Costa do Sol', odds: 3.25, status: 'ACTIVE' },
            ],
          },
        ],
      },
      {
        id: 'match-2',
        competitionId: 'comp-mocambola',
        competitionName: 'Moçambola',
        competitionCategory: 'MOCAMBOLA',
        homeTeam: 'Associação Black Bulls',
        awayTeam: 'UD Songo',
        kickoffDate: '2026-09-13',
        kickoffTime: '15:00',
        status: 'OPEN',
        description: 'Duelo pelo topo no Campo de Tchumene. Luta renhida pelo campeonato.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        markets: [
          {
            id: 'mkt-2-1',
            matchId: 'match-2',
            type: '1X2',
            name: 'Resultado Final (1X2)',
            status: 'OPEN',
            selections: [
              { id: 'sel-2-1-1', marketId: 'mkt-2-1', outcome: '1', label: 'Associação Black Bulls', odds: 2.05, status: 'ACTIVE' },
              { id: 'sel-2-1-X', marketId: 'mkt-2-1', outcome: 'X', label: 'Empate', odds: 3.15, status: 'ACTIVE' },
              { id: 'sel-2-1-2', marketId: 'mkt-2-1', outcome: '2', label: 'UD Songo', odds: 3.40, status: 'ACTIVE' },
            ],
          },
        ],
      },
      {
        id: 'match-3',
        competitionId: 'comp-mocambola',
        competitionName: 'Moçambola',
        competitionCategory: 'MOCAMBOLA',
        homeTeam: 'Ferroviário de Maputo',
        awayTeam: 'Ferroviário de Nampula',
        kickoffDate: '2026-09-13',
        kickoffTime: '15:30',
        status: 'OPEN',
        description: 'Duelo de locomotivas no Estádio da Machava.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        markets: [
          {
            id: 'mkt-3-1',
            matchId: 'match-3',
            type: '1X2',
            name: 'Resultado Final (1X2)',
            status: 'OPEN',
            selections: [
              { id: 'sel-3-1-1', marketId: 'mkt-3-1', outcome: '1', label: 'Ferroviário de Maputo', odds: 2.20, status: 'ACTIVE' },
              { id: 'sel-3-1-X', marketId: 'mkt-3-1', outcome: 'X', label: 'Empate', odds: 3.00, status: 'ACTIVE' },
              { id: 'sel-3-1-2', marketId: 'mkt-3-1', outcome: '2', label: 'Ferroviário de Nampula', odds: 3.30, status: 'ACTIVE' },
            ],
          },
        ],
      },
      {
        id: 'match-4',
        competitionId: 'comp-mocambola',
        competitionName: 'Moçambola',
        competitionCategory: 'MOCAMBOLA',
        homeTeam: 'Textáfrica de Chimoio',
        awayTeam: 'Desportivo de Nacala',
        kickoffDate: '2026-09-14',
        kickoffTime: '15:00',
        status: 'OPEN',
        description: 'Confronto no Campo da Soalpo em Chimoio.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        markets: [
          {
            id: 'mkt-4-1',
            matchId: 'match-4',
            type: '1X2',
            name: 'Resultado Final (1X2)',
            status: 'OPEN',
            selections: [
              { id: 'sel-4-1-1', marketId: 'mkt-4-1', outcome: '1', label: 'Textáfrica de Chimoio', odds: 2.30, status: 'ACTIVE' },
              { id: 'sel-4-1-X', marketId: 'mkt-4-1', outcome: 'X', label: 'Empate', odds: 3.05, status: 'ACTIVE' },
              { id: 'sel-4-1-2', marketId: 'mkt-4-1', outcome: '2', label: 'Desportivo de Nacala', odds: 3.10, status: 'ACTIVE' },
            ],
          },
        ],
      },
      {
        id: 'match-5',
        competitionId: 'comp-prov-sofala',
        competitionName: 'Campeonato Provincial de Sofala',
        competitionCategory: 'PROVINCIAL',
        homeTeam: 'Liga Desportiva de Sofala',
        awayTeam: 'Sporting Clube da Beira',
        kickoffDate: '2026-09-14',
        kickoffTime: '15:15',
        status: 'OPEN',
        description: 'Campeonato Provincial de Sofala no Campo da Manga.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        markets: [
          {
            id: 'mkt-5-1',
            matchId: 'match-5',
            type: '1X2',
            name: 'Resultado Final (1X2)',
            status: 'OPEN',
            selections: [
              { id: 'sel-5-1-1', marketId: 'mkt-5-1', outcome: '1', label: 'Liga Desportiva de Sofala', odds: 2.40, status: 'ACTIVE' },
              { id: 'sel-5-1-X', marketId: 'mkt-5-1', outcome: 'X', label: 'Empate', odds: 3.10, status: 'ACTIVE' },
              { id: 'sel-5-1-2', marketId: 'mkt-5-1', outcome: '2', label: 'Sporting Clube da Beira', odds: 2.70, status: 'ACTIVE' },
            ],
          },
        ],
      },
      {
        id: 'match-6',
        competitionId: 'comp-prov-sofala',
        competitionName: 'Campeonato Provincial de Sofala',
        competitionCategory: 'PROVINCIAL',
        homeTeam: 'Pipeline da Beira',
        awayTeam: 'Estrela Vermelha da Beira',
        kickoffDate: '2026-09-15',
        kickoffTime: '15:00',
        status: 'OPEN',
        description: 'Duelo citadino no Campo das Palmeiras (Beira).',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        markets: [
          {
            id: 'mkt-6-1',
            matchId: 'match-6',
            type: '1X2',
            name: 'Resultado Final (1X2)',
            status: 'OPEN',
            selections: [
              { id: 'sel-6-1-1', marketId: 'mkt-6-1', outcome: '1', label: 'Pipeline da Beira', odds: 2.25, status: 'ACTIVE' },
              { id: 'sel-6-1-X', marketId: 'mkt-6-1', outcome: 'X', label: 'Empate', odds: 3.20, status: 'ACTIVE' },
              { id: 'sel-6-1-2', marketId: 'mkt-6-1', outcome: '2', label: 'Estrela Vermelha da Beira', odds: 2.95, status: 'ACTIVE' },
            ],
          },
        ],
      },
      {
        id: 'match-7',
        competitionId: 'comp-dist-beira',
        competitionName: 'Campeonato Distrital da Beira',
        competitionCategory: 'DISTRITAL',
        homeTeam: 'Munhava Futebol Clube',
        awayTeam: 'Manga Sport Clube',
        kickoffDate: '2026-09-15',
        kickoffTime: '14:30',
        status: 'OPEN',
        description: 'Derby distrital fervoroso no Campo da Munhava Central.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        markets: [
          {
            id: 'mkt-7-1',
            matchId: 'match-7',
            type: '1X2',
            name: 'Resultado Final (1X2)',
            status: 'OPEN',
            selections: [
              { id: 'sel-7-1-1', marketId: 'mkt-7-1', outcome: '1', label: 'Munhava Futebol Clube', odds: 2.10, status: 'ACTIVE' },
              { id: 'sel-7-1-X', marketId: 'mkt-7-1', outcome: 'X', label: 'Empate', odds: 3.20, status: 'ACTIVE' },
              { id: 'sel-7-1-2', marketId: 'mkt-7-1', outcome: '2', label: 'Manga Sport Clube', odds: 3.15, status: 'ACTIVE' },
            ],
          },
        ],
      },
      {
        id: 'match-8',
        competitionId: 'comp-dist-dondo',
        competitionName: 'Campeonato Distrital do Dondo',
        competitionCategory: 'DISTRITAL',
        homeTeam: 'Atlético Clube do Dondo',
        awayTeam: 'Desportivo de Nhamatanda',
        kickoffDate: '2026-09-16',
        kickoffTime: '15:00',
        status: 'OPEN',
        description: 'Campeonato Distrital no Estádio Municipal do Dondo.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        markets: [
          {
            id: 'mkt-8-1',
            matchId: 'match-8',
            type: '1X2',
            name: 'Resultado Final (1X2)',
            status: 'OPEN',
            selections: [
              { id: 'sel-8-1-1', marketId: 'mkt-8-1', outcome: '1', label: 'Atlético Clube do Dondo', odds: 1.95, status: 'ACTIVE' },
              { id: 'sel-8-1-X', marketId: 'mkt-8-1', outcome: 'X', label: 'Empate', odds: 3.30, status: 'ACTIVE' },
              { id: 'sel-8-1-2', marketId: 'mkt-8-1', outcome: '2', label: 'Desportivo de Nhamatanda', odds: 3.60, status: 'ACTIVE' },
            ],
          },
        ],
      },
    ];

    for (const match of sampleMatches) {
      this.matches.set(match.id, match);
    }
  }

  // Helper getters
  public getUserByEmail(email: string): User | undefined {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return undefined;
  }

  public getWallet(userId: string): Wallet | undefined {
    return this.wallets.get(userId);
  }

  public getTransactions(userId?: string): WalletTransaction[] {
    if (userId) {
      return this.transactions.filter((tx) => tx.userId === userId).reverse();
    }
    return [...this.transactions].reverse();
  }

  public getMatches(filter?: { status?: string; competitionId?: string; category?: string }): Match[] {
    const list = Array.from(this.matches.values());
    return list.filter((m) => {
      if (filter?.status && m.status !== filter.status) return false;
      if (filter?.competitionId && m.competitionId !== filter.competitionId) return false;
      if (filter?.category && filter.category !== 'ALL') {
        const comp = this.competitions.find((c) => c.id === m.competitionId);
        if (comp?.category !== filter.category && m.competitionCategory !== filter.category) return false;
      }
      return true;
    });
  }

  public getMatch(id: string): Match | undefined {
    return this.matches.get(id);
  }

  public getBets(userId?: string): Bet[] {
    const list = Array.from(this.bets.values());
    if (userId) {
      return list.filter((b) => b.userId === userId).reverse();
    }
    return list.reverse();
  }

  public getBet(id: string): Bet | undefined {
    return this.bets.get(id);
  }

  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const fullLog: AuditLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(fullLog);
    return fullLog;
  }
}

export const db = new DatabaseStore();
