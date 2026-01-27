import { ui } from './ui.js';
import { normalizeDrivers } from '../utils/helpers.js';

export function populateFilterOptions(state) {
    const filterGedungAsset = document.getElementById('filter-gedung-asset');
    if (filterGedungAsset && state.assets && state.assets.gedung) {
        filterGedungAsset.innerHTML = '<option value="all">Semua Gedung</option>';
        state.assets.gedung.forEach(asset => {
            filterGedungAsset.innerHTML += `<option value="${asset.code}">${asset.name}</option>`;
        });
    }
    
    const filterGedungBarang = document.getElementById('filter-gedung-barang');
    if (filterGedungBarang && state.assets && state.assets.barang) {
        filterGedungBarang.innerHTML = '<option value="all">Semua Barang</option>';
        state.assets.barang.forEach(asset => {
            filterGedungBarang.innerHTML += `<option value="${asset.code}">${asset.name}</option>`;
        });
    }
    
    const filterKendaraanAsset = document.getElementById('filter-kendaraan-asset');
    const filterKendaraanDriver = document.getElementById('filter-kendaraan-driver');
    if (filterKendaraanAsset && state.assets && state.assets.kendaraan) {
        filterKendaraanAsset.innerHTML = '<option value="all">Semua Kendaraan</option>';
        state.assets.kendaraan.forEach(asset => {
            filterKendaraanAsset.innerHTML += `<option value="${asset.code}">${asset.name}</option>`;
        });
    }

    const driverSource = normalizeDrivers(state.allDrivers);

    if (filterKendaraanDriver && driverSource && driverSource.length > 0) {
        const activeDrivers = driverSource.filter(d => d.isActive !== false);
        filterKendaraanDriver.innerHTML = '<option value="all">Semua Supir</option>';
        activeDrivers.forEach(driver => {
            filterKendaraanDriver.innerHTML += `<option value="${driver._id}">${driver.name}</option>`;
        });
    }
}

export function setDefaultFilters() {
    const today = new Date();
    const ym = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const reqStatus = document.getElementById('filter-request-status');
    if (reqStatus) reqStatus.value = 'pending';

    const gedungMonth = document.getElementById('filter-gedung-month');
    if (gedungMonth) gedungMonth.value = ym;

    const kendaraanMonth = document.getElementById('filter-kendaraan-month');
    if (kendaraanMonth) kendaraanMonth.value = ym;
}

export function setupFilterListeners(applyAdminFilters, applyRequestFilters) {
    const filtersGedung = document.getElementById('filters-gedung');
    const filtersKendaraan = document.getElementById('filters-kendaraan');
    const filtersRequest = document.getElementById('filters-request');
    
    if (filtersGedung) {
        filtersGedung.addEventListener('input', () => applyAdminFilters('gedung'));
        filtersGedung.addEventListener('change', () => applyAdminFilters('gedung'));
        const searchInput = document.getElementById('filter-gedung-search');
        if (searchInput) {
            searchInput.addEventListener('keyup', () => applyAdminFilters('gedung'));
        }
    }
    
    if (filtersKendaraan) {
        filtersKendaraan.addEventListener('input', () => applyAdminFilters('kendaraan'));
        filtersKendaraan.addEventListener('change', () => applyAdminFilters('kendaraan'));
        const searchInput = document.getElementById('filter-kendaraan-search');
        if (searchInput) {
            searchInput.addEventListener('keyup', () => applyAdminFilters('kendaraan'));
        }
    }
    
    if (filtersRequest) {
        filtersRequest.addEventListener('input', () => applyRequestFilters());
        filtersRequest.addEventListener('change', () => applyRequestFilters());
    }
}

export function applyAdminFilters(type, state, filterData) {
    const filterPanel = document.getElementById(`filters-${type}`);
    if (!filterPanel) {
        return;
    }
    
    const monthInput = filterPanel.querySelector(`#filter-${type}-month`);
    const assetInput = filterPanel.querySelector(`#filter-${type}-asset`);
    const barangInput = type === 'gedung' ? filterPanel.querySelector('#filter-gedung-barang') : null;
    const searchInput = filterPanel.querySelector(`#filter-${type}-search`);
    const driverInput = (type === 'kendaraan') ? filterPanel.querySelector('#filter-kendaraan-driver') : null;
    
    const month = monthInput ? monthInput.value : '';
    const asset = assetInput ? assetInput.value : 'all';
    const barang = barangInput ? barangInput.value : 'all';
    const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const driver = driverInput ? driverInput.value : 'all';
    
    const bookingsToFilter = filterData(state.allBookingsCache, { type, month, asset, barang, driver, searchQuery });
    ui.renderBookingList(type, bookingsToFilter);
}

