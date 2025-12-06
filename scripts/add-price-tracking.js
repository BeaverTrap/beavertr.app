const { drizzle } = require('drizzle-orm/d1');
const { sql } = require('drizzle-orm');

// This script adds price tracking columns and table
// Run with: node scripts/add-price-tracking.js

async function addPriceTracking() {
  try {
    const { getDbInstance } = await import('../src/lib/db.ts');
    const db = await getDbInstance();

    console.log('Adding priceHistory column to wishlistItems...');
    await db.run(sql`
      ALTER TABLE wishlistItems 
      ADD COLUMN priceHistory TEXT
    `);
    console.log('✅ Added priceHistory column');

    console.log('Creating priceAlerts table...');
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS priceAlerts (
        id TEXT PRIMARY KEY,
        itemId TEXT NOT NULL,
        userId TEXT NOT NULL,
        targetPrice TEXT,
        percentDrop INTEGER,
        isActive INTEGER DEFAULT 1,
        lastNotifiedAt INTEGER,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        FOREIGN KEY (itemId) REFERENCES wishlistItems(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Created priceAlerts table');

    console.log('✅ Price tracking migration complete!');
  } catch (error) {
    if (error.message?.includes('duplicate column')) {
      console.log('⚠️  priceHistory column already exists, skipping...');
    } else if (error.message?.includes('already exists')) {
      console.log('⚠️  priceAlerts table already exists, skipping...');
    } else {
      console.error('❌ Error:', error);
      throw error;
    }
  }
}

addPriceTracking();




