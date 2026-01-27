export async function initializeExcelImport() {
    const btnImport = document.getElementById('btn-import-excel');
    const fileInput = document.getElementById('file-excel-import');

    if (!btnImport || !fileInput) return;

    btnImport.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            showError('File harus berformat Excel (.xlsx atau .xls)');
            return;
        }

        await uploadExcelFile(file);

        fileInput.value = '';
    });
}

async function uploadExcelFile(file) {
    const progressModal = createProgressModal();
    document.body.appendChild(progressModal);

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/assets/import/excel', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        progressModal.remove();

        if (!response.ok) {
            showError(result.message);
            return;
        }

        showImportResults(result);

    } catch (error) {
        progressModal.remove();
        showError(`Gagal upload file: ${error.message}`);
    }
}

function createProgressModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
        <div class="modal-content max-w-md text-center">
            <h3 class="text-xl font-bold mb-4 color-gedung">Mengimport Data...</h3>
            <div class="flex justify-center mb-4">
                <div class="animate-spin">
                    <i class="fas fa-spinner text-2xl color-kendaraan"></i>
                </div>
            </div>
            <p class="text-gray-600">Mohon tunggu, sedang memproses file Excel Anda...</p>
        </div>
    `;
    return modal;
}

function showImportResults(result) {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';

    const successColor = result.failed === 0 ? 'text-green-600' : 'text-orange-600';
    const errorItems = result.errors.slice(0, 10).map(err => `
        <div class="text-xs bg-red-50 p-2 rounded border border-red-200">
            <strong>Baris ${err.row}:</strong> ${Array.isArray(err.errors) ? err.errors.join(', ') : err.error}
        </div>
    `).join('');

    modal.innerHTML = `
        <div class="modal-content max-w-lg">
            <button class="modal-close-btn">&times;</button>
            <h3 class="text-2xl font-bold mb-4 ${successColor}">
                ${result.failed === 0 ? 'Import Berhasil!' : 'Import Selesai dengan Error'}
            </h3>
            <div class="space-y-4">
                <div class="grid grid-cols-3 gap-2 text-center">
                    <div class="bg-blue-50 p-3 rounded">
                        <div class="text-2xl font-bold color-kendaraan">${result.success}</div>
                        <div class="text-xs text-gray-600">Berhasil</div>
                    </div>
                    <div class="bg-green-50 p-3 rounded">
                        <div class="text-2xl font-bold text-green-600">${result.created.length}</div>
                        <div class="text-xs text-gray-600">Baru</div>
                    </div>
                    <div class="bg-yellow-50 p-3 rounded">
                        <div class="text-2xl font-bold text-yellow-600">${result.updated.length}</div>
                        <div class="text-xs text-gray-600">Update</div>
                    </div>
                </div>

                ${result.failed > 0 ? `
                    <div>
                        <h4 class="font-bold text-red-600 mb-2">Error (${result.failed}):</h4>
                        <div class="space-y-2 max-h-48 overflow-y-auto">
                            ${errorItems}
                            ${result.errors.length > 10 ? `<p class="text-xs text-gray-500">... dan ${result.errors.length - 10} error lainnya</p>` : ''}
                        </div>
                    </div>
                ` : ''}

                <p class="text-sm text-gray-600">
                    <i class="fas fa-check-circle text-green-600"></i> Total: ${result.total} baris, ${result.success} berhasil
                </p>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.modal-close-btn').addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function showError(message) {
    const alert = document.createElement('div');
    alert.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
    alert.innerHTML = `
        <strong>Error:</strong> ${message}
        <button onclick="this.parentElement.remove()" class="float-right font-bold">&times;</button>
    `;
    document.body.appendChild(alert);

}
