const fs = require('fs');
let content = fs.readFileSync('backend/src/services/settingsService.ts', 'utf-8');
content = content.replace(
  "import { supabaseService } from '../db/supabase.ts';\n\n  public async getSettings()",
  "public async getSettings()"
);
content = "import { supabaseService } from '../db/supabase.ts';\n" + content;
fs.writeFileSync('backend/src/services/settingsService.ts', content);
