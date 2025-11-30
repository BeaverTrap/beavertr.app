import { defineConfig } from 'drizzle-kit';

// Note: drizzle-kit config is primarily for local development
// For Turso migrations, use the migrate-turso.js script
export default defineConfig({
  schema: './src/lib/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './dev.db',
  },
});

