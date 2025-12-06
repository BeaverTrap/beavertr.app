import * as schema from './schema';

// Lazy database connection - only connect when actually used
// This prevents connection errors at module load time in serverless environments
let dbInstance: any = null;

function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  if (databaseUrl.startsWith('libsql://')) {
    // Production: Use Turso/libSQL
    if (!process.env.TURSO_AUTH_TOKEN) {
      throw new Error('TURSO_AUTH_TOKEN is required when using Turso database');
    }
    
    try {
      // Use require for synchronous loading (needed for drizzle)
      const { createClient } = require('@libsql/client');
      const { drizzle } = require('drizzle-orm/libsql');
      
      const client = createClient({
        url: databaseUrl,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      
      dbInstance = drizzle(client, { schema });
    } catch (error: any) {
      throw new Error(`Failed to initialize Turso database: ${error.message}`);
    }
  } else {
    // Development: Use local SQLite file
    // Only load better-sqlite3 in development (not on Vercel or during build)
    if (process.env.VERCEL || process.env.NEXT_PHASE === 'phase-production-build') {
      throw new Error('SQLite file database not supported on Vercel. Please use Turso (libsql://) database URL.');
    }
    
    // Check if better-sqlite3 is available before requiring it
    // This prevents build failures if the module is not installed
    try {
      // Use a function to require it only when needed
      const loadBetterSqlite3 = () => {
        try {
          return require('better-sqlite3');
        } catch (e: any) {
          if (e.code === 'MODULE_NOT_FOUND') {
            throw new Error('better-sqlite3 is not installed. Install it for local development: npm install better-sqlite3');
          }
          throw e;
        }
      };
      
      const Database = loadBetterSqlite3();
      const { drizzle } = require('drizzle-orm/better-sqlite3');
      const sqlite = new Database('./dev.db');
      dbInstance = drizzle(sqlite, { schema });
    } catch (error: any) {
      throw new Error(`Failed to load better-sqlite3. This is only available in development. Error: ${error.message}`);
    }
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
