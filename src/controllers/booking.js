const Booking = require('../models/booking');

const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({});
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const checkConflict = async (bookingData, id = null) => {
    const { startDate, endDate, assetCode, driverName, bookingType } = bookingData;

    const conflictQuery = {
        startDate: { $lt: new Date(endDate) },
        endDate: { $gt: new Date(startDate) },
    };

    if (id) {
        conflictQuery._id = { $ne: id };
    }

    const specificCriteria = [{ assetCode: assetCode }];
    if (bookingType === 'kendaraan' && driverName && driverName !== 'Tanpa Supir') {
        specificCriteria.push({ driverName: driverName });
    }
    conflictQuery.$or = specificCriteria;

    const conflictingBooking = await Booking.findOne(conflictQuery);

    if (conflictingBooking) {
        if (conflictingBooking.assetCode === assetCode) {
            return `Aset "${conflictingBooking.assetName}" sudah dipesan pada rentang waktu tersebut.`;
        }
        if (conflictingBooking.driverName === driverName) {
            return `Supir "${driverName}" sudah bertugas pada rentang waktu tersebut.`;
        }
    }
    return null;
};


const createBooking = async (req, res) => {
    try {
        const conflictMessage = await checkConflict(req.body);
        if (conflictMessage) {
            return res.status(409).json({ message: conflictMessage }); // 409 Conflict
        }

        const booking = new Booking(req.body);
        const newBooking = await booking.save();
        res.status(201).json(newBooking);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const updateBooking = async (req, res) => {
    try {
        const { id } = req.params;

        const conflictMessage = await checkConflict(req.body, id);
        if (conflictMessage) {
            return res.status(409).json({ message: conflictMessage });
        }

        const updatedBooking = await Booking.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!updatedBooking) {
            return res.status(404).json({ message: 'Data peminjaman tidak ditemukan.' });
        }
        res.json(updatedBooking);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedBooking = await Booking.findByIdAndDelete(id);
        if (!deletedBooking) {
            return res.status(404).json({ message: 'Data peminjaman tidak ditemukan.' });
        }
        res.json({ message: 'Data peminjaman berhasil dihapus.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getAllBookings,
    createBooking,
    updateBooking,
    deleteBooking,
};
