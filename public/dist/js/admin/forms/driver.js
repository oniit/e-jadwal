// Driver Form Functions

export function openDriverModal(driver = null) {
    const modal = document.getElementById('modal-form-driver');
    const form = document.getElementById('form-driver');
    const title = document.getElementById('driver-form-title');
    const passwordDisplay = document.getElementById('driver-generated-password-display');
    
    if (!modal || !form || !title) {
        console.error('Driver modal elements not found');
        return;
    }
    
    title.textContent = driver ? 'Edit Supir' : 'Tambah Supir';
    form.reset();
    
    // Hide password display when opening
    if (passwordDisplay) {
        passwordDisplay.classList.add('hidden');
    }
    
    // Clear ID for new driver
    const idInput = document.getElementById('driver-id');
    if (idInput) idInput.value = '';
    
    if (driver) {
        const idField = document.getElementById('driver-id');
        const usernameField = document.getElementById('driver-username');
        const namaField = document.getElementById('driver-name');
        const emailField = document.getElementById('driver-email');
        const phoneField = document.getElementById('driver-phone');
        
        if (idField) idField.value = driver._id || '';
        if (usernameField) usernameField.value = driver.username || '';
        if (namaField) namaField.value = driver.name || '';
        if (emailField) emailField.value = driver.email || '';
        if (phoneField) phoneField.value = driver.phone || '';
        
        // Show status field for editing
        const driverStatusWrapper = document.getElementById('driver-status-wrapper');
        const driverStatusField = document.getElementById('driver-status');
        if (driverStatusWrapper && driverStatusField) {
            driverStatusWrapper.classList.remove('hidden');
            driverStatusField.value = driver.isActive ? 'true' : 'false';
        }
    } else {
        // Hide status field for new driver
        const driverStatusWrapper = document.getElementById('driver-status-wrapper');
        if (driverStatusWrapper) {
            driverStatusWrapper.classList.add('hidden');
        }
    }
    
    modal.classList.remove('hidden');
}
