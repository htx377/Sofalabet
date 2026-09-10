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
  DepositProof,
  DepositProofStatus,
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
  public depositProofs: DepositProof[] = [];

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
      {
        id: 'comp-dist-muanza',
        name: 'Campeonato Distrital de Muanza',
        country: 'Distrito de Muanza, Sofala',
        code: 'CDMU',
        category: 'DISTRITAL',
      },
      {
        id: 'comp-dist-cheringoma',
        name: 'Campeonato Distrital de Cheringoma',
        country: 'Distrito de Cheringoma, Sofala',
        code: 'CDCH',
        category: 'DISTRITAL',
      },
    ];

    // 2. Seed Teams (Clubes Moçambicanos)
    this.teams = [
      // Moçambola
      { id: 'team-1', name: 'Black Bulls', shortName: 'ABB' },
      { id: 'team-2', name: 'Ferroviário de Maputo', shortName: 'CFM' },
      { id: 'team-3', name: 'Desportivo de Nacala', shortName: 'NAC' },
      { id: 'team-4', name: 'Costa do Sol', shortName: 'CDS' },
      { id: 'team-5', name: 'Ferroviário da Beira', shortName: 'CFB' },
      { id: 'team-6', name: 'Clube de Chibuto', shortName: 'CHI' },
      { id: 'team-7', name: 'UD Songo', shortName: 'UDS' },
      { id: 'team-8', name: 'Ferroviário de Nampula', shortName: 'CFN' },
      { id: 'team-9', name: 'Textáfrica de Chimoio', shortName: 'TEX' },
      { id: 'team-10', name: 'Baía de Pemba FC', shortName: 'BAP' },
      { id: 'team-11', name: 'Brera Tchumene FC', shortName: 'BRE' },
      // Campeonatos Provinciais
      { id: 'team-12', name: 'Angoche FC', shortName: 'ANG' },
      { id: 'team-13', name: 'Mecuburi FC', shortName: 'MEC' },
      { id: 'team-14', name: 'Liga Desportiva de Sofala', shortName: 'LDS' },
      { id: 'team-15', name: 'Sporting Clube da Beira', shortName: 'SCB' },
      { id: 'team-16', name: 'Pipeline da Beira', shortName: 'PIP' },
      { id: 'team-17', name: 'Estrela Vermelha da Beira', shortName: 'EVB' },
      { id: 'team-18', name: 'Palmeiras de Púnguè', shortName: 'PAL' },
      { id: 'team-19', name: 'Chingale de Tete', shortName: 'CHT' },
      // Campeonatos Distritais
      { id: 'team-20', name: 'Estrela Vermelha', shortName: 'EV' },
      { id: 'team-21', name: 'União de Beira', shortName: 'UB' },
      { id: 'team-22', name: 'Munhava Futebol Clube', shortName: 'MFC' },
      { id: 'team-23', name: 'Manga Sport Clube', shortName: 'MSC' },
      { id: 'team-24', name: 'Atlético Clube do Dondo', shortName: 'ACD' },
      { id: 'team-25', name: 'Desportivo de Nhamatanda', shortName: 'DNH' },
      { id: 'team-26', name: 'Marromeu FC', shortName: 'MAR' },
      { id: 'team-27', name: 'Búzi Futebol Clube', shortName: 'BFC' },
      // Distrito de Muanza
      { id: 'team-28', name: 'Ferroviário de Muanza', shortName: 'CFM-MZ' },
      { id: 'team-29', name: 'Desportivo de Muanza', shortName: 'DMU' },
      // Distrito de Cheringoma (Inhaminga)
      { id: 'team-30', name: 'Águias de Inhaminga', shortName: 'AIN' },
      { id: 'team-31', name: 'União Desportiva de Cheringoma', shortName: 'UDC' },
    ];

    // 3. Seed Users
    // Super Admin 1: 872344381 / 12345678j (Super Administrador ZONABET)
    const superAdminPasswordHash = bcrypt.hashSync('12345678j', 10);
    const superAdminUser: User = {
      id: 'usr-superadmin-01',
      name: 'Super Administrador ZONABET',
      email: 'admin@zonabet.mz',
      phone: '+258872344381',
      passwordHash: superAdminPasswordHash,
      role: 'ADMIN',
      isBlocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(superAdminUser.id, superAdminUser);

    const superAdminWallet: Wallet = {
      id: 'wal-superadmin-01',
      userId: superAdminUser.id,
      balance: 1000000,
      lockedBalance: 0,
      updatedAt: new Date().toISOString(),
    };
    this.wallets.set(superAdminUser.id, superAdminWallet);

    // Super Admin 2 (User account for isapsiqui377@gmail.com & admin@example.com)
    const admin2PasswordHash = bcrypt.hashSync('Admin123!ChangeMe', 10);
    const admin2User: User = {
      id: 'usr-superadmin-02',
      name: 'Gestor Geral ZONABET',
      email: 'admin@example.com',
      phone: '+258872344380',
      passwordHash: admin2PasswordHash,
      role: 'ADMIN',
      isBlocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(admin2User.id, admin2User);

    const admin2Wallet: Wallet = {
      id: 'wal-superadmin-02',
      userId: admin2User.id,
      balance: 1000000,
      lockedBalance: 0,
      updatedAt: new Date().toISOString(),
    };
    this.wallets.set(admin2User.id, admin2Wallet);

    const userAdminAccount: User = {
      id: 'usr-superadmin-03',
      name: 'Administrador ZONABET (Isa)',
      email: 'isapsiqui377@gmail.com',
      phone: '+258872344382',
      passwordHash: superAdminPasswordHash,
      role: 'ADMIN',
      isBlocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(userAdminAccount.id, userAdminAccount);
    this.wallets.set(userAdminAccount.id, {
      id: 'wal-superadmin-03',
      userId: userAdminAccount.id,
      balance: 1000000,
      lockedBalance: 0,
      updatedAt: new Date().toISOString(),
    });

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
      balance: 1000000.00, // 1 000 000,00 MZN
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
      amount: 1000000.00,
      previousBalance: 0.00,
      nextBalance: 1000000.00,
      reference: 'BÓNUS-BOAS-VINDAS',
      description: 'Depósito inicial de boas-vindas da conta em MZN',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    };
    this.transactions.push(initialDepositTx);

    // Initial seed deposit proof
    this.depositProofs.push({
      id: 'proof-seed-01',
      userId: testUser.id,
      userName: testUser.name,
      userPhone: testUser.phone,
      userEmail: testUser.email,
      amount: 1000000.0,
      method: 'MPESA',
      referenceCode: 'DEP-MPESA-10001',
      operatorTxId: 'MP260907.1240.B9182',
      receiptFileName: 'comprovativo_mpesa_1000mzn.png',
      notes: 'Depósito inicial efetuado via M-Pesa Agente Beira Centro',
      status: 'APPROVED',
      reviewedBy: 'admin@example.com',
      reviewNotes: 'Verificado e validado com o extrato da Vodacom M-Pesa',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 3.5).toISOString(),
    });

    // 4. Seed Matches & 1X2 Markets (Moçambola, Provinciais e Distritais)
    const sampleMatches: Match[] = [
      {
        id: 'match-1',
        competitionId: 'comp-mocambola',
        competitionName: 'Moçambola',
        competitionCategory: 'MOCAMBOLA',
        homeTeam: 'Black Bulls',
        awayTeam: 'Ferroviário de Maputo',
        kickoffDate: 'Hoje',
        kickoffTime: '15:00',
        status: 'OPEN',
        description: 'Duelo pelo Moçambola no Campo de Tchumene.',
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
              { id: 'sel-1-1-1', marketId: 'mkt-1-1', outcome: '1', label: 'Black Bulls', odds: 1.85, status: 'ACTIVE' },
              { id: 'sel-1-1-X', marketId: 'mkt-1-1', outcome: 'X', label: 'Empate', odds: 3.40, status: 'ACTIVE' },
              { id: 'sel-1-1-2', marketId: 'mkt-1-1', outcome: '2', label: 'Ferroviário de Maputo', odds: 4.20, status: 'ACTIVE' },
            ],
          },
        ],
      },
      {
        id: 'match-2',
        competitionId: 'comp-mocambola',
        competitionName: 'Moçambola',
        competitionCategory: 'MOCAMBOLA',
        homeTeam: 'Desportivo de Nacala',
        awayTeam: 'Costa do Sol',
        kickoffDate: 'Hoje',
        kickoffTime: '17:00',
        status: 'OPEN',
        description: 'Moçambola no Campo da Bela Vista em Nacala.',
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
              { id: 'sel-2-1-1', marketId: 'mkt-2-1', outcome: '1', label: 'Desportivo de Nacala', odds: 2.10, status: 'ACTIVE' },
              { id: 'sel-2-1-X', marketId: 'mkt-2-1', outcome: 'X', label: 'Empate', odds: 3.25, status: 'ACTIVE' },
              { id: 'sel-2-1-2', marketId: 'mkt-2-1', outcome: '2', label: 'Costa do Sol', odds: 3.60, status: 'ACTIVE' },
            ],
          },
        ],
      },
      {
        id: 'match-3',
        competitionId: 'comp-prov-nampula',
        competitionName: 'Provincial - Nampula',
        competitionCategory: 'PROVINCIAL',
        homeTeam: 'Angoche FC',
        awayTeam: 'Mecuburi FC',
        kickoffDate: 'Hoje',
        kickoffTime: '15:30',
        status: 'OPEN',
        description: 'Campeonato Provincial de Nampula no Campo Municipal de Angoche.',
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
              { id: 'sel-3-1-1', marketId: 'mkt-3-1', outcome: '1', label: 'Angoche FC', odds: 2.45, status: 'ACTIVE' },
              { id: 'sel-3-1-X', marketId: 'mkt-3-1', outcome: 'X', label: 'Empate', odds: 3.10, status: 'ACTIVE' },
              { id: 'sel-3-1-2', marketId: 'mkt-3-1', outcome: '2', label: 'Mecuburi FC', odds: 2.80, status: 'ACTIVE' },
            ],
          },
        ],
      },
      {
        id: 'match-4',
        competitionId: 'comp-dist-beira',
        competitionName: 'Distrital - Sofala',
        competitionCategory: 'DISTRITAL',
        homeTeam: 'Estrela Vermelha',
        awayTeam: 'União de Beira',
        kickoffDate: 'Hoje',
        kickoffTime: '16:00',
        status: 'OPEN',
        description: 'Duelo distrital histórico no Campo das Palmeiras na Beira.',
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
              { id: 'sel-4-1-1', marketId: 'mkt-4-1', outcome: '1', label: 'Estrela Vermelha', odds: 1.95, status: 'ACTIVE' },
              { id: 'sel-4-1-X', marketId: 'mkt-4-1', outcome: 'X', label: 'Empate', odds: 3.50, status: 'ACTIVE' },
              { id: 'sel-4-1-2', marketId: 'mkt-4-1', outcome: '2', label: 'União de Beira', odds: 3.90, status: 'ACTIVE' },
            ],
          },
        ],
      },
      {
        id: 'match-5',
        competitionId: 'comp-mocambola',
        competitionName: 'Moçambola',
        competitionCategory: 'MOCAMBOLA',
        homeTeam: 'Ferroviário da Beira',
        awayTeam: 'Clube de Chibuto',
        kickoffDate: 'Hoje',
        kickoffTime: '18:00',
        status: 'OPEN',
        description: 'Noite de futebol no Estádio do Caldeirão do Chiveve na Beira.',
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
              { id: 'sel-5-1-1', marketId: 'mkt-5-1', outcome: '1', label: 'Ferroviário da Beira', odds: 1.70, status: 'ACTIVE' },
              { id: 'sel-5-1-X', marketId: 'mkt-5-1', outcome: 'X', label: 'Empate', odds: 3.60, status: 'ACTIVE' },
              { id: 'sel-5-1-2', marketId: 'mkt-5-1', outcome: '2', label: 'Clube de Chibuto', odds: 4.80, status: 'ACTIVE' },
            ],
          },
        ],
      },
      {
        id: 'match-6',
        competitionId: 'comp-mocambola',
        competitionName: 'Moçambola',
        competitionCategory: 'MOCAMBOLA',
        homeTeam: 'UD Songo',
        awayTeam: 'Ferroviário de Nampula',
        kickoffDate: 'Amanhã',
        kickoffTime: '15:00',
        status: 'OPEN',
        description: 'Duelo no Campo da HCB em Songo.',
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
              { id: 'sel-6-1-1', marketId: 'mkt-6-1', outcome: '1', label: 'UD Songo', odds: 1.90, status: 'ACTIVE' },
              { id: 'sel-6-1-X', marketId: 'mkt-6-1', outcome: 'X', label: 'Empate', odds: 3.20, status: 'ACTIVE' },
              { id: 'sel-6-1-2', marketId: 'mkt-6-1', outcome: '2', label: 'Ferroviário de Nampula', odds: 4.10, status: 'ACTIVE' },
            ],
          },
        ],
      },
      {
        id: 'match-7',
        competitionId: 'comp-dist-muanza',
        competitionName: 'Campeonato Distrital de Muanza',
        competitionCategory: 'DISTRITAL',
        homeTeam: 'Ferroviário de Muanza',
        awayTeam: 'Desportivo de Muanza',
        kickoffDate: '16/09',
        kickoffTime: '14:30',
        status: 'OPEN',
        description: 'Grande derby do distrito de Muanza no Campo Municipal de Muanza.',
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
              { id: 'sel-7-1-1', marketId: 'mkt-7-1', outcome: '1', label: 'Ferroviário de Muanza', odds: 2.20, status: 'ACTIVE' },
              { id: 'sel-7-1-X', marketId: 'mkt-7-1', outcome: 'X', label: 'Empate', odds: 3.10, status: 'ACTIVE' },
              { id: 'sel-7-1-2', marketId: 'mkt-7-1', outcome: '2', label: 'Desportivo de Muanza', odds: 2.90, status: 'ACTIVE' },
            ],
          },
        ],
      },
      {
        id: 'match-8',
        competitionId: 'comp-dist-cheringoma',
        competitionName: 'Campeonato Distrital de Cheringoma',
        competitionCategory: 'DISTRITAL',
        homeTeam: 'Águias de Inhaminga',
        awayTeam: 'União Desportiva de Cheringoma',
        kickoffDate: '17/09',
        kickoffTime: '15:00',
        status: 'OPEN',
        description: 'Duelo distrital histórico no Campo Municipal de Inhaminga, Cheringoma.',
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
              { id: 'sel-8-1-1', marketId: 'mkt-8-1', outcome: '1', label: 'Águias de Inhaminga', odds: 2.05, status: 'ACTIVE' },
              { id: 'sel-8-1-X', marketId: 'mkt-8-1', outcome: 'X', label: 'Empate', odds: 3.25, status: 'ACTIVE' },
              { id: 'sel-8-1-2', marketId: 'mkt-8-1', outcome: '2', label: 'União Desportiva de Cheringoma', odds: 3.20, status: 'ACTIVE' },
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
      if (user.email && user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return undefined;
  }

  public getUserByPhone(phone: string): User | undefined {
    const targetDigits = phone.replace(/\D/g, '');
    if (!targetDigits) return undefined;

    for (const user of this.users.values()) {
      if (!user.phone) continue;
      const userDigits = user.phone.replace(/\D/g, '');
      // Match exact digits or suffix of 9 Mozambican digits (e.g. 841234567)
      if (
        userDigits === targetDigits ||
        (targetDigits.length >= 8 && userDigits.endsWith(targetDigits.slice(-9))) ||
        (userDigits.length >= 8 && targetDigits.endsWith(userDigits.slice(-9)))
      ) {
        return user;
      }
    }
    return undefined;
  }

  public getUserByIdentifier(identifier: string): User | undefined {
    const trimmed = identifier.trim();
    if (trimmed.includes('@')) {
      return this.getUserByEmail(trimmed);
    }
    // Try by phone first
    const byPhone = this.getUserByPhone(trimmed);
    if (byPhone) return byPhone;
    // Fallback to email in case identifier is an email without @ or username
    return this.getUserByEmail(trimmed);
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

  public addDepositProof(proof: DepositProof): DepositProof {
    this.depositProofs.unshift(proof);
    return proof;
  }

  public getDepositProofs(userId?: string): DepositProof[] {
    if (userId) {
      return this.depositProofs.filter((d) => d.userId === userId);
    }
    return this.depositProofs;
  }

  public getDepositProof(id: string): DepositProof | undefined {
    return this.depositProofs.find((d) => d.id === id);
  }

  public updateDepositProofStatus(
    id: string,
    status: DepositProofStatus,
    reviewedBy?: string,
    reviewNotes?: string
  ): DepositProof | null {
    const proof = this.depositProofs.find((p) => p.id === id);
    if (!proof) return null;
    proof.status = status;
    if (reviewedBy) proof.reviewedBy = reviewedBy;
    if (reviewNotes !== undefined) proof.reviewNotes = reviewNotes;
    proof.updatedAt = new Date().toISOString();
    return proof;
  }
}

export const db = new DatabaseStore();
export const dbStore = db;
