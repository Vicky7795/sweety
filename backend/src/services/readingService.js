const db = require('../config/db');
const { formatDateString } = require('../utils/dateUtils');

function getArticle(word) {
  return /^[aeiou]/i.test(word) ? 'an' : 'a';
}

async function createReading(userId, { reading_date, time_slot, glucose_value }) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // RULE 4: Maximum 4 readings per day
    const countResult = await client.query(
      'SELECT COUNT(*) as count FROM readings WHERE user_id = $1 AND reading_date = $2',
      [userId, reading_date]
    );
    const currentCount = parseInt(countResult.rows[0].count, 10);
    if (currentCount >= 4) {
      await client.query('ROLLBACK');
      const error = new Error('You can add only 4 readings per day.');
      error.statusCode = 400;
      throw error;
    }

    // RULE 3: Only one reading per slot per day
    const slotCheck = await client.query(
      'SELECT id FROM readings WHERE user_id = $1 AND reading_date = $2 AND time_slot = $3',
      [userId, reading_date, time_slot]
    );
    if (slotCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      const article = getArticle(time_slot);
      const error = new Error(`You already have ${article} ${time_slot} reading for this date.`);
      error.statusCode = 400;
      throw error;
    }

    // Insert reading
    const insertResult = await client.query(
      'INSERT INTO readings (user_id, reading_date, time_slot, glucose_value) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, reading_date, time_slot, glucose_value]
    );

    await client.query('COMMIT');
    const reading = insertResult.rows[0];
    reading.reading_date = formatDateString(reading.reading_date);
    return reading;
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      const article = getArticle(time_slot);
      const error = new Error(`You already have ${article} ${time_slot} reading for this date.`);
      error.statusCode = 400;
      throw error;
    }
    throw err;
  } finally {
    client.release();
  }
}

async function getReadings(userId, { page = 1, limit = 20, date = null }) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  let countSql = 'SELECT COUNT(*) as count FROM readings WHERE user_id = $1';
  let countParams = [userId];

  let fetchSql = 'SELECT * FROM readings WHERE user_id = $1';
  let fetchParams = [userId];

  if (date) {
    const formattedDate = formatDateString(date);
    countSql += ' AND reading_date = $2';
    countParams.push(formattedDate);

    fetchSql += ' AND reading_date = $2 ORDER BY id ASC LIMIT $3 OFFSET $4';
    fetchParams.push(formattedDate, limitNum, offset);
  } else {
    fetchSql += ' ORDER BY reading_date DESC, id DESC LIMIT $2 OFFSET $3';
    fetchParams.push(limitNum, offset);
  }

  const countResult = await db.query(countSql, countParams);
  const totalRecords = parseInt(countResult.rows[0].count, 10);
  const totalPages = Math.ceil(totalRecords / limitNum) || 1;

  const fetchResult = await db.query(fetchSql, fetchParams);
  const readings = fetchResult.rows.map(r => ({
    ...r,
    reading_date: formatDateString(r.reading_date)
  }));

  return {
    readings,
    pagination: {
      currentPage: pageNum,
      limit: limitNum,
      totalRecords,
      totalPages
    }
  };
}

async function getReadingById(userId, readingId) {
  const result = await db.query(
    'SELECT * FROM readings WHERE id = $1 AND user_id = $2',
    [readingId, userId]
  );
  if (result.rows.length === 0) {
    const error = new Error('Reading not found.');
    error.statusCode = 404;
    throw error;
  }
  const reading = result.rows[0];
  reading.reading_date = formatDateString(reading.reading_date);
  return reading;
}

async function updateReading(userId, readingId, { reading_date, time_slot, glucose_value }) {
  const existing = await db.query(
    'SELECT * FROM readings WHERE id = $1 AND user_id = $2',
    [readingId, userId]
  );
  if (existing.rows.length === 0) {
    const error = new Error('Reading not found.');
    error.statusCode = 404;
    throw error;
  }

  const currentReading = existing.rows[0];
  const oldDate = formatDateString(currentReading.reading_date);

  // If changing date, verify target date doesn't already have 4 readings
  if (oldDate !== reading_date) {
    const countResult = await db.query(
      'SELECT COUNT(*) as count FROM readings WHERE user_id = $1 AND reading_date = $2',
      [userId, reading_date]
    );
    if (parseInt(countResult.rows[0].count, 10) >= 4) {
      const error = new Error('You can add only 4 readings per day.');
      error.statusCode = 400;
      throw error;
    }
  }

  // Verify unique slot constraint
  const slotConflict = await db.query(
    'SELECT id FROM readings WHERE user_id = $1 AND reading_date = $2 AND time_slot = $3 AND id != $4',
    [userId, reading_date, time_slot, readingId]
  );
  if (slotConflict.rows.length > 0) {
    const article = getArticle(time_slot);
    const error = new Error(`You already have ${article} ${time_slot} reading for this date.`);
    error.statusCode = 400;
    throw error;
  }

  const updateResult = await db.query(
    'UPDATE readings SET reading_date = $1, time_slot = $2, glucose_value = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 AND user_id = $5 RETURNING *',
    [reading_date, time_slot, glucose_value, readingId, userId]
  );

  const updated = updateResult.rows[0];
  updated.reading_date = formatDateString(updated.reading_date);
  return updated;
}

async function deleteReading(userId, readingId) {
  const result = await db.query(
    'DELETE FROM readings WHERE id = $1 AND user_id = $2 RETURNING *',
    [readingId, userId]
  );
  if (result.rows.length === 0) {
    const error = new Error('Reading not found.');
    error.statusCode = 404;
    throw error;
  }
  const deleted = result.rows[0];
  deleted.reading_date = formatDateString(deleted.reading_date);
  return deleted;
}

module.exports = {
  createReading,
  getReadings,
  getReadingById,
  updateReading,
  deleteReading
};
