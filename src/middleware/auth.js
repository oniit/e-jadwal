const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Verify JWT Access Token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken || req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User tidak ditemukan.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Akun Anda telah dinonaktifkan.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token telah kadaluarsa.', expired: true });
    }
    return res.status(401).json({ message: 'Token tidak valid.' });
  }
};

// Check if user is superadmin
const isSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Akses ditolak. Hanya superadmin yang diizinkan.' });
  }
  next();
};

// Check if user is admin or superadmin
const isAdmin = (req, res, next) => {
  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Akses ditolak. Memerlukan role admin.' });
  }
  next();
};

// Check first login status
const checkFirstLogin = async (req, res, next) => {
  if (req.user.firstLogin) {
    return res.status(403).json({ 
      message: 'Anda harus mengubah password terlebih dahulu.',
      requirePasswordChange: true
    });
  }
  next();
};

module.exports = {
  verifyToken,
  isSuperAdmin,
  isAdmin,
  checkFirstLogin
};
