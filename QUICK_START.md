# 🚀 Quick Start Guide - E-Jadwal

## Akses Cepat

### 🌐 Public (Semua Orang)
**URL**: `http://localhost:3000/`
- ✅ Lihat kalender gedung & kendaraan
- ✅ Submit request peminjaman
- ❌ Tidak perlu login

### 🔐 Admin/Superadmin
**Login URL**: `http://localhost:3000/login`
**Admin Panel**: `http://localhost:3000/admin`

---

## 👤 Default Credentials

### Superadmin
```
Username: admin
Password: 123
```

**⚠️ PENTING**: Ganti password setelah login pertama!

---

## 🎯 Fitur Berdasarkan Role

### Superadmin
- ✅ Semua fitur admin
- ✅ **Admin CRUD** (kelola akun admin)
  - Create admin baru
  - Edit admin
  - Enable/Disable admin
  - Delete admin

### Admin
- ✅ Request Management
- ✅ Gedung Management
- ✅ Kendaraan Management
- ✅ Driver Management
- ✅ Asset Master Data
- ✅ Update profil sendiri
- ❌ Admin CRUD (tidak bisa akses)

---

## 📝 Workflow Umum

### Membuat Admin Baru (Superadmin)
1. Login sebagai superadmin
2. Buka tab "Admin CRUD" (icon users-cog)
3. Klik "+ Tambah Admin"
4. Isi data:
   - Username (unik)
   - Email
   - Nama Lengkap
   - No. Telepon
5. Klik "Simpan Admin"
6. **Password auto-generated** muncul SEKALI
7. Copy password dan kirim ke admin baru

### First Login Admin Baru
1. Buka `http://localhost:3000/login`
2. Masukkan credentials dari superadmin
3. Modal "Ubah Password" muncul otomatis
4. Masukkan password baru (min 6 karakter)
5. Konfirmasi password
6. Klik "Ubah Password"
7. Redirect ke admin panel

### Update Profil
1. Login ke admin panel
2. Klik tombol "Profil" di header
3. Edit: Nama, Email, No. Telp
4. (Opsional) Ubah password:
   - Masukkan password saat ini
   - Masukkan password baru
5. Klik "Simpan Perubahan"

---

## 🔧 Commands

```bash
# Install dependencies
npm install

# Seed superadmin (jika belum ada)
npm run seed

# Run development server
npm run dev

# Run production server
npm start

# Build frontend bundles (Vite)
npm run build
```

---

## 🌐 URL Structure

```
/ (root)           → Landing page (public calendar)
/login             → Login page
/admin             → Admin panel (requires auth)

/api/public/*      → Public API (tidak perlu auth)
/auth/*            → Auth endpoints
/api/*             → Protected API (perlu auth)
```

---

## 📍 API Endpoints (Reference)

### Authentication
```
POST   /auth/login                          Login
POST   /auth/logout                         Logout
POST   /auth/refresh-token                  Refresh access token
GET    /auth/me                             Get current user
PUT    /auth/profile                        Update profile
POST   /auth/change-password-first-login    Change password (first login)
```

### Admin Management (Superadmin Only)
```
POST   /auth/admin         Create new admin
GET    /auth/admins        List all admins
PUT    /auth/admin/:id     Update admin
DELETE /auth/admin/:id     Delete admin
```

---

## 📦 Frontend Build Notes

- Project menggunakan Vite untuk membundel frontend.
- Entry points:
   - Public: `public/js/public/main.js` → output: `public/dist/public.bundle.js`
   - Admin: `public/js/admin/main.js` → output: `public/dist/admin.bundle.js`
- HTML yang dipakai:
   - Public: `views/index.html` memuat `/dist/public.bundle.js`
   - Admin: `views/admin.html` memuat `/dist/admin.bundle.js`
- Jika mengubah file di `public/js/**`, jalankan `npm run build` agar perubahan tampil.

---

## 🔐 Security Notes

1. **Change JWT Secrets**: Edit `.env` sebelum production
   ```env
   MONGO_URI=
   PORT=
   JWT_SECRET=your-secret-here
   JWT_REFRESH_SECRET=your-refresh-secret-here
   ```

2. **HTTPS**: Gunakan HTTPS di production

3. **Strong Passwords**: Minimal 6 karakter (recommended: 12+)

4. **Email Config**: Setup SMTP untuk password reset

---

## 🆘 Troubleshooting

### Server tidak bisa start
```bash
# Check MongoDB connection
# Check .env file
# Run: npm install
# Jika error EADDRINUSE (port 3000 dipakai), hentikan server lain
# atau set PORT berbeda di .env lalu jalankan lagi
```

### Cannot login
```bash
# Check if superadmin exists: npm run seed
# Check credentials: admin / 123
# Clear browser cookies
```

### "Token expired"
```bash
# Clear cookies
# Login again
# Check if refresh token is valid
```

### Cannot access /admin
```bash
# Must login first at /login
# Check if account is active
# Check role (admin or superadmin)
# Pastikan sudah build frontend: npm run build
```

---

## 📚 Documentation

- [SETUP_README.md](SETUP_README.md) - Complete setup guide
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) - Implementation details

---

**Server Running**: `http://localhost:3000`
**Status**: ✅ Backend Complete | ✅ Frontend Admin & Public Active (Vite bundles)
