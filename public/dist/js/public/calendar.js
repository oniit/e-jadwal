import { formatBookingForCalendar } from './utils.js';
import { getFilteredBookings } from './filters.js';
import { showDetailModal } from './modals.js';

export const initializeCalendar = (state, elements) => {
    const calendar = new FullCalendar.Calendar(elements.calendarEl, {
        initialView: window.innerWidth < 768 ? 'listWeek' : 'dayGridMonth',
        locale: 'id',
        dayMaxEvents: true,
        height: 'auto',
        headerToolbar: {
            left: 'prev,next,today',
            center: 'title',
            right: 'dayGridMonth,timeGridDay,listWeek',
        },
        buttonText: {
            today: 'today',
            month: 'month',
            day: 'day',
            list: 'list',
        },
        events: (_info, successCallback) => {
            const filtered = getFilteredBookings(state).map(formatBookingForCalendar);
            successCallback(filtered);
        },
        eventClick: (info) => showDetailModal(info.event.extendedProps, state, elements),
        eventContent: (arg) => ({
            html: `<div class="p-1"><b>${arg.event.extendedProps.bookingType === 'gedung' ? '🏢' : '🚗'} ${arg.event.title}</b></div>`,
        }),
    });

    return calendar;
};
