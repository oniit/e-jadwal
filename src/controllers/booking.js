const Booking = require('../models/booking');
const Asset = require('../models/asset');
const { getAllowedAssetCodes, canManageAsset } = require('../middleware/permissions');

const getAllBookings = async (req, res) => {
    try {
        let query = {};
        
        if (req.user && req.user.role === 'supir') {
            // Supir only sees their own vehicle bookings
            query = {
                driver: req.user._id,
                bookingType: 'kendaraan'
            };
        } else if (req.user) {
            const { allowedCodes, unrestricted } = await getAllowedAssetCodes(req.user);
            if (!unrestricted) {
                if (!allowedCodes.length) {
                    return res.json([]); // No assets to view
                }
                query = { assetCode: { $in: allowedCodes } };
            }
        }
        
        const bookings = await Booking.find(query).populate('driver');
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getBookingByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const booking = await Booking.findOne({ bookingId: code }).populate('driver');
        if (!booking) return res.status(404).json({ message: 'Booking tidak ditemukan.' });
        if (req.user && req.user.role === 'supir' && booking.driver && String(booking.driver._id) !== String(req.user._id)) {
            return res.status(403).json({ message: 'Anda tidak memiliki akses ke booking ini.' });
        }
        if (req.user && req.user.role !== 'supir' && !(await canManageAsset(req.user, booking.assetCode))) {
            return res.status(403).json({ message: 'Anda tidak memiliki akses ke aset ini.' });
        }
        res.json(booking);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getBooking = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ message: 'ID booking diperlukan.' });
        
        const booking = await Booking.findById(id).populate('driver');
        if (!booking) return res.status(404).json({ message: 'Booking tidak ditemukan.' });
        if (req.user && req.user.role === 'supir' && booking.driver && String(booking.driver._id) !== String(req.user._id)) {
            return res.status(403).json({ message: 'Anda tidak memiliki akses ke booking ini.' });
        }
        if (req.user && req.user.role !== 'supir' && !(await canManageAsset(req.user, booking.assetCode))) {
            return res.status(403).json({ message: 'Anda tidak memiliki akses ke aset ini.' });
        }
        res.json(booking);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const checkConflict = async (bookingData, id = null) => {
    const { startDate, endDate, assetCode, driver, bookingType } = bookingData;

    const conflictQuery = {
        startDate: { $lt: new Date(endDate) },
        endDate: { $gt: new Date(startDate) },
    };

    if (id) {
        conflictQuery._id = { $ne: id };
    }

    const specificCriteria = [{ assetCode: assetCode }];
    if (bookingType === 'kendaraan' && driver) {
        specificCriteria.push({ driver: driver });
    }
    conflictQuery.$or = specificCriteria;

    const conflictingBooking = await Booking.findOne(conflictQuery).populate('driver');

    if (conflictingBooking) {
        if (conflictingBooking.assetCode === assetCode) {
            return `Aset "${conflictingBooking.assetName}" sudah dipesan pada rentang waktu tersebut.`;
        }
        if (conflictingBooking.driver && conflictingBooking.driver._id && String(conflictingBooking.driver._id) === String(driver)) {
            const driverName = conflictingBooking.driver.name || conflictingBooking.driver.username || 'Supir';
            return `Supir "${driverName}" sudah bertugas pada rentang waktu tersebut.`;
        }
    }
    return null;
};

