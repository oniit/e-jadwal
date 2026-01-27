export function initializeExcelExport() {
    const btnExportAssets = document.getElementById('btn-export-assets');
    if (btnExportAssets) {
        btnExportAssets.addEventListener('click', () => exportAssets());
    }

    const btnExportGedung = document.getElementById('btn-export-gedung');
    if (btnExportGedung) {
        btnExportGedung.addEventListener('click', () => exportBookings('gedung'));
    }

    const btnExportKendaraan = document.getElementById('btn-export-kendaraan');
    if (btnExportKendaraan) {
        btnExportKendaraan.addEventListener('click', () => exportBookings('kendaraan'));
    }
}

async function exportAssets() {
    try {
        const filterType = document.getElementById('master-filter-type')?.value || 'all';
        
        const params = new URLSearchParams();
        if (filterType !== 'all') {
            params.append('type', filterType);
        }

        showLoadingToast('Mengexport data aset...');

        const url = `/api/assets/export/excel${params.toString() ? '?' + params.toString() : ''}`;
        window.location.href = url;

        setTimeout(() => {
            showSuccessToast('Export berhasil! File sedang didownload...');
        }, 500);

    } catch (error) {
        console.error('Export assets error:', error);
        showErrorToast('Gagal export aset: ' + error.message);
    }
}

async function exportBookings(type) {
    try {
        const monthFilter = document.getElementById(`filter-${type}-month`)?.value;
        
        const params = new URLSearchParams();
        params.append('type', type);
        
        if (monthFilter) {
            const [year, month] = monthFilter.split('-');
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            params.append('startDate', startDate.toISOString().split('T')[0]);
            params.append('endDate', endDate.toISOString().split('T')[0]);
        }

        showLoadingToast(`Mengexport data peminjaman ${type}...`);

        const url = `/api/bookings/export/excel?${params.toString()}`;
        window.location.href = url;

        setTimeout(() => {
            showSuccessToast('Export berhasil! File sedang didownload...');
        }, 500);

    } catch (error) {
        console.error('Export bookings error:', error);
        showErrorToast('Gagal export peminjaman: ' + error.message);
    }
}

function showLoadingToast(message) {
    removeToast();
    const toast = createToast(message, 'info');
    document.body.appendChild(toast);
}

function showSuccessToast(message) {
    removeToast();
    const toast = createToast(message, 'success');
    document.body.appendChild(toast);
    setTimeout(removeToast, 3000);
}

function showErrorToast(message) {
    removeToast();
    const toast = createToast(message, 'error');
    document.body.appendChild(toast);
    setTimeout(removeToast, 5000);
}

function createToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.id = 'export-toast';
    
    const colors = {
        info: 'bg-blue-100 border-blue-400 text-blue-700',
        success: 'bg-green-100 border-green-400 text-green-700',
        error: 'bg-red-100 border-red-400 text-red-700'
    };
    
    const icons = {
        info: '<i class="fas fa-info-circle"></i>',
        success: '<i class="fas fa-check-circle"></i>',
        error: '<i class="fas fa-exclamation-circle"></i>'
    };
    
    toast.className = `fixed top-4 right-4 ${colors[type]} border px-4 py-3 rounded z-50 shadow-lg`;
    toast.innerHTML = `
        ${icons[type]}
        <span class="ml-2">${message}</span>
        <button onclick="this.parentElement.remove()" class="float-right ml-4 font-bold">&times;</button>
    `;
    
    return toast;
}

function removeToast() {
    const existing = document.getElementById('export-toast');
    if (existing) existing.remove();
}
