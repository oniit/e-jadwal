// Kendaraan Form Functions
import { formatDateForInput, getAdminState } from '../../utils/helpers.js';

// Setup date validation and asset availability for kendaraan form
export function initKendaraanDateHandlers() {
    const form = document.getElementById('form-kendaraan');
    if (!form) return;
    
    const useTimeCheckbox = form.querySelector('#kendaraan-use-time');
    const timeInputsDiv = form.querySelector('#kendaraan-time-inputs');
    const startDateInput = form.querySelector('#kendaraan-mulai-tanggal');
    const endDateInput = form.querySelector('#kendaraan-selesai-tanggal');
    const startTimeInput = form.querySelector('#kendaraan-mulai-jam');
    const endTimeInput = form.querySelector('#kendaraan-selesai-jam');
    
    if (useTimeCheckbox && timeInputsDiv) {
        useTimeCheckbox.addEventListener('change', () => {
            timeInputsDiv.classList.toggle('hidden', !useTimeCheckbox.checked);
            updateKendaraanAssetAvailability();
        });
    }
    
    // Date validation
    if (startDateInput) {
        startDateInput.addEventListener('change', () => {
            if (endDateInput) {
                endDateInput.min = startDateInput.value;
            }
            updateKendaraanAssetAvailability();
        });
    }
    
    if (endDateInput) {
        endDateInput.addEventListener('change', () => {
            updateKendaraanAssetAvailability();
        });
    }
    
    if (startTimeInput) {
        startTimeInput.addEventListener('change', () => {
            updateKendaraanAssetAvailability();
        });
    }
    
    if (endTimeInput) {
        endTimeInput.addEventListener('change', () => {
            updateKendaraanAssetAvailability();
        });
    }
}

// Update kendaraan dropdown based on availability
export function updateKendaraanAssetAvailability() {
    const state = getAdminState();
    if (!state) return;
    
    const select = document.getElementById('kendaraan-name');
    const startDateInput = document.getElementById('kendaraan-mulai-tanggal');
    const endDateInput = document.getElementById('kendaraan-selesai-tanggal');
    const startTimeInput = document.getElementById('kendaraan-mulai-jam');
    const endTimeInput = document.getElementById('kendaraan-selesai-jam');
    const useTime = document.getElementById('kendaraan-use-time')?.checked;
    const bookingId = document.getElementById('kendaraan-booking-id')?.value || null;
    
    if (!select || !startDateInput?.value || !endDateInput?.value) return;
    
    let start, end;
    if (useTime && startTimeInput?.value && endTimeInput?.value) {
        start = new Date(`${startDateInput.value}T${startTimeInput.value}`);
        end = new Date(`${endDateInput.value}T${endTimeInput.value}`);
    } else {
        start = new Date(`${startDateInput.value}T00:00`);
        end = new Date(`${endDateInput.value}T23:59`);
    }
    
    if (isNaN(start) || isNaN(end) || start >= end) return;
    
    // Find unavailable kendaraan
    const unavailable = new Set();
    (state.allBookingsCache || []).forEach(booking => {
        if (booking.bookingType !== 'kendaraan') return;
        if (bookingId && booking._id === bookingId) return;
        const bs = new Date(booking.startDate);
        const be = new Date(booking.endDate);
        if (start < be && end > bs) {
            unavailable.add(booking.assetCode);
        }
    });
    
    // Update select options
    const currentValue = select.value;
    Array.from(select.options).forEach(option => {
        if (option.value && unavailable.has(option.value)) {
            option.disabled = true;
            option.text = option.text.replace(' (Tidak Tersedia)', '') + ' (Tidak Tersedia)';
        } else if (option.value) {
            option.disabled = false;
            option.text = option.text.replace(' (Tidak Tersedia)', '');
        }
    });
    
    if (currentValue && !unavailable.has(currentValue)) {
        select.value = currentValue;
    }
}

export function openKendaraanModal(booking = null) {
    const modal = document.getElementById('modal-form-kendaraan');
    const form = document.getElementById('form-kendaraan');
    const title = document.getElementById('kendaraan-form-title');
    
    if (!modal || !form) return;
    
    title.textContent = booking ? 'Edit Pinjam Kendaraan' : 'Form Pinjam Kendaraan';
    form.reset();
    
    if (booking) {
        document.getElementById('kendaraan-booking-id').value = booking._id || '';
        document.getElementById('kendaraan-peminjam').value = booking.userName || '';
        document.getElementById('kendaraan-name').value = booking.assetCode || '';
        document.getElementById('kendaraan-penanggung-jawab').value = booking.personInCharge || '';
        document.getElementById('kendaraan-nomor-penanggung-jawab').value = booking.picPhoneNumber || '';
        document.getElementById('kendaraan-tujuan').value = booking.destination || '';
        document.getElementById('kendaraan-keterangan').value = booking.notes || '';
        document.getElementById('kendaraan-mulai-tanggal').value = formatDateForInput(booking.startDate);
        document.getElementById('kendaraan-selesai-tanggal').value = formatDateForInput(booking.endDate);
        
        // Set min for end date
        const startVal = formatDateForInput(booking.startDate);
        if (startVal) {
            document.getElementById('kendaraan-selesai-tanggal').min = startVal;
        }
        
        if (booking.driver) {
            document.getElementById('kendaraan-supir').value = typeof booking.driver === 'object' ? booking.driver._id : booking.driver;
        }
        
        updateKendaraanAssetAvailability();
    }
    
    modal.classList.remove('hidden');
}
