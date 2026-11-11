const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { errorResponse } = require('../utils/responseUtils');

const JWT_SECRET = process.env.JWT_SECRET || 'sweety_super_secret_jwt_key_2026_kenpath_evaluation';

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication required. Please log in.', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return errorResponse(res, 'Authentication required. Please log in.', 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return errorResponse(res, 'Invalid or expired token. Please log in again.', 401);
    }

    const result = await db.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'User account no longer exists.', 401);
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return errorResponse(res, 'Internal authentication error.', 500);
  }
}

module.exports = authMiddleware;
