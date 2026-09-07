# SofalaBet — Plataforma Web de Apostas Desportivas (Futebol Oficial)

Plataforma completa de apostas desportivas focada exclusivamente em **Futebol**, concebida e desenvolvida com padrões rigorosos de segurança financeira, integridade concorrencial, auditoria imutável e design mobile-first.

A plataforma opera com **saldo virtual em Meticais (MZN)** em ambiente de teste seguro, com gestão manual de jogos e odds por administradores (sem dependência de APIs externas de resultados ou fornecedores desportivos de terceiros).

---

## 1. Principais Funcionalidades

### Apostadores (Frontoffice)
- **Registo e Autenticação Segura:** Proteção com senhas criptografadas (`bcrypt`) e tokens JWT assinados.
- **Jogos em Destaque & 1X2:** Visualização de confrontos (Moçambola, Liga dos Campeões UEFA, Premier League, La Liga) com odds atualizadas para Casa (1), Empate (X) e Fora (2).
- **Boletim de Apostas Interativo:**
  - Adição instantânea com 1 clique nas odds.
  - Suporte a Apostas Simples e Múltiplas (Acumulador).
  - Cálculo automático de odds totais e retorno potencial (`Stake × Odds`).
  - Congelamento das odds no momento exato do registo da aposta.
  - Sticky bottom sheet para experiência ágil em smartphones.
- **Carteira Virtual (MZN):**
  - Saldo em tempo real com proteção contra saldo negativo.
  - Recarga virtual simulada (M-Pesa e e-Mola) para testes em sandbox.
- **Histórico Completo de Apostas:** Acompanhamento do estado (`PENDING`, `WON`, `LOST`, `VOID`) e datas de liquidação.
- **Extrato Financeiro (Ledger):** Registo com saldo anterior, saldo posterior, montante, tipo (`DEPOSIT`, `BET`, `WIN`, `REFUND`, `ADJUSTMENT`) e referência de auditoria.

### Painel Administrativo (Backoffice)
- **Dashboard Analítico:** Métricas consolidadas de utilizadores, jogos abertos/terminados, volume de apostas, prémios distribuídos e transações.
- **Gestão Manual de Jogos:**
  - Criação de novos jogos (competição, equipas, data, hora, odds iniciais 1X2).
  - Alteração de odds em tempo real enquanto o jogo estiver aberto (`OPEN`).
  - Controlo de estados: `DRAFT`, `OPEN`, `SUSPENDED`, `CLOSED`.
- **Liquidação Atómica de Resultados:**
  - Introdução do resultado final oficial (golos casa vs golos fora).
  - Avaliação automática dos vencedores e crédito imediato no saldo dos utilizadores.
  - Bloqueio estrito contra liquidações duplicadas.
- **Cancelamento e Reembolso (VOID):** Cancelamento de jogos com motivo obrigatório, convertendo apostas em `VOID` e estornando o stake integral para o saldo dos clientes.
- **Gestão de Utilizadores e Saldos:** Bloqueio/desbloqueio de contas e ajustes manuais de saldo devidamente justificados.
- **Registo Central de Auditoria:** Log com endereço IP, administrador, timestamp e valores anterior/novo para todas as ações sensíveis.

---

## 2. Arquitetura e Engenharia de Software

### Stack Tecnológica
- **Backend:** Node.js, Express, TypeScript, Zod (validação rigorosa de schemas), JWT, bcrypt.
- **Frontend:** React, Tailwind CSS, Lucide Icons, Vite.
- **Base de Dados:** PostgreSQL com schema relacional documentado em `backend/prisma/schema.prisma` e `backend/src/db/store.ts`.
- **Contentores:** Docker e Docker Compose (`docker-compose.yml`, `docker/Dockerfile.backend`).

### Integridade Financeira e Aritmética Exata
- **Sem Floating-Point:** Todas as operações financeiras utilizam a classe `Money`, operando em centavos inteiros (ex: `100.50 MZN` = `10050` centavos) para eliminar imprecisões decimais de ponto flutuante do JavaScript.
- **Livro-Razão (Ledger) Imutável:** Nenhum saldo é alterado diretamente. Cada alteração gera uma transação de carteira atómica com `previousBalance` e `nextBalance`.
- **Serialização de Concorrência (`KeyedMutex`):** Mutex per-user bloqueia operações simultâneas na mesma carteira, impossibilitando explorações de corrida (race conditions) para criar saldo negativo.
- **Idempotência:** Suporte a chaves de idempotência na criação de apostas para prevenir duplicação por cliques repetidos ou quebras de ligação.

---

## 3. Credenciais de Teste Pré-Configuradas

| Perfil | Email | Palavra-passe | Saldo Inicial |
|---|---|---|---|
| **Administrador** | `admin@example.com` | `Admin123!ChangeMe` | — |
| **Apostador Teste** | `apostador@exemplo.co.mz` | `Apostador123!` | 1,000.00 MZN |

---

## 4. Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js 20+
- npm

### Passo a passo
1. **Instalar Dependências:**
   ```bash
   npm install
   ```

2. **Configurar Variáveis de Ambiente:**
   Copie `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

3. **Executar em Modo de Desenvolvimento:**
   ```bash
   npm run dev
   ```
   A aplicação estará acessível em `http://localhost:3000`.

4. **Executar Testes Automatizados:**
   ```bash
   npm test
   ```
   Valida 18 cenários críticos: autenticação, hashing, criação de jogos, odds, boletim, limites de aposta, saldo insuficiente, concorrência, idempotência, liquidação atómica de prémios, cancelamento (VOID) e auditoria.

5. **Compilar para Produção:**
   ```bash
   npm run build
   npm start
   ```

---

## 5. Como Executar com Docker Compose

Para executar toda a infraestrutura (PostgreSQL + Servidor Node.js):

```bash
docker-compose up --build -d
```

Para verificar os logs:
```bash
docker-compose logs -f backend
```

---

## 6. Conformidade Legal e Jogo Responsável
- Esta versão opera estritamente em **Ambiente de Demonstração / Sandbox**, utilizando saldo fictício em MZN.
- A integração com gateways reais de pagamento (M-Pesa / e-Mola) deve ser ativada apenas após a concessão das licenças e autorizações regulamentares emitidas pelas autoridades competentes em Moçambique.
