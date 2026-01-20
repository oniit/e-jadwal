const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/user');

// Generate Access Token (15 minutes)
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

// Generate Refresh Token (7 days)
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

// Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password harus diisi.' });
    }

    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: 'Username atau password salah.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Akun Anda telah dinonaktifkan.' });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Username atau password salah.' });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save();

    // Set tokens in cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      message: 'Login berhasil.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        firstLogin: user.firstLogin
      },
      firstLogin: user.firstLogin
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat login.' });
  }
};

// Refresh Token
exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token tidak ditemukan.' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Refresh token tidak valid.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Akun Anda telah dinonaktifkan.' });
    }

    const newAccessToken = generateAccessToken(user._id);

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000
    });

    res.json({ message: 'Token berhasil diperbarui.' });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ message: 'Refresh token tidak valid atau telah kadaluarsa.' });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.refreshToken = null;
    await user.save();

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ message: 'Logout berhasil.' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat logout.' });
  }
};

// Change Password (First Login)
exports.changePasswordFirstLogin = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Password baru dan konfirmasi password harus diisi.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Password baru dan konfirmasi password tidak cocok.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter.' });
    }

    const user = await User.findById(req.user._id);
    user.password = newPassword;
    user.firstLogin = false;
    await user.save();

    res.json({ message: 'Password berhasil diubah. Silakan login kembali.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengubah password.' });
  }
};

// Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, currentPassword, newPassword, isActive } = req.body;
    const user = await User.findById(req.user._id);

    // Update basic info
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    
    // Only superadmin can update isActive status (not in profile, but in user management)
    // Regular users and supir cannot change their own isActive status

    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Password saat ini harus diisi.' });
      }

      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Password saat ini salah.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password baru minimal 6 karakter.' });
      }

      user.password = newPassword;
    }

    await user.save();

    res.json({
      message: 'Profil berhasil diperbarui.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat memperbarui profil.' });
  }
};

// Get Current User
exports.getCurrentUser = async (req, res) => {
  try {
    res.json({
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      name: req.user.name,
      phone: req.user.phone,
      role: req.user.role,
      adminType: req.user.adminType,
      managedAssetCodes: req.user.managedAssetCodes,
      firstLogin: req.user.firstLogin,
      isActive: req.user.isActive
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data user.' });
  }
};

// Create Admin (Superadmin only)
exports.createAdmin = async (req, res) => {
  try {
    const { username, email, name, phone, adminType, managedAssetCodes } = req.body;

    if (!username || !email || !name) {
      return res.status(400).json({ message: 'Username, email, dan name harus diisi.' });
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username atau email sudah terdaftar.' });
    }

    // Generate random password
    const generatedPassword = User.generatePassword();

    const newAdmin = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      name,
      phone: phone || '',
      password: generatedPassword,
      role: 'admin',
      adminType: adminType || 'umum',
      managedAssetCodes: managedAssetCodes || [],
      firstLogin: true
    });

    await newAdmin.save();

    res.status(201).json({
      message: 'Admin berhasil dibuat.',
      admin: {
        id: newAdmin._id,
        username: newAdmin.username,
        email: newAdmin.email,
        name: newAdmin.name,
        phone: newAdmin.phone,
        role: newAdmin.role,
        adminType: newAdmin.adminType,
        managedAssetCodes: newAdmin.managedAssetCodes
      },
      generatedPassword // One-time display
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat membuat admin.' });
  }
};

// Get All Admins (Superadmin only)
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password -refreshToken -resetToken');
    res.json({ admins });
  } catch (error) {
    console.error('Get all admins error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data admin.' });
  }
};

// Get Admin by ID (Superadmin only)
exports.getAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await User.findOne({ _id: id, role: 'admin' }).select('-password -refreshToken -resetToken');
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin tidak ditemukan.' });
    }
    
    res.json({ admin });
  } catch (error) {
    console.error('Get admin by id error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data admin.' });
  }
};

// Update Admin (Superadmin only)
exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, isActive, adminType, managedAssetCodes } = req.body;

    const admin = await User.findById(id);

    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin tidak ditemukan.' });
    }

    if (name) admin.name = name;
    if (email) admin.email = email;
    if (phone !== undefined) admin.phone = phone;
    if (typeof isActive === 'boolean') admin.isActive = isActive;
    if (adminType) admin.adminType = adminType;
    if (managedAssetCodes) admin.managedAssetCodes = managedAssetCodes;

    await admin.save();

    res.json({
      message: 'Admin berhasil diperbarui.',
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        phone: admin.phone,
        role: admin.role,
        isActive: admin.isActive,
        adminType: admin.adminType,
        managedAssetCodes: admin.managedAssetCodes
      }
    });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat memperbarui admin.' });
  }
};

// Delete Admin (Superadmin only)
exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await User.findById(id);

    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin tidak ditemukan.' });
    }

    await User.findByIdAndDelete(id);

    res.json({ message: 'Admin berhasil dihapus.' });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat menghapus admin.' });
  }
};

// Reset Password Request
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email harus diisi.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: 'Jika email terdaftar, link reset password akan dikirimkan.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email (configure nodemailer)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Reset Password - E-Jadwal',
      html: `
        <p>Anda menerima email ini karena ada permintaan reset password untuk akun Anda.</p>
        <p>Klik link berikut untuk reset password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>Link ini akan kadaluarsa dalam 1 jam.</p>
        <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
      `
    });

    res.json({ message: 'Jika email terdaftar, link reset password akan dikirimkan.' });
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat memproses permintaan.' });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Semua field harus diisi.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Password baru dan konfirmasi password tidak cocok.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter.' });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token tidak valid atau telah kadaluarsa.' });
    }

    user.password = newPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: 'Password berhasil direset. Silakan login dengan password baru.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mereset password.' });
  }
};
