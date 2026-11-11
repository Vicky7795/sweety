const { errorResponse } = require('../utils/responseUtils');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegistration(req, res, next) {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return errorResponse(res, 'Full name is required.', 400);
  }

  if (name.trim().length < 2) {
    return errorResponse(res, 'Name must be at least 2 characters long.', 400);
  }

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    return errorResponse(res, 'Email address is required.', 400);
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return errorResponse(res, 'Please enter a valid email address.', 400);
  }

  if (!password || typeof password !== 'string') {
    return errorResponse(res, 'Password is required.', 400);
  }

  if (password.length < 6) {
    return errorResponse(res, 'Password must be at least 6 characters long.', 400);
  }

  if (password !== confirmPassword) {
    return errorResponse(res, 'Passwords do not match.', 400);
  }

  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    return errorResponse(res, 'Email address is required.', 400);
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return errorResponse(res, 'Please enter a valid email address.', 400);
  }

  if (!password || typeof password !== 'string') {
    return errorResponse(res, 'Password is required.', 400);
  }

  req.body.email = email.trim().toLowerCase();
  next();
}

module.exports = {
  validateRegistration,
  validateLogin
};
