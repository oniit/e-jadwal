// Public Calendar Main Entry Point
import { createState } from './state.js';
import { loadCalendarData, fetchBookingByCode, fetchRequestByCode } from './api.js';
import { showError } from './utils.js';
import { initializeCalendar } from './calendar.js';
import { populateAssetFilter, populateDriverFilter } from './filters.js';
import { initializeModals, showDetailModalFull } from './modals.js';
import { renderFormRequest, handleRequestSubmit, resetRequestBarangChips } from './request-form.js';

let initialized = false;

async function initializePublicSchedule() {
    if (initialized) return;
    initialized = true;
    const state = createState();
    const elements = {
        calendarEl: document.getElementById('calendar'),
        assetFilter: document.getElementById('calendar-asset-filter'),
        driverFilter: document.getElementById('calendar-driver-filter'),
        tabGedung: document.getElementById('calendar-tab-gedung'),
        tabKendaraan: document.getElementById('calendar-tab-kendaraan'),
        modal: document.getElementById('modal-detail-event'),
        modalTitle: document.getElementById('modal-title'),
        modalBody: document.getElementById('modal-body'),
        btnSearchBooking: document.getElementById('btn-search-booking'),
        btnFormRequest: document.getElementById('btn-form'),
        modalFormRequest: document.getElementById('modal-form-request'),
        formRequest: document.getElementById('form-request'),
    };
    if (!elements.calendarEl) return;
    const calendar = initializeCalendar(state, elements);
    initializeModals(elements);
    const setActiveTab = (type) => {
        state.viewType = type;
        elements.tabGedung?.classList.toggle('active', type === 'gedung');
        elements.tabKendaraan?.classList.toggle('active', type === 'kendaraan');
        populateAssetFilter(state, elements);
        populateDriverFilter(state, elements);
        renderFormRequest(state, elements);
        calendar.refetchEvents();
    };
    elements.tabGedung?.addEventListener('click', () => setActiveTab('gedung'));
    elements.tabKendaraan?.addEventListener('click', () => setActiveTab('kendaraan'));
    elements.assetFilter?.addEventListener('change', (e) => {
        state.selectedAsset = e.target.value || 'all';
        calendar.refetchEvents();
    });
    elements.driverFilter?.addEventListener('change', (e) => {
        state.selectedDriver = e.target.value || 'all';
        calendar.refetchEvents();
    });
    if (elements.btnFormRequest) {
        elements.btnFormRequest.addEventListener('click', () => {
            renderFormRequest(state, elements);
            elements.modalFormRequest.classList.remove('hidden');
        });
    }
    if (elements.formRequest) {
        elements.formRequest.addEventListener('submit', (e) => {
            handleRequestSubmit(e, state, elements, calendar);
        });
    }
    const closeReqBtn = elements.modalFormRequest?.querySelector('.modal-close-btn');
    closeReqBtn?.addEventListener('click', () => elements.modalFormRequest.classList.add('hidden'));
    const resetReqBtn = elements.modalFormRequest?.querySelector('.modal-reset-btn');
    resetReqBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (elements.formRequest) {
            elements.formRequest.reset();
            if (state.viewType === 'gedung') {
                resetRequestBarangChips(state, elements);
            }
        }
    });
    elements.modalFormRequest?.addEventListener('click', (e) => {
        if (e.target === elements.modalFormRequest) elements.modalFormRequest.classList.add('hidden');
    });
    if (elements.btnSearchBooking) {
        elements.btnSearchBooking.addEventListener('click', async () => {
            const code = prompt('Masukkan Booking ID atau Request ID');
            if (!code) return;
            try {
                const trimmedCode = code.trim();
                let data;
                if (/^\d{6}-[A-Z0-9]{5}$/i.test(trimmedCode)) {
                    data = await fetchBookingByCode(trimmedCode);
                } else if (/^[A-Z0-9]{5}$/i.test(trimmedCode)) {
                    data = await fetchRequestByCode(trimmedCode);
                } else {
                    try {
                        data = await fetchBookingByCode(trimmedCode);
                    } catch {
                        data = await fetchRequestByCode(trimmedCode);
                    }
                }
                showDetailModalFull(data, state, elements);
            } catch (err) {
                alert(err.message || 'Data tidak ditemukan');
            }
        });
    }
    try {
        const data = await loadCalendarData();
        state.assets = data.assets;
        state.drivers = data.drivers;
        // Enrich bookings with vehicle plate if available
        const kendaraanAssets = Array.isArray(data.assets?.kendaraan) ? data.assets.kendaraan : [];
        const kendaraanByCode = new Map(kendaraanAssets.map(a => [a.code, a]));
        state.bookings = (data.bookings || []).map(b => {
            if (b?.bookingType === 'kendaraan') {
                const asset = kendaraanByCode.get(b.assetCode);
                // Get plate from asset.plate field if available
                const plate = (asset && typeof asset.plate === 'string' && asset.plate.trim()) ? asset.plate.trim() : null;
                return plate ? { ...b, assetPlate: plate } : { ...b, assetPlate: null };
            }
            return b;
        });
        populateAssetFilter(state, elements);
        populateDriverFilter(state, elements);
        calendar.refetchEvents();
    } catch (err) {
        console.error('Gagal memuat data', err);
        showError(elements.calendarEl?.parentElement, 'Tidak dapat memuat jadwal. Coba beberapa saat lagi.');
    }
    calendar.render();
    setActiveTab('gedung');
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePublicSchedule);
} else {
    initializePublicSchedule();
}
