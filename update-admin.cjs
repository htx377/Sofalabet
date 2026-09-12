const fs = require('fs');
let content = fs.readFileSync('backend/src/controllers/adminController.ts', 'utf-8');
content = content.replace(
  'static getSettings(req: AuthenticatedRequest, res: Response): void {',
  'static async getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {'
);
content = content.replace(
  'const settings = settingsService.getSettings();',
  'const settings = await settingsService.getSettings();'
);
content = content.replace(
  'static updateSettings(req: AuthenticatedRequest, res: Response): void {',
  'static async updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {'
);
content = content.replace(
  'const publicSettings = settingsService.getPublicSettings();',
  'const publicSettings = await settingsService.getPublicSettings();'
);
content = content.replace(
  'const updatedSettings = settingsService.updateSettings(',
  'const updatedSettings = await settingsService.updateSettings('
);
fs.writeFileSync('backend/src/controllers/adminController.ts', content);
