import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL tidak ditemukan di environment variable.');
    process.exit(1);
  }

  console.log('🚀 Menjalankan migrasi database ke Neon Postgres...');
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('✅ Migrasi database berhasil diterapkan!');
}

runMigration().catch((err) => {
  console.error('❌ Gagal menjalankan migrasi:', err);
  process.exit(1);
});
