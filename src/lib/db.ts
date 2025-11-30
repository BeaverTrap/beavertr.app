import { createClient } from '@libsql/client';
import Database from 'better-sqlite3';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

// Check if we're using Turso (production) or local SQLite (development)
const databaseUrl = process.env.DATABASE_URL;

// Create db instance based on environment
// Cast to BetterSQLite3Database type since both have compatible APIs
const db = (databaseUrl && databaseUrl.startsWith('libsql://')
  ? (() => {
      // Production: Use Turso/libSQL
      const client = createClient({
        url: databaseUrl,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      return drizzleLibsql(client, { schema });
    })()
  : (() => {
      // Development: Use local SQLite file
      const sqlite = new Database('./dev.db');
      return drizzleSqlite(sqlite, { schema });
    })()) as BetterSQLite3Database<typeof schema>;

export { db };

