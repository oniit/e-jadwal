import { submitRequest } from './api.js';

const GEDUNG_START = '07:00';
const GEDUNG_END = '16:00';

export const renderFormRequest = (state, elements) => {
    if (!elements.formRequest) return;
    const type = state.viewType;
    const commonFormHtml = `
        <input type="hidden" id="req-booking-id">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label for="req-penanggung-jawab" class="form-label text-sm">Nama PIC/PJ</label>
            <input type="text" id="req-penanggung-jawab" required class="form-input"></div>
            <div><label for="req-hp-pj" class="form-label text-sm">No HP PIC/PJ</label>
            <input type="tel" id="req-hp-pj" required class="form-input"></div>
            <div><label for="req-name" class="form-label text-sm">Nama Unit</label>
            <input type="text" id="req-name" required class="form-input"></div>
            <div><label for="req-aset" class="form-label text-sm">Pilih ${type === 'gedung' ? 'Gedung' : 'Kendaraan'}</label>
            <select id="req-aset" required class="form-input"></select></div>
            <div><label for="req-mulai-tanggal" class="form-label text-sm">Tanggal Mulai</label>
            <input type="date" id="req-mulai-tanggal" required class="form-input"></div>
            <div><label for="req-selesai-tanggal" class="form-label text-sm">Tanggal Selesai</label>
            <input type="date" id="req-selesai-tanggal" required class="form-input"></div>
            <div id="req-time-inputs" class="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 hidden">
                <div><label for="req-mulai-jam" class="form-label text-sm">Jam Mulai</label>
                <input type="time" id="req-mulai-jam" class="form-input"></div>
                <div><label for="req-selesai-jam" class="form-label text-sm">Jam Selesai</label>
                <input type="time" id="req-selesai-jam" class="form-input"></div>
            </div>
            <div class="col-span-2 flex items-center"><input id="req-use-time" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500">
            <label for="req-use-time" class="ml-2 block text-sm text-gray-900">Pakai Jam Spesifik</label></div>
        </div>
    `;
    const gedungExtraFields = `
        <div><label for="req-kegiatan" class="form-label text-sm">Nama Kegiatan</label>
        <input type="text" id="req-kegiatan" class="form-input"></div>
        <div>
            <label class="form-label text-sm">Barang Dipinjam (Opsional)</label>
            <div class="grid grid-cols-5 gap-2 mb-2">
                <select id="req-barang-select" class="form-input col-span-3"></select>
                <input id="req-barang-qty" type="number" min="1" step="1" class="form-input col-span-1" placeholder="Qty">
                <button type="button" id="req-barang-add" class="add-btn col-span-1">+</button>
            </div>
            <div id="req-barang-chips" class="flex flex-wrap gap-2 p-2 border rounded-md bg-gray-50 min-h-10 text-sm"></div>
        </div>
        <div><label for="req-keterangan" class="form-label text-sm">Keterangan (Opsional)</label>
        <textarea id="req-keterangan" rows="2" class="form-input"></textarea></div>
        <div><label for="req-surat" class="form-label text-sm">Upload Surat</label>
        <input type="file" id="req-surat" class="form-input" accept=".pdf,.doc,.docx,.jpg,.png"></div>
        <button type="submit" class="w-full add-btn save-btn">Submit Request</button>
    `;
    const kendaraanExtraFields = `
        <div><label for="req-tujuan" class="form-label text-sm">Tujuan</label>
        <input type="text" id="req-tujuan" class="form-input"></div>
        <div><label for="req-keterangan" class="form-label text-sm">Keterangan (Opsional)</label>
        <textarea id="req-keterangan" rows="2" class="form-input"></textarea></div>
        <div><label for="req-surat" class="form-label text-sm">Upload Surat</label>
        <input type="file" id="req-surat" class="form-input" accept=".pdf,.doc,.docx,.jpg,.png"></div>
        <button type="submit" class="w-full add-btn save-btn">Submit Request</button>
    `;
    
    elements.formRequest.innerHTML = commonFormHtml + (type === 'gedung' ? gedungExtraFields : kendaraanExtraFields);
    
    populateRequestAssets(state, elements);
    setupRequestFormLogic(state, elements);
};

