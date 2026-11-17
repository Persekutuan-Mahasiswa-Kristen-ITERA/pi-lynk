import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@ep-placeholder.region.aws.neon.tech/neondb';

// Local development only: a plain Postgres behind local-neon-http-proxy (README > lokal).
// Never active in production builds.
if (process.env.NEON_LOCAL_PROXY && process.env.NODE_ENV !== 'production') {
  neonConfig.fetchEndpoint = process.env.NEON_LOCAL_PROXY;
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
