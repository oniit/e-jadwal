document.addEventListener('DOMContentLoaded', function() {
    // --- STATE APLIKASI ---
    const state = {
        assets: {},
        currentCalendarView: 'gedung',
        allBookingsCache: [],
        selectedAssetFilter: 'all',
    };

    // --- ELEMEN UI ---
    const elements = {
        tabKalender: document.getElementById('tab-kalender'),
        tabAdmin: document.getElementById('tab-admin'),
        calendarEl: document.getElementById('calendar'),
        contentKalender: document.getElementById('content-kalender'),
        contentAdmin: document.getElementById('content-admin'),
        calendarTabGedung: document.getElementById('calendar-tab-gedung'),
        calendarTabKendaraan: document.getElementById('calendar-tab-kendaraan'),
        adminTabGedung: document.getElementById('admin-tab-gedung'),
        adminTabKendaraan: document.getElementById('admin-tab-kendaraan'),
        adminContentGedung: document.getElementById('admin-content-gedung'),
        adminContentKendaraan: document.getElementById('admin-content-kendaraan'),
        btnAddGedung: document.getElementById('btn-add-gedung'),
        btnAddKendaraan: document.getElementById('btn-add-kendaraan'),
        modalFormGedung: document.getElementById('modal-form-gedung'),
        modalFormKendaraan: document.getElementById('modal-form-kendaraan'),
        modalDetailEvent: document.getElementById('modal-detail-event'),
        formGedung: document.getElementById('form-gedung'),
        formKendaraan: document.getElementById('form-kendaraan'),
        gedungListTable: document.getElementById('gedung-list-table'),
        kendaraanListTable: document.getElementById('kendaraan-list-table'),
        filtersGedung: document.getElementById('filters-gedung'),
        filtersKendaraan: document.getElementById('filters-kendaraan'),
        calendarAssetFilter: document.getElementById('calendar-asset-filter'),
        modalTitle: document.getElementById('modal-title'),
        modalBody: document.getElementById('modal-body'),
        gedungFormTitle: document.getElementById('gedung-form-title'),
        kendaraanFormTitle: document.getElementById('kendaraan-form-title'),
    };
    elements.allModals = [elements.modalFormGedung, elements.modalFormKendaraan, elements.modalDetailEvent];

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
        fetchAssets: () => api.fetch('/api/assets'),
        fetchAllBookings: () => api.fetch('/api/bookings'),
        saveBooking: (data, id) => {
            const url = id ? `/api/bookings/${id}` : '/api/bookings';
            const method = id ? 'PUT' : 'POST';
            return api.fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        },
        deleteBooking: (id) => api.fetch(`/api/bookings/${id}`, { method: 'DELETE' }),
    };

    // --- UI HELPER ---
    const ui = {
        renderBookingList: function(type, bookings) {
            const tableBody = elements[`${type}ListTable`];
            tableBody.innerHTML = '';
            const sortedBookings = [...bookings].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
            if (sortedBookings.length === 0) {
                const colspan = type === 'gedung' ? 5 : 6;
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
                if (type === 'gedung') {
                    return `
                        <tr class="table-row" data-booking-id="${b._id}">
                            <td class="${cellClass} font-medium text-gray-900">${b.assetName}</td>
                            <td class="${cellClass}">${b.userName}</td>
                            <td class="${cellClass}">${tanggal}</td>
                            <td class="${cellClass}">${b.borrowedItems || '-'}</td>
                            <td class="${cellClass} text-right">
                                <button><i class="fas fa-edit btn btn-edit" data-id="${b._id}"></i></button>
                                <button><i class="fas fa-trash btn btn-delete" data-id="${b._id}"></i></button>
                            </td>
                        </tr>
                    `;
                } else {
                    return `
                        <tr class="table-row" data-booking-id="${b._id}">
                            <td class="${cellClass} font-medium text-gray-900">${b.assetName}</td>
                            <td class="${cellClass}">${b.userName}</td>
                            <td class="${cellClass}">${tanggal}</td>
                            <td class="${cellClass}">${b.driverName || '-'}</td>
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
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label for="gedung-barang" class="form-label text-sm">Barang Dipinjam (Opsional)</label>
                    <textarea id="gedung-barang" rows="2" class="form-input" placeholder="Contoh: Proyektor, 20 kursi"></textarea></div>
                    <div><label for="gedung-keterangan" class="form-label text-sm">Keterangan (Opsional)</label>
                    <textarea id="gedung-keterangan" rows="2" class="form-input"></textarea></div>
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
            elements.formGedung.innerHTML = commonFormHtml('gedung') + gedungExtraFields;
            elements.formKendaraan.innerHTML = commonFormHtml('kendaraan') + kendaraanExtraFields;
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
            assets.supir.forEach(s => {
                const option = new Option(s.nama, s.kode);
                if (unavailable.drivers?.has(s.kode)) {
                    option.disabled = true;
                    option.textContent += ' (Tidak Tersedia)';
                }
                supirSelect.add(option);
            });
            supirSelect.value = currentSupir;
        },
        populateCalendarFilter: function(type, assets) {
            const select = elements.calendarAssetFilter;
            select.innerHTML = `<option value="all">Semua ${type.charAt(0).toUpperCase() + type.slice(1)}</option>`;
            const items = assets[type];
            items.forEach(item => select.add(new Option(item.nama, item.kode)));
        },
        populateAdminFilters: function(type, assets) {
            const assetSelect = elements.filtersGedung.querySelector(`#filter-gedung-asset`);
            const vehicleSelect = elements.filtersKendaraan.querySelector(`#filter-kendaraan-asset`);
            const driverSelect = elements.filtersKendaraan.querySelector(`#filter-kendaraan-driver`);
            if (type === 'gedung') {
                assetSelect.innerHTML = '<option value="all">Semua Gedung</option>';
                assets.gedung.forEach(g => assetSelect.add(new Option(g.nama, g.kode)));
            } else {
                vehicleSelect.innerHTML = '<option value="all">Semua Kendaraan</option>';
                assets.kendaraan.forEach(k => vehicleSelect.add(new Option(k.nama, k.kode)));
                driverSelect.innerHTML = '<option value="all">Semua Supir</option>';
                assets.supir.forEach(s => driverSelect.add(new Option(s.nama, s.kode)));
            }
        },
        showDetailModal: function(props, context = 'admin') {
            let assetDisplay = props.assetName;
            if (props.bookingType === 'kendaraan') {
                const kendaraan = state.assets.kendaraan.find(k => k.nama === props.assetName);
                const detail = kendaraan && kendaraan.detail ? kendaraan.detail : '';
                assetDisplay = detail ? `${props.assetName} (${detail})` : props.assetName;
            }
            elements.modalTitle.innerText = `${assetDisplay}`;
            const start = new Date(props.startDate);
            const end = new Date(props.endDate);
            const isFullDay = start.getHours() === 0 && start.getMinutes() === 0 && end.getHours() === 23 && end.getMinutes() === 59;
            let waktuText;
            if (isFullDay) {
                if (start.toDateString() === end.toDateString()) {
                    waktuText = `${start.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
                } else {
                    waktuText = `${start.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - ${end.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
                }
            } else {
                waktuText = `${start.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} pukul ${start.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} pukul ${end.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
            }
            let detailsHtml = `<p><strong>Peminjam:</strong> ${props.userName}</p><p><strong>Waktu:</strong> ${waktuText}</p>`;
            if (context === 'admin') {
                detailsHtml += `<p><strong>Penanggung Jawab:</strong> ${props.personInCharge} (${props.picPhoneNumber})</p>`;
                if (props.bookingType === 'gedung') {
                    detailsHtml += `${props.activityName ? `<p><strong>Kegiatan:</strong> ${props.activityName}</p>` : ''}${props.borrowedItems ? `<p><strong>Barang Pinjam:</strong> ${props.borrowedItems}</p>` : ''}`;
                } else {
                    detailsHtml += `${props.destination ? `<p><strong>Tujuan:</strong> ${props.destination}</p>` : ''}${props.driverName ? `<p><strong>Supir:</strong> ${props.driverName}</p>` : ''}`;
                }
                detailsHtml += `${props.notes ? `<p><strong>Keterangan:</strong> ${props.notes}</p>` : ''}`;
            } else {
                if (props.bookingType === 'kendaraan' && props.driverName && props.driverName !== 'Tanpa Supir') {
                    detailsHtml += `<p><strong>Supir:</strong> ${props.driverName}</p>`;
                }
            }
            elements.modalBody.innerHTML = detailsHtml;
            elements.modalDetailEvent.classList.remove('hidden');
        },
        formatBookingForCalendar: (booking) => ({
            id: booking._id,
            title: booking.assetName,
            start: booking.startDate,
            end: booking.endDate,
            extendedProps: booking,
            textColor: '#047857',
            backgroundColor: 'rgba(184, 147, 47, 0.3)',
        })
    };

    // --- INISIALISASI KALENDER ---
    const calendar = new FullCalendar.Calendar(elements.calendarEl, {
        initialView: window.innerWidth < 768 ? 'listWeek' : 'dayGridMonth',
        locale: 'id', 
        dayMaxEvents: true,
        headerToolbar: { 
            left: 'prev,next,today', 
            center: 'title', 
            right: 'dayGridMonth,timeGridDay,listWeek' 
        },
        views: {
            dayGridMonth: {
                titleFormat: { year: 'numeric', month: 'long' }
            },
            listWeek: {
                titleFormat: { day: '2-digit', month: 'long', year: 'numeric' }
            }
        },
        buttonText: {
            today: 'today',
            month: 'month',
            day: 'day',
            list: 'list'
        },
        height: 'auto',
        events: (fetchInfo, successCallback) => {
            let filtered = state.allBookingsCache.filter(b => b.bookingType === state.currentCalendarView);
            if (state.selectedAssetFilter !== 'all') {
                filtered = filtered.filter(b => b.assetCode === state.selectedAssetFilter);
            }
            successCallback(filtered.map(ui.formatBookingForCalendar));
        },
        eventClick: (info) => ui.showDetailModal(info.event.extendedProps, 'public'),
        eventContent: (arg) => ({ 
            html: `<div class="p-1"><b>${arg.event.extendedProps.bookingType === 'gedung' ? '🏢' : '🚗'} ${arg.event.title}</b></div>` 
        })
    });

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
            if (!startDateInput.value || !endDateInput.value || !startTimeInput.value || !endTimeInput.value) {
                ui.populateDropdowns(state.assets, {});
                return;
            }
            start = new Date(`${startDateInput.value}T${startTimeInput.value}`);
            end = new Date(`${endDateInput.value}T${endTimeInput.value}`);
        } else {
            if (!startDateInput.value || !endDateInput.value) {
                ui.populateDropdowns(state.assets, {});
                return;
            }
            start = new Date(startDateInput.value);
            end = new Date(endDateInput.value);
            end.setHours(23, 59, 59, 999);
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
                if (booking.bookingType === 'kendaraan' && booking.driverName && booking.driverName !== 'Tanpa Supir') {
                    unavailable.drivers.add(booking.driverName);
                }
            }
        });
        ui.populateDropdowns(state.assets, unavailable);
    }

    async function refreshDataAndUI(force = false) {
        state.allBookingsCache = await api.fetchAllBookings();
        calendar.refetchEvents();
        applyAdminFilters('gedung');
        applyAdminFilters('kendaraan');
        
        // Initialize sorting after data is refreshed
        initTableSorting();
    }

    function applyAdminFilters(type) {
        const filterPanel = elements[type === 'gedung' ? 'filtersGedung' : 'filtersKendaraan'];
        const start = filterPanel.querySelector(`#filter-${type}-start`).value;
        const end = filterPanel.querySelector(`#filter-${type}-end`).value;
        const asset = filterPanel.querySelector(`#filter-${type}-asset`).value;
        const searchQuery = filterPanel.querySelector(`#filter-${type}-search`).value.trim().toLowerCase();
        const driver = (type === 'kendaraan') ? filterPanel.querySelector(`#filter-${type}-driver`).value : null;
        
        const bookingsToFilter = filterData(state.allBookingsCache, { type, start, end, asset, driver, searchQuery });
        ui.renderBookingList(type, bookingsToFilter);
    }

    function filterData(bookings, filters) {
        return bookings.filter(b => {
            if (b.bookingType !== filters.type) return false;
            
            // Date range filters
            if (filters.start && new Date(b.startDate) < new Date(filters.start)) return false;
            if (filters.end) {
                const endDate = new Date(filters.end);
                endDate.setHours(23, 59, 59, 999);
                if (new Date(b.startDate) > endDate) return false;
            }
            
            // Asset dropdown filter
            if (filters.asset && filters.asset !== 'all' && b.assetCode !== filters.asset) return false;
            
            // Driver dropdown filter (only for kendaraan)
            if (filters.driver && filters.driver !== 'all' && b.driverName !== filters.driver) return false;
            
            // Text-based search - check if any relevant field contains the search query
            if (filters.searchQuery) {
                const searchLower = filters.searchQuery.toLowerCase();
                const assetNameMatch = b.assetName.toLowerCase().includes(searchLower);
                const userNameMatch = b.userName.toLowerCase().includes(searchLower);
                const notesMatch = b.notes ? b.notes.toLowerCase().includes(searchLower) : false;
                
                // Additional fields based on booking type
                let additionalFieldsMatch = false;
                if (b.bookingType === 'gedung') {
                    additionalFieldsMatch = 
                        (b.activityName ? b.activityName.toLowerCase().includes(searchLower) : false) ||
                        (b.borrowedItems ? b.borrowedItems.toLowerCase().includes(searchLower) : false);
                } else if (b.bookingType === 'kendaraan') {
                    additionalFieldsMatch = 
                        (b.driverName ? b.driverName.toLowerCase().includes(searchLower) : false) ||
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
            startDate = new Date(`${startDateInput.value}T${startTimeInput.value}`);
            endDate = new Date(`${endDateInput.value}T${endTimeInput.value}`);
        } else {
            startDate = new Date(startDateInput.value);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(endDateInput.value);
            endDate.setHours(23, 59, 59, 999);
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
                borrowedItems: form.elements['gedung-barang'].value,
                notes: form.elements['gedung-keterangan'].value
            });
        } else {
            const selectedKendaraan = state.assets.kendaraan.find(k => k.kode === form.elements['kendaraan-nama'].value);
            const supirNama = form.elements['kendaraan-supir'].selectedIndex > 0 ? form.elements['kendaraan-supir'].options[form.elements['kendaraan-supir'].selectedIndex].text : '';
            Object.assign(bookingData, {
                userName: form.elements['kendaraan-peminjam'].value,
                assetCode: selectedKendaraan.kode,
                assetName: selectedKendaraan.nama,
                startDate: startDate,
                endDate: endDate,
                driverName: supirNama || 'Tanpa Supir',
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
                switchMainTab('admin');
                switchAdminTab('gedung');
            } else {
                elements.modalFormKendaraan.classList.add('hidden');
                switchMainTab('admin');
                switchAdminTab('kendaraan');
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
            form.elements['gedung-barang'].value = booking.borrowedItems || '';
            form.elements['gedung-keterangan'].value = booking.notes || '';
            elements.modalFormGedung.classList.remove('hidden');
        } else {
            // Supir value harus di-set ke nama
            const supirSelect = form.elements['kendaraan-supir'];
            for (let i = 0; i < supirSelect.options.length; i++) {
                if (supirSelect.options[i].text === booking.driverName) {
                    supirSelect.selectedIndex = i;
                    break;
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

    function switchMainTab(tabName) {
        elements.contentKalender.classList.toggle('hidden', tabName !== 'kalender');
        elements.contentAdmin.classList.toggle('hidden', tabName !== 'admin');
        elements.tabKalender.classList.toggle('active', tabName === 'kalender');
        elements.tabAdmin.classList.toggle('active', tabName === 'admin');
        if (tabName === 'admin') {
            applyAdminFilters('gedung');
            applyAdminFilters('kendaraan');
            switchAdminTab('gedung');
        } else if (tabName === 'kalender') {
            setTimeout(() => calendar.updateSize(), 1);
        }
    }

    function switchAdminTab(tabName) {
        elements.adminContentGedung.classList.toggle('hidden', tabName !== 'gedung');
        elements.adminContentKendaraan.classList.toggle('hidden', tabName !== 'kendaraan');
        elements.adminTabGedung.classList.toggle('active', tabName === 'gedung');
        elements.adminTabKendaraan.classList.toggle('active', tabName === 'kendaraan');
    }

    function switchCalendarTab(tabName) {
        state.currentCalendarView = tabName;
        state.selectedAssetFilter = 'all';
        elements.calendarTabGedung.classList.toggle('active', tabName === 'gedung');
        elements.calendarTabKendaraan.classList.toggle('active', tabName === 'kendaraan');
        ui.populateCalendarFilter(tabName, state.assets);
        calendar.refetchEvents();
    }

    function setupFormLogic(type) {
        const form = elements[`form${type.charAt(0).toUpperCase() + type.slice(1)}`];
        const useTimeCheckbox = form.querySelector(`#${type}-use-time`);
        const timeInputsDiv = form.querySelector(`#${type}-time-inputs`);
        const startDateInput = form.querySelector(`#${type}-mulai-tanggal`);
        const endDateInput = form.querySelector(`#${type}-selesai-tanggal`);

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
    }


    async function initialize() {
        calendar.render();
        state.assets = await api.fetchAssets();
        ui.renderForms();
        if(state.assets) {
            ui.populateDropdowns(state.assets, {});
            ui.populateCalendarFilter('gedung', state.assets);
            ui.populateAdminFilters('gedung', state.assets);
            ui.populateAdminFilters('kendaraan', state.assets);
        }
        await refreshDataAndUI(true);
        switchMainTab('admin');

        // --- EVENT LISTENERS ---
        elements.formGedung.addEventListener('submit', (e) => handleFormSubmit(e, 'gedung'));
        elements.formKendaraan.addEventListener('submit', (e) => handleFormSubmit(e, 'kendaraan'));
        setupFormLogic('gedung');
        setupFormLogic('kendaraan');

        elements.tabKalender.addEventListener('click', () => switchMainTab('kalender'));
        elements.tabAdmin.addEventListener('click', () => switchMainTab('admin'));
        elements.calendarTabGedung.addEventListener('click', () => switchCalendarTab('gedung'));
        elements.calendarTabKendaraan.addEventListener('click', () => switchCalendarTab('kendaraan'));
        elements.adminTabGedung.addEventListener('click', () => switchAdminTab('gedung'));
        elements.adminTabKendaraan.addEventListener('click', () => switchAdminTab('kendaraan'));
        elements.btnAddGedung.addEventListener('click', () => {
            elements.gedungFormTitle.innerText = "Peminjaman Gedung";
            elements.formGedung.reset();
            const bookingIdInput = elements.formGedung.querySelector('#gedung-booking-id');
            if(bookingIdInput) bookingIdInput.value = '';
            ui.populateDropdowns(state.assets, {});
            elements.modalFormGedung.classList.remove('hidden');
        });
        elements.btnAddKendaraan.addEventListener('click', () => {
            elements.kendaraanFormTitle.innerText = "Peminjaman Kendaraan";
            elements.formKendaraan.reset();
            const bookingIdInput = elements.formKendaraan.querySelector('#kendaraan-booking-id');
            if(bookingIdInput) bookingIdInput.value = '';
            ui.populateDropdowns(state.assets, {});
            elements.modalFormKendaraan.classList.remove('hidden');
        });

        elements.allModals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.classList.contains('modal-close-btn')) {
                    modal.classList.add('hidden');
                }
            });
        });

        elements.contentAdmin.addEventListener('click', (e) => {
            const row = e.target.closest('tr[data-booking-id]');
            if (e.target.classList.contains('btn-edit')) {
                e.stopPropagation();
                handleEditClick(e.target.dataset.id);
            } else if (e.target.classList.contains('btn-delete')) {
                e.stopPropagation();
                handleDeleteClick(e.target.dataset.id);
            } else if (row) {
                const bookingData = state.allBookingsCache.find(b => b._id === row.dataset.bookingId);
                if (bookingData) ui.showDetailModal(bookingData, 'admin');
            }
        });

        elements.calendarAssetFilter.addEventListener('change', (e) => {
            state.selectedAssetFilter = e.target.value;
            calendar.refetchEvents();
        });

        elements.filtersGedung.addEventListener('input', () => applyAdminFilters('gedung'));
        elements.filtersKendaraan.addEventListener('input', () => applyAdminFilters('kendaraan'));
        
        // Add keyup events for search inputs to catch paste operations and other edge cases
        document.getElementById('filter-gedung-search').addEventListener('keyup', () => applyAdminFilters('gedung'));
        document.getElementById('filter-kendaraan-search').addEventListener('keyup', () => applyAdminFilters('kendaraan'));
    }

    initialize();

    document.querySelectorAll('.modal-reset-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const modal = btn.closest('.modal-content');
            const form = modal.querySelector('form');
            if(form) form.reset();
        });
    });

    // Table sorting functionality
    function initTableSorting() {
        // Get all sortable headers
        const sortableHeaders = document.querySelectorAll('th.sortable');
        if (!sortableHeaders.length) return;
        
        // Current sorting state
        const sortState = {
            column: null,
            direction: 'asc'
        };
        
        // Add click event listeners to all sortable headers
        sortableHeaders.forEach(header => {
            // Remove any existing event listeners to prevent duplicates
            const newHeader = header.cloneNode(true);
            header.parentNode.replaceChild(newHeader, header);
            
            newHeader.addEventListener('click', function() {
                console.log('Header clicked:', this.getAttribute('data-sort')); // Debug log
                const sortKey = this.getAttribute('data-sort');
                const tableId = this.closest('table').querySelector('tbody').id;
                
                // Remove sort classes from all headers
                document.querySelectorAll('th.sortable').forEach(h => {
                    const icon = h.querySelector('.sort-icon');
                    if (icon) {
                        icon.innerHTML = '<i class="fa fa-sort"></i>';
                    }
                    h.classList.remove('sort-asc', 'sort-desc');
                });
                
                // Determine sort direction
                if (sortState.column === sortKey) {
                    sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    sortState.column = sortKey;
                    sortState.direction = 'asc';
                }
                
                // Add sort indicator
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
                
                // Sort the table
                sortTable(tableId, sortKey, sortState.direction);
            });
        });
    }

    function sortTable(tableId, sortKey, direction) {
        const tbody = document.getElementById(tableId);
        if (!tbody) return;
        
        const rows = Array.from(tbody.querySelectorAll('tr'));
        if (rows.length === 0) return;
        
        // Sort rows
        const sortedRows = rows.sort((rowA, rowB) => {
            let valueA, valueB;
            
            // Determine which cell contains the data based on the sortKey
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
                    // Special handling for Indonesian date format
                    const textA = rowA.cells[2].textContent.trim();
                    const textB = rowB.cells[2].textContent.trim();
                    
                    // Parse Indonesian date format (e.g., "20/5/2023" or range "20/5/2023 - 21/5/2023")
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
                default:
                    valueA = '';
                    valueB = '';
            }
            
            // Compare values based on direction
            let comparison = 0;
            if (valueA instanceof Date && valueB instanceof Date) {
                comparison = valueA - valueB; // Date comparison
            } else {
                comparison = valueA.localeCompare(valueB, 'id'); // String comparison using Indonesian locale
            }
            
            return direction === 'asc' ? comparison : -comparison;
        });
        
        // Remove all current rows
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }
        
        // Add sorted rows back
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
            // If it's a date range, take only the first date
            if (dateStr.includes('-')) {
                dateStr = dateStr.split('-')[0].trim();
            }
            
            // Try to parse as DD/MM/YYYY format (Indonesian format)
            if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(dateStr)) {
                const [day, month, year] = dateStr.split('/').map(Number);
                return new Date(year, month - 1, day); // month is 0-indexed in JS Date
            }
            
            // Try to parse as DD-MM-YYYY format
            if (/\d{1,2}-\d{1,2}-\d{4}/.test(dateStr)) {
                const [day, month, year] = dateStr.split('-').map(Number);
                return new Date(year, month - 1, day);
            }
            
            // Try standard Indonesian locale date format
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
            
            // Fallback to standard JS Date parsing
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date;
            }
            
            // If all parsing attempts fail, return the original string
            return dateStr;
        } catch (e) {
            console.error('Error parsing date:', e);
            return dateStr;
        }
    }
});