const populateRequestAssets = (state, elements, unavailableAssets = new Set()) => {
    const select = document.getElementById('req-aset');
    if (!select) return;
    const assets = state.viewType === 'gedung' ? state.assets.gedung : state.assets.kendaraan;
    select.innerHTML = '';
    assets.forEach(a => {
        const option = new Option(a.name, a.code);
        if (unavailableAssets.has(a.code)) {
            option.disabled = true;
            option.text = `${a.name} (Tidak Tersedia)`;
        }
        select.add(option);
    });
};

const updateAvailableRequestAssets = (state, elements) => {
    const useTime = document.getElementById('req-use-time')?.checked;
    const startDateInput = document.getElementById('req-mulai-tanggal');
    const endDateInput = document.getElementById('req-selesai-tanggal');
    const startTimeInput = document.getElementById('req-mulai-jam');
    const endTimeInput = document.getElementById('req-selesai-jam');

    if (!startDateInput?.value || !endDateInput?.value) {
        populateRequestAssets(state, elements);
        return;
    }

    let start, end;
    if (useTime && startTimeInput?.value && endTimeInput?.value) {
        start = new Date(`${startDateInput.value}T${startTimeInput.value}`);
        end = new Date(`${endDateInput.value}T${endTimeInput.value}`);
    } else {
        const timeStart = state.viewType === 'gedung' ? GEDUNG_START : '00:00';
        const timeEnd = state.viewType === 'gedung' ? GEDUNG_END : '23:59';
        start = new Date(`${startDateInput.value}T${timeStart}`);
        end = new Date(`${endDateInput.value}T${timeEnd}`);
    }

    if (isNaN(start) || isNaN(end) || start >= end) {
        populateRequestAssets(state, elements);
        return;
    }

    const unavailable = new Set();
    state.bookings.forEach(booking => {
        if (booking.bookingType !== state.viewType) return;
        const bs = new Date(booking.startDate);
        const be = new Date(booking.endDate);
        if (start < be && end > bs) {
            unavailable.add(booking.assetCode);
        }
    });

    populateRequestAssets(state, elements, unavailable);
};

const setupRequestFormLogic = (state, elements) => {
    const useTimeCheckbox = document.getElementById('req-use-time');
    const timeInputsDiv = document.getElementById('req-time-inputs');
    const startDateInput = document.getElementById('req-mulai-tanggal');
    const endDateInput = document.getElementById('req-selesai-tanggal');
    
    if (!useTimeCheckbox || !timeInputsDiv || !startDateInput || !endDateInput) return;
    
    useTimeCheckbox.addEventListener('change', () => {
        timeInputsDiv.classList.toggle('hidden', !useTimeCheckbox.checked);
        updateAvailableRequestAssets(state, elements);
        updateRequestAssetAvailability(state, elements);
    });
    
    startDateInput.addEventListener('change', () => {
        endDateInput.min = startDateInput.value;
        updateAvailableRequestAssets(state, elements);
        updateRequestAssetAvailability(state, elements);
    });
    endDateInput.addEventListener('change', () => {
        updateAvailableRequestAssets(state, elements);
        updateRequestAssetAvailability(state, elements);
    });
    
    document.getElementById('req-mulai-jam')?.addEventListener('change', () => {
        updateAvailableRequestAssets(state, elements);
        updateRequestAssetAvailability(state, elements);
    });
    document.getElementById('req-selesai-jam')?.addEventListener('change', () => {
        updateAvailableRequestAssets(state, elements);
        updateRequestAssetAvailability(state, elements);
    });
    
    if (state.viewType === 'gedung') {
        resetRequestBarangChips(state, elements);
        const addBtn = document.getElementById('req-barang-add');
        const qtyInput = document.getElementById('req-barang-qty');
        const select = document.getElementById('req-barang-select');
        
        select?.addEventListener('change', () => setRequestBarangQtyMax(state, elements));
        qtyInput?.addEventListener('input', () => setRequestBarangQtyMax(state, elements));
        addBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            const code = select?.value;
            const qty = Number(qtyInput?.value);
            if (code && qty > 0) {
                const assetName = select?.options[select?.selectedIndex]?.text || code;
                addRequestBarangToForm(state, elements, code, assetName, qty);
                qtyInput.value = '';
                setRequestBarangQtyMax(state, elements);
            }
        });
    }
    
    updateRequestAssetAvailability(state, elements);
};

