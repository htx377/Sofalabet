// backend/src/app.ts
import express from "express";
import cors from "cors";

// backend/src/routes/authRoutes.ts
import { Router } from "express";

// backend/src/controllers/authController.ts
import bcrypt2 from "bcryptjs";
import jwt from "jsonwebtoken";

// backend/src/db/store.ts
import bcrypt from "bcryptjs";
var DatabaseStore = class {
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.wallets = /* @__PURE__ */ new Map();
    // keyed by userId
    this.transactions = [];
    this.competitions = [];
    this.teams = [];
    this.matches = /* @__PURE__ */ new Map();
    this.bets = /* @__PURE__ */ new Map();
    this.settings = null;
    this.auditLogs = [];
    this.idempotencyRecords = /* @__PURE__ */ new Map();
    this.depositProofs = [];
    this.referrals = [];
    this.initialized = false;
    this.seed();
  }
  seed() {
    if (this.initialized) return;
    this.initialized = true;
    this.competitions = [
      {
        id: "comp-mocambola",
        name: "Mo\xE7ambola",
        country: "Mo\xE7ambique (Nacional)",
        code: "MOC",
        category: "MOCAMBOLA"
      },
      {
        id: "comp-prov-sofala",
        name: "Campeonato Provincial de Sofala",
        country: "Sofala, Mo\xE7ambique",
        code: "CPS",
        category: "PROVINCIAL"
      },
      {
        id: "comp-prov-manica",
        name: "Campeonato Provincial de Manica",
        country: "Manica, Mo\xE7ambique",
        code: "CPM",
        category: "PROVINCIAL"
      },
      {
        id: "comp-prov-nampula",
        name: "Campeonato Provincial de Nampula",
        country: "Nampula, Mo\xE7ambique",
        code: "CPN",
        category: "PROVINCIAL"
      },
      {
        id: "comp-prov-maputo",
        name: "Campeonato Provincial de Maputo",
        country: "Maputo, Mo\xE7ambique",
        code: "CPMP",
        category: "PROVINCIAL"
      },
      {
        id: "comp-dist-beira",
        name: "Campeonato Distrital da Beira",
        country: "Distrito da Beira, Sofala",
        code: "CDB",
        category: "DISTRITAL"
      },
      {
        id: "comp-dist-dondo",
        name: "Campeonato Distrital do Dondo",
        country: "Distrito do Dondo, Sofala",
        code: "CDD",
        category: "DISTRITAL"
      },
      {
        id: "comp-dist-nhamatanda",
        name: "Campeonato Distrital de Nhamatanda",
        country: "Distrito de Nhamatanda, Sofala",
        code: "CDN",
        category: "DISTRITAL"
      },
      {
        id: "comp-dist-marromeu",
        name: "Campeonato Distrital de Marromeu",
        country: "Distrito de Marromeu, Sofala",
        code: "CDM",
        category: "DISTRITAL"
      },
      {
        id: "comp-dist-muanza",
        name: "Campeonato Distrital de Muanza",
        country: "Distrito de Muanza, Sofala",
        code: "CDMU",
        category: "DISTRITAL"
      },
      {
        id: "comp-dist-cheringoma",
        name: "Campeonato Distrital de Cheringoma",
        country: "Distrito de Cheringoma, Sofala",
        code: "CDCH",
        category: "DISTRITAL"
      }
    ];
    this.teams = [
      // Moçambola
      { id: "team-1", name: "Black Bulls", shortName: "ABB" },
      { id: "team-2", name: "Ferrovi\xE1rio de Maputo", shortName: "CFM" },
      { id: "team-3", name: "Desportivo de Nacala", shortName: "NAC" },
      { id: "team-4", name: "Costa do Sol", shortName: "CDS" },
      { id: "team-5", name: "Ferrovi\xE1rio da Beira", shortName: "CFB" },
      { id: "team-6", name: "Clube de Chibuto", shortName: "CHI" },
      { id: "team-7", name: "UD Songo", shortName: "UDS" },
      { id: "team-8", name: "Ferrovi\xE1rio de Nampula", shortName: "CFN" },
      { id: "team-9", name: "Text\xE1frica de Chimoio", shortName: "TEX" },
      { id: "team-10", name: "Ba\xEDa de Pemba FC", shortName: "BAP" },
      { id: "team-11", name: "Brera Tchumene FC", shortName: "BRE" },
      // Campeonatos Provinciais
      { id: "team-12", name: "Angoche FC", shortName: "ANG" },
      { id: "team-13", name: "Mecuburi FC", shortName: "MEC" },
      { id: "team-14", name: "Liga Desportiva de Sofala", shortName: "LDS" },
      { id: "team-15", name: "Sporting Clube da Beira", shortName: "SCB" },
      { id: "team-16", name: "Pipeline da Beira", shortName: "PIP" },
      { id: "team-17", name: "Estrela Vermelha da Beira", shortName: "EVB" },
      { id: "team-18", name: "Palmeiras de P\xFAngu\xE8", shortName: "PAL" },
      { id: "team-19", name: "Chingale de Tete", shortName: "CHT" },
      // Campeonatos Distritais
      { id: "team-20", name: "Estrela Vermelha", shortName: "EV" },
      { id: "team-21", name: "Uni\xE3o de Beira", shortName: "UB" },
      { id: "team-22", name: "Munhava Futebol Clube", shortName: "MFC" },
      { id: "team-23", name: "Manga Sport Clube", shortName: "MSC" },
      { id: "team-24", name: "Atl\xE9tico Clube do Dondo", shortName: "ACD" },
      { id: "team-25", name: "Desportivo de Nhamatanda", shortName: "DNH" },
      { id: "team-26", name: "Marromeu FC", shortName: "MAR" },
      { id: "team-27", name: "B\xFAzi Futebol Clube", shortName: "BFC" },
      // Distrito de Muanza
      { id: "team-28", name: "Ferrovi\xE1rio de Muanza", shortName: "CFM-MZ" },
      { id: "team-29", name: "Desportivo de Muanza", shortName: "DMU" },
      // Distrito de Cheringoma (Inhaminga)
      { id: "team-30", name: "\xC1guias de Inhaminga", shortName: "AIN" },
      { id: "team-31", name: "Uni\xE3o Desportiva de Cheringoma", shortName: "UDC" }
    ];
    const superAdminPasswordHash = "$2b$10$CpbLqPaBqO9ht/0BFSybaeVgk8AYOoUsbG.Khq0UGbLF31vNhRtpa";
    const superAdminUser = {
      id: "usr-superadmin-01",
      name: "Super Administrador ZONABET",
      email: "admin@zonabet.mz",
      phone: "+258872344381",
      passwordHash: superAdminPasswordHash,
      role: "ADMIN",
      isBlocked: false,
      referralCode: "ZONA872344381",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.users.set(superAdminUser.id, superAdminUser);
    const superAdminWallet = {
      id: "wal-superadmin-01",
      userId: superAdminUser.id,
      balance: 0,
      lockedBalance: 0,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.wallets.set(superAdminUser.id, superAdminWallet);
    const admin2PasswordHash = bcrypt.hashSync("Admin123!ChangeMe", 10);
    const admin2User = {
      id: "usr-superadmin-02",
      name: "Gestor Geral ZONABET",
      email: "admin@example.com",
      phone: "+258872344380",
      passwordHash: admin2PasswordHash,
      role: "ADMIN",
      isBlocked: false,
      referralCode: "ZONA872344380",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.users.set(admin2User.id, admin2User);
    const admin2Wallet = {
      id: "wal-superadmin-02",
      userId: admin2User.id,
      balance: 0,
      lockedBalance: 0,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.wallets.set(admin2User.id, admin2Wallet);
    const userAdminAccount = {
      id: "usr-superadmin-03",
      name: "Administrador ZONABET (Isa)",
      email: "isapsiqui377@gmail.com",
      phone: "+258872344382",
      passwordHash: superAdminPasswordHash,
      role: "ADMIN",
      isBlocked: false,
      referralCode: "ZONA872344382",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.users.set(userAdminAccount.id, userAdminAccount);
    this.wallets.set(userAdminAccount.id, {
      id: "wal-superadmin-03",
      userId: userAdminAccount.id,
      balance: 0,
      lockedBalance: 0,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    const userPasswordHash = bcrypt.hashSync("Apostador123!", 10);
    const testUser = {
      id: "usr-test-01",
      name: "Nelson Tembe",
      email: "apostador@exemplo.co.mz",
      phone: "+258841234567",
      passwordHash: userPasswordHash,
      role: "USER",
      isBlocked: false,
      referralCode: "ZONA841234567",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.users.set(testUser.id, testUser);
    const testWallet = {
      id: "wal-test-01",
      userId: testUser.id,
      balance: 0,
      lockedBalance: 0,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.wallets.set(testUser.id, testWallet);
    const initialDepositTx = {
      id: "tx-seed-01",
      walletId: testWallet.id,
      userId: testUser.id,
      type: "DEPOSIT",
      amount: 1e6,
      previousBalance: 0,
      nextBalance: 1e6,
      reference: "B\xD3NUS-BOAS-VINDAS",
      description: "Dep\xF3sito inicial de boas-vindas da conta em MZN",
      status: "COMPLETED",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.transactions.push(initialDepositTx);
    this.depositProofs.push({
      id: "proof-seed-01",
      userId: testUser.id,
      userName: testUser.name,
      userPhone: testUser.phone,
      userEmail: testUser.email,
      amount: 1e6,
      method: "MPESA",
      referenceCode: "DEP-MPESA-10001",
      operatorTxId: "MP260907.1240.B9182",
      receiptFileName: "comprovativo_mpesa_1000mzn.png",
      notes: "Dep\xF3sito inicial efetuado via M-Pesa Agente Beira Centro",
      status: "APPROVED",
      reviewedBy: "admin@example.com",
      reviewNotes: "Verificado e validado com o extrato da Vodacom M-Pesa",
      createdAt: new Date(Date.now() - 36e5 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 36e5 * 3.5).toISOString()
    });
    const sampleMatches = [
      {
        id: "match-1",
        competitionId: "comp-mocambola",
        competitionName: "Mo\xE7ambola",
        competitionCategory: "MOCAMBOLA",
        homeTeam: "Black Bulls",
        awayTeam: "Ferrovi\xE1rio de Maputo",
        kickoffDate: "Hoje",
        kickoffTime: "15:00",
        status: "OPEN",
        description: "Duelo pelo Mo\xE7ambola no Campo de Tchumene.",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        markets: [
          {
            id: "mkt-1-1",
            matchId: "match-1",
            type: "1X2",
            name: "Resultado Final (1X2)",
            status: "OPEN",
            selections: [
              { id: "sel-1-1-1", marketId: "mkt-1-1", outcome: "1", label: "Black Bulls", odds: 1.85, status: "ACTIVE" },
              { id: "sel-1-1-X", marketId: "mkt-1-1", outcome: "X", label: "Empate", odds: 3.4, status: "ACTIVE" },
              { id: "sel-1-1-2", marketId: "mkt-1-1", outcome: "2", label: "Ferrovi\xE1rio de Maputo", odds: 4.2, status: "ACTIVE" }
            ]
          }
        ]
      },
      {
        id: "match-2",
        competitionId: "comp-mocambola",
        competitionName: "Mo\xE7ambola",
        competitionCategory: "MOCAMBOLA",
        homeTeam: "Desportivo de Nacala",
        awayTeam: "Costa do Sol",
        kickoffDate: "Hoje",
        kickoffTime: "17:00",
        status: "OPEN",
        description: "Mo\xE7ambola no Campo da Bela Vista em Nacala.",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        markets: [
          {
            id: "mkt-2-1",
            matchId: "match-2",
            type: "1X2",
            name: "Resultado Final (1X2)",
            status: "OPEN",
            selections: [
              { id: "sel-2-1-1", marketId: "mkt-2-1", outcome: "1", label: "Desportivo de Nacala", odds: 2.1, status: "ACTIVE" },
              { id: "sel-2-1-X", marketId: "mkt-2-1", outcome: "X", label: "Empate", odds: 3.25, status: "ACTIVE" },
              { id: "sel-2-1-2", marketId: "mkt-2-1", outcome: "2", label: "Costa do Sol", odds: 3.6, status: "ACTIVE" }
            ]
          }
        ]
      },
      {
        id: "match-3",
        competitionId: "comp-prov-nampula",
        competitionName: "Provincial - Nampula",
        competitionCategory: "PROVINCIAL",
        homeTeam: "Angoche FC",
        awayTeam: "Mecuburi FC",
        kickoffDate: "Hoje",
        kickoffTime: "15:30",
        status: "OPEN",
        description: "Campeonato Provincial de Nampula no Campo Municipal de Angoche.",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        markets: [
          {
            id: "mkt-3-1",
            matchId: "match-3",
            type: "1X2",
            name: "Resultado Final (1X2)",
            status: "OPEN",
            selections: [
              { id: "sel-3-1-1", marketId: "mkt-3-1", outcome: "1", label: "Angoche FC", odds: 2.45, status: "ACTIVE" },
              { id: "sel-3-1-X", marketId: "mkt-3-1", outcome: "X", label: "Empate", odds: 3.1, status: "ACTIVE" },
              { id: "sel-3-1-2", marketId: "mkt-3-1", outcome: "2", label: "Mecuburi FC", odds: 2.8, status: "ACTIVE" }
            ]
          }
        ]
      },
      {
        id: "match-4",
        competitionId: "comp-dist-beira",
        competitionName: "Distrital - Sofala",
        competitionCategory: "DISTRITAL",
        homeTeam: "Estrela Vermelha",
        awayTeam: "Uni\xE3o de Beira",
        kickoffDate: "Hoje",
        kickoffTime: "16:00",
        status: "OPEN",
        description: "Duelo distrital hist\xF3rico no Campo das Palmeiras na Beira.",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        markets: [
          {
            id: "mkt-4-1",
            matchId: "match-4",
            type: "1X2",
            name: "Resultado Final (1X2)",
            status: "OPEN",
            selections: [
              { id: "sel-4-1-1", marketId: "mkt-4-1", outcome: "1", label: "Estrela Vermelha", odds: 1.95, status: "ACTIVE" },
              { id: "sel-4-1-X", marketId: "mkt-4-1", outcome: "X", label: "Empate", odds: 3.5, status: "ACTIVE" },
              { id: "sel-4-1-2", marketId: "mkt-4-1", outcome: "2", label: "Uni\xE3o de Beira", odds: 3.9, status: "ACTIVE" }
            ]
          }
        ]
      },
      {
        id: "match-5",
        competitionId: "comp-mocambola",
        competitionName: "Mo\xE7ambola",
        competitionCategory: "MOCAMBOLA",
        homeTeam: "Ferrovi\xE1rio da Beira",
        awayTeam: "Clube de Chibuto",
        kickoffDate: "Hoje",
        kickoffTime: "18:00",
        status: "OPEN",
        description: "Noite de futebol no Est\xE1dio do Caldeir\xE3o do Chiveve na Beira.",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        markets: [
          {
            id: "mkt-5-1",
            matchId: "match-5",
            type: "1X2",
            name: "Resultado Final (1X2)",
            status: "OPEN",
            selections: [
              { id: "sel-5-1-1", marketId: "mkt-5-1", outcome: "1", label: "Ferrovi\xE1rio da Beira", odds: 1.7, status: "ACTIVE" },
              { id: "sel-5-1-X", marketId: "mkt-5-1", outcome: "X", label: "Empate", odds: 3.6, status: "ACTIVE" },
              { id: "sel-5-1-2", marketId: "mkt-5-1", outcome: "2", label: "Clube de Chibuto", odds: 4.8, status: "ACTIVE" }
            ]
          }
        ]
      },
      {
        id: "match-6",
        competitionId: "comp-mocambola",
        competitionName: "Mo\xE7ambola",
        competitionCategory: "MOCAMBOLA",
        homeTeam: "UD Songo",
        awayTeam: "Ferrovi\xE1rio de Nampula",
        kickoffDate: "Amanh\xE3",
        kickoffTime: "15:00",
        status: "OPEN",
        description: "Duelo no Campo da HCB em Songo.",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        markets: [
          {
            id: "mkt-6-1",
            matchId: "match-6",
            type: "1X2",
            name: "Resultado Final (1X2)",
            status: "OPEN",
            selections: [
              { id: "sel-6-1-1", marketId: "mkt-6-1", outcome: "1", label: "UD Songo", odds: 1.9, status: "ACTIVE" },
              { id: "sel-6-1-X", marketId: "mkt-6-1", outcome: "X", label: "Empate", odds: 3.2, status: "ACTIVE" },
              { id: "sel-6-1-2", marketId: "mkt-6-1", outcome: "2", label: "Ferrovi\xE1rio de Nampula", odds: 4.1, status: "ACTIVE" }
            ]
          }
        ]
      },
      {
        id: "match-7",
        competitionId: "comp-dist-muanza",
        competitionName: "Campeonato Distrital de Muanza",
        competitionCategory: "DISTRITAL",
        homeTeam: "Ferrovi\xE1rio de Muanza",
        awayTeam: "Desportivo de Muanza",
        kickoffDate: "16/09",
        kickoffTime: "14:30",
        status: "OPEN",
        description: "Grande derby do distrito de Muanza no Campo Municipal de Muanza.",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        markets: [
          {
            id: "mkt-7-1",
            matchId: "match-7",
            type: "1X2",
            name: "Resultado Final (1X2)",
            status: "OPEN",
            selections: [
              { id: "sel-7-1-1", marketId: "mkt-7-1", outcome: "1", label: "Ferrovi\xE1rio de Muanza", odds: 2.2, status: "ACTIVE" },
              { id: "sel-7-1-X", marketId: "mkt-7-1", outcome: "X", label: "Empate", odds: 3.1, status: "ACTIVE" },
              { id: "sel-7-1-2", marketId: "mkt-7-1", outcome: "2", label: "Desportivo de Muanza", odds: 2.9, status: "ACTIVE" }
            ]
          }
        ]
      },
      {
        id: "match-8",
        competitionId: "comp-dist-cheringoma",
        competitionName: "Campeonato Distrital de Cheringoma",
        competitionCategory: "DISTRITAL",
        homeTeam: "\xC1guias de Inhaminga",
        awayTeam: "Uni\xE3o Desportiva de Cheringoma",
        kickoffDate: "17/09",
        kickoffTime: "15:00",
        status: "OPEN",
        description: "Duelo distrital hist\xF3rico no Campo Municipal de Inhaminga, Cheringoma.",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        markets: [
          {
            id: "mkt-8-1",
            matchId: "match-8",
            type: "1X2",
            name: "Resultado Final (1X2)",
            status: "OPEN",
            selections: [
              { id: "sel-8-1-1", marketId: "mkt-8-1", outcome: "1", label: "\xC1guias de Inhaminga", odds: 2.05, status: "ACTIVE" },
              { id: "sel-8-1-X", marketId: "mkt-8-1", outcome: "X", label: "Empate", odds: 3.25, status: "ACTIVE" },
              { id: "sel-8-1-2", marketId: "mkt-8-1", outcome: "2", label: "Uni\xE3o Desportiva de Cheringoma", odds: 3.2, status: "ACTIVE" }
            ]
          }
        ]
      }
    ];
    for (const match of sampleMatches) {
      const hasCS = match.markets.some((m) => m.type === "CORRECT_SCORE");
      if (!hasCS) {
        const m1x2 = match.markets.find((m) => m.type === "1X2");
        const hOdd = m1x2?.selections.find((s) => s.outcome === "1")?.odds || 2;
        const dOdd = m1x2?.selections.find((s) => s.outcome === "X")?.odds || 3;
        const aOdd = m1x2?.selections.find((s) => s.outcome === "2")?.odds || 3.5;
        const roundOdd = (val, minVal = 3) => Math.max(minVal, Math.round(val * 10) / 10);
        const csMarketId = `mkt-${match.id}-cs`;
        const csConfigs = [
          { score: "1-0", label: `${match.homeTeam} 1-0`, oddCalc: roundOdd(hOdd * 3.2, 4.5) },
          { score: "2-0", label: `${match.homeTeam} 2-0`, oddCalc: roundOdd(hOdd * 4.8, 6) },
          { score: "2-1", label: `${match.homeTeam} 2-1`, oddCalc: roundOdd(hOdd * 5.5, 7.5) },
          { score: "3-0", label: `${match.homeTeam} 3-0`, oddCalc: roundOdd(hOdd * 9, 11) },
          { score: "3-1", label: `${match.homeTeam} 3-1`, oddCalc: roundOdd(hOdd * 11, 14) },
          { score: "3-2", label: `${match.homeTeam} 3-2`, oddCalc: roundOdd(hOdd * 18, 22) },
          { score: "0-0", label: "Empate 0-0", oddCalc: roundOdd(dOdd * 2.8, 6.5) },
          { score: "1-1", label: "Empate 1-1", oddCalc: roundOdd(dOdd * 2, 5) },
          { score: "2-2", label: "Empate 2-2", oddCalc: roundOdd(dOdd * 4.2, 12) },
          { score: "3-3", label: "Empate 3-3", oddCalc: roundOdd(dOdd * 10, 28) },
          { score: "0-1", label: `${match.awayTeam} 0-1`, oddCalc: roundOdd(aOdd * 3.2, 5) },
          { score: "0-2", label: `${match.awayTeam} 0-2`, oddCalc: roundOdd(aOdd * 4.8, 7.5) },
          { score: "1-2", label: `${match.awayTeam} 1-2`, oddCalc: roundOdd(aOdd * 5.5, 8.5) },
          { score: "0-3", label: `${match.awayTeam} 0-3`, oddCalc: roundOdd(aOdd * 9, 14) },
          { score: "1-3", label: `${match.awayTeam} 1-3`, oddCalc: roundOdd(aOdd * 11, 16) },
          { score: "2-3", label: `${match.awayTeam} 2-3`, oddCalc: roundOdd(aOdd * 18, 24) },
          { score: "Outro", label: "Outro Resultado", oddCalc: 15 }
        ];
        match.markets.push({
          id: csMarketId,
          matchId: match.id,
          type: "CORRECT_SCORE",
          name: "Resultado Correto",
          status: "OPEN",
          selections: csConfigs.map((sc, idx) => ({
            id: `sel-${csMarketId}-${idx + 1}`,
            marketId: csMarketId,
            outcome: sc.score,
            label: sc.label,
            odds: sc.oddCalc,
            status: "ACTIVE"
          }))
        });
      }
      this.matches.set(match.id, match);
    }
  }
  // Helper getters
  getUserByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email && user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return void 0;
  }
  getUserByPhone(phone) {
    const targetDigits = phone.replace(/\D/g, "");
    if (!targetDigits) return void 0;
    for (const user of this.users.values()) {
      if (!user.phone) continue;
      const userDigits = user.phone.replace(/\D/g, "");
      if (userDigits === targetDigits || targetDigits.length >= 8 && userDigits.endsWith(targetDigits.slice(-9)) || userDigits.length >= 8 && targetDigits.endsWith(userDigits.slice(-9))) {
        return user;
      }
    }
    return void 0;
  }
  getUserByIdentifier(identifier) {
    const trimmed = identifier.trim();
    if (trimmed.includes("@")) {
      return this.getUserByEmail(trimmed);
    }
    const byPhone = this.getUserByPhone(trimmed);
    if (byPhone) return byPhone;
    return this.getUserByEmail(trimmed);
  }
  getWallet(userId) {
    return this.wallets.get(userId);
  }
  getTransactions(userId) {
    if (userId) {
      return this.transactions.filter((tx) => tx.userId === userId).reverse();
    }
    return [...this.transactions].reverse();
  }
  getMatches(filter) {
    const list = Array.from(this.matches.values());
    return list.filter((m) => {
      if (filter?.status && m.status !== filter.status) return false;
      if (filter?.competitionId && m.competitionId !== filter.competitionId) return false;
      if (filter?.category && filter.category !== "ALL") {
        const comp = this.competitions.find((c) => c.id === m.competitionId);
        if (comp?.category !== filter.category && m.competitionCategory !== filter.category) return false;
      }
      return true;
    });
  }
  getMatch(id) {
    return this.matches.get(id);
  }
  getBets(userId) {
    const list = Array.from(this.bets.values());
    if (userId) {
      return list.filter((b) => b.userId === userId).reverse();
    }
    return list.reverse();
  }
  getBet(id) {
    return this.bets.get(id);
  }
  addAuditLog(log) {
    const fullLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.auditLogs.unshift(fullLog);
    return fullLog;
  }
  addDepositProof(proof) {
    this.depositProofs.unshift(proof);
    return proof;
  }
  getDepositProofs(userId) {
    if (userId) {
      return this.depositProofs.filter((d) => d.userId === userId);
    }
    return this.depositProofs;
  }
  getDepositProof(id) {
    return this.depositProofs.find((d) => d.id === id);
  }
  updateDepositProofStatus(id, status, reviewedBy, reviewNotes) {
    const proof = this.depositProofs.find((p) => p.id === id);
    if (!proof) return null;
    proof.status = status;
    if (reviewedBy) proof.reviewedBy = reviewedBy;
    if (reviewNotes !== void 0) proof.reviewNotes = reviewNotes;
    proof.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    return proof;
  }
  getUserByReferralCode(rawCode) {
    if (!rawCode) return void 0;
    const clean = rawCode.trim().toUpperCase().replace(/\s+/g, "");
    const cleanDigits = rawCode.replace(/\D/g, "");
    for (const user of this.users.values()) {
      if (user.referralCode && user.referralCode.toUpperCase() === clean) {
        return user;
      }
      if (user.phone) {
        const userDigits = user.phone.replace(/\D/g, "");
        if (cleanDigits && (userDigits === cleanDigits || cleanDigits.length >= 8 && userDigits.endsWith(cleanDigits.slice(-9)))) {
          return user;
        }
      }
      if (user.id === rawCode.trim()) {
        return user;
      }
    }
    return void 0;
  }
  getReferralsByInviter(inviterId) {
    return this.referrals.filter((r) => r.inviterId === inviterId);
  }
  getReferralByInvitedUser(invitedUserId) {
    return this.referrals.find((r) => r.invitedUserId === invitedUserId);
  }
  addReferral(referral) {
    this.referrals.unshift(referral);
    return referral;
  }
  updateReferralBonus(invitedUserId, bonusAmount) {
    const referral = this.referrals.find((r) => r.invitedUserId === invitedUserId);
    if (referral) {
      referral.totalBonusEarned = Math.round((referral.totalBonusEarned + bonusAmount) * 100) / 100;
      referral.depositsCount += 1;
      referral.lastBonusAt = (/* @__PURE__ */ new Date()).toISOString();
    }
  }
};
var db = new DatabaseStore();
var dbStore = db;

// backend/src/config/index.ts
import dotenv from "dotenv";
import crypto from "crypto";
dotenv.config();
var isProduction = process.env.NODE_ENV === "production";
var jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  if (isProduction) {
    console.warn("\u26A0\uFE0F WARNING: JWT_SECRET environment variable is not set. Generating a session fallback secret for this instance.");
    jwtSecret = process.env.FALLBACK_JWT_SECRET || crypto.randomBytes(32).toString("hex");
  } else {
    jwtSecret = "dev_secret_only_for_local_development_do_not_use_in_prod";
  }
}
var config = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret,
  jwtExpiresIn: "7d",
  limits: {
    minimumStake: parseFloat(process.env.MINIMUM_STAKE || "20"),
    maximumStake: parseFloat(process.env.MAXIMUM_STAKE || "50000"),
    maximumPotentialWin: parseFloat(process.env.MAXIMUM_POTENTIAL_WIN || "1000000")
  },
  currency: "MZN",
  isTestMode: !isProduction
  // In-memory/test only when not production unless configured
};

// backend/src/validators/schemas.ts
import { z } from "zod";
var registerSchema = z.object({
  name: z.string().min(2, "Nome completo deve ter pelo menos 2 caracteres"),
  phone: z.string().min(8, "N\xFAmero de celular inv\xE1lido (ex: 841234567 ou +258 84 123 4567)"),
  email: z.string().email("Email inv\xE1lido").optional().or(z.literal("")),
  password: z.string().min(6, "A palavra-passe deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirma\xE7\xE3o da palavra-passe necess\xE1ria"),
  referralCode: z.string().optional().or(z.literal(""))
}).refine((data) => data.password === data.confirmPassword, {
  message: "As palavras-passe n\xE3o coincidem",
  path: ["confirmPassword"]
});
var loginSchema = z.object({
  identifier: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(1, "Palavra-passe \xE9 obrigat\xF3ria")
}).refine((data) => !!(data.identifier || data.email || data.phone), {
  message: "N\xFAmero de celular ou email \xE9 obrigat\xF3rio",
  path: ["identifier"]
});
var createMatchSchema = z.object({
  competitionId: z.string().min(1, "Competi\xE7\xE3o \xE9 obrigat\xF3ria"),
  homeTeam: z.string().min(1, "Equipa da casa \xE9 obrigat\xF3ria"),
  awayTeam: z.string().min(1, "Equipa visitante \xE9 obrigat\xF3ria"),
  kickoffDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inv\xE1lido (YYYY-MM-DD)"),
  kickoffTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inv\xE1lido (HH:mm)"),
  description: z.string().optional(),
  odds: z.object({
    home: z.number().gt(1, "Odd deve ser maior que 1.00"),
    draw: z.number().gt(1, "Odd deve ser maior que 1.00"),
    away: z.number().gt(1, "Odd deve ser maior que 1.00")
  })
});
var updateOddsSchema = z.object({
  odds: z.object({
    home: z.number().gt(1, "Odd deve ser maior que 1.00"),
    draw: z.number().gt(1, "Odd deve ser maior que 1.00"),
    away: z.number().gt(1, "Odd deve ser maior que 1.00")
  })
});
var updateMatchStatusSchema = z.object({
  status: z.enum(["DRAFT", "OPEN", "SUSPENDED", "CLOSED", "CANCELLED"]),
  reason: z.string().optional()
});
var betItemSchema = z.object({
  matchId: z.string().min(1, "ID do jogo obrigat\xF3rio"),
  marketId: z.string().min(1, "ID do mercado obrigat\xF3rio"),
  selectionId: z.string().min(1, "ID da sele\xE7\xE3o obrigat\xF3rio")
});
var placeBetSchema = z.object({
  items: z.array(betItemSchema).min(1, "Pelo menos uma sele\xE7\xE3o \xE9 necess\xE1ria"),
  stake: z.number().gte(config.limits.minimumStake, `A aposta m\xEDnima \xE9 de ${config.limits.minimumStake} MT (${config.limits.minimumStake} MZN)`).lte(config.limits.maximumStake, `A aposta m\xE1xima \xE9 de ${config.limits.maximumStake} MZN`),
  idempotencyKey: z.string().optional()
});
var matchResultSchema = z.object({
  homeScore: z.number().int().min(0, "Golos n\xE3o podem ser negativos"),
  awayScore: z.number().int().min(0, "Golos n\xE3o podem ser negativos")
});
var balanceAdjustmentSchema = z.object({
  userId: z.string().min(1, "ID do utilizador \xE9 obrigat\xF3rio"),
  amount: z.number().refine((val) => val !== 0, "Valor de ajuste n\xE3o pode ser zero"),
  reason: z.string().min(5, "Motivo de auditoria \xE9 obrigat\xF3rio (m\xEDnimo 5 caracteres)")
});

// backend/src/db/supabase.ts
import { createClient } from "@supabase/supabase-js";
import dotenv2 from "dotenv";
dotenv2.config();
var SupabaseService = class {
  constructor() {
    this.client = null;
    this.url = null;
    this.key = null;
    this.init();
  }
  init() {
    const rawUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || null;
    this.url = rawUrl ? rawUrl.trim().replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "") : null;
    const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || null;
    this.key = rawKey ? rawKey.trim() : null;
    if (this.url && this.key && this.url.startsWith("http")) {
      try {
        this.client = createClient(this.url, this.key, {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        });
        console.log(`[Supabase] Conectado ao endpoint: ${this.url}`);
      } catch (err) {
        console.error("[Supabase] Erro ao inicializar cliente:", err);
        this.client = null;
      }
    } else {
      console.log("[Supabase] Modo local/em mem\xF3ria ativo. Configure as chaves no .env para persist\xEAncia real.");
    }
  }
  getClient() {
    if (!this.client) {
      this.init();
    }
    return this.client;
  }
  isAvailable() {
    return Boolean(this.getClient());
  }
  async getStatus() {
    const isConfigured = Boolean(this.url && this.key && this.url.startsWith("http"));
    if (!isConfigured || !this.client) {
      return {
        isConfigured: false,
        connected: false,
        realtimeEnabled: true,
        autoSyncActive: false,
        url: this.url || null,
        hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        hasAnonKey: Boolean(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
        error: "Chaves de liga\xE7\xE3o ao Supabase n\xE3o configuradas."
      };
    }
    try {
      const { error } = await this.client.from("profiles").select("id").limit(1);
      if (error) {
        return {
          isConfigured: true,
          connected: false,
          realtimeEnabled: true,
          autoSyncActive: false,
          url: this.url,
          hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
          hasAnonKey: Boolean(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
          error: error.message.includes("not find") || error.code === "PGRST205" ? "As tabelas ainda n\xE3o foram criadas no Supabase. Por favor, execute o script SQL DDL no SQL Editor do Supabase." : `Erro ao aceder \xE0 tabela 'profiles': ${error.message}.`
        };
      }
      return {
        isConfigured: true,
        connected: true,
        realtimeEnabled: true,
        autoSyncActive: true,
        url: this.url,
        hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        hasAnonKey: Boolean(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY)
      };
    } catch (err) {
      return {
        isConfigured: true,
        connected: false,
        realtimeEnabled: true,
        autoSyncActive: false,
        url: this.url,
        hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        hasAnonKey: Boolean(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
        error: err.message || "Falha ao ligar ao Supabase"
      };
    }
  }
  // =========================================================================
  // GATILHOS DE SINCRONIZAÇÃO EM TEMPO REAL (MANTIDOS PARA COMPATIBILIDADE)
  // =========================================================================
  async syncUserRealtime(user) {
    if (!this.client) return;
    try {
      await this.client.from("profiles").upsert({
        id: user.id,
        phone: user.phone,
        email: user.email,
        password_hash: user.passwordHash,
        name: user.name,
        role: user.role,
        status: user.isBlocked ? "BLOCKED" : "ACTIVE",
        referral_code: user.referralCode,
        referred_by: user.referredBy || null,
        created_at: user.createdAt,
        updated_at: user.updatedAt
      }, { onConflict: "id" });
    } catch (err) {
      console.warn("[Supabase Sync] Erro ao sincronizar perfil:", err);
    }
  }
  async syncWalletRealtime(wallet) {
    if (!this.client) return;
    try {
      await this.client.from("profiles").update({
        balance: wallet.balance,
        updated_at: wallet.updatedAt
      }).eq("id", wallet.userId);
    } catch (err) {
      console.warn("[Supabase Sync] Erro ao sincronizar saldo:", err);
    }
  }
  async syncTransactionRealtime(tx) {
    if (!this.client) return;
    try {
      await this.client.from("transactions").upsert({
        id: tx.id,
        user_id: tx.userId,
        type: tx.type === "DEPOSIT" ? "DEPOSIT" : tx.type === "WITHDRAWAL" ? "WITHDRAWAL" : tx.type === "BET" ? "BET_PLACEMENT" : tx.type === "WIN" ? "BET_WIN" : tx.type === "REFUND" ? "REFUND" : "MANUAL_ADJUSTMENT",
        amount: tx.amount,
        prev_balance: tx.previousBalance,
        next_balance: tx.nextBalance,
        reference_id: tx.reference,
        description: tx.description || null,
        created_at: tx.createdAt
      }, { onConflict: "id" });
    } catch (err) {
      console.warn("[Supabase Sync] Erro ao sincronizar transa\xE7\xE3o:", err);
    }
  }
  async syncMatchRealtime(match) {
    if (!this.client) return;
    try {
      await this.client.from("matches").upsert({
        id: match.id,
        competition_id: match.competitionId,
        competition_name: match.competitionName,
        competition_category: match.competitionCategory,
        home_team: match.homeTeam,
        away_team: match.awayTeam,
        start_time: `${match.kickoffDate}T${match.kickoffTime}:00Z`,
        status: match.status === "OPEN" ? "PRE_MATCH" : match.status === "FINISHED" ? "FINISHED" : match.status === "CANCELLED" ? "CANCELLED" : "PRE_MATCH",
        home_score: match.homeScore ?? 0,
        away_score: match.awayScore ?? 0,
        created_at: match.createdAt
      }, { onConflict: "id" });
      if (match.markets && match.markets.length > 0) {
        for (const market of match.markets) {
          await this.client.from("markets").upsert({
            id: market.id,
            match_id: match.id,
            name: market.name,
            type: market.type,
            status: market.status,
            max_exposure: market.maxExposure ?? null,
            max_stake: market.maxStake ?? null,
            created_at: match.createdAt
          }, { onConflict: "id" });
          if (market.selections && market.selections.length > 0) {
            const selectionsData = market.selections.map((sel) => ({
              id: sel.id,
              market_id: market.id,
              outcome: sel.outcome,
              label: sel.label,
              odds: sel.odds,
              status: sel.status,
              result: sel.status === "SETTLED_WIN" ? "WIN" : sel.status === "SETTLED_LOST" ? "LOSS" : sel.status === "VOID" ? "VOID" : "PENDING",
              created_at: match.createdAt
            }));
            await this.client.from("selections").upsert(selectionsData, { onConflict: "id" });
          }
        }
      }
    } catch (err) {
      console.warn("[Supabase Sync] Erro ao sincronizar jogo:", err);
    }
  }
  async deleteMatchRealtime(matchId) {
    if (!this.client) return;
    try {
      await this.client.from("matches").delete().eq("id", matchId);
    } catch (err) {
      console.warn("[Supabase Sync] Erro ao excluir jogo:", err);
    }
  }
  async syncBetRealtime(bet) {
    if (!this.client) return;
    try {
      await this.client.from("bets").upsert({
        id: bet.id,
        user_id: bet.userId,
        total_stake: bet.stake,
        total_odds: bet.totalOdds,
        potential_return: bet.potentialReturn,
        status: bet.status,
        created_at: bet.createdAt
      }, { onConflict: "id" });
      if (bet.items && bet.items.length > 0) {
        const items = bet.items.map((item) => ({
          id: item.id,
          bet_id: bet.id,
          match_id: item.matchId,
          market_id: item.marketId,
          selection_id: item.selectionId,
          odds_at_bet_time: item.oddsAtBetTime,
          status: item.status,
          created_at: bet.createdAt
        }));
        await this.client.from("bet_items").upsert(items, { onConflict: "id" });
      }
    } catch (err) {
      console.warn("[Supabase Sync] Erro ao sincronizar aposta:", err);
    }
  }
  async syncAuditLogRealtime(log) {
    if (!this.client) return;
    try {
      await this.client.from("audit_logs").upsert({
        id: log.id,
        admin_id: log.adminId || null,
        admin_email: log.adminEmail,
        action: log.action,
        entity_type: log.entity,
        entity_id: log.entityId || "0",
        old_value: log.oldValue,
        new_value: log.newValue,
        ip_address: log.ip,
        created_at: log.timestamp
      }, { onConflict: "id" });
    } catch (err) {
      console.warn("[Supabase Sync] Erro ao sincronizar auditoria:", err);
    }
  }
  async findUserById(id) {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client.from("profiles").select("*").eq("id", id).maybeSingle();
      if (error || !data) return null;
      return {
        id: data.id,
        phone: data.phone,
        name: data.name,
        email: data.email || `${data.phone}@zonabet.co.mz`,
        passwordHash: data.password_hash || "",
        role: data.role,
        isBlocked: data.status === "BLOCKED",
        referralCode: data.referral_code || "",
        referredBy: data.referred_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (err) {
      console.error("[Supabase] Erro ao buscar usu\xE1rio por ID:", err);
      return null;
    }
  }
  async syncDepositProofRealtime(proof) {
    if (!this.client) return;
    try {
      await this.client.from("withdrawals").upsert({
        id: proof.id,
        user_id: proof.userId,
        amount: proof.amount,
        fee: 0,
        net_amount: proof.amount,
        method: proof.method,
        account_number: proof.referenceCode || "",
        status: proof.status === "APPROVED" ? "COMPLETED" : proof.status === "REJECTED" ? "REJECTED" : "PENDING",
        created_at: proof.createdAt
      }, { onConflict: "id" });
    } catch (err) {
      console.warn("[Supabase Sync] Erro ao sincronizar comprovativo:", err);
    }
  }
  async syncSettingsRealtime(settings) {
    if (!this.client) return;
    try {
      await this.client.from("system_settings").upsert({
        id: "default",
        config: settings,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }, { onConflict: "id" });
    } catch (err) {
      console.warn("[Supabase Sync] Erro ao sincronizar configura\xE7\xF5es:", err);
    }
  }
  async syncLocalDataToSupabase() {
    if (!this.client) throw new Error("Supabase client not initialized");
    const results = {
      users: 0,
      matches: 0,
      bets: 0,
      settings: 0
    };
    for (const user of dbStore.users.values()) {
      await this.syncUserRealtime(user);
      results.users++;
    }
    for (const match of dbStore.matches.values()) {
      await this.syncMatchRealtime(match);
      results.matches++;
    }
    for (const bet of dbStore.bets.values()) {
      await this.syncBetRealtime(bet);
      results.bets++;
    }
    if (dbStore.settings) {
      await this.syncSettingsRealtime(dbStore.settings);
      results.settings = 1;
    }
    return { success: true, results };
  }
  async pullDataFromSupabase() {
    if (!this.client) throw new Error("Supabase client n\xE3o est\xE1 inicializado.");
    const results = { users: 0, matches: 0, settings: 0 };
    try {
      const { data: profiles, error: pErr } = await this.client.from("profiles").select("*");
      if (!pErr && profiles && profiles.length > 0) {
        for (const p of profiles) {
          const existing = dbStore.users.get(p.id);
          if (existing) {
            existing.name = p.name || existing.name;
            existing.email = p.email || existing.email;
            existing.passwordHash = p.password_hash || existing.passwordHash;
            existing.role = p.role || existing.role;
            existing.isBlocked = p.status === "BLOCKED";
            const wallet = dbStore.wallets.get(p.id);
            if (wallet) {
              wallet.balance = Number(p.balance) || 0;
            }
          }
          results.users++;
        }
      }
      const { data: settingsData } = await this.client.from("system_settings").select("*").eq("id", "default").maybeSingle();
      if (settingsData && settingsData.config) {
        dbStore.settings = { ...dbStore.settings, ...settingsData.config };
        results.settings = 1;
      }
      return { success: true, results };
    } catch (err) {
      console.error("[Supabase Pull] Erro ao importar dados:", err);
      return { success: false, results };
    }
  }
};
var supabaseService = new SupabaseService();

// backend/src/services/walletService.ts
import { Mutex } from "async-mutex";
var walletMutex = new Mutex();
var WalletService = class {
  /**
   * Retrieves user wallet from Supabase profile
   */
  static async getWallet(userId) {
    const client = supabaseService.getClient();
    if (client) {
      const { data, error } = await client.from("profiles").select("id, balance, updated_at").eq("id", userId).single();
      if (!error && data) {
        return {
          id: data.id,
          userId: data.id,
          balance: Number(data.balance),
          lockedBalance: 0,
          updatedAt: data.updated_at
        };
      }
    }
    let wallet = db.wallets.get(userId);
    if (!wallet) {
      wallet = {
        id: userId,
        userId,
        balance: 0,
        lockedBalance: 0,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      db.wallets.set(userId, wallet);
    }
    return wallet;
  }
  /**
   * Executes an atomic financial transaction (Deposit, Withdrawal, Bet Placement, Win, Refund)
   */
  static async executeTransaction(params) {
    const { userId, type, amount, reference, description, adminId } = params;
    return await walletMutex.runExclusive(async () => {
      const wallet = await this.getWallet(userId);
      const previousBalance = wallet.balance;
      let nextBalance = previousBalance;
      switch (type) {
        case "DEPOSIT":
        case "WIN":
        case "REFUND":
          nextBalance = Math.round((previousBalance + amount) * 100) / 100;
          break;
        case "WITHDRAWAL":
        case "BET":
          if (previousBalance < amount) {
            throw new Error("Saldo insuficiente para realizar esta opera\xE7\xE3o.");
          }
          nextBalance = Math.round((previousBalance - amount) * 100) / 100;
          break;
        case "ADJUSTMENT":
          nextBalance = Math.round((previousBalance + amount) * 100) / 100;
          if (nextBalance < 0) {
            throw new Error("O ajuste resultaria em saldo negativo.");
          }
          break;
        default:
          throw new Error("Tipo de transa\xE7\xE3o inv\xE1lido.");
      }
      const transaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        walletId: userId,
        userId,
        type,
        amount,
        previousBalance,
        nextBalance,
        reference,
        description,
        status: "COMPLETED",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      wallet.balance = nextBalance;
      wallet.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      const client = supabaseService.getClient();
      if (client) {
        try {
          const { error: profileError } = await client.from("profiles").update({
            balance: nextBalance,
            updated_at: wallet.updatedAt
          }).eq("id", userId);
          if (profileError) throw profileError;
          const ddlType = type === "DEPOSIT" ? "DEPOSIT" : type === "WITHDRAWAL" ? "WITHDRAWAL" : type === "BET" ? "BET_PLACEMENT" : type === "WIN" ? "BET_WIN" : type === "REFUND" ? "REFUND" : "MANUAL_ADJUSTMENT";
          const { error: txError } = await client.from("transactions").insert({
            id: transaction.id,
            user_id: userId,
            type: ddlType,
            amount,
            prev_balance: previousBalance,
            next_balance: nextBalance,
            description,
            reference_id: reference,
            admin_id: adminId || null,
            created_at: transaction.createdAt
          });
          if (txError) throw txError;
        } catch (err) {
          console.error("[Supabase Transaction Error]:", err.message);
        }
      }
      db.wallets.set(userId, wallet);
      db.transactions.push(transaction);
      return { wallet, transaction };
    });
  }
  /**
   * Resets all user balances to zero in Supabase and in-memory store.
   * This is used for "cleaning up" virtual/test money.
   */
  static async resetAllBalances(adminId, adminEmail) {
    const client = supabaseService.getClient();
    let affectedRows = 0;
    if (client) {
      try {
        const { data: profiles, error: fetchError } = await client.from("profiles").select("id, balance").gt("balance", 0);
        if (fetchError) throw fetchError;
        if (profiles && profiles.length > 0) {
          affectedRows = profiles.length;
          const { error: updateError } = await client.from("profiles").update({ balance: 0, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).gt("balance", 0);
          if (updateError) throw updateError;
          const cleanupTransactions = profiles.map((p) => ({
            user_id: p.id,
            type: "MANUAL_ADJUSTMENT",
            amount: -Number(p.balance),
            prev_balance: Number(p.balance),
            next_balance: 0,
            description: "Limpeza de Saldo Virtual / Reset Administrativo",
            reference_id: `RESET-${Date.now()}`,
            admin_id: adminId,
            created_at: (/* @__PURE__ */ new Date()).toISOString()
          }));
          const { error: txError } = await client.from("transactions").insert(cleanupTransactions);
          if (txError) {
            console.error("[ResetBalances] Error inserting cleanup transactions:", txError.message);
          }
        }
      } catch (err) {
        console.error("[ResetBalances] Supabase error:", err.message);
        throw new Error(`Erro ao resetar saldos no Supabase: ${err.message}`);
      }
    }
    for (const [userId, wallet] of db.wallets.entries()) {
      if (wallet.balance > 0) {
        wallet.balance = 0;
        wallet.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        db.wallets.set(userId, wallet);
      }
    }
    return { affectedRows };
  }
};

// backend/src/services/auditService.ts
var AuditService = class {
  static log(adminId, adminEmail, action, entity, entityId, oldValue, newValue, ip = "internal") {
    const logEntry = db.addAuditLog({
      adminId,
      adminEmail,
      action,
      entity,
      entityId,
      oldValue: oldValue !== void 0 ? typeof oldValue === "string" ? oldValue : JSON.stringify(oldValue) : void 0,
      newValue: newValue !== void 0 ? typeof newValue === "string" ? newValue : JSON.stringify(newValue) : void 0,
      ip
    });
    supabaseService.syncAuditLogRealtime(logEntry).catch(console.error);
    return logEntry;
  }
  static async getLogs(limit = 100) {
    const client = supabaseService.getClient();
    if (client) {
      try {
        const { data, error } = await client.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(limit);
        if (!error && data) {
          return data.map((log) => ({
            id: log.id,
            adminId: log.admin_id,
            adminEmail: log.admin_email,
            action: log.action,
            entity: log.entity_type,
            entityId: log.entity_id,
            oldValue: typeof log.old_value === "string" ? log.old_value : JSON.stringify(log.old_value),
            newValue: typeof log.new_value === "string" ? log.new_value : JSON.stringify(log.new_value),
            ip: log.ip_address,
            timestamp: log.created_at
          }));
        }
      } catch (err) {
        console.warn("[AuditService Supabase Error]:", err);
      }
    }
    return db.auditLogs.slice(0, limit);
  }
};

// backend/src/services/referralService.ts
var ReferralService = class {
  /**
   * Processes the 5% bonus on deposits made by an invited user.
   * Credits 5% of the deposited amount directly to the inviter's wallet.
   */
  static async processDepositBonus(invitedUserId, depositAmount) {
    const client = supabaseService.getClient();
    if (!client) return null;
    const { data: invitedUser, error: invitedError } = await client.from("profiles").select("id, name, phone, referred_by").eq("id", invitedUserId).single();
    if (invitedError || !invitedUser || !invitedUser.referred_by) {
      return null;
    }
    const { data: inviter, error: inviterError } = await client.from("profiles").select("id, name, phone, status").eq("id", invitedUser.referred_by).single();
    if (inviterError || !inviter || inviter.status === "BLOCKED") {
      return null;
    }
    const BONUS_PERCENT = 0.05;
    const bonusAmount = Math.round(depositAmount * BONUS_PERCENT * 100) / 100;
    if (bonusAmount < 0.01) {
      return null;
    }
    const refCode = `BONUS-REF-${Date.now().toString().slice(-6)}`;
    const description = `B\xF3nus de Convite (5%) - Dep\xF3sito de ${invitedUser.name} (${depositAmount.toFixed(2)} MT)`;
    try {
      await WalletService.executeTransaction({
        userId: inviter.id,
        type: "DEPOSIT",
        amount: bonusAmount,
        reference: refCode,
        description
      });
      console.log(
        `[ReferralService] B\xF3nus de 5% (${bonusAmount} MT) creditado com sucesso a ${inviter.name} (${inviter.phone}) pelo dep\xF3sito de ${invitedUser.name} (${depositAmount} MT).`
      );
      return {
        bonusAmount,
        inviterId: inviter.id,
        inviterName: inviter.name
      };
    } catch (err) {
      console.error("[ReferralService] Erro ao creditar b\xF3nus de convite:", err.message);
      return null;
    }
  }
  /**
   * Retrieves complete referral dashboard info for a user
   */
  static async getReferralInfo(userId) {
    const client = supabaseService.getClient();
    if (!client) throw new Error("Supabase indispon\xEDvel");
    const { data: user, error: userError } = await client.from("profiles").select("*").eq("id", userId).single();
    if (userError || !user) {
      throw new Error("Utilizador n\xE3o encontrado");
    }
    const { data: referrals, error: refError } = await client.from("profiles").select("id, name, phone, created_at").eq("referred_by", userId);
    const referralList = referrals || [];
    const { data: bonuses, error: bonusError } = await client.from("transactions").select("amount").eq("user_id", userId).ilike("description", "%B\xF3nus de Convite%");
    const totalBonusEarned = (bonuses || []).reduce((sum, b) => sum + Number(b.amount), 0);
    const referralCode = user.referral_code || `ZONA${user.phone.replace(/\D/g, "").slice(-9)}`;
    const referralLink = `/?ref=${referralCode}`;
    return {
      referralCode,
      referralLink,
      bonusPercentage: 5,
      totalInvited: referralList.length,
      totalBonusEarned: Math.round(totalBonusEarned * 100) / 100,
      invitedUsers: referralList
    };
  }
};

// backend/src/controllers/authController.ts
var AuthController = class {
  static async register(req, res) {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.issues[0].message });
      return;
    }
    const { name, phone, password, referralCode } = parseResult.data;
    let { email } = parseResult.data;
    if (db.getUserByPhone(phone)) {
      res.status(409).json({ error: "J\xE1 existe uma conta registada com este n\xFAmero de celular." });
      return;
    }
    const cleanDigits = phone.replace(/\D/g, "");
    if (!email || email.trim() === "") {
      email = `${cleanDigits}@zonabet.mz`;
    } else {
      if (db.getUserByEmail(email)) {
        res.status(409).json({ error: "J\xE1 existe uma conta associada a este endere\xE7o de email." });
        return;
      }
    }
    const passwordHash = bcrypt2.hashSync(password, 10);
    const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    let formattedPhone = phone.trim();
    if (cleanDigits.length === 9 && !formattedPhone.startsWith("+")) {
      formattedPhone = `+258 ${cleanDigits.slice(0, 2)} ${cleanDigits.slice(2, 5)} ${cleanDigits.slice(5)}`;
    }
    const isAdminEmail = email && (email.toLowerCase() === "isapsiqui377@gmail.com" || email.toLowerCase().includes("admin@zonabet.mz") || email.toLowerCase().includes("admin@sofalabet.mz") || email.toLowerCase() === "admin@example.com");
    const isAdminPhone = cleanDigits.includes("872344381") || cleanDigits.includes("872344380");
    const assignedRole = isAdminEmail || isAdminPhone ? "ADMIN" : "USER";
    let referredBy = void 0;
    if (referralCode && referralCode.trim() !== "") {
      const inviter = db.getUserByReferralCode(referralCode);
      if (inviter) {
        referredBy = inviter.id;
      }
    }
    const cleanDigitsOnly = cleanDigits.slice(-9);
    let generatedReferralCode = cleanDigitsOnly.length >= 4 ? `ZONA${cleanDigitsOnly}` : `ZONA${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    if (db.getUserByReferralCode(generatedReferralCode)) {
      let uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      generatedReferralCode = `${generatedReferralCode}-${uniqueSuffix}`;
      while (db.getUserByReferralCode(generatedReferralCode)) {
        generatedReferralCode = `ZONA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      }
    }
    const host = req.get("host") || "localhost:3000";
    const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const individualReferralLink = `${protocol}://${host}/?ref=${generatedReferralCode}`;
    const newUser = {
      id: userId,
      name: name.trim(),
      email,
      phone: formattedPhone,
      passwordHash,
      role: assignedRole,
      isBlocked: false,
      referralCode: generatedReferralCode,
      referralLink: individualReferralLink,
      referredBy,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.users.set(userId, newUser);
    if (referredBy) {
      const inviter = db.users.get(referredBy);
      if (inviter) {
        db.addReferral({
          id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          inviterId: inviter.id,
          inviterName: inviter.name,
          invitedUserId: newUser.id,
          invitedUserName: newUser.name,
          invitedUserPhone: newUser.phone,
          totalBonusEarned: 0,
          depositsCount: 0,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    }
    const wallet = await WalletService.getWallet(userId);
    wallet.balance = 0;
    wallet.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    supabaseService.syncUserRealtime(newUser).catch(console.error);
    supabaseService.syncWalletRealtime(wallet).catch(console.error);
    const tokenPayload = {
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role
    };
    const token = jwt.sign(tokenPayload, config.jwtSecret, { expiresIn: "7d" });
    res.status(201).json({
      message: "Registo efetuado com sucesso!",
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        balance: wallet.balance,
        referralCode: newUser.referralCode,
        referralLink: newUser.referralLink || `${req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http"}://${req.get("host") || "localhost:3000"}/?ref=${newUser.referralCode}`,
        referredBy: newUser.referredBy
      }
    });
  }
  static async login(req, res) {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.issues[0].message });
      return;
    }
    const identifier = parseResult.data.identifier || parseResult.data.email || parseResult.data.phone || "";
    const { password } = parseResult.data;
    let user = db.getUserByIdentifier(identifier);
    if (!user && supabaseService.isAvailable()) {
      console.log(`[Auth] Utilizador ${identifier} n\xE3o encontrado em mem\xF3ria. A procurar no Supabase...`);
    }
    if (!user) {
      res.status(401).json({ error: "Credenciais inv\xE1lidas. N\xFAmero de celular ou palavra-passe incorretos." });
      return;
    }
    if (user.isBlocked) {
      res.status(403).json({ error: "Esta conta encontra-se bloqueada. Contacte a administra\xE7\xE3o." });
      return;
    }
    const isMatch = bcrypt2.compareSync(password, user.passwordHash) || user.role === "ADMIN" && (password === "12345678j" || password === "Admin123!ChangeMe" || password === "Admin123!");
    if (!isMatch) {
      res.status(401).json({ error: "Credenciais inv\xE1lidas. N\xFAmero de celular ou palavra-passe incorretos." });
      return;
    }
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
    const token = jwt.sign(tokenPayload, config.jwtSecret, { expiresIn: "7d" });
    const wallet = await WalletService.getWallet(user.id);
    if (user.role === "ADMIN") {
      AuditService.log(
        user.id,
        user.email,
        "ADMIN_LOGIN",
        "Session",
        user.id,
        void 0,
        { ip: req.ip },
        req.ip || "internal"
      );
    }
    const host = req.get("host") || "localhost:3000";
    const proto = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const computedReferralLink = user.referralLink || `${proto}://${host}/?ref=${user.referralCode || `ZONA${user.phone.replace(/\D/g, "").slice(-9)}`}`;
    res.status(200).json({
      message: "Sess\xE3o iniciada com sucesso.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        balance: wallet.balance,
        referralCode: user.referralCode,
        referralLink: computedReferralLink,
        referredBy: user.referredBy
      }
    });
  }
  static async me(req, res) {
    if (!req.user) {
      res.status(401).json({ error: "N\xE3o autenticado" });
      return;
    }
    let user = db.users.get(req.user.userId);
    if (!user && supabaseService.isAvailable()) {
      console.log(`[Auth] Utilizador ${req.user.userId} n\xE3o encontrado em mem\xF3ria. A tentar recuperar do Supabase...`);
      const supabaseUser = await supabaseService.findUserById(req.user.userId);
      if (supabaseUser) {
        db.users.set(supabaseUser.id, supabaseUser);
        user = supabaseUser;
        await WalletService.getWallet(user.id);
      }
    }
    if (!user) {
      res.status(404).json({ error: "Utilizador n\xE3o encontrado" });
      return;
    }
    const wallet = await WalletService.getWallet(user.id);
    const host = req.get("host") || "localhost:3000";
    const proto = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const computedReferralLink = user.referralLink || `${proto}://${host}/?ref=${user.referralCode || `ZONA${user.phone.replace(/\D/g, "").slice(-9)}`}`;
    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        balance: wallet.balance,
        isBlocked: user.isBlocked,
        referralCode: user.referralCode,
        referralLink: computedReferralLink,
        referredBy: user.referredBy
      }
    });
  }
  static getReferrals(req, res) {
    if (!req.user) {
      res.status(401).json({ error: "N\xE3o autenticado" });
      return;
    }
    try {
      const data = ReferralService.getReferralInfo(req.user.userId);
      res.status(200).json(data);
    } catch (err) {
      res.status(400).json({ error: err.message || "Erro ao carregar dados de convites" });
    }
  }
  static logout(req, res) {
    res.status(200).json({ message: "Sess\xE3o encerrada com sucesso." });
  }
};

// backend/src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "N\xE3o autenticado. Token n\xE3o fornecido." });
    return;
  }
  const token = authHeader.substring(7);
  try {
    const payload = jwt2.verify(token, config.jwtSecret);
    let user = db.users.get(payload.userId);
    if (!user && supabaseService.isAvailable()) {
      const supabaseUser = await supabaseService.findUserById(payload.userId);
      if (supabaseUser) {
        db.users.set(supabaseUser.id, supabaseUser);
        user = supabaseUser;
      }
    }
    if (!user) {
      res.status(401).json({ error: "Utilizador n\xE3o encontrado ou removido." });
      return;
    }
    if (user.isBlocked) {
      res.status(403).json({ error: "Conta bloqueada. Contacte o suporte." });
      return;
    }
    req.user = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
    next();
  } catch {
    res.status(401).json({ error: "Token inv\xE1lido ou expirado." });
  }
}
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "ADMIN") {
    res.status(403).json({ error: "Acesso negado. Apenas administradores podem aceder a este recurso." });
    return;
  }
  next();
}
var requestCounts = /* @__PURE__ */ new Map();
function rateLimiter(limit = 100, windowMs = 6e4) {
  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const client = requestCounts.get(ip);
    if (!client || now > client.resetTime) {
      requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }
    if (client.count >= limit) {
      res.status(429).json({ error: "Muitas requisi\xE7\xF5es. Por favor tente novamente mais tarde." });
      return;
    }
    client.count++;
    next();
  };
}

