const { body, param, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
};

// Validation for booking creation/update
const validateBooking = [
  body('userName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama peminjam harus 2-100 karakter.'),
  body('assetCode')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Kode aset tidak valid.'),
  body('assetName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama aset harus 2-100 karakter.'),
  body('personInCharge')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama penanggung jawab harus 2-100 karakter.'),
  body('picPhoneNumber')
    .trim()
    .isLength({ min: 7, max: 15 })
    .withMessage('Nomor telepon harus 7-15 karakter.')
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Nomor telepon tidak valid.'),
  body('startDate')
    .isISO8601()
    .withMessage('Tanggal mulai tidak valid.'),
  body('endDate')
    .isISO8601()
    .withMessage('Tanggal selesai tidak valid.')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('Tanggal selesai harus setelah tanggal mulai.');
      }
      return true;
    }),
  body('activityName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Nama kegiatan maksimal 200 karakter.'),
  body('destination')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Tujuan maksimal 200 karakter.'),
  body('driverName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Nama supir maksimal 100 karakter.'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Catatan maksimal 500 karakter.'),
  body('borrowedItems')
    .optional()
    .isArray()
    .withMessage('Barang yang dipinjam harus berupa array.')
    .custom((items) => {
      if (Array.isArray(items)) {
        items.forEach((item, idx) => {
          if (!item.assetCode || item.assetCode.length > 50) {
            throw new Error(`Item ${idx}: kode aset tidak valid (max 50 karakter).`);
          }
          if (!Number.isFinite(item.quantity) || item.quantity < 1) {
            throw new Error(`Item ${idx}: quantity harus angka positif.`);
          }
          if (item.quantity > 9999) {
            throw new Error(`Item ${idx}: quantity maksimal 9999.`);
          }
        });
      }
      return true;
    }),
];

// Validation for request creation
const validateRequest = [
  body('userName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama peminjam harus 2-100 karakter.'),
  body('personInCharge')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama penanggung jawab harus 2-100 karakter.'),
  body('picPhoneNumber')
    .trim()
    .isLength({ min: 7, max: 15 })
    .withMessage('Nomor telepon harus 7-15 karakter.')
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Nomor telepon tidak valid.'),
  body('assetCode')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Kode aset tidak valid.'),
  body('assetName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama aset harus 2-100 karakter.'),
  body('startDate')
    .isISO8601()
    .withMessage('Tanggal mulai tidak valid.'),
  body('endDate')
    .isISO8601()
    .withMessage('Tanggal selesai tidak valid.')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('Tanggal selesai harus setelah tanggal mulai.');
      }
      return true;
    }),
  body('activityName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Nama kegiatan maksimal 200 karakter.'),
  body('destination')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Tujuan maksimal 200 karakter.'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Catatan maksimal 500 karakter.'),
  body('borrowedItems')
    .optional()
    .isArray()
    .withMessage('Barang yang dipinjam harus berupa array.')
    .custom((items) => {
      if (Array.isArray(items)) {
        items.forEach((item, idx) => {
          if (!item.assetCode || item.assetCode.length > 50) {
            throw new Error(`Item ${idx}: kode aset tidak valid.`);
          }
          if (!Number.isFinite(item.quantity) || item.quantity < 1) {
            throw new Error(`Item ${idx}: quantity harus angka positif.`);
          }
        });
      }
      return true;
    }),
];

// Validation for ID param
const validateId = [
  param('id')
    .isMongoId()
    .withMessage('ID tidak valid.'),
];

module.exports = {
  handleValidationErrors,
  validateBooking,
  validateRequest,
  validateId,
};
