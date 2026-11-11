const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

let userToken1;
let userToken2;
let userId1;
let userId2;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await db.init();
});

beforeEach(async () => {
  db.resetMemoryStore();

  // Create User 1
  const u1 = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'User One',
      email: 'user1@example.com',
      password: 'Password123',
      confirmPassword: 'Password123'
    });
  userToken1 = u1.body.data.token;
  userId1 = u1.body.data.user.id;

  // Create User 2
  const u2 = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'User Two',
      email: 'user2@example.com',
      password: 'Password123',
      confirmPassword: 'Password123'
    });
  userToken2 = u2.body.data.token;
  userId2 = u2.body.data.user.id;
});

describe('Glucose Readings Management & Strict Validations', () => {
  const today = new Date().toISOString().split('T')[0];

  test('Successful glucose reading creation returns 201', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken1}`)
      .send({
        reading_date: today,
        time_slot: 'Morning (fasting)',
        glucose_value: 110
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.glucose_value).toBe(110);
    expect(res.body.data.time_slot).toBe('Morning (fasting)');
    expect(res.body.data.reading_date).toBe(today);
  });

  test('RULE 1: Missing glucose value is rejected with exact message', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken1}`)
      .send({
        reading_date: today,
        time_slot: 'Morning (fasting)'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Please enter a glucose value.');
  });

  test('RULE 2: Value below 40 is rejected with exact message', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken1}`)
      .send({
        reading_date: today,
        time_slot: 'Morning (fasting)',
        glucose_value: 39
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Value must be between 40 and 600 mg/dl.');
  });

  test('RULE 2: Value above 600 is rejected with exact message', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken1}`)
      .send({
        reading_date: today,
        time_slot: 'Morning (fasting)',
        glucose_value: 601
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Value must be between 40 and 600 mg/dl.');
  });

  test('RULE 2: Decimal value is rejected', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken1}`)
      .send({
        reading_date: today,
        time_slot: 'Morning (fasting)',
        glucose_value: 120.5
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Value must be between 40 and 600 mg/dl.');
  });

  test('RULE 3: Duplicate slot on the same date is rejected', async () => {
    // Add first After lunch reading
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken1}`)
      .send({
        reading_date: today,
        time_slot: 'After lunch',
        glucose_value: 130
      });

    // Try adding another After lunch reading on same date
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken1}`)
      .send({
        reading_date: today,
        time_slot: 'After lunch',
        glucose_value: 135
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('You already have an After lunch reading for this date.');
  });

  test('RULE 4: More than four readings on the same date is rejected', async () => {
    const slots = [
      'Morning (fasting)',
      'After breakfast',
      'After lunch',
      'After dinner'
    ];

    // Add all 4 valid slots
    for (const slot of slots) {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          reading_date: today,
          time_slot: slot,
          glucose_value: 110
        });
      expect(res.status).toBe(201);
    }

    // Try adding a 5th reading on same date
    const fifth = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken1}`)
      .send({
        reading_date: today,
        time_slot: 'Morning (fasting)',
        glucose_value: 115
      });

    expect(fifth.status).toBe(400);
    expect(fifth.body.success).toBe(false);
    expect(fifth.body.message).toBe('You can add only 4 readings per day.');
  });

  test('RULE 5: Future date rejection with exact message', async () => {
    const futureDate = '2099-12-31';
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken1}`)
      .send({
        reading_date: futureDate,
        time_slot: 'Morning (fasting)',
        glucose_value: 120
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Date cannot be in the future.');
  });

  test('Reading belonging to another user cannot be accessed, updated, or deleted', async () => {
    // User 1 creates reading
    const created = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken1}`)
      .send({
        reading_date: today,
        time_slot: 'Morning (fasting)',
        glucose_value: 105
      });
    const readingId = created.body.data.id;

    // User 2 tries to GET reading
    const getRes = await request(app)
      .get(`/api/readings/${readingId}`)
      .set('Authorization', `Bearer ${userToken2}`);
    expect(getRes.status).toBe(404);

    // User 2 tries to UPDATE reading
    const putRes = await request(app)
      .put(`/api/readings/${readingId}`)
      .set('Authorization', `Bearer ${userToken2}`)
      .send({
        reading_date: today,
        time_slot: 'Morning (fasting)',
        glucose_value: 150
      });
    expect(putRes.status).toBe(404);

    // User 2 tries to DELETE reading
    const delRes = await request(app)
      .delete(`/api/readings/${readingId}`)
      .set('Authorization', `Bearer ${userToken2}`);
    expect(delRes.status).toBe(404);
  });

  test('Successful reading update', async () => {
    const created = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken1}`)
      .send({
        reading_date: today,
        time_slot: 'Morning (fasting)',
        glucose_value: 100
      });
    const readingId = created.body.data.id;

    const res = await request(app)
      .put(`/api/readings/${readingId}`)
      .set('Authorization', `Bearer ${userToken1}`)
      .send({
        reading_date: today,
        time_slot: 'After breakfast',
        glucose_value: 138
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.time_slot).toBe('After breakfast');
    expect(res.body.data.glucose_value).toBe(138);
  });

  test('Successful reading deletion', async () => {
    const created = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken1}`)
      .send({
        reading_date: today,
        time_slot: 'Morning (fasting)',
        glucose_value: 100
      });
    const readingId = created.body.data.id;

    const delRes = await request(app)
      .delete(`/api/readings/${readingId}`)
      .set('Authorization', `Bearer ${userToken1}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    // Confirm it no longer exists
    const getRes = await request(app)
      .get(`/api/readings/${readingId}`)
      .set('Authorization', `Bearer ${userToken1}`);
    expect(getRes.status).toBe(404);
  });
});
