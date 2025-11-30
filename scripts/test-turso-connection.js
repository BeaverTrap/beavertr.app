// Test script to verify Turso database connection
const { createClient } = require('@libsql/client');

const databaseUrl = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl || !authToken) {
  console.error('Error: DATABASE_URL and TURSO_AUTH_TOKEN must be set');
  process.exit(1);
}

async function testConnection() {
  console.log('Testing Turso database connection...');
  console.log('Database URL:', databaseUrl);
  
  try {
    const client = createClient({
      url: databaseUrl,
      authToken: authToken,
    });

    // Test 1: Check if we can connect
    console.log('\n1. Testing connection...');
    const result = await client.execute('SELECT 1 as test');
    console.log('✓ Connection successful!');
    console.log('Result:', result);

    // Test 2: Check if tables exist
    console.log('\n2. Checking if tables exist...');
    const tablesResult = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `);
    
    const tables = tablesResult.rows.map(row => row.name);
    console.log('Found tables:', tables);
    
    const requiredTables = ['users', 'accounts', 'sessions', 'verificationTokens', 'wishlists', 'wishlistItems', 'friendships'];
    const missingTables = requiredTables.filter(table => !tables.includes(table));
    
    if (missingTables.length > 0) {
      console.error('\n❌ Missing tables:', missingTables);
      console.error('Run the migration script first!');
      process.exit(1);
    } else {
      console.log('✓ All required tables exist!');
    }

    // Test 3: Try a simple query on users table
    console.log('\n3. Testing query on users table...');
    const usersResult = await client.execute('SELECT COUNT(*) as count FROM users');
    console.log('✓ Query successful!');
    console.log('User count:', usersResult.rows[0].count);

    console.log('\n✅ All tests passed! Database is ready.');
    await client.close();
    
  } catch (error) {
    console.error('\n❌ Connection test failed:');
    console.error('Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testConnection();


