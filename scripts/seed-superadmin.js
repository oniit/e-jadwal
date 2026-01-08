require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/user');
const connectDB = require('../src/config/db');

const seedSuperAdmin = async () => {
  try {
    await connectDB();

    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });

    if (existingSuperAdmin) {
      console.log('Superadmin already exists.');
      console.log('Username:', existingSuperAdmin.username);
      process.exit(0);
    }

    // Create superadmin
    const superadmin = new User({
      username: 'onit',
      email: 'admin@uinssc.ac.id',
      password: '7',
      name: 'Super Administrator',
      phone: '',
      role: 'superadmin',
      isActive: true,
      firstLogin: false
    });

    await superadmin.save();

    console.log('✅ Superadmin berhasil dibuat!');
    console.log('Username: onit');
    console.log('Password: 7');
    console.log('\nSilakan login dan ubah password Anda.');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding superadmin:', error);
    process.exit(1);
  }
};

seedSuperAdmin();
