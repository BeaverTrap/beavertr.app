import { createClient } from '@libsql/client';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import * as schema from './schema';

// Check if we're using Turso (production) or local SQLite (development)
const databaseUrl = process.env.DATABASE_URL;

// Create db instance based on environment
// Use dynamic import for better-sqlite3 to avoid loading it in production
let db: any;

try {
  if (databaseUrl && databaseUrl.startsWith('libsql://')) {
    // Production: Use Turso/libSQL
    if (!process.env.TURSO_AUTH_TOKEN) {
      throw new Error('TURSO_AUTH_TOKEN is required when using Turso database');
    }
    const client = createClient({
      url: databaseUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    db = drizzleLibsql(client, { schema });
  } else {
    // Development: Use local SQLite file (lazy load to avoid issues in production)
    const Database = require('better-sqlite3');
    const { drizzle: drizzleSqlite } = require('drizzle-orm/better-sqlite3');
    const sqlite = new Database('./dev.db');
    db = drizzleSqlite(sqlite, { schema });
  }
} catch (error: any) {
  console.error('Database initialization error:', error);
  // Don't throw - let it fail at runtime so we can see the error
  throw error;
}

export { db };

