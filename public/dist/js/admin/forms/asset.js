// Asset Form Functions
import { api } from '../api.js';

export function openAssetModal(asset = null) {
    const modal = document.getElementById('modal-asset');
    const form = document.getElementById('form-asset');
    const title = document.getElementById('asset-form-title');
    
    if (!modal || !form || !title) {
        console.error('Asset modal elements not found');
        return;
    }
    
    title.textContent = asset ? 'Edit Aset' : 'Tambah Aset';
    form.reset();
    
    // Clear ID for new asset
    const idInput = document.getElementById('asset-id');
    if (idInput) idInput.value = '';
    
    if (asset) {
        const idField = document.getElementById('asset-id');
        const kodeField = document.getElementById('asset-code');
        const namaField = document.getElementById('asset-name');
        const tipeField = document.getElementById('asset-type');
        const detailField = document.getElementById('asset-detail');
        const plateField = document.getElementById('asset-plate');
        const numField = document.getElementById('asset-num');
        const jenisBmnField = document.getElementById('asset-jenis-bmn');
        const jenisBmnSearchField = document.getElementById('asset-jenis-bmn-search');
        const kodeBmnField = document.getElementById('asset-kode-bmn');
        
        if (idField) idField.value = asset._id || '';
        if (kodeField) kodeField.value = asset.code || '';
        if (namaField) namaField.value = asset.name || '';
        if (tipeField) tipeField.value = asset.type || '';
        if (detailField) detailField.value = asset.detail || '';
        if (plateField) plateField.value = asset.plate || '';
        if (numField && asset.num !== undefined && asset.num !== null) {
            numField.value = asset.num;
        }
        if (jenisBmnField) jenisBmnField.value = asset.jenis_bmn || '';
        if (jenisBmnSearchField) jenisBmnSearchField.value = asset.jenis_bmn || '';
        if (kodeBmnField) kodeBmnField.value = asset.kode_bmn || '';
        updateAssetNumVisibility(asset.type);
    } else {
        updateAssetNumVisibility('gedung');
    }
    
    // Initialize BMN search
    initBMNSearch();
    
    modal.classList.remove('hidden');
}

export function updateAssetNumVisibility(type) {
    const numWrapper = document.getElementById('asset-num-wrapper');
    const numInput = document.getElementById('asset-num');
    const plateWrapper = document.getElementById('asset-plate-wrapper');
    const plateInput = document.getElementById('asset-plate');
    
    // Show Qty field only for Barang
    if (numWrapper && numInput) {
        const showNum = type === 'barang';
        numWrapper.classList.toggle('hidden', !showNum);
        numInput.placeholder = 'Qty (misal: 40)';
    }
    
    // Show Plate field only for Kendaraan
    if (plateWrapper && plateInput) {
        const showPlate = type === 'kendaraan';
        plateWrapper.classList.toggle('hidden', !showPlate);
        plateInput.placeholder = 'Contoh: B 1234 CD';
    }
}

// BMN search functionality
let bmnList = [];

async function initBMNSearch() {
    try {
        if (bmnList.length === 0) {
            bmnList = await api.fetch('/api/assets/bmn/list');
        }
        
        const searchInput = document.getElementById('asset-jenis-bmn-search');
        const listContainer = document.getElementById('asset-jenis-bmn-list');
        
        if (!searchInput || !listContainer) return;
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            
            if (!query) {
                listContainer.classList.add('hidden');
                return;
            }
            
            const filtered = bmnList.filter(item => 
                item.jenis_bmn.toLowerCase().includes(query) || 
                item.kode_bmn.toLowerCase().includes(query)
            );
            
            if (filtered.length === 0) {
                listContainer.innerHTML = '<div class="p-2 text-gray-500">Tidak ada hasil</div>';
                listContainer.classList.remove('hidden');
                return;
            }
            
            listContainer.innerHTML = filtered.map(item => `
                <div class="p-2 border-b cursor-pointer hover:bg-blue-50" data-kode="${item.kode_bmn}" data-jenis="${item.jenis_bmn}">
                    <div class="font-semibold text-sm">${item.jenis_bmn}</div>
                    <div class="text-xs text-gray-500">${item.kode_bmn}</div>
                </div>
            `).join('');
            listContainer.classList.remove('hidden');
            
            // Add click handlers
            listContainer.querySelectorAll('div[data-kode]').forEach(el => {
                el.addEventListener('click', () => {
                    const jenisBmn = el.getAttribute('data-jenis');
                    const kodeBmn = el.getAttribute('data-kode');
                    
                    document.getElementById('asset-jenis-bmn-search').value = jenisBmn;
                    document.getElementById('asset-jenis-bmn').value = jenisBmn;
                    document.getElementById('asset-kode-bmn').value = kodeBmn;
                    listContainer.classList.add('hidden');
                });
            });
        });
        
        // Hide list when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#asset-jenis-bmn-search') && !e.target.closest('#asset-jenis-bmn-list')) {
                listContainer.classList.add('hidden');
            }
        });
        
    } catch (error) {
        console.error('Error initializing BMN search:', error);
    }
}

export function setupAssetTypeChangeHandler() {
    const assetTypeSelect = document.getElementById('asset-type');
    if (assetTypeSelect) {
        assetTypeSelect.addEventListener('change', (e) => {
            updateAssetNumVisibility(e.target.value);
        });
    }
}
