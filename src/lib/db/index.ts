import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@ep-placeholder.region.aws.neon.tech/neondb';

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
