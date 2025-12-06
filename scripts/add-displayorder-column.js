/**
 * Safe migration script to add displayOrder column to wishlistItems table
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

async function addDisplayOrderColumn() {
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
      // Check if column already exists
      try {
        await client.execute("SELECT displayOrder FROM wishlistItems LIMIT 1");
        console.log('✓ displayOrder column already exists in Turso database');
        process.exit(0);
      } catch (checkError) {
        // Column doesn't exist, proceed to add it
      }

      // Add the column
      await client.execute("ALTER TABLE wishlistItems ADD COLUMN displayOrder INTEGER DEFAULT 0");
      
      // Initialize displayOrder based on createdAt
      await client.execute(`
        UPDATE wishlistItems 
        SET displayOrder = (
          SELECT COUNT(*) 
          FROM wishlistItems w2 
          WHERE w2.wishlistId = wishlistItems.wishlistId 
          AND (w2.createdAt < wishlistItems.createdAt OR (w2.createdAt = wishlistItems.createdAt AND w2.id < wishlistItems.id))
        )
      `);
      
      console.log('✅ Successfully added displayOrder column to wishlistItems table (Turso)');
    } catch (error) {
      if (error.message && (error.message.includes('duplicate column') || error.message.includes('already exists'))) {
        console.log('✓ displayOrder column already exists in Turso database');
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
      const hasDisplayOrder = tableInfo.some((col) => col.name === 'displayOrder');

      if (hasDisplayOrder) {
        console.log('✓ displayOrder column already exists in local database');
        sqlite.close();
        process.exit(0);
      }

      sqlite.prepare("ALTER TABLE wishlistItems ADD COLUMN displayOrder INTEGER DEFAULT 0").run();
      
      // Initialize displayOrder based on createdAt
      sqlite.prepare(`
        UPDATE wishlistItems 
        SET displayOrder = (
          SELECT COUNT(*) 
          FROM wishlistItems w2 
          WHERE w2.wishlistId = wishlistItems.wishlistId 
          AND (w2.createdAt < wishlistItems.createdAt OR (w2.createdAt = wishlistItems.createdAt AND w2.id < wishlistItems.id))
        )
      `).run();
      
      console.log('✅ Successfully added displayOrder column to wishlistItems table (local SQLite)');
      sqlite.close();
    } catch (error) {
      sqlite.close();
      if (error.message && error.message.includes('duplicate column name')) {
        console.log('✓ displayOrder column already exists in local database');
        process.exit(0);
      }
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
}

addDisplayOrderColumn().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});






