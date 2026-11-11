const { registerUser, loginUser } = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/responseUtils');

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const { token, user } = await registerUser({ name, email, password });
    return successResponse(
      res,
      'Registration successful. Welcome to Sweety!',
      { token, user },
      201
    );
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { token, user } = await loginUser({ email, password });
    return successResponse(
      res,
      'Login successful. Welcome back!',
      { token, user },
      200
    );
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res) {
  return successResponse(
    res,
    'User profile retrieved successfully',
    { user: req.user },
    200
  );
}

module.exports = {
  register,
  login,
  getMe
};
