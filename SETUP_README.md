# E-Jadwal - Sistem Peminjaman Gedung dan Kendaraan

Aplikasi terintegrasi untuk mengelola jadwal peminjaman gedung dan kendaraan UINSSC dengan sistem autentikasi berbasis role.

## 🎯 Fitur Utama

### Landing Page (Public)
- **URL**: `/` (root)
- Kalender jadwal gedung dan kendaraan (read-only)
- Form request peminjaman
- Tidak ada tombol login (akses admin via URL langsung)

### Admin Panel
- **URL**: `/admin`
- Memerlukan autentikasi
- Pengelolaan request, gedung, kendaraan, driver, dan aset
- Role-based access control (RBAC)

### Autentikasi & Autorisasi
- **Login**: JWT-based (Access Token + Refresh Token)
- **Roles**: `superadmin`, `admin`
- **First Login Password Change**: Wajib untuk admin baru
- **Session Management**: Cookie-based dengan auto-refresh

## 🏗️ Struktur Project

```
e-jadwal/
├── src/
│   ├── models/
│   │   ├── user.js          # User model (admin/superadmin)
│   │   ├── asset.js
│   │   ├── booking.js
│   │   ├── driver.js
│   │   └── request.js
│   ├── controllers/
│   │   ├── auth.js          # Auth logic (login, register, profile)
│   │   ├── asset.js
│   │   ├── booking.js
│   │   ├── driver.js
│   │   └── request.js
│   ├── middleware/
│   │   └── auth.js          # JWT verification & role check
│   ├── routes/
│   │   ├── auth.js          # Auth endpoints
│   │   ├── api.js           # Protected routes (requires auth)
│   │   ├── public.js        # Public routes (calendar data)
│   │   ├── asset.js
│   │   ├── booking.js
│   │   ├── driver.js
│   │   └── request.js
│   ├── config/
│   │   └── db.js
│   ├── app.js
│   └── server.js
├── views/
│   ├── index.html           # Public calendar landing page
│   ├── login.html           # Login page
│   └── admin.html           # Admin panel (full features)
├── public/
│   ├── script.js            # Public calendar script
│   ├── script-admin.js      # Admin panel script (to be created)
│   └── style.css
├── scripts/
│   └── seed-superadmin.js   # Seeding script
├── .env
└── package.json
```

## 🚀 Setup & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Update `.env` file:
```env
MONGO_URI=your-mongodb-connection-string
PORT=3000
NODE_ENV=development

# JWT Configuration (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-min-32-chars

# App Configuration
APP_URL=http://localhost:3000

# Email Configuration (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=E-Jadwal <noreply@uinssc.ac.id>
```

### 3. Seed Superadmin
```bash
npm run seed
```

**Default Superadmin Credentials:**
- Username: `onit`
- Password: `7`

⚠️ **IMPORTANT**: Change the password immediately after first login!

### 4. Run Development Server
```bash
npm run dev
```

## 📋 API Endpoints

### Public Routes (No Auth Required)
- `GET /` - Landing page (public calendar)
- `GET /login` - Login page
- `GET /api/public/requests` - Get approved requests for calendar

### Auth Routes
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout (requires auth)
- `POST /auth/refresh-token` - Refresh access token
- `GET /auth/me` - Get current user (requires auth)
- `PUT /auth/profile` - Update profile (requires auth)
- `POST /auth/change-password-first-login` - Change password on first login (requires auth)
- `POST /auth/request-password-reset` - Request password reset
- `POST /auth/reset-password` - Reset password with token

### Superadmin Only Routes
- `POST /auth/admin` - Create new admin
- `GET /auth/admins` - Get all admins
- `PUT /auth/admin/:id` - Update admin
- `DELETE /auth/admin/:id` - Delete admin

### Protected Routes (Requires Auth)
- `GET /admin` - Admin panel
- `/api/bookings` - Booking management
- `/api/assets` - Asset management
- `/api/drivers` - Driver management
- `/api/requests` - Request management

## 🔐 Authentication Flow

