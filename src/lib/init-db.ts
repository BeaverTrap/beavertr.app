import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';

const sqlite = new Database('./dev.db');
const db = drizzle(sqlite, { schema });

export function initDatabase() {
  // Run migrations
  migrate(db, { migrationsFolder: './drizzle' });
}