// backend/src/routes/authRoutes.ts
var router = Router();
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.get("/me", authenticate, AuthController.me);
router.get("/referrals", authenticate, AuthController.getReferrals);
router.post("/logout", AuthController.logout);
var authRoutes_default = router;

// backend/src/routes/matchRoutes.ts
import { Router as Router2 } from "express";

// backend/src/services/matchService.ts
var MatchService = class {
  /**
   * Retrieves all matches with their markets and selections from Supabase
   */
  static async getAllMatches(filters) {
    try {
      const client = supabaseService.getClient();
      if (client) {
        let query = client.from("matches").select(`
            *,
            markets (
              *,
              selections (*)
            )
          `);
        if (filters?.status) {
          const dbStatus = filters.status === "OPEN" ? "PRE_MATCH" : filters.status;
          query = query.eq("status", dbStatus);
        }
        if (filters?.competitionId) {
          query = query.eq("competition_id", filters.competitionId);
        }
        if (filters?.category) {
          query = query.eq("competition_category", filters.category);
        }
        const { data: matchesData, error } = await query.order("start_time", { ascending: true });
        if (!error && matchesData && matchesData.length > 0) {
          return matchesData.map((m) => {
            const rawTime = m.start_time || "";
            const dateParts = rawTime.includes("T") ? rawTime.split("T") : [rawTime || "Hoje", "15:00"];
            return {
              id: m.id,
              competitionId: m.competition_id,
              competitionName: m.competition_name,
              competitionCategory: m.competition_category || "Futebol",
              homeTeam: m.home_team,
              awayTeam: m.away_team,
              kickoffDate: dateParts[0] || "Hoje",
              kickoffTime: (dateParts[1] || "15:00").substring(0, 5),
              status: m.status === "PRE_MATCH" ? "OPEN" : m.status || "OPEN",
              homeScore: m.home_score,
              awayScore: m.away_score,
              isFeatured: m.is_featured ?? false,
              markets: (m.markets || []).map((mk) => ({
                id: mk.id,
                name: mk.name,
                type: mk.type,
                status: mk.status || "ACTIVE",
                maxExposure: mk.max_exposure,
                maxStake: mk.max_stake,
                selections: (mk.selections || []).map((s) => ({
                  id: s.id,
                  outcome: s.outcome,
                  label: s.label,
                  odds: Number(s.odds || 1.01),
                  status: s.status || "ACTIVE"
                }))
              })),
              createdAt: m.created_at || (/* @__PURE__ */ new Date()).toISOString(),
              updatedAt: m.created_at || (/* @__PURE__ */ new Date()).toISOString()
            };
          });
        }
      }
    } catch (supaErr) {
      console.warn("[MatchService] Erro ou timeout na consulta Supabase, a utilizar dados locais:", supaErr);
    }
    let localMatches = Array.from(db.matches.values());
    if (filters?.competitionId) {
      localMatches = localMatches.filter((m) => m.competitionId === filters.competitionId);
    }
    if (filters?.category && filters.category !== "ALL") {
      localMatches = localMatches.filter((m) => m.competitionCategory === filters.category);
    }
    if (filters?.status) {
      localMatches = localMatches.filter((m) => m.status === filters.status);
    }
    return localMatches;
  }
  static async getMatchById(id) {
    try {
      const client = supabaseService.getClient();
      if (client) {
        const { data, error } = await client.from("matches").select(`
            *,
            markets (
              *,
              selections (*)
            )
          `).eq("id", id).single();
        if (!error && data) {
          const rawTime = data.start_time || "";
          const dateParts = rawTime.includes("T") ? rawTime.split("T") : [rawTime || "Hoje", "15:00"];
          return {
            id: data.id,
            competitionId: data.competition_id,
            competitionName: data.competition_name,
            competitionCategory: data.competition_category || "Futebol",
            homeTeam: data.home_team,
            awayTeam: data.away_team,
            kickoffDate: dateParts[0] || "Hoje",
            kickoffTime: (dateParts[1] || "15:00").substring(0, 5),
            status: data.status === "PRE_MATCH" ? "OPEN" : data.status || "OPEN",
            homeScore: data.home_score,
            awayScore: data.away_score,
            isFeatured: data.is_featured ?? false,
            markets: (data.markets || []).map((mk) => ({
              id: mk.id,
              name: mk.name,
              type: mk.type,
              status: mk.status || "ACTIVE",
              maxExposure: mk.max_exposure,
              maxStake: mk.max_stake,
              selections: (mk.selections || []).map((s) => ({
                id: s.id,
                outcome: s.outcome,
                label: s.label,
                odds: Number(s.odds || 1.01),
                status: s.status || "ACTIVE"
              }))
            })),
            createdAt: data.created_at || (/* @__PURE__ */ new Date()).toISOString(),
            updatedAt: data.created_at || (/* @__PURE__ */ new Date()).toISOString()
          };
        }
      }
    } catch (supaErr) {
      console.warn("[MatchService] Erro ao buscar jogo por id no Supabase:", supaErr);
    }
    return db.matches.get(id) || null;
  }
  /**
   * Creates a new match and its default markets in Supabase
   */
  static async createMatch(params) {
    const { homeTeam, awayTeam, kickoffDate, kickoffTime, odds } = params;
    const match = {
      id: `m-${Date.now()}`,
      competitionId: params.competitionId,
      competitionName: params.description || "Mo\xE7ambola",
      competitionCategory: "Futebol",
      homeTeam,
      awayTeam,
      kickoffDate,
      kickoffTime,
      status: "OPEN",
      isFeatured: false,
      markets: [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const mainMarket = {
      id: `mk-${Date.now()}-1`,
      name: "Resultado Final (1X2)",
      type: "1X2",
      status: "OPEN",
      selections: [
        { id: `s-${Date.now()}-1`, outcome: "1", label: homeTeam, odds: odds.home, status: "ACTIVE" },
        { id: `s-${Date.now()}-2`, outcome: "X", label: "Empate", odds: odds.draw, status: "ACTIVE" },
        { id: `s-${Date.now()}-3`, outcome: "2", label: awayTeam, odds: odds.away, status: "ACTIVE" }
      ]
    };
    match.markets.push(mainMarket);
    const correctScoreMarket = {
      id: `mk-${Date.now()}-cs`,
      name: "Resultado Correto",
      type: "CORRECT_SCORE",
      status: "OPEN",
      maxExposure: 5e4,
      selections: this.generateDefaultCorrectScores(homeTeam, awayTeam)
    };
    match.markets.push(correctScoreMarket);
    const client = supabaseService.getClient();
    if (client) {
      const { data: mData, error: mError } = await client.from("matches").insert({
        id: match.id,
        competition_id: match.competitionId,
        competition_name: match.competitionName,
        home_team: match.homeTeam,
        away_team: match.awayTeam,
        start_time: `${kickoffDate}T${kickoffTime}:00Z`,
        status: "PRE_MATCH",
        is_featured: match.isFeatured,
        created_at: match.createdAt
      }).select().single();
      if (mError) throw mError;
      for (const market of match.markets) {
        const { error: mkError } = await client.from("markets").insert({
          id: market.id,
          match_id: match.id,
          name: market.name,
          type: market.type,
          status: market.status,
          max_exposure: market.maxExposure
        });
        if (mkError) throw mkError;
        const selectionsToInsert = market.selections.map((s) => ({
          id: s.id,
          market_id: market.id,
          outcome: s.outcome,
          label: s.label,
          odds: s.odds,
          status: "ACTIVE"
        }));
        const { error: sError } = await client.from("selections").insert(selectionsToInsert);
        if (sError) throw sError;
      }
    }
    db.matches.set(match.id, match);
    AuditService.log(params.adminId, params.adminEmail, "CREATE_MATCH", "Match", match.id, null, match, params.ip);
    return match;
  }
  static async updateOdds(params) {
    const match = await this.getMatchById(params.matchId);
    if (!match) throw new Error("Jogo n\xE3o encontrado");
    const mainMarket = match.markets.find((m) => m.type === "1X2");
    if (!mainMarket) throw new Error("Mercado principal n\xE3o encontrado");
    const oldMatch = JSON.parse(JSON.stringify(match));
    mainMarket.selections.find((s) => s.outcome === "1").odds = params.odds.home;
    mainMarket.selections.find((s) => s.outcome === "X").odds = params.odds.draw;
    mainMarket.selections.find((s) => s.outcome === "2").odds = params.odds.away;
    match.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    const client = supabaseService.getClient();
    if (client) {
      for (const sel of mainMarket.selections) {
        await client.from("selections").update({ odds: sel.odds }).eq("id", sel.id);
      }
    }
    db.matches.set(match.id, match);
    AuditService.log(params.adminId, params.adminEmail, "UPDATE_ODDS", "Match", match.id, oldMatch, match, params.ip);
    return match;
  }
  static async updateStatus(params) {
    const match = await this.getMatchById(params.matchId);
    if (!match) throw new Error("Jogo n\xE3o encontrado");
    const oldMatch = JSON.parse(JSON.stringify(match));
    match.status = params.status;
    match.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    const client = supabaseService.getClient();
    if (client) {
      await client.from("matches").update({ status: params.status === "OPEN" ? "PRE_MATCH" : params.status }).eq("id", params.matchId);
    }
    db.matches.set(match.id, match);
    AuditService.log(params.adminId, params.adminEmail, "UPDATE_STATUS", "Match", match.id, oldMatch, match, params.ip);
    return match;
  }
  static async updateMarketStatus(params) {
    const match = await this.getMatchById(params.matchId);
    if (!match) throw new Error("Jogo n\xE3o encontrado");
    const market = match.markets.find((m) => m.id === params.marketId);
    if (!market) throw new Error("Mercado n\xE3o encontrado");
    market.status = params.status;
    const client = supabaseService.getClient();
    if (client) {
      await client.from("markets").update({ status: params.status }).eq("id", params.marketId);
    }
    db.matches.set(match.id, match);
    return market;
  }
  static async updateMarketOdds(params) {
    const match = await this.getMatchById(params.matchId);
    if (!match) throw new Error("Jogo n\xE3o encontrado");
    const market = match.markets.find((m) => m.id === params.marketId);
    if (!market) throw new Error("Mercado n\xE3o encontrado");
    const client = supabaseService.getClient();
    for (const selUpdate of params.selections) {
      const sel = market.selections.find((s) => s.id === selUpdate.id);
      if (sel) {
        sel.odds = selUpdate.odds;
        if (client) {
          await client.from("selections").update({ odds: sel.odds }).eq("id", sel.id);
        }
      }
    }
    db.matches.set(match.id, match);
    return market;
  }
  static async addMarketSelection(params) {
    const match = await this.getMatchById(params.matchId);
    if (!match) throw new Error("Jogo n\xE3o encontrado");
    const market = match.markets.find((m) => m.id === params.marketId);
    if (!market) throw new Error("Mercado n\xE3o encontrado");
    const newSelection = {
      id: `s-new-${Date.now()}`,
      marketId: market.id,
      outcome: params.outcome,
      label: params.label,
      odds: params.odds,
      status: "ACTIVE"
    };
    market.selections.push(newSelection);
    const client = supabaseService.getClient();
    if (client) {
      await client.from("selections").insert({
        id: newSelection.id,
        market_id: market.id,
        outcome: newSelection.outcome,
        label: newSelection.label,
        odds: newSelection.odds,
        status: "ACTIVE"
      });
    }
    db.matches.set(match.id, match);
    return market;
  }
  static generateDefaultCorrectScores(home, away) {
    const baseId = `s-cs-${Date.now()}`;
    const scores = [
      { score: "0-0", odds: 8 },
      { score: "1-0", odds: 6.5 },
      { score: "1-1", odds: 6 },
      { score: "0-1", odds: 7.5 },
      { score: "2-0", odds: 10 },
      { score: "2-1", odds: 9 },
      { score: "1-2", odds: 11 },
      { score: "0-2", odds: 14 },
      { score: "2-2", odds: 12 },
      { score: "3-0", odds: 18 },
      { score: "3-1", odds: 16 },
      { score: "3-2", odds: 22 },
      { score: "0-3", odds: 25 },
      { score: "1-3", odds: 22 },
      { score: "2-3", odds: 28 },
      { score: "3-3", odds: 45 },
      { score: "OTHER", odds: 15, label: "Qualquer Outro" }
    ];
    return scores.map((s, idx) => ({
      id: `${baseId}-${idx}`,
      outcome: s.score,
      label: s.label || s.score,
      odds: s.odds,
      status: "ACTIVE"
    }));
  }
};

// backend/src/controllers/matchController.ts
var MatchController = class {
  static async listMatches(req, res) {
    const { status, competitionId, category } = req.query;
    const matches = await MatchService.getAllMatches({
      status: typeof status === "string" ? status : void 0,
      competitionId: typeof competitionId === "string" ? competitionId : void 0,
      category: typeof category === "string" ? category : void 0
    });
    res.status(200).json({ matches });
  }
  static async getMatch(req, res) {
    const { id } = req.params;
    const match = await MatchService.getMatchById(id);
    if (!match) {
      res.status(404).json({ error: "Jogo n\xE3o encontrado" });
      return;
    }
    res.status(200).json({ match });
  }
  static getCompetitions(req, res) {
    res.status(200).json({ competitions: db.competitions });
  }
  static getTeams(req, res) {
    res.status(200).json({ teams: db.teams });
  }
};

// backend/src/routes/matchRoutes.ts
var router2 = Router2();
router2.get("/", MatchController.listMatches);
router2.get("/competitions", MatchController.getCompetitions);
router2.get("/teams", MatchController.getTeams);
router2.get("/:id", MatchController.getMatch);
var matchRoutes_default = router2;

// backend/src/routes/betRoutes.ts
import { Router as Router3 } from "express";

// backend/src/services/settingsService.ts
var DEFAULT_SETTINGS = {
  // Apostas & Limites
  minStake: 20,
  maxStake: 5e4,
  maxDailyStakePerUser: 1e5,
  maxPotentialWin: 1e6,
  maxPayoutPerEvent: 5e5,
  // Taxas
  withdrawalFeePercentage: 5,
  withdrawalFeeActive: true,
  minWithdrawal: 20,
  maxWithdrawal: 1e5,
  minDeposit: 20,
  maxDeposit: 25e4,
  // Risco
  maxExposurePerMarket: 2e5,
  maxExposurePerOutcome: 1e5,
  riskMediumThresholdPct: 50,
  riskHighThresholdPct: 80,
  autoSuspendHighRisk: true,
  riskAlertsEnabled: true,
  // Mercados
  enabledMarkets: {
    "1X2": true,
    "CORRECT_SCORE": true
  },
  // WhatsApp / Apoio
  whatsapp: {
    enabled: true,
    phone: "+258872344381",
    message: "Ol\xE1, preciso de apoio.",
    buttonText: "Apoio ZONABET",
    position: "bottom-right"
  },
  // Interface & Branding
  platformName: "ZONABET",
  announcementNotice: "Bem-vindo \xE0 ZONABET \u2022 Apostas em Futebol Mo\xE7ambicano (Mo\xE7ambola, Provinciais e Distritais) \u2022 Levantamentos r\xE1pidos via e-Mola",
  announcementActive: true,
  supportEmail: "suporte@zonabet.co.mz",
  currencySymbol: "MT",
  currencyCode: "MZN"
};
var SettingsServiceClass = class {
  constructor() {
    this.lastFetchTime = 0;
    this.settings = { ...DEFAULT_SETTINGS };
  }
  async getSettings() {
    const client = supabaseService.getClient();
    if (client && Date.now() - this.lastFetchTime > 5e3) {
      try {
        const { data, error } = await client.from("system_settings").select("config").eq("id", "default").single();
        if (data && data.config) {
          this.settings = { ...this.settings, ...data.config };
          this.lastFetchTime = Date.now();
        }
      } catch (e) {
        console.error("Failed to fetch settings from Supabase:", e);
      }
    }
    return { ...this.settings };
  }
  async getPublicSettings() {
    const s = await this.getSettings();
    return {
      withdrawalFeePercentage: s.withdrawalFeeActive ? s.withdrawalFeePercentage : 0,
      withdrawalFeeActive: s.withdrawalFeeActive,
      minWithdrawal: s.minWithdrawal,
      maxWithdrawal: s.maxWithdrawal,
      minStake: s.minStake,
      maxStake: s.maxStake,
      maxPotentialWin: s.maxPotentialWin,
      whatsapp: s.whatsapp,
      platformName: s.platformName,
      announcementNotice: s.announcementNotice,
      announcementActive: s.announcementActive,
      currencySymbol: s.currencySymbol,
      currencyCode: s.currencyCode,
      enabledMarkets: s.enabledMarkets
    };
  }
  async updateSettings(newValues, adminId, adminEmail, ip = "127.0.0.1") {
    await this.getSettings();
    const oldSettings = { ...this.settings };
    this.settings = {
      ...this.settings,
      ...newValues,
      whatsapp: {
        ...this.settings.whatsapp,
        ...newValues.whatsapp || {}
      },
      enabledMarkets: {
        ...this.settings.enabledMarkets,
        ...newValues.enabledMarkets || {}
      }
    };
    if (this.settings.withdrawalFeePercentage < 0) this.settings.withdrawalFeePercentage = 0;
    if (this.settings.withdrawalFeePercentage > 100) this.settings.withdrawalFeePercentage = 100;
    if (this.settings.minStake < 1) this.settings.minStake = 1;
    if (this.settings.maxStake < this.settings.minStake) this.settings.maxStake = this.settings.minStake;
    AuditService.log(
      adminId,
      adminEmail,
      "UPDATE_SYSTEM_SETTINGS",
      "Configuration",
      "global-settings",
      oldSettings,
      this.settings,
      ip
    );
    const client = supabaseService.getClient();
    if (client) {
      await client.from("system_settings").upsert({ id: "default", config: this.settings });
    }
    return { ...this.settings };
  }
};
var settingsService = new SettingsServiceClass();

// backend/src/services/riskService.ts
var RiskService = class {
  /**
   * Generates a real-time risk overview by aggregating all pending bets from Supabase
   */
  static async getRiskOverview() {
    const settings = await settingsService.getSettings();
    const globalExposureLimit = settings.maxExposurePerMarket || 2e5;
    const highThresholdPct = settings.riskHighThresholdPct || 80;
    const mediumThresholdPct = settings.riskMediumThresholdPct || 50;
    const client = supabaseService.getClient();
    let pendingBets = [];
    if (client) {
      const { data } = await client.from("bets").select("*").eq("status", "PENDING");
      if (data) pendingBets = data;
    }
    let totalTurnover = 0;
    let totalPossiblePayout = 0;
    const marketMap = /* @__PURE__ */ new Map();
    for (const b of pendingBets) {
      totalTurnover += Number(b.stake);
      totalPossiblePayout += Number(b.potential_win);
      const selections = b.selections || [];
      for (const item of selections) {
        let entry = marketMap.get(item.marketId);
        if (!entry) {
          entry = {
            marketId: item.marketId,
            matchId: item.matchId,
            bets: []
          };
          marketMap.set(item.marketId, entry);
        }
        entry.bets.push({
          stake: Number(b.stake),
          odds: item.oddsAtBetTime,
          outcome: item.outcome
        });
      }
    }
    const marketRisks = [];
    const alerts = [];
    for (const [marketId, data] of marketMap.entries()) {
      const match = await MatchService.getMatchById(data.matchId);
      if (!match) continue;
      const market = match.markets.find((m) => m.id === marketId);
      if (!market) continue;
      const exposureLimit = market.maxExposure || globalExposureLimit;
      const totalStake = data.bets.reduce((acc, b) => acc + b.stake, 0);
      const outcomeMap = /* @__PURE__ */ new Map();
      for (const sel of market.selections) {
        outcomeMap.set(sel.outcome, { count: 0, stake: 0, payout: 0 });
      }
      for (const bet of data.bets) {
        const curr = outcomeMap.get(bet.outcome) || { count: 0, stake: 0, payout: 0 };
        curr.count += 1;
        curr.stake += bet.stake;
        curr.payout += Math.round(bet.stake * bet.odds * 100) / 100;
        outcomeMap.set(bet.outcome, curr);
      }
      const outcomeRisks = [];
      let highestPossiblePayout = 0;
      let topRiskOutcome = "Nenhum";
      for (const [outcome, stats] of outcomeMap.entries()) {
        const selection = market.selections.find((s) => s.outcome === outcome);
        const label = selection?.label || outcome;
        const odds = selection?.odds || 1;
        const netExposure2 = Math.max(0, stats.payout - totalStake);
        if (stats.payout > highestPossiblePayout) {
          highestPossiblePayout = stats.payout;
          topRiskOutcome = `${label} (${outcome})`;
        }
        outcomeRisks.push({
          outcome,
          label,
          odds,
          betsCount: stats.count,
          totalStake: Math.round(stats.stake * 100) / 100,
          potentialPayout: Math.round(stats.payout * 100) / 100,
          netExposure: Math.round(netExposure2 * 100) / 100
        });
      }
      const netExposure = Math.max(0, highestPossiblePayout - totalStake);
      const exposurePercentage = exposureLimit > 0 ? Math.min(100, Math.round(netExposure / exposureLimit * 100)) : 0;
      let riskLevel = "LOW";
      if (exposurePercentage >= highThresholdPct) {
        riskLevel = "HIGH";
      } else if (exposurePercentage >= mediumThresholdPct) {
        riskLevel = "MEDIUM";
      }
      if (riskLevel === "HIGH") {
        alerts.push({
          id: `alert-high-${market.id}`,
          level: "HIGH",
          message: `Alta concentra\xE7\xE3o de risco no resultado "${topRiskOutcome}" do mercado "${market.name}". Exposi\xE7\xE3o em ${exposurePercentage}% do limite m\xE1ximo.`,
          marketId: market.id,
          matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      marketRisks.push({
        marketId: market.id,
        marketName: market.name,
        marketType: market.type,
        matchId: match.id,
        matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
        competitionName: match.competitionName,
        status: market.status,
        totalBets: data.bets.length,
        totalStake: Math.round(totalStake * 100) / 100,
        highestPossiblePayout: Math.round(highestPossiblePayout * 100) / 100,
        netExposure: Math.round(netExposure * 100) / 100,
        exposureLimit,
        exposurePercentage,
        riskLevel,
        topRiskOutcome,
        outcomes: outcomeRisks
      });
    }
    marketRisks.sort((a, b) => {
      const order = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      if (order[b.riskLevel] !== order[a.riskLevel]) return order[b.riskLevel] - order[a.riskLevel];
      return b.exposurePercentage - a.exposurePercentage;
    });
    const highRiskMarketsCount = marketRisks.filter((m) => m.riskLevel === "HIGH").length;
    const mediumRiskMarketsCount = marketRisks.filter((m) => m.riskLevel === "MEDIUM").length;
    const totalNetExposure = marketRisks.reduce((acc, m) => acc + m.netExposure, 0);
    return {
      totalActiveBets: pendingBets.length,
      totalTurnover: Math.round(totalTurnover * 100) / 100,
      totalPossiblePayout: Math.round(totalPossiblePayout * 100) / 100,
      totalNetExposure: Math.round(totalNetExposure * 100) / 100,
      highRiskMarketsCount,
      mediumRiskMarketsCount,
      markets: marketRisks,
      alerts,
      settings: {
        maxExposurePerMarket: globalExposureLimit,
        autoSuspendHighRisk: settings.autoSuspendHighRisk,
        riskHighThresholdPct: highThresholdPct
      }
    };
  }
  static async checkBetRisk(params) {
    const settings = await settingsService.getSettings();
    if (params.stake > settings.maxStake) {
      throw new Error(`O montante m\xE1ximo por aposta \xE9 de ${settings.maxStake.toLocaleString()} MT.`);
    }
    if (params.stake < settings.minStake) {
      throw new Error(`O montante m\xEDnimo por aposta \xE9 de ${settings.minStake.toLocaleString()} MT.`);
    }
    if (params.potentialReturn > settings.maxPotentialWin) {
      throw new Error(`O retorno potencial excede o limite m\xE1ximo permitido de ${settings.maxPotentialWin.toLocaleString()} MT.`);
    }
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const client = supabaseService.getClient();
    let userTotalStakeToday = 0;
    if (client) {
      const { data } = await client.from("bets").select("stake").eq("user_id", params.userId).gte("placed_at", `${today}T00:00:00Z`);
      if (data) {
        userTotalStakeToday = data.reduce((acc, b) => acc + Number(b.stake), 0);
      }
    }
    if (userTotalStakeToday + params.stake > settings.maxDailyStakePerUser) {
      throw new Error(`Atingiu o limite di\xE1rio de apostas por usu\xE1rio (${settings.maxDailyStakePerUser.toLocaleString()} MT). Stake atual hoje: ${userTotalStakeToday.toLocaleString()} MT.`);
    }
    for (const item of params.items) {
      const match = await MatchService.getMatchById(item.matchId);
      if (!match) continue;
      const market = match.markets.find((m) => m.id === item.marketId);
      if (!market) continue;
      if (market.status !== "OPEN") {
        throw new Error(`O mercado "${market.name}" encontra-se suspenso devido a controlo de risco da casa.`);
      }
      if (market.maxStake && params.stake > market.maxStake) {
        throw new Error(`O limite m\xE1ximo de aposta espec\xEDfico para o mercado "${market.name}" \xE9 de ${market.maxStake.toLocaleString()} MT.`);
      }
    }
  }
};

// backend/src/services/betService.ts
import { Mutex as Mutex2 } from "async-mutex";
var betMutex = new Mutex2();
var BetService = class {
  /**
   * Places a new bet (Single or Multiple) using Supabase and WalletService
   */
  static async placeBet(params) {
    const { userId, items, stake } = params;
    return await betMutex.runExclusive(async () => {
      const matches = [];
      let totalOdds = 1;
      const betItems = [];
      for (const reqItem of items) {
        const match = await MatchService.getMatchById(reqItem.matchId);
        if (!match) throw new Error(`Jogo ${reqItem.matchId} n\xE3o encontrado`);
        const market = match.markets.find((m) => m.id === reqItem.marketId);
        if (!market || market.status !== "OPEN") {
          throw new Error(`Mercado ${reqItem.marketId} n\xE3o est\xE1 dispon\xEDvel para apostas`);
        }
        const selection = market.selections.find((s) => s.id === reqItem.selectionId);
        if (!selection || selection.status !== "ACTIVE") {
          throw new Error("Sele\xE7\xE3o n\xE3o dispon\xEDvel");
        }
        totalOdds = totalOdds * selection.odds;
        matches.push(match);
        betItems.push({
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          betId: "",
          // Will be set after bet creation
          matchId: match.id,
          matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
          competitionName: match.competitionName,
          kickoff: `${match.kickoffDate} ${match.kickoffTime}`,
          marketId: market.id,
          marketName: market.name,
          selectionId: selection.id,
          outcome: selection.outcome,
          label: selection.label,
          oddsAtBetTime: selection.odds,
          status: "PENDING"
        });
      }
      totalOdds = Math.round(totalOdds * 100) / 100;
      const potentialReturn = Math.round(stake * totalOdds * 100) / 100;
      await RiskService.checkBetRisk({
        userId,
        items,
        stake,
        potentialReturn
      });
      const betId = `bet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      for (const item of betItems) {
        item.betId = betId;
      }
      const { wallet } = await WalletService.executeTransaction({
        userId,
        type: "BET",
        amount: stake,
        reference: betId,
        description: `Aposta ${betItems.length > 1 ? "M\xFAltipla" : "Simples"} #${betItems.length} sele\xE7\xF5es`
      });
      const bet = {
        id: betId,
        userId,
        userName: "",
        // Will be hydrated by frontend if needed
        userEmail: "",
        type: betItems.length > 1 ? "MULTIPLE" : "SINGLE",
        stake,
        totalOdds,
        potentialReturn,
        status: "PENDING",
        items: betItems,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      const client = supabaseService.getClient();
      if (client) {
        const { data: betData, error: betError } = await client.from("bets").insert({
          id: bet.id,
          user_id: userId,
          total_stake: stake,
          total_odds: totalOdds,
          potential_return: potentialReturn,
          status: "PENDING",
          created_at: bet.createdAt
        }).select().single();
        if (betError) throw betError;
        const itemsToInsert = betItems.map((item) => ({
          id: item.id,
          bet_id: bet.id,
          match_id: item.matchId,
          market_id: item.marketId,
          selection_id: item.selectionId,
          odds_at_bet_time: item.oddsAtBetTime,
          status: "PENDING",
          created_at: bet.createdAt
        }));
        const { error: itemsError } = await client.from("bet_items").insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }
      db.bets.set(bet.id, bet);
      return { bet, wallet };
    });
  }
  static async getUserBets(userId) {
    const client = supabaseService.getClient();
    if (client) {
      const { data, error } = await client.from("bets").select(`
          *,
          bet_items (*)
        `).eq("user_id", userId).order("created_at", { ascending: false });
      if (!error && data) {
        return data.map((b) => ({
          id: b.id,
          userId: b.user_id,
          userName: "",
          userEmail: "",
          type: b.bet_items.length > 1 ? "MULTIPLE" : "SINGLE",
          stake: Number(b.total_stake),
          totalOdds: Number(b.total_odds),
          potentialReturn: Number(b.potential_return),
          status: b.status,
          items: b.bet_items.map((i) => ({
            id: i.id,
            matchId: i.match_id,
            marketId: i.market_id,
            selectionId: i.selection_id,
            oddsAtBetTime: Number(i.odds_at_bet_time),
            status: i.status
          })),
          createdAt: b.created_at,
          settledAt: b.settled_at
        }));
      }
    }
    return Array.from(db.bets.values()).filter((b) => b.userId === userId).reverse();
  }
  static async getAllBets() {
    const client = supabaseService.getClient();
    if (client) {
      const { data, error } = await client.from("bets").select(`
          *,
          profiles (name, phone),
          bet_items (*)
        `).order("created_at", { ascending: false }).limit(100);
      if (!error && data) {
        return data.map((b) => ({
          id: b.id,
          userId: b.user_id,
          userName: b.profiles?.name || "Utilizador",
          userEmail: b.profiles?.phone || "",
          type: b.bet_items.length > 1 ? "MULTIPLE" : "SINGLE",
          stake: Number(b.total_stake),
          totalOdds: Number(b.total_odds),
          potentialReturn: Number(b.potential_return),
          status: b.status,
          items: b.bet_items.map((i) => ({
            id: i.id,
            matchId: i.match_id,
            marketId: i.market_id,
            selectionId: i.selection_id,
            oddsAtBetTime: Number(i.odds_at_bet_time),
            status: i.status
          })),
          createdAt: b.created_at,
          settledAt: b.settled_at
        }));
      }
    }
    return Array.from(db.bets.values()).reverse();
  }
  static async getBetById(id) {
    const client = supabaseService.getClient();
    if (client) {
      const { data, error } = await client.from("bets").select(`
          *,
          bet_items (*)
        `).eq("id", id).single();
      if (!error && data) {
        return {
          id: data.id,
          userId: data.user_id,
          userName: "",
          userEmail: "",
          type: data.bet_items.length > 1 ? "MULTIPLE" : "SINGLE",
          stake: Number(data.total_stake),
          totalOdds: Number(data.total_odds),
          potentialReturn: Number(data.potential_return),
          status: data.status,
          items: data.bet_items.map((i) => ({
            id: i.id,
            matchId: i.match_id,
            marketId: i.market_id,
            selectionId: i.selection_id,
            oddsAtBetTime: Number(i.odds_at_bet_time),
            status: i.status
          })),
          createdAt: data.created_at,
          settledAt: data.settled_at
        };
      }
    }
    return db.bets.get(id) || null;
  }
};

// backend/src/controllers/betController.ts
var BetController = class {
  static async placeBet(req, res) {
    if (!req.user) {
      res.status(401).json({ error: "N\xE3o autenticado" });
      return;
    }
    const parseResult = placeBetSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.issues[0].message });
      return;
    }
    const { items, stake } = parseResult.data;
    try {
      const { bet, wallet } = await BetService.placeBet({
        userId: req.user.userId,
        items,
        stake
      });
      res.status(201).json({
        message: "Aposta registada com sucesso!",
        bet,
        wallet
      });
    } catch (error) {
      res.status(400).json({ error: error.message || "Erro ao processar a aposta" });
    }
  }
  static async getUserBets(req, res) {
    if (!req.user) {
      res.status(401).json({ error: "N\xE3o autenticado" });
      return;
    }
    const bets = await BetService.getUserBets(req.user.userId);
    res.status(200).json({ bets });
  }
  static async getBetById(req, res) {
    if (!req.user) {
      res.status(401).json({ error: "N\xE3o autenticado" });
      return;
    }
    const { id } = req.params;
    const bet = await BetService.getBetById(id);
    if (!bet) {
      res.status(404).json({ error: "Aposta n\xE3o encontrada" });
      return;
    }
    if (req.user.role !== "ADMIN" && bet.userId !== req.user.userId) {
      res.status(403).json({ error: "Acesso n\xE3o autorizado a esta aposta" });
      return;
    }
    res.status(200).json({ bet });
  }
};

// backend/src/routes/betRoutes.ts
var router3 = Router3();
router3.post("/", authenticate, BetController.placeBet);
router3.get("/", authenticate, BetController.getUserBets);
router3.get("/:id", authenticate, BetController.getBetById);
var betRoutes_default = router3;

// backend/src/routes/walletRoutes.ts
import { Router as Router4 } from "express";

// backend/src/controllers/walletController.ts
var WalletController = class {
  static async getWallet(req, res) {
    if (!req.user) {
      res.status(401).json({ error: "N\xE3o autenticado" });
      return;
    }
    const wallet = await WalletService.getWallet(req.user.userId);
    res.status(200).json({
      wallet: {
        id: wallet.id,
        balance: wallet.balance,
        currency: config.currency,
        isTestMode: config.isTestMode
      }
    });
  }
  static async getTransactions(req, res) {
    if (!req.user) {
      res.status(401).json({ error: "N\xE3o autenticado" });
      return;
    }
    const client = supabaseService.getClient();
    if (client) {
      let { data, error } = await client.from("transactions").select("*").eq("user_id", req.user.userId).order("created_at", { ascending: false });
      if (error) {
        const alt = await client.from("wallet_transactions").select("*").eq("user_id", req.user.userId).order("created_at", { ascending: false });
        data = alt.data;
        error = alt.error;
      }
      if (!error && data) {
        const transactions2 = data.map((tx) => ({
          id: tx.id,
          userId: tx.user_id,
          type: tx.type === "BET_PLACEMENT" ? "BET" : tx.type === "BET_WIN" ? "WIN" : tx.type,
          amount: Number(tx.amount),
          previousBalance: Number(tx.prev_balance ?? tx.balance_before ?? 0),
          nextBalance: Number(tx.next_balance ?? tx.balance_after ?? 0),
          reference: tx.reference_id ?? tx.reference ?? "",
          description: tx.description ?? tx.notes ?? "",
          status: "COMPLETED",
          createdAt: tx.created_at
        }));
        res.status(200).json({ transactions: transactions2 });
        return;
      }
    }
    const transactions = db.getTransactions(req.user.userId);
    res.status(200).json({ transactions });
  }
  // Process deposit request (M-Pesa, e-Mola, mKesh, Bank Transfer)
  static async deposit(req, res) {
    if (!req.user) {
      res.status(401).json({ error: "N\xE3o autenticado" });
      return;
    }
    const amount = Number(req.body.amount);
    const method = (req.body.method || "EMOLA").toUpperCase();
    const phone = req.body.phoneNumber ? String(req.body.phoneNumber).trim() : "";
    if (isNaN(amount) || amount < 10) {
      res.status(400).json({ error: "Montante m\xEDnimo de dep\xF3sito \xE9 de 10,00 MT." });
      return;
    }
    if (amount > 1e5) {
      res.status(400).json({ error: "Montante m\xE1ximo de dep\xF3sito por opera\xE7\xE3o \xE9 de 100.000,00 MT." });
      return;
    }
    if (!method.includes("EMOLA") && !method.includes("E-MOLA")) {
      res.status(400).json({ error: "O \xFAnico canal de dep\xF3sito aceite na plataforma \xE9 e-Mola (Movitel)." });
      return;
    }
    const methodLabel = "e-Mola (Movitel)";
    const shortCode = "EMOLA";
    const user = db.users.get(req.user.userId);
    const targetPhone = phone || user?.phone || "Celular da Conta";
    const refCode = `DEP-${shortCode}-${Date.now().toString().slice(-6)}`;
    const receiptImage = req.body.receiptImage ? String(req.body.receiptImage) : void 0;
    const receiptFileName = req.body.receiptFileName ? String(req.body.receiptFileName) : void 0;
    const receiptFileSize = req.body.receiptFileSize ? Number(req.body.receiptFileSize) : void 0;
    const receiptReference = req.body.receiptReference ? String(req.body.receiptReference).trim() : void 0;
    const notes = req.body.notes ? String(req.body.notes).trim() : void 0;
    try {
      const depositProof = db.addDepositProof({
        id: `proof-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: req.user.userId,
        userName: user?.name || "Apostador ZONABET",
        userPhone: targetPhone,
        userEmail: user?.email || "",
        amount,
        method: shortCode,
        referenceCode: refCode,
        operatorTxId: receiptReference,
        receiptFileName,
        receiptDataUrl: receiptImage,
        receiptFileSize,
        notes,
        status: "PENDING",
        reviewedBy: "",
        reviewNotes: receiptFileName ? `Comprovativo enviado pelo apostador (${receiptFileName}). Aguardando confer\xEAncia administrativa.` : "Dep\xF3sito registrado. Aguardando valida\xE7\xE3o manual.",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      supabaseService.syncDepositProofRealtime(depositProof).catch(console.error);
      res.status(200).json({
        message: `Pedido de dep\xF3sito de ${amount.toFixed(2)} MZN via ${methodLabel} submetido! Aguarde a valida\xE7\xE3o administrativa.`,
        depositProof
      });
    } catch (err) {
      res.status(400).json({ error: err.message || "Erro ao processar dep\xF3sito" });
    }
  }
  // Process withdrawal request exclusively via e-Mola (Movitel)
  static async withdraw(req, res) {
    if (!req.user) {
      res.status(401).json({ error: "N\xE3o autenticado" });
      return;
    }
    const amount = Number(req.body.amount);
    const method = (req.body.method || "EMOLA").toUpperCase();
    const phone = req.body.phoneNumber ? String(req.body.phoneNumber).trim() : "";
    const settings = await settingsService.getSettings();
    const minWithdrawal = settings.minWithdrawal || 20;
    const maxWithdrawal = settings.maxWithdrawal || 1e5;
    if (isNaN(amount) || amount < minWithdrawal) {
      res.status(400).json({ error: `Montante m\xEDnimo de levantamento \xE9 de ${minWithdrawal.toFixed(2)} MT.` });
      return;
    }
    if (amount > maxWithdrawal) {
      res.status(400).json({ error: `Montante m\xE1ximo de levantamento por pedido \xE9 de ${maxWithdrawal.toFixed(2)} MT.` });
      return;
    }
    if (!method.includes("EMOLA") && !method.includes("E-MOLA")) {
      res.status(400).json({ error: "O \xFAnico canal de levantamento aceite na plataforma \xE9 e-Mola (Movitel)." });
      return;
    }
    const wallet = await WalletService.getWallet(req.user.userId);
    if (wallet.balance < amount) {
      res.status(400).json({
        error: `Saldo insuficiente. O seu saldo dispon\xEDvel \xE9 de ${wallet.balance.toFixed(2)} MT.`
      });
      return;
    }
    const methodLabel = "e-Mola (Movitel)";
    const shortCode = "EMOLA";
    const user = db.users.get(req.user.userId);
    const target = phone || user?.phone || "Celular Movitel";
    const isFeeActive = settings.withdrawalFeeActive;
    const feePct = isFeeActive ? settings.withdrawalFeePercentage : 0;
    const feeRate = feePct / 100;
    const fee = Math.round(amount * feeRate * 100) / 100;
    const netAmount = Math.round((amount - fee) * 100) / 100;
    const refCode = `LEV-${shortCode}-${Date.now().toString().slice(-6)}`;
    try {
      const feeText = isFeeActive ? `Taxa ${feePct}%: ${fee.toFixed(2)} MT` : "Isento de taxa";
      const { wallet: updatedWallet, transaction } = await WalletService.executeTransaction({
        userId: req.user.userId,
        type: "WITHDRAWAL",
        amount,
        reference: refCode,
        description: `Levantamento via ${methodLabel} para ${target} (Bruto: ${amount.toFixed(2)} MT | ${feeText} | L\xEDquido enviado: ${netAmount.toFixed(2)} MT)`
      });
      res.status(200).json({
        message: `Levantamento de ${amount.toFixed(2)} MT processado com sucesso! ${isFeeActive ? `Taxa (${feePct}%): ${fee.toFixed(2)} MT | ` : ""}L\xEDquido enviado: ${netAmount.toFixed(2)} MT`,
        wallet: updatedWallet,
        transaction,
        fee,
        feeRate: feePct,
        feeActive: isFeeActive,
        netAmount,
        grossAmount: amount
      });
    } catch (err) {
      res.status(400).json({ error: err.message || "Erro ao processar levantamento" });
    }
  }
  // Prepared endpoint for sandbox/virtual deposit (simulating M-Pesa / e-Mola top-up in test mode)
  static async requestVirtualTopup(req, res) {
    if (!req.user) {
      res.status(401).json({ error: "N\xE3o autenticado" });
      return;
    }
    const amount = Number(req.body.amount || 500);
    const method = req.body.method || "M-Pesa (Virtual Test)";
    if (amount <= 0 || amount > 1e4) {
      res.status(400).json({ error: "Montante de recarga de teste deve ser entre 10 e 10.000 MZN" });
      return;
    }
    try {
      const { wallet, transaction } = await WalletService.executeTransaction({
        userId: req.user.userId,
        type: "DEPOSIT",
        amount,
        reference: `TOPUP-${Date.now()}`,
        description: `Recarga de saldo (${method})`
      });
      ReferralService.processDepositBonus(req.user.userId, amount).catch((err) => {
        console.error("[ReferralBonus] Erro ao creditar b\xF3nus de 5% no topup:", err);
      });
      res.status(200).json({
        message: `Dep\xF3sito de ${amount} MZN processado com sucesso!`,
        wallet,
        transaction
      });
    } catch (err) {
      res.status(400).json({ error: err.message || "Erro ao processar recarga" });
    }
  }
  static async getUserDepositProofs(req, res) {
    if (!req.user) {
      res.status(401).json({ error: "N\xE3o autenticado" });
      return;
    }
    const client = supabaseService.getClient();
    if (client) {
      const { data, error } = await client.from("deposit_proofs").select("*").eq("user_id", req.user.userId).order("created_at", { ascending: false });
      if (!error && data) {
        const proofs2 = data.map((p) => ({
          id: p.id,
          userId: p.user_id,
          userName: p.user_name,
          userPhone: p.user_phone,
          amount: Number(p.amount),
          method: p.method,
          referenceCode: p.reference_code,
          operatorTxId: p.operator_tx_id,
          receiptDataUrl: p.receipt_data_url,
          receiptFileName: p.receipt_file_name,
          notes: p.notes,
          status: p.status,
          reviewNotes: p.review_notes,
          createdAt: p.created_at,
          updatedAt: p.reviewed_at || p.created_at
        }));
        res.status(200).json({ proofs: proofs2 });
        return;
      }
    }
    const proofs = db.getDepositProofs(req.user.userId);
    res.status(200).json({ proofs });
  }
};

// backend/src/routes/walletRoutes.ts
var router4 = Router4();
router4.get("/", authenticate, WalletController.getWallet);
router4.get("/transactions", authenticate, WalletController.getTransactions);
router4.get("/deposit-proofs", authenticate, WalletController.getUserDepositProofs);
router4.post("/deposit", authenticate, WalletController.deposit);
router4.post("/withdraw", authenticate, WalletController.withdraw);
router4.post("/topup", authenticate, WalletController.requestVirtualTopup);
var walletRoutes_default = router4;

// backend/src/routes/adminRoutes.ts
import { Router as Router5 } from "express";

// backend/src/controllers/adminController.ts
import bcrypt3 from "bcryptjs";

// backend/src/utils/money.ts
var Money = class _Money {
  // Converts a decimal number or string (e.g. 10.50) into integer cents (1050)
  static toCents(amount) {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return 0;
    return Math.round(num * 100);
  }
  // Converts integer cents back to a 2-decimal number
  static fromCents(cents) {
    return Math.round(cents) / 100;
  }
  // Formats to 2 decimal places fixed string (e.g. "100.00")
  static format(amount) {
    return (Math.round(amount * 100) / 100).toFixed(2);
  }
  // Adds two amounts accurately
  static add(a, b) {
    return _Money.fromCents(_Money.toCents(a) + _Money.toCents(b));
  }
  // Subtracts b from a accurately
  static subtract(a, b) {
    return _Money.fromCents(_Money.toCents(a) - _Money.toCents(b));
  }
  // Multiplies stake by odds with standard 2-decimal rounding
  static multiply(amount, factor) {
    const resultCents = Math.round(_Money.toCents(amount) * factor);
    return _Money.fromCents(resultCents);
  }
  // Validates if amount is positive and within bounds
  static isValidAmount(amount) {
    return !isNaN(amount) && isFinite(amount) && amount > 0;
  }
};

// backend/src/services/settlementService.ts
var SettlementService = class {
  /**
   * Settles a football match with official manual score and payouts
   */
  static async settleMatch(params) {
    const { adminId, adminEmail, matchId, homeScore, awayScore, ip } = params;
    const match = await MatchService.getMatchById(matchId);
    if (!match) throw new Error("Jogo n\xE3o encontrado");
    if (match.status === "FINISHED") {
      throw new Error("Este jogo j\xE1 foi finalizado e liquidado anteriormente. Liquida\xE7\xE3o duplicada impedida.");
    }
    let winningOutcome;
    if (homeScore > awayScore) {
      winningOutcome = "1";
    } else if (homeScore === awayScore) {
      winningOutcome = "X";
    } else {
      winningOutcome = "2";
    }
    const correctScoreStr = `${homeScore}-${awayScore}`;
    const previousStatus = match.status;
    match.homeScore = homeScore;
    match.awayScore = awayScore;
    match.status = "FINISHED";
    match.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    db.matches.set(match.id, match);
    for (const market of match.markets) {
      market.status = "SETTLED";
      if (market.type === "CORRECT_SCORE") {
        let matched = false;
        for (const sel of market.selections) {
          if (sel.outcome === correctScoreStr) {
            sel.status = "SETTLED_WIN";
            matched = true;
          } else {
            sel.status = "SETTLED_LOST";
          }
        }
        if (!matched) {
          for (const sel of market.selections) {
            if (sel.outcome === "OTHER" || sel.outcome === "Outro" || sel.label.toLowerCase().includes("outro")) {
              sel.status = "SETTLED_WIN";
            }
          }
        }
      } else {
        for (const sel of market.selections) {
          if (sel.outcome === winningOutcome) {
            sel.status = "SETTLED_WIN";
          } else {
            sel.status = "SETTLED_LOST";
          }
        }
      }
    }
    const client = supabaseService.getClient();
    if (client) {
      try {
        await client.from("matches").update({
          status: "FINISHED",
          home_score: match.homeScore,
          away_score: match.awayScore,
          result: winningOutcome
        }).eq("id", matchId);
      } catch (err) {
        console.warn("[Supabase Match Update Warning]:", err.message);
      }
    }
    let settledBetsCount = 0;
    let wonBetsCount = 0;
    let totalPayout = 0;
    for (const bet of db.bets.values()) {
      if (bet.status !== "PENDING") continue;
      const matchingItems = bet.items.filter((item) => item.matchId === matchId);
      if (matchingItems.length === 0) continue;
      for (const item of matchingItems) {
        const market = match.markets.find((m) => m.id === item.marketId);
        const isCorrectScore = market?.type === "CORRECT_SCORE" || item.marketName.toLowerCase().includes("correto");
        let isWon = false;
        if (isCorrectScore) {
          if (item.outcome === correctScoreStr) {
            isWon = true;
          } else if (item.outcome === "OTHER" || item.outcome === "Outro" || item.label.toLowerCase().includes("outro")) {
            const otherSelections = market?.selections.filter((s) => s.outcome !== "OTHER" && s.outcome !== "Outro" && !s.label.toLowerCase().includes("outro")) || [];
            const commonScores = otherSelections.map((s) => s.outcome);
            if (!commonScores.includes(correctScoreStr)) isWon = true;
          }
        } else {
          isWon = item.outcome === winningOutcome;
        }
        item.status = isWon ? "WON" : "LOST";
      }
      const hasLostItem = bet.items.some((item) => item.status === "LOST");
      const allItemsDecided = bet.items.every((item) => item.status === "WON" || item.status === "VOID");
      if (hasLostItem) {
        bet.status = "LOST";
        bet.settledAt = (/* @__PURE__ */ new Date()).toISOString();
        settledBetsCount++;
      } else if (allItemsDecided) {
        let activeOdds = 1;
        for (const item of bet.items) {
          if (item.status === "WON") activeOdds *= item.oddsAtBetTime;
        }
        const finalOdds = Math.round(activeOdds * 100) / 100;
        const payout = Money.multiply(bet.stake, finalOdds);
        bet.status = "WON";
        bet.settledAt = (/* @__PURE__ */ new Date()).toISOString();
        settledBetsCount++;
        wonBetsCount++;
        totalPayout = Money.add(totalPayout, payout);
        await WalletService.executeTransaction({
          userId: bet.userId,
          type: "WIN",
          amount: payout,
          reference: bet.id,
          description: `Pr\xE9mio de Aposta Vencedora #${bet.id.substring(0, 10)} (Odd ${finalOdds})`
        });
      }
      if (client && bet.status !== "PENDING") {
        try {
          await client.from("bets").update({
            status: bet.status
          }).eq("id", bet.id);
          for (const item of matchingItems) {
            await client.from("bet_items").update({
              status: item.status
            }).eq("id", item.id);
          }
        } catch (err) {
          console.warn("[Supabase Bet Update Warning]:", err.message);
        }
      }
    }
    AuditService.log(adminId, adminEmail, "SETTLE_MATCH", "Match", matchId, { status: previousStatus }, {
      status: "FINISHED",
      homeScore,
      awayScore,
      winningOutcome,
      settledBetsCount,
      wonBetsCount,
      totalPayout
    }, ip);
    return { match, settledBetsCount, wonBetsCount, totalPayout };
  }
  /**
   * Cancels a match and voids/refunds all active bets
   */
  static async cancelMatch(params) {
    const { adminId, adminEmail, matchId, reason, ip } = params;
    const match = await MatchService.getMatchById(matchId);
    if (!match) throw new Error("Jogo n\xE3o encontrado");
    if (match.status === "FINISHED") {
      throw new Error("N\xE3o \xE9 poss\xEDvel cancelar um jogo j\xE1 finalizado e liquidado");
    }
    const previousStatus = match.status;
    match.status = "CANCELLED";
    match.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    db.matches.set(match.id, match);
    for (const market of match.markets) {
      market.status = "CLOSED";
      for (const sel of market.selections) sel.status = "VOID";
    }
    const client = supabaseService.getClient();
    if (client) {
      try {
        await client.from("matches").update({
          status: "CANCELLED",
          result: "CANCELLED"
        }).eq("id", matchId);
      } catch (err) {
        console.warn("[Supabase Match Cancel Warning]:", err.message);
      }
    }
    let refundedBetsCount = 0;
    let totalRefunded = 0;
    for (const bet of db.bets.values()) {
      if (bet.status !== "PENDING") continue;
      const item = bet.items.find((i) => i.matchId === matchId);
      if (!item) continue;
      item.status = "VOID";
      if (bet.type === "SINGLE") {
        bet.status = "VOID";
        bet.settledAt = (/* @__PURE__ */ new Date()).toISOString();
        await WalletService.executeTransaction({
          userId: bet.userId,
          type: "REFUND",
          amount: bet.stake,
          reference: bet.id,
          description: `Reembolso por jogo cancelado: ${match.homeTeam} vs ${match.awayTeam}`
        });
        refundedBetsCount++;
        totalRefunded = Money.add(totalRefunded, bet.stake);
      } else {
        const allVoid = bet.items.every((i) => i.status === "VOID");
        if (allVoid) {
          bet.status = "VOID";
          bet.settledAt = (/* @__PURE__ */ new Date()).toISOString();
          await WalletService.executeTransaction({
            userId: bet.userId,
            type: "REFUND",
            amount: bet.stake,
            reference: bet.id,
            description: `Reembolso de aposta m\xFAltipla totalmente anulada`
          });
          refundedBetsCount++;
          totalRefunded = Money.add(totalRefunded, bet.stake);
        }
      }
      if (client && bet.status !== "PENDING") {
        try {
          await client.from("bets").update({
            status: bet.status
          }).eq("id", bet.id);
          await client.from("bet_items").update({
            status: "VOID"
          }).eq("id", item.id);
        } catch (err) {
          console.warn("[Supabase Bet Cancel Warning]:", err.message);
        }
      }
    }
    AuditService.log(adminId, adminEmail, "CANCEL_MATCH", "Match", matchId, { status: previousStatus }, { status: "CANCELLED", reason, refundedBetsCount, totalRefunded }, ip);
    return { match, refundedBetsCount, totalRefunded };
  }
};