const updateRequestAssetAvailability = (state, elements) => {
    const useTime = document.getElementById('req-use-time')?.checked;
    const startDateInput = document.getElementById('req-mulai-tanggal');
    const endDateInput = document.getElementById('req-selesai-tanggal');
    const startTimeInput = document.getElementById('req-mulai-jam');
    const endTimeInput = document.getElementById('req-selesai-jam');
    
    if (!startDateInput?.value || !endDateInput?.value) return;
    
    let start, end;
    if (useTime) {
        if (!startTimeInput?.value || !endTimeInput?.value) {
            start = new Date(`${startDateInput.value}T${GEDUNG_START}`);
            end = new Date(`${endDateInput.value}T${GEDUNG_END}`);
        } else {
            start = new Date(`${startDateInput.value}T${startTimeInput.value}`);
            end = new Date(`${endDateInput.value}T${endTimeInput.value}`);
        }
    } else {
        start = new Date(`${startDateInput.value}T${GEDUNG_START}`);
        end = new Date(`${endDateInput.value}T${GEDUNG_END}`);
    }
    
    if (isNaN(start) || isNaN(end) || start >= end) return;
    
    if (state.viewType === 'gedung') {
        computeAndDisplayRequestBarangAvailability(state, elements, start, end);
    }
};

const computeAndDisplayRequestBarangAvailability = (state, elements, start, end) => {
    const used = new Map();
    state.bookings.forEach(b => {
        if (b.bookingType !== 'gedung') return;
        const bs = new Date(b.startDate);
        const be = new Date(b.endDate);
        if (!(start < be && end > bs)) return;
        if (!Array.isArray(b.borrowedItems)) return;
        b.borrowedItems.forEach(it => {
            if (it && it.assetCode) {
                used.set(it.assetCode, (used.get(it.assetCode) || 0) + Number(it.quantity || 0));
            }
        });
    });
    
    const availability = new Map();
    (state.assets.barang || []).forEach(b => {
        const max = Number(b.num || 0);
        const u = used.get(b.code) || 0;
        availability.set(b.code, Math.max(0, max - u));
    });
    
    const form = elements.formRequest;
    const items = form.__barangItems ? [...form.__barangItems.values()] : [];
    items.forEach(it => {
        const cur = availability.get(it.assetCode) ?? 0;
        availability.set(it.assetCode, Math.max(0, cur - Number(it.quantity || 0)));
    });
    
    form.__barangAvailability = availability;
    populateRequestBarangSelector(elements, state.assets.barang || [], availability);
    setRequestBarangQtyMax(state, elements);
};

const populateRequestBarangSelector = (elements, assetsBarang, availabilityMap = null) => {
    const select = document.getElementById('req-barang-select');
    if (!select) return;
    const current = select.value;
    select.innerHTML = '';
    assetsBarang.forEach(b => {
        const available = availabilityMap ? (availabilityMap.get(b.code) ?? b.num ?? 0) : (b.num ?? 0);
        const option = new Option(`${b.name} (stok: ${available})`, b.code);
        option.disabled = available <= 0;
        select.add(option);
    });
    if (current) select.value = current;
};

const setRequestBarangQtyMax = (state, elements) => {
    const select = document.getElementById('req-barang-select');
    const qtyInput = document.getElementById('req-barang-qty');
    if (!select || !qtyInput) return;
    
    const code = select.value || null;
    const availabilityMap = elements.formRequest?.__barangAvailability;
    let max = 0;
    
    if (availabilityMap && code) {
        max = availabilityMap.get(code) ?? 0;
    }
    if (max < 0) max = 0;
    
    qtyInput.max = String(max);
    qtyInput.placeholder = max > 0 ? `Qty (maks: ${max})` : 'Qty';
    if (qtyInput.value) {
        const v = Number(qtyInput.value);
        if (Number.isFinite(v) && v > max) qtyInput.value = max;
    }
    qtyInput.disabled = max === 0;
};

const resetRequestBarangChips = (state, elements) => {
    elements.formRequest.__barangItems = new Map();
    const chips = document.getElementById('req-barang-chips');
    if (chips) chips.innerHTML = '';
    populateRequestBarangSelector(elements, state.assets.barang || []);
};

