const express = require('express');
const router = express.Router();
const requestRoutes = require('./request');
const Booking = require('../models/booking');
const Asset = require('../models/asset');
const User = require('../models/user');
const Request = require('../models/request');

// Public routes - only requests for calendar view
router.use('/requests', requestRoutes);

// Public endpoints for calendar
router.get('/bookings', async (req, res) => {
    try {
        const [bookings, kendaraan] = await Promise.all([
            Booking.find({}).lean(),
            Asset.find({ type: 'kendaraan' }).select('code plate').lean()
        ]);
        const plateMap = new Map((kendaraan || []).map(a => [a.code, a.plate?.trim()]));
        const enriched = (bookings || []).map(b => {
            if (b.bookingType === 'kendaraan' && !b.assetPlate) {
                const plate = plateMap.get(b.assetCode);
                return plate ? { ...b, assetPlate: plate } : b;
            }
            return b;
        });
        res.json(enriched);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get booking by code (bookingId)
router.get('/bookings/by-code/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const [bookingDoc, kendaraan] = await Promise.all([
            Booking.findOne({ bookingId: code }).populate('driver'),
            Asset.find({ type: 'kendaraan' }).select('code plate').lean()
        ]);
        if (!bookingDoc) return res.status(404).json({ message: 'Booking tidak ditemukan' });
        let booking = bookingDoc;
        if (booking.bookingType === 'kendaraan' && !booking.assetPlate && Array.isArray(kendaraan)) {
            const plate = kendaraan.find(a => a.code === booking.assetCode)?.plate;
            if (plate) booking = booking.toObject ? { ...booking.toObject(), assetPlate: plate.trim() } : { ...booking, assetPlate: plate.trim() };
        }
        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/assets', async (req, res) => {
    try {
        const assets = await Asset.find({});
        const groupedAssets = {
            gedung: assets.filter(a => a.type === 'gedung'),
            kendaraan: assets.filter(a => a.type === 'kendaraan'),
            barang: assets.filter(a => a.type === 'barang')
        };
        res.json(groupedAssets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/drivers', async (req, res) => {
    try {
        const drivers = await User.find({ role: 'supir' });
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
