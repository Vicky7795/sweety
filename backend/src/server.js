const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('[Server] Initializing Sweety database connection...');
    await db.init();

    // Auto-seed demo user if in-memory or empty
    if (db.isInMemory) {
      console.log('[Server] Embedded database detected. Seeding demo user and initial readings...');
      const seed = require('../database/seed');
      await seed();
    }

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`  Sweety - Blood Glucose Tracker API`);
      console.log(`  Status: Running on port ${PORT}`);
      console.log(`  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('[Server] Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
