import { defineConfig } from 'drizzle-kit';

// Note: drizzle-kit config is primarily for local development
// For Turso migrations, use: DATABASE_URL and TURSO_AUTH_TOKEN env vars with drizzle-kit push
export default defineConfig({
  schema: './src/lib/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './dev.db',
  },
});

