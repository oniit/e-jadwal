const ExcelJS = require('exceljs');
const Asset = require('../models/asset');
const Booking = require('../models/booking');

/**
 * Export assets to Excel
 * GET /api/assets/export/excel
 */
exports.exportAssets = async (req, res) => {
    try {
        const { type } = req.query; // Filter by type if needed

        // Build query
        const query = {};
        if (type && ['gedung', 'kendaraan', 'barang', 'umum'].includes(type)) {
            query.type = type;
        }

        // Fetch assets
        const assets = await Asset.find(query).sort({ type: 1, code: 1 });

        // Create workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Assets');

        // Define columns
        worksheet.columns = [
            { header: 'Code', key: 'code', width: 15 },
            { header: 'Name', key: 'name', width: 30 },
            { header: 'Type', key: 'type', width: 15 },
            { header: 'Detail', key: 'detail', width: 50 },
            { header: 'Created At', key: 'createdAt', width: 20 },
        ];

        // Style header
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF166a4c' }
        };

        // Add data
        assets.forEach(asset => {
            worksheet.addRow({
                code: asset.code,
                name: asset.name,
                type: asset.type,
                detail: asset.detail || '',
                createdAt: asset.createdAt.toISOString().split('T')[0]
            });
        });

        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=assets-${Date.now()}.xlsx`
        );

        // Write to response
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Export assets error:', error);
        res.status(500).json({
            message: 'Gagal export aset',
            error: error.message
        });
    }
};

/**
 * Export bookings to Excel
 * GET /api/bookings/export/excel
 */
exports.exportBookings = async (req, res) => {
    try {
        const { type, startDate, endDate } = req.query;

        // Build query
        const query = {};
        if (type && ['gedung', 'kendaraan'].includes(type)) {
            query.bookingType = type; // Fixed: use bookingType not type
        }
        if (startDate || endDate) {
            query.startDate = {};
            if (startDate) query.startDate.$gte = new Date(startDate);
            if (endDate) query.startDate.$lte = new Date(endDate);
        }

        // Fetch bookings with populated references
        const bookings = await Booking.find(query)
            .populate('driver', 'name') // Fixed: use 'driver' not 'driverCode'
            .sort({ startDate: -1 });

        // Create workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Bookings');

        // Define columns based on type
        const baseColumns = [
            { header: 'Code', key: 'code', width: 15 },
            { header: 'Type', key: 'type', width: 12 },
            { header: 'Asset Name', key: 'assetName', width: 25 },
            { header: 'Start Date', key: 'startDate', width: 12 },
            { header: 'End Date', key: 'endDate', width: 12 },
            { header: 'Start Time', key: 'startTime', width: 10 },
            { header: 'End Time', key: 'endTime', width: 10 },
        ];

        const gedungColumns = [
            { header: 'Peminjam', key: 'peminjam', width: 20 },
            { header: 'Kontak', key: 'kontak', width: 15 },
            { header: 'Kegiatan', key: 'kegiatan', width: 30 },
            { header: 'Barang', key: 'barang', width: 30 },
        ];

        const kendaraanColumns = [
            { header: 'Pemakai', key: 'pemakai', width: 20 },
            { header: 'Tujuan', key: 'tujuan', width: 30 },
            { header: 'Driver', key: 'driverName', width: 20 },
        ];

        const commonColumns = [
            { header: 'Keterangan', key: 'keterangan', width: 30 },
            { header: 'Created At', key: 'createdAt', width: 20 },
        ];

        // Set columns based on filter or all
        if (type === 'gedung') {
            worksheet.columns = [...baseColumns, ...gedungColumns, ...commonColumns];
        } else if (type === 'kendaraan') {
            worksheet.columns = [...baseColumns, ...kendaraanColumns, ...commonColumns];
        } else {
            worksheet.columns = [...baseColumns, ...gedungColumns, ...kendaraanColumns, ...commonColumns];
        }

        // Style header
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFb8932f' }
        };

        // Add data
        bookings.forEach(booking => {
            const row = {
                code: booking.bookingId, // Fixed: use bookingId not code
                type: booking.bookingType, // Fixed: use bookingType not type
                assetName: booking.assetName || '',
                startDate: booking.startDate.toISOString().split('T')[0],
                endDate: booking.endDate.toISOString().split('T')[0],
                startTime: '', // Booking model doesn't have startTime/endTime
                endTime: '',
                keterangan: booking.notes || '', // Fixed: use notes not keterangan
                createdAt: booking.createdAt.toISOString().split('T')[0]
            };

            // Type-specific fields
            if (booking.bookingType === 'gedung') {
                row.peminjam = booking.userName || ''; // Fixed: use userName not peminjam
                row.kontak = booking.picPhoneNumber || ''; // Fixed: use picPhoneNumber not kontak
                row.kegiatan = booking.activityName || ''; // Fixed: use activityName not kegiatan
                // Format borrowed items
                row.barang = Array.isArray(booking.borrowedItems) 
                    ? booking.borrowedItems.map(i => `${i.assetName} (${i.quantity})`).join(', ')
                    : '';
            } else if (booking.bookingType === 'kendaraan') {
                row.pemakai = booking.userName || ''; // Fixed: use userName not pemakai
                row.tujuan = booking.destination || ''; // Fixed: use destination not tujuan
                row.driverName = booking.driver?.name || ''; // Fixed: driver is already populated
            }

            worksheet.addRow(row);
        });

        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=bookings-${Date.now()}.xlsx`
        );

        // Write to response
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Export bookings error:', error);
        res.status(500).json({
            message: 'Gagal export peminjaman',
            error: error.message
        });
    }
};
