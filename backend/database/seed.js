const bcrypt = require('bcryptjs');
const db = require('../src/config/db');

function toDateString(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function seed() {
  try {
    await db.init();
    console.log('[Seed] Seeding database...');

    // 1. Create or find demo user
    const demoEmail = 'demo@sweety.app';
    const demoName = 'Sweety Demo';
    const demoPassword = 'Sweety@123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(demoPassword, salt);

    let userResult = await db.query('SELECT * FROM users WHERE email = $1', [demoEmail]);
    let userId;

    if (userResult.rows.length === 0) {
      const insertUser = await db.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
        [demoName, demoEmail, passwordHash]
      );
      userId = insertUser.rows[0].id;
      console.log(`[Seed] Created demo user: ${demoEmail} (ID: ${userId})`);
    } else {
      userId = userResult.rows[0].id;
      console.log(`[Seed] Demo user already exists (ID: ${userId})`);
    }

    // 2. Generate sample readings
    const now = new Date();
    const today = toDateString(now);

    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(now.getDate() - 1);
    const yesterday = toDateString(yesterdayDate);

    const fiveDaysAgoDate = new Date(now);
    fiveDaysAgoDate.setDate(now.getDate() - 5);
    const fiveDaysAgo = toDateString(fiveDaysAgoDate);

    // Previous month dates
    const prevMonthDate1 = new Date(now.getFullYear(), now.getMonth() - 1, 10);
    const prevMonthDate2 = new Date(now.getFullYear(), now.getMonth() - 1, 18);
    const prevMonthDate3 = new Date(now.getFullYear(), now.getMonth() - 1, 25);

    const sampleReadings = [
      // Today's readings (demonstrates Daily report & Dashboard today's summary)
      { date: today, slot: 'Morning (fasting)', value: 95 },
      { date: today, slot: 'After breakfast', value: 135 },
      { date: today, slot: 'After lunch', value: 120 },

      // Yesterday's readings (full 4 readings)
      { date: yesterday, slot: 'Morning (fasting)', value: 92 },
      { date: yesterday, slot: 'After breakfast', value: 140 },
      { date: yesterday, slot: 'After lunch', value: 125 },
      { date: yesterday, slot: 'After dinner', value: 110 },

      // Earlier this month (demonstrates Month-to-date report)
      { date: fiveDaysAgo, slot: 'Morning (fasting)', value: 98 },
      { date: fiveDaysAgo, slot: 'After breakfast', value: 145 },
      { date: fiveDaysAgo, slot: 'After lunch', value: 130 },

      // Previous month readings (demonstrates Monthly previous-month report)
      { date: toDateString(prevMonthDate1), slot: 'Morning (fasting)', value: 90 },
      { date: toDateString(prevMonthDate1), slot: 'After breakfast', value: 138 },
      { date: toDateString(prevMonthDate2), slot: 'Morning (fasting)', value: 96 },
      { date: toDateString(prevMonthDate2), slot: 'After lunch', value: 128 },
      { date: toDateString(prevMonthDate3), slot: 'After dinner', value: 118 }
    ];

    let insertedCount = 0;
    for (const item of sampleReadings) {
      // Check if duplicate already exists
      const existing = await db.query(
        'SELECT * FROM readings WHERE user_id = $1 AND reading_date = $2 AND time_slot = $3',
        [userId, item.date, item.slot]
      );
      if (existing.rows.length === 0) {
        await db.query(
          'INSERT INTO readings (user_id, reading_date, time_slot, glucose_value) VALUES ($1, $2, $3, $4)',
          [userId, item.date, item.slot, item.value]
        );
        insertedCount++;
      }
    }

    console.log(`[Seed] Seeded ${insertedCount} new readings for user ID ${userId}.`);
    console.log('[Seed] Demo credentials:');
    console.log('       Email:    demo@sweety.app');
    console.log('       Password: Sweety@123');
    return { userId, insertedCount };
  } catch (err) {
    console.error('[Seed] Error seeding data:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  seed().then(() => process.exit(0));
}

module.exports = seed;
