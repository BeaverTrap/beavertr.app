// Quick script to check if itemType column exists
const Database = require('better-sqlite3');
const sqlite = new Database('./dev.db');

try {
  const tableInfo = sqlite.prepare("PRAGMA table_info(wishlistItems)").all();
  console.log('Columns in wishlistItems:');
  tableInfo.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`);
  });
  
  const hasItemType = tableInfo.some((col) => col.name === 'itemType');
  console.log('\nitemType column exists:', hasItemType);
  
  if (!hasItemType) {
    console.log('\nAdding itemType column...');
    sqlite.prepare("ALTER TABLE wishlistItems ADD COLUMN itemType TEXT").run();
    console.log('✅ Added itemType column!');
  }
} catch (error) {
  console.error('Error:', error.message);
} finally {
  sqlite.close();
}




