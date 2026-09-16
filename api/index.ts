import { createExpressApp } from '../backend/src/app.ts';
import { supabaseService } from '../backend/src/db/supabase.ts';

const app = createExpressApp();

let hydrated = false;
let hydrationPromise: Promise<void> | null = null;

async function ensureHydrated() {
  if (hydrated) return;
  if (hydrationPromise) return hydrationPromise;

  hydrationPromise = (async () => {
    try {
      if (supabaseService.isAvailable()) {
        const status = await supabaseService.getStatus();
        if (status.connected) {
          const result = await supabaseService.pullDataFromSupabase();
          if (result.success) {
            console.log(`[ZONABET Serverless] Dados hidratados: ${result.results?.users || 0} utilizadores.`);
          }
        }
      }
    } catch (err) {
      console.warn('[ZONABET Serverless] Aviso na hidratação inicial:', err);
    } finally {
      hydrated = true;
    }
  })();

  return hydrationPromise;
}

export default async function handler(req: any, res: any) {
  await ensureHydrated();

  // Ensure req.url starts with /api for Express routing
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }

  return app(req, res);
}

