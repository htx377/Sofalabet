const fs = require('fs');
let content = fs.readFileSync('backend/src/services/riskService.ts', 'utf-8');
content = content.replace(
  'static getRiskOverview(): RiskOverview {',
  'static async getRiskOverview(): Promise<RiskOverview> {'
);
fs.writeFileSync('backend/src/services/riskService.ts', content);
