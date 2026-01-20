const fs = require('fs/promises');
const path = require('path');
const User = require('../models/user');

const seedDriversFromFile = async () => {
    const driversPath = path.join(__dirname, '..', 'data', 'drivers.json');
    try {
        const raw = await fs.readFile(driversPath, 'utf8');
        const parsed = JSON.parse(raw);
        
        if (parsed.length) {
            const drivers = parsed.map(d => ({
                username: d.code,
                email: `${d.code}@supir.local`,
                password: 'password123',
                name: d.name,
                phone: d.noTelp || '',
                role: 'supir',
                isActive: d.status === 'aktif'
            }));
            await User.insertMany(drivers);
        }
    } catch (err) {
        console.error('[seedDriversFromFile] Failed to seed drivers:', err.message);
    }
};

const getDrivers = async (_req, res) => {
    try {
        let drivers = await User.find({ role: 'supir' }).lean();
        res.set('Cache-Control', 'no-store');
        return res.json(drivers);
    } catch (err) {
        console.error('[getDrivers] Error:', err.message);
        return res.status(500).json({ message: 'Gagal mengambil data supir.' });
    }
};

const getDriver = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ message: 'ID supir diperlukan.' });

        const driver = await User.findOne({ _id: id, role: 'supir' }).lean();
        if (!driver) return res.status(404).json({ message: 'Supir tidak ditemukan.' });

        res.set('Cache-Control', 'no-store');
        return res.json(driver);
    } catch (err) {
        console.error('[getDriver] Error:', err.message);
        return res.status(500).json({ message: 'Gagal mengambil data supir.' });
    }
};

const createDriver = async (req, res) => {
    try {
        const payload = req.body;
        if (!payload || !payload.username || !payload.name || !payload.email) {
            return res.status(400).json({ message: 'username, name, dan email wajib diisi.' });
        }
        
        // Generate random password for new driver
        const password = User.generatePassword();

        const driver = new User({
            username: payload.username,
            email: payload.email,
            password: password,
            name: payload.name,
            phone: payload.phone || '',
            role: 'supir',
            isActive: true
        });

        const saved = await driver.save();
        
        // Return password to frontend (only on creation)
        const result = saved.toJSON();
        result.password = password;
        
        return res.status(201).json(result);
    } catch (err) {
        console.error('[createDriver] Error:', err.message);
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Username atau email sudah digunakan.' });
        }
        return res.status(500).json({ message: 'Gagal menambahkan supir.' });
    }
};

const updateDriver = async (req, res) => {
    try {
        const { id } = req.params;
        const payload = req.body;

        if (!id) return res.status(400).json({ message: 'ID supir diperlukan.' });

        const updateDoc = {};
        if (payload.username !== undefined) updateDoc.username = payload.username;
        if (payload.name !== undefined) updateDoc.name = payload.name;
        if (payload.phone !== undefined) updateDoc.phone = payload.phone;
        if (payload.email !== undefined) updateDoc.email = payload.email;
        if (payload.isActive !== undefined) updateDoc.isActive = payload.isActive;
        if (payload.password !== undefined) {
            const user = await User.findById(id);
            if (user) {
                user.password = payload.password;
                await user.save();
                return res.json(user);
            }
        }

        const updated = await User.findOneAndUpdate(
            { _id: id, role: 'supir' },
            updateDoc,
            { new: true, runValidators: true }
        );

        if (!updated) return res.status(404).json({ message: 'Supir tidak ditemukan.' });

        return res.json(updated);
    } catch (err) {
        console.error('[updateDriver] Error:', err.message);
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Username atau email sudah digunakan.' });
        }
        return res.status(500).json({ message: 'Gagal memperbarui supir.' });
    }
};

const deleteDriver = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ message: 'ID supir diperlukan.' });

        const deleted = await User.findOneAndDelete({ _id: id, role: 'supir' });
        if (!deleted) return res.status(404).json({ message: 'Supir tidak ditemukan.' });

        return res.json({ message: 'Supir berhasil dihapus.', deleted });
    } catch (err) {
        console.error('[deleteDriver] Error:', err.message);
        return res.status(500).json({ message: 'Gagal menghapus supir.' });
    }
};

module.exports = {
    getDrivers,
    getDriver,
    createDriver,
    updateDriver,
    deleteDriver
};
