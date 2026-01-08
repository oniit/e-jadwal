const express = require('express');
const router = express.Router();
const requestRoutes = require('./request');
const Booking = require('../models/booking');
const Asset = require('../models/asset');
const Driver = require('../models/driver');
const Request = require('../models/request');

// Public routes - only requests for calendar view
router.use('/requests', requestRoutes);

// Public endpoints for calendar
router.get('/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find({});
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get booking by code (bookingId)
router.get('/bookings/by-code/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const booking = await Booking.findOne({ bookingId: code }).populate('driver');
        if (!booking) return res.status(404).json({ message: 'Booking tidak ditemukan' });
        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/assets', async (req, res) => {
    try {
        const assets = await Asset.find({});
        const groupedAssets = {
            gedung: assets.filter(a => a.tipe === 'gedung'),
            kendaraan: assets.filter(a => a.tipe === 'kendaraan'),
            barang: assets.filter(a => a.tipe === 'barang')
        };
        res.json(groupedAssets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/drivers', async (req, res) => {
    try {
        const drivers = await Driver.find({});
        res.json(drivers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get request by code (requestId)
router.get('/requests/by-code/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const request = await Request.findOne({ requestId: code }).populate('driver');
        if (!request) return res.status(404).json({ message: 'Request tidak ditemukan' });
        res.json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
