# Excel Import Feature

Fitur untuk import data aset dari file Excel ke sistem secara bulk.

## Fitur

✅ **Upload Excel** - Upload file `.xlsx` atau `.xls`  
✅ **Smart Column Mapping** - Otomatis mapping kolom meski nama berbeda  
✅ **Type Detection** - Otomatis deteksi tipe aset (gedung/kendaraan/barang)  
✅ **Validation** - Validasi data sebelum masuk database  
✅ **Bulk Insert/Update** - Insert data baru, update yang sudah ada  
✅ **Error Handling** - Detailed error report per baris jika ada  
✅ **Progress Feedback** - Loading modal selama import, hasil summary di akhir  

## Supported Column Names

System akan otomatis mengenali kolom dengan nama-nama ini (case-insensitive):

### Code (Required)
- `Code`, `Kode`, `ID`, `No`

### Name (Required)
- `Name`, `Nama`, `Nama Asset`, `Nama Gedung`, `Nama Kendaraan`, `Nama Barang`

### Type (Auto-detected from these columns)
- `Type`, `Jenis BMN`, `Jenis`, `Kategori`
- Keywords untuk detect:
  - **Gedung**: "gedung", "bangunan", "ruangan"
  - **Kendaraan**: "kendaraan", "mobil", "motor", "kendaraan dinas"
  - **Barang**: "barang", "peralatan", "equipment"

### Optional (akan masuk ke field `detail`)
- `Merk`, `Brand`
- `Tipe`, `Model`, `Tipe/Model`
- `Kondisi`, `Condition`
- `Status`, `Status Penggunaan`, `Status BMN`
- `Alamat`, `Lokasi`, `Lokasi Ruang`

## How to Use

1. **Go to Admin Panel** → Tab "Kelola Aset"
2. **Click "Import Excel" button** (blue button with file icon)
3. **Select file** `data-aset-xx.xlsx`
4. **Wait for processing** - Modal akan menunjukkan progress
5. **Check results** - Summary akan menampilkan:
   - Jumlah data yang berhasil
   - Berapa data baru (created)
   - Berapa data yang di-update
   - Detail error jika ada
6. **Page auto-refresh** setelah import selesai

## File Format Example

Minimal columns yang harus ada:
| Code | Name | Type |
|------|------|------|
| GD001 | Gedung A | Gedung |
| KD001 | Avanza | Kendaraan |
| BR001 | Projector | Barang |

Kolom dari file `data-aset-xx.xlsx` yang kompleks:
```
Code | Jenis BMN | Name | Type | Kode Barang | Nama Barang | Kondisi | Lokasi | ...
```

System akan otomatis extract field yang penting dan ignore kolom yang tidak perlu.

## API Endpoint

### Import File
```
POST /api/assets/import/excel
Content-Type: multipart/form-data

Body:
- file: <binary Excel file>

Response:
{
  "message": "Import selesai: 95/100 berhasil",
  "total": 100,
  "success": 95,
  "failed": 5,
  "created": ["GD001", "GD002", ...],  // 95 codes
  "updated": [],
  "errors": [
    {
      "row": 8,
      "errors": ["Code wajib ada", "Name wajib ada"]
    },
    ...
  ]
}
```

### Get Status
```
GET /api/assets/import/status

Response:
{
  "totalAssets": 500,
  "byType": {
    "gedung": 120,
    "kendaraan": 180,
    "barang": 200
  }
}
```

## Error Handling

Jika ada error:
- **Duplicate Code** - Data akan di-update dengan value baru
- **Missing Code/Name** - Baris akan di-skip, detail error ditampilkan
- **Invalid Type** - Default to "barang"
- **File not Excel** - Error message ditampilkan

## Notes

- Duplicates berdasarkan **Code** - jika ada code yang sama, akan di-update
- Field detail akan berisi informasi tambahan (Merk, Tipe, Kondisi, Status, Lokasi)
- Total file size tidak ada limit dari code-side, tapi Excel file biasanya max 10MB
- Processing time: ~1 menit untuk 1000 baris (tergantung koneksi DB)
