const { execSync } = require('child_process');

console.log('🚀 Starting CDCMedia...');

// 1. Prisma DB Push
if (process.env.DATABASE_URL) {
  console.log('📦 Synchronizing Prisma schema with database...');
  try {
    execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
    console.log('✅ Database schema synchronized!');
  } catch (error) {
    console.error('⚠️ Warning: Could not push schema to database. The database might not be ready or reachable yet.');
    console.error(error.message);
    // Don't exit here, let Next.js try to start anyway. It might recover or show a specific error.
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
