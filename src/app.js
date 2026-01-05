const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const compression = require('compression');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const mainRouter = require('./routes');
const authRoutes = require('./routes/auth');
const User = require('./models/user');

const app = express();

// Security headers and hardening
app.disable('x-powered-by');
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(
    helmet.contentSecurityPolicy({
        useDefaults: true,
        directives: {
            "default-src": ["'self'"],
            "script-src": [
                "'self'",
                'https://cdn.tailwindcss.com',
            ],
            "style-src": [
                "'self'",
                "'unsafe-inline'",
                'https://fonts.googleapis.com',
                'https://cdnjs.cloudflare.com',
            ],
            "font-src": ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
            "img-src": ["'self'", 'data:', 'https:'],
            "connect-src": ["'self'"],
            "object-src": ["'none'"],
            "base-uri": ["'self'"],
            "frame-ancestors": ["'self'"],
        },
    })
);

// Body parsing with sane limits
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: true, limit: '64kb' }));
app.use(cookieParser());

// HTTP Parameter Pollution protection
app.use(hpp());

// Rate limiting
app.use(
    rateLimit({
        windowMs: 60 * 1000,
        max: 120,
        standardHeaders: true,
        legacyHeaders: false,
    })
);

// Compression
app.use(compression());

// Session management
const mongoUrl = process.env.MONGO_URI || 'mongodb://localhost:27017/ejadwal';
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'change-me-in-production',
        resave: false,
        saveUninitialized: false,
        store: new MongoStore({ mongoUrl }),
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 1000 * 60 * 60 * 24, // 24 hours
        },
    })
);

// Passport authentication
passport.use(
    new LocalStrategy(
        { usernameField: 'username', passwordField: 'password' },
        async (username, password, done) => {
            try {
                const user = await User.findOne({ username: username.toLowerCase() });
                if (!user || !(await user.comparePassword(password))) {
                    return done(null, false, { message: 'Invalid credentials.' });
                }
                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

app.use(passport.initialize());
app.use(passport.session());

// Strict CORS (configure via ALLOWED_ORIGINS)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(
    cors({
        origin: allowedOrigins.length ? allowedOrigins : undefined,
        methods: ['GET','POST','PUT','DELETE'],
        credentials: false,
    })
);

// CSRF protection middleware
const csrfProtection = csrf({ cookie: false });

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required.' });
    }
    next();
};

// Auth routes (public, with CSRF if needed)
app.use('/auth', authRoutes);

// Protected API routes
app.use('/api', requireAuth, mainRouter);

// Get CSRF token endpoint
app.get('/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

app.get('/partials/*', (req, res, next) => {
    const requestedPath = req.path.replace('/partials/', '');
    const filename = requestedPath.split('/').pop();
    
    if (!filename.endsWith('.html')) {
        return res.status(400).send('Invalid file type');
    }
    
    const filePath = path.resolve(__dirname, '..', 'views', 'partials', filename);
    
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).send('Partial not found');
        }
    });
});

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        return res.sendFile(path.resolve(__dirname, '..', 'views', 'index.html'));
    }
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    res.sendFile(path.resolve(__dirname, '..', 'views', 'login.html'));
});

app.get('/admin', requireAuth, csrfProtection, (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'views', 'partials', 'admin.html'));
});

app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    res.status(500).json({
        message: err.message || 'Terjadi kesalahan internal pada server.',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

module.exports = app;
