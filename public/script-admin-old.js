function initializeApp() {
    // --- STATE APLIKASI ---
    const state = {
        assets: {},
        allBookingsCache: [],
        allRequestsCache: [],
        selectedAssetFilter: 'all',
    };

    // --- KONSTANTA JAM GEDUNG ---
    const GEDUNG_START = '07:00';
    const GEDUNG_END = '16:00';

    // --- ELEMEN UI ---
    const elements = {
        contentAdmin: document.getElementById('content-admin'),
        adminTabRequest: document.getElementById('admin-tab-request'),
        adminTabGedung: document.getElementById('admin-tab-gedung'),
        adminTabKendaraan: document.getElementById('admin-tab-kendaraan'),
        adminTabDriver: document.getElementById('admin-tab-driver'),
        adminTabMaster: document.getElementById('admin-tab-master'),
        adminContentRequest: document.getElementById('admin-content-request'),
        adminContentGedung: document.getElementById('admin-content-gedung'),
        adminContentKendaraan: document.getElementById('admin-content-kendaraan'),
        adminContentDriver: document.getElementById('admin-content-driver'),
        adminContentMaster: document.getElementById('admin-content-master'),
        btnSearchBooking: document.getElementById('btn-search-booking'),
        btnAddGedung: document.getElementById('btn-add-gedung'),
        btnAddKendaraan: document.getElementById('btn-add-kendaraan'),
        btnAddDriver: document.getElementById('btn-add-driver'),
        btnAddAsset: document.getElementById('btn-add-asset'),
        modalFormGedung: document.getElementById('modal-form-gedung'),
        modalFormKendaraan: document.getElementById('modal-form-kendaraan'),
        modalFormDriver: document.getElementById('modal-form-driver'),
        modalDetailEvent: document.getElementById('modal-detail-event'),
        modalAsset: document.getElementById('modal-asset'),
        modalRequestAction: document.getElementById('modal-request-action'),
        formGedung: document.getElementById('form-gedung'),
        formKendaraan: document.getElementById('form-kendaraan'),
        formAsset: document.getElementById('form-asset'),
        formDriver: document.getElementById('form-driver'),
        gedungListTable: document.getElementById('gedung-list-table'),
        kendaraanListTable: document.getElementById('kendaraan-list-table'),
        driverListTable: document.getElementById('driver-list-table'),
        driverSearch: document.getElementById('filter-driver-search'),
        requestListTable: document.getElementById('request-list-table'),
        masterTable: document.getElementById('master-asset-table'),
        masterFilterType: document.getElementById('master-filter-type'),
        masterSearch: document.getElementById('master-search'),
        filtersGedung: document.getElementById('filters-gedung'),
        filtersKendaraan: document.getElementById('filters-kendaraan'),
        filtersRequest: document.getElementById('filters-request'),
        modalTitle: document.getElementById('modal-title'),
        modalBody: document.getElementById('modal-body'),
        modalRequestTitle: document.getElementById('modal-request-title'),
        modalRequestBody: document.getElementById('modal-request-body'),
        gedungFormTitle: document.getElementById('gedung-form-title'),
        kendaraanFormTitle: document.getElementById('kendaraan-form-title'),
        driverFormTitle: document.getElementById('driver-form-title'),
        assetFormTitle: document.getElementById('asset-form-title'),
        assetIdInput: document.getElementById('asset-id'),
        assetKodeInput: document.getElementById('asset-kode'),
        assetNamaInput: document.getElementById('asset-nama'),
        assetTipeInput: document.getElementById('asset-tipe'),
        assetDetailInput: document.getElementById('asset-detail'),
        assetNumInput: document.getElementById('asset-num'),
        assetNumWrapper: document.getElementById('asset-num-wrapper'),
    };
    elements.allModals = [elements.modalFormGedung, elements.modalFormKendaraan, elements.modalDetailEvent, elements.modalAsset, elements.modalRequestAction];

    // --- API HELPER ---
    const api = {
        fetch: async function(url, options = {}) {
            try {
                const response = await fetch(url, options);
                const isJson = response.headers.get('content-type')?.includes('application/json');
                const data = isJson ? await response.json() : await response.text();
                if (!response.ok) {
                    const error = (data && data.message) || response.statusText;
                    throw new Error(error);
                }
                return data;
            } catch (error) {
                console.error('API Error:', error);
                throw new Error(error.message || 'Operasi gagal, server tidak merespon.');
            }
        },
        fetchAssets: () => api.fetch('/api/assets', { cache: 'no-store' }),
        fetchDrivers: () => api.fetch('/api/drivers', { cache: 'no-store' }),
        fetchAllBookings: () => api.fetch('/api/bookings'),
        fetchBookingByCode: (code) => api.fetch(`/api/bookings/by-code/${code}`),
        saveBooking: (data, id) => {
            const url = id ? `/api/bookings/${id}` : '/api/bookings';
            const method = id ? 'PUT' : 'POST';
            return api.fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        },
        deleteBooking: (id) => api.fetch(`/api/bookings/${id}`, { method: 'DELETE' }),
        saveAsset: (data, id) => {
            const url = id ? `/api/assets/${id}` : '/api/assets';
            const method = id ? 'PUT' : 'POST';
            return api.fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        },
        deleteAsset: (id) => api.fetch(`/api/assets/${id}`, { method: 'DELETE' }),
        saveDriver: (data, id) => {
            const url = id ? `/api/drivers/${id}` : '/api/drivers';
            const method = id ? 'PUT' : 'POST';
            return api.fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        },
        deleteDriver: (id) => api.fetch(`/api/drivers/${id}`, { method: 'DELETE' }),
        fetchAllRequests: () => api.fetch('/api/requests'),
        fetchRequestByCode: (code) => api.fetch(`/api/requests/by-code/${code}`),
        createRequest: (data) => api.fetch('/api/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
        approveRequest: (id, approvedBy, driver) => api.fetch(`/api/requests/${id}/approve`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approvedBy, driver }) }),
        rejectRequest: (id, rejectionReason) => api.fetch(`/api/requests/${id}/reject`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rejectionReason }) }),
        deleteRequest: (id) => api.fetch(`/api/requests/${id}`, { method: 'DELETE' }),
    };

    // --- UI HELPER ---
    const ui = {
        renderBookingList: function(type, bookings) {
            const tableBody = elements[`${type}ListTable`];
            if (!tableBody) {
                console.warn(`❌ Table element not found for type: ${type}, key: ${type}ListTable`);
                return;
            }
            console.log(`📊 Rendering ${type} table with ${bookings.length} bookings`);
            tableBody.innerHTML = '';
            const sortedBookings = [...bookings].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
            if (sortedBookings.length === 0) {
                const colspan = type === 'gedung' ? 7 : 8;
                tableBody.innerHTML = `<tr><td colspan="${colspan}" class="text-center py-4 text-gray-500">Tidak ada data untuk filter ini.</td></tr>`;
                return;
            }
            tableBody.innerHTML = sortedBookings.map(b => {
                const cellClass = "px-6 py-3 whitespace-nowrap text-sm text-gray-500";
                const startDate = new Date(b.startDate);
                const endDate = new Date(b.endDate);
                let tanggal = startDate.toLocaleDateString('id-ID');
                if (startDate.toDateString() !== endDate.toDateString()) {
                    tanggal += ` - ${endDate.toLocaleDateString('id-ID')}`;
                }
                const createdDate = b.createdAt ? new Date(b.createdAt).toLocaleDateString('id-ID') : '-';
                if (type === 'gedung') {
                    return `
                        <tr class="table-row" data-booking-id="${b._id}">
                            <td class="${cellClass}">${createdDate}</td>
                            <td class="${cellClass} font-medium text-gray-900">${b.assetName}</td>
                            <td class="${cellClass}">${b.userName}</td>
                            <td class="${cellClass}">${tanggal}</td>
                            <td class="${cellClass}">${ui.formatBorrowedItemsForDisplay(b.borrowedItems)}</td>
                            <td class="${cellClass}">${b.notes || '-'}</td>
                            <td class="${cellClass} text-right">
                                <button><i class="fas fa-edit btn btn-edit" data-id="${b._id}"></i></button>
                                <button><i class="fas fa-trash btn btn-delete" data-id="${b._id}"></i></button>
                            </td>
                        </tr>
                    `;
                } else {
                    return `
                        <tr class="table-row" data-booking-id="${b._id}">
                            <td class="${cellClass}">${createdDate}</td>
                            <td class="${cellClass} font-medium text-gray-900">${b.assetName}</td>
                            <td class="${cellClass}">${b.userName}</td>
                            <td class="${cellClass}">${tanggal}</td>
                            <td class="${cellClass}">${typeof b.driver === 'object' && b.driver ? b.driver.nama : (b.driver || '-')}</td>
                            <td class="${cellClass}">${b.notes || '-'}</td>
                            <td class="${cellClass} text-right">
                                <button><i class="fas fa-edit btn btn-edit" data-id="${b._id}"></i></button>
                                <button><i class="fas fa-trash btn btn-delete" data-id="${b._id}"></i></button>
                            </td>
                        </tr>
                    `;
                }
            }).join('');
        },
        renderRequestList: function(requests) {
            const tableBody = elements.requestListTable;
            if (!tableBody) {
                console.warn('❌ Request table element not found');
                return;
            }
            console.log(`📊 Rendering request table with ${requests.length} requests`);
            tableBody.innerHTML = '';
            const sortedRequests = [...requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            if (sortedRequests.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-gray-500">Tidak ada data untuk filter ini.</td></tr>`;
                return;
            }
            tableBody.innerHTML = sortedRequests.map(r => {
                const cellClass = "px-6 py-3 whitespace-nowrap text-sm text-gray-500";
                const createdDate = r.createdAt ? new Date(r.createdAt).toLocaleDateString('id-ID') : '-';
                const startDate = new Date(r.startDate);
                const endDate = new Date(r.endDate);
                let tanggal = startDate.toLocaleDateString('id-ID');
                if (startDate.toDateString() !== endDate.toDateString()) {
                    tanggal += ` - ${endDate.toLocaleDateString('id-ID')}`;
                }
                const statusColor = r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                   r.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
                const statusLabel = r.status === 'pending' ? 'Pending' : 
                                   r.status === 'approved' ? 'Diterima' : 'Ditolak';
                return `
                    <tr class="table-row" data-request-id="${r._id}">
                        <td class="${cellClass}">${createdDate}</td>
                        <td class="${cellClass}">${r.bookingType === 'gedung' ? 'Gedung' : 'Kendaraan'}</td>
                        <td class="${cellClass} font-medium text-gray-900">${r.assetName}</td>
                        <td class="${cellClass}">${r.userName}</td>
                        <td class="${cellClass}">${tanggal}</td>
                        <td class="${cellClass}"><span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${statusColor}">${statusLabel}</span></td>
                        <td class="${cellClass} text-right">
                            ${r.status === 'pending' ? `<button><i class="fas fa-check btn btn-approve" data-id="${r._id}"></i></button>
                            <button><i class="fas fa-times btn btn-reject" data-id="${r._id}"></i></button>` : ''}
                            <button><i class="fas fa-eye btn btn-view" data-id="${r._id}"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');
        },
        renderDriverList: function(drivers) {
            const tableBody = elements.driverListTable;
            if (!tableBody) {
                console.warn('❌ Driver table element not found');
                return;
            }
            console.log(`📊 Rendering driver table with ${drivers.length} drivers`);
            tableBody.innerHTML = '';
            const sortedDrivers = [...drivers].sort((a, b) => a.kode.localeCompare(b.kode));
            if (sortedDrivers.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">Tidak ada supir.</td></tr>`;
                return;
            }
            tableBody.innerHTML = sortedDrivers.map(d => {
                const cellClass = "px-6 py-3 whitespace-nowrap text-sm text-gray-500";
                return `
                    <tr class="table-row" data-driver-id="${d._id}">
                        <td class="${cellClass} font-medium text-gray-900">${d.kode}</td>
                        <td class="${cellClass}">${d.nama}</td>
                        <td class="${cellClass}">${d.noTelp || '-'}</td>
                        <td class="${cellClass}">${d.detail || '-'}</td>
                        <td class="${cellClass} text-right">
                            <button><i class="fas fa-edit btn btn-edit" data-id="${d._id}"></i></button>
                            <button><i class="fas fa-trash btn btn-delete" data-id="${d._id}"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');
        },
        renderForms: function() {
            const commonFormHtml = (type) => `
                <input type="hidden" id="${type}-booking-id">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label for="${type}-peminjam" class="form-label text-sm">Nama Peminjam / Unit</label>
                    <input type="text" id="${type}-peminjam" required class="form-input"></div>
                    <div><label for="${type}-nama" class="form-label text-sm">Nama ${type === 'gedung' ? 'Gedung' : 'Kendaraan'}</label>
                    <select id="${type}-nama" required class="form-input"></select></div>
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
            if (elements.formGedung) {
                elements.formGedung.innerHTML = commonFormHtml('gedung') + gedungExtraFields;
            }
            if (elements.formKendaraan) {
                elements.formKendaraan.innerHTML = commonFormHtml('kendaraan') + kendaraanExtraFields;
            }
            if (elements.formAsset) {
                elements.formAsset.innerHTML = `
                    <input type="hidden" id="asset-id">
                    <div>
                        <label for="asset-kode" class="form-label text-sm">Kode</label>
                        <input id="asset-kode" type="text" required class="form-input" placeholder="Misal: G-01">
                    </div>
                    <div>
                        <label for="asset-nama" class="form-label text-sm">Nama</label>
                        <input id="asset-nama" type="text" required class="form-input" placeholder="Nama aset">
                    </div>
                    <div>
                        <label for="asset-tipe" class="form-label text-sm">Tipe</label>
                        <select id="asset-tipe" required class="form-input">
                            <option value="gedung">Gedung</option>
                            <option value="kendaraan">Kendaraan</option>
                            <option value="barang">Barang</option>
                        </select>
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
                elements.assetIdInput = elements.formAsset.querySelector('#asset-id');
                elements.assetKodeInput = elements.formAsset.querySelector('#asset-kode');
                elements.assetNamaInput = elements.formAsset.querySelector('#asset-nama');
                elements.assetTipeInput = elements.formAsset.querySelector('#asset-tipe');
                elements.assetDetailInput = elements.formAsset.querySelector('#asset-detail');
                elements.assetNumInput = elements.formAsset.querySelector('#asset-num');
                elements.assetNumWrapper = elements.formAsset.querySelector('#asset-num-wrapper');
                setAssetNumVisibility(elements.assetTipeInput ? elements.assetTipeInput.value : 'gedung');
            }
        },
        formatBorrowedItemsForDisplay: function(borrowedItems) {
            if (!borrowedItems) return '-';
            if (Array.isArray(borrowedItems) && borrowedItems.length) {
                return borrowedItems.map(it => `${it.assetName}: ${it.quantity}`).join(', ');
            }
            if (typeof borrowedItems === 'string' && borrowedItems.trim()) return borrowedItems;
            return '-';
        },
        populateDropdowns: function(assets, unavailable = {}) {
            const populate = (select, items, unavailableItems) => {
                const currentValue = select.value;
                select.innerHTML = '';
                items.forEach(item => {
                    const option = new Option(item.nama, item.kode);
                    if (unavailableItems?.has(item.kode)) {
                        option.disabled = true;
                        option.textContent += ' (Tidak Tersedia)';
                    }
                    select.add(option);
                });
                select.value = currentValue;
            };
            populate(elements.formGedung.querySelector('#gedung-nama'), assets.gedung, unavailable.assets);
            populate(elements.formKendaraan.querySelector('#kendaraan-nama'), assets.kendaraan, unavailable.assets);
            const supirSelect = elements.formKendaraan.querySelector('#kendaraan-supir');
            const currentSupir = supirSelect.value;
            supirSelect.innerHTML = '<option value="">Tanpa Supir</option>';
            (state.drivers || []).forEach(s => {
                const option = new Option(s.nama, s._id);
                if (unavailable.drivers?.has(s._id)) {
                    option.disabled = true;
                    option.textContent += ' (Tidak Tersedia)';
                }
                supirSelect.add(option);
            });
            supirSelect.value = currentSupir;
        },
        populateBarangSelector: function(assetsBarang, availabilityMap = null) {
            const select = elements.formGedung.querySelector('#gedung-barang-select');
            if (!select) return;
            const current = select.value;
            select.innerHTML = '';
            assetsBarang.forEach(b => {
                const available = availabilityMap ? (availabilityMap.get(b.kode) ?? b.num ?? 0) : (b.num ?? 0);
                const option = new Option(`${b.nama} (stok: ${available})`, b.kode);
                option.disabled = available <= 0;
                select.add(option);
            });
            if (current) select.value = current;
        },
        populateAdminFilters: function(type, assets) {
            const assetSelect = elements.filtersGedung?.querySelector('#filter-gedung-asset');
            const barangSelect = elements.filtersGedung?.querySelector('#filter-gedung-barang');
            const vehicleSelect = elements.filtersKendaraan?.querySelector('#filter-kendaraan-asset');
            const driverSelect = elements.filtersKendaraan?.querySelector('#filter-kendaraan-driver');
            if (type === 'gedung') {
                if (assetSelect) {
                    assetSelect.innerHTML = '<option value="all">Semua Gedung</option>';
                    assets.gedung.forEach(g => assetSelect.add(new Option(g.nama, g.kode)));
                }
                if (barangSelect) {
                    barangSelect.innerHTML = '<option value="all">Semua Barang</option>';
                    (assets.barang || []).forEach(b => barangSelect.add(new Option(b.nama, b.kode)));
                }
            } else {
                if (vehicleSelect) {
                    vehicleSelect.innerHTML = '<option value="all">Semua Kendaraan</option>';
                    assets.kendaraan.forEach(k => vehicleSelect.add(new Option(k.nama, k.kode)));
                }
                if (driverSelect) {
                    driverSelect.innerHTML = '<option value="all">Semua Supir</option>';
                    (state.drivers || []).forEach(s => driverSelect.add(new Option(s.nama, s._id)));
                }
            }
        },
        showDetailModal: function(props, context = 'admin') {
            let assetDisplay = props.assetName;
            if (props.bookingType === 'kendaraan') {
                const kendaraan = state.assets.kendaraan.find(k => k.nama === props.assetName);
                const kode = kendaraan && kendaraan.kode ? kendaraan.kode : '';
                assetDisplay = kode ? `${props.assetName} (${kode})` : props.assetName;
            }
            elements.modalTitle.innerText = `${assetDisplay}`;
            const start = new Date(props.startDate);
            const end = new Date(props.endDate);
            const waktuText = formatRangeForModal(start, end);
            
            let detailsHtml = `<p>${waktuText}</p>`;
            
            if (props.bookingId) {
                detailsHtml += `<p><strong>Booking ID:</strong> <code class="bg-gray-100 px-2 py-1 rounded text-sm">${props.bookingId}</code></p>`;
            }
            
            detailsHtml += `<p><strong>Peminjam:</strong> ${props.userName}</p>`;
            
            if (context === 'admin') {
                if (props.personInCharge) {
                    detailsHtml += `<p><strong>Penanggung Jawab:</strong> ${props.personInCharge}</p>`;
                }
                if (props.picPhoneNumber) {
                    detailsHtml += `<p><strong>No. Telepon:</strong> ${props.picPhoneNumber}</p>`;
                }
                if (props.bookingType === 'gedung') {
                    if (props.activityName) {
                        detailsHtml += `<p><strong>Kegiatan:</strong> ${props.activityName}</p>`;
                    }
                    if (props.borrowedItems && props.borrowedItems.length > 0) {
                        detailsHtml += `<p><strong>Barang Dipinjam:</strong></p><ul class="ml-4 list-disc">`;
                        props.borrowedItems.forEach(item => {
                            detailsHtml += `<li>${item.assetName} (${item.assetCode}) - ${item.quantity} unit</li>`;
                        });
                        detailsHtml += `</ul>`;
                    }
                } else if (props.bookingType === 'kendaraan') {
                    if (props.destination) {
                        detailsHtml += `<p><strong>Tujuan:</strong> ${props.destination}</p>`;
                    }
                    if (props.driver && (typeof props.driver === 'object' ? props.driver.nama : props.driver)) {
                        const driverName = typeof props.driver === 'object' ? props.driver.nama : props.driver;
                        detailsHtml += `<p><strong>Supir:</strong> ${driverName}</p>`;
                    }
                }
                if (props.notes) {
                    detailsHtml += `<p><strong>Keterangan:</strong> ${props.notes}</p>`;
                }
                
                if (props.letterFile) {
                    detailsHtml += `<p><strong>Surat:</strong> <a href="/api/requests/download-surat/${props.letterFile}" target="_blank" class="text-blue-500 underline">Download Surat</a></p>`;
                }
            }
            
            elements.modalBody.innerHTML = detailsHtml;
            elements.modalDetailEvent.classList.remove('hidden');
        },
        formatDateShort: (d) => {
            const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
            const day = String(d.getDate()).padStart(2, '0');
            const mon = months[d.getMonth()];
            const year = d.getFullYear();
            return `${day} ${mon} ${year}`;
        },
        formatTimeDot: (d) => {
            const hh = String(d.getHours()).padStart(2, '0');
            const mm = String(d.getMinutes()).padStart(2, '0');
            return `${hh}.${mm}`;
        }
    };

    function formatRangeForModal(start, end) {
        const sameDay = start.toDateString() === end.toDateString();
        const dateStart = ui.formatDateShort(start);
        const timeStart = ui.formatTimeDot(start);
        const dateEnd = ui.formatDateShort(end);
        const timeEnd = ui.formatTimeDot(end);
        if (sameDay) {
            return `${dateStart}, ${timeStart}-${timeEnd} WIB`;
        }
        return `${dateStart}, ${timeStart} WIB - ${dateEnd}, ${timeEnd} WIB`;
    }

    const flattenAssets = () => {
        if (!state.assets) return [];
        const { gedung = [], kendaraan = [], barang = [] } = state.assets;
        return [...gedung, ...kendaraan, ...barang];
    };

    function renderMasterTable() {
        if (!elements.masterTable) return;
        const typeFilter = elements.masterFilterType ? elements.masterFilterType.value : 'all';
        const search = elements.masterSearch ? elements.masterSearch.value.trim().toLowerCase() : '';

        const filtered = flattenAssets().filter((asset) => {
            const matchType = typeFilter === 'all' || asset.tipe === typeFilter;
            const matchSearch = !search || asset.kode.toLowerCase().includes(search) || asset.nama.toLowerCase().includes(search);
            return matchType && matchSearch;
        }).sort((a, b) => a.nama.localeCompare(b.nama, 'id'));

        if (!filtered.length) {
            elements.masterTable.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">Belum ada data untuk filter ini.</td></tr>';
            return;
        }

        elements.masterTable.innerHTML = filtered.map((asset) => {
            const cellClass = "px-6 py-3 whitespace-nowrap text-sm text-gray-700";
            const badgeClass = "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700";
            const detailDisplay = asset.detail || '-';
            return `
                <tr class="table-row" data-asset-id="${asset._id}">
                    <td class="${cellClass}">${asset.kode}</td>
                    <td class="${cellClass} font-medium text-gray-900">${asset.nama}</td>
                    <td class="${cellClass}"><span class="${badgeClass}">${asset.tipe}</span></td>
                    <td class="${cellClass}">${asset.num ?? '-'}</td>
                    <td class="${cellClass}">${detailDisplay}</td>
                    <td class="${cellClass} text-right">
                        <button title="Edit"><i class="fas fa-edit btn btn-edit" data-id="${asset._id}"></i></button>
                        <button title="Hapus"><i class="fas fa-trash btn btn-delete" data-id="${asset._id}"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function setAssetNumVisibility(tipe) {
        if (!elements.assetNumWrapper) return;
        const show = tipe === 'barang' || tipe === 'kendaraan';
        elements.assetNumWrapper.classList.toggle('hidden', !show);
        if (elements.assetNumInput) {
            elements.assetNumInput.placeholder = tipe === 'barang' ? 'Qty (misal: 40)' : 'Max penumpang (misal: 15)';
        }
    }

    function openAssetModal(asset = null) {
        if (!elements.formAsset || !elements.modalAsset) return;
        if (!elements.assetKodeInput || !elements.assetNamaInput || !elements.assetTipeInput) {
            ui.renderForms();
        }
        elements.formAsset.reset();
        elements.assetIdInput.value = asset?._id || '';
        elements.assetKodeInput.value = asset?.kode || '';
        elements.assetNamaInput.value = asset?.nama || '';
        elements.assetTipeInput.value = asset?.tipe || 'gedung';
        elements.assetNumInput.value = asset?.num ?? '';
        elements.assetDetailInput.value = asset?.detail || '';
        elements.assetFormTitle.innerText = asset ? 'Edit Aset' : 'Tambah Aset';
        setAssetNumVisibility(elements.assetTipeInput.value);
        elements.modalAsset.classList.remove('hidden');
    }

    async function handleAssetSubmit(event) {
        event.preventDefault();
        const id = elements.assetIdInput.value || null;
        const payload = {
            kode: elements.assetKodeInput.value.trim(),
            nama: elements.assetNamaInput.value.trim(),
            tipe: elements.assetTipeInput.value,
            detail: elements.assetDetailInput.value.trim(),
            num: elements.assetNumInput && elements.assetNumInput.value !== '' ? Number(elements.assetNumInput.value) : undefined,
        };

        if (payload.num !== undefined && !Number.isFinite(payload.num)) {
            alert('Nilai angka tidak valid.');
            return;
        }

        if (!payload.kode || !payload.nama) {
            alert('Kode dan Nama wajib diisi.');
            return;
        }

        try {
            await api.saveAsset(payload, id);
            alert(`Aset berhasil ${id ? 'diperbarui' : 'ditambahkan'}.`);
            elements.modalAsset.classList.add('hidden');
            await refreshAssets();
        } catch (error) {
            alert(`Gagal menyimpan aset: ${error.message}`);
        }
    }

    async function handleAssetDelete(id) {
        if (!id) return;
        if (!confirm('Hapus aset ini? Data yang berkaitan tidak akan otomatis diperbarui.')) return;
        try {
            await api.deleteAsset(id);
            alert('Aset berhasil dihapus.');
            await refreshAssets();
        } catch (error) {
            alert(`Gagal menghapus aset: ${error.message}`);
        }
    }

    function openDriverModal(driver = null) {
        const modalHtml = `
            <div class="modal-content p-6 rounded-lg shadow-xl max-w-md mx-auto">
                <h3 class="text-xl font-bold mb-4">${driver ? 'Edit Supir' : 'Tambah Supir'}</h3>
                <form id="form-driver">
                    <input type="hidden" id="driver-id" value="${driver?._id || ''}">
                    <div class="mb-3">
                        <label for="driver-kode" class="form-label">Kode</label>
                        <input type="text" id="driver-kode" class="form-input" required value="${driver?.kode || ''}">
                    </div>
                    <div class="mb-3">
                        <label for="driver-nama" class="form-label">Nama</label>
                        <input type="text" id="driver-nama" class="form-input" required value="${driver?.nama || ''}">
                    </div>
                    <div class="mb-3">
                        <label for="driver-notelp" class="form-label">No. Telepon</label>
                        <input type="text" id="driver-notelp" class="form-input" value="${driver?.noTelp || ''}">
                    </div>
                    <div class="mb-3">
                        <label for="driver-detail" class="form-label">Detail</label>
                        <textarea id="driver-detail" class="form-input" rows="2">${driver?.detail || ''}</textarea>
                    </div>
                    <div class="flex gap-2">
                        <button type="submit" class="flex-1 add-btn">Simpan</button>
                        <button type="button" class="flex-1 cancel-btn" onclick="this.closest('.modal-content').parentElement.remove()">Batal</button>
                    </div>
                </form>
            </div>
        `;
        
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modalOverlay.innerHTML = modalHtml;
        document.body.appendChild(modalOverlay);
        
        modalOverlay.querySelector('#form-driver').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('driver-id').value || null;
            const payload = {
                kode: document.getElementById('driver-kode').value.trim(),
                nama: document.getElementById('driver-nama').value.trim(),
                noTelp: document.getElementById('driver-notelp').value.trim(),
                detail: document.getElementById('driver-detail').value.trim()
            };
            
            if (!payload.kode || !payload.nama) {
                alert('Kode dan Nama wajib diisi.');
                return;
            }
            
            try {
                await api.saveDriver(payload, id);
                alert(`Supir berhasil ${id ? 'diperbarui' : 'ditambahkan'}.`);
                modalOverlay.remove();
                await refreshAssets();
            } catch (error) {
                alert(`Gagal menyimpan supir: ${error.message}`);
            }
        });
        
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) modalOverlay.remove();
        });
    }

    async function handleDriverDelete(id) {
        if (!id) return;
        if (!confirm('Hapus supir ini? Data yang berkaitan tidak akan otomatis diperbarui.')) return;
        try {
            await api.deleteDriver(id);
            alert('Supir berhasil dihapus.');
            await refreshAssets();
        } catch (error) {
            alert(`Gagal menghapus supir: ${error.message}`);
        }
    }

    async function refreshAssets(prefetched = null) {
        const assets = prefetched || await api.fetchAssets();
        state.assets = assets || { gedung: [], kendaraan: [], barang: [] };
        
        // Fetch drivers separately
        const drivers = await api.fetchDrivers();
        state.drivers = drivers || [];

        if (elements.formGedung && elements.formKendaraan) {
            ui.populateDropdowns(state.assets, {});
        }
        if (elements.filtersGedung && elements.filtersKendaraan) {
            ui.populateAdminFilters('gedung', state.assets);
            ui.populateAdminFilters('kendaraan', state.assets);
        }

        renderMasterTable();
    }

    // --- FUNGSI UTAMA ---
    function updateAvailableAssets(type) {
        const form = elements[type === 'gedung' ? 'formGedung' : 'formKendaraan'];
        const useTime = form.querySelector(`#${type}-use-time`).checked;
        const startDateInput = form.querySelector(`#${type}-mulai-tanggal`);
        const endDateInput = form.querySelector(`#${type}-selesai-tanggal`);
        const startTimeInput = form.querySelector(`#${type}-mulai-jam`);
        const endTimeInput = form.querySelector(`#${type}-selesai-jam`);

        const currentBookingId = form.elements[`${type}-booking-id`]?.value;
        
        let start, end;
        if (useTime) {
            if (type === 'gedung' && startDateInput.value && endDateInput.value && (!startTimeInput.value || !endTimeInput.value)) {
                start = new Date(`${startDateInput.value}T${GEDUNG_START}`);
                end = new Date(`${endDateInput.value}T${GEDUNG_END}`);
            } else {
                if (!startDateInput.value || !endDateInput.value || !startTimeInput.value || !endTimeInput.value) {
                    ui.populateDropdowns(state.assets, {});
                    return;
                }
                start = new Date(`${startDateInput.value}T${startTimeInput.value}`);
                end = new Date(`${endDateInput.value}T${endTimeInput.value}`);
            }
        } else {
            if (!startDateInput.value || !endDateInput.value) {
                ui.populateDropdowns(state.assets, {});
                return;
            }
            start = new Date(`${startDateInput.value}T${GEDUNG_START}`);
            end = new Date(`${endDateInput.value}T${GEDUNG_END}`);
        }

        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
            ui.populateDropdowns(state.assets, {});
            return;
        }

        const unavailable = { assets: new Set(), drivers: new Set() };
        state.allBookingsCache.forEach(booking => {
            if (booking._id === currentBookingId) return;
            const bookingStart = new Date(booking.startDate);
            const bookingEnd = new Date(booking.endDate);
            if (start < bookingEnd && end > bookingStart) {
                if (booking.bookingType === type) unavailable.assets.add(booking.assetCode);
                if (booking.bookingType === 'kendaraan' && booking.driver) {
                    const driverId = typeof booking.driver === 'object' ? booking.driver._id : booking.driver;
                    if (driverId) unavailable.drivers.add(driverId);
                }
            }
        });
        ui.populateDropdowns(state.assets, unavailable);
        if (type === 'gedung') {
            updateBarangAvailability();
        }
    }

    // Mendapatkan supir yang tidak tersedia pada rentang waktu tertentu
    function getUnavailableDriversForRange(start, end) {
        const unavailable = new Set();
        state.allBookingsCache.forEach(booking => {
            const bookingStart = new Date(booking.startDate);
            const bookingEnd = new Date(booking.endDate);
            // Cek overlap
            if (start < bookingEnd && end > bookingStart) {
                if (booking.bookingType === 'kendaraan' && booking.driver) {
                    const driverId = typeof booking.driver === 'object' ? booking.driver._id : booking.driver;
                    if (driverId) unavailable.add(driverId);
                }
            }
        });
        return unavailable;
    }

    function computeBarangAvailability(start, end, excludeBookingId = null) {
        const used = new Map();
        state.allBookingsCache.forEach(b => {
            if (excludeBookingId && b._id === excludeBookingId) return;
            const bs = new Date(b.startDate);
            const be = new Date(b.endDate);
            if (!(start < be && end > bs)) return;
            if (!Array.isArray(b.borrowedItems)) return;
            b.borrowedItems.forEach(it => {
                const c = it.assetCode;
                const q = Number(it.quantity || 0);
                if (!c || !Number.isFinite(q) || q <= 0) return;
                used.set(c, (used.get(c) || 0) + q);
            });
        });
        const availability = new Map();
        (state.assets.barang || []).forEach(b => {
            const max = Number(b.num || 0);
            const u = used.get(b.kode) || 0;
            availability.set(b.kode, Math.max(0, max - u));
        });
        return availability;
    }

    function updateBarangAvailability() {
        const form = elements.formGedung;
        if (!form) return;
        const useTime = form.querySelector('#gedung-use-time').checked;
        const startDateInput = form.querySelector('#gedung-mulai-tanggal');
        const endDateInput = form.querySelector('#gedung-selesai-tanggal');
        const startTimeInput = form.querySelector('#gedung-mulai-jam');
        const endTimeInput = form.querySelector('#gedung-selesai-jam');
        const bookingId = form.elements['gedung-booking-id']?.value || null;

        let start, end;
        if (useTime) {
            if (!startDateInput.value || !endDateInput.value || !startTimeInput.value || !endTimeInput.value) {
                ui.populateBarangSelector(state.assets.barang || []);
                form.__barangAvailability = null;
                setBarangQtyMax(form, null);
                return;
            }
            start = new Date(`${startDateInput.value}T${startTimeInput.value}`);
            end = new Date(`${endDateInput.value}T${endTimeInput.value}`);
        } else {
            if (!startDateInput.value || !endDateInput.value) {
                ui.populateBarangSelector(state.assets.barang || []);
                form.__barangAvailability = null;
                setBarangQtyMax(form, null);
                return;
            }
            start = new Date(startDateInput.value);
            end = new Date(endDateInput.value);
            end.setHours(23,59,59,999);
        }
        if (isNaN(start) || isNaN(end) || start >= end) {
            ui.populateBarangSelector(state.assets.barang || []);
            form.__barangAvailability = null;
            setBarangQtyMax(form, null);
            return;
        }
        const availability = computeBarangAvailability(start, end, bookingId);
        const items = form.__barangItems ? [...form.__barangItems.values()] : [];
        items.forEach(it => {
            const cur = availability.get(it.assetCode) ?? 0;
            availability.set(it.assetCode, Math.max(0, cur - Number(it.quantity || 0)));
        });
        form.__barangAvailability = availability;
        ui.populateBarangSelector(state.assets.barang || [], availability);
        setBarangQtyMax(form, availability);
    }

    function setBarangQtyMax(form, availabilityMap) {
        const select = form.querySelector('#gedung-barang-select');
        const qtyInput = form.querySelector('#gedung-barang-qty');
        if (!select || !qtyInput) return;
        const code = select.value || null;
        let max = 0;
        if (availabilityMap && code) {
            max = availabilityMap.get(code) ?? 0;
        }
        if (max < 0) max = 0;
        qtyInput.max = String(max);
        qtyInput.placeholder = max > 0 ? `Qty (maks: ${max})` : 'Qty';
        if (qtyInput.value) {
            const v = Number(qtyInput.value);
            if (Number.isFinite(v) && v > max) qtyInput.value = max || '';
        }
        qtyInput.disabled = max === 0;
    }

    async function refreshDataAndUI(force = false) {
        console.log('🔄 refreshDataAndUI called');
        state.allBookingsCache = await api.fetchAllBookings();
        state.allRequestsCache = await api.fetchAllRequests();
        console.log(`📦 Loaded ${state.allBookingsCache.length} bookings and ${state.allRequestsCache.length} requests`);
        if (elements.filtersGedung) {
            console.log('✅ Applying gedung filters');
            applyAdminFilters('gedung');
        }
        if (elements.filtersKendaraan) {
            console.log('✅ Applying kendaraan filters');
            applyAdminFilters('kendaraan');
        }
        if (elements.filtersRequest) {
            console.log('✅ Applying request filters');
            applyRequestFilters();
        }
        
        if (elements.gedungListTable || elements.kendaraanListTable) {
            initTableSorting();
        }
    }

    function setDefaultMonthFilters() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const defaultMonth = `${year}-${month}`;
        
        const monthInputGedung = document.getElementById('filter-gedung-month');
        const monthInputKendaraan = document.getElementById('filter-kendaraan-month');
        const monthInputRequest = document.getElementById('filter-request-month');
        
        // Don't set default month - leave empty to show all data
        // User previously reported no data showing, this was because month filter
        // was set to current month but all data is from previous months
        /*
        if (monthInputGedung) {
            monthInputGedung.value = defaultMonth;
        }
        if (monthInputKendaraan) {
            monthInputKendaraan.value = defaultMonth;
        }
        if (monthInputRequest) {
            monthInputRequest.value = defaultMonth;
        }
        */
    }

    function applyAdminFilters(type) {
        console.log(`🔍 applyAdminFilters called for type: ${type}`);
        const filterPanel = elements[type === 'gedung' ? 'filtersGedung' : 'filtersKendaraan'];
        if (!filterPanel) {
            console.warn(`⚠️  Filter panel not found for type: ${type}`);
            return;
        }
        
        const monthInput = filterPanel.querySelector(`#filter-${type}-month`);
        const assetInput = filterPanel.querySelector(`#filter-${type}-asset`);
        const barangInput = type === 'gedung' ? filterPanel.querySelector('#filter-gedung-barang') : null;
        const searchInput = filterPanel.querySelector(`#filter-${type}-search`);
        const driverInput = (type === 'kendaraan') ? filterPanel.querySelector(`#filter-${type}-driver`) : null;
        
        const month = monthInput ? monthInput.value : '';
        const asset = assetInput ? assetInput.value : 'all';
        const barang = barangInput ? barangInput.value : 'all';
        const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const driver = driverInput ? driverInput.value : null;
        
        console.log(`📋 Filter values - month: ${month}, asset: ${asset}, barang: ${barang}, driver: ${driver}`);
        console.log(`📦 state.allBookingsCache has ${state.allBookingsCache.length} items`);
        const bookingsToFilter = filterData(state.allBookingsCache, { type, month, asset, barang, driver, searchQuery });
        console.log(`🎯 Filtered to ${bookingsToFilter.length} bookings, rendering...`);
        ui.renderBookingList(type, bookingsToFilter);
    }

    function filterData(bookings, filters) {
        return bookings.filter(b => {
            if (b.bookingType !== filters.type) return false;
            
            if (filters.month) {
                const bookingDate = new Date(b.startDate);
                const bookingYear = bookingDate.getFullYear();
                const bookingMonth = String(bookingDate.getMonth() + 1).padStart(2, '0');
                const bookingYearMonth = `${bookingYear}-${bookingMonth}`;
                if (bookingYearMonth !== filters.month) return false;
            }
            
            if (filters.asset && filters.asset !== 'all' && b.assetCode !== filters.asset) return false;

            if (filters.barang && filters.barang !== 'all') {
                const hasBarang = Array.isArray(b.borrowedItems) && b.borrowedItems.some(it => it.assetCode === filters.barang);
                if (!hasBarang) return false;
            }
            
            if (filters.driver && filters.driver !== 'all') {
                const driverId = typeof b.driver === 'object' ? b.driver._id : b.driver;
                if (driverId !== filters.driver) return false;
            }
            
            if (filters.searchQuery) {
                const searchLower = filters.searchQuery.toLowerCase();
                const assetNameMatch = b.assetName.toLowerCase().includes(searchLower);
                const userNameMatch = b.userName.toLowerCase().includes(searchLower);
                const notesMatch = b.notes ? b.notes.toLowerCase().includes(searchLower) : false;
                
                let additionalFieldsMatch = false;
                if (b.bookingType === 'gedung') {
                    const barangText = Array.isArray(b.borrowedItems)
                        ? b.borrowedItems.map(it => `${it.assetName}: ${it.quantity}`).join(', ').toLowerCase()
                        : (typeof b.borrowedItems === 'string' ? b.borrowedItems.toLowerCase() : '');
                    additionalFieldsMatch = 
                        (b.activityName ? b.activityName.toLowerCase().includes(searchLower) : false) ||
                        (barangText ? barangText.includes(searchLower) : false);
                } else if (b.bookingType === 'kendaraan') {
                    const driverName = typeof b.driver === 'object' && b.driver ? b.driver.nama : (b.driver || '');
                    additionalFieldsMatch = 
                        (driverName ? driverName.toLowerCase().includes(searchLower) : false) ||
                        (b.destination ? b.destination.toLowerCase().includes(searchLower) : false);
                }
                
                if (!(assetNameMatch || userNameMatch || notesMatch || additionalFieldsMatch)) {
                    return false;
                }
            }
            
            return true;
        });
    }

    async function handleFormSubmit(event, type) {
        event.preventDefault();
        const form = event.target;
        const useTime = form.querySelector(`#${type}-use-time`).checked;
        const startDateInput = form.querySelector(`#${type}-mulai-tanggal`);
        const endDateInput = form.querySelector(`#${type}-selesai-tanggal`);
        const startTimeInput = form.querySelector(`#${type}-mulai-jam`);
        const endTimeInput = form.querySelector(`#${type}-selesai-jam`);

        let startDate, endDate;

        if (useTime) {
            const minT = GEDUNG_START;
            const maxT = GEDUNG_END;
            if (type === 'gedung' && (!startTimeInput.value || !endTimeInput.value)) {
                const sDateStr = `${startDateInput.value}T${GEDUNG_START}`;
                const eDateStr = `${endDateInput.value}T${GEDUNG_END}`;
                startDate = new Date(sDateStr);
                endDate = new Date(eDateStr);
            } else {
                if (type === 'gedung') {
                    if (startTimeInput.value < minT || startTimeInput.value > maxT || endTimeInput.value < minT || endTimeInput.value > maxT) {
                        return alert('Peminjaman gedung hanya antara 07.00-16.00 WIB.');
                    }
                }
                startDate = new Date(`${startDateInput.value}T${startTimeInput.value}`);
                endDate = new Date(`${endDateInput.value}T${endTimeInput.value}`);
            }
        } else {
            const sDateStr = `${startDateInput.value}T${type === 'gedung' ? GEDUNG_START : '00:00'}`;
            const eDateStr = `${endDateInput.value}T${type === 'gedung' ? GEDUNG_END : '23:59'}`;
            startDate = new Date(sDateStr);
            endDate = new Date(eDateStr);
        }

        if (endDate < startDate) {
            return alert('Waktu selesai tidak boleh sebelum waktu mulai.');
        }
        const bookingId = form.elements[`${type}-booking-id`]?.value;
        let bookingData = { bookingType: type };

        if (type === 'gedung') {
            const selected = state.assets.gedung.find(g => g.kode === form.elements['gedung-nama'].value);
            Object.assign(bookingData, {
                userName: form.elements['gedung-peminjam'].value,
                assetCode: selected.kode,
                assetName: selected.nama,
                startDate: startDate,
                endDate: endDate,
                activityName: form.elements['gedung-kegiatan'].value,
                personInCharge: form.elements['gedung-penanggung-jawab'].value,
                picPhoneNumber: form.elements['gedung-nomor-penanggung-jawab'].value,
                notes: form.elements['gedung-keterangan'].value
            });
            // Ambil barang dari chips
            const itemsMap = form.__barangItems || new Map();
            if (itemsMap.size) {
                bookingData.borrowedItems = [...itemsMap.values()].map(it => ({ assetCode: it.assetCode, assetName: it.assetName, quantity: it.quantity }));
            }
        } else {
            const selectedKendaraan = state.assets.kendaraan.find(k => k.kode === form.elements['kendaraan-nama'].value);
            const supirId = form.elements['kendaraan-supir'].value;
            Object.assign(bookingData, {
                userName: form.elements['kendaraan-peminjam'].value,
                assetCode: selectedKendaraan.kode,
                assetName: selectedKendaraan.nama,
                startDate: startDate,
                endDate: endDate,
                driver: supirId || null,
                destination: form.elements['kendaraan-tujuan'].value,
                personInCharge: form.elements['kendaraan-penanggung-jawab'].value,
                picPhoneNumber: form.elements['kendaraan-nomor-penanggung-jawab'].value,
                notes: form.elements['kendaraan-keterangan'].value
            });
        }

        try {
            await api.saveBooking(bookingData, bookingId);
            alert(`Data berhasil ${bookingId ? 'diperbarui' : 'disimpan'}!`);
            form.reset();
            if (type === 'gedung') {
                elements.modalFormGedung.classList.add('hidden');
                switchMainTab('gedung');
            } else {
                elements.modalFormKendaraan.classList.add('hidden');
                switchMainTab('kendaraan');
            }
            await refreshDataAndUI(true);
        } catch (error) {
            alert(`Gagal: ${error.message}`);
        }
    }

    function handleEditClick(id) {
        const booking = state.allBookingsCache.find(b => b._id === id);
        if (!booking) return;
        const start = new Date(booking.startDate);
        const end = new Date(booking.endDate);
        const formType = booking.bookingType;
        const form = elements[`form${formType.charAt(0).toUpperCase() + formType.slice(1)}`];

        ui.populateDropdowns(state.assets, {});
        if (formType === 'gedung') {
            elements.gedungFormTitle.innerText = `Edit Peminjaman Gedung`;
        } else {
            elements.kendaraanFormTitle.innerText = `Edit Peminjaman Kendaraan`;
        }

        form.elements[`${formType}-booking-id`].value = booking._id;
        form.elements[`${formType}-peminjam`].value = booking.userName;
        form.elements[`${formType}-nama`].value = booking.assetCode;
        form.elements[`${formType}-penanggung-jawab`].value = booking.personInCharge;
        form.elements[`${formType}-nomor-penanggung-jawab`].value = booking.picPhoneNumber;
        form.elements[`${formType}-mulai-tanggal`].value =
            start.getFullYear() + '-' +
            String(start.getMonth() + 1).padStart(2, '0') + '-' +
            String(start.getDate()).padStart(2, '0');
        form.elements[`${formType}-selesai-tanggal`].value =
            end.getFullYear() + '-' +
            String(end.getMonth() + 1).padStart(2, '0') + '-' +
            String(end.getDate()).padStart(2, '0');
        form.elements[`${formType}-selesai-tanggal`].min = form.elements[`${formType}-mulai-tanggal`].value;
        const useTimeCheckbox = form.querySelector(`#${formType}-use-time`);
        const timeInputsDiv = form.querySelector(`#${formType}-time-inputs`);
        if (start.getHours() === 0 && start.getMinutes() === 0 && end.getHours() === 23 && end.getMinutes() === 59) {
            useTimeCheckbox.checked = false;
            timeInputsDiv.classList.add('hidden');
            form.elements[`${formType}-mulai-jam`].value = '';
            form.elements[`${formType}-selesai-jam`].value = '';
        } else {
            useTimeCheckbox.checked = true;
            timeInputsDiv.classList.remove('hidden');
            form.elements[`${formType}-mulai-jam`].value = start.toTimeString().slice(0,5);
            form.elements[`${formType}-selesai-jam`].value = end.toTimeString().slice(0,5);
        }
        if (formType === 'gedung') {
            form.elements['gedung-kegiatan'].value = booking.activityName || '';
            resetBarangChips(form);
            if (Array.isArray(booking.borrowedItems)) {
                booking.borrowedItems.forEach(it => addBarangItemToForm(form, it.assetCode, it.assetName, it.quantity));
            }
            form.elements['gedung-keterangan'].value = booking.notes || '';
            elements.modalFormGedung.classList.remove('hidden');
        } else {
            const supirSelect = form.elements['kendaraan-supir'];
            const driverId = typeof booking.driver === 'object' ? booking.driver._id : booking.driver;
            if (driverId) {
                for (let i = 0; i < supirSelect.options.length; i++) {
                    if (supirSelect.options[i].value === driverId) {
                        supirSelect.selectedIndex = i;
                        break;
                    }
                }
            }
            form.elements['kendaraan-tujuan'].value = booking.destination || '';
            form.elements['kendaraan-keterangan'].value = booking.notes || '';
            elements.modalFormKendaraan.classList.remove('hidden');
        }
        updateAvailableAssets(formType);
    }

    async function handleDeleteClick(id) {
        if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
            try {
                await api.deleteBooking(id);
                alert('Data berhasil dihapus.');
                await refreshDataAndUI(true);
            } catch (error) {
                alert(`Gagal: ${error.message}`);
            }
        }
    }

    function applyRequestFilters() {
        console.log('🔍 applyRequestFilters called');
        const filterPanel = elements.filtersRequest;
        if (!filterPanel) {
            console.warn('⚠️  Request filter panel not found');
            return;
        }
        
        const typeInput = filterPanel.querySelector('#filter-request-type');
        const statusInput = filterPanel.querySelector('#filter-request-status');
        const monthInput = filterPanel.querySelector('#filter-request-month');
        const searchInput = filterPanel.querySelector('#filter-request-search');
        
        const type = typeInput ? typeInput.value : 'all';
        const status = statusInput ? statusInput.value : 'all';
        const month = monthInput ? monthInput.value : '';
        const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
        
        console.log(`📋 Filter values - type: ${type}, status: ${status}, month: ${month}`);
        console.log(`📦 state.allRequestsCache has ${state.allRequestsCache.length} items`);
        const filtered = state.allRequestsCache.filter(r => {
            if (type !== 'all' && r.bookingType !== type) return false;
            if (status !== 'all' && r.status !== status) return false;
            
            if (month) {
                const reqDate = new Date(r.startDate);
                const reqYear = reqDate.getFullYear();
                const reqMonth = String(reqDate.getMonth() + 1).padStart(2, '0');
                const reqYearMonth = `${reqYear}-${reqMonth}`;
                if (reqYearMonth !== month) return false;
            }
            
            if (searchQuery) {
                const assetMatch = r.assetName.toLowerCase().includes(searchQuery);
                const userMatch = r.userName.toLowerCase().includes(searchQuery);
                const noteMatch = r.notes ? r.notes.toLowerCase().includes(searchQuery) : false;
                const requestIdMatch = r.requestId.toLowerCase().includes(searchQuery);
                if (!(assetMatch || userMatch || noteMatch || requestIdMatch)) return false;
            }
            
            return true;
        });
        
        console.log(`🎯 Filtered to ${filtered.length} requests, rendering...`);
        ui.renderRequestList(filtered);
    }

    async function handleApproveRequest(id, driver = null) {
        if (!confirm('Setujui request ini?')) return;
        try {
            await api.approveRequest(id, 'admin', driver || null);
            alert('Request disetujui dan booking dibuat.');
            elements.modalRequestAction.classList.add('hidden');
            await refreshDataAndUI(true);
            applyRequestFilters();
        } catch (error) {
            alert(`Gagal: ${error.message}`);
        }
    }

    async function handleRejectRequest(id) {
        const reason = prompt('Masukkan alasan penolakan:');
        if (reason === null) return;
        try {
            await api.rejectRequest(id, reason);
            alert('Request ditolak.');
            elements.modalRequestAction.classList.add('hidden');
            await refreshDataAndUI(true);
            applyRequestFilters();
        } catch (error) {
            alert(`Gagal: ${error.message}`);
        }
    }

    function showRequestDetail(request) {
        const start = new Date(request.startDate);
        const end = new Date(request.endDate);
        
        const statusMap = {
            pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
            approved: { label: 'Disetujui', color: 'bg-green-100 text-green-800' },
            rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-800' }
        };
        const statusInfo = statusMap[request.status] || { label: request.status, color: 'bg-gray-100 text-gray-800' };
        
        let detailHtml = `
            <p><strong>ID Request:</strong> ${request.requestId}</p>
            <p><strong>Status:</strong> <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.color}">${statusInfo.label}</span></p>
        `;
        
        if (request.status === 'approved' && request.bookingId) {
            detailHtml += `<p><strong>Booking ID:</strong> <code class="bg-gray-100 px-2 py-1 rounded text-sm">${request.bookingId}</code></p>`;
        }
        
        detailHtml += `
            <p><strong>Tipe:</strong> ${request.bookingType === 'gedung' ? 'Gedung' : 'Kendaraan'}</p>
            <p><strong>Aset:</strong> ${request.assetName}</p>
            <p><strong>Peminjam:</strong> ${request.userName}</p>
            <p><strong>Penanggung Jawab:</strong> ${request.personInCharge}</p>
            <p><strong>HP PJ:</strong> ${request.picPhoneNumber}</p>
            <p><strong>Tanggal Mulai:</strong> ${start.toLocaleDateString('id-ID')}</p>
            <p><strong>Tanggal Selesai:</strong> ${end.toLocaleDateString('id-ID')}</p>
        `;
        
        if (request.bookingType === 'gedung') {
            if (request.activityName) detailHtml += `<p><strong>Kegiatan:</strong> ${request.activityName}</p>`;
            if (request.borrowedItems && request.borrowedItems.length > 0) {
                detailHtml += `<p><strong>Barang Dipinjam:</strong><ul class="ml-4 list-disc">`;
                request.borrowedItems.forEach(it => {
                    detailHtml += `<li>${it.assetName} (${it.assetCode}) - ${it.quantity} unit</li>`;
                });
                detailHtml += `</ul></p>`;
            }
        } else if (request.bookingType === 'kendaraan') {
            if (request.driver) {
                const driverName = typeof request.driver === 'object' ? request.driver.nama : request.driver;
                detailHtml += `<p><strong>Supir:</strong> ${driverName}</p>`;
            }
            if (request.destination) detailHtml += `<p><strong>Tujuan:</strong> ${request.destination}</p>`;
        }
        
        if (request.notes) detailHtml += `<p><strong>Keterangan:</strong> ${request.notes}</p>`;
        if (request.status === 'rejected' && request.rejectionReason) {
            detailHtml += `<p><strong>Alasan Penolakan:</strong> <span class="text-red-600">${request.rejectionReason}</span></p>`;
        }
        
        if (request.status === 'pending') {
            let driverSelectHtml = '';
            if (request.bookingType === 'kendaraan') {
                const startDate = new Date(request.startDate);
                const endDate = new Date(request.endDate);
                const unavailableDrivers = getUnavailableDriversForRange(startDate, endDate);
                const optionsHtml = (state.drivers || []).map(s => {
                    const disabled = unavailableDrivers.has(s._id) ? 'disabled' : '';
                    const suffix = unavailableDrivers.has(s._id) ? ' (Tidak Tersedia)' : '';
                    return `<option value="${s._id}" ${disabled}>${s.nama}${suffix}</option>`;
                }).join('');
                driverSelectHtml = `
                    <div class="mt-3">
                        <label for="req-approve-supir" class="form-label text-sm font-semibold">Pilih Supir</label>
                        <select id="req-approve-supir" class="form-input">
                            <option value="">Tanpa Supir</option>
                            ${optionsHtml}
                        </select>
                        <p class="text-xs text-gray-500 mt-1">Supir yang bertabrakan jadwal akan dinonaktifkan.</p>
                    </div>
                `;
            }

            detailHtml += `
                ${driverSelectHtml}
                <div class="flex gap-2 mt-4">
                    <button id="btn-approve-req" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded">
                        <i class="fas fa-check"></i> Setujui
                    </button>
                    <button id="btn-reject-req" class="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded">
                        <i class="fas fa-times"></i> Tolak
                    </button>
                </div>
            `;
        }
        
        elements.modalRequestTitle.innerText = 'Detail Request';
        elements.modalRequestBody.innerHTML = detailHtml;
        
        if (request.status === 'pending') {
            setTimeout(() => {
                const approveBtn = document.getElementById('btn-approve-req');
                const rejectBtn = document.getElementById('btn-reject-req');
                if (approveBtn) approveBtn.addEventListener('click', () => {
                    const driverSelect = document.getElementById('req-approve-supir');
                    const selectedDriver = driverSelect ? (driverSelect.value || null) : null;
                    handleApproveRequest(request._id, selectedDriver);
                });
                if (rejectBtn) rejectBtn.addEventListener('click', () => handleRejectRequest(request._id));
            }, 0);
        }
        
        elements.modalRequestAction.classList.remove('hidden');
    }

    async function renderDriverTable() {
        try {
            const drivers = await api.fetchDrivers();
            const query = (elements.driverSearch?.value || '').trim().toLowerCase();
            const filtered = query
                ? drivers.filter(d => (d.kode || '').toLowerCase().includes(query) || (d.nama || '').toLowerCase().includes(query))
                : drivers;
            ui.renderDriverList(filtered);
        } catch (err) {
            console.error('Error loading drivers:', err);
            if (elements.driverListTable) {
                elements.driverListTable.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Error: ${err.message}</td></tr>`;
            }
        }
    }

    async function handleDriverSubmit(event) {
        event.preventDefault();
        const id = document.getElementById('driver-id').value;
        const kode = document.getElementById('driver-kode').value;
        const nama = document.getElementById('driver-nama').value;
        const noTelp = document.getElementById('driver-no-telp').value;
        const detail = document.getElementById('driver-detail').value;

        if (!kode || !nama) {
            alert('Kode dan nama supir wajib diisi');
            return;
        }

        try {
            const data = { kode, nama, noTelp, detail };
            if (id) {
                await api.saveDriver(data, id);
                alert('Supir berhasil diperbarui');
            } else {
                await api.saveDriver(data);
                alert('Supir berhasil ditambahkan');
            }
            elements.modalFormDriver.classList.add('hidden');
            elements.formDriver.reset();
            await renderDriverTable();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    }

    async function handleDeleteDriver(id) {
        if (!confirm('Yakin ingin menghapus supir ini?')) return;
        try {
            await api.deleteDriver(id);
            alert('Supir berhasil dihapus');
            await renderDriverTable();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    }

    function openDriverModal(id = null) {
        elements.driverFormTitle.textContent = id ? 'Edit Supir' : 'Tambah Supir';
        elements.formDriver.reset();
        document.getElementById('driver-id').value = '';

        if (id) {
            // Find driver in list and populate form
            api.fetchDrivers().then(drivers => {
                const driver = drivers.find(d => d._id === id);
                if (driver) {
                    document.getElementById('driver-id').value = driver._id;
                    document.getElementById('driver-kode').value = driver.kode;
                    document.getElementById('driver-nama').value = driver.nama;
                    document.getElementById('driver-no-telp').value = driver.noTelp || '';
                    document.getElementById('driver-detail').value = driver.detail || '';
                }
            });
        }

        elements.modalFormDriver.classList.remove('hidden');
    }

    function switchMainTab(tabName) {
        if (elements.contentAdmin) {
            elements.contentAdmin.classList.toggle('hidden', tabName !== 'admin');
        }
        if (elements.adminTabRequest) {
            elements.adminTabRequest.classList.toggle('active', tabName === 'request');
        }
        if (elements.adminTabGedung) {
            elements.adminTabGedung.classList.toggle('active', tabName === 'gedung');
        }
        if (elements.adminTabKendaraan) {
            elements.adminTabKendaraan.classList.toggle('active', tabName === 'kendaraan');
        }
        if (elements.adminTabDriver) {
            elements.adminTabDriver.classList.toggle('active', tabName === 'driver');
        }
        if (elements.adminTabMaster) {
            elements.adminTabMaster.classList.toggle('active', tabName === 'master');
        }
        if (tabName === 'request') {
            if (elements.adminContentRequest) elements.adminContentRequest.classList.remove('hidden');
            if (elements.adminContentGedung) elements.adminContentGedung.classList.add('hidden');
            if (elements.adminContentKendaraan) elements.adminContentKendaraan.classList.add('hidden');
            if (elements.adminContentDriver) elements.adminContentDriver.classList.add('hidden');
            if (elements.adminContentMaster) elements.adminContentMaster.classList.add('hidden');
            applyRequestFilters();
        } else if (tabName === 'gedung') {
            if (elements.adminContentRequest) elements.adminContentRequest.classList.add('hidden');
            if (elements.adminContentGedung) elements.adminContentGedung.classList.remove('hidden');
            if (elements.adminContentKendaraan) elements.adminContentKendaraan.classList.add('hidden');
            if (elements.adminContentDriver) elements.adminContentDriver.classList.add('hidden');
            if (elements.adminContentMaster) elements.adminContentMaster.classList.add('hidden');
            if (elements.filtersGedung) applyAdminFilters('gedung');
        } else if (tabName === 'kendaraan') {
            if (elements.adminContentRequest) elements.adminContentRequest.classList.add('hidden');
            if (elements.adminContentGedung) elements.adminContentGedung.classList.add('hidden');
            if (elements.adminContentKendaraan) elements.adminContentKendaraan.classList.remove('hidden');
            if (elements.adminContentDriver) elements.adminContentDriver.classList.add('hidden');
            if (elements.adminContentMaster) elements.adminContentMaster.classList.add('hidden');
            if (elements.filtersKendaraan) applyAdminFilters('kendaraan');
        } else if (tabName === 'driver') {
            if (elements.adminContentRequest) elements.adminContentRequest.classList.add('hidden');
            if (elements.adminContentGedung) elements.adminContentGedung.classList.add('hidden');
            if (elements.adminContentKendaraan) elements.adminContentKendaraan.classList.add('hidden');
            if (elements.adminContentDriver) elements.adminContentDriver.classList.remove('hidden');
            if (elements.adminContentMaster) elements.adminContentMaster.classList.add('hidden');
            renderDriverTable();
        } else if (tabName === 'master') {
            if (elements.adminContentRequest) elements.adminContentRequest.classList.add('hidden');
            if (elements.adminContentGedung) elements.adminContentGedung.classList.add('hidden');
            if (elements.adminContentKendaraan) elements.adminContentKendaraan.classList.add('hidden');
            if (elements.adminContentDriver) elements.adminContentDriver.classList.add('hidden');
            if (elements.adminContentMaster) elements.adminContentMaster.classList.remove('hidden');
            renderMasterTable();
        }
    }

    function setupFormLogic(type) {
        const form = elements[`form${type.charAt(0).toUpperCase() + type.slice(1)}`];
        const useTimeCheckbox = form.querySelector(`#${type}-use-time`);
        const timeInputsDiv = form.querySelector(`#${type}-time-inputs`);
        const startDateInput = form.querySelector(`#${type}-mulai-tanggal`);
        const endDateInput = form.querySelector(`#${type}-selesai-tanggal`);
        const startTimeInput = form.querySelector(`#${type}-mulai-jam`);
        const endTimeInput = form.querySelector(`#${type}-selesai-jam`);

        useTimeCheckbox.addEventListener('change', () => {
            timeInputsDiv.classList.toggle('hidden', !useTimeCheckbox.checked);
            updateAvailableAssets(type);
        });

        startDateInput.addEventListener('change', () => {
            endDateInput.min = startDateInput.value;
            if (!endDateInput.value || endDateInput.value <= startDateInput.value) {
                endDateInput.value = startDateInput.value;
            }
            updateAvailableAssets(type);
        });
        endDateInput.addEventListener('change', () => {
            updateAvailableAssets(type);
        });
        const timeInputs = timeInputsDiv.querySelectorAll('input');
        timeInputs.forEach(input => input.addEventListener('change', () => updateAvailableAssets(type)));

        if (type === 'gedung') {
            if (startTimeInput) {
                startTimeInput.min = GEDUNG_START;
                startTimeInput.max = GEDUNG_END;
                startTimeInput.addEventListener('input', () => {
                    if (startTimeInput.value < GEDUNG_START) startTimeInput.value = GEDUNG_START;
                    if (startTimeInput.value > GEDUNG_END) startTimeInput.value = GEDUNG_END;
                });
            }
            if (endTimeInput) {
                endTimeInput.min = GEDUNG_START;
                endTimeInput.max = GEDUNG_END;
                endTimeInput.addEventListener('input', () => {
                    if (endTimeInput.value < GEDUNG_START) endTimeInput.value = GEDUNG_START;
                    if (endTimeInput.value > GEDUNG_END) endTimeInput.value = GEDUNG_END;
                });
            }
        }

        if (type === 'gedung') {
            resetBarangChips(form);
            const addBtn = form.querySelector('#gedung-barang-add');
            const qtyInput = form.querySelector('#gedung-barang-qty');
            const select = form.querySelector('#gedung-barang-select');
            select.addEventListener('change', () => setBarangQtyMax(form, form.__barangAvailability || null));
            qtyInput.addEventListener('input', () => setBarangQtyMax(form, form.__barangAvailability || null));
            addBtn.addEventListener('click', () => {
                const code = select.value;
                const asset = (state.assets.barang || []).find(b => b.kode === code);
                const qty = Number(qtyInput.value);
                if (!asset) return alert('Pilih barang.');
                if (!Number.isFinite(qty) || qty <= 0) return alert('Masukkan qty valid.');
                const availMap = form.__barangAvailability || new Map();
                const available = availMap.get(code) ?? 0;
                if (qty > available) return alert(`Qty melebihi stok tersedia (${available}).`);
                addBarangItemToForm(form, asset.kode, asset.nama, qty);
                qtyInput.value = '';
                updateBarangAvailability();
            });
        }
    }

    function resetBarangChips(form) {
        form.__barangItems = new Map();
        const chips = form.querySelector('#gedung-barang-chips');
        if (chips) chips.innerHTML = '';
        ui.populateBarangSelector(state.assets.barang || []);
    }

    function addBarangItemToForm(form, assetCode, assetName, quantity) {
        if (!form.__barangItems) form.__barangItems = new Map();
        form.__barangItems.set(assetCode, { assetCode, assetName, quantity });
        const chips = form.querySelector('#gedung-barang-chips');
        const chip = document.createElement('span');
        chip.className = 'inline-flex items-center bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full';
        chip.dataset.code = assetCode;
        chip.innerHTML = `
            <span class="mr-1 font-semibold">${assetName}: ${quantity}</span>
            <button type="button" class="ml-1 text-emerald-800 hover:text-red-600" title="Hapus">&times;</button>
        `;
        chips.querySelectorAll('span[data-code]')
            .forEach(n => { if (n.dataset.code === assetCode) n.remove(); });
        chips.appendChild(chip);
        chip.querySelector('button').addEventListener('click', () => {
            form.__barangItems.delete(assetCode);
            chip.remove();
        });
    }


    async function initialize() {
        console.log('⚙️  Starting admin page initialization...');
        const assetsPromise = api.fetchAssets();
        
        if (elements.formGedung || elements.formKendaraan || elements.formAsset) {
            ui.renderForms();
        }
        const initialAssets = await assetsPromise;
        console.log('✅ Assets loaded');
        await refreshAssets(initialAssets);

        setDefaultMonthFilters();
        console.log('🔄 Calling refreshDataAndUI...');
        await refreshDataAndUI(true);
        console.log('✅ refreshDataAndUI completed');
        
        if (elements.contentAdmin) {
            console.log('📍 Switching to request tab');
            switchMainTab('request');
        }

        // --- EVENT LISTENERS ---
        if (elements.adminTabRequest) {
            elements.adminTabRequest.addEventListener('click', () => switchMainTab('request'));
        }
        if (elements.formGedung) {
            elements.formGedung.addEventListener('submit', (e) => handleFormSubmit(e, 'gedung'));
            setupFormLogic('gedung');
        }
        if (elements.formKendaraan) {
            elements.formKendaraan.addEventListener('submit', (e) => handleFormSubmit(e, 'kendaraan'));
            setupFormLogic('kendaraan');
        }

        if (elements.btnSearchBooking) {
            elements.btnSearchBooking.addEventListener('click', async () => {
                const code = prompt('Masukkan Request ID atau Booking ID');
                if (!code) return;
                try {
                    const trimmedCode = code.trim();
                    let data;
                    try {
                        data = await api.fetchRequestByCode(trimmedCode);
                        showRequestDetail(data);
                    } catch (reqErr) {
                        try {
                            data = await api.fetchBookingByCode(trimmedCode);
                            ui.showDetailModal(data, 'admin');
                        } catch (bookErr) {
                            throw new Error('Request atau Booking tidak ditemukan');
                        }
                    }
                } catch (err) {
                    alert(err.message || 'Data tidak ditemukan');
                }
            });
        }
        if (elements.adminTabGedung) {
            elements.adminTabGedung.addEventListener('click', () => switchMainTab('gedung'));
        }
        if (elements.adminTabKendaraan) {
            elements.adminTabKendaraan.addEventListener('click', () => switchMainTab('kendaraan'));
        }
        if (elements.adminTabDriver) {
            elements.adminTabDriver.addEventListener('click', () => switchMainTab('driver'));
        }
        if (elements.adminTabDriver) {
            elements.adminTabDriver.addEventListener('click', () => switchMainTab('driver'));
        }
        if (elements.adminTabMaster) {
            elements.adminTabMaster.addEventListener('click', () => switchMainTab('master'));
        }
        if (elements.driverSearch) {
            elements.driverSearch.addEventListener('input', () => renderDriverTable());
            elements.driverSearch.addEventListener('keyup', () => renderDriverTable());
        }
        if (elements.btnAddDriver) {
            elements.btnAddDriver.addEventListener('click', () => openDriverModal());
        }
        if (elements.formDriver) {
            elements.formDriver.addEventListener('submit', handleDriverSubmit);
        }
        if (elements.driverListTable) {
            elements.driverListTable.addEventListener('click', (e) => {
                const editBtn = e.target.closest('.btn-edit');
                const deleteBtn = e.target.closest('.btn-delete');
                const row = e.target.closest('tr[data-driver-id]');
                if (editBtn && row) {
                    openDriverModal(editBtn.dataset.id);
                } else if (deleteBtn && row) {
                    handleDeleteDriver(deleteBtn.dataset.id);
                }
            });
        }
        if (elements.requestListTable) {
            elements.requestListTable.addEventListener('click', (e) => {
                const approveBtn = e.target.closest('.btn-approve');
                const rejectBtn = e.target.closest('.btn-reject');
                const viewBtn = e.target.closest('.btn-view');
                const row = e.target.closest('tr[data-request-id]');
                if (approveBtn && row) {
                    const request = state.allRequestsCache.find(r => r._id === row.dataset.requestId);
                    if (request) {
                        // Tampilkan detail dengan selector supir sebelum menyetujui
                        showRequestDetail(request);
                    }
                } else if (rejectBtn && row) {
                    handleRejectRequest(rejectBtn.dataset.id);
                } else if (viewBtn && row) {
                    const request = state.allRequestsCache.find(r => r._id === row.dataset.requestId);
                    if (request) showRequestDetail(request);
                }
            });
        }
        if (elements.filtersRequest) {
            elements.filtersRequest.addEventListener('input', () => applyRequestFilters());
            elements.filtersRequest.addEventListener('change', () => applyRequestFilters());
            const searchInput = document.getElementById('filter-request-search');
            if (searchInput) {
                searchInput.addEventListener('keyup', () => applyRequestFilters());
            }
        }
        if (elements.btnAddGedung) {
            elements.btnAddGedung.addEventListener('click', () => {
                elements.gedungFormTitle.innerText = "Peminjaman Gedung";
                elements.formGedung.reset();
                const bookingIdInput = elements.formGedung.querySelector('#gedung-booking-id');
                if(bookingIdInput) bookingIdInput.value = '';
                ui.populateDropdowns(state.assets, {});
                resetBarangChips(elements.formGedung);
                updateBarangAvailability();
                elements.modalFormGedung.classList.remove('hidden');
            });
        }
        if (elements.btnAddKendaraan) {
            elements.btnAddKendaraan.addEventListener('click', () => {
                elements.kendaraanFormTitle.innerText = "Peminjaman Kendaraan";
                elements.formKendaraan.reset();
                const bookingIdInput = elements.formKendaraan.querySelector('#kendaraan-booking-id');
                if(bookingIdInput) bookingIdInput.value = '';
                ui.populateDropdowns(state.assets, {});
                elements.modalFormKendaraan.classList.remove('hidden');
            });
        }

        if (elements.btnAddAsset) {
            elements.btnAddAsset.addEventListener('click', () => openAssetModal());
        }
        if (elements.formAsset) {
            elements.formAsset.addEventListener('submit', handleAssetSubmit);
        }
        if (elements.assetTipeInput) {
            elements.assetTipeInput.addEventListener('change', (e) => setAssetNumVisibility(e.target.value));
        }

        if (elements.masterTable) {
            elements.masterTable.addEventListener('click', (e) => {
                const editBtn = e.target.closest('.btn-edit');
                const deleteBtn = e.target.closest('.btn-delete');
                const row = e.target.closest('tr[data-asset-id]');
                if (editBtn && row) {
                    const isDriver = editBtn.dataset.isDriver === 'true';
                    const asset = flattenAssets().find((a) => a._id === editBtn.dataset.id || a._id === row.dataset.assetId);
                    if (isDriver) {
                        openDriverModal(asset);
                    } else {
                        openAssetModal(asset);
                    }
                } else if (deleteBtn && row) {
                    const isDriver = deleteBtn.dataset.isDriver === 'true';
                    if (isDriver) {
                        handleDriverDelete(deleteBtn.dataset.id || row.dataset.assetId);
                    } else {
                        handleAssetDelete(deleteBtn.dataset.id || row.dataset.assetId);
                    }
                }
            });
        }

        if (elements.masterFilterType) {
            elements.masterFilterType.addEventListener('change', renderMasterTable);
        }
        if (elements.masterSearch) {
            elements.masterSearch.addEventListener('input', renderMasterTable);
        }

        elements.allModals = elements.allModals.filter(m => m !== null);
        elements.allModals.forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal || e.target.classList.contains('modal-close-btn')) {
                        modal.classList.add('hidden');
                    }
                });
            }
        });

        if (elements.contentAdmin) {
            elements.contentAdmin.addEventListener('click', (e) => {
                const editBtn = e.target.closest('.btn-edit');
                const deleteBtn = e.target.closest('.btn-delete');
                const row = e.target.closest('tr[data-booking-id]');
                
                if (editBtn && row) {
                    handleEditClick(editBtn.dataset.id || row.dataset.bookingId);
                } else if (deleteBtn && row) {
                    handleDeleteClick(deleteBtn.dataset.id || row.dataset.bookingId);
                } else if (row && !editBtn && !deleteBtn) {
                    const bookingData = state.allBookingsCache.find(b => b._id === row.dataset.bookingId);
                    if (bookingData) ui.showDetailModal(bookingData, 'admin');
                }
            });
        }

        if (elements.filtersGedung) {
            elements.filtersGedung.addEventListener('input', () => applyAdminFilters('gedung'));
            elements.filtersGedung.addEventListener('change', () => applyAdminFilters('gedung'));
            const searchInput = document.getElementById('filter-gedung-search');
            if (searchInput) {
                searchInput.addEventListener('keyup', () => applyAdminFilters('gedung'));
            }
        }
        if (elements.filtersKendaraan) {
            elements.filtersKendaraan.addEventListener('input', () => applyAdminFilters('kendaraan'));
            elements.filtersKendaraan.addEventListener('change', () => applyAdminFilters('kendaraan'));
            const searchInput = document.getElementById('filter-kendaraan-search');
            if (searchInput) {
                searchInput.addEventListener('keyup', () => applyAdminFilters('kendaraan'));
            }
        }

        // Click handlers untuk gedung & kendaraan tables
        if (elements.gedungListTable) {
            elements.gedungListTable.addEventListener('click', (e) => {
                const editBtn = e.target.closest('.btn-edit');
                const deleteBtn = e.target.closest('.btn-delete');
                const row = e.target.closest('tr[data-booking-id]');
                
                if (!row) return;
                if (editBtn) {
                    handleEditClick(editBtn.dataset.id || row.dataset.bookingId);
                } else if (deleteBtn) {
                    handleDeleteClick(deleteBtn.dataset.id || row.dataset.bookingId);
                } else if (!editBtn && !deleteBtn) {
                    const bookingData = state.allBookingsCache.find(b => b._id === row.dataset.bookingId);
                    if (bookingData) ui.showDetailModal(bookingData, 'admin');
                }
            });
        }

        if (elements.kendaraanListTable) {
            elements.kendaraanListTable.addEventListener('click', (e) => {
                const editBtn = e.target.closest('.btn-edit');
                const deleteBtn = e.target.closest('.btn-delete');
                const row = e.target.closest('tr[data-booking-id]');
                
                if (!row) return;
                if (editBtn) {
                    handleEditClick(editBtn.dataset.id || row.dataset.bookingId);
                } else if (deleteBtn) {
                    handleDeleteClick(deleteBtn.dataset.id || row.dataset.bookingId);
                } else if (!editBtn && !deleteBtn) {
                    const bookingData = state.allBookingsCache.find(b => b._id === row.dataset.bookingId);
                    if (bookingData) ui.showDetailModal(bookingData, 'admin');
                }
            });
        }
    }

    // Make sure initialize completes before proceeding
    initialize().catch(err => console.error('Failed to initialize:', err));

    // Setup driver modal close handlers
    if (elements.modalFormDriver) {
        elements.modalFormDriver.addEventListener('click', (e) => {
            if (e.target === elements.modalFormDriver || e.target.classList.contains('modal-close-btn')) {
                elements.modalFormDriver.classList.add('hidden');
            }
        });
    }

    document.querySelectorAll('.modal-reset-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const modal = btn.closest('.modal-content');
            const form = modal.querySelector('form');
            if(form) {
                form.reset();
                if (form.id === 'form-asset' && elements.assetTipeInput) {
                    setAssetNumVisibility(elements.assetTipeInput.value);
                }
            }
        });
    });

    function initTableSorting() {
        const sortableHeaders = document.querySelectorAll('th.sortable');
        if (!sortableHeaders.length) return;
        
        const sortState = {
            column: null,
            direction: 'asc'
        };
        
        sortableHeaders.forEach(header => {
            const newHeader = header.cloneNode(true);
            header.parentNode.replaceChild(newHeader, header);
            
            newHeader.addEventListener('click', function() {
                const sortKey = this.getAttribute('data-sort');
                const tableId = this.closest('table').querySelector('tbody').id;
                
                document.querySelectorAll('th.sortable').forEach(h => {
                    const icon = h.querySelector('.sort-icon');
                    if (icon) {
                        icon.innerHTML = '<i class="fa fa-sort"></i>';
                    }
                    h.classList.remove('sort-asc', 'sort-desc');
                });
                
                if (sortState.column === sortKey) {
                    sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    sortState.column = sortKey;
                    sortState.direction = 'asc';
                }
                
                if (sortState.direction === 'asc') {
                    this.classList.add('sort-asc');
                    const icon = this.querySelector('.sort-icon');
                    if (icon) {
                        icon.innerHTML = '<i class="fa fa-sort-up"></i>';
                    }
                } else {
                    this.classList.add('sort-desc');
                    const icon = this.querySelector('.sort-icon');
                    if (icon) {
                        icon.innerHTML = '<i class="fa fa-sort-down"></i>';
                    }
                }
                
                sortTable(tableId, sortKey, sortState.direction);
            });
        });
    }

    function sortTable(tableId, sortKey, direction) {
        const tbody = document.getElementById(tableId);
        if (!tbody) return;
        
        const rows = Array.from(tbody.querySelectorAll('tr'));
        if (rows.length === 0) return;
        
        const sortedRows = rows.sort((rowA, rowB) => {
            let valueA, valueB;
            
            switch(sortKey) {
                case 'gedung':
                case 'kendaraan':
                    valueA = rowA.cells[0].textContent.trim().toLowerCase();
                    valueB = rowB.cells[0].textContent.trim().toLowerCase();
                    break;
                case 'peminjam':
                case 'pemakai':
                    valueA = rowA.cells[1].textContent.trim().toLowerCase();
                    valueB = rowB.cells[1].textContent.trim().toLowerCase();
                    break;
                case 'tanggal':
                    const textA = rowA.cells[2].textContent.trim();
                    const textB = rowB.cells[2].textContent.trim();
                    valueA = parseIndonesianDate(textA);
                    valueB = parseIndonesianDate(textB);
                    break;
                case 'barang':
                    valueA = rowA.cells[3].textContent.trim().toLowerCase();
                    valueB = rowB.cells[3].textContent.trim().toLowerCase();
                    break;
                case 'supir':
                    valueA = rowA.cells[3].textContent.trim().toLowerCase();
                    valueB = rowB.cells[3].textContent.trim().toLowerCase();
                    break;
                case 'keterangan':
                    valueA = rowA.cells[4].textContent.trim().toLowerCase();
                    valueB = rowB.cells[4].textContent.trim().toLowerCase();
                    break;
                case 'created':
                    const createdIndex = tableId === 'gedung-list-table' ? 4 : 5;
                    const dateA = rowA.cells[createdIndex].textContent.trim();
                    const dateB = rowB.cells[createdIndex].textContent.trim();
                    valueA = parseIndonesianDate(dateA);
                    valueB = parseIndonesianDate(dateB);
                    break;
                case 'kode':
                    valueA = rowA.cells[0].textContent.trim().toLowerCase();
                    valueB = rowB.cells[0].textContent.trim().toLowerCase();
                    break;
                case 'nama':
                    valueA = rowA.cells[1].textContent.trim().toLowerCase();
                    valueB = rowB.cells[1].textContent.trim().toLowerCase();
                    break;
                case 'tipe':
                    valueA = rowA.cells[2].textContent.trim().toLowerCase();
                    valueB = rowB.cells[2].textContent.trim().toLowerCase();
                    break;
                case 'qty':
                    valueA = parseInt(rowA.cells[3].textContent.trim()) || 0;
                    valueB = parseInt(rowB.cells[3].textContent.trim()) || 0;
                    break;
                case 'detail':
                    valueA = rowA.cells[4].textContent.trim().toLowerCase();
                    valueB = rowB.cells[4].textContent.trim().toLowerCase();
                    break;
                default:
                    valueA = '';
                    valueB = '';
            }
            
            let comparison = 0;
            if (valueA instanceof Date && valueB instanceof Date) {
                comparison = valueA - valueB;
            } else if (typeof valueA === 'number' && typeof valueB === 'number') {
                comparison = valueA - valueB;
            } else {
                comparison = valueA.localeCompare(valueB, 'id');
            }
            
            return direction === 'asc' ? comparison : -comparison;
        });
        
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }
        
        sortedRows.forEach(row => tbody.appendChild(row));
    }

    /**
     * Parse Indonesian date format to JavaScript Date object
     * Handles formats like "15/12/2023" or date ranges like "15/12/2023 - 20/12/2023"
     * @param {string} dateStr 
     * @returns {Date}
     */
    function parseIndonesianDate(dateStr) {
        try {
            if (dateStr.includes('-')) {
                dateStr = dateStr.split('-')[0].trim();
            }
            
            if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(dateStr)) {
                const [day, month, year] = dateStr.split('/').map(Number);
                return new Date(year, month - 1, day);
            }
            
            if (/\d{1,2}-\d{1,2}-\d{4}/.test(dateStr)) {
                const [day, month, year] = dateStr.split('-').map(Number);
                return new Date(year, month - 1, day);
            }
            
            const parts = dateStr.split(' ');
            const months = {
                'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 
                'Mei': 4, 'Juni': 5, 'Juli': 6, 'Agustus': 7,
                'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
            };
            
            if (parts.length >= 3) {
                const day = parseInt(parts[0], 10);
                const month = months[parts[1]];
                const year = parseInt(parts[2], 10);
                
                if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                    return new Date(year, month, day);
                }
            }
            
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date;
            }
            
            return dateStr;
        } catch (e) {
            console.error('Error parsing date:', e);
            return dateStr;
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    const isAdminPage = document.getElementById('content-admin') !== null;
    
    if (isAdminPage) {
        setTimeout(initializeApp, 10);
    } else {
        window.addEventListener('partialsLoaded', initializeApp, { once: true });
        setTimeout(initializeApp, 500);
    }
}
