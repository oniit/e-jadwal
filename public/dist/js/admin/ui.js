// UI Rendering Functions
import { initTableSorting } from './table-sort.js';

export const ui = {
    renderBookingList: function(type, bookings) {
        const tableId = `${type}-list-table`;
        const tableBody = document.getElementById(tableId);
        if (!tableBody) {
            console.warn(`❌ Table element not found for type: ${type}`);
            return;
        }
        console.log(`📊 Rendering ${type} table with ${bookings.length} bookings`);
        
        tableBody.innerHTML = '';
        const sortedBookings = [...bookings].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        
        if (sortedBookings.length === 0) {
            const colspan = type === 'gedung' ? 7 : 7;
            tableBody.innerHTML = `<tr><td colspan="${colspan}" class="text-center py-4 text-gray-500">Tidak ada data untuk filter ini.</td></tr>`;
            return;
        }
        
        const cellClass = "px-6 py-3 whitespace-nowrap text-sm text-gray-500";
        tableBody.innerHTML = sortedBookings.map(b => {
            const startDate = new Date(b.startDate);
            const endDate = new Date(b.endDate);
            let tanggal = startDate.toLocaleDateString('id-ID');
            if (startDate.toDateString() !== endDate.toDateString()) {
                tanggal += ` - ${endDate.toLocaleDateString('id-ID')}`;
            }
            const createdDate = b.createdAt ? new Date(b.createdAt).toLocaleDateString('id-ID') : '-';
            
            if (type === 'gedung') {
                const items = formatBorrowedItemsForDisplay(b.borrowedItems);
                return `<tr class="table-row cursor-pointer" data-booking-id="${b._id}">
                    <td class="${cellClass}">${createdDate}</td>
                    <td class="${cellClass} font-medium text-gray-900">${b.assetName}</td>
                    <td class="${cellClass}">${b.userName}</td>
                    <td class="${cellClass}">${tanggal}</td>
                    <td class="${cellClass}">${items}</td>
                    <td class="${cellClass}">${b.notes || '-'}</td>
                    <td class="${cellClass} text-right">
                        <button type="button" class="mr-2"><i class="fas fa-pen-to-square text-emerald-700 hover:text-emerald-800 btn btn-edit" data-id="${b._id}"></i></button>
                        <button type="button"><i class="fas fa-trash color-gedung hover:opacity-80 btn btn-delete" data-id="${b._id}"></i></button>
                    </td>
                </tr>`;
            } else {
                const driverName = typeof b.driver === 'object' && b.driver ? b.driver.name : (b.driver || '-');
                return `<tr class="table-row cursor-pointer" data-booking-id="${b._id}">
                    <td class="${cellClass}">${createdDate}</td>
                    <td class="${cellClass} font-medium text-gray-900">${b.assetName}</td>
                    <td class="${cellClass}">${b.userName}</td>
                    <td class="${cellClass}">${tanggal}</td>
                    <td class="${cellClass}">${driverName}</td>
                    <td class="${cellClass}">${b.notes || '-'}</td>
                    <td class="${cellClass} text-right">
                        <button type="button" class="mr-2"><i class="fas fa-pen-to-square text-emerald-700 hover:text-emerald-800 btn btn-edit" data-id="${b._id}"></i></button>
                        <button type="button"><i class="fas fa-trash color-gedung hover:opacity-80 btn btn-delete" data-id="${b._id}"></i></button>
                    </td>
                </tr>`;
            }
        }).join('');
        
        // Re-initialize table sorting after rendering
        initTableSorting();
    },

    renderRequestList: function(requests) {
        const tableBody = document.getElementById('request-list-table');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        const sorted = [...requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        if (sorted.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-3 text-center text-gray-500">Tidak ada data</td></tr>`;
            return;
        }
        
        tableBody.innerHTML = sorted.map(r => {
            const createdDate = r.createdAt ? new Date(r.createdAt).toLocaleDateString('id-ID') : '-';
            const startDate = new Date(r.startDate).toLocaleDateString('id-ID');
            const cellClass = "px-6 py-3 whitespace-nowrap text-sm text-gray-500";
            const statusColor = r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                               r.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
            const statusLabel = r.status === 'pending' ? 'Pending' : r.status === 'approved' ? 'Diterima' : 'Ditolak';
            
            return `<tr class="table-row cursor-pointer hover:bg-gray-100" data-request-id="${r._id}">
                <td class="${cellClass}">${createdDate}</td>
                <td class="${cellClass}">${r.bookingType === 'gedung' ? 'Gedung' : 'Kendaraan'}</td>
                <td class="${cellClass}">${r.assetName || '-'}</td>
                <td class="${cellClass}">${r.userName || '-'}</td>
                <td class="${cellClass}">${startDate}</td>
                <td class="${cellClass}"><span class="px-2 py-1 rounded text-xs font-semibold ${statusColor}">${statusLabel}</span></td>
                <td class="${cellClass}"><span class="text-xs text-gray-700">${r.requestId || r._id}</span></td>
            </tr>`;
        }).join('');
    },

    renderDriverList: function(drivers) {
        const tableBody = document.getElementById('driver-list-table');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        const sorted = [...drivers].sort((a, b) => (a.code || '').localeCompare(b.code || ''));
        
        if (sorted.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-3 text-center text-gray-500">Tidak ada data</td></tr>`;
            return;
        }
        
        tableBody.innerHTML = sorted.map(d => {
            const cellClass = "px-6 py-3 whitespace-nowrap text-sm text-gray-500";
            const statusClass = d.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600';
            const statusLabel = d.status === 'aktif' ? 'Aktif' : 'Tidak Aktif';
            return `<tr class="cursor-pointer" data-driver-id="${d._id}">
                <td class="${cellClass}">${d.code || '-'}</td>
                <td class="${cellClass}">${d.name || '-'}</td>
                <td class="${cellClass}">${d.noTelp || '-'}</td>
                <td class="${cellClass}">${d.detail || '-'}</td>
                <td class="${cellClass}">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${statusClass}">${statusLabel}</span>
                </td>
                <td class="px-6 py-3 text-right text-sm">
                    <div class="flex justify-end gap-3">
                        <button class="btn-edit" data-id="${d._id}" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="btn-delete" data-id="${d._id}" title="Hapus"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    },

    renderMasterTable: function(assets) {
        const tableBody = document.getElementById('master-asset-table');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        const sorted = [...assets].sort((a, b) => a.name.localeCompare(b.name));
        
        if (sorted.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-3 text-center text-gray-500">Tidak ada data</td></tr>`;
            return;
        }
        
        tableBody.innerHTML = sorted.map(a => {
            const cellClass = "px-6 py-3 whitespace-nowrap text-sm text-gray-500";
            const badgeClass = "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700";
            return `<tr class="cursor-pointer" data-asset-id="${a._id}">
                <td class="${cellClass}">${a.code || '-'}</td>
                <td class="${cellClass}">${a.name || '-'}</td>
                <td class="${cellClass}"><span class="${badgeClass}">${a.type || '-'}</span></td>
                <td class="${cellClass}">${a.num ?? '-'}</td>
                <td class="${cellClass}">${a.detail || '-'}</td>
                <td class="px-6 py-3 text-right text-sm">
                    <div class="flex justify-end gap-3">
                        <button class="btn-edit" data-id="${a._id}" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="btn-delete" data-id="${a._id}" title="Hapus"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    },

    showDetailModal: function(props, context = 'admin', state) {
        let assetDisplay = props.assetName;
        if (props.bookingType === 'kendaraan' && state.assets && state.assets.kendaraan) {
            const kendaraan = state.assets.kendaraan.find(k => k.name === props.assetName);
            const code = kendaraan && kendaraan.code ? kendaraan.code : '';
            assetDisplay = code ? `${props.assetName} (${code})` : props.assetName;
        }
        
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const modalDetailEvent = document.getElementById('modal-detail-event');
        
        if (!modalTitle || !modalBody || !modalDetailEvent) {
            console.error('Modal elements not found');
            return;
        }
        
        modalTitle.innerText = `${assetDisplay}`;
        const start = new Date(props.startDate);
        const end = new Date(props.endDate);
        const waktuText = formatRangeForModal(start, end, ui);
        
        let detailsHtml = `<p>${waktuText}</p>`;
        
        if (props.bookingId) {
            detailsHtml += `<p><strong>Booking ID:</strong> <code class="bg-gray-100 px-2 py-1 rounded text-sm">${props.bookingId}</code></p>`;
        }
        
        detailsHtml += `<p><strong>Peminjam:</strong> ${props.userName}</p>`;
        
        if (context === 'admin') {
            if (props.personInCharge) {
                detailsHtml += `<p><strong>Penanggung Jawab:</strong> ${props.personInCharge}</p>`;
            }
            if (props.picPhoneNumber) {
                detailsHtml += `<p><strong>No. Telepon:</strong> ${props.picPhoneNumber}</p>`;
            }
            if (props.bookingType === 'gedung') {
                if (props.activityName) {
                    detailsHtml += `<p><strong>Kegiatan:</strong> ${props.activityName}</p>`;
                }
                if (props.borrowedItems && props.borrowedItems.length > 0) {
                    detailsHtml += `<p><strong>Barang Dipinjam:</strong></p><ul class="ml-4 list-disc">`;
                    props.borrowedItems.forEach(item => {
                        detailsHtml += `<li>${item.assetName} (${item.assetCode}) - ${item.quantity} unit</li>`;
                    });
                    detailsHtml += `</ul>`;
                }
            } else if (props.bookingType === 'kendaraan') {
                if (props.destination) {
                    detailsHtml += `<p><strong>Tujuan:</strong> ${props.destination}</p>`;
                }
                if (props.driver && (typeof props.driver === 'object' ? props.driver.name : props.driver)) {
                    const driverName = typeof props.driver === 'object' ? props.driver.name : props.driver;
                    detailsHtml += `<p><strong>Supir:</strong> ${driverName}</p>`;
                }
            }
            if (props.notes) {
                detailsHtml += `<p><strong>Keterangan:</strong> ${props.notes}</p>`;
            }
            
            if (props.letterFile) {
                detailsHtml += `
                    <div style="margin-top: 12px; padding: 12px; background-color: #f3f4f6; border-radius: 6px;">
                        <p style="margin: 0 0 8px 0; font-weight: 600; font-size: 14px;">📄 Surat Permohonan</p>
                        <a href="/uploads/${props.letterFile}" 
                           target="_blank" 
                           style="display: inline-block; padding: 8px 12px; background-color: #3b82f6; color: white; border-radius: 4px; text-decoration: none; font-size: 13px; font-weight: 500;">
                            <i class="fas fa-eye"></i> Lihat Surat
                        </a>
                    </div>
                `;
            }
        }
        
        modalBody.innerHTML = detailsHtml;
        modalDetailEvent.classList.remove('hidden');
    },

    formatDateShort: (d) => {
        const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
        const day = String(d.getDate()).padStart(2, '0');
        const mon = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day} ${mon} ${year}`;
    },

    formatTimeDot: (d) => {
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${hh}.${mm}`;
    }
};

function formatBorrowedItemsForDisplay(borrowedItems) {
    if (!borrowedItems) return '-';
    if (Array.isArray(borrowedItems) && borrowedItems.length) {
        return borrowedItems.map(it => `${it.assetName}: ${it.quantity}`).join(', ');
    }
    if (typeof borrowedItems === 'string' && borrowedItems.trim()) return borrowedItems;
    return '-';
}

function formatRangeForModal(start, end, ui) {
    const sameDay = start.toDateString() === end.toDateString();
    const dateStart = ui.formatDateShort(start);
    const timeStart = ui.formatTimeDot(start);
    const dateEnd = ui.formatDateShort(end);
    const timeEnd = ui.formatTimeDot(end);
    if (sameDay) {
        return `${dateStart}, ${timeStart}-${timeEnd} WIB`;
    }
    return `${dateStart}, ${timeStart} WIB - ${dateEnd}, ${timeEnd} WIB`;
}
