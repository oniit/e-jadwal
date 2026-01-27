const API_BASE = window.location.origin;

import { openGedungModal } from './forms/gedung.js';
import { openKendaraanModal } from './forms/kendaraan.js';
import { openDriverModal } from './forms/driver.js';
import { openAssetModal } from './forms/asset.js';
import { resetGedungBarangForm } from './forms/gedung.js';

export function setupFormSubmitHandlers() {
    const gedungForm = document.getElementById('form-gedung');
    if (gedungForm) {
        gedungForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('gedung-booking-id').value || null;
            const useTime = document.getElementById('gedung-use-time').checked;
            const startDateVal = document.getElementById('gedung-mulai-tanggal').value;
            const endDateVal = document.getElementById('gedung-selesai-tanggal').value;
            const startTimeVal = document.getElementById('gedung-mulai-jam').value;
            const endTimeVal = document.getElementById('gedung-selesai-jam').value;
            let startDate;
            let endDate;
            if (useTime && startDateVal && endDateVal && startTimeVal && endTimeVal) {
                startDate = new Date(`${startDateVal}T${startTimeVal}`);
                endDate = new Date(`${endDateVal}T${endTimeVal}`);
            } else {
                startDate = startDateVal ? new Date(startDateVal) : null;
                endDate = endDateVal ? new Date(endDateVal) : null;
                if (endDate) endDate.setHours(23, 59, 59, 999);
            }
            
            const assetCode = document.getElementById('gedung-name').value;
            const state = window.__adminState || {};
            const assets = state.assets?.gedung || [];
            const selectedAsset = assets.find(a => a.code === assetCode);
            const assetName = selectedAsset ? selectedAsset.name : assetCode;
            
            const payload = {
                bookingType: 'gedung',
                userName: document.getElementById('gedung-peminjam').value,
                assetCode: assetCode,
                assetName: assetName,
                personInCharge: document.getElementById('gedung-penanggung-jawab').value,
                picPhoneNumber: document.getElementById('gedung-nomor-penanggung-jawab').value,
                activityName: document.getElementById('gedung-kegiatan').value,
                notes: document.getElementById('gedung-keterangan').value,
                startDate,
                endDate,
                borrowedItems: Array.from(gedungForm.__barangItems?.values?.() || [])
            };
            
            if (!payload.userName || !payload.assetCode || !payload.startDate || !payload.endDate) {
                alert('Nama peminjam, gedung, dan tanggal wajib diisi.');
                return;
            }
            
            try {
                const method = id ? 'PUT' : 'POST';
                const url = id ? `${API_BASE}/api/bookings/${id}` : `${API_BASE}/api/bookings`;
                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Gagal menyimpan');
                }
                
                alert(`Peminjaman gedung berhasil ${id ? 'diperbarui' : 'ditambahkan'}.`);
                document.getElementById('modal-form-gedung').classList.add('hidden');
                window.initializeApp?.();
            } catch (error) {
                alert(`Gagal: ${error.message}`);
            }
        });
    }
    
    const kendaraanForm = document.getElementById('form-kendaraan');
    if (kendaraanForm) {
        kendaraanForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('kendaraan-booking-id').value || null;
            
            const assetCode = document.getElementById('kendaraan-name').value;
            const state = window.__adminState || {};
            const assets = state.assets?.kendaraan || [];
            const selectedAsset = assets.find(a => a.code === assetCode);
            const assetName = selectedAsset ? selectedAsset.name : assetCode;
            
            const payload = {
                bookingType: 'kendaraan',
                userName: document.getElementById('kendaraan-peminjam').value,
                assetCode: assetCode,
                assetName: assetName,
                personInCharge: document.getElementById('kendaraan-penanggung-jawab').value,
                picPhoneNumber: document.getElementById('kendaraan-nomor-penanggung-jawab').value,
                destination: document.getElementById('kendaraan-tujuan').value,
                notes: document.getElementById('kendaraan-keterangan').value,
                driver: document.getElementById('kendaraan-supir').value || null,
                startDate: new Date(document.getElementById('kendaraan-mulai-tanggal').value),
                endDate: new Date(document.getElementById('kendaraan-selesai-tanggal').value)
            };
            
            if (!payload.userName || !payload.assetCode) {
                alert('Nama peminjam dan kendaraan wajib diisi.');
                return;
            }
            
            try {
                const method = id ? 'PUT' : 'POST';
                const url = id ? `${API_BASE}/api/bookings/${id}` : `${API_BASE}/api/bookings`;
                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Gagal menyimpan');
                }
                
                alert(`Peminjaman kendaraan berhasil ${id ? 'diperbarui' : 'ditambahkan'}.`);
                document.getElementById('modal-form-kendaraan').classList.add('hidden');
                window.initializeApp?.();
            } catch (error) {
                alert(`Gagal: ${error.message}`);
            }
        });
    }
    
    const driverForm = document.getElementById('form-driver');
    if (driverForm) {
        const handleDriverSubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('driver-id').value || null;
            const usernameField = document.getElementById('driver-username');
            const nameField = document.getElementById('driver-name');
            const emailField = document.getElementById('driver-email');
            const phoneField = document.getElementById('driver-phone');
            const statusField = document.getElementById('driver-status');
            
            const payload = {
                username: usernameField?.value?.trim() || '',
                name: nameField?.value?.trim() || '',
                email: emailField?.value?.trim() || '',
                phone: phoneField?.value?.trim() || ''
            };
            
            if (id && statusField && !document.getElementById('driver-status-wrapper').classList.contains('hidden')) {
                payload.isActive = statusField.value === 'true';
            }
            
            if (!payload.username || !payload.name || !payload.email) {
                alert('Username, nama, dan email supir wajib diisi.');
                return;
            }
            
            try {
                const method = id ? 'PUT' : 'POST';
                const url = id ? `${API_BASE}/api/drivers/${id}` : `${API_BASE}/api/drivers`;
                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Gagal menyimpan');
                }
                
                const result = await response.json();
                
                if (!id && result.password) {
                    const passwordDisplay = document.getElementById('driver-generated-password-display');
                    const passwordText = document.getElementById('driver-generated-password-text');
                    const copyBtn = document.getElementById('driver-copy-password-btn');
                    
                    if (passwordDisplay && passwordText) {
                        passwordText.textContent = result.password;
                        passwordDisplay.classList.remove('hidden');
                        
                        if (copyBtn) {
                            copyBtn.onclick = (e) => {
                                e.preventDefault();
                                navigator.clipboard.writeText(result.password);
                                alert('Password disalin ke clipboard');
                            };
                        }
                    }
                } else {
                    alert(`Supir berhasil ${id ? 'diperbarui' : 'ditambahkan'}.`);
                    document.getElementById('modal-form-driver').classList.add('hidden');
                    window.initializeApp?.();
                }
            } catch (error) {
                console.error('❌ Error:', error);
                alert(`Gagal: ${error.message}`);
            }
        };
        
        driverForm.addEventListener('submit', handleDriverSubmit);
    } else {
        console.warn('❌ Driver form not found');
    }
    
    const assetForm = document.getElementById('form-asset');
    if (assetForm) {
        assetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('asset-id').value || null;
            const payload = {
                name: document.getElementById('asset-name').value.trim(),
                type: document.getElementById('asset-type').value,
                detail: document.getElementById('asset-detail').value.trim(),
                plate: document.getElementById('asset-plate').value.trim() || '',
                jenis_bmn: document.getElementById('asset-jenis-bmn').value.trim() || '',
                kode_bmn: document.getElementById('asset-kode-bmn').value.trim() || ''
            };
            
            const numValue = document.getElementById('asset-num').value;
            if (numValue !== '') {
                payload.num = Number(numValue);
            }
            
            if (!payload.name) {
                alert('Nama aset wajib diisi.');
                return;
            }
            
            try {
                const method = id ? 'PUT' : 'POST';
                const url = id ? `${API_BASE}/api/assets/${id}` : `${API_BASE}/api/assets`;
                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Gagal menyimpan');
                }
                
                alert(`Aset berhasil ${id ? 'diperbarui' : 'ditambahkan'}.`);
                document.getElementById('modal-asset').classList.add('hidden');
                window.initializeApp?.();
            } catch (error) {
                alert(`Gagal: ${error.message}`);
            }
        });
    }
}

