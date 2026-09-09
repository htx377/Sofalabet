-- ==========================================================
-- SofalaBet Moçambique - Esquema de Base de Dados para Supabase
-- Sistema Oficial de Apostas Desportivas (M-Pesa, e-Mola, mKesh)
-- ==========================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE COMPETIÇÕES
CREATE TABLE IF NOT EXISTS competitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    code TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('MOCAMBOLA', 'PROVINCIAL', 'DISTRITAL')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE UTILIZADORES
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'AGENT')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'BLOCKED', 'SUSPENDED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE CARTEIRAS (WALLETS)
CREATE TABLE IF NOT EXISTS wallets (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    currency TEXT NOT NULL DEFAULT 'MZN',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA DE TRANSAÇÕES FINANCEIRAS (LEDGER)
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAWAL', 'BET_PLACED', 'BET_PAYOUT', 'REFUND', 'ADJUSTMENT')),
    amount NUMERIC(12, 2) NOT NULL,
    balance_before NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    reference TEXT NOT NULL,
    notes TEXT,
    operator TEXT,
    status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA DE JOGOS & ODDS (MATCHES)
CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    competition_id TEXT REFERENCES competitions(id) ON DELETE SET NULL,
    competition_name TEXT NOT NULL,
    competition_category TEXT NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    kickoff_date TEXT NOT NULL,
    kickoff_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'SUSPENDED', 'CLOSED', 'FINISHED', 'CANCELLED')),
    home_score INTEGER DEFAULT NULL,
    away_score INTEGER DEFAULT NULL,
    markets JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABELA DE APOSTAS (BETS)
CREATE TABLE IF NOT EXISTS bets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stake NUMERIC(12, 2) NOT NULL CHECK (stake > 0),
    total_odds NUMERIC(8, 2) NOT NULL,
    potential_win NUMERIC(12, 2) NOT NULL,
    actual_payout NUMERIC(12, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'WON', 'LOST', 'VOID')),
    type TEXT NOT NULL CHECK (type IN ('SINGLE', 'MULTIPLE')),
    selections JSONB NOT NULL DEFAULT '[]'::jsonb,
    placed_at TIMESTAMPTZ DEFAULT NOW(),
    settled_at TIMESTAMPTZ DEFAULT NULL
);

-- 8. TABELA DE COMPROVATIVOS DE DEPÓSITO (DEPOSIT PROOFS)
CREATE TABLE IF NOT EXISTS deposit_proofs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_phone TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('MPESA', 'EMOLA', 'MKESH', 'BANK_TRANSFER')),
    reference_code TEXT NOT NULL,
    operator_tx_id TEXT,
    receipt_data_url TEXT,
    receipt_file_name TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ DEFAULT NULL
);

-- 9. TABELA DE REGISTOS DE AUDITORIA (AUDIT LOGS)
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ÍNDICES PARA ALTA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status, kickoff_date);
CREATE INDEX IF NOT EXISTS idx_bets_user ON bets(user_id, placed_at DESC);
CREATE INDEX IF NOT EXISTS idx_proofs_status ON deposit_proofs(status, created_at DESC);

-- POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_proofs ENABLE ROW LEVEL SECURITY;

-- Leitura pública para Jogos e Competições
CREATE POLICY "Permitir leitura pública de jogos" ON matches FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de competições" ON competitions FOR SELECT USING (true);

-- Serviço / Anon pode interagir com base nas regras de negócio da API
CREATE POLICY "Acesso completo para service role" ON users FOR ALL USING (true);
CREATE POLICY "Acesso completo para service role wallets" ON wallets FOR ALL USING (true);
CREATE POLICY "Acesso completo para service role transactions" ON wallet_transactions FOR ALL USING (true);
CREATE POLICY "Acesso completo para service role bets" ON bets FOR ALL USING (true);
CREATE POLICY "Acesso completo para service role proofs" ON deposit_proofs FOR ALL USING (true);

-- DADOS INICIAIS (COMPETIÇÕES MOÇAMBICANAS OFICIAIS)
INSERT INTO competitions (id, name, country, code, category) VALUES
    ('comp-mocambola', 'Moçambola', 'Moçambique (Nacional)', 'MOC', 'MOCAMBOLA'),
    ('comp-prov-sofala', 'Campeonato Provincial de Sofala', 'Sofala, Moçambique', 'CPS', 'PROVINCIAL'),
    ('comp-prov-manica', 'Campeonato Provincial de Manica', 'Manica, Moçambique', 'CPM', 'PROVINCIAL'),
    ('comp-prov-nampula', 'Campeonato Provincial de Nampula', 'Nampula, Moçambique', 'CPN', 'PROVINCIAL'),
    ('comp-prov-maputo', 'Campeonato Provincial de Maputo', 'Maputo, Moçambique', 'CPMP', 'PROVINCIAL'),
    ('comp-dist-beira', 'Campeonato Distrital da Beira', 'Distrito da Beira, Sofala', 'CDB', 'DISTRITAL'),
    ('comp-dist-dondo', 'Campeonato Distrital do Dondo', 'Distrito do Dondo, Sofala', 'CDD', 'DISTRITAL'),
    ('comp-dist-nhamatanda', 'Campeonato Distrital de Nhamatanda', 'Distrito de Nhamatanda, Sofala', 'CDN', 'DISTRITAL'),
    ('comp-dist-marromeu', 'Campeonato Distrital de Marromeu', 'Distrito de Marromeu, Sofala', 'CDM', 'DISTRITAL'),
    ('comp-dist-muanza', 'Campeonato Distrital de Muanza', 'Distrito de Muanza, Sofala', 'CDMU', 'DISTRITAL'),
    ('comp-dist-cheringoma', 'Campeonato Distrital de Cheringoma', 'Distrito de Cheringoma, Sofala', 'CDCH', 'DISTRITAL')
ON CONFLICT (id) DO NOTHING;