### Login Process
1. User enters username & password
2. Server validates credentials
3. Server generates Access Token (15 min) & Refresh Token (7 days)
4. Tokens stored in httpOnly cookies
5. If first login, user must change password

### Token Refresh
- Access token expires in 15 minutes
- Refresh token expires in 7 days
- Client auto-refreshes access token when expired
- If refresh token expired, user must login again

### Logout
- Clear all tokens from cookies
- Remove refresh token from database

## 👥 User Management (Superadmin Only)

### Creating New Admin
1. Superadmin goes to "Admin CRUD" tab
2. Click "+ Tambah Admin"
3. Fill in: Username, Email, Name, Phone
4. System auto-generates password
5. **Password displayed ONE TIME only** - copy and give to new admin
6. New admin must change password on first login

### Admin States
- **Active**: Can login and access system
- **Inactive**: Cannot login (account disabled by superadmin)
- **First Login**: Must change password before accessing features

## 🎨 Frontend Features

### Public Landing Page (`/`)
- Calendar view for gedung & kendaraan
- Filter by asset
- View booking details
- Submit request form
- No authentication required

### Login Page (`/login`)
- Username & password fields
- First login password change modal
- Link back to calendar

### Admin Panel (`/admin`)
- **Header**: User name, Profile button, Logout button
- **Tabs**:
  - Request Management
  - Gedung Management
  - Kendaraan Management
  - Driver Management
  - Asset Master Data
  - Admin CRUD (Superadmin only - hidden for regular admin)

### Admin CRUD Features (Superadmin)
- View all admins
- Create new admin (auto-generate password)
- Edit admin details
- Enable/Disable admin accounts
- Delete admin

### Profile Management
- View/edit: Name, Email, Phone
- Change password (requires current password)
- Username is read-only

## 🔧 Technical Details

### Password Security
- Bcrypt hashing (10 salt rounds)
- Minimum 6 characters
- Auto-generated passwords: 12 characters (alphanumeric + special)

### JWT Configuration
- **Access Token**: 15 minutes expiry
- **Refresh Token**: 7 days expiry
- Stored in httpOnly cookies
- Payload: `{ userId }`

### Middleware
- `verifyToken`: Validates JWT and checks user active status
- `isSuperAdmin`: Ensures user has superadmin role
- `isAdmin`: Ensures user has admin or superadmin role
- `checkFirstLogin`: Blocks access if first login not completed

## 📝 Usage Guide

### For Superadmin
1. Login with credentials
2. Access all tabs including "Admin CRUD"
3. Create admin accounts
4. Copy auto-generated password
5. Share credentials with new admin securely
6. Monitor admin accounts

### For Admin
1. Receive credentials from superadmin
2. Login at `/login`
3. Change password on first login
4. Access all tabs except "Admin CRUD"
5. Manage bookings, assets, drivers, requests

### For Public Users
1. Visit `/` (landing page)
2. View calendar
3. Submit request via form
4. Wait for admin approval

## 🔒 Security Notes

1. **Change default JWT secrets in production!**
2. Use HTTPS in production
3. Keep `.env` file secure
4. Never commit `.env` to git
5. Regularly update dependencies
6. Monitor failed login attempts
7. Implement rate limiting (recommended)
8. Use strong passwords

## 🐛 Troubleshooting

### "Token expired" errors
- Refresh token might be invalid
- Clear cookies and login again

### Cannot access admin panel
- Ensure you're logged in
- Check if account is active
- Verify role permissions

### Seed script says "already exists"
- Superadmin already created
- Use existing credentials or reset database

## 📚 Next Steps (TODO)

- [ ] Create `script-admin.js` for admin panel functionality
- [ ] Implement admin CRUD frontend logic
- [ ] Add rate limiting
- [ ] Add activity logging
- [ ] Implement email notifications
- [ ] Add password strength meter
- [ ] Implement 2FA (optional)
- [ ] Add API documentation (Swagger)

## 📞 Support

For issues or questions, contact the development team.

---

**Last Updated**: January 2026
**Version**: 1.0.0
