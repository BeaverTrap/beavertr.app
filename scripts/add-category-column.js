/**
 * Safe migration script to add category and tags columns to wishlistItems table
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

async function addCategoryColumns() {
  // Try to load .env.local
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      for (const line of lines) {
        const match = line.match(/^DATABASE_URL=(.+)$/);
        if (match) {
          process.env.DATABASE_URL = match[1].trim();
          break;
        }
      }
    }
  } catch (e) {
    // Ignore errors
  }

  let databaseUrl = process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!databaseUrl) {
    databaseUrl = './dev.db';
    console.log('ℹ️  No DATABASE_URL found, using local dev.db');
  }

  if (databaseUrl.startsWith('libsql://')) {
    if (!authToken) {
      console.error('❌ TURSO_AUTH_TOKEN environment variable is required for Turso');
      process.exit(1);
    }

    console.log('🔗 Connecting to Turso database...');
    const { createClient } = require('@libsql/client');
    const client = createClient({
      url: databaseUrl,
      authToken: authToken,
    });

    try {
      // Check if columns already exist
      try {
        await client.execute("SELECT category, tags FROM wishlistItems LIMIT 1");
        console.log('✓ category and tags columns already exist in Turso database');
        process.exit(0);
      } catch (checkError) {
        // Columns don't exist, proceed to add them
      }

      // Add the columns
      await client.execute("ALTER TABLE wishlistItems ADD COLUMN category TEXT");
      await client.execute("ALTER TABLE wishlistItems ADD COLUMN tags TEXT");
      console.log('✅ Successfully added category and tags columns to wishlistItems table (Turso)');
    } catch (error) {
      if (error.message && (error.message.includes('duplicate column') || error.message.includes('already exists'))) {
        console.log('✓ category and tags columns already exist in Turso database');
        process.exit(0);
      }
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  } else {
    const dbPath = databaseUrl.replace(/^file:/, '') || './dev.db';
    console.log(`📁 Using local database: ${dbPath}`);

    if (!fs.existsSync(dbPath)) {
      console.error(`❌ Database file not found: ${dbPath}`);
      process.exit(1);
    }

    const sqlite = new Database(dbPath);

    try {
      const tableInfo = sqlite.prepare("PRAGMA table_info(wishlistItems)").all();
      const hasCategory = tableInfo.some((col) => col.name === 'category');
      const hasTags = tableInfo.some((col) => col.name === 'tags');

      if (hasCategory && hasTags) {
        console.log('✓ category and tags columns already exist in local database');
        sqlite.close();
        process.exit(0);
      }

      if (!hasCategory) {
        sqlite.prepare("ALTER TABLE wishlistItems ADD COLUMN category TEXT").run();
        console.log('✅ Added category column');
      }
      if (!hasTags) {
        sqlite.prepare("ALTER TABLE wishlistItems ADD COLUMN tags TEXT").run();
        console.log('✅ Added tags column');
      }
      console.log('✅ Successfully added columns to wishlistItems table (local SQLite)');
      sqlite.close();
    } catch (error) {
      sqlite.close();
      if (error.message && error.message.includes('duplicate column name')) {
        console.log('✓ category and tags columns already exist in local database');
        process.exit(0);
      }
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
}

addCategoryColumns().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});







