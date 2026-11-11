/**
 * verify-postgres.js — Real PostgreSQL end-to-end verification for Sweety.
 * Starts EmbeddedPostgres 18 with explicit credentials, creates db, applies schema,
 * spawns the backend server as a child process (with correct env vars), exercises
 * all API endpoints, and prints PASS / FAIL.
 *
 * Usage (from backend/): node scripts/verify-postgres.js
 */
'use strict';

const nodePath   = require('path');
const fs         = require('fs');
const http       = require('http');
const { spawn }  = require('child_process');

const backendDir = nodePath.resolve(__dirname, '..');
const schemaFile = nodePath.join(backendDir, 'database', 'schema.sql');

const EP_PORT  = 5444;
const EP_USER  = 'postgres';
const EP_PASS  = 'sweetyverify';
const EP_DB    = 'sweety_verify';
const EP_DIR   = nodePath.join(backendDir, '.pgverify');
const API_PORT = 5099;
const API_BASE = `http://localhost:${API_PORT}/api`;

let passCount = 0, failCount = 0;

function pass(label)      { passCount++; console.log(`  \x1b[32m\u2713\x1b[0m PASS  ${label}`); }
function fail(label, r)   { failCount++; console.log(`  \x1b[31m\u2717\x1b[0m FAIL  ${label}`); if (r) console.log(`         \u21b3 ${String(r).slice(0, 160)}`); }
function check(lbl, ok, r){ ok ? pass(lbl) : fail(lbl, r); }

