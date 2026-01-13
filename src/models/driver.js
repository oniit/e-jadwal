const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const driverSchema = new Schema({
    code: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    noTelp: { type: String, trim: true },
    detail: { type: String, trim: true },
    status: { type: String, enum: ['aktif', 'tidak aktif'], default: 'aktif' }
}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);
