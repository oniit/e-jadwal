// Driver Form Functions

export function openDriverModal(driver = null) {
    const modal = document.getElementById('modal-form-driver');
    const form = document.getElementById('form-driver');
    const title = document.getElementById('driver-form-title');
    
    if (!modal || !form || !title) {
        console.error('Driver modal elements not found');
        return;
    }
    
    title.textContent = driver ? 'Edit Supir' : 'Tambah Supir';
    form.reset();
    
    // Clear ID for new driver
    const idInput = document.getElementById('driver-id');
    if (idInput) idInput.value = '';
    
    if (driver) {
        const idField = document.getElementById('driver-id');
        const kodeField = document.getElementById('driver-code');
        const namaField = document.getElementById('driver-name');
        const telpField = document.getElementById('driver-no-telp');
        const detailField = document.getElementById('driver-detail');
        const statusField = document.getElementById('driver-status');
        
        if (idField) idField.value = driver._id || '';
        if (kodeField) kodeField.value = driver.code || '';
        if (namaField) namaField.value = driver.name || '';
        if (telpField) telpField.value = driver.noTelp || '';
        if (detailField) detailField.value = driver.detail || '';
        if (statusField) statusField.value = driver.status || 'aktif';
    }
    
    modal.classList.remove('hidden');
}
