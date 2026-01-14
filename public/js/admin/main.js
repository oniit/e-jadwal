// Main Admin Panel Script
// This file integrates all modular components

import { checkAuth, setupLogout, setupModalHandlers, setupProfileForm, setupAdminManagement, setupUserAdminTypeHandlers } from './auth.js';
import { setupTabSwitching, getAdminState } from '../utils/helpers.js';
import { api } from './api.js';
import { ui } from './ui.js';
import { 
    populateFilterOptions, 
    setDefaultFilters, 
    setupFilterListeners, 
    applyAdminFilters, 
    applyRequestFilters, 
    setupManagementFilters, 
    applyDriverFilters, 
    applyMasterFilters, 
    filterData 
} from './filters.js';
import { initTableSorting } from './table-sort.js';
import { initGedungBarangHandlers, updateGedungBarangAvailability } from './forms/gedung.js';
import { initKendaraanDateHandlers } from './forms/kendaraan.js';
import { setupAssetTypeChangeHandler } from './forms/asset.js';
import { setupFormSubmitHandlers, setupTableEventDelegation, setupModalCloseHandlers, setupAddButtonHandlers } from './events.js';
import { renderForms, populateFormSelectOptions } from './modals.js';
import { showRequestDetail } from './requests.js';
import { openGedungModal } from './forms/gedung.js';
import { openKendaraanModal } from './forms/kendaraan.js';
import { openDriverModal } from './forms/driver.js';
import { openAssetModal } from './forms/asset.js';
import { initializeExcelImport } from './excel-import.js';
import { initializeExcelExport } from './excel-export.js';

// Initialize admin panel
document.addEventListener('DOMContentLoaded', async () => {
    // Render forms first so select elements exist before data is populated
    renderForms();

    await checkAuth();
    setupTabSwitching();
    setupLogout();
    setupModalHandlers();
    setupProfileForm();

    // Initialize modal/form functionality (event bindings depend on rendered forms)
    initializeModalFunctionality();
    
    // Initialize date handlers for forms
    initKendaraanDateHandlers();
    
    // Initialize app data and UI from script.js logic
    initializeApp();
});

// ===== DATA LOADING & RENDERING =====
function initializeApp() {
    const state = {
        assets: {},
        allBookingsCache: [],
        allRequestsCache: [],
        allDrivers: [],
        allAssetsCache: [],
    };

    // Expose state for modal helpers that live outside this closure
    window.__adminState = state;

    async function loadAndRender() {
        try {
            // Load all data
            state.allBookingsCache = await api.fetchAllBookings();
            state.allRequestsCache = await api.fetchAllRequests();
            state.assets = await api.fetchAssets();
            state.allDrivers = await api.fetchDrivers();
            
            // Filter bookings by type
            const bookingsGedung = state.allBookingsCache.filter(b => b.bookingType === 'gedung');
            const bookingsKendaraan = state.allBookingsCache.filter(b => b.bookingType === 'kendaraan');
            
            // Combine all assets
            state.allAssetsCache = [
                ...(state.assets.gedung || []),
                ...(state.assets.kendaraan || []),
                ...(state.assets.barang || [])
            ];

            // Ensure modal selects have the latest asset/driver options
            populateFormSelectOptions(state);
            updateGedungBarangAvailability(document.getElementById('form-gedung'));
            
            // Render all tables
            ui.renderRequestList(state.allRequestsCache);
            ui.renderBookingList('gedung', bookingsGedung);
            ui.renderBookingList('kendaraan', bookingsKendaraan);
            applyDriverFilters(state);
            applyMasterFilters(state);
            
            // Initialize table sorting after rendering
            initTableSorting();
            
            // Populate filter dropdowns
            populateFilterOptions(state);

            // Set default filters (request: pending; gedung/kendaraan: current month) then apply
            setDefaultFilters();
            applyRequestFilters(state);
            applyAdminFilters('gedung', state, filterData);
            applyAdminFilters('kendaraan', state, filterData);
            
            // Setup filter event listeners
            setupFilterListeners(
                (type) => applyAdminFilters(type, state, filterData),
                () => applyRequestFilters(state)
            );
            setupManagementFilters(
                () => applyDriverFilters(state),
                () => applyMasterFilters(state)
            );
            
            console.log('✅ All data loaded and rendered');
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    // Expose detail helpers for cross-scope use
    window.showBookingDetail = (props, context = 'admin') => ui.showDetailModal(props, context, state);
    window.showRequestDetail = (request) => showRequestDetail(request, state, loadAndRender, () => applyRequestFilters(state));

    // Load data on init
    loadAndRender();
    
    // Expose loadAndRender globally for form handlers
    window.initializeApp = initializeApp;
}

// Initialize all modal/form functionality
function initializeModalFunctionality() {
    setupFormSubmitHandlers();
    setupTableEventDelegation(getAdminState);
    setupModalCloseHandlers();
    setupAddButtonHandlers();
    setupAssetTypeChangeHandler();
    initGedungBarangHandlers();
    setupUserAdminTypeHandlers();
    setupAdminManagement();
    initializeExcelImport();
    initializeExcelExport();
}

// Expose functions globally for inline onclick handlers if needed
window.openGedungModal = openGedungModal;
window.openKendaraanModal = openKendaraanModal;
window.openDriverModal = openDriverModal;
window.openAssetModal = openAssetModal;