export function setupTableEventDelegation(getAdminState) {
    const requestTable = document.getElementById('request-list-table');
    if (requestTable) {
        requestTable.addEventListener('click', async (e) => {
            const row = e.target.closest('tr[data-request-id]');
            if (!row) return;
            const state = getAdminState();
            const req = state?.allRequestsCache?.find(r => r._id === row.dataset.requestId);
            if (req && window.showRequestDetail) {
                await window.showRequestDetail(req);
            }
        });
    }

    const gedungTable = document.getElementById('gedung-list-table');
    if (gedungTable) {
        gedungTable.addEventListener('click', async (e) => {
            const editBtn = e.target.closest('.btn-edit');
            const deleteBtn = e.target.closest('.btn-delete');
            const row = e.target.closest('tr[data-booking-id]');
            
            if (!row) return;
            
            if (editBtn) {
                const bookingId = row.dataset.bookingId;
                try {
                    const response = await fetch(`${API_BASE}/api/bookings/${bookingId}`, { credentials: 'include' });
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    const booking = await response.json();
                    openGedungModal(booking);
                } catch (error) {
                    console.error('Error loading booking:', error);
                    alert('Gagal memuat data: ' + error.message);
                }
            } else if (deleteBtn) {
                const bookingId = row.dataset.bookingId;
                if (confirm('Hapus peminjaman ini?')) {
                    try {
                        await fetch(`${API_BASE}/api/bookings/${bookingId}`, { method: 'DELETE', credentials: 'include' });
                        alert('Peminjaman berhasil dihapus.');
                        window.initializeApp?.();
                    } catch (error) {
                        alert('Gagal menghapus: ' + error.message);
                    }
                }
            } else if (!editBtn && !deleteBtn) {
                const state = getAdminState();
                const bookingData = state?.allBookingsCache?.find(b => b._id === row.dataset.bookingId);
                if (bookingData && window.showBookingDetail) {
                    window.showBookingDetail(bookingData, 'admin');
                }
            }
        });
    }
    
    const kendaraanTable = document.getElementById('kendaraan-list-table');
    if (kendaraanTable) {
        kendaraanTable.addEventListener('click', async (e) => {
            const editBtn = e.target.closest('.btn-edit');
            const deleteBtn = e.target.closest('.btn-delete');
            const row = e.target.closest('tr[data-booking-id]');
            
            if (!row) return;
            
            if (editBtn) {
                const bookingId = row.dataset.bookingId;
                try {
                    const response = await fetch(`${API_BASE}/api/bookings/${bookingId}`, { credentials: 'include' });
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    const booking = await response.json();
                    openKendaraanModal(booking);
                } catch (error) {
                    console.error('Error loading booking:', error);
                    alert('Gagal memuat data: ' + error.message);
                }
            } else if (deleteBtn) {
                const bookingId = row.dataset.bookingId;
                if (confirm('Hapus peminjaman ini?')) {
                    try {
                        await fetch(`${API_BASE}/api/bookings/${bookingId}`, { method: 'DELETE', credentials: 'include' });
                        alert('Peminjaman berhasil dihapus.');
                        window.initializeApp?.();
                    } catch (error) {
                        alert('Gagal menghapus: ' + error.message);
                    }
                }
            } else if (!editBtn && !deleteBtn) {
                const state = getAdminState();
                const bookingData = state?.allBookingsCache?.find(b => b._id === row.dataset.bookingId);
                if (bookingData && window.showBookingDetail) {
                    window.showBookingDetail(bookingData, 'admin');
                }
            }
        });
    }
    
    const driverTable = document.getElementById('driver-list-table');
    if (driverTable) {
        driverTable.addEventListener('click', async (e) => {
            const editBtn = e.target.closest('.btn-edit');
            const deleteBtn = e.target.closest('.btn-delete');
            const row = e.target.closest('tr[data-driver-id]');
            
            if (!row) return;
            
            if (editBtn) {
                const driverId = editBtn.dataset.id || row.dataset.driverId;
                try {
                    const response = await fetch(`${API_BASE}/api/drivers/${driverId}`, { credentials: 'include' });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const contentType = response.headers.get('content-type');
                    if (!contentType?.includes('application/json')) {
                        throw new Error('Server mengembalikan response yang bukan JSON');
                    }
                    const driver = await response.json();
                    openDriverModal(driver);
                } catch (error) {
                    console.error('Error:', error);
                    alert('Gagal memuat data supir: ' + error.message);
                }
            } else if (deleteBtn) {
                const driverId = deleteBtn.dataset.id || row.dataset.driverId;
                if (confirm('Hapus supir ini?')) {
                    try {
                        const response = await fetch(`${API_BASE}/api/drivers/${driverId}`, { method: 'DELETE', credentials: 'include' });
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        alert('Supir berhasil dihapus.');
                        window.initializeApp?.();
                    } catch (error) {
                        console.error('Error:', error);
                        alert('Gagal menghapus: ' + error.message);
                    }
                }
            }
        });
    }
    
    const masterTable = document.getElementById('master-asset-table');
    if (masterTable) {
        masterTable.addEventListener('click', async (e) => {
            const editBtn = e.target.closest('.btn-edit');
            const deleteBtn = e.target.closest('.btn-delete');
            const row = e.target.closest('tr[data-asset-id]');
            
            if (!row) return;
            
            if (editBtn) {
                const assetId = editBtn.dataset.id || row.dataset.assetId;
                try {
                    const response = await fetch(`${API_BASE}/api/assets/${assetId}`, { credentials: 'include' });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const contentType = response.headers.get('content-type');
                    if (!contentType?.includes('application/json')) {
                        throw new Error('Server mengembalikan response yang bukan JSON');
                    }
                    const asset = await response.json();
                    openAssetModal(asset);
                } catch (error) {
                    console.error('Error:', error);
                    alert('Gagal memuat data aset: ' + error.message);
                }
            } else if (deleteBtn) {
                const assetId = deleteBtn.dataset.id || row.dataset.assetId;
                if (confirm('Hapus aset ini?')) {
                    try {
                        const response = await fetch(`${API_BASE}/api/assets/${assetId}`, { method: 'DELETE', credentials: 'include' });
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        alert('Aset berhasil dihapus.');
                        window.initializeApp?.();
                    } catch (error) {
                        console.error('Error:', error);
                        alert('Gagal menghapus: ' + error.message);
                    }
                }
            }
        });
    }
}

export function setupModalCloseHandlers() {
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
        const closeBtn = modal.querySelector('.modal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
            });
        }
        
        const resetBtn = modal.querySelector('.modal-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const form = modal.querySelector('form');
                if (form) {
                    form.reset();
                    if (form.id === 'form-gedung') {
                        resetGedungBarangForm(form);
                    }
                }
            });
        }
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });
}

export function setupAddButtonHandlers() {
    const btnAddGedung = document.getElementById('btn-add-gedung');
    if (btnAddGedung) {
        btnAddGedung.addEventListener('click', () => openGedungModal());
    }
    
    const btnAddKendaraan = document.getElementById('btn-add-kendaraan');
    if (btnAddKendaraan) {
        btnAddKendaraan.addEventListener('click', () => openKendaraanModal());
    }
    
    const btnAddDriver = document.getElementById('btn-add-driver');
    if (btnAddDriver) {
        btnAddDriver.addEventListener('click', () => openDriverModal());
    }
    
    const btnAddAsset = document.getElementById('btn-add-asset');
    if (btnAddAsset) {
        btnAddAsset.addEventListener('click', () => openAssetModal());
    }
}
