const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const publicRoutes = require('./routes/public');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');

const app = express();
const fs = require('fs');
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Public API routes (for calendar view)
app.use('/api/public', publicRoutes);

// Auth routes
app.use('/auth', authRoutes);

// Protected API routes (requires authentication)
app.use('/api', apiRoutes);

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

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Public landing page (calendar view)
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'views', 'index.html'));
});

// Login page
app.get('/login', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'views', 'login.html'));
});

// Admin page (requires authentication - handled by client-side)
app.get('/admin', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'views', 'admin.html'));
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
