// Request handling functions
import { api } from './api.js';

export async function handleApproveRequest(id, driver = 'Tanpa Supir', loadAndRender, applyRequestFilters) {
    if (!confirm('Setujui request ini?')) return;
    try {
        await api.approveRequest(id, 'admin', driver || 'Tanpa Supir');
        alert('Request disetujui dan booking dibuat.');
        const modalRequestAction = document.getElementById('modal-request-action');
        if (modalRequestAction) modalRequestAction.classList.add('hidden');
        await loadAndRender();
        applyRequestFilters();
    } catch (error) {
        alert(`Gagal: ${error.message}`);
    }
}

export async function handleRejectRequest(id, loadAndRender, applyRequestFilters) {
    const reason = prompt('Masukkan alasan penolakan:');
    if (reason === null) return;
    try {
        await api.rejectRequest(id, reason);
        alert('Request ditolak.');
        const modalRequestAction = document.getElementById('modal-request-action');
        if (modalRequestAction) modalRequestAction.classList.add('hidden');
        await loadAndRender();
        applyRequestFilters();
    } catch (error) {
        alert(`Gagal: ${error.message}`);
    }
}

export function showRequestDetail(request, state, loadAndRender, applyRequestFilters) {
    console.log('📋 showRequestDetail called with:', request);
    console.log('📎 letterFile:', request.letterFile);
    
    const start = new Date(request.startDate);
    const end = new Date(request.endDate);
    
    const statusMap = {
        pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
        approved: { label: 'Disetujui', color: 'bg-green-100 text-green-800' },
        rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-800' }
    };
    const statusInfo = statusMap[request.status] || { label: request.status, color: 'bg-gray-100 text-gray-800' };
    
    let detailHtml = `
        <p><strong>ID Request:</strong> ${request.requestId}</p>
        <p><strong>Status:</strong> <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.color}">${statusInfo.label}</span></p>
    `;
    
    if (request.status === 'approved' && request.bookingId) {
        detailHtml += `<p><strong>Booking ID:</strong> <code class="bg-gray-100 px-2 py-1 rounded text-sm">${request.bookingId}</code></p>`;
    }
    
    detailHtml += `
        <p><strong>Tipe:</strong> ${request.bookingType === 'gedung' ? 'Gedung' : 'Kendaraan'}</p>
        <p><strong>Aset:</strong> ${request.assetName}</p>
        <p><strong>Peminjam:</strong> ${request.userName}</p>
        <p><strong>Penanggung Jawab:</strong> ${request.personInCharge || '-'}</p>
        <p><strong>HP PJ:</strong> ${request.picPhoneNumber || '-'}</p>
        <p><strong>Tanggal Mulai:</strong> ${start.toLocaleDateString('id-ID')}</p>
        <p><strong>Tanggal Selesai:</strong> ${end.toLocaleDateString('id-ID')}</p>
    `;
    
    if (request.bookingType === 'gedung') {
        if (request.activityName) detailHtml += `<p><strong>Kegiatan:</strong> ${request.activityName}</p>`;
        if (request.borrowedItems && request.borrowedItems.length > 0) {
            detailHtml += `<p><strong>Barang Dipinjam:</strong><ul class="ml-4 list-disc">`;
            request.borrowedItems.forEach(it => {
                detailHtml += `<li>${it.assetName} (${it.assetCode}) - ${it.quantity} unit</li>`;
            });
            detailHtml += `</ul></p>`;
        }
    } else if (request.bookingType === 'kendaraan') {
        if (request.driver) {
            const driverName = typeof request.driver === 'object' ? request.driver.name : request.driver;
            detailHtml += `<p><strong>Supir:</strong> ${driverName}</p>`;
        }
        if (request.destination) detailHtml += `<p><strong>Tujuan:</strong> ${request.destination}</p>`;
    }
    
    if (request.notes) detailHtml += `<p><strong>Keterangan:</strong> ${request.notes}</p>`;
    
    // Display surat/letter file if exists
    if (request.letterFile) {
        detailHtml += `
            <div style="margin-top: 12px; padding: 12px; background-color: #f3f4f6; border-radius: 6px;">
                <p style="margin: 0 0 8px 0; font-weight: 600; font-size: 14px;">📄 Surat Permohonan</p>
                <a href="/uploads/${request.letterFile}" 
                   target="_blank" 
                   style="display: inline-block; padding: 8px 12px; background-color: #3b82f6; color: white; border-radius: 4px; text-decoration: none; font-size: 13px; font-weight: 500;">
                    <i class="fas fa-eye"></i> Lihat Surat
                </a>
            </div>
        `;
    }
    
    if (request.status === 'rejected' && request.rejectionReason) {
        detailHtml += `<p><strong>Alasan Penolakan:</strong> <span class="text-red-600">${request.rejectionReason}</span></p>`;
    }
    
    if (request.status === 'pending') {
        const drivers = Array.isArray(state.allDrivers) ? state.allDrivers : [];
        const activeDrivers = drivers.filter(d => d.status === 'aktif');
        const driverSelectHtml = request.bookingType === 'kendaraan' ? `
            <div class="mt-3">
                <label for="req-approve-supir" class="form-label text-sm font-semibold">Pilih Supir</label>
                <select id="req-approve-supir" class="form-input">
                    <option value="">Tanpa Supir</option>
                    ${activeDrivers.map(d => `<option value="${d._id}">${d.name}</option>`).join('')}
                </select>
            </div>
        ` : '';

        detailHtml += `
            ${driverSelectHtml}
            <div style="margin-top: 16px;">
                <button id="btn-approve-req" style="padding: 4px 8px; background-color: #22c55e; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; margin-right: 6px;">
                    <i class="fas fa-check"></i> Setujui
                </button>
                <button id="btn-reject-req" style="padding: 4px 8px; background-color: #ef4444; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
                    <i class="fas fa-times"></i> Tolak
                </button>
            </div>
        `;
    }
    
    const modalRequestTitle = document.getElementById('modal-request-title');
    const modalRequestBody = document.getElementById('modal-request-body');
    const modalRequestAction = document.getElementById('modal-request-action');
    
    if (modalRequestTitle) modalRequestTitle.innerText = 'Detail Request';
    if (modalRequestBody) {
        modalRequestBody.innerHTML = detailHtml;
        
        // Remove old event listeners by cloning
        if (request.status === 'pending') {
            setTimeout(() => {
                const approveBtn = document.getElementById('btn-approve-req');
                const rejectBtn = document.getElementById('btn-reject-req');
                
                if (approveBtn) {
                    const newApproveBtn = approveBtn.cloneNode(true);
                    approveBtn.parentNode.replaceChild(newApproveBtn, approveBtn);
                    newApproveBtn.addEventListener('click', () => {
                        const driverSelect = document.getElementById('req-approve-supir');
                        const selectedDriver = driverSelect ? (driverSelect.value || '') : '';
                        handleApproveRequest(request._id, selectedDriver, loadAndRender, applyRequestFilters);
                    });
                }
                
                if (rejectBtn) {
                    const newRejectBtn = rejectBtn.cloneNode(true);
                    rejectBtn.parentNode.replaceChild(newRejectBtn, rejectBtn);
                    newRejectBtn.addEventListener('click', () => handleRejectRequest(request._id, loadAndRender, applyRequestFilters));
                }
            }, 0);
        }
    }
    
    if (modalRequestAction) modalRequestAction.classList.remove('hidden');
}