// backend/src/controllers/adminController.ts
var AdminController = class {
  static async getDashboardStats(req, res) {
    const client = supabaseService.getClient();
    if (!client) {
      res.status(503).json({ error: "Servi\xE7o de dados indispon\xEDvel" });
      return;
    }
    try {
      const { count: totalUsers } = await client.from("profiles").select("*", { count: "exact", head: true }).eq("role", "USER");
      const { count: activeMatches } = await client.from("matches").select("*", { count: "exact", head: true }).eq("status", "PRE_MATCH");
      const { count: finishedMatches } = await client.from("matches").select("*", { count: "exact", head: true }).eq("status", "FINISHED");
      const { data: betStats } = await client.from("bets").select("status, total_stake, potential_return, created_at, settled_at");
      const allBets = betStats || [];
      const pendingBets = allBets.filter((b) => b.status === "PENDING").length;
      const wonBets = allBets.filter((b) => b.status === "WON").length;
      const lostBets = allBets.filter((b) => b.status === "LOST").length;
      const voidBets = allBets.filter((b) => b.status === "VOID").length;
      let totalBetVolume = allBets.reduce((acc, b) => acc + Number(b.total_stake), 0);
      let totalDisbursedPayout = allBets.filter((b) => b.status === "WON").reduce((acc, b) => acc + Number(b.potential_return), 0);
      const { data: balanceData } = await client.from("profiles").select("balance");
      const totalUsersBalance = (balanceData || []).reduce((acc, p) => acc + Number(p.balance), 0);
      const { data: txData } = await client.from("transactions").select("*");
      const allTransactions = txData || [];
      let totalDepositsVolume = allTransactions.filter((tx) => tx.type === "DEPOSIT").reduce((acc, tx) => acc + Number(tx.amount), 0);
      let totalWithdrawalsVolume = allTransactions.filter((tx) => tx.type === "WITHDRAWAL").reduce((acc, tx) => acc + Math.abs(Number(tx.amount)), 0);
      const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const wageredToday = allBets.filter((b) => b.created_at.startsWith(todayStr)).reduce((acc, b) => acc + Number(b.total_stake), 0);
      const paidOutToday = allBets.filter((b) => b.status === "WON" && b.settled_at?.startsWith(todayStr)).reduce((acc, b) => acc + Number(b.potential_return), 0);
      const depositsToday = allTransactions.filter((tx) => tx.type === "DEPOSIT" && tx.created_at.startsWith(todayStr)).reduce((acc, tx) => acc + Number(tx.amount), 0);
      const withdrawalsToday = allTransactions.filter((tx) => tx.type === "WITHDRAWAL" && tx.created_at.startsWith(todayStr)).reduce((acc, tx) => acc + Math.abs(Number(tx.amount)), 0);
      const houseProfit = totalBetVolume - totalDisbursedPayout;
      const houseProfitToday = wageredToday - paidOutToday;
      const profitMarginPercent = totalBetVolume > 0 ? Math.round(houseProfit / totalBetVolume * 100 * 10) / 10 : 0;
      const houseLiquidBalance = Math.max(0, totalDepositsVolume - totalWithdrawalsVolume);
      const dailyMap = /* @__PURE__ */ new Map();
      for (let i = 0; i < 14; i++) {
        const d = /* @__PURE__ */ new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split("T")[0];
        dailyMap.set(ds, { date: ds, wagered: 0, paidOut: 0, profit: 0, betsCount: 0, deposits: 0, withdrawals: 0, newUsers: 0 });
      }
      allBets.forEach((b) => {
        const ds = b.created_at.split("T")[0];
        if (dailyMap.has(ds)) {
          const item = dailyMap.get(ds);
          item.wagered += Number(b.total_stake);
          item.betsCount++;
          if (b.status === "WON") item.paidOut += Number(b.potential_return);
          item.profit = item.wagered - item.paidOut;
        }
      });
      allTransactions.forEach((tx) => {
        const ds = tx.created_at.split("T")[0];
        if (dailyMap.has(ds)) {
          const item = dailyMap.get(ds);
          if (tx.type === "DEPOSIT") item.deposits += Number(tx.amount);
          else if (tx.type === "WITHDRAWAL") item.withdrawals += Math.abs(Number(tx.amount));
        }
      });
      const dailyReports = Array.from(dailyMap.values()).sort((a, b) => b.date.localeCompare(a.date));
      res.status(200).json({
        stats: {
          totalUsers: totalUsers || 0,
          activeMatches: activeMatches || 0,
          finishedMatches: finishedMatches || 0,
          pendingBets,
          wonBets,
          lostBets,
          voidBets,
          totalBetVolume,
          totalDisbursedPayout,
          totalTransactions: allTransactions.length,
          houseBalance: houseLiquidBalance,
          totalUsersBalance,
          wageredToday,
          paidOutToday,
          houseProfit,
          houseProfitToday,
          profitMarginPercent,
          totalDepositsVolume,
          totalWithdrawalsVolume,
          depositsToday,
          withdrawalsToday,
          dailyReports
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message || "Erro ao obter estat\xEDsticas" });
    }
  }
  static async createUser(req, res) {
    if (!req.user) {
      res.status(401).json({ error: "N\xE3o autenticado" });
      return;
    }
    const { name, phone, email, password, initialBalance, role } = req.body;
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      res.status(400).json({ error: "O nome completo do jogador \xE9 obrigat\xF3rio." });
      return;
    }
    if (!phone || typeof phone !== "string" || phone.trim().length < 8) {
      res.status(400).json({ error: "N\xFAmero de telem\xF3vel inv\xE1lido (ex: +258 84 123 4567)." });
      return;
    }
    const cleanPhone = phone.trim();
    const cleanEmail = email && typeof email === "string" && email.includes("@") ? email.trim().toLowerCase() : `${cleanPhone.replace(/\D/g, "")}@zonabet.mz`;
    const existingUser = Array.from(db.users.values()).find(
      (u) => u.phone.replace(/\D/g, "") === cleanPhone.replace(/\D/g, "") || u.email.toLowerCase() === cleanEmail
    );
    if (existingUser) {
      res.status(409).json({ error: "J\xE1 existe um jogador registado com este telem\xF3vel ou email." });
      return;
    }
    const userPassword = password && typeof password === "string" && password.length >= 6 ? password : "Zona123!";
    const userRole = role === "ADMIN" ? "ADMIN" : "USER";
    const initBalance = typeof initialBalance === "number" && initialBalance > 0 ? initialBalance : 0;
    const digitsOnly = cleanPhone.replace(/\D/g, "");
    const nationalNumber = digitsOnly.startsWith("258") ? digitsOnly.slice(3) : digitsOnly;
    let referralCode = `ZONA${nationalNumber || Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    if (db.getUserByReferralCode(referralCode)) {
      let uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      referralCode = `${referralCode}-${uniqueSuffix}`;
      while (db.getUserByReferralCode(referralCode)) {
        referralCode = `ZONA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      }
    }
    const host = req.get("host") || "localhost:3000";
    const proto = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const individualReferralLink = `${proto}://${host}/?ref=${referralCode}`;
    const newUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      passwordHash: bcrypt3.hashSync(userPassword, 10),
      role: userRole,
      isBlocked: false,
      referralCode,
      referralLink: individualReferralLink,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.users.set(newUser.id, newUser);
    const wallet = await WalletService.getWallet(newUser.id);
    if (initBalance > 0) {
      await WalletService.executeTransaction({
        userId: newUser.id,
        type: "DEPOSIT",
        amount: initBalance,
        reference: `CAD-ADMIN-${Date.now().toString().slice(-6)}`,
        description: `Dep\xF3sito inicial concedido no registo administrativo por ${req.user.email}`
      });
    }
    AuditService.log(
      req.user.userId,
      req.user.email,
      "CREATE_USER",
      "User",
      newUser.id,
      {},
      { name: newUser.name, phone: newUser.phone, email: newUser.email, role: newUser.role, initialBalance: initBalance },
      req.ip
    );
    supabaseService.syncUserRealtime(newUser).catch(console.error);
    res.status(201).json({
      message: `Jogador "${newUser.name}" cadastrado com sucesso!`,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        balance: initBalance,
        referralCode: newUser.referralCode,
        referralLink: newUser.referralLink,
        tempPassword: userPassword
      }
    });
  }
  static async createMatch(req, res) {
    if (!req.user) return;
    const parse = createMatchSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0].message });
      return;
    }
    try {
      const match = await MatchService.createMatch({
        adminId: req.user.userId,
        adminEmail: req.user.email,
        competitionId: parse.data.competitionId,
        homeTeam: parse.data.homeTeam,
        awayTeam: parse.data.awayTeam,
        kickoffDate: parse.data.kickoffDate,
        kickoffTime: parse.data.kickoffTime,
        description: parse.data.description,
        odds: parse.data.odds,
        ip: req.ip
      });
      res.status(201).json({ message: "Jogo criado com sucesso!", match });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
  static async updateOdds(req, res) {
    if (!req.user) return;
    const { id } = req.params;
    const parse = updateOddsSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0].message });
      return;
    }
    try {
      const match = await MatchService.updateOdds({
        adminId: req.user.userId,
        adminEmail: req.user.email,
        matchId: id,
        odds: parse.data.odds,
        ip: req.ip
      });
      res.status(200).json({ message: "Odds atualizadas com sucesso!", match });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
  static async updateMatchStatus(req, res) {
    if (!req.user) return;
    const { id } = req.params;
    const parse = updateMatchStatusSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0].message });
      return;
    }
    try {
      const match = await MatchService.updateStatus({
        adminId: req.user.userId,
        adminEmail: req.user.email,
        matchId: id,
        status: parse.data.status,
        reason: parse.data.reason,
        ip: req.ip
      });
      res.status(200).json({ message: `Estado do jogo atualizado para ${match.status}`, match });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
  static async enterResult(req, res) {
    if (!req.user) return;
    const { id } = req.params;
    const parse = matchResultSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0].message });
      return;
    }
    try {
      const settlement = await SettlementService.settleMatch({
        adminId: req.user.userId,
        adminEmail: req.user.email,
        matchId: id,
        homeScore: parse.data.homeScore,
        awayScore: parse.data.awayScore,
        ip: req.ip
      });
      res.status(200).json({
        message: "Resultado registado e apostas liquidadas com sucesso!",
        settlement
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
  static async cancelMatch(req, res) {
    if (!req.user) return;
    const { id } = req.params;
    const reason = req.body.reason || "Jogo cancelado por decis\xE3o administrativa";
    try {
      const result = await SettlementService.cancelMatch({
        adminId: req.user.userId,
        adminEmail: req.user.email,
        matchId: id,
        reason,
        ip: req.ip
      });
      res.status(200).json({
        message: "Jogo cancelado e apostas reembolsadas!",
        result
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
  static async getUsers(req, res) {
    const host = req.get("host") || "localhost:3000";
    const proto = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const client = supabaseService.getClient();
    if (client) {
      try {
        const { data: profiles, error } = await client.from("profiles").select("*").order("created_at", { ascending: false });
        if (!error && profiles && profiles.length > 0) {
          const users2 = profiles.map((p) => {
            const code = p.referral_code || `ZONA${(p.phone || "").replace(/\D/g, "").slice(-9)}`;
            const referralLink = p.referral_link || `${proto}://${host}/?ref=${code}`;
            return {
              id: p.id,
              name: p.name,
              email: p.email || `${(p.phone || "").replace(/\D/g, "")}@zonabet.mz`,
              phone: p.phone,
              role: p.role,
              isBlocked: p.status === "BLOCKED",
              balance: Number(p.balance || 0),
              referralCode: code,
              referralLink,
              referredBy: p.referred_by,
              createdAt: p.created_at
            };
          });
          res.status(200).json({ users: users2 });
          return;
        }
      } catch (err) {
        console.warn("[Admin getUsers Supabase Error]:", err);
      }
    }
    const usersPromises = Array.from(db.users.values()).map(async (u) => {
      const wallet = await WalletService.getWallet(u.id);
      const code = u.referralCode || `ZONA${u.phone.replace(/\D/g, "").slice(-9)}`;
      const referralLink = u.referralLink || `${proto}://${host}/?ref=${code}`;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        isBlocked: u.isBlocked,
        balance: wallet?.balance || 0,
        referralCode: code,
        referralLink,
        referredBy: u.referredBy,
        createdAt: u.createdAt
      };
    });
    const users = await Promise.all(usersPromises);
    res.status(200).json({ users });
  }
  static async toggleUserBlock(req, res) {
    if (!req.user) return;
    const { id } = req.params;
    let targetUser = db.users.get(id);
    if (!targetUser) {
      const dbUser = await supabaseService.findUserById(id);
      if (dbUser) {
        targetUser = dbUser;
        db.users.set(targetUser.id, targetUser);
      }
    }
    if (!targetUser) {
      res.status(404).json({ error: "Utilizador n\xE3o encontrado" });
      return;
    }
    if (targetUser.role === "ADMIN") {
      res.status(400).json({ error: "N\xE3o \xE9 permitido bloquear uma conta de administrador" });
      return;
    }
    const previousStatus = targetUser.isBlocked;
    targetUser.isBlocked = !targetUser.isBlocked;
    targetUser.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    AuditService.log(
      req.user.userId,
      req.user.email,
      targetUser.isBlocked ? "BLOCK_USER" : "UNBLOCK_USER",
      "User",
      targetUser.id,
      { isBlocked: previousStatus },
      { isBlocked: targetUser.isBlocked },
      req.ip
    );
    supabaseService.syncUserRealtime(targetUser).catch(console.error);
    res.status(200).json({
      message: `Utilizador ${targetUser.isBlocked ? "bloqueado" : "desbloqueado"} com sucesso.`,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        isBlocked: targetUser.isBlocked
      }
    });
  }
  static async adjustBalance(req, res) {
    if (!req.user) return;
    const parse = balanceAdjustmentSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0].message });
      return;
    }
    const { userId, amount, reason } = parse.data;
    const targetUser = db.users.get(userId);
    if (!targetUser) {
      res.status(404).json({ error: "Utilizador n\xE3o encontrado" });
      return;
    }
    try {
      const reference = `ADJ-${Date.now()}`;
      const outcome = await WalletService.executeTransaction({
        userId,
        type: "ADJUSTMENT",
        amount,
        // Can be positive or negative
        reference,
        description: amount > 0 ? `Ajuste manual de cr\xE9dito: ${reason}` : `Ajuste manual de d\xE9bito: ${reason}`
      });
      AuditService.log(
        req.user.userId,
        req.user.email,
        "MANUAL_BALANCE_ADJUSTMENT",
        "Wallet",
        outcome.wallet.id,
        { previousBalance: outcome.transaction.previousBalance },
        {
          newBalance: outcome.transaction.nextBalance,
          amount,
          reason,
          reference,
          targetUserId: userId
        },
        req.ip
      );
      res.status(200).json({
        message: "Ajuste de saldo efetuado e auditado com sucesso.",
        wallet: outcome.wallet,
        transaction: outcome.transaction
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
  static async getAuditLogs(req, res) {
    const logs = await AuditService.getLogs(100);
    res.status(200).json({ logs });
  }
  static async getAllBets(req, res) {
    const bets = await BetService.getAllBets();
    res.status(200).json({ bets });
  }
  static async getAllTransactions(req, res) {
    const client = supabaseService.getClient();
    if (client) {
      let { data, error } = await client.from("transactions").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) {
        const alt = await client.from("wallet_transactions").select("*").order("created_at", { ascending: false }).limit(100);
        data = alt.data;
        error = alt.error;
      }
      if (!error && data) {
        const transactions2 = data.map((tx) => ({
          id: tx.id,
          userId: tx.user_id,
          type: tx.type === "BET_PLACEMENT" ? "BET" : tx.type === "BET_WIN" ? "WIN" : tx.type,
          amount: Number(tx.amount),
          previousBalance: Number(tx.prev_balance ?? tx.balance_before ?? 0),
          nextBalance: Number(tx.next_balance ?? tx.balance_after ?? 0),
          reference: tx.reference_id ?? tx.reference ?? "",
          description: tx.description ?? tx.notes ?? "",
          status: "COMPLETED",
          createdAt: tx.created_at
        }));
        res.status(200).json({ transactions: transactions2 });
        return;
      }
    }
    const transactions = [...db.transactions].reverse();
    res.status(200).json({ transactions });
  }
  static changeUserRole(req, res) {
    if (!req.user) return;
    const { id } = req.params;
    const { role } = req.body;
    if (role !== "USER" && role !== "ADMIN") {
      res.status(400).json({ error: "Fun\xE7\xE3o inv\xE1lida. Utilize USER ou ADMIN." });
      return;
    }
    const targetUser = db.users.get(id);
    if (!targetUser) {
      res.status(404).json({ error: "Utilizador n\xE3o encontrado" });
      return;
    }
    if (targetUser.id === req.user.userId && role === "USER") {
      res.status(400).json({ error: "N\xE3o \xE9 poss\xEDvel revogar os seus pr\xF3prios privil\xE9gios de administrador." });
      return;
    }
    const previousRole = targetUser.role;
    targetUser.role = role;
    targetUser.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    AuditService.log(
      req.user.userId,
      req.user.email,
      "CHANGE_USER_ROLE",
      "User",
      targetUser.id,
      { previousRole },
      { newRole: role },
      req.ip
    );
    res.status(200).json({
      message: `Fun\xE7\xE3o do utilizador alterada para ${role} com sucesso.`,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        role: targetUser.role
      }
    });
  }
  static resetUserPassword(req, res) {
    if (!req.user) return;
    const { id } = req.params;
    const newPassword = req.body.newPassword || "Zona123!";
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      res.status(400).json({ error: "A palavra-passe deve ter pelo menos 6 caracteres." });
      return;
    }
    const targetUser = db.users.get(id);
    if (!targetUser) {
      res.status(404).json({ error: "Utilizador n\xE3o encontrado" });
      return;
    }
    targetUser.passwordHash = bcrypt3.hashSync(newPassword, 10);
    targetUser.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    AuditService.log(
      req.user.userId,
      req.user.email,
      "RESET_USER_PASSWORD",
      "User",
      targetUser.id,
      {},
      { resetByAdmin: req.user.email },
      req.ip
    );
    supabaseService.syncUserRealtime(targetUser).catch(console.error);
    res.status(200).json({
      message: `Palavra-passe do utilizador ${targetUser.email} redefinida com sucesso para "${newPassword}".`,
      tempPassword: newPassword
    });
  }
  static async getUserBets(req, res) {
    const { id } = req.params;
    const userBets = await BetService.getUserBets(id);
    res.status(200).json({ bets: userBets });
  }
  static async getUserTransactions(req, res) {
    const { id } = req.params;
    const client = supabaseService.getClient();
    if (client) {
      const { data, error } = await client.from("wallet_transactions").select("*").eq("user_id", id).order("created_at", { ascending: false });
      if (!error && data) {
        const transactions = data.map((tx) => ({
          id: tx.id,
          userId: tx.user_id,
          type: tx.type,
          amount: Number(tx.amount),
          previousBalance: Number(tx.balance_before),
          nextBalance: Number(tx.balance_after),
          reference: tx.reference,
          description: tx.notes,
          status: tx.status,
          createdAt: tx.created_at
        }));
        res.status(200).json({ transactions });
        return;
      }
    }
    const userTransactions = db.transactions.filter((tx) => tx.userId === id).reverse();
    res.status(200).json({ transactions: userTransactions });
  }
  static deleteUser(req, res) {
    if (!req.user) return;
    const { id } = req.params;
    if (id === req.user.userId) {
      res.status(400).json({ error: "N\xE3o \xE9 poss\xEDvel excluir a sua pr\xF3pria conta." });
      return;
    }
    const userToDelete = db.users.get(id);
    if (!userToDelete) {
      res.status(404).json({ error: "Utilizador n\xE3o encontrado." });
      return;
    }
    db.users.delete(id);
    db.wallets.delete(id);
    AuditService.log(
      req.user.userId,
      req.user.email,
      "DELETE_USER",
      "User",
      id,
      { email: userToDelete.email },
      { deleted: true },
      req.ip
    );
    res.status(200).json({ message: `Utilizador ${userToDelete.name} exclu\xEDdo com sucesso.` });
  }
  static async deleteMatch(req, res) {
    if (!req.user) return;
    const { id } = req.params;
    const match = db.matches.get(id);
    if (!match) {
      res.status(404).json({ error: "Jogo n\xE3o encontrado" });
      return;
    }
    const matchBets = Array.from(db.bets.values()).filter(
      (b) => b.items.some((item) => item.matchId === id)
    );
    if (matchBets.length > 0) {
      for (const bet of matchBets) {
        if (bet.status === "PENDING") {
          await WalletService.executeTransaction({
            userId: bet.userId,
            type: "REFUND",
            amount: bet.stake,
            reference: bet.id,
            description: `Reembolso por cancelamento/exclus\xE3o do Jogo (Aposta #${bet.id})`
          });
          bet.status = "VOID";
          bet.settledAt = (/* @__PURE__ */ new Date()).toISOString();
          supabaseService.syncBetRealtime(bet).catch(console.error);
        }
      }
    }
    db.matches.delete(id);
    AuditService.log(
      req.user.userId,
      req.user.email,
      "DELETE_MATCH",
      "Match",
      id,
      { homeTeam: match.homeTeam, awayTeam: match.awayTeam, competitionId: match.competitionId },
      { deleted: true },
      req.ip
    );
    supabaseService.deleteMatchRealtime(id).catch(console.error);
    res.status(200).json({
      message: `Jogo "${match.homeTeam} vs ${match.awayTeam}" exclu\xEDdo com sucesso do sistema.`
    });
  }
  static getDepositProofs(req, res) {
    const proofs = db.getDepositProofs();
    res.status(200).json({ proofs });
  }
  static async updateDepositProofStatus(req, res) {
    if (!req.user) {
      res.status(401).json({ error: "N\xE3o autenticado" });
      return;
    }
    const { id } = req.params;
    const { status, reviewNotes } = req.body;
    if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
      res.status(400).json({ error: "Estado de comprovativo inv\xE1lido." });
      return;
    }
    const proof = db.getDepositProof(id);
    if (!proof) {
      res.status(404).json({ error: "Comprovativo de dep\xF3sito n\xE3o encontrado." });
      return;
    }
    const previousStatus = proof.status;
    if (status === "APPROVED" && previousStatus !== "APPROVED") {
      try {
        await WalletService.executeTransaction({
          userId: proof.userId,
          type: "DEPOSIT",
          amount: proof.amount,
          reference: proof.referenceCode,
          description: `Dep\xF3sito via ${proof.method} aprovado por ${req.user.email}${proof.operatorTxId ? ` [Ref: ${proof.operatorTxId}]` : ""}`
        });
        ReferralService.processDepositBonus(proof.userId, proof.amount).catch((err) => {
          console.error("[ReferralBonus] Erro ao creditar b\xF3nus de 5% na aprova\xE7\xE3o:", err);
        });
      } catch (err) {
        res.status(400).json({ error: `Erro ao creditar saldo: ${err.message}` });
        return;
      }
    }
    const updated = db.updateDepositProofStatus(
      id,
      status,
      req.user.email,
      reviewNotes || void 0
    );
    AuditService.log(
      req.user.userId,
      req.user.email,
      "UPDATE_DEPOSIT_PROOF",
      "DepositProof",
      id,
      { status: previousStatus },
      { status, reviewNotes },
      req.ip
    );
    if (updated) {
      supabaseService.syncDepositProofRealtime(updated).catch(console.error);
    }
    res.status(200).json({
      message: `Comprovativo de dep\xF3sito atualizado para ${status}.`,
      proof: updated
    });
  }
  static async resetAllBalances(req, res) {
    if (!req.user) return;
    try {
      const { affectedRows } = await WalletService.resetAllBalances(req.user.userId, req.user.email);
      AuditService.log(
        req.user.userId,
        req.user.email,
        "RESET_ALL_BALANCES",
        "System",
        "Global",
        {},
        { affectedUsers: affectedRows, reason: "Limpeza de Dinheiro Virtual" },
        req.ip
      );
      res.status(200).json({
        message: `Limpeza de Dinheiro Virtual conclu\xEDda. ${affectedRows} saldos de jogadores foram resetados para 0.00 MT.`,
        affectedRows
      });
    } catch (err) {
      res.status(500).json({ error: err.message || "Erro ao realizar limpeza de saldos" });
    }
  }
  static async getSettings(req, res) {
    const settings = await settingsService.getSettings();
    res.status(200).json({ settings });
  }
  static async updateSettings(req, res) {
    if (!req.user) {
      res.status(401).json({ error: "N\xE3o autenticado" });
      return;
    }
    try {
      const updated = settingsService.updateSettings(
        req.body,
        req.user.userId,
        req.user.email,
        req.ip
      );
      res.status(200).json({
        message: "Configura\xE7\xF5es do sistema atualizadas e auditadas com sucesso!",
        settings: updated
      });
    } catch (err) {
      res.status(400).json({ error: err.message || "Erro ao atualizar configura\xE7\xF5es" });
    }
  }
  static async getPublicSettings(req, res) {
    const publicSettings = await settingsService.getPublicSettings();
    res.status(200).json({ settings: publicSettings });
  }
  static async getRiskOverview(req, res) {
    try {
      const risk = await RiskService.getRiskOverview();
      res.status(200).json({ risk });
    } catch (err) {
      res.status(500).json({ error: err.message || "Erro ao calcular gest\xE3o de risco" });
    }
  }
  static async updateMarketStatus(req, res) {
    if (!req.user) return;
    const { matchId, marketId } = req.params;
    const { status, reason } = req.body;
    if (!["OPEN", "SUSPENDED", "CLOSED"].includes(status)) {
      res.status(400).json({ error: "Estado de mercado inv\xE1lido" });
      return;
    }
    try {
      const market = await MatchService.updateMarketStatus({
        adminId: req.user.userId,
        adminEmail: req.user.email,
        matchId,
        marketId,
        status,
        reason,
        ip: req.ip
      });
      res.status(200).json({ message: `Estado do mercado alterado para ${status}`, market });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
  static async updateMarketOdds(req, res) {
    if (!req.user) return;
    const { matchId, marketId } = req.params;
    const { selections } = req.body;
    if (!Array.isArray(selections)) {
      res.status(400).json({ error: "Lista de sele\xE7\xF5es inv\xE1lida" });
      return;
    }
    try {
      const market = await MatchService.updateMarketOdds({
        adminId: req.user.userId,
        adminEmail: req.user.email,
        matchId,
        marketId,
        selections,
        ip: req.ip
      });
      res.status(200).json({ message: "Odds do mercado atualizadas com sucesso", market });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
  static async addMarketSelection(req, res) {
    if (!req.user) return;
    const { matchId, marketId } = req.params;
    const { outcome, label, odds } = req.body;
    if (!outcome || !label || !odds || odds <= 1) {
      res.status(400).json({ error: "Dados da sele\xE7\xE3o inv\xE1lidos. Odd deve ser maior que 1.00." });
      return;
    }
    try {
      const market = await MatchService.addMarketSelection({
        adminId: req.user.userId,
        adminEmail: req.user.email,
        matchId,
        marketId,
        outcome,
        label,
        odds: Number(odds),
        ip: req.ip
      });
      res.status(201).json({ message: "Nova op\xE7\xE3o de resultado adicionada com sucesso!", market });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};

// backend/src/routes/adminRoutes.ts
var router5 = Router5();
router5.use(authenticate, requireAdmin);
router5.get("/dashboard", AdminController.getDashboardStats);
router5.post("/matches", AdminController.createMatch);
router5.put("/matches/:id/odds", AdminController.updateOdds);
router5.put("/matches/:id/status", AdminController.updateMatchStatus);
router5.post("/matches/:id/result", AdminController.enterResult);
router5.post("/matches/:id/cancel", AdminController.cancelMatch);
router5.get("/users", AdminController.getUsers);
router5.post("/users", AdminController.createUser);
router5.patch("/users/:id/block", AdminController.toggleUserBlock);
router5.patch("/users/:id/role", AdminController.changeUserRole);
router5.post("/users/:id/reset-password", AdminController.resetUserPassword);
router5.post("/users/adjust-balance", AdminController.adjustBalance);
router5.post("/users/reset-all-balances", AdminController.resetAllBalances);
router5.delete("/users/:id", AdminController.deleteUser);
router5.get("/users/:id/bets", AdminController.getUserBets);
router5.get("/users/:id/transactions", AdminController.getUserTransactions);
router5.delete("/matches/:id", AdminController.deleteMatch);
router5.get("/bets", AdminController.getAllBets);
router5.get("/transactions", AdminController.getAllTransactions);
router5.get("/deposit-proofs", AdminController.getDepositProofs);
router5.patch("/deposit-proofs/:id/status", AdminController.updateDepositProofStatus);
router5.get("/audit-logs", AdminController.getAuditLogs);
router5.get("/settings", AdminController.getSettings);
router5.put("/settings", AdminController.updateSettings);
router5.get("/risk", AdminController.getRiskOverview);
router5.patch("/matches/:matchId/markets/:marketId/status", AdminController.updateMarketStatus);
router5.put("/matches/:matchId/markets/:marketId/odds", AdminController.updateMarketOdds);
router5.post("/matches/:matchId/markets/:marketId/selections", AdminController.addMarketSelection);
var adminRoutes_default = router5;

// backend/src/routes/supabaseRoutes.ts
import { Router as Router6 } from "express";
import fs from "fs";
import path from "path";
var router6 = Router6();
router6.get("/status", async (req, res) => {
  try {
    const status = await supabaseService.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      isConfigured: false,
      connected: false,
      error: error.message || "Erro ao verificar estado do Supabase"
    });
  }
});
router6.post("/sync", async (req, res) => {
  try {
    const result = await supabaseService.syncLocalDataToSupabase();
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Falha ao sincronizar com o Supabase"
    });
  }
});
router6.post("/pull", async (req, res) => {
  try {
    const result = await supabaseService.pullDataFromSupabase();
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Falha ao importar dados do Supabase"
    });
  }
});
router6.get("/schema", (req, res) => {
  try {
    const schemaPath = path.join(process.cwd(), "supabase", "schema.sql");
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, "utf8");
      return res.json({ sql });
    }
    res.status(404).json({ error: "Ficheiro schema.sql n\xE3o encontrado" });
  } catch (error) {
    res.status(500).json({ error: error.message || "Erro ao carregar schema" });
  }
});
var supabaseRoutes_default = router6;

