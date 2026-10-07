import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { links } from '../src/lib/db/schema';
import { validateDestinationUrl, validateSlug } from '../src/lib/validation';

dotenv.config({ path: '.env.local' });
dotenv.config();

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://s.pmkitera.web.id';

interface LinkRecord {
  slug: string;
  destinationUrl: string;
  title?: string;
  isOfficial?: boolean;
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.log(`
Penggunaan CLI Import Link:
  npx tsx scripts/import-links.ts <path-to-file.json | path-to-file.csv>

Contoh format JSON:
[
  { "slug": "contoh", "destinationUrl": "https://pmkitera.web.id", "title": "PMK ITERA" }
]

Contoh format CSV (dengan header):
slug,destinationUrl,title
contoh,https://pmkitera.web.id,PMK ITERA
`);
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL tidak disetel.');
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ File tidak ditemukan: ${absolutePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(absolutePath, 'utf8');
  let records: LinkRecord[] = [];

  if (filePath.endsWith('.json')) {
    records = JSON.parse(content);
  } else if (filePath.endsWith('.csv')) {
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    const header = lines[0].split(',').map((h) => h.trim());
    const slugIdx = header.indexOf('slug');
    const destIdx = header.findIndex((h) => h === 'destinationUrl' || h === 'destination_url' || h === 'url');
    const titleIdx = header.indexOf('title');

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      if (cols[slugIdx] && cols[destIdx]) {
        records.push({
          slug: cols[slugIdx],
          destinationUrl: cols[destIdx],
          title: titleIdx !== -1 ? cols[titleIdx] : undefined,
          isOfficial: true,
        });
      }
    }
  }

  console.log(`📦 Memproses ${records.length} data tautan...`);

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  let successCount = 0;
  let skippedCount = 0;

  for (const record of records) {
    const slugValidation = validateSlug(record.slug, true);
    if (!slugValidation.valid) {
      console.warn(`⚠️  Lewati "${record.slug}": ${slugValidation.error}`);
      skippedCount++;
      continue;
    }

    const urlValidation = validateDestinationUrl(record.destinationUrl, BASE_URL);
    if (!urlValidation.valid) {
      console.warn(`⚠️  Lewati URL "${record.destinationUrl}": ${urlValidation.error}`);
      skippedCount++;
      continue;
    }

    try {
      await db.insert(links).values({
        slug: slugValidation.slug!,
        destinationUrl: urlValidation.url!,
        title: record.title || null,
        isOfficial: record.isOfficial ?? true,
        status: 'active',
      });
      successCount++;
      console.log(`✅ Berhasil import: /${slugValidation.slug}`);
    } catch (err: unknown) {
      const dbErr = err as { code?: string };
      if (dbErr.code === '23505') {
        console.warn(`⚠️  Slug sudah ada: /${slugValidation.slug}`);
      } else {
        console.error(`❌ Gagal simpan /${slugValidation.slug}:`, err);
      }
      skippedCount++;
    }
  }

  console.log(`\n🎉 Selesai! Berhasil: ${successCount}, Dilewati: ${skippedCount}`);
}

main().catch(console.error);
