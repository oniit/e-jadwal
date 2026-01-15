const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ALLOWED_TYPES = ['gedung', 'kendaraan', 'barang', 'umum'];

const assetSchema = new Schema({
    code: { type: String, required: true, trim: true, unique: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ALLOWED_TYPES, required: true },
    num: { type: Number, min: 0 },
    detail: { type: String, trim: true },
    jenis_bmn: { type: String, trim: true },
    kode_bmn: { type: String, trim: true }
}, { timestamps: true });

// Auto-generate asset code based on type
assetSchema.statics.generateCode = async function(type) {
    const prefixes = {
        'kendaraan': 'K',
        'gedung': 'G',
        'barang': 'B',
        'umum': 'A'
    };
    
    const prefix = prefixes[type] || 'A';
    
    // Find all existing codes for this type
    const regex = new RegExp(`^${prefix}\\d+$`);
    const assets = await this.find({ code: regex })
        .select('code')
        .lean();
    
    let nextNumber = 1;
    if (assets.length > 0) {
        // Extract numbers from codes and find the highest
        const numbers = assets.map(a => {
            const match = a.code.match(/\d+$/);
            return match ? parseInt(match[0], 10) : 0;
        });
        const maxNumber = Math.max(...numbers);
        nextNumber = maxNumber + 1;
    }
    
    // Format with leading zeros (e.g., K001, G001, B001, A001)
    return `${prefix}${String(nextNumber).padStart(3, '0')}`;
};

module.exports = mongoose.model('Asset', assetSchema);
module.exports.ALLOWED_TYPES = ALLOWED_TYPES;
