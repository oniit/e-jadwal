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
Username: onit
Password: 7
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

## ⚠️ Known Issues & TODO

### ⚠️ CRITICAL
**File `public/script-admin.js` belum dibuat!**

Saat ini admin panel (`/admin`) belum fully functional karena:
- Tidak ada auth check saat load page
- Tab switching belum implemented
- Form submission ke API belum ada
- Logout button belum functional
- Profile update form belum connected

### 📝 Next Steps
1. Create `public/script-admin.js`
2. Implement auth check on page load
3. Connect logout button
4. Connect profile form
5. Implement admin CRUD forms (superadmin)
6. Add loading states & error handling

---

## 🔐 Security Notes

1. **Change JWT Secrets**: Edit `.env` sebelum production
   ```env
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
```

### Cannot login
```bash
# Check if superadmin exists: npm run seed
# Check credentials: onit / 7
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
```

---

## 📚 Documentation

- [SETUP_README.md](SETUP_README.md) - Complete setup guide
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) - Implementation details

---

**Server Running**: `http://localhost:3000`
**Status**: ✅ Backend Complete | ⚠️ Frontend Partial
