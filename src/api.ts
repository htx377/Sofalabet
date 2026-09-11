const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('zonabet_token') || localStorage.getItem('sofalabet_token');
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem('zonabet_token', token);
  } else {
    localStorage.removeItem('zonabet_token');
    localStorage.removeItem('sofalabet_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Ocorreu um erro no pedido.');
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request<{ user: any }>('/auth/me'),
  logout: () => request<any>('/auth/logout', { method: 'POST' }),

  // Matches
  getMatches: (params?: { status?: string; competitionId?: string; category?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.competitionId) query.append('competitionId', params.competitionId);
    if (params?.category) query.append('category', params.category);
    return request<{ matches: any[] }>(`/matches?${query.toString()}`);
  },
  getCompetitions: () => request<{ competitions: any[] }>('/matches/competitions'),

  // Bets
  placeBet: (body: { items: any[]; stake: number; idempotencyKey?: string }) =>
    request<{ message: string; bet: any }>('/bets', { method: 'POST', body: JSON.stringify(body) }),
  getUserBets: () => request<{ bets: any[] }>('/bets'),
  getBetById: (id: string) => request<{ bet: any }>(`/bets/${id}`),

  // Wallet
  getWallet: () => request<{ wallet: any }>('/wallet'),
  getTransactions: () => request<{ transactions: any[] }>('/wallet/transactions'),
  getUserDepositProofs: () => request<{ proofs: any[] }>('/wallet/deposit-proofs'),
  deposit: (body: {
    amount: number;
    method: string;
    phoneNumber?: string;
    receiptImage?: string;
    receiptFileName?: string;
    receiptFileSize?: number;
    receiptReference?: string;
    notes?: string;
  }) =>
    request<{ message: string; wallet: any; transaction: any; depositProof?: any }>('/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  withdraw: (body: { amount: number; method: string; phoneNumber?: string; bankDetails?: string }) =>
    request<{
      message: string;
      wallet: any;
      transaction: any;
      fee?: number;
      feeRate?: number;
      netAmount?: number;
      grossAmount?: number;
    }>('/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  virtualTopup: (amount: number, method: string) =>
    request<{ message: string; wallet: any; transaction: any }>('/wallet/topup', {
      method: 'POST',
      body: JSON.stringify({ amount, method }),
    }),

  // Admin
  getAdminDashboard: () => request<{ stats: any }>('/admin/dashboard'),
  createMatch: (body: any) => request<{ message: string; match: any }>('/admin/matches', { method: 'POST', body: JSON.stringify(body) }),
  updateOdds: (matchId: string, odds: { home: number; draw: number; away: number }) =>
    request<{ message: string; match: any }>(`/admin/matches/${matchId}/odds`, { method: 'PUT', body: JSON.stringify({ odds }) }),
  updateMatchStatus: (matchId: string, status: string, reason?: string) =>
    request<{ message: string; match: any }>(`/admin/matches/${matchId}/status`, { method: 'PUT', body: JSON.stringify({ status, reason }) }),
  enterResult: (matchId: string, homeScore: number, awayScore: number) =>
    request<{ message: string; settlement: any }>(`/admin/matches/${matchId}/result`, {
      method: 'POST',
      body: JSON.stringify({ homeScore, awayScore }),
    }),
  cancelMatch: (matchId: string, reason: string) =>
    request<{ message: string; result: any }>(`/admin/matches/${matchId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  getUsers: () => request<{ users: any[] }>('/admin/users'),
  toggleUserBlock: (userId: string) =>
    request<{ message: string; user: any }>(`/admin/users/${userId}/block`, { method: 'PATCH' }),
  changeUserRole: (userId: string, role: 'USER' | 'ADMIN') =>
    request<{ message: string; user: any }>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
  resetUserPassword: (userId: string, newPassword?: string) =>
    request<{ message: string; tempPassword?: string }>(`/admin/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),
  getAdminUserBets: (userId: string) =>
    request<{ bets: any[] }>(`/admin/users/${userId}/bets`),
  getAdminUserTransactions: (userId: string) =>
    request<{ transactions: any[] }>(`/admin/users/${userId}/transactions`),
  deleteMatch: (matchId: string) =>
    request<{ message: string }>(`/admin/matches/${matchId}`, { method: 'DELETE' }),
  adjustBalance: (body: { userId: string; amount: number; reason: string }) =>
    request<{ message: string; wallet: any; transaction: any }>('/admin/users/adjust-balance', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getAdminAuditLogs: () => request<{ logs: any[] }>('/admin/audit-logs'),
  getAdminBets: () => request<{ bets: any[] }>('/admin/bets'),
  getAdminTransactions: () => request<{ transactions: any[] }>('/admin/transactions'),
  getAdminDepositProofs: () => request<{ proofs: any[] }>('/admin/deposit-proofs'),
  updateDepositProofStatus: (id: string, status: string, reviewNotes?: string) =>
    request<{ message: string; proof: any }>(`/admin/deposit-proofs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reviewNotes }),
    }),
  getSupabaseStatus: () =>
    request<{
      isConfigured: boolean;
      connected: boolean;
      url: string | null;
      hasServiceKey: boolean;
      hasAnonKey: boolean;
      error?: string | null;
      tables?: any;
    }>('/supabase/status'),
  syncSupabase: () =>
    request<{ success: boolean; message: string; details?: any }>('/supabase/sync', {
      method: 'POST',
    }),
  pullSupabase: () =>
    request<{ success: boolean; message: string; details?: any }>('/supabase/pull', {
      method: 'POST',
    }),
  getSupabaseSchema: () =>
    request<{ sql: string }>('/supabase/schema'),
};
