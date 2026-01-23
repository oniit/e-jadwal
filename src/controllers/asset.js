const fs = require('fs/promises');
const path = require('path');
const Asset = require('../models/asset');
const { ALLOWED_TYPES } = require('../models/asset');

const groupAssets = (assets = []) => {
    const grouped = { gedung: [], kendaraan: [], barang: [], umum: [] };
    assets.forEach((asset) => {
        const key = asset.type;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(asset);
    });
    return grouped;
};

const seedAssetsFromFile = async () => {
    const assetsPath = path.join(__dirname, '..', 'data', 'assets.json');
    try {
        const raw = await fs.readFile(assetsPath, 'utf8');
        const parsed = JSON.parse(raw);
        const flattened = Object.entries(parsed).flatMap(([type, list]) =>
            list.map((item) => ({ ...item, type }))
        );

        if (flattened.length) {
            await Asset.insertMany(flattened);
        }
    } catch (err) {
        console.error('[seedAssetsFromFile] Failed to seed assets:', err.message);
    }
};

const getAssets = async (_req, res) => {
    try {
        let assets = await Asset.find({}).lean();
        // if (!assets.length) {
        //     await seedAssetsFromFile();
        //     assets = await Asset.find({}).lean();
        // }
        res.set('Cache-Control', 'no-store');
        return res.json(groupAssets(assets));
    } catch (err) {
        console.error('[getAssets] Error:', err.message);
        return res.status(500).json({ message: 'Gagal mengambil data aset.' });
    }
};

const getAsset = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ message: 'ID aset diperlukan.' });

        const asset = await Asset.findById(id).lean();
        if (!asset) return res.status(404).json({ message: 'Aset tidak ditemukan.' });

        res.set('Cache-Control', 'no-store');
        return res.json(asset);
    } catch (err) {
        console.error('[getAsset] Error:', err.message);
        return res.status(500).json({ message: 'Gagal mengambil data aset.' });
    }
};

const createAsset = async (req, res) => {
    try {
        const payload = req.body;
        if (!payload || !payload.name || !payload.type) {
            return res.status(400).json({ message: 'name dan type wajib diisi.' });
        }

        const type = String(payload.type).toLowerCase();
        if (!ALLOWED_TYPES.includes(type)) {
            return res.status(400).json({ message: `Tipe harus salah satu dari: ${ALLOWED_TYPES.join(', ')}.` });
        }

        const parsedNum = payload.num !== undefined && payload.num !== '' ? Number(payload.num) : undefined;
        if (payload.num !== undefined && payload.num !== '' && !Number.isFinite(parsedNum)) {
            return res.status(400).json({ message: 'Nilai angka tidak valid.' });
        }

        // Auto-generate code if not provided
        const code = payload.code && payload.code.trim() !== '' 
            ? payload.code 
            : await Asset.generateCode(type);

        const asset = new Asset({
            code,
            name: payload.name,
            type,
            num: Number.isFinite(parsedNum) ? parsedNum : undefined,
            detail: payload.detail || '',
            plate: payload.plate || '',
            jenis_bmn: payload.jenis_bmn || '',
            kode_bmn: payload.kode_bmn || ''
        });

        const saved = await asset.save();
        return res.status(201).json(saved);
    } catch (err) {
        console.error('[createAsset] Error:', err.message);
        return res.status(500).json({ message: 'Gagal menambahkan aset.' });
    }
};

const updateAsset = async (req, res) => {
    try {
        const { id } = req.params;
        const payload = req.body;

        if (!id) return res.status(400).json({ message: 'ID aset diperlukan.' });

        if (payload.type && !ALLOWED_TYPES.includes(String(payload.type).toLowerCase())) {
            return res.status(400).json({ message: `Tipe harus salah satu dari: ${ALLOWED_TYPES.join(', ')}.` });
        }

        const parsedNum = payload.num !== undefined && payload.num !== '' ? Number(payload.num) : undefined;
        if (payload.num !== undefined && payload.num !== '' && !Number.isFinite(parsedNum)) {
            return res.status(400).json({ message: 'Nilai angka tidak valid.' });
        }

        const updateDoc = {};
        if (payload.code !== undefined) updateDoc.code = payload.code;
        if (payload.name !== undefined) updateDoc.name = payload.name;
        if (payload.type !== undefined) updateDoc.type = String(payload.type).toLowerCase();
        if (payload.detail !== undefined) updateDoc.detail = payload.detail;
        if (payload.plate !== undefined) updateDoc.plate = payload.plate;
        if (payload.jenis_bmn !== undefined) updateDoc.jenis_bmn = payload.jenis_bmn;
        if (payload.kode_bmn !== undefined) updateDoc.kode_bmn = payload.kode_bmn;

        const unsetDoc = {};
        if (payload.num === '' || payload.num === null) {
            unsetDoc.num = true;
        } else if (payload.num !== undefined && Number.isFinite(parsedNum)) {
            updateDoc.num = parsedNum;
        }

        const updated = await Asset.findByIdAndUpdate(
            id,
            {
                ...(Object.keys(updateDoc).length ? { $set: updateDoc } : {}),
                ...(Object.keys(unsetDoc).length ? { $unset: unsetDoc } : {}),
            },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ message: 'Aset tidak ditemukan.' });
        }

        return res.json(updated);
    } catch (err) {
        console.error('[updateAsset] Error:', err.message);
        return res.status(500).json({ message: 'Gagal memperbarui aset.' });
    }
};

const deleteAsset = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ message: 'ID aset diperlukan.' });

        const deleted = await Asset.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Aset tidak ditemukan.' });
        }

        return res.json({ message: 'Aset berhasil dihapus.' });
    } catch (err) {
        console.error('[deleteAsset] Error:', err.message);
        return res.status(500).json({ message: 'Gagal menghapus aset.' });
    }
};

const getBMN = async (_req, res) => {
    try {
        const bmnData = await fs.readFile(path.join(__dirname, '..', 'data', 'bmn.json'), 'utf8');
        const bmn = JSON.parse(bmnData);
        res.set('Cache-Control', 'no-store');
        return res.json(bmn);
    } catch (err) {
        console.error('[getBMN] Error:', err.message);
        return res.status(500).json({ message: 'Gagal mengambil data BMN.' });
    }
};

module.exports = {
    getAssets,
    getAsset,
    createAsset,
    updateAsset,
    deleteAsset,
    getBMN,
};
