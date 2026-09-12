const fs = require('fs');
let content = fs.readFileSync('backend/src/services/riskService.ts', 'utf-8');
content = content.replace(
  'static checkBetRisk(params: {',
  'static async checkBetRisk(params: {'
);
content = content.replace(
  'potentialReturn: number;\n  }): void {',
  'potentialReturn: number;\n  }): Promise<void> {'
);
fs.writeFileSync('backend/src/services/riskService.ts', content);
