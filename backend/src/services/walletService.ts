import { db } from '../db/store.ts';
import { Wallet, WalletTransaction, TransactionType } from '../types/index.ts';
import { Money } from '../utils/money.ts';
import { walletMutex } from '../utils/mutex.ts';

export class WalletService {
  /**
   * Retrieves or creates user wallet
   */
  static getWallet(userId: string): Wallet {
    let wallet = db.wallets.get(userId);
    if (!wallet) {
      wallet = {
        id: `wal-${Date.now()}-${userId.substring(0, 6)}`,
        userId,
        balance: 0.00,
        lockedBalance: 0.00,
        updatedAt: new Date().toISOString(),
      };
      db.wallets.set(userId, wallet);
    }
    return wallet;
  }

  /**
   * Atomic financial transaction engine with concurrency locking
   */
  static async executeTransaction(params: {
    userId: string;
    type: TransactionType;
    amount: number;
    reference: string;
    description: string;
    idempotencyKey?: string;
  }): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
    const { userId, type, amount, reference, description } = params;

    if (!Money.isValidAmount(amount)) {
      throw new Error(`Montante inválido para transação: ${amount}`);
    }

    // Acquire lock for this specific user wallet to ensure safe concurrency
    return await walletMutex.acquire(userId, async () => {
      const wallet = this.getWallet(userId);
      const previousBalance = wallet.balance;

      let nextBalance: number;

      switch (type) {
        case 'DEPOSIT':
        case 'WIN':
        case 'REFUND':
          nextBalance = Money.add(previousBalance, amount);
          break;

        case 'BET':
          if (Money.toCents(previousBalance) < Money.toCents(amount)) {
            throw new Error(`Saldo insuficiente. Saldo disponível: ${Money.format(previousBalance)} MZN, Necessário: ${Money.format(amount)} MZN`);
          }
          nextBalance = Money.subtract(previousBalance, amount);
          break;

        case 'ADJUSTMENT':
          // Adjustment can be positive or negative depending on context
          // Here amount is already positive, but caller can specify credit/debit
          nextBalance = Money.add(previousBalance, amount);
          if (nextBalance < 0) {
            throw new Error('Ajuste resultaria em saldo negativo');
          }
          break;

        default:
          throw new Error(`Tipo de transação desconhecido: ${type}`);
      }

      // Update wallet state atomically
      wallet.balance = nextBalance;
      wallet.updatedAt = new Date().toISOString();

      // Record immutable ledger entry
      const transaction: WalletTransaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        walletId: wallet.id,
        userId,
        type,
        amount,
        previousBalance,
        nextBalance,
        reference,
        description,
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
      };

      db.transactions.push(transaction);

      return { wallet, transaction };
    });
  }

  /**
   * Executes a negative manual adjustment by an administrator
   */
  static async executeDebitAdjustment(params: {
    userId: string;
    amount: number;
    reference: string;
    description: string;
  }): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
    const { userId, amount, reference, description } = params;

    return await walletMutex.acquire(userId, async () => {
      const wallet = this.getWallet(userId);
      const previousBalance = wallet.balance;

      if (Money.toCents(previousBalance) < Money.toCents(amount)) {
        throw new Error(`Saldo insuficiente para débito de ajuste. Saldo atual: ${previousBalance} MZN`);
      }

      const nextBalance = Money.subtract(previousBalance, amount);
      wallet.balance = nextBalance;
      wallet.updatedAt = new Date().toISOString();

      const transaction: WalletTransaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        walletId: wallet.id,
        userId,
        type: 'ADJUSTMENT',
        amount: -amount,
        previousBalance,
        nextBalance,
        reference,
        description,
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
      };

      db.transactions.push(transaction);
      return { wallet, transaction };
    });
  }
}
