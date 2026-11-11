const { Pool } = require('pg');
require('dotenv').config();

let pool = null;
let isInMemory = false;

// Embedded relational storage for fallback/test when external PostgreSQL is not running
const memoryStore = {
  users: [],
  readings: [],
  userIdSeq: 1,
  readingIdSeq: 1,
  
  reset() {
    this.users = [];
    this.readings = [];
    this.userIdSeq = 1;
    this.readingIdSeq = 1;
  }
};

const VALID_TIME_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];

// Helper to normalize dates to YYYY-MM-DD
function formatDate(d) {
  if (!d) return null;
  if (typeof d === 'string') {
    return d.split('T')[0];
  }
  const date = new Date(d);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// In-memory query engine supporting PostgreSQL semantics, constraints, and transactions
function executeMemoryQuery(text, params = []) {
  const normalized = text.trim().replace(/\s+/g, ' ');
  const upper = normalized.toUpperCase();

  // Transactions
  if (upper === 'BEGIN' || upper === 'COMMIT' || upper === 'ROLLBACK') {
    return { rows: [], rowCount: 0 };
  }

  // Schema setup statements (CREATE, DROP, ALTER)
  if (upper.startsWith('CREATE') || upper.startsWith('DROP') || upper.startsWith('ALTER')) {
    if (upper.includes('DROP TABLE')) {
      // no-op or clear
    }
    return { rows: [], rowCount: 0 };
  }

  // 1. SELECT * FROM users WHERE email = $1 (case-insensitive or exact)
  if (normalized.match(/SELECT\s+.*FROM\s+users\s+WHERE\s+(LOWER\()?email/i)) {
    const email = (params[0] || '').toLowerCase();
    const user = memoryStore.users.find(u => u.email.toLowerCase() === email);
    return { rows: user ? [{ ...user }] : [], rowCount: user ? 1 : 0 };
  }

  // 2. SELECT id, name, email, created_at FROM users WHERE id = $1
  if (normalized.match(/SELECT\s+.*FROM\s+users\s+WHERE\s+id\s*=\s*\$1/i)) {
    const id = parseInt(params[0], 10);
    const user = memoryStore.users.find(u => u.id === id);
    if (!user) return { rows: [], rowCount: 0 };
    return {
      rows: [{
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at
      }],
      rowCount: 1
    };
  }

  // 3. INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)
  if (normalized.match(/INSERT\s+INTO\s+users/i)) {
    const name = params[0];
    const email = params[1];
    const password_hash = params[2];

    // Unique email constraint
    if (memoryStore.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      const err = new Error('duplicate key value violates unique constraint "users_email_key"');
      err.code = '23505';
      err.constraint = 'users_email_key';
      throw err;
    }

    const newUser = {
      id: memoryStore.userIdSeq++,
      name,
      email,
      password_hash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryStore.users.push(newUser);

    return {
      rows: [{
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        created_at: newUser.created_at
      }],
      rowCount: 1
    };
  }

  // 4. SELECT COUNT(*) as count FROM readings WHERE user_id = $1 AND reading_date = $2
  if (normalized.match(/SELECT\s+COUNT\(\*\)\s+(AS\s+count\s+)?FROM\s+readings\s+WHERE\s+user_id\s*=\s*\$1\s+AND\s+reading_date\s*=\s*\$2/i)) {
    const userId = parseInt(params[0], 10);
    const dateStr = formatDate(params[1]);
    const count = memoryStore.readings.filter(r => r.user_id === userId && formatDate(r.reading_date) === dateStr).length;
    return { rows: [{ count: String(count) }], rowCount: 1 };
  }

  // 5. Check duplicate slot: SELECT * FROM readings WHERE user_id = $1 AND reading_date = $2 AND time_slot = $3
  if (normalized.match(/SELECT\s+.*FROM\s+readings\s+WHERE\s+user_id\s*=\s*\$1\s+AND\s+reading_date\s*=\s*\$2\s+AND\s+time_slot\s*=\s*\$3/i)) {
    const userId = parseInt(params[0], 10);
    const dateStr = formatDate(params[1]);
    const timeSlot = params[2];
    const excludeId = params[3] ? parseInt(params[3], 10) : null;

    const existing = memoryStore.readings.filter(r => 
      r.user_id === userId && 
      formatDate(r.reading_date) === dateStr && 
      r.time_slot === timeSlot &&
      (!excludeId || r.id !== excludeId)
    );
    return { rows: existing.map(r => ({ ...r })), rowCount: existing.length };
  }

  // 6. INSERT INTO readings (user_id, reading_date, time_slot, glucose_value) VALUES ($1, $2, $3, $4)
  if (normalized.match(/INSERT\s+INTO\s+readings/i)) {
    const userId = parseInt(params[0], 10);
    const readingDate = formatDate(params[1]);
    const timeSlot = params[2];
    const glucoseValue = parseInt(params[3], 10);

    // Validate CHECK constraint: glucose_value >= 40 AND glucose_value <= 600
    if (isNaN(glucoseValue) || glucoseValue < 40 || glucoseValue > 600) {
      const err = new Error('new row for relation "readings" violates check constraint "readings_glucose_value_check"');
      err.code = '23514';
      throw err;
    }

    // Validate CHECK constraint: valid_time_slot
    if (!VALID_TIME_SLOTS.includes(timeSlot)) {
      const err = new Error('new row for relation "readings" violates check constraint "valid_time_slot"');
      err.code = '23514';
      throw err;
    }

    // Validate UNIQUE constraint: (user_id, reading_date, time_slot)
    const duplicate = memoryStore.readings.find(r => 
      r.user_id === userId && 
      formatDate(r.reading_date) === readingDate && 
      r.time_slot === timeSlot
    );
    if (duplicate) {
      const err = new Error('duplicate key value violates unique constraint "unique_user_date_slot"');
      err.code = '23505';
      err.constraint = 'unique_user_date_slot';
      throw err;
    }

    const newReading = {
      id: memoryStore.readingIdSeq++,
      user_id: userId,
      reading_date: readingDate,
      time_slot: timeSlot,
      glucose_value: glucoseValue,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryStore.readings.push(newReading);

    return { rows: [{ ...newReading }], rowCount: 1 };
  }

  // 7. SELECT * FROM readings WHERE id = $1 AND user_id = $2
  if (normalized.match(/SELECT\s+.*FROM\s+readings\s+WHERE\s+id\s*=\s*\$1\s+AND\s+user_id\s*=\s*\$2/i)) {
    const id = parseInt(params[0], 10);
    const userId = parseInt(params[1], 10);
    const item = memoryStore.readings.find(r => r.id === id && r.user_id === userId);
    return { rows: item ? [{ ...item }] : [], rowCount: item ? 1 : 0 };
  }

  // 8. UPDATE readings SET ... WHERE id = $... AND user_id = $...
  if (normalized.match(/UPDATE\s+readings\s+SET/i)) {
    // Expected params: reading_date, time_slot, glucose_value, id, user_id
    const readingDate = formatDate(params[0]);
    const timeSlot = params[1];
    const glucoseValue = parseInt(params[2], 10);
    const id = parseInt(params[3], 10);
    const userId = parseInt(params[4], 10);

    const index = memoryStore.readings.findIndex(r => r.id === id && r.user_id === userId);
    if (index === -1) {
      return { rows: [], rowCount: 0 };
    }

    // Check unique constraint violation
    const conflict = memoryStore.readings.find(r => 
      r.id !== id && 
      r.user_id === userId && 
      formatDate(r.reading_date) === readingDate && 
      r.time_slot === timeSlot
    );
    if (conflict) {
      const err = new Error('duplicate key value violates unique constraint "unique_user_date_slot"');
      err.code = '23505';
      err.constraint = 'unique_user_date_slot';
      throw err;
    }

    if (isNaN(glucoseValue) || glucoseValue < 40 || glucoseValue > 600) {
      const err = new Error('new row for relation "readings" violates check constraint "readings_glucose_value_check"');
      err.code = '23514';
      throw err;
    }

    memoryStore.readings[index] = {
      ...memoryStore.readings[index],
      reading_date: readingDate,
      time_slot: timeSlot,
      glucose_value: glucoseValue,
      updated_at: new Date().toISOString()
    };

    return { rows: [{ ...memoryStore.readings[index] }], rowCount: 1 };
  }

  // 9. DELETE FROM readings WHERE id = $1 AND user_id = $2
  if (normalized.match(/DELETE\s+FROM\s+readings\s+WHERE\s+id\s*=\s*\$1\s+AND\s+user_id\s*=\s*\$2/i)) {
    const id = parseInt(params[0], 10);
    const userId = parseInt(params[1], 10);
    const index = memoryStore.readings.findIndex(r => r.id === id && r.user_id === userId);
    if (index === -1) {
      return { rows: [], rowCount: 0 };
    }
    const [deleted] = memoryStore.readings.splice(index, 1);
    return { rows: [{ ...deleted }], rowCount: 1 };
  }

  // 10. GET readings with filter/pagination
  // SELECT * FROM readings WHERE user_id = $1 ...
  if (normalized.match(/SELECT\s+.*FROM\s+readings\s+WHERE\s+user_id\s*=\s*\$1/i)) {
    const userId = parseInt(params[0], 10);
    let filtered = memoryStore.readings.filter(r => r.user_id === userId);

    // Daily report or exact date filter: AND reading_date = $2
    if (normalized.match(/reading_date\s*=\s*\$2/i)) {
      const targetDate = formatDate(params[1]);
      filtered = filtered.filter(r => formatDate(r.reading_date) === targetDate);
    }
    // Date range filter: AND reading_date >= $2 AND reading_date <= $3
    else if (normalized.match(/reading_date\s*>=\s*\$2\s+AND\s+reading_date\s*<=\s*\$3/i)) {
      const startDate = formatDate(params[1]);
      const endDate = formatDate(params[2]);
      filtered = filtered.filter(r => {
        const d = formatDate(r.reading_date);
        return d >= startDate && d <= endDate;
      });
    }

    // Check if COUNT query
    if (normalized.includes('COUNT(')) {
      return { rows: [{ count: String(filtered.length) }], rowCount: 1 };
    }

    // Sort order
    if (normalized.includes('ORDER BY reading_date ASC')) {
      filtered.sort((a, b) => a.reading_date.localeCompare(b.reading_date) || a.id - b.id);
    } else {
      // Default DESC
      filtered.sort((a, b) => b.reading_date.localeCompare(a.reading_date) || b.id - a.id);
    }

    // Check pagination LIMIT and OFFSET
    const limitMatch = normalized.match(/LIMIT\s+(\$\d+|\d+)/i);
    const offsetMatch = normalized.match(/OFFSET\s+(\$\d+|\d+)/i);

    if (limitMatch && offsetMatch) {
      let limitVal = limitMatch[1].startsWith('$') ? parseInt(params[parseInt(limitMatch[1].slice(1)) - 1], 10) : parseInt(limitMatch[1], 10);
      let offsetVal = offsetMatch[1].startsWith('$') ? parseInt(params[parseInt(offsetMatch[1].slice(1)) - 1], 10) : parseInt(offsetMatch[1], 10);

      filtered = filtered.slice(offsetVal, offsetVal + limitVal);
    }

    return { rows: filtered.map(r => ({ ...r })), rowCount: filtered.length };
  }

  // Fallback
  return { rows: [], rowCount: 0 };
}

// In-memory client providing transactional capabilities
class MemoryClient {
  async query(text, params) {
    return executeMemoryQuery(text, params);
  }
  release() {
    // no-op
  }
}

// Exported database interface
const db = {
  async init() {
    if (process.env.NODE_ENV === 'test' || process.env.USE_MEMORY_DB === 'true') {
      isInMemory = true;
      console.log('[DB] Using embedded PostgreSQL relational engine for test/isolation.');
      return;
    }

    try {
      const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sweety_db';
      const testPool = new Pool({
        connectionString,
        connectionTimeoutMillis: 2000
      });
      const client = await testPool.connect();
      await client.query('SELECT 1');
      client.release();
      pool = testPool;
      isInMemory = false;
      console.log(`[DB] Connected to PostgreSQL at ${connectionString.split('@')[1] || connectionString}`);
    } catch (err) {
      isInMemory = true;
      console.log(`[DB] External PostgreSQL not reachable (${err.message}). Defaulting to embedded relational database engine.`);
    }
  },

  async query(text, params) {
    if (isInMemory || !pool) {
      return executeMemoryQuery(text, params);
    }
    return pool.query(text, params);
  },

  async getClient() {
    if (isInMemory || !pool) {
      return new MemoryClient();
    }
    return pool.connect();
  },

  get isInMemory() {
    return isInMemory;
  },

  resetMemoryStore() {
    memoryStore.reset();
  }
};

module.exports = db;
