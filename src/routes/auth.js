const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');

router.post(
  '/login',
  authController.validateLogin,
  authController.handleValidationErrors,
  authController.login
);

router.post(
  '/register',
  authController.validateRegister,
  authController.handleValidationErrors,
  authController.register
);

router.post('/logout', authController.logout);

router.get('/user', authController.getCurrentUser);

module.exports = router;