const addRequestBarangToForm = (state, elements, assetCode, assetName, quantity) => {
    const form = elements.formRequest;
    if (!form.__barangItems) form.__barangItems = new Map();
    form.__barangItems.set(assetCode, { assetCode, assetName, quantity });
    
    const chips = document.getElementById('req-barang-chips');
    const chip = document.createElement('span');
    chip.className = 'inline-flex items-center bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full';
    chip.dataset.code = assetCode;
    chip.innerHTML = `
        <span class="mr-1 font-semibold">${assetName}: ${quantity}</span>
        <button type="button" class="ml-1 text-emerald-800 hover:text-red-600" title="Hapus">&times;</button>
    `;
    
    chips?.querySelectorAll('span[data-code]')
        .forEach(n => { if (n.dataset.code === assetCode) n.remove(); });
    chips?.appendChild(chip);
    
    chip.querySelector('button')?.addEventListener('click', () => {
        form.__barangItems.delete(assetCode);
        chip.remove();
    });
};

export const handleRequestSubmit = async (e, state, elements, calendar) => {
    e.preventDefault();
    const form = elements.formRequest;
    const mulaiDate = form.querySelector('#req-mulai-tanggal').value;
    const selesaiDate = form.querySelector('#req-selesai-tanggal').value;
    const useTime = form.querySelector('#req-use-time')?.checked;
    
    if (!mulaiDate || !selesaiDate) {
        alert('Tanggal mulai dan selesai wajib diisi.');
        return;
    }
    
    const mulai = new Date(mulaiDate);
    const selesai = new Date(selesaiDate);
    if (mulai > selesai) {
        alert('Tanggal selesai harus setelah atau sama dengan tanggal mulai.');
        return;
    }

    let startDate, endDate;
    if (useTime) {
        const startTime = form.querySelector('#req-mulai-jam')?.value;
        const endTime = form.querySelector('#req-selesai-jam')?.value;
        if (state.viewType === 'gedung' && (!startTime || !endTime)) {
            startDate = new Date(`${mulaiDate}T${GEDUNG_START}`);
            endDate = new Date(`${selesaiDate}T${GEDUNG_END}`);
        } else {
            startDate = new Date(`${mulaiDate}T${startTime || '00:00'}`);
            endDate = new Date(`${selesaiDate}T${endTime || '23:59'}`);
        }
    } else {
        const timeStart = state.viewType === 'gedung' ? GEDUNG_START : '00:00';
        const timeEnd = state.viewType === 'gedung' ? GEDUNG_END : '23:59';
        startDate = new Date(`${mulaiDate}T${timeStart}`);
        endDate = new Date(`${selesaiDate}T${timeEnd}`);
    }

    const assetCode = form.querySelector('#req-aset').value;
    const assetList = state.viewType === 'gedung' ? state.assets.gedung : state.assets.kendaraan;
    const selectedAsset = assetList.find(a => a.code === assetCode);
    const assetName = selectedAsset ? selectedAsset.name : assetCode;

    const requestData = {
        bookingType: state.viewType,
        userName: form.querySelector('#req-name').value,
        personInCharge: form.querySelector('#req-penanggung-jawab').value,
        picPhoneNumber: form.querySelector('#req-hp-pj').value,
        assetCode: assetCode,
        assetName: assetName,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        notes: form.querySelector('#req-keterangan')?.value,
    };

    if (state.viewType === 'gedung') {
        const itemsMap = form.__barangItems || new Map();
        if (itemsMap.size) {
            requestData.borrowedItems = Array.from(itemsMap.values());
        }
        requestData.activityName = form.querySelector('#req-kegiatan')?.value;
    } else {
        requestData.driver = null;
        requestData.destination = form.querySelector('#req-tujuan')?.value;
    }

    try {
        const suratInput = form.querySelector('#req-surat');
        const letterFile = suratInput && suratInput.files && suratInput.files[0] ? suratInput.files[0] : null;
        
        const result = await submitRequest(requestData, letterFile);
        
        alert(`Request berhasil diajukan! ID Request: ${result.requestId}`);
        form.reset();
        elements.modalFormRequest.classList.add('hidden');
        calendar.refetchEvents();
    } catch (err) {
        alert(`Error: ${err.message}`);
    }
};
