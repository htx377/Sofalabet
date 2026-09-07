import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { db } from '../db/store.ts';
import { WalletService } from '../services/walletService.ts';
import { config } from '../config/index.ts';

export class WalletController {
  static getWallet(req: AuthenticatedRequest, res: Response): void {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const wallet = WalletService.getWallet(req.user.userId);
    res.status(200).json({
      wallet: {
        id: wallet.id,
        balance: wallet.balance,
        currency: config.currency,
        isTestMode: config.isTestMode,
      },
    });
  }

  static getTransactions(req: AuthenticatedRequest, res: Response): void {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const transactions = db.getTransactions(req.user.userId);
    res.status(200).json({ transactions });
  }

  // Prepared endpoint for sandbox/virtual deposit (simulating M-Pesa / e-Mola top-up in test mode)
  static async requestVirtualTopup(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const amount = Number(req.body.amount || 500);
    const method = req.body.method || 'M-Pesa (Virtual Test)';

    if (amount <= 0 || amount > 10000) {
      res.status(400).json({ error: 'Montante de recarga de teste deve ser entre 10 e 10.000 MZN' });
      return;
    }

    try {
      const { wallet, transaction } = await WalletService.executeTransaction({
        userId: req.user.userId,
        type: 'DEPOSIT',
        amount,
        reference: `TOPUP-${Date.now()}`,
        description: `Recarga de saldo (${method})`,
      });

      res.status(200).json({
        message: `Depósito de ${amount} MZN processado com sucesso!`,
        wallet,
        transaction,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao processar recarga' });
    }
  }
}
