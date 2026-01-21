// Render Forms HTML and other modal-related functions
import { updateAssetNumVisibility } from './forms/asset.js';
import { normalizeDrivers } from '../utils/helpers.js';

// Render Forms - populate empty form containers
export function renderForms() {
    const commonFormHtml = (type) => `
        <input type="hidden" id="${type}-booking-id">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label for="${type}-peminjam" class="form-label text-sm">Nama Peminjam / Unit</label>
            <input type="text" id="${type}-peminjam" required class="form-input"></div>
            <div><label for="${type}-name" class="form-label text-sm">Nama ${type === 'gedung' ? 'Gedung' : 'Kendaraan'}</label>
            <select id="${type}-name" required class="form-input"></select></div>
            <div><label for="${type}-penanggung-jawab" class="form-label text-sm">Penanggung Jawab</label>
            <input type="text" id="${type}-penanggung-jawab" required class="form-input"></div>
            <div><label for="${type}-nomor-penanggung-jawab" class="form-label text-sm">Nomor HP</label>
            <input type="tel" id="${type}-nomor-penanggung-jawab" required class="form-input"></div>
            <div><label for="${type}-mulai-tanggal" class="form-label text-sm">Tanggal Mulai</label>
            <input type="date" id="${type}-mulai-tanggal" required class="form-input"></div>
            <div><label for="${type}-selesai-tanggal" class="form-label text-sm">Tanggal Selesai</label>
            <input type="date" id="${type}-selesai-tanggal" required class="form-input"></div>
            <div id="${type}-time-inputs" class="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 hidden">
                <div><label for="${type}-mulai-jam" class="form-label text-sm">Jam Mulai</label>
                <input type="time" id="${type}-mulai-jam" class="form-input"></div>
                <div><label for="${type}-selesai-jam" class="form-label text-sm">Jam Selesai</label>
                <input type="time" id="${type}-selesai-jam" class="form-input"></div>
            </div>
            <div class="col-span-2 flex items-center"><input id="${type}-use-time" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500">
            <label for="${type}-use-time" class="ml-2 block text-sm text-gray-900">Pakai Jam Spesifik</label></div>
        </div>
    `;
    const gedungExtraFields = `
        <div><label for="gedung-kegiatan" class="form-label text-sm">Nama Kegiatan (Opsional)</label>
        <input type="text" id="gedung-kegiatan" class="form-input"></div>
        <div><label for="gedung-keterangan" class="form-label text-sm">Keterangan (Opsional)</label>
        <textarea id="gedung-keterangan" rows="2" class="form-input"></textarea></div>
        <div>
            <label class="form-label text-sm">Barang Dipinjam (Opsional)</label>
            <div class="grid grid-cols-5 gap-2 mb-2">
                <select id="gedung-barang-select" class="form-input col-span-3"></select>
                <input id="gedung-barang-qty" type="number" min="1" step="1" class="form-input col-span-1" placeholder="Qty">
                <button type="button" id="gedung-barang-add" class="add-btn col-span-1">Tambah</button>
            </div>
            <div id="gedung-barang-chips" class="flex flex-wrap gap-2 p-2 border rounded-md bg-gray-50 min-h-10 text-sm"></div>
        </div>
        <button type="submit" class="w-full add-btn">Simpan Peminjaman</button>
    `;
    const kendaraanExtraFields = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label for="kendaraan-supir" class="form-label text-sm">Supir</label>
            <select id="kendaraan-supir" class="form-input"></select></div>
            <div><label for="kendaraan-tujuan" class="form-label text-sm">Tujuan (Opsional)</label>
            <input type="text" id="kendaraan-tujuan" class="form-input"></div>
        </div>
        <div><label for="kendaraan-keterangan" class="form-label text-sm">Keterangan (Opsional)</label>
        <textarea id="kendaraan-keterangan" rows="2" class="form-input"></textarea></div>
        <button type="submit" class="w-full add-btn">Simpan Peminjaman</button>
    `;
    
    const formGedung = document.getElementById('form-gedung');
    const formKendaraan = document.getElementById('form-kendaraan');
    const formAsset = document.getElementById('form-asset');
    
    if (formGedung) {
        formGedung.innerHTML = commonFormHtml('gedung') + gedungExtraFields;
    }
    if (formKendaraan) {
        formKendaraan.innerHTML = commonFormHtml('kendaraan') + kendaraanExtraFields;
    }
    if (formAsset) {
        formAsset.innerHTML = `
            <input type="hidden" id="asset-id">
            <input type="hidden" id="asset-kode-bmn">
            <div>
                <label for="asset-name" class="form-label text-sm">Nama</label>
                <input id="asset-name" type="text" required class="form-input" placeholder="Nama aset">
            </div>
            <div>
                <label for="asset-type" class="form-label text-sm">Tipe</label>
                <select id="asset-type" required class="form-input">
                    <option value="gedung">Gedung</option>
                    <option value="kendaraan">Kendaraan</option>
                    <option value="barang">Barang</option>
                    <option value="umum">Umum / Lainnya</option>
                </select>
            </div>
            <div>
                <label for="asset-jenis-bmn" class="form-label text-sm">Jenis BMN (Cari berdasarkan nama)</label>
                <input type="text" id="asset-jenis-bmn-search" class="form-input mb-2" placeholder="Ketik untuk mencari...">
                <div id="asset-jenis-bmn-list" class="border rounded max-h-48 overflow-y-auto bg-white hidden"></div>
                <input type="hidden" id="asset-jenis-bmn">
            </div>
            <div id="asset-num-wrapper" class="hidden">
                <label for="asset-num" class="form-label text-sm">Qty / Max</label>
                <input id="asset-num" type="number" min="0" step="1" class="form-input" placeholder="Masukkan angka">
            </div>
            <div>
                <label for="asset-detail" class="form-label text-sm">Detail (Opsional)</label>
                <input id="asset-detail" type="text" class="form-input" placeholder="Kapasitas / keterangan lain">
            </div>
            <button type="submit" class="w-full add-btn">Simpan Aset</button>
        `;
        
        // Update asset num visibility after rendering
        const assetTipeSelect = formAsset.querySelector('#asset-type');
        if (assetTipeSelect) {
            updateAssetNumVisibility(assetTipeSelect.value);
        }
    }
}

// Populate select options used inside gedung/kendaraan modals
export function populateFormSelectOptions(state) {
    const gedungAssets = Array.isArray(state.assets?.gedung) ? state.assets.gedung : [];
    const kendaraanAssets = Array.isArray(state.assets?.kendaraan) ? state.assets.kendaraan : [];
    const barangAssets = Array.isArray(state.assets?.barang) ? state.assets.barang : [];
    const umumAssets = Array.isArray(state.assets?.umum) ? state.assets.umum : [];
    const drivers = normalizeDrivers(state.allDrivers);

    const gedungSelect = document.getElementById('gedung-name');
    if (gedungSelect) {
        gedungSelect.innerHTML = '<option value="">Pilih Gedung</option>' +
            gedungAssets.map(a => `<option value="${a.code}">${a.name} (${a.code})</option>`).join('');
    }

    const kendaraanSelect = document.getElementById('kendaraan-name');
    if (kendaraanSelect) {
        kendaraanSelect.innerHTML = '<option value="">Pilih Kendaraan</option>' +
            kendaraanAssets.map(a => `<option value="${a.code}">${a.name} (${a.code})</option>`).join('');
    }

    const supirSelect = document.getElementById('kendaraan-supir');
    if (supirSelect) {
        const activeDrivers = drivers.filter(d => d.isActive !== false);
        supirSelect.innerHTML = '<option value="">Tanpa Supir</option>' +
            activeDrivers.map(d => `<option value="${d._id}">${d.name}</option>`).join('');
    }

    const barangSelect = document.getElementById('gedung-barang-select');
    if (barangSelect) {
        barangSelect.innerHTML = '<option value="">Pilih Barang</option>' +
            barangAssets.map(b => `<option value="${b.code}">${b.name} (${b.code})</option>`).join('');
    }
}
