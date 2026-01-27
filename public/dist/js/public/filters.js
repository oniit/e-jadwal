export const populateAssetFilter = (state, elements) => {
    if (!elements.assetFilter) return;
    const assets = state.assets[state.viewType] || [];
    const label = state.viewType === 'gedung' ? 'Gedung' : 'Kendaraan';
    elements.assetFilter.innerHTML = `<option value="all">Semua ${label}</option>`;
    assets.forEach(item => {
        const option = new Option(item.name, item.code);
        elements.assetFilter.add(option);
    });
    elements.assetFilter.value = 'all';
    state.selectedAsset = 'all';
};

export const populateDriverFilter = (state, elements) => {
    if (!elements.driverFilter) return;
    if (state.viewType !== 'kendaraan') {
        elements.driverFilter.classList.add('hidden');
        elements.driverFilter.innerHTML = '';
        state.selectedDriver = 'all';
        return;
    }
    elements.driverFilter.classList.remove('hidden');
    const drivers = state.drivers || [];
    const activeDrivers = drivers.filter(d => d.status === 'aktif');
    elements.driverFilter.innerHTML = `<option value="all">Semua Supir</option>`;
    activeDrivers.forEach(driver => {
        const value = driver._id || driver.code || driver.name;
        const label = driver.name || driver.code || 'Supir';
        const option = new Option(label, value);
        elements.driverFilter.add(option);
    });
    elements.driverFilter.value = 'all';
    state.selectedDriver = 'all';
};

export const getFilteredBookings = (state) => {
    return state.bookings
        .filter(b => b.bookingType === state.viewType)
        .filter(b => state.selectedAsset === 'all' || b.assetCode === state.selectedAsset)
        .filter(b => {
            if (state.viewType !== 'kendaraan' || state.selectedDriver === 'all') return true;
            if (!b.driver) return false;
            
            const driverCode = b.driverCode || (typeof b.driver === 'object' && b.driver ? b.driver.code : null);
            const driverName = typeof b.driver === 'object' && b.driver ? b.driver.name : b.driver;
            const driverId = typeof b.driver === 'object' && b.driver ? b.driver._id : null;
            
            return state.selectedDriver === driverCode || state.selectedDriver === driverName || state.selectedDriver === driverId;
        });
};