// Validasi ketersediaan barang (type aset "barang") berdasarkan qty dan jadwal overlap
const validateBarangAvailability = async (bookingData, id = null) => {
    const items = Array.isArray(bookingData.borrowedItems) ? bookingData.borrowedItems : [];
    if (!items.length) return null; // optional

    // Normalisasi dan gabungkan duplikat
    const aggregated = items.reduce((map, it) => {
        if (!it || !it.assetCode) return map;
        const code = String(it.assetCode);
        const qty = Number(it.quantity || 0);
        if (!Number.isFinite(qty) || qty <= 0) return map;
        map.set(code, (map.get(code) || 0) + qty);
        return map;
    }, new Map());

    if (aggregated.size === 0) return null;

    // Cari booking lain yang overlap untuk menghitung pemakaian saat ini
    const overlapQuery = {
        startDate: { $lt: new Date(bookingData.endDate) },
        endDate: { $gt: new Date(bookingData.startDate) },
    };
    if (id) overlapQuery._id = { $ne: id };

    const overlapping = await Booking.find(overlapQuery).select('borrowedItems');

    // Hitung pemakaian per code dari semua booking overlap
    const usedMap = new Map();
    for (const b of overlapping) {
        if (!Array.isArray(b.borrowedItems)) continue;
        for (const it of b.borrowedItems) {
            if (!it || !it.assetCode) continue;
            const c = String(it.assetCode);
            const q = Number(it.quantity || 0);
            if (!Number.isFinite(q) || q <= 0) continue;
            usedMap.set(c, (usedMap.get(c) || 0) + q);
        }
    }

    // Ambil stok dari koleksi Asset (type barang)
    const codes = [...aggregated.keys()];
    const assets = await Asset.find({ code: { $in: codes }, type: 'barang' }).select('code name num');
    const assetsByCode = new Map(assets.map(a => [a.code, a]));

    for (const [code, reqQty] of aggregated.entries()) {
        const asset = assetsByCode.get(code);
        const maxQty = Number(asset?.num ?? 0);
        if (!asset || !Number.isFinite(maxQty) || maxQty <= 0) {
            return `Aset barang dengan code ${code} tidak tersedia.`;
        }
        const alreadyUsed = usedMap.get(code) || 0;
        if (alreadyUsed + reqQty > maxQty) {
            const sisa = Math.max(0, maxQty - alreadyUsed);
            return `Permintaan melebihi stok. "${asset.name}" tersisa ${sisa} pada waktu tersebut.`;
        }
    }
    return null;
};


function getJakartaMinutesOfDay(date) {
    try {
        const parts = new Intl.DateTimeFormat('id-ID', {
            timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false
        }).formatToParts(new Date(date));
        const hh = Number(parts.find(p => p.type === 'hour')?.value || '0');
        const mm = Number(parts.find(p => p.type === 'minute')?.value || '0');
        return hh * 60 + mm;
    } catch {
        const d = new Date(date);
        // Fallback to local
        return d.getHours() * 60 + d.getMinutes();
    }
}

