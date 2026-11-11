const { errorResponse } = require('../utils/responseUtils');

function errorHandler(err, req, res, next) {
  console.error('[Error Handler]', err);

  // PostgreSQL unique violation
  if (err.code === '23505') {
    if (err.constraint === 'users_email_key') {
      return errorResponse(res, 'An account with this email already exists.', 400);
    }
    if (err.constraint === 'unique_user_date_slot') {
      return errorResponse(res, 'You already have a reading for this time slot on this date.', 400);
    }
    return errorResponse(res, 'A duplicate record already exists.', 400);
  }

  // PostgreSQL check constraint violation
  if (err.code === '23514') {
    if (err.constraint && err.constraint.includes('glucose_value')) {
      return errorResponse(res, 'Value must be between 40 and 600 mg/dl.', 400);
    }
    if (err.constraint && err.constraint.includes('valid_time_slot')) {
      return errorResponse(res, 'Invalid time slot selected.', 400);
    }
    return errorResponse(res, 'Database check constraint failed.', 400);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred.';
  return errorResponse(res, message, statusCode);
}

module.exports = errorHandler;
