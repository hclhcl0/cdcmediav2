const { execSync } = require('child_process');

console.log('🚀 Starting CDCMedia...');

async function start() {
  // 1. Prisma DB Push
  if (process.env.DATABASE_URL) {
    console.log('📦 Synchronizing Prisma schema with database...');
    try {
      execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
      console.log('✅ Database schema synchronized!');
    } catch (error) {
      console.error('⚠️ Warning: Could not push schema to database. The database might not be ready or reachable yet.');
      console.error(error.message);
    }

    // 1.5. Auto-sync AppSettings (Google Drive settings, Gemini, etc.) and Seed data
    try {
      console.log('🔄 Checking & synchronizing AppSettings and initial database configuration...');
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const fs = require('fs');
      const path = require('path');
      const jsonPath = path.join(__dirname, 'sqlite_data.json');

      if (fs.existsSync(jsonPath)) {
        const raw = fs.readFileSync(jsonPath, 'utf-8');
        const data = JSON.parse(raw);

        // Check if gdrive settings exist
        const gdriveSetting = await prisma.appSetting.findUnique({
          where: { key: 'gdrive_client_id' }
        });

        if (!gdriveSetting && data.settings && Array.isArray(data.settings)) {
          console.log('📥 Importing default AppSettings (Google Drive, etc.) from sqlite_data.json...');
          for (const s of data.settings) {
            await prisma.appSetting.upsert({
              where: { key: s.key },
              update: { value: s.value },
              create: { key: s.key, value: s.value }
            });
          }
          console.log(`✅ Synced ${data.settings.length} AppSettings successfully!`);
        }

        // Check if DB has 0 files, auto-run import
        const fileCount = await prisma.mediaFile.count();
        if (fileCount === 0 && data.files && data.files.length > 0) {
          console.log('📦 Database is empty. Running full data import to PostgreSQL...');
          execSync('node scripts/import-to-postgres.js', { stdio: 'inherit' });
        }
      }

      await prisma.$disconnect();
    } catch (err) {
      console.warn('⚠️ Notice: Auto-sync settings check skipped:', err.message);
    }
  } else {
    console.log('⚠️ Warning: DATABASE_URL is not set.');
  }

  // 2. Start Next.js
  const port = process.env.PORT || 3000;
  console.log(`🌐 Starting Next.js on port ${port}...`);
  try {
    // Use npx to ensure we use the local Next.js CLI
    execSync(`npx next start -p ${port}`, { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Next.js exited with an error:');
    console.error(error.message);
    process.exit(1);
  }
}

start();
