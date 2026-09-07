import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/store.ts';
import { config } from '../config/index.ts';
import { registerSchema, loginSchema } from '../validators/schemas.ts';
import { WalletService } from '../services/walletService.ts';
import { AuditService } from '../services/auditService.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { User, AuthTokenPayload } from '../types/index.ts';

export class AuthController {
  static register(req: Request, res: Response): void {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.issues[0].message });
      return;
    }

    const { name, email, phone, password } = parseResult.data;

    if (db.getUserByEmail(email)) {
      res.status(409).json({ error: 'Já existe uma conta associada a este endereço de email.' });
      return;
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newUser: User = {
      id: userId,
      name,
      email,
      phone,
      passwordHash,
      role: 'USER',
      isBlocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.set(userId, newUser);

    // Initialize user wallet with 1,000 MZN virtual test balance
    const wallet = WalletService.getWallet(userId);
    wallet.balance = 1000.00;
    wallet.updatedAt = new Date().toISOString();

    // Create deposit transaction in ledger
    db.transactions.push({
      id: `tx-${Date.now()}-reg`,
      walletId: wallet.id,
      userId,
      type: 'DEPOSIT',
      amount: 1000.00,
      previousBalance: 0.00,
      nextBalance: 1000.00,
      reference: 'BÓNUS-BOAS-VINDAS',
      description: 'Depósito inicial de boas-vindas da conta em MZN',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    });

    const tokenPayload: AuthTokenPayload = {
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    };

    const token = jwt.sign(tokenPayload, config.jwtSecret, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registo efetuado com sucesso!',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        balance: wallet.balance,
      },
    });
  }

  static login(req: Request, res: Response): void {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.issues[0].message });
      return;
    }

    const { email, password } = parseResult.data;
    const user = db.getUserByEmail(email);

    if (!user) {
      res.status(401).json({ error: 'Credenciais inválidas. Email ou password incorretos.' });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({ error: 'Esta conta encontra-se bloqueada. Contacte a administração.' });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Credenciais inválidas. Email ou password incorretos.' });
      return;
    }

    const tokenPayload: AuthTokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, config.jwtSecret, { expiresIn: '7d' });
    const wallet = WalletService.getWallet(user.id);

    if (user.role === 'ADMIN') {
      AuditService.log(
        user.id,
        user.email,
        'ADMIN_LOGIN',
        'Session',
        user.id,
        undefined,
        { ip: req.ip },
        req.ip || 'internal'
      );
    }

    res.status(200).json({
      message: 'Sessão iniciada com sucesso.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        balance: wallet.balance,
      },
    });
  }

  static me(req: AuthenticatedRequest, res: Response): void {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const user = db.users.get(req.user.userId);
    if (!user) {
      res.status(404).json({ error: 'Utilizador não encontrado' });
      return;
    }

    const wallet = WalletService.getWallet(user.id);

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        balance: wallet.balance,
        isBlocked: user.isBlocked,
      },
    });
  }

  static logout(req: Request, res: Response): void {
    res.status(200).json({ message: 'Sessão encerrada com sucesso.' });
  }
}
