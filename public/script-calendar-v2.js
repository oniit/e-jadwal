// Landing page calendar initialization
const API_BASE = window.location.origin;

document.addEventListener('DOMContentLoaded', async () => {
    await initializeCalendar();
});

async function initializeCalendar() {
    console.log('🚀 Initializing calendar...');

    // State
    const state = {
        bookings: [],
        assets: {},
        selectedAssetFilter: 'all',
        selectedAssetType: 'gedung',
        calendar: null,
    };

    // === API HELPER ===
    async function fetchAPI(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('API Error:', url, error);
            return null;
        }
    }

    // === KALENDER SETUP ===
    function setupCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) {
            console.error('❌ Calendar element not found');
            return null;
        }

        try {
            const calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                locale: 'id',
                height: 'auto',
                contentHeight: 'auto',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
                },
                eventClick: function(info) {
                    showEventDetail(info.event);
                },
                eventDidMount: function(info) {
                    // Color events by type
                    if (info.event.extendedProps.type === 'gedung') {
                        info.el.style.backgroundColor = '#06b6d4';
                        info.el.style.borderColor = '#06b6d4';
                    } else if (info.event.extendedProps.type === 'kendaraan') {
                        info.el.style.backgroundColor = '#22c55e';
                        info.el.style.borderColor = '#22c55e';
                    }
                }
            });

            calendar.render();
            console.log('✅ Calendar rendered');
            return calendar;
        } catch (error) {
            console.error('❌ Failed to create calendar:', error);
            return null;
        }
    }

    // === LOAD DATA ===
    async function loadData() {
        console.log('📥 Loading data from API...');
        
        const bookingsData = await fetchAPI(`${API_BASE}/api/public/bookings`);
        const assetsData = await fetchAPI(`${API_BASE}/api/public/assets`);

        if (bookingsData) {
            state.bookings = bookingsData;
            console.log(`✅ Loaded ${bookingsData.length} bookings`);
        }

        if (assetsData) {
            state.assets = assetsData;
            console.log('✅ Loaded assets');
        }

        return bookingsData && assetsData;
    }

    // === UPDATE CALENDAR EVENTS ===
    function updateCalendarEvents() {
        if (!state.calendar) return;

        const events = [];
        const bookings = state.bookings || [];

        bookings
            .filter(b => b.bookingType === state.selectedAssetType)
            .filter(b => state.selectedAssetFilter === 'all' || b.assetName === state.selectedAssetFilter)
            .forEach(booking => {
                const startDate = new Date(booking.startDate);
                const endDate = new Date(booking.endDate);
                
                events.push({
                    id: booking._id,
                    title: booking.assetName,
                    start: startDate.toISOString().split('T')[0],
                    end: new Date(endDate.getTime() + 86400000).toISOString().split('T')[0],
                    backgroundColor: booking.bookingType === 'gedung' ? '#06b6d4' : '#22c55e',
                    borderColor: booking.bookingType === 'gedung' ? '#06b6d4' : '#22c55e',
                    extendedProps: {
                        type: booking.bookingType,
                        assetName: booking.assetName,
                        userName: booking.userName,
                        notes: booking.notes,
                        startDate: startDate.toLocaleDateString('id-ID'),
                        endDate: endDate.toLocaleDateString('id-ID'),
                    }
                });
            });

        // Clear and add events
        state.calendar.removeAllEvents();
        state.calendar.addEventSource(events);
        console.log(`📅 Updated calendar with ${events.length} events`);
    }

    // === SETUP FILTERS ===
    function setupFilters() {
        const assetFilter = document.getElementById('calendar-asset-filter');
        const driverFilter = document.getElementById('calendar-driver-filter');
        const tabGedung = document.getElementById('calendar-tab-gedung');
        const tabKendaraan = document.getElementById('calendar-tab-kendaraan');

        // Update asset filter options
        function updateAssetOptions() {
            if (!assetFilter) return;
            const assets = state.assets[state.selectedAssetType] || [];
            const options = [`<option value="all">Semua ${state.selectedAssetType === 'gedung' ? 'Gedung' : 'Kendaraan'}</option>`];
            
            assets.forEach(asset => {
                options.push(`<option value="${asset.nama}">${asset.nama}</option>`);
            });

            assetFilter.innerHTML = options.join('');
            state.selectedAssetFilter = 'all';
        }

        // Asset filter change
        if (assetFilter) {
            updateAssetOptions();
            assetFilter.addEventListener('change', (e) => {
                state.selectedAssetFilter = e.target.value;
                updateCalendarEvents();
            });
        }

        // Gedung tab
        if (tabGedung) {
            tabGedung.addEventListener('click', () => {
                state.selectedAssetType = 'gedung';
                tabGedung.classList.add('active');
                if (tabKendaraan) tabKendaraan.classList.remove('active');
                if (driverFilter) driverFilter.classList.add('hidden');
                updateAssetOptions();
                updateCalendarEvents();
            });
        }

        // Kendaraan tab
        if (tabKendaraan) {
            tabKendaraan.addEventListener('click', () => {
                state.selectedAssetType = 'kendaraan';
                if (tabGedung) tabGedung.classList.remove('active');
                tabKendaraan.classList.add('active');
                if (driverFilter) driverFilter.classList.remove('hidden');
                updateAssetOptions();
                updateCalendarEvents();
            });
        }
    }

    // === EVENT DETAIL MODAL ===
    function showEventDetail(event) {
        const modal = document.getElementById('modal-detail-event');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');

        if (!modal) return;

        modalTitle.textContent = 'Detail Peminjaman';
        modalBody.innerHTML = `
            <div class="space-y-3">
                <p><strong>Aset:</strong> ${event.extendedProps.assetName}</p>
                <p><strong>Peminjam:</strong> ${event.extendedProps.userName}</p>
                <p><strong>Tanggal:</strong> ${event.extendedProps.startDate} s/d ${event.extendedProps.endDate}</p>
                <p><strong>Catatan:</strong> ${event.extendedProps.notes || '-'}</p>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    // === REQUEST FORM ===
    function setupRequestForm() {
        const btnForm = document.getElementById('btn-form');
        const modal = document.getElementById('modal-form-request');
        const form = document.getElementById('form-request');

        if (!btnForm || !modal || !form) return;

        btnForm.addEventListener('click', () => {
            modal.classList.remove('hidden');
            buildRequestForm();
        });

        // Close buttons
        modal.querySelector('.modal-close-btn')?.addEventListener('click', () => {
            modal.classList.add('hidden');
        });

        modal.querySelector('.modal-reset-btn')?.addEventListener('click', () => {
            form.reset();
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });

        // Form submit
        form.addEventListener('submit', handleRequestSubmit);
    }

    function buildRequestForm() {
        const form = document.getElementById('form-request');
        if (!form) return;

        const assets = state.assets[state.selectedAssetType] || [];
        const assetOptions = assets
            .map(a => `<option value="${a._id}">${a.nama}</option>`)
            .join('');

        form.innerHTML = `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Jenis Peminjaman</label>
                    <select id="form-booking-type" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                        <option value="gedung">Gedung</option>
                        <option value="kendaraan">Kendaraan</option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Aset</label>
                    <select id="form-asset-id" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                        <option value="">-- Pilih Aset --</option>
                        ${assetOptions}
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nama Peminjam</label>
                    <input type="text" id="form-user-name" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" id="form-email" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
                    <input type="tel" id="form-phone" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
                        <input type="date" id="form-start-date" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai</label>
                        <input type="date" id="form-end-date" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tujuan / Keterangan</label>
                    <textarea id="form-notes" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" placeholder="Contoh: Kegiatan, lokasi tujuan, dll"></textarea>
                </div>

                <button type="submit" class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                    Kirim Request
                </button>
            </div>
        `;
    }

    async function handleRequestSubmit(e) {
        e.preventDefault();

        const bookingType = document.getElementById('form-booking-type').value;
        const assetId = document.getElementById('form-asset-id').value;
        const userName = document.getElementById('form-user-name').value;
        const email = document.getElementById('form-email').value;
        const phone = document.getElementById('form-phone').value;
        const startDate = document.getElementById('form-start-date').value;
        const endDate = document.getElementById('form-end-date').value;
        const notes = document.getElementById('form-notes').value;

        const asset = (state.assets[bookingType] || []).find(a => a._id === assetId);
        const assetName = asset?.nama || '';

        try {
            const response = await fetch(`${API_BASE}/api/public/requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingType,
                    assetId,
                    assetName,
                    userName,
                    email,
                    phone,
                    startDate,
                    endDate,
                    notes,
                    status: 'pending'
                })
            });

            if (response.ok) {
                alert('✅ Request berhasil dikirim! Tim admin akan menghubungi Anda segera.');
                document.getElementById('modal-form-request').classList.add('hidden');
                e.target.reset();
            } else {
                const error = await response.json();
                alert('❌ ' + (error.message || 'Gagal mengirim request'));
            }
        } catch (error) {
            console.error('Request submit error:', error);
            alert('❌ Terjadi kesalahan saat mengirim request');
        }
    }

    // === MAIN INITIALIZATION ===
    try {
        console.log('📂 Loading data...');
        const dataLoaded = await loadData();

        if (!dataLoaded) {
            console.error('❌ Failed to load data');
            return;
        }

        console.log('🎨 Setting up calendar...');
        state.calendar = setupCalendar();

        if (!state.calendar) {
            console.error('❌ Failed to setup calendar');
            return;
        }

        console.log('⚙️ Setting up filters...');
        setupFilters();

        console.log('📝 Setting up form...');
        setupRequestForm();

        console.log('🔄 Updating events...');
        updateCalendarEvents();

        console.log('✨ Calendar initialization complete!');
    } catch (error) {
        console.error('❌ Initialization error:', error);
    }
}
