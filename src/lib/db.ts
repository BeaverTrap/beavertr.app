import { createClient } from '@libsql/client';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from './schema';

// Check if we're using Turso (production) or local SQLite (development)
const databaseUrl = process.env.DATABASE_URL;

// Create db instance based on environment
let db: LibSQLDatabase<typeof schema> | BetterSQLite3Database<typeof schema>;

if (databaseUrl && databaseUrl.startsWith('libsql://')) {
  // Production: Use Turso/libSQL
  const client = createClient({
    url: databaseUrl,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  db = drizzleLibsql(client, { schema });
} else {
  // Development: Use local SQLite file
  // Use dynamic require to avoid bundling in production
  const Database = require('better-sqlite3');
  const sqlite = new Database('./dev.db');
  db = drizzleSqlite(sqlite, { schema });
}

export { db };

