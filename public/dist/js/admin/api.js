const API_BASE = window.location.origin;

export const api = {
    fetch: async function(url, options = {}) {
        try {
            const response = await fetch(url, { ...options, credentials: 'include' });
            const isJson = response.headers.get('content-type')?.includes('application/json');
            const data = isJson ? await response.json() : await response.text();
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw new Error(error.message || 'Operasi gagal');
        }
    },
    fetchAssets: () => api.fetch('/api/assets', { cache: 'no-store' }),
    fetchDrivers: () => api.fetch('/api/drivers', { cache: 'no-store' }),
    fetchAllBookings: () => api.fetch('/api/bookings'),
    fetchAllRequests: () => api.fetch('/api/requests'),
    approveRequest: (id, approvedBy, driver) => api.fetch(`/api/requests/${id}/approve`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ approvedBy, driver }) 
    }),
    rejectRequest: (id, rejectionReason) => api.fetch(`/api/requests/${id}/reject`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ rejectionReason }) 
    }),
};