const createBooking = async (req, res) => {
    try {
        const payload = await normalizePayload(req.body);

        if (req.user && !(await canManageAsset(req.user, payload.assetCode))) {
            return res.status(403).json({ message: 'Anda tidak memiliki akses ke aset ini.' });
        }
        // Otomatis set jam gedung ke 07:00-16:00 jika di luar jam operasional
        if (payload.bookingType === 'gedung') {
            const sMin = getJakartaMinutesOfDay(payload.startDate);
            const eMin = getJakartaMinutesOfDay(payload.endDate);
            const minAllowed = 7 * 60;   // 07:00
            const maxAllowed = 16 * 60;  // 16:00
            
            // Jika start time < 07:00, set ke 07:00
            if (sMin < minAllowed) {
                const date = new Date(payload.startDate);
                date.setHours(7, 0, 0, 0);
                payload.startDate = date;
            }
            // Jika end time > 16:00, set ke 16:00
            if (eMin > maxAllowed) {
                const date = new Date(payload.endDate);
                date.setHours(16, 0, 0, 0);
                payload.endDate = date;
            }
        }
        const conflictMessage = await checkConflict(payload);
        if (conflictMessage) {
            return res.status(409).json({ message: conflictMessage }); // 409 Conflict
        }

        if (payload.bookingType === 'gedung') {
            const stockMessage = await validateBarangAvailability(payload);
            if (stockMessage) {
                return res.status(409).json({ message: stockMessage });
            }
        }

        // Track who created this booking
        if (req.user && req.user.name) {
            payload.createdBy = req.user.name;
        }

        const booking = new Booking(payload);
        const newBooking = await booking.save();
        res.status(201).json(newBooking);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const updateBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const existingBooking = await Booking.findById(id);
        if (!existingBooking) {
            return res.status(404).json({ message: 'Data peminjaman tidak ditemukan.' });
        }

        if (req.user && req.user.role === 'supir' && existingBooking.driver && String(existingBooking.driver) !== String(req.user._id)) {
            return res.status(403).json({ message: 'Anda tidak memiliki akses ke booking ini.' });
        }

        const payload = await normalizePayload(req.body);
        const targetAssetCode = payload.assetCode || existingBooking.assetCode;
        payload.assetCode = targetAssetCode;
        payload.bookingType = payload.bookingType || existingBooking.bookingType;
        if (req.user && !(await canManageAsset(req.user, targetAssetCode))) {
            return res.status(403).json({ message: 'Anda tidak memiliki akses ke aset ini.' });
        }
        // Otomatis set jam gedung ke 07:00-16:00 jika di luar jam operasional
        if (payload.bookingType === 'gedung') {
            const sMin = getJakartaMinutesOfDay(payload.startDate);
            const eMin = getJakartaMinutesOfDay(payload.endDate);
            const minAllowed = 7 * 60;
            const maxAllowed = 16 * 60;
            
            // Jika start time < 07:00, set ke 07:00
            if (sMin < minAllowed) {
                const date = new Date(payload.startDate);
                date.setHours(7, 0, 0, 0);
                payload.startDate = date;
            }
            // Jika end time > 16:00, set ke 16:00
            if (eMin > maxAllowed) {
                const date = new Date(payload.endDate);
                date.setHours(16, 0, 0, 0);
                payload.endDate = date;
            }
        }
        const conflictMessage = await checkConflict(payload, id);
        if (conflictMessage) {
            return res.status(409).json({ message: conflictMessage });
        }

        if (payload.bookingType === 'gedung') {
            const stockMessage = await validateBarangAvailability(payload, id);
            if (stockMessage) {
                return res.status(409).json({ message: stockMessage });
            }
        }

        const updatedBooking = await Booking.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
        res.json(updatedBooking);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ message: 'Data peminjaman tidak ditemukan.' });
        }
        if (req.user && req.user.role === 'supir' && booking.driver && String(booking.driver) !== String(req.user._id)) {
            return res.status(403).json({ message: 'Anda tidak memiliki akses ke booking ini.' });
        }
        if (req.user && !(await canManageAsset(req.user, booking.assetCode))) {
            return res.status(403).json({ message: 'Anda tidak memiliki akses ke aset ini.' });
        }
        await Booking.findByIdAndDelete(id);
        res.json({ message: 'Data peminjaman berhasil dihapus.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getAllBookings,
    getBookingByCode,
    getBooking,
    createBooking,
    updateBooking,
    deleteBooking,
};

// Normalisasi payload booking untuk keamanan dan konsistensi
async function normalizePayload(body) {
    const base = { ...body };
    // Pastikan tanggal berbentuk Date
    base.startDate = new Date(base.startDate);
    base.endDate = new Date(base.endDate);

    if (base.bookingType === 'gedung') {
        // borrowedItems opsional; jika ada, validasi format dan sinkronkan name dari master asset
        if (Array.isArray(base.borrowedItems)) {
            const items = base.borrowedItems
                .map(it => ({
                    assetCode: String(it.assetCode),
                    quantity: Number(it.quantity)
                }))
                .filter(it => it.assetCode && Number.isFinite(it.quantity) && it.quantity > 0);

            if (items.length) {
                const codes = items.map(i => i.assetCode);
                const aset = await Asset.find({ code: { $in: codes }, type: 'barang' }).select('code name');
                const nameMap = new Map(aset.map(a => [a.code, a.name]));
                base.borrowedItems = items.map(i => ({
                    assetCode: i.assetCode,
                    assetName: nameMap.get(i.assetCode) || i.assetCode,
                    quantity: i.quantity
                }));
            } else {
                base.borrowedItems = [];
            }
        } else if (typeof base.borrowedItems === 'string') {
            // kompatibilitas lama: simpan sebagai catatan teks pada notes jika string diberikan
            base._legacyBorrowedItems = base.borrowedItems;
            base.borrowedItems = [];
        }
    } else {
        base.borrowedItems = undefined;
    }

    // Sinkronisasi plat kendaraan (jika aset kendaraan punya field plate)
    if (base.assetCode) {
        const asset = await Asset.findOne({ code: base.assetCode }).select('name plate type');
        if (!base.assetName && asset?.name) {
            base.assetName = asset.name;
        }
        if (asset?.plate) {
            base.assetPlate = asset.plate.trim();
        } else {
            base.assetPlate = undefined;
        }
    }
    return base;
}
