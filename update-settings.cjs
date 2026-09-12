const fs = require('fs');
const path = require('path');

let content = fs.readFileSync('backend/src/services/settingsService.ts', 'utf-8');

// Replace synchronous getSettings
content = content.replace(
  'public getSettings(): SystemSettings {',
  `import { supabaseService } from '../db/supabase.ts';\n\n  public async getSettings(): Promise<SystemSettings> {
    const client = supabaseService.getClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('system_settings')
          .select('config')
          .eq('id', 'default')
          .single();
        if (data && data.config) {
          this.settings = { ...this.settings, ...data.config };
        }
      } catch (e) {
        console.error('Failed to fetch settings from Supabase:', e);
      }
    }`
);

// Replace synchronous getPublicSettings
content = content.replace(
  'public getPublicSettings(): {',
  'public async getPublicSettings(): Promise<{'
);
content = content.replace(
  '    const s = this.settings;',
  '    const s = await this.getSettings();'
);

// Replace synchronous updateSettings
content = content.replace(
  'public updateSettings(',
  'public async updateSettings('
);
content = content.replace(
  '  ): SystemSettings {',
  '  ): Promise<SystemSettings> {\n    await this.getSettings(); // sync first'
);
content = content.replace(
  '    return { ...this.settings };',
  `    const client = supabaseService.getClient();
    if (client) {
      await client.from('system_settings').upsert({ id: 'default', config: this.settings });
    }
    return { ...this.settings };`
);

fs.writeFileSync('backend/src/services/settingsService.ts', content);
