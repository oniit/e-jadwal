const express = require('express');
const router = express.Router();
const multer = require('multer');
const assetController = require('../controllers/asset');
const assetImportController = require('../controllers/assetImport');
const assetExportController = require('../controllers/assetExport');

// Configure multer for Excel files
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Hanya file Excel yang diizinkan'));
        }
    }
});

// Import/Export routes (must be before CRUD routes)
router.post('/import/excel', upload.single('file'), assetImportController.importFromExcel);
router.get('/import/status', assetImportController.getImportStatus);
router.get('/export/excel', assetExportController.exportAssets);

// BMN list
router.get('/bmn/list', assetController.getBMN);

// Asset CRUD routes
router.get('/', assetController.getAssets);
router.get('/:id', assetController.getAsset);
router.post('/', assetController.createAsset);
router.put('/:id', assetController.updateAsset);
router.delete('/:id', assetController.deleteAsset);

module.exports = router;
