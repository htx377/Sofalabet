import { createExpressApp } from '../backend/src/app.ts';
import { supabaseService } from '../backend/src/db/supabase.ts';

const app = createExpressApp();

// Simple startup hydration for serverless environment
// Note: In serverless, this runs on cold starts.
let hydrated = false;

app.use(async (req, res, next) => {
  if (!hydrated && supabaseService.isAvailable()) {
    try {
      const status = await supabaseService.getStatus();
      if (status.connected) {
        const result = await supabaseService.pullDataFromSupabase();
        if (result.success) {
          console.log(`[ZONABET Serverless] Data hydrated: ${result.results?.users || 0} users.`);
          hydrated = true;
        }
      }
    } catch (err) {
      console.warn('[ZONABET Serverless] Hydration failed:', err);
    }
  }
  next();
});

export default app;
