const express = require('express');
const cors = require('cors');
const path = require('path');
const mainRouter = require('./routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/api', mainRouter);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
});

app.use((err, req, res, next) => {
    console.error('UNHANDLED ERROR:', err.stack);
    if (res.headersSent) {
        return next(err);
    }
    res.status(500).json({
        message: err.message || 'Terjadi kesalahan internal pada server.',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

module.exports = app;
