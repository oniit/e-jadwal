// Asset Form Functions

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
        const numField = document.getElementById('asset-num');
        
        if (idField) idField.value = asset._id || '';
        if (kodeField) kodeField.value = asset.code || '';
        if (namaField) namaField.value = asset.name || '';
        if (tipeField) tipeField.value = asset.type || '';
        if (detailField) detailField.value = asset.detail || '';
        if (numField && asset.num !== undefined && asset.num !== null) {
            numField.value = asset.num;
        }
        updateAssetNumVisibility(asset.type);
    } else {
        updateAssetNumVisibility('gedung');
    }
    
    modal.classList.remove('hidden');
}

export function updateAssetNumVisibility(type) {
    const wrapper = document.getElementById('asset-num-wrapper');
    const input = document.getElementById('asset-num');
    if (!wrapper || !input) return;
    
    const show = type === 'barang' || type === 'kendaraan';
    wrapper.classList.toggle('hidden', !show);
    input.placeholder = type === 'barang' ? 'Qty (misal: 40)' : 'Max penumpang (misal: 15)';
}

export function setupAssetTypeChangeHandler() {
    const assetTypeSelect = document.getElementById('asset-type');
    if (assetTypeSelect) {
        assetTypeSelect.addEventListener('change', (e) => {
            updateAssetNumVisibility(e.target.value);
        });
    }
}
