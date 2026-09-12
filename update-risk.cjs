const fs = require('fs');
let content = fs.readFileSync('backend/src/services/riskService.ts', 'utf-8');
content = content.replace(
  'static checkExposure(marketId: string, outcomeId: string): {',
  'static async checkExposure(marketId: string, outcomeId: string): Promise<{'
);
content = content.replace(
  'const settings = settingsService.getSettings();',
  'const settings = await settingsService.getSettings();'
);
content = content.replace(
  'static analyzeMatchRisk(matchId: string): {',
  'static async analyzeMatchRisk(matchId: string): Promise<{'
);
content = content.replace(
  'const settings = settingsService.getSettings();',
  'const settings = await settingsService.getSettings();'
);
fs.writeFileSync('backend/src/services/riskService.ts', content);
