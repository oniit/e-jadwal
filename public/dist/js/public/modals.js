import { formatScheduleRange } from './utils.js';

export const initializeModals = (elements) => {
    const closeModal = () => {
        elements.modal?.classList.add('hidden');
    };

    const closeBtn = elements.modal?.querySelector('.modal-close-btn');
    closeBtn?.addEventListener('click', closeModal);
    elements.modal?.addEventListener('click', (e) => {
        if (e.target === elements.modal) closeModal();
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            elements.modalFormRequest?.classList.add('hidden');
        }
    });

    return { closeModal };
};

export const showDetailModal = (booking, state, elements) => {
    if (!elements.modal || !elements.modalTitle || !elements.modalBody) return;
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    elements.modalTitle.textContent = booking.bookingType === 'kendaraan' 
        ? `${booking.assetName} (${booking.assetCode})`
        : booking.assetName;

    let detailHtml = `<p>${formatScheduleRange(start, end)}</p>`;

    if (booking.status) {
        const statusMap = {
            pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
            approved: { label: 'Disetujui', color: 'bg-green-100 text-green-800' },
            rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-800' }
        };
        const s = statusMap[booking.status] || { label: booking.status, color: 'bg-gray-100 text-gray-800' };
        detailHtml += `<p><strong>Status:</strong> <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${s.color}">${s.label}</span></p>`;
    }

    detailHtml += `<p><strong>Peminjam:</strong> ${booking.userName}</p>`;
    
    if (booking.bookingType === 'gedung') {
        if (booking.activityName) detailHtml += `<p><i class="fa-solid fa-list-check mr-2" aria-hidden="true"></i>${booking.activityName}</p>`;
        if (booking.borrowedItems && booking.borrowedItems.length > 0) {
            detailHtml += `<p><i class="fa-solid fa-box mr-2" aria-hidden="true"></i>`;
            detailHtml += booking.borrowedItems.map(item => `${item.assetName} (${item.quantity})`).join(', ');
            detailHtml += `</p>`;
        }
    } else {
        if (booking.driver) {
            let driverName;
            if (typeof booking.driver === 'object' && booking.driver.name) {
                driverName = booking.driver.name;
            } else if (typeof booking.driver === 'string') {
                const driver = state.drivers.find(d => d._id === booking.driver || d.code === booking.driver || d.name === booking.driver);
                driverName = driver ? driver.name : null;
            }
            if (driverName) detailHtml += `<p><strong>Supir:</strong> ${driverName}</p>`;
        }
    }

    elements.modalBody.innerHTML = detailHtml;
    elements.modal.classList.remove('hidden');
};

export const showDetailModalFull = (booking, state, elements) => {
    if (!elements.modal || !elements.modalTitle || !elements.modalBody) return;
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    elements.modalTitle.textContent = booking.bookingType === 'kendaraan' 
        ? `${booking.assetName} (${booking.assetCode})`
        : booking.assetName;

    let detailHtml = `<p>${formatScheduleRange(start, end)}</p>`;

    if (booking.status) {
        const statusMap = {
            pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
            approved: { label: 'Disetujui', color: 'bg-green-100 text-green-800' },
            rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-800' }
        };
        const statusInfo = statusMap[booking.status] || { label: booking.status, color: 'bg-gray-100 text-gray-800' };
        detailHtml += `<p><strong>Status:</strong> <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.color}">${statusInfo.label}</span></p>`;
        
        if (booking.status === 'rejected' && booking.rejectionReason) {
            detailHtml += `<p><strong>Alasan Penolakan:</strong> <span class="text-red-600">${booking.rejectionReason}</span></p>`;
        }
        
        if (booking.status === 'approved') {
            let bookingIdToShow = booking.bookingId;
            if (!bookingIdToShow && Array.isArray(state.bookings)) {
                const match = state.bookings.find(b => (
                    b.bookingType === booking.bookingType &&
                    b.assetCode === booking.assetCode &&
                    new Date(b.startDate).getTime() === new Date(booking.startDate).getTime() &&
                    new Date(b.endDate).getTime() === new Date(booking.endDate).getTime() &&
                    b.userName === booking.userName
                ));
                if (match) bookingIdToShow = match.bookingId;
            }
            if (bookingIdToShow) {
                detailHtml += `<p><strong>Booking ID:</strong> <code class="bg-gray-100 px-2 py-1 rounded text-sm">${bookingIdToShow}</code></p>`;
            }
        }
    } else if (booking.bookingId) {
        detailHtml += `<p><strong>Booking ID:</strong> <code class="bg-gray-100 px-2 py-1 rounded text-sm">${booking.bookingId}</code></p>`;
    }
    
    if (booking.requestId) {
        detailHtml += `<p><strong>Request ID:</strong> <code class="bg-gray-100 px-2 py-1 rounded text-sm">${booking.requestId}</code></p>`;
    }
    
    detailHtml += `<p><strong>Peminjam:</strong> ${booking.userName}</p>`;
    
    if (booking.personInCharge) {
        detailHtml += `<p><strong>Penanggung Jawab:</strong> ${booking.personInCharge}</p>`;
    }
    if (booking.picPhoneNumber) {
        detailHtml += `<p><strong>No. Telepon:</strong> ${booking.picPhoneNumber}</p>`;
    }
    if (booking.bookingType === 'gedung') {
        if (booking.activityName) {
            detailHtml += `<p><strong>Kegiatan:</strong> ${booking.activityName}</p>`;
        }
        if (booking.borrowedItems && booking.borrowedItems.length > 0) {
            detailHtml += `<p><strong>Barang Dipinjam:</strong></p><ul class="ml-4 list-disc">`;
            booking.borrowedItems.forEach(item => {
                detailHtml += `<li>${item.assetName} (${item.assetCode}) - ${item.quantity} unit</li>`;
            });
            detailHtml += `</ul>`;
        }
    } else if (booking.bookingType === 'kendaraan') {
        if (booking.destination) {
            detailHtml += `<p><strong>Tujuan:</strong> ${booking.destination}</p>`;
        }
        if (booking.driver) {
            let driverName;
            if (typeof booking.driver === 'object' && booking.driver.name) {
                driverName = booking.driver.name;
            } else if (typeof booking.driver === 'string') {
                const driver = state.drivers.find(d => d._id === booking.driver || d.code === booking.driver || d.name === booking.driver);
                driverName = driver ? driver.name : null;
            }
            if (driverName) detailHtml += `<p><strong>Supir:</strong> ${driverName}</p>`;
        }
    }
    
    if (booking.notes) {
        detailHtml += `<p><strong>Catatan:</strong> ${booking.notes}</p>`;
    }
    
    if (booking.submissionDate) {
        const subDate = new Date(booking.submissionDate);
        detailHtml += `<p class="text-sm text-gray-500 mt-2"><em>Diajukan: ${subDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</em></p>`;
    }

    elements.modalBody.innerHTML = detailHtml;
    elements.modal.classList.remove('hidden');
};