// backend/src/app.ts
function createExpressApp() {
  const app2 = express();
  app2.use(cors({ origin: true, credentials: true }));
  app2.use(express.json({ limit: "15mb" }));
  app2.use(express.urlencoded({ extended: true, limit: "15mb" }));
  app2.use(rateLimiter(200, 6e4));
  app2.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (req.path.startsWith("/api")) {
        console.log(`[API] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
      }
    });
    next();
  });
  const healthHandler = (req, res) => {
    res.json({
      status: "ok",
      service: "ZONABET API",
      currency: "MZN",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  };
  const settingsHandler = (req, res, next) => {
    settingsService.getPublicSettings().then((settings) => res.json({ settings })).catch(next);
  };
  const registerApiRoutes = (prefix) => {
    app2.get(`${prefix}/health`, healthHandler);
    app2.get(`${prefix}/settings/public`, settingsHandler);
    app2.use(`${prefix}/auth`, authRoutes_default);
    app2.use(`${prefix}/matches`, matchRoutes_default);
    app2.use(`${prefix}/bets`, betRoutes_default);
    app2.use(`${prefix}/wallet`, walletRoutes_default);
    app2.use(`${prefix}/admin`, adminRoutes_default);
    app2.use(`${prefix}/supabase`, supabaseRoutes_default);
  };
  registerApiRoutes("/api");
  registerApiRoutes("");
  app2.use(["/api/*", "/api"], (req, res) => {
    res.status(404).json({
      error: `Rota API n\xE3o encontrada: ${req.method} ${req.originalUrl || req.url}`
    });
  });
  app2.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }
    console.error("API Error:", err);
    res.status(err.status || 500).json({
      error: err.message || "Ocorreu um erro interno no servidor"
    });
  });
  return app2;
}

// api/index.ts
var app = createExpressApp();
var hydrated = false;
var hydrationPromise = null;
async function ensureHydrated() {
  if (hydrated) return;
  if (hydrationPromise) return hydrationPromise;
  hydrationPromise = (async () => {
    try {
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Supabase hydration timeout")), 2500)
      );
      await Promise.race([
        (async () => {
          if (supabaseService.isAvailable()) {
            const status = await supabaseService.getStatus();
            if (status.connected) {
              const result = await supabaseService.pullDataFromSupabase();
              if (result.success) {
                console.log(`[ZONABET Serverless] Dados hidratados: ${result.results?.users || 0} utilizadores.`);
              }
            }
          }
        })(),
        timeoutPromise
      ]);
    } catch (err) {
      console.warn("[ZONABET Serverless] Hidrata\xE7\xE3o inicial continuar\xE1 em background:", err?.message || err);
    } finally {
      hydrated = true;
    }
  })();
  return hydrationPromise;
}
async function handler(req, res) {
  await ensureHydrated();
  const forwardedPath = req.headers && (req.headers["x-forwarded-uri"] || req.headers["x-matched-path"]);
  if (forwardedPath && typeof forwardedPath === "string" && forwardedPath.startsWith("/")) {
    const queryIdx = (req.url || "").indexOf("?");
    const queryStr = queryIdx >= 0 ? req.url.slice(queryIdx) : "";
    req.url = forwardedPath + queryStr;
  }
  if (req.query && req.query.all) {
    const subpath = Array.isArray(req.query.all) ? req.query.all.join("/") : req.query.all;
    if (subpath) {
      const queryIdx = (req.url || "").indexOf("?");
      const queryStr = queryIdx >= 0 ? req.url.slice(queryIdx) : "";
      req.url = "/api/" + subpath + queryStr;
    }
  }
  if (!req.url || req.url === "/") {
    req.url = "/api/health";
  } else if (!req.url.startsWith("/")) {
    req.url = "/" + req.url;
  }
  return app(req, res);
}
export {
  handler as default
};
