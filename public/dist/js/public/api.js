import { fetchJson } from './utils.js';

export const fetchBookingByCode = async (code) => {
    return fetchJson(`/api/public/bookings/by-code/${code}`);
};

export const fetchRequestByCode = async (code) => {
    return fetchJson(`/api/public/requests/by-code/${code}`);
};

export const loadCalendarData = async () => {
    const [assets, driversData, bookings] = await Promise.all([
        fetchJson('/api/public/assets'),
        fetchJson('/api/public/drivers'),
        fetchJson('/api/public/bookings'),
    ]);
    
    return {
        assets: {
            gedung: assets.gedung || [],
            kendaraan: assets.kendaraan || [],
            barang: assets.barang || [],
        },
        drivers: Array.isArray(driversData) ? driversData : (driversData?.drivers || []),
        bookings: bookings || [],
    };
};

export const submitRequest = async (requestData, letterFile) => {
    const formData = new FormData();
    formData.append('data', JSON.stringify(requestData));
    
    if (letterFile) {
        formData.append('letterFile', letterFile);
    }
    
    const response = await fetch('/api/public/requests', {
        method: 'POST',
        body: formData,
    });
    
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const result = isJson ? await response.json() : await response.text();
    
    if (!response.ok) {
        const message = (isJson && result && result.message) ? result.message : (typeof result === 'string' ? result : 'Gagal submit request');
        throw new Error(message);
    }
    
    return result;
};
