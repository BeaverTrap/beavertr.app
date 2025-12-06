const { drizzle } = require('drizzle-orm/d1');
const { sql } = require('drizzle-orm');

// This script adds comments and reactions tables
// Run with: node scripts/add-comments-reactions.js

async function addCommentsReactions() {
  try {
    const { getDbInstance } = await import('../src/lib/db.ts');
    const db = await getDbInstance();

    console.log('Creating comments table...');
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        itemId TEXT NOT NULL,
        userId TEXT NOT NULL,
        content TEXT NOT NULL,
        parentId TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        FOREIGN KEY (itemId) REFERENCES wishlistItems(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Created comments table');

    console.log('Creating reactions table...');
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS reactions (
        id TEXT PRIMARY KEY,
        itemId TEXT NOT NULL,
        userId TEXT NOT NULL,
        type TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        UNIQUE(userId, itemId, type),
        FOREIGN KEY (itemId) REFERENCES wishlistItems(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Created reactions table');

    console.log('✅ Comments and reactions migration complete!');
  } catch (error) {
    if (error.message?.includes('already exists')) {
      console.log('⚠️  Tables already exist, skipping...');
    } else {
      console.error('❌ Error:', error);
      throw error;
    }
  }
}

addCommentsReactions();





