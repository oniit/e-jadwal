// Gedung Form Functions
import { formatDateForInput, getAdminState } from '../../utils/helpers.js';

export function populateBarangSelect(availabilityMap = null) {
    const state = getAdminState();
    const select = document.getElementById('gedung-barang-select');
    if (!state || !select) return;
    const assets = Array.isArray(state.assets?.barang) ? state.assets.barang : [];
    const current = select.value;
    select.innerHTML = '';
    assets.forEach(b => {
        const available = availabilityMap ? (availabilityMap.get(b.code) ?? 0) : Number(b.num || 0);
        const option = document.createElement('option');
        option.value = b.code;
        option.textContent = `${b.name} (${b.code})${Number.isFinite(available) ? ` - tersisa ${available}` : ''}`;
        option.disabled = available <= 0;
        select.appendChild(option);
    });
    if (current) select.value = current;
}

export function resetGedungBarangForm(form) {
    if (!form) return;
    form.__barangItems = new Map();
    const chips = form.querySelector('#gedung-barang-chips');
    if (chips) chips.innerHTML = '';
    populateBarangSelect();
    setBarangQtyMax(form, null);
}

export function addBarangItemToForm(form, assetCode, assetName, quantity) {
    if (!form) return;
    if (!form.__barangItems) form.__barangItems = new Map();
    form.__barangItems.set(assetCode, { assetCode, assetName, quantity });
    const chips = form.querySelector('#gedung-barang-chips');
    if (!chips) return;
    const chip = document.createElement('span');
    chip.className = 'inline-flex items-center bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full';
    chip.dataset.code = assetCode;
    chip.innerHTML = `
        <span class="mr-1 font-semibold">${assetName}: ${quantity}</span>
        <button type="button" class="ml-1 text-emerald-800 hover:text-red-600" title="Hapus">&times;</button>
    `;
    chips.querySelectorAll('span[data-code]').forEach(node => {
        if (node.dataset.code === assetCode) node.remove();
    });
    chips.appendChild(chip);
    chip.querySelector('button')?.addEventListener('click', () => {
        form.__barangItems.delete(assetCode);
        chip.remove();
        updateGedungBarangAvailability(form);
    });
}

export function computeBarangAvailability(start, end, excludeBookingId = null) {
    const state = getAdminState();
    if (!state || !start || !end) return new Map();
    const used = new Map();
    state.allBookingsCache.forEach(b => {
        if (excludeBookingId && b._id === excludeBookingId) return;
        const bs = new Date(b.startDate);
        const be = new Date(b.endDate);
        if (!(start < be && end > bs)) return;
        if (!Array.isArray(b.borrowedItems)) return;
        b.borrowedItems.forEach(it => {
            const code = it.assetCode;
            const qty = Number(it.quantity || 0);
            if (!code || !Number.isFinite(qty) || qty <= 0) return;
            used.set(code, (used.get(code) || 0) + qty);
        });
    });
    const availability = new Map();
    (state.assets?.barang || []).forEach(item => {
        const max = Number(item.num || 0);
        const usedQty = used.get(item.code) || 0;
        availability.set(item.code, Math.max(0, max - usedQty));
    });
    return availability;
}

