export const formatScheduleRange = (start, end) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    const formatDate = (date) => {
        const day = date.getDate();
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    };
    
    const formatTime = (date) => {
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };
    
    const isFullDay = start.getHours() === 0 && start.getMinutes() === 0 && end.getHours() === 23 && end.getMinutes() === 59;
    
    if (isFullDay) {
        if (start.toDateString() === end.toDateString()) {
            return formatDate(start);
        }
        return `${formatDate(start)} - ${formatDate(end)}`;
    }
    
    if (start.toDateString() === end.toDateString()) {
        return `${formatDate(start)}, ${formatTime(start)}-${formatTime(end)} WIB`;
    }
    
    return `${formatDate(start)}, ${formatTime(start)} WIB - ${formatDate(end)}, ${formatTime(end)} WIB`;
};

export const formatBookingForCalendar = (booking) => ({
    id: booking._id,
    title: booking.assetName,
    start: booking.startDate,
    end: booking.endDate,
    extendedProps: booking,
    textColor: '#047857',
    backgroundColor: 'rgba(184, 147, 47, 0.3)',
});

export const showError = (container, message) => {
    if (!container) return;
    container.innerHTML = `<div class="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">${message}</div>`;
};

export const fetchJson = async (url, options) => {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await response.json() : await response.text();
    if (!response.ok) {
        const message = (isJson && payload && payload.message) ? payload.message : (typeof payload === 'string' ? payload : 'Gagal memuat data');
        throw new Error(message || 'Gagal memuat data');
    }
    return payload;
};
