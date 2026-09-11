import { Router } from 'express';
import { AdminController } from '../controllers/adminController.ts';
import { authenticate, requireAdmin } from '../middleware/auth.ts';

const router = Router();

// Protect all admin routes with authentication + role ADMIN check
router.use(authenticate, requireAdmin);

router.get('/dashboard', AdminController.getDashboardStats);
router.post('/matches', AdminController.createMatch);
router.put('/matches/:id/odds', AdminController.updateOdds);
router.put('/matches/:id/status', AdminController.updateMatchStatus);
router.post('/matches/:id/result', AdminController.enterResult);
router.post('/matches/:id/cancel', AdminController.cancelMatch);

router.get('/users', AdminController.getUsers);
router.patch('/users/:id/block', AdminController.toggleUserBlock);
router.patch('/users/:id/role', AdminController.changeUserRole);
router.post('/users/:id/reset-password', AdminController.resetUserPassword);
router.post('/users/adjust-balance', AdminController.adjustBalance);
router.delete('/users/:id', AdminController.deleteUser);
router.get('/users/:id/bets', AdminController.getUserBets);
router.get('/users/:id/transactions', AdminController.getUserTransactions);
router.delete('/matches/:id', AdminController.deleteMatch);

router.get('/bets', AdminController.getAllBets);
router.get('/transactions', AdminController.getAllTransactions);
router.get('/deposit-proofs', AdminController.getDepositProofs);
router.patch('/deposit-proofs/:id/status', AdminController.updateDepositProofStatus);
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;
