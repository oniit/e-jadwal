const { validationResult, body, param, query } = require('express-validator');
const User = require('../models/user');

// Validation middleware for login
const validateLogin = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username harus 3-50 karakter.'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password harus minimal 8 karakter.'),
];

// Validation middleware for register
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username harus 3-50 karakter.')
    .isAlphanumeric()
    .withMessage('Username hanya boleh alfanumerik.'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email harus valid.'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password harus minimal 8 karakter.')
    .matches(/[A-Z]/)
    .withMessage('Password harus mengandung huruf besar.')
    .matches(/[a-z]/)
    .withMessage('Password harus mengandung huruf kecil.')
    .matches(/[0-9]/)
    .withMessage('Password harus mengandung angka.'),
];

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Username atau password salah.' });
    }
    user.lastLogin = new Date();
    await user.save();
    req.logIn(user, (err) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ message: 'Login berhasil.', redirect: '/admin' });
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existing = await User.findOne({ $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }] });
    if (existing) {
      return res.status(400).json({ message: 'Username atau email sudah terdaftar.' });
    }
    const user = new User({ username: username.toLowerCase(), email: email.toLowerCase(), password, role: 'user' });
    await user.save();
    req.logIn(user, (err) => {
      if (err) return res.status(500).json({ message: err.message });
      res.status(201).json({ message: 'Registrasi berhasil.', redirect: '/admin' });
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const logout = (req, res) => {
  req.logOut((err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: 'Logout berhasil.', redirect: '/login' });
  });
};

const getCurrentUser = (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Tidak terautentikasi.' });
  }
  res.json(req.user);
};

module.exports = {
  validateLogin,
  validateRegister,
  handleValidationErrors,
  login,
  register,
  logout,
  getCurrentUser,
};
