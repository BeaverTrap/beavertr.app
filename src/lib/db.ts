import * as schema from './schema';

// Lazy database connection - only connect when actually used
// This prevents connection errors at module load time in serverless environments
let dbInstance: any = null;

function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  // On Vercel, we MUST use Turso/libSQL - never allow better-sqlite3
  if (process.env.VERCEL || process.env.NEXT_PHASE === 'phase-production-build') {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl || !databaseUrl.startsWith('libsql://')) {
      throw new Error('On Vercel, DATABASE_URL must be set to a Turso (libsql://) database URL. SQLite file database is not supported.');
    }
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
    // This branch should NEVER execute on Vercel (checked above)
    // Use dynamic require with Function constructor to prevent static analysis
    try {
      // Use Function constructor to create a truly dynamic require that webpack/turbopack can't analyze
      const requireBetterSqlite3 = new Function('moduleName', 'return require(moduleName)');
      const Database = requireBetterSqlite3('better-sqlite3');
      const drizzleModule = requireBetterSqlite3('drizzle-orm/better-sqlite3');
      const { drizzle } = drizzleModule;
      const sqlite = new Database('./dev.db');
      dbInstance = drizzle(sqlite, { schema });
    } catch (error: any) {
      if (error.code === 'MODULE_NOT_FOUND' || error.message?.includes('better-sqlite3')) {
        throw new Error('better-sqlite3 is not installed. Install it for local development: npm install better-sqlite3');
      }
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
