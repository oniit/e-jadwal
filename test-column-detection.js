const { findColumnIndex, FIELD_MAPPING } = require('./src/utils/excelMapper');

// Simulasi header dari Excel file lu
const headers = ['Code', 'Jenis BMN', 'Name', 'Type', 'Kode Barang', 'NUP', 'Nama Barang', 'Status BMN'];

console.log('Headers:', headers);
console.log('');

// Test find column indices
const codeIdx = findColumnIndex(headers, FIELD_MAPPING.code);
const typeIdx = findColumnIndex(headers, FIELD_MAPPING.type);
const nameIdx = findColumnIndex(headers, FIELD_MAPPING.name);
const jenisBmnIdx = findColumnIndex(headers, FIELD_MAPPING.jenis_bmn);
const kodeBmnIdx = findColumnIndex(headers, FIELD_MAPPING.kode_bmn);

console.log('Column Indices:');
console.log('- code:', codeIdx, '→', headers[codeIdx] || 'NOT FOUND');
console.log('- type:', typeIdx, '→', headers[typeIdx] || 'NOT FOUND');
console.log('- name:', nameIdx, '→', headers[nameIdx] || 'NOT FOUND');
console.log('- jenis_bmn:', jenisBmnIdx, '→', headers[jenisBmnIdx] || 'NOT FOUND');
console.log('- kode_bmn:', kodeBmnIdx, '→', headers[kodeBmnIdx] || 'NOT FOUND');
console.log('');

// Simulasi data row
const row = ['', 'ALAT ANGKUTAN BERMOTOR', 'Micro Bus', 'kendaraan', '3020102002', '1', 'Micro Bus (Penumpang 15 S/D 29 Orang)', 'Aktif'];

console.log('Row data:', row);
console.log('');

console.log('Extracted values:');
if (codeIdx !== null) console.log('- code:', row[codeIdx]);
if (typeIdx !== null) console.log('- type:', row[typeIdx]);
if (nameIdx !== null) console.log('- name:', row[nameIdx]);
if (jenisBmnIdx !== null) console.log('- jenis_bmn:', row[jenisBmnIdx]);
if (kodeBmnIdx !== null) console.log('- kode_bmn:', row[kodeBmnIdx]);
