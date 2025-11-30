// Script to migrate Turso database schema
// Run with: node scripts/migrate-turso.js

const { createClient } = require('@libsql/client');
const { drizzle } = require('drizzle-orm/libsql');
const { sql } = require('drizzle-orm');

// Get credentials from environment
const databaseUrl = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl || !authToken) {
  console.error('Error: DATABASE_URL and TURSO_AUTH_TOKEN must be set');
  console.error('Set them as environment variables:');
  console.error('  export DATABASE_URL="libsql://beavertr-app-beavertrap.aws-us-west-2.turso.io"');
  console.error('  export TURSO_AUTH_TOKEN="your-token"');
  process.exit(1);
}

if (!databaseUrl.startsWith('libsql://')) {
  console.error('Error: DATABASE_URL must start with libsql://');
  process.exit(1);
}

async function migrate() {
  console.log('Connecting to Turso database...');
  const client = createClient({
    url: databaseUrl,
    authToken: authToken,
  });

  const db = drizzle(client);

  console.log('Creating tables...');

  // Create users table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      emailVerified INTEGER,
      image TEXT,
      username TEXT UNIQUE,
      bio TEXT,
      amazonAffiliateTag TEXT,
      shippingAddress TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `);
  console.log('✓ Created users table');

  // Create accounts table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      providerAccountId TEXT NOT NULL,
      refreshToken TEXT,
      accessToken TEXT,
      expiresAt INTEGER,
      tokenType TEXT,
      scope TEXT,
      idToken TEXT,
      sessionState TEXT,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ Created accounts table');

  // Create sessions table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      sessionToken TEXT NOT NULL UNIQUE,
      userId TEXT NOT NULL,
      expires INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ Created sessions table');

  // Create verificationTokens table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS verificationTokens (
      identifier TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires INTEGER NOT NULL
    )
  `);
  console.log('✓ Created verificationTokens table');

  // Create wishlists table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS wishlists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      userId TEXT NOT NULL,
      privacy TEXT DEFAULT 'public',
      shareLink TEXT UNIQUE,
      icon TEXT,
      color TEXT,
      isDefault INTEGER DEFAULT 0,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ Created wishlists table');

  // Create wishlistItems table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS wishlistItems (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      affiliateUrl TEXT,
      image TEXT,
      price TEXT,
      description TEXT,
      priority INTEGER DEFAULT 0,
      notes TEXT,
      size TEXT,
      quantity INTEGER,
      claimedBy TEXT,
      purchasedBy TEXT,
      claimStatus TEXT DEFAULT 'none',
      isClaimed INTEGER DEFAULT 0,
      isPurchased INTEGER DEFAULT 0,
      purchaseProof TEXT,
      purchaseDate INTEGER,
      trackingNumber TEXT,
      purchaseNotes TEXT,
      purchaseAmount TEXT,
      proofVerified INTEGER DEFAULT 0,
      proofRejected INTEGER DEFAULT 0,
      proofVerifiedAt INTEGER,
      proofVerifiedBy TEXT,
      isAnonymous INTEGER DEFAULT 0,
      wishlistId TEXT NOT NULL,
      userId TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (wishlistId) REFERENCES wishlists(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ Created wishlistItems table');

  // Create friendships table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS friendships (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      friendId TEXT NOT NULL,
      relationshipType TEXT DEFAULT 'friend',
      status TEXT DEFAULT 'pending',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      UNIQUE(userId, friendId),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (friendId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ Created friendships table');

  console.log('\n✅ Database migration completed successfully!');
  console.log('All tables have been created in your Turso database.');
  console.log('\nNext steps:');
  console.log('1. Redeploy your Vercel app (or wait for auto-deploy)');
  console.log('2. Try logging in again - it should work now!');
  
  await client.close();
}

migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});

