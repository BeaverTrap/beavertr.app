import { createClient } from '@libsql/client';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import * as schema from './schema';

// Lazy database connection - only connect when actually used
// This prevents connection errors at module load time in serverless environments
let dbInstance: any = null;

function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl && databaseUrl.startsWith('libsql://')) {
      // Production: Use Turso/libSQL
      if (!process.env.TURSO_AUTH_TOKEN) {
        console.error('TURSO_AUTH_TOKEN is missing!');
        throw new Error('TURSO_AUTH_TOKEN is required when using Turso database');
      }
      const client = createClient({
        url: databaseUrl,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      dbInstance = drizzleLibsql(client, { schema });
    } else {
      // Development: Use local SQLite file
      const Database = require('better-sqlite3');
      const { drizzle: drizzleSqlite } = require('drizzle-orm/better-sqlite3');
      const sqlite = new Database('./dev.db');
      dbInstance = drizzleSqlite(sqlite, { schema });
    }
  } catch (error: any) {
    console.error('Database connection error:', error);
    throw error;
  }

  return dbInstance;
}

// Create a proxy that lazily initializes the database
const dbProxy = new Proxy({} as any, {
  get(_target, prop) {
    const db = getDb();
    const value = db[prop];
    // If it's a function, bind it to the db instance
    if (typeof value === 'function') {
      return value.bind(db);
    }
    return value;
  }
});

export { dbProxy as db };

