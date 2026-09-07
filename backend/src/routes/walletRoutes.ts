import { Router } from 'express';
import { WalletController } from '../controllers/walletController.ts';
import { authenticate } from '../middleware/auth.ts';

const router = Router();

router.get('/', authenticate, WalletController.getWallet);
router.get('/transactions', authenticate, WalletController.getTransactions);
router.post('/topup', authenticate, WalletController.requestVirtualTopup);

export default router;
