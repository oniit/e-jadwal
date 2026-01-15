require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');

const resetDatabase = async () => {
  try {
    console.log('🔄 Menghubungkan ke database...');
    await connectDB();

    // Daftar collections yang TIDAK akan dihapus
    const skipCollections = ['users']; // Tambahkan nama collection yang ingin di-skip

    console.log('📋 Daftar collections yang akan dihapus:');
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('   (Tidak ada collection)');
    } else {
      collections.forEach(col => {
        const willSkip = skipCollections.includes(col.name) || col.name === 'system.indexes';
        const status = willSkip ? '[SKIP]' : '[HAPUS]';
        console.log(`   ${status} ${col.name}`);
      });
    }

    console.log('\n⚠️  Ini akan MENGHAPUS SEMUA DATA dari database!');
    if (skipCollections.length > 0) {
      console.log(`   ⚡ Kecuali collections: ${skipCollections.join(', ')}`);
    }
    console.log('   Pastikan Anda benar-benar ingin melanjutkan.\n');

    // Drop all collections
    for (const col of collections) {
      if (col.name !== 'system.indexes' && !skipCollections.includes(col.name)) {
        await db.dropCollection(col.name);
        console.log(`✅ Dihapus: ${col.name}`);
      }
    }

    console.log('\n✨ Database berhasil direset!');
    console.log('\n📌 Langkah selanjutnya:');
    console.log('   1. Jalankan: npm run seed (untuk buat superadmin)');
    console.log('   2. Atau import data dari file backup jika ada\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error reset database:', error.message);
    process.exit(1);
  }
};

resetDatabase();
