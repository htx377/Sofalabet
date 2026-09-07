export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number; // Stored in 2-decimal format (MZN)
  lockedBalance: number;
  updatedAt: string;
}

export type TransactionType = 'DEPOSIT' | 'BET' | 'WIN' | 'REFUND' | 'ADJUSTMENT';
export type TransactionStatus = 'COMPLETED' | 'FAILED';

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  previousBalance: number;
  nextBalance: number;
  reference: string;
  description: string;
  status: TransactionStatus;
  createdAt: string;
}

export type MatchStatus = 'DRAFT' | 'OPEN' | 'SUSPENDED' | 'CLOSED' | 'FINISHED' | 'CANCELLED';
export type CompetitionCategory = 'MOCAMBOLA' | 'PROVINCIAL' | 'DISTRITAL';

export interface Competition {
  id: string;
  name: string;
  country: string;
  code: string;
  category?: CompetitionCategory;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
}

export interface Selection {
  id: string;
  marketId: string;
  outcome: '1' | 'X' | '2';
  label: string;
  odds: number;
  status: 'ACTIVE' | 'SETTLED_WIN' | 'SETTLED_LOST' | 'VOID';
}

export interface Market {
  id: string;
  matchId: string;
  type: '1X2';
  name: string;
  status: 'OPEN' | 'SUSPENDED' | 'CLOSED' | 'SETTLED';
  selections: Selection[];
}

export interface Match {
  id: string;
  competitionId: string;
  competitionName: string;
  competitionCategory?: CompetitionCategory;
  homeTeam: string;
  awayTeam: string;
  kickoffDate: string; // YYYY-MM-DD
  kickoffTime: string; // HH:mm
  status: MatchStatus;
  homeScore?: number | null;
  awayScore?: number | null;
  description?: string;
  markets: Market[];
  createdAt: string;
  updatedAt: string;
}

export type BetType = 'SINGLE' | 'MULTIPLE';
export type BetStatus = 'PENDING' | 'WON' | 'LOST' | 'VOID';

export interface BetItem {
  id: string;
  betId: string;
  matchId: string;
  matchTitle: string;
  competitionName: string;
  kickoff: string;
  marketId: string;
  marketName: string;
  selectionId: string;
  outcome: '1' | 'X' | '2';
  oddsAtBetTime: number;
  status: 'PENDING' | 'WON' | 'LOST' | 'VOID';
}

export interface Bet {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: BetType;
  stake: number;
  totalOdds: number;
  potentialReturn: number;
  status: BetStatus;
  items: BetItem[];
  idempotencyKey?: string;
  settledAt?: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: string;
  newValue?: string;
  ip: string;
  timestamp: string;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}
