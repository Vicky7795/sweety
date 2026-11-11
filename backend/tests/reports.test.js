const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

let userToken;
let userId;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await db.init();
});

beforeEach(async () => {
  db.resetMemoryStore();

  const reg = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Report Test User',
      email: 'report@example.com',
      password: 'Password123',
      confirmPassword: 'Password123'
    });
  userToken = reg.body.data.token;
  userId = reg.body.data.user.id;
});

describe('Reports Module', () => {
  const testDate = '2026-10-15';
  const prevMonthDate = '2026-09-20';

  test('Empty report response handles zero readings cleanly without NaN', async () => {
    const res = await request(app)
      .get(`/api/reports/daily?date=${testDate}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalReadings).toBe(0);
    expect(res.body.data.highestReading).toBeNull();
    expect(res.body.data.lowestReading).toBeNull();
    expect(res.body.data.averageReading).toBeNull();
    expect(res.body.data.readings).toEqual([]);
  });

  test('Daily report calculates highest, lowest, average (rounded to 1 decimal), and records', async () => {
    // Add 3 readings on testDate: 95, 130, 115
    // Sum = 340 / 3 = 113.3333 -> 113.3
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        reading_date: testDate,
        time_slot: 'Morning (fasting)',
        glucose_value: 95
      });

    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        reading_date: testDate,
        time_slot: 'After lunch',
        glucose_value: 130
      });

    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        reading_date: testDate,
        time_slot: 'After dinner',
        glucose_value: 115
      });

    const res = await request(app)
      .get(`/api/reports/daily?date=${testDate}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const data = res.body.data;
    expect(data.totalReadings).toBe(3);
    expect(data.highestReading).toBe(130);
    expect(data.lowestReading).toBe(95);
    expect(data.averageReading).toBe(113.3); // 340 / 3 rounded to 1 decimal place!
    expect(data.readings.length).toBe(3);
  });

  test('Month-to-date report calculates metrics from 1st of month to selected date', async () => {
    // 2026-10-02: 100
    // 2026-10-15: 120
    // 2026-10-25: 150 (beyond selected date 2026-10-15, must NOT be included)
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        reading_date: '2026-10-02',
        time_slot: 'Morning (fasting)',
        glucose_value: 100
      });

    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        reading_date: '2026-10-15',
        time_slot: 'After lunch',
        glucose_value: 120
      });

    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        reading_date: '2026-10-25',
        time_slot: 'After dinner',
        glucose_value: 150
      });

    const res = await request(app)
      .get(`/api/reports/month-to-date?date=${testDate}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const data = res.body.data;
    expect(data.totalReadings).toBe(2); // Only 10-02 and 10-15
    expect(data.highestReading).toBe(120);
    expect(data.lowestReading).toBe(100);
    expect(data.averageReading).toBe(110.0);
  });

  test('Monthly report calculates entire previous calendar month correctly', async () => {
    // Selected date: 2026-10-15 -> Previous month is September 2026 (2026-09-01 to 2026-09-30)
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        reading_date: '2026-09-05',
        time_slot: 'Morning (fasting)',
        glucose_value: 90
      });

    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        reading_date: '2026-09-28',
        time_slot: 'After dinner',
        glucose_value: 140
      });

    // October reading should NOT be included in September report
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        reading_date: '2026-10-01',
        time_slot: 'Morning (fasting)',
        glucose_value: 200
      });

    const res = await request(app)
      .get(`/api/reports/monthly?date=${testDate}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const data = res.body.data;
    expect(data.dateRange.startDate).toBe('2026-09-01');
    expect(data.dateRange.endDate).toBe('2026-09-30');
    expect(data.totalReadings).toBe(2);
    expect(data.highestReading).toBe(140);
    expect(data.lowestReading).toBe(90);
    expect(data.averageReading).toBe(115.0);
  });
});
