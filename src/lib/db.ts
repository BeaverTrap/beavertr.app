import * as schema from './schema';

// Lazy database connection - only connect when actually used
// This prevents connection errors at module load time in serverless environments
let dbInstance: any = null;

function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && databaseUrl.startsWith('libsql://')) {
    // Production: Use Turso/libSQL
    if (!process.env.TURSO_AUTH_TOKEN) {
      throw new Error('TURSO_AUTH_TOKEN is required when using Turso database');
    }
    
    // Dynamic import to avoid bundling issues
    const { createClient } = require('@libsql/client');
    const { drizzle } = require('drizzle-orm/libsql');
    
    const client = createClient({
      url: databaseUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    
    dbInstance = drizzle(client, { schema });
  } else {
    // Development: Use local SQLite file
    // Only load better-sqlite3 in development
    const Database = require('better-sqlite3');
    const { drizzle } = require('drizzle-orm/better-sqlite3');
    const sqlite = new Database('./dev.db');
    dbInstance = drizzle(sqlite, { schema });
  }

  return dbInstance;
}

// Export a getter function that lazily initializes the database
// This is safer than Proxy for drizzle methods
export function getDbInstance() {
  return getDb();
}

// For backward compatibility, export db as a getter
// But we'll use getDbInstance() internally to avoid Proxy issues
const dbProxy = new Proxy({} as any, {
  get(_target, prop) {
    const db = getDb();
    const value = db[prop];
    if (typeof value === 'function') {
      return value.bind(db);
    }
    return value;
  }
});

export { dbProxy as db };

