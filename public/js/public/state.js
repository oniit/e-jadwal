// State management for public calendar

export const createState = () => ({
    assets: { gedung: [], kendaraan: [], barang: [] },
    drivers: [],
    bookings: [],
    viewType: 'gedung',
    selectedAsset: 'all',
    selectedDriver: 'all',
});

export const updateState = (state, updates) => {
    return { ...state, ...updates };
};
