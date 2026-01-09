const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const { verifyToken, isSuperAdmin } = require('../middleware/auth');

// Public routes
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/request-password-reset', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.post('/logout', verifyToken, authController.logout);
router.get('/me', verifyToken, authController.getCurrentUser);
router.put('/profile', verifyToken, authController.updateProfile);
router.post('/change-password-first-login', verifyToken, authController.changePasswordFirstLogin);

// Superadmin only routes
router.post('/admin', verifyToken, isSuperAdmin, authController.createAdmin);
router.get('/admins', verifyToken, isSuperAdmin, authController.getAllAdmins);
router.get('/admin/:id', verifyToken, isSuperAdmin, authController.getAdminById);
router.put('/admin/:id', verifyToken, isSuperAdmin, authController.updateAdmin);
router.delete('/admin/:id', verifyToken, isSuperAdmin, authController.deleteAdmin);

module.exports = router;
