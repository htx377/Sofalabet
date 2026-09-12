import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.ts';
import matchRoutes from './routes/matchRoutes.ts';
import betRoutes from './routes/betRoutes.ts';
import walletRoutes from './routes/walletRoutes.ts';
import adminRoutes from './routes/adminRoutes.ts';
import supabaseRoutes from './routes/supabaseRoutes.ts';
import { rateLimiter } from './middleware/auth.ts';
import { settingsService } from './services/settingsService.ts';

export function createExpressApp() {
  const app = express();

  // Basic security and parsing
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));
  app.use(rateLimiter(200, 60000));

  // Request logger in dev
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (req.path.startsWith('/api')) {
        console.log(`[API] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
      }
    });
    next();
  });

  // Health check
  app.get('/api/health', (req: Request, res: Response, next: NextFunction) => {
    res.json({
      status: 'ok',
      service: 'ZONABET API',
      currency: 'MZN',
      timestamp: new Date().toISOString(),
    });
  });

  // REST API Routes
  app.get('/api/settings/public', (req: Request, res: Response, next: NextFunction) => {
    settingsService.getPublicSettings().then(settings => res.json({ settings })).catch(next);
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/matches', matchRoutes);
  app.use('/api/bets', betRoutes);
  app.use('/api/wallet', walletRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/supabase', supabaseRoutes);

  // Global error handler for API
  app.use('/api/*', (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('API Error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Ocorreu um erro interno no servidor',
    });
  });

  return app;
}
