// Kendaraan Form Functions
import { formatDateForInput } from '../../utils/helpers.js';

export function openKendaraanModal(booking = null) {
    const modal = document.getElementById('modal-form-kendaraan');
    const form = document.getElementById('form-kendaraan');
    const title = document.getElementById('kendaraan-form-title');
    
    if (!modal || !form) return;
    
    title.textContent = booking ? 'Edit Pinjam Kendaraan' : 'Form Pinjam Kendaraan';
    form.reset();
    
    if (booking) {
        document.getElementById('kendaraan-booking-id').value = booking._id || '';
        document.getElementById('kendaraan-peminjam').value = booking.userName || '';
        document.getElementById('kendaraan-name').value = booking.assetCode || '';
        document.getElementById('kendaraan-penanggung-jawab').value = booking.personInCharge || '';
        document.getElementById('kendaraan-nomor-penanggung-jawab').value = booking.picPhoneNumber || '';
        document.getElementById('kendaraan-tujuan').value = booking.destination || '';
        document.getElementById('kendaraan-keterangan').value = booking.notes || '';
        document.getElementById('kendaraan-mulai-tanggal').value = formatDateForInput(booking.startDate);
        document.getElementById('kendaraan-selesai-tanggal').value = formatDateForInput(booking.endDate);
        if (booking.driver) {
            document.getElementById('kendaraan-supir').value = typeof booking.driver === 'object' ? booking.driver._id : booking.driver;
        }
    }
    
    modal.classList.remove('hidden');
}
