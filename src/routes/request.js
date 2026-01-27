const express = require('express');
const router = express.Router();
const requestController = require('../controllers/request');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Hanya file PDF, DOC, DOCX, JPG, PNG yang diizinkan'));
    }
});

router.get('/', requestController.getAllRequests);
router.get('/by-code/:code', requestController.getRequestByCode);
router.post('/', upload.single('letterFile'), requestController.createRequest);
router.put('/:id/approve', requestController.approveRequest);
router.put('/:id/reject', requestController.rejectRequest);
router.get('/:id', requestController.getRequestById);
router.delete('/:id', requestController.deleteRequest);

module.exports = router;
