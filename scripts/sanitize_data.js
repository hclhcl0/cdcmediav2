const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'sqlite_data.json');
const destPath = path.join(__dirname, '../prisma/seed_data.json');

if (!fs.existsSync(srcPath)) {
  console.error('Source file not found.');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(srcPath, 'utf8'));

// Keys to remove from AppSetting to prevent GitHub Secret Scanning alerts
const sensitiveKeys = [
  'gdrive_client_id',
  'gdrive_client_secret',
  'gdrive_refresh_token',
  'gdrive_api_key',
  'gemini_api_key'
];

if (data.settings) {
  const originalCount = data.settings.length;
  data.settings = data.settings.filter(s => !sensitiveKeys.includes(s.key));
  console.log(`Removed ${originalCount - data.settings.length} sensitive settings.`);
}

fs.writeFileSync(destPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Sanitized data saved to prisma/seed_data.json');
