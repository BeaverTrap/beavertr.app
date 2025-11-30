import * as schema from './schema';

export function initDatabase() {
  // Run migrations - use the appropriate migrator based on environment
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl && databaseUrl.startsWith('libsql://')) {
    // Production: Use Turso/libSQL
    const { createClient } = require('@libsql/client');
    const { drizzle } = require('drizzle-orm/libsql');
    const { migrate } = require('drizzle-orm/libsql/migrator');
    
    const client = createClient({
      url: databaseUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const db = drizzle(client, { schema });
    migrate(db, { migrationsFolder: './drizzle' });
  } else {
    // Development: Use local SQLite file
    // Only load better-sqlite3 in development
    const Database = require('better-sqlite3');
    const { drizzle } = require('drizzle-orm/better-sqlite3');
    const { migrate } = require('drizzle-orm/better-sqlite3/migrator');
    
    const sqlite = new Database('./dev.db');
    const db = drizzle(sqlite, { schema });
    migrate(db, { migrationsFolder: './drizzle' });
  }
}

