const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await db.init();
});

beforeEach(() => {
  db.resetMemoryStore();
});

describe('Authentication API', () => {
  const validUser = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'Password123',
    confirmPassword: 'Password123'
  };

  test('Successful user registration returns 201 and token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.user).not.toHaveProperty('password_hash');
  });

  test('Duplicate email registration is rejected with 400', async () => {
    // First registration
    await request(app).post('/api/auth/register').send(validUser);

    // Duplicate attempt
    const res = await request(app)
      .post('/api/auth/register')
      .send(validUser);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test('Successful login returns 200 and token', async () => {
    await request(app).post('/api/auth/register').send(validUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: validUser.email,
        password: validUser.password
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.name).toBe(validUser.name);
  });

  test('Incorrect password returns 401', async () => {
    await request(app).post('/api/auth/register').send(validUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: validUser.email,
        password: 'WrongPassword'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  test('Unauthenticated API access to /api/auth/me returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