function apiRequest(method, url, body, headers) {
  headers = headers || {};
  return new Promise(function(resolve, reject) {
    const parsed = new URL(url);
    const opts = {
      hostname: parsed.hostname,
      port: parseInt(parsed.port, 10),
      path: parsed.pathname + parsed.search,
      method: method,
      headers: Object.assign({ 'Content-Type': 'application/json' }, headers)
    };
    const req = http.request(opts, function(res) {
      let data = '';
      res.on('data', function(c) { data += c; });
      res.on('end', function() {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

/** Wait until the API health endpoint responds */
function waitForServer(url, timeoutMs) {
  timeoutMs = timeoutMs || 15000;
  const start = Date.now();
  return new Promise(function(resolve, reject) {
    function attempt() {
      apiRequest('GET', url).then(function(r) {
        if (r.status < 500) { resolve(); }
        else { retry(); }
      }).catch(function() { retry(); });
    }
    function retry() {
      if (Date.now() - start > timeoutMs) return reject(new Error('Server did not start in ' + timeoutMs + 'ms'));
      setTimeout(attempt, 400);
    }
    attempt();
  });
}

async function main() {
  console.log('\n' + '='.repeat(55));
  console.log('  Sweety - Real PostgreSQL Verification Script');
  console.log('='.repeat(55) + '\n');

  /* 1. Start EmbeddedPostgres */
  console.log('[1/5] Starting EmbeddedPostgres on port ' + EP_PORT + ' ...');
  let EmbeddedPostgres;
  try {
    const mod = require('embedded-postgres');
    EmbeddedPostgres = mod.default || mod;
  } catch (e) {
    fail('Load embedded-postgres module', e.message);
    process.exit(1);
  }

  if (fs.existsSync(EP_DIR)) {
    try { fs.rmSync(EP_DIR, { recursive: true, force: true }); } catch (_) {}
  }

  const ep = new EmbeddedPostgres({ port: EP_PORT, databaseDir: EP_DIR, user: EP_USER, password: EP_PASS, persistent: false });
  try {
    await ep.initialise();
    await ep.start();
    console.log('     EmbeddedPostgres started OK\n');
  } catch (e) {
    fail('EmbeddedPostgres start', e.message);
    process.exit(1);
  }

  /* 2. Create DB & apply schema */
  console.log('[2/5] Creating database and applying schema ...');
  let pgPool;
  try {
    const { Pool } = require('pg');
    const admin = new Pool({ host: 'localhost', port: EP_PORT, user: EP_USER, password: EP_PASS, database: 'postgres', connectionTimeoutMillis: 8000 });
    await admin.query('CREATE DATABASE sweety_verify');
    await admin.end();
    pgPool = new Pool({ host: 'localhost', port: EP_PORT, user: EP_USER, password: EP_PASS, database: EP_DB, connectionTimeoutMillis: 8000 });
    const schema = fs.readFileSync(schemaFile, 'utf8');
    await pgPool.query(schema);
    await pgPool.end();
    pgPool = null;
    console.log('     Schema applied OK\n');
    pass('EmbeddedPostgres starts and accepts pg connections');
    pass('Schema (schema.sql) applies without errors');
  } catch (e) {
    fail('DB / schema setup', e.message);
    try { await ep.stop(); } catch (_) {}
    process.exit(1);
  }

  /* 3. Spawn backend server as child process */
  console.log('[3/5] Spawning backend API server on port ' + API_PORT + ' ...');
  const childEnv = Object.assign({}, process.env, {
    DATABASE_URL:   `postgresql://${EP_USER}:${EP_PASS}@localhost:${EP_PORT}/${EP_DB}`,
    PORT:           String(API_PORT),
    NODE_ENV:       'development',
    JWT_SECRET:     'verify-secret-key-for-audit-only',
    JWT_EXPIRES_IN: '1h',
    CLIENT_URL:     'http://localhost:5173'
  });

  const child = spawn('node', [nodePath.join(backendDir, 'src', 'server.js')], {
    env: childEnv,
    cwd: backendDir,
    stdio: 'pipe'
  });
  child.stdout.on('data', function(d) { process.stdout.write('[server] ' + d); });
  child.stderr.on('data', function(d) { process.stderr.write('[server:err] ' + d); });

  try {
    await waitForServer(`${API_BASE}/health`, 20000);
    console.log('\n     Backend server started OK\n');
  } catch (e) {
    fail('Backend server start', e.message);
    child.kill();
    try { await ep.stop(); } catch (_) {}
    process.exit(1);
  }

  /* 4. API checks */
  console.log('[4/5] Running API endpoint and validation checks ...\n');

  // Health
  try {
    const r = await apiRequest('GET', `${API_BASE}/health`);
    check('GET /api/health -> 200', r.status === 200, 'Got ' + r.status);
  } catch (e) { fail('GET /api/health', e.message); }

  // Register
  const email = `verify${Date.now()}@test.com`;
  let token = null;
  try {
    const r = await apiRequest('POST', `${API_BASE}/auth/register`, { name: 'Verify User', email: email, password: 'Test@1234', confirmPassword: 'Test@1234' });
    check('POST /api/auth/register -> 201', r.status === 201, 'Got ' + r.status + ' ' + JSON.stringify(r.body).slice(0, 100));
    if (r.body && r.body.data && r.body.data.token) token = r.body.data.token;
    else if (r.body && r.body.token) token = r.body.token;
  } catch (e) { fail('POST /api/auth/register', e.message); }

  // Login
  try {
    const r = await apiRequest('POST', `${API_BASE}/auth/login`, { email: email, password: 'Test@1234' });
    check('POST /api/auth/login -> 200', r.status === 200, 'Got ' + r.status);
    if (!token) {
      if (r.body && r.body.data && r.body.data.token) token = r.body.data.token;
      else if (r.body && r.body.token) token = r.body.token;
    }
  } catch (e) { fail('POST /api/auth/login', e.message); }

  // Wrong password
  try {
    const r = await apiRequest('POST', `${API_BASE}/auth/login`, { email: email, password: 'wrongpass' });
    check('Login with bad password -> 401', r.status === 401, 'Got ' + r.status);
  } catch (e) { fail('Login bad password', e.message); }

  const auth = { Authorization: 'Bearer ' + token };

  // Profile
  try {
    const r = await apiRequest('GET', `${API_BASE}/auth/me`, null, auth);
    const profileEmail = (r.body && r.body.data && r.body.data.user && r.body.data.user.email) || (r.body && r.body.email);
    check('GET /api/auth/me -> 200 with correct email', r.status === 200 && profileEmail === email,
      'Got ' + r.status + ' ' + JSON.stringify(r.body).slice(0, 100));
  } catch (e) { fail('GET /api/auth/me', e.message); }

  const today = new Date().toISOString().split('T')[0];
  let readingId = null;

  // Create reading
  try {
    const r = await apiRequest('POST', `${API_BASE}/readings`, { reading_date: today, time_slot: 'Morning (fasting)', glucose_value: 95 }, auth);
    check('POST /api/readings -> 201', r.status === 201, 'Got ' + r.status + ' ' + JSON.stringify(r.body).slice(0, 120));
    if (r.body) {
      readingId = (r.body.data && r.body.data.id) || (r.body.reading && r.body.reading.id) || r.body.id || null;
    }
  } catch (e) { fail('POST /api/readings', e.message); }

  // List
  try {
    const r = await apiRequest('GET', `${API_BASE}/readings`, null, auth);
    const list = (r.body && r.body.data && r.body.data.readings) || (r.body && r.body.readings) || r.body;
    check('GET /api/readings -> paginated list', r.status === 200 && Array.isArray(list),
      'Got ' + r.status + ' ' + JSON.stringify(r.body).slice(0, 100));
  } catch (e) { fail('GET /api/readings', e.message); }

  // Update
  if (readingId) {
    try {
      const r = await apiRequest('PUT', `${API_BASE}/readings/${readingId}`, { reading_date: today, time_slot: 'Morning (fasting)', glucose_value: 100 }, auth);
      check('PUT /api/readings/:id -> 200', r.status === 200, 'Got ' + r.status + ' ' + JSON.stringify(r.body).slice(0, 100));
    } catch (e) { fail('PUT /api/readings/:id', e.message); }
  }

  // Rule 1: missing value
  try {
    const r = await apiRequest('POST', `${API_BASE}/readings`, { reading_date: today, time_slot: 'After breakfast' }, auth);
    check('Rule 1: missing value -> 400 "Please enter a glucose value."',
      r.status === 400 && JSON.stringify(r.body).includes('Please enter a glucose value'),
      'Got ' + r.status + ' ' + JSON.stringify(r.body).slice(0, 120));
  } catch (e) { fail('Rule 1 validation', e.message); }

  // Rule 2: out of range
  try {
    const r = await apiRequest('POST', `${API_BASE}/readings`, { reading_date: today, time_slot: 'After breakfast', glucose_value: 25 }, auth);
    check('Rule 2: value<40 -> 400 "Value must be between 40 and 600 mg/dl."',
      r.status === 400 && JSON.stringify(r.body).includes('Value must be between 40 and 600'),
      'Got ' + r.status + ' ' + JSON.stringify(r.body).slice(0, 120));
  } catch (e) { fail('Rule 2 validation', e.message); }

  // Rule 3: duplicate slot
  try {
    const r = await apiRequest('POST', `${API_BASE}/readings`, { reading_date: today, time_slot: 'Morning (fasting)', glucose_value: 110 }, auth);
    check('Rule 3: dup slot -> 400 "You already have..."',
      r.status === 400 && JSON.stringify(r.body).includes('You already have'),
      'Got ' + r.status + ' ' + JSON.stringify(r.body).slice(0, 150));
  } catch (e) { fail('Rule 3 validation', e.message); }

  // Rule 5: future date
  try {
    const future = new Date(Date.now() + 172800000).toISOString().split('T')[0];
    const r = await apiRequest('POST', `${API_BASE}/readings`, { reading_date: future, time_slot: 'After lunch', glucose_value: 110 }, auth);
    check('Rule 5: future date -> 400 "Date cannot be in the future."',
      r.status === 400 && JSON.stringify(r.body).includes('Date cannot be in the future'),
      'Got ' + r.status + ' ' + JSON.stringify(r.body).slice(0, 120));
  } catch (e) { fail('Rule 5 validation', e.message); }

  // Reports
  try {
    const r = await apiRequest('GET', `${API_BASE}/reports/daily?date=${today}`, null, auth);
    check('GET /api/reports/daily -> 200', r.status === 200, 'Got ' + r.status + ' ' + JSON.stringify(r.body).slice(0, 100));
  } catch (e) { fail('GET /api/reports/daily', e.message); }

  try {
    const r = await apiRequest('GET', `${API_BASE}/reports/month-to-date?date=${today}`, null, auth);
    check('GET /api/reports/month-to-date -> 200', r.status === 200, 'Got ' + r.status + ' ' + JSON.stringify(r.body).slice(0, 100));
  } catch (e) { fail('GET /api/reports/month-to-date', e.message); }

  try {
    const r = await apiRequest('GET', `${API_BASE}/reports/monthly?date=${today}`, null, auth);
    check('GET /api/reports/monthly -> 200', r.status === 200, 'Got ' + r.status + ' ' + JSON.stringify(r.body).slice(0, 100));
  } catch (e) { fail('GET /api/reports/monthly', e.message); }

  // Unauthenticated request
  try {
    const r = await apiRequest('GET', `${API_BASE}/readings`);
    check('Unauthenticated GET /api/readings -> 401', r.status === 401, 'Got ' + r.status);
  } catch (e) { fail('Unauthenticated request', e.message); }

  // Delete
  if (readingId) {
    try {
      const r = await apiRequest('DELETE', `${API_BASE}/readings/${readingId}`, null, auth);
      check('DELETE /api/readings/:id -> 200', r.status === 200, 'Got ' + r.status + ' ' + JSON.stringify(r.body).slice(0, 100));
    } catch (e) { fail('DELETE /api/readings/:id', e.message); }
  }

  /* 5. Teardown */
  console.log('\n[5/5] Tearing down ...');
  child.kill('SIGTERM');
  await sleep(500);
  try {
    await ep.stop().catch(function() {});
    if (fs.existsSync(EP_DIR)) fs.rmSync(EP_DIR, { recursive: true, force: true });
    console.log('     Cleanup OK\n');
  } catch (e) {
    console.warn('     Cleanup warning:', e.message);
  }

  /* Summary */
  const total = passCount + failCount;
  console.log('='.repeat(55));
  if (failCount === 0) {
    console.log(`\x1b[32m  ALL ${total} CHECKS PASSED - Real PostgreSQL verified \u2713\x1b[0m`);
  } else {
    console.log(`\x1b[31m  ${failCount}/${total} CHECKS FAILED\x1b[0m`);
  }
  console.log('='.repeat(55) + '\n');
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(function(e) {
  console.error('[verify-postgres] Fatal error:', e.message);
  process.exit(1);
});