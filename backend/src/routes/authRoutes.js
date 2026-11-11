const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../validators/authValidator');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/me', authMiddleware, getMe);

module.exports = router;
