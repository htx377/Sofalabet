const fs = require('fs');
let content = fs.readFileSync('backend/src/controllers/walletController.ts', 'utf-8');
content = content.replace(
  'const settings = settingsService.getSettings();',
  'const settings = await settingsService.getSettings();'
);
fs.writeFileSync('backend/src/controllers/walletController.ts', content);
