const XLSX = require('xlsx');
const Asset = require('../models/asset');
const { mapExcelRowToAsset, validateAsset } = require('../utils/excelMapper');

/**
 * Import assets from Excel file
 * POST /api/assets/import
 */
exports.importFromExcel = async (req, res) => {
    try {
        // Check if file uploaded
        if (!req.file) {
            return res.status(400).json({ 
                message: 'File Excel tidak ditemukan' 
            });
        }

        console.log('File received:', {
            filename: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        });

        // Parse Excel file
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        console.log('Sheets available:', workbook.SheetNames);

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Get raw data with header as 1st row
        const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '', header: 1 });
        console.log('Raw data rows:', rawData.length);

        // First row is header, rest is data
        if (rawData.length < 2) {
            return res.status(400).json({ 
                message: `File Excel hanya punya ${rawData.length} baris. Harus ada minimal header + 1 data row.`,
                sheetName: sheetName,
                rowCount: rawData.length,
                hint: 'Pastikan data Excel dimulai dari row 1 (header) dan ada data di row 2 ke bawah'
            });
        }

        // Extract header and data
        const headerRow = rawData[0];
        const dataRows = rawData.slice(1);

        console.log('Headers:', headerRow);
        console.log('Data rows:', dataRows.length);

        // Convert to object format
        const rows = dataRows.map((row, idx) => {
            const obj = {};
            headerRow.forEach((header, colIdx) => {
                if (header) obj[header] = row[colIdx] || '';
            });
            return obj;
        }).filter(row => {
            // Filter out completely empty rows
            return Object.values(row).some(v => v && String(v).trim() !== '');
        });

        console.log('Valid data rows after filter:', rows.length);

        if (rows.length === 0) {
            return res.status(400).json({ 
                message: 'Tidak ada data baris yang valid di Excel. Periksa apakah semua baris kosong atau format tidak benar.',
                hint: 'Setiap baris harus memiliki minimal 1 kolom yang terisi (Code atau Name)',
                totalRows: dataRows.length,
                validRows: rows.length
            });
        }

        // Process each row
        const results = {
            total: rows.length,
            success: 0,
            failed: 0,
            errors: [],
            duplicates: 0,
            created: [],
            updated: []
        };

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            
            try {
                // Convert row object back to array in same order as headers
                // Use case-insensitive key lookup since row keys might differ in case
                const rowArray = headerRow.map((header) => {
                    // Find matching key in row object (case-insensitive)
                    const key = Object.keys(row).find(k => k.toLowerCase() === header.toLowerCase());
                    return key ? row[key] : '';
                });
                
                // Map Excel row to Asset schema
                const mappedData = mapExcelRowToAsset(rowArray, headerRow);

                // Validate mapped data - allow empty code dan name untuk import
                const validation = validateAsset(mappedData, { allowEmptyName: true, allowEmptyCode: true });
                if (!validation.valid) {
                    results.failed++;
                    results.errors.push({
                        row: i + 2, // +2 because row 1 is header, and 0-based index
                        errors: validation.errors,
                        data: mappedData
                    });
                    continue;
                }

                // Auto-generate code dari schema jika kosong
                if (!mappedData.code) {
                    mappedData.code = await Asset.generateCode(mappedData.type);
                }
                
                // Set default name jika kosong
                if (!mappedData.name) {
                    mappedData.name = mappedData.code;
                }

                // Check if asset with same code already exists
                const existing = await Asset.findOne({ code: mappedData.code });

                if (existing) {
                    // Update existing - merge dengan data baru (hanya update field yang ada value)
                    const updateData = {};
                    if (mappedData.name) updateData.name = mappedData.name;
                    if (mappedData.type) updateData.type = mappedData.type;
                    if (mappedData.detail) updateData.detail = mappedData.detail;
                    if (mappedData.jenis_bmn) updateData.jenis_bmn = mappedData.jenis_bmn;
                    if (mappedData.kode_bmn) updateData.kode_bmn = mappedData.kode_bmn;
                    if (mappedData.num !== undefined) updateData.num = mappedData.num;
                    updateData.updatedAt = new Date();
                    
                    await Asset.updateOne({ code: mappedData.code }, updateData);
                    results.updated.push(mappedData.code);
                } else {
                    // Create new
                    await Asset.create(mappedData);
                    results.created.push(mappedData.code);
                }

                results.success++;

            } catch (error) {
                results.failed++;
                results.errors.push({
                    row: i + 2,
                    error: error.message,
                    data: row
                });
            }
        }

        // Return summary
        res.json({
            message: `Import selesai: ${results.success}/${results.total} berhasil`,
            ...results
        });

    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ 
            message: 'Gagal import file',
            error: error.message 
        });
    }
};

/**
 * Get import status/history
 * GET /api/assets/import/status
 */
exports.getImportStatus = async (req, res) => {
    try {
        const total = await Asset.countDocuments();
        const byType = await Asset.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);

        res.json({
            totalAssets: total,
            byType: Object.fromEntries(
                byType.map(b => [b._id, b.count])
            )
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Gagal ambil status',
            error: error.message 
        });
    }
};
