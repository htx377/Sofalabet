export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  balance: number;
  isBlocked?: boolean;
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

export type CompetitionCategory = 'MOCAMBOLA' | 'PROVINCIAL' | 'DISTRITAL';

export interface Match {
  id: string;
  competitionId: string;
  competitionName: string;
  competitionCategory?: CompetitionCategory;
  homeTeam: string;
  awayTeam: string;
  kickoffDate: string;
  kickoffTime: string;
  status: 'DRAFT' | 'OPEN' | 'SUSPENDED' | 'CLOSED' | 'FINISHED' | 'CANCELLED';
  homeScore?: number | null;
  awayScore?: number | null;
  description?: string;
  markets: Market[];
  createdAt: string;
  updatedAt: string;
}

export interface Competition {
  id: string;
  name: string;
  country: string;
  code: string;
  category?: CompetitionCategory;
}

export interface BetSlipItem {
  matchId: string;
  matchTitle: string;
  competitionName: string;
  kickoff: string;
  marketId: string;
  marketName: string;
  selectionId: string;
  outcome: '1' | 'X' | '2';
  selectionLabel: string;
  odds: number;
}

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
  type: 'SINGLE' | 'MULTIPLE';
  stake: number;
  totalOdds: number;
  potentialReturn: number;
  status: 'PENDING' | 'WON' | 'LOST' | 'VOID';
  items: BetItem[];
  settledAt?: string | null;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  type: 'DEPOSIT' | 'BET' | 'WIN' | 'REFUND' | 'ADJUSTMENT';
  amount: number;
  previousBalance: number;
  nextBalance: number;
  reference: string;
  description: string;
  status: 'COMPLETED' | 'FAILED';
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

export interface DashboardStats {
  totalUsers: number;
  activeMatches: number;
  finishedMatches: number;
  pendingBets: number;
  wonBets: number;
  lostBets: number;
  totalBetVolume: number;
  totalDisbursedPayout: number;
  totalBalanceMoved: number;
  totalTransactions: number;
}