export function filterData(bookings, filters) {
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
            const driverId = typeof b.driver === 'object' && b.driver ? b.driver._id : b.driver;
            if (!driverId || driverId !== filters.driver) return false;
        }
        
        if (filters.searchQuery) {
            const assetNameMatch = b.assetName && b.assetName.toLowerCase().includes(filters.searchQuery);
            const userNameMatch = b.userName && b.userName.toLowerCase().includes(filters.searchQuery);
            const notesMatch = b.notes && b.notes.toLowerCase().includes(filters.searchQuery);
            
            let additionalFieldsMatch = false;
            if (b.bookingType === 'gedung' && Array.isArray(b.borrowedItems)) {
                const borrowedItemsText = b.borrowedItems.map(it => `${it.assetName} ${it.assetCode}`).join(' ').toLowerCase();
                if (borrowedItemsText.includes(filters.searchQuery)) additionalFieldsMatch = true;
            }
            if (b.bookingType === 'kendaraan') {
                const driverName = typeof b.driver === 'object' && b.driver ? b.driver.name : (b.driver || '');
                if (driverName.toLowerCase().includes(filters.searchQuery)) additionalFieldsMatch = true;
                if (b.destination && b.destination.toLowerCase().includes(filters.searchQuery)) additionalFieldsMatch = true;
            }
            
            if (!(assetNameMatch || userNameMatch || notesMatch || additionalFieldsMatch)) {
                return false;
            }
        }
        
        return true;
    });
}

export function applyRequestFilters(state) {
    const filterPanel = document.getElementById('filters-request');
    if (!filterPanel) {
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
            const assetMatch = r.assetName?.toLowerCase().includes(searchQuery);
            const userMatch = r.userName?.toLowerCase().includes(searchQuery);
            const noteMatch = r.notes ? r.notes.toLowerCase().includes(searchQuery) : false;
            const codeMatch = r.requestId ? r.requestId.toLowerCase().includes(searchQuery) : false;
            const idMatch = r._id ? String(r._id).toLowerCase().includes(searchQuery) : false;
            if (!(assetMatch || userMatch || noteMatch || codeMatch || idMatch)) return false;
        }
        return true;
    });

    ui.renderRequestList(filtered);
}

export function setupManagementFilters(applyDriverFilters, applyMasterFilters) {
    const driverSearch = document.getElementById('filter-driver-search');
    if (driverSearch) {
        driverSearch.addEventListener('input', applyDriverFilters);
        driverSearch.addEventListener('keyup', applyDriverFilters);
    }

    const masterType = document.getElementById('master-filter-type');
    const masterSearch = document.getElementById('master-search');
    if (masterType) masterType.addEventListener('change', applyMasterFilters);
    if (masterSearch) {
        masterSearch.addEventListener('input', applyMasterFilters);
        masterSearch.addEventListener('keyup', applyMasterFilters);
    }
}

export function applyDriverFilters(state) {
    const searchInput = document.getElementById('filter-driver-search');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const source = Array.isArray(state.allDrivers) ? state.allDrivers : [];

    const filtered = !query ? source : source.filter(driver => {
        const fields = [driver.username, driver.name, driver.phone, driver.email]
            .map(val => (val || '').toString().toLowerCase());
        return fields.some(text => text.includes(query));
    });

    ui.renderDriverList(filtered);
}

export function applyMasterFilters(state) {
    const typeSelect = document.getElementById('master-filter-type');
    const searchInput = document.getElementById('master-search');
    const selectedType = typeSelect ? typeSelect.value : 'all';
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    let assets = Array.isArray(state.allAssetsCache) ? [...state.allAssetsCache] : [];

    if (selectedType && selectedType !== 'all') {
        assets = assets.filter(asset => asset.type === selectedType);
    }

    if (query) {
        assets = assets.filter(asset => {
            const fields = [asset.code, asset.name, asset.detail]
                .map(val => (val || '').toString().toLowerCase());
            return fields.some(text => text.includes(query));
        });
    }

    ui.renderMasterTable(assets);
}