export function setBarangQtyMax(form, availabilityMap) {
    const select = form?.querySelector('#gedung-barang-select');
    const qtyInput = form?.querySelector('#gedung-barang-qty');
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

export function updateGedungBarangAvailability(form) {
    const state = getAdminState();
    if (!state || !form) return;
    const useTime = form.querySelector('#gedung-use-time')?.checked;
    const startDateInput = form.querySelector('#gedung-mulai-tanggal');
    const endDateInput = form.querySelector('#gedung-selesai-tanggal');
    const startTimeInput = form.querySelector('#gedung-mulai-jam');
    const endTimeInput = form.querySelector('#gedung-selesai-jam');
    const bookingId = form.querySelector('#gedung-booking-id')?.value || null;

    if (!startDateInput || !endDateInput) return;

    let start;
    let end;
    if (useTime) {
        if (!startDateInput.value || !endDateInput.value || !startTimeInput?.value || !endTimeInput?.value) {
            populateBarangSelect();
            form.__barangAvailability = null;
            setBarangQtyMax(form, null);
            return;
        }
        start = new Date(`${startDateInput.value}T${startTimeInput.value}`);
        end = new Date(`${endDateInput.value}T${endTimeInput.value}`);
    } else {
        if (!startDateInput.value || !endDateInput.value) {
            populateBarangSelect();
            form.__barangAvailability = null;
            setBarangQtyMax(form, null);
            return;
        }
        start = new Date(startDateInput.value);
        end = new Date(endDateInput.value);
        end.setHours(23, 59, 59, 999);
    }

    if (isNaN(start) || isNaN(end) || start >= end) {
        populateBarangSelect();
        form.__barangAvailability = null;
        setBarangQtyMax(form, null);
        return;
    }

    const availability = computeBarangAvailability(start, end, bookingId);
    const items = form.__barangItems ? [...form.__barangItems.values()] : [];
    items.forEach(it => {
        const current = availability.get(it.assetCode) ?? 0;
        availability.set(it.assetCode, Math.max(0, current - Number(it.quantity || 0)));
    });
    form.__barangAvailability = availability;
    populateBarangSelect(availability);
    setBarangQtyMax(form, availability);
}

export function hydrateBarangFromBooking(form, booking) {
    if (!form) return;
    resetGedungBarangForm(form);
    if (booking?.borrowedItems && Array.isArray(booking.borrowedItems)) {
        booking.borrowedItems.forEach(it => {
            addBarangItemToForm(form, it.assetCode, it.assetName, it.quantity);
        });
    }
    updateGedungBarangAvailability(form);
}

export function initGedungBarangHandlers() {
    const form = document.getElementById('form-gedung');
    if (!form) return;

    const useTimeCheckbox = form.querySelector('#gedung-use-time');
    const timeInputsDiv = form.querySelector('#gedung-time-inputs');
    const startDateInput = form.querySelector('#gedung-mulai-tanggal');
    const endDateInput = form.querySelector('#gedung-selesai-tanggal');
    const startTimeInput = form.querySelector('#gedung-mulai-jam');
    const endTimeInput = form.querySelector('#gedung-selesai-jam');
    const addBtn = form.querySelector('#gedung-barang-add');
    const qtyInput = form.querySelector('#gedung-barang-qty');
    const select = form.querySelector('#gedung-barang-select');

    resetGedungBarangForm(form);

    if (useTimeCheckbox && timeInputsDiv) {
        useTimeCheckbox.addEventListener('change', () => {
            timeInputsDiv.classList.toggle('hidden', !useTimeCheckbox.checked);
            updateGedungBarangAvailability(form);
        });
    }

    [startDateInput, endDateInput, startTimeInput, endTimeInput].forEach(input => {
        input?.addEventListener('change', () => updateGedungBarangAvailability(form));
    });

    select?.addEventListener('change', () => setBarangQtyMax(form, form.__barangAvailability || null));
    qtyInput?.addEventListener('input', () => setBarangQtyMax(form, form.__barangAvailability || null));

    addBtn?.addEventListener('click', () => {
        const state = getAdminState();
        if (!state) return alert('Data aset belum siap.');
        const code = select?.value;
        const qty = Number(qtyInput?.value);
        const asset = (state.assets?.barang || []).find(b => b.code === code);
        if (!asset) return alert('Pilih barang.');
        if (!Number.isFinite(qty) || qty <= 0) return alert('Masukkan qty valid.');
        const availability = form.__barangAvailability || new Map();
        const available = availability.get(code) ?? 0;
        if (qty > available) return alert(`Qty melebihi stok tersedia (${available}).`);
        addBarangItemToForm(form, asset.code, asset.name, qty);
        if (qtyInput) qtyInput.value = '';
        updateGedungBarangAvailability(form);
    });

    updateGedungBarangAvailability(form);
}

export function openGedungModal(booking = null) {
    const modal = document.getElementById('modal-form-gedung');
    const form = document.getElementById('form-gedung');
    const title = document.getElementById('gedung-form-title');
    
    if (!modal || !form) return;
    
    title.textContent = booking ? 'Edit Pinjam Gedung' : 'Form Pinjam Gedung';
    form.reset();
    resetGedungBarangForm(form);
    
    if (booking) {
        document.getElementById('gedung-booking-id').value = booking._id || '';
        document.getElementById('gedung-peminjam').value = booking.userName || '';
        document.getElementById('gedung-name').value = booking.assetCode || '';
        document.getElementById('gedung-penanggung-jawab').value = booking.personInCharge || '';
        document.getElementById('gedung-nomor-penanggung-jawab').value = booking.picPhoneNumber || '';
        document.getElementById('gedung-kegiatan').value = booking.activityName || '';
        document.getElementById('gedung-keterangan').value = booking.notes || '';
        document.getElementById('gedung-mulai-tanggal').value = formatDateForInput(booking.startDate);
        document.getElementById('gedung-selesai-tanggal').value = formatDateForInput(booking.endDate);
        hydrateBarangFromBooking(form, booking);
    } else {
        updateGedungBarangAvailability(form);
    }
    
    modal.classList.remove('hidden');
}
