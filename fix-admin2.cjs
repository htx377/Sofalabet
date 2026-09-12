const fs = require('fs');
let content = fs.readFileSync('backend/src/controllers/adminController.ts', 'utf-8');
content = content.replace(
  'static getPublicSettings(req: AuthenticatedRequest, res: Response): void {',
  'static async getPublicSettings(req: AuthenticatedRequest, res: Response): Promise<void> {'
);
content = content.replace(
  'static getRiskOverview(req: AuthenticatedRequest, res: Response): void {',
  'static async getRiskOverview(req: AuthenticatedRequest, res: Response): Promise<void> {'
);
content = content.replace(
  'const risk = RiskService.getRiskOverview();',
  'const risk = await RiskService.getRiskOverview();'
);
fs.writeFileSync('backend/src/controllers/adminController.ts', content);
