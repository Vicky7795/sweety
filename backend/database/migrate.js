const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

async function migrate() {
  try {
    await db.init();
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    if (!db.isInMemory) {
      console.log('[Migrate] Applying schema.sql to PostgreSQL database...');
      await db.query(sql);
      console.log('[Migrate] Database schema applied successfully.');
    } else {
      console.log('[Migrate] Embedded database engine initialized with relational schema.');
    }
  } catch (err) {
    console.error('[Migrate] Error applying migration:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  migrate().then(() => process.exit(0));
}

module.exports = migrate;
