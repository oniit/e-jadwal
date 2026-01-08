// Landing page calendar initialization
const API_BASE = window.location.origin;

document.addEventListener('DOMContentLoaded', async () => {
    await initializeCalendar();
});

async function initializeCalendar() {
    // State
    const state = {
        bookings: [],
        assets: {},
        selectedAssetFilter: 'all',
        selectedAssetType: 'gedung',
    };

    // === KALENDER SETUP ===
    function setupCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return;

        let calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'id',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
            },
            plugins: ['daygrid', 'timegrid', 'list', 'interaction'],
            events: [],
            eventDidMount: function(info) {
                if (info.event.extendedProps.type === 'gedung') {
                    info.el.style.backgroundColor = 'rgb(6, 182, 212)';
                    info.el.style.borderColor = 'rgb(6, 182, 212)';
                } else if (info.event.extendedProps.type === 'kendaraan') {
                    info.el.style.backgroundColor = 'rgb(34, 197, 94)';
                    info.el.style.borderColor = 'rgb(34, 197, 94)';
                }
            },
            eventClick: function(info) {
                showEventDetail(info.event);
            }
        });

        calendar.render();
        return calendar;
    }

    // === FETCH DATA ===
    async function loadBookings() {
        try {
            const bookings = await fetch(`${API_BASE}/api/public/bookings`)
                .then(r => r.json());
            state.bookings = bookings || [];
            console.log('✅ Loaded', state.bookings.length, 'bookings');
        } catch (error) {
            console.error('Failed to load bookings:', error);
        }
    }

    async function loadAssets() {
        try {
            const assets = await fetch(`${API_BASE}/api/public/assets`)
                .then(r => r.json());
            state.assets = assets || {};
            console.log('✅ Loaded assets');
        } catch (error) {
            console.error('Failed to load assets:', error);
        }
    }

    // === SETUP FILTERS ===
    function setupFilters() {
        // Asset filter
        const assetFilter = document.getElementById('calendar-asset-filter');
        if (assetFilter) {
            assetFilter.addEventListener('change', (e) => {
                state.selectedAssetFilter = e.target.value;
                updateCalendarEvents();
            });
            updateAssetFilterOptions();
        }

        // Driver filter (for kendaraan type)
        const driverFilter = document.getElementById('calendar-driver-filter');
        if (driverFilter) {
            driverFilter.addEventListener('change', () => {
                updateCalendarEvents();
            });
        }

        // Tab buttons
        const tabGedung = document.getElementById('calendar-tab-gedung');
        const tabKendaraan = document.getElementById('calendar-tab-kendaraan');

        if (tabGedung) {
            tabGedung.addEventListener('click', () => {
                state.selectedAssetType = 'gedung';
                tabGedung.classList.add('active');
                if (tabKendaraan) tabKendaraan.classList.remove('active');
                
                // Toggle driver filter visibility
                if (driverFilter) driverFilter.classList.add('hidden');
                
                updateCalendarEvents();
            });
        }

        if (tabKendaraan) {
            tabKendaraan.addEventListener('click', () => {
                state.selectedAssetType = 'kendaraan';
                tabKendaraan.classList.add('active');
                if (tabGedung) tabGedung.classList.remove('active');
                
                // Show driver filter for kendaraan
                if (driverFilter) driverFilter.classList.remove('hidden');
                
                updateCalendarEvents();
            });
        }
    }

    function updateAssetFilterOptions() {
        const assetFilter = document.getElementById('calendar-asset-filter');
        if (!assetFilter) return;

        const assets = state.assets[state.selectedAssetType] || [];
        const options = [
            { value: 'all', text: 'Semua ' + (state.selectedAssetType === 'gedung' ? 'Gedung' : 'Kendaraan') }
        ];

        assets.forEach(asset => {
            options.push({
                value: asset._id,
                text: asset.nama
            });
        });

        assetFilter.innerHTML = options
            .map(opt => `<option value="${opt.value}">${opt.text}</option>`)
            .join('');
    }

    function updateCalendarEvents() {
        const calendarEl = document.getElementById('calendar');
        const calendar = FullCalendar.getCalendarConstructor()?.calendar;
        if (!calendarEl || !calendarEl._calendar) {
            console.warn('Calendar not found');
            return;
        }

        const cal = calendarEl._calendar;
        const events = [];

        state.bookings
            .filter(b => b.bookingType === state.selectedAssetType)
            .filter(b => state.selectedAssetFilter === 'all' || b.assetId === state.selectedAssetFilter)
            .forEach(booking => {
                events.push({
                    id: booking._id,
                    title: booking.assetName,
                    start: new Date(booking.startDate).toISOString().split('T')[0],
                    end: new Date(new Date(booking.endDate).getTime() + 86400000).toISOString().split('T')[0],
                    extendedProps: {
                        type: booking.bookingType,
                        assetName: booking.assetName,
                        userName: booking.userName,
                        notes: booking.notes,
                        items: booking.items
                    }
                });
            });

        cal.removeAllEvents();
        cal.addEventSource(events);
    }

    // === EVENT DETAIL MODAL ===
    function showEventDetail(event) {
        const modal = document.getElementById('modal-detail-event');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');

        if (!modal) return;

        modalTitle.textContent = 'Detail Peminjaman';
        modalBody.innerHTML = `
            <p><strong>Aset:</strong> ${event.extendedProps.assetName}</p>
            <p><strong>Peminjam:</strong> ${event.extendedProps.userName}</p>
            <p><strong>Tanggal:</strong> ${event.start} sampai ${event.end}</p>
            <p><strong>Catatan:</strong> ${event.extendedProps.notes || '-'}</p>
            ${event.extendedProps.items ? `<p><strong>Items:</strong> ${event.extendedProps.items}</p>` : ''}
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

        // Close modal buttons
        document.querySelectorAll('.modal-close-btn, .modal-reset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal-backdrop')?.classList.add('hidden');
            });
        });

        // Close on backdrop click
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    backdrop.classList.add('hidden');
                }
            });
        });
    }

    function buildRequestForm() {
        const form = document.getElementById('form-request');
        if (!form) return;

        const assets = state.assets[state.selectedAssetType] || [];
        const assetOptions = assets
            .map(a => `<option value="${a._id}">${a.nama}</option>`)
            .join('');

        form.innerHTML = `
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Jenis Peminjaman</label>
                <select id="form-booking-type" class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                    <option value="gedung">Gedung</option>
                    <option value="kendaraan">Kendaraan</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Aset</label>
                <select id="form-asset-id" class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                    <option value="">-- Pilih Aset --</option>
                    ${assetOptions}
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nama Peminjam</label>
                <input type="text" id="form-user-name" class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" id="form-email" class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
                <input type="tel" id="form-phone" class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
                <input type="date" id="form-start-date" class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai</label>
                <input type="date" id="form-end-date" class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tujuan Penggunaan</label>
                <textarea id="form-notes" class="w-full px-3 py-2 border border-gray-300 rounded-lg" rows="3"></textarea>
            </div>
            <button type="submit" class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Kirim Request</button>
        `;

        form.addEventListener('submit', handleRequestSubmit);
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

        // Find asset name
        const asset = (state.assets[bookingType] || []).find(a => a._id === assetId);
        const assetName = asset?.nama || '';

        try {
            const response = await fetch(`${API_BASE}/api/requests`, {
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
                alert('Request berhasil dikirim! Tim admin akan menghubungi Anda segera.');
                document.getElementById('modal-form-request').classList.add('hidden');
                e.target.reset();
            } else {
                const error = await response.json();
                alert(error.message || 'Gagal mengirim request');
            }
        } catch (error) {
            console.error('Error submitting request:', error);
            alert('Terjadi kesalahan saat mengirim request');
        }
    }

    // === INITIALIZE ===
    try {
        await loadBookings();
        await loadAssets();
        
        const calendar = setupCalendar();
        if (calendar) {
            // Store reference in DOM for later access
            document.getElementById('calendar')._calendar = calendar;
        }
        
        setupFilters();
        setupRequestForm();
        
        updateCalendarEvents();
        console.log('✅ Calendar initialized successfully');
    } catch (error) {
        console.error('Failed to initialize calendar:', error);
    }
}
