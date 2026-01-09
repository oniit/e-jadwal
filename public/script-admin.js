const API_BASE = window.location.origin;

// Initialize admin panel
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    setupTabSwitching();
    setupLogout();
    setupModalHandlers();
    setupProfileForm();
    
    // Initialize app data and UI from script.js logic
    initializeApp();
});

// Check authentication
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            credentials: 'include'
        });

        if (!response.ok) {
            window.location.href = '/login';
            return;
        }

        const user = await response.json();
        displayUserName(user.name);
        
        // Show admin tab only for superadmin
        if (user.role === 'superadmin') {
            const usersTab = document.getElementById('admin-tab-users');
            if (usersTab) {
                usersTab.classList.remove('hidden');
            }
        }
        
        // Hide tabs for admin khusus - only show request and gedung
        if (user.role === 'admin' && user.adminType === 'khusus') {
            const tabsToHide = ['admin-tab-kendaraan', 'admin-tab-driver', 'admin-tab-master', 'admin-tab-users'];
            tabsToHide.forEach(tabId => {
                const tab = document.getElementById(tabId);
                if (tab) {
                    tab.classList.add('hidden');
                }
            });
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login';
    }
}

// Display user name
function displayUserName(name) {
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) {
        userNameEl.textContent = name;
    }
}

// Setup tab switching
function setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const tabId = button.id.replace('admin-tab-', '');
            
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            // Hide all content divs
            document.querySelectorAll('[id^="admin-content-"]').forEach(div => {
                div.classList.add('hidden');
            });
            
            // Show selected content
            const contentDiv = document.getElementById(`admin-content-${tabId}`);
            if (contentDiv) {
                contentDiv.classList.remove('hidden');
            }
        });
    });
}

// Setup logout
function setupLogout() {
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch(`${API_BASE}/auth/logout`, {
                    method: 'POST',
                    credentials: 'include'
                });
                window.location.href = '/';
            } catch (error) {
                console.error('Logout failed:', error);
                alert('Logout gagal');
            }
        });
    }
}

// Setup modal handlers
function setupModalHandlers() {
    // Profile modal
    const profileBtn = document.getElementById('btn-profile');
    const profileModal = document.getElementById('modal-profile');
    
    if (profileBtn && profileModal) {
        profileBtn.addEventListener('click', async () => {
            try {
                const response = await fetch(`${API_BASE}/auth/me`, {
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `HTTP ${response.status}`);
                }
                
                const data = await response.json();
                const user = data.user || data; // Support both wrapped and unwrapped response
                
                document.getElementById('profile-username').value = user.username || '';
                document.getElementById('profile-name').value = user.name || '';
                document.getElementById('profile-email').value = user.email || '';
                document.getElementById('profile-phone').value = user.phone || '';
                
                profileModal.classList.remove('hidden');
            } catch (error) {
                console.error('Load profile failed:', error);
                alert('Gagal memuat profil: ' + error.message);
            }
        });
    }
    
    // Close modals
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal-backdrop').classList.add('hidden');
        });
    });
    
    // Close modal when clicking outside
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                backdrop.classList.add('hidden');
            }
        });
    });
}

// Setup profile form
function setupProfileForm() {
    const profileForm = document.getElementById('form-profile');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('profile-name').value;
            const email = document.getElementById('profile-email').value;
            const phone = document.getElementById('profile-phone').value;
            const currentPassword = document.getElementById('profile-current-password').value;
            const newPassword = document.getElementById('profile-new-password').value;
            
            try {
                const updateData = { name, email, phone };
                
                if (newPassword && currentPassword) {
                    updateData.currentPassword = currentPassword;
                    updateData.newPassword = newPassword;
                }
                
                const response = await fetch(`${API_BASE}/auth/profile`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(updateData)
                });
                
                if (response.ok) {
                    alert('Profil berhasil diperbarui');
                    document.getElementById('profile-current-password').value = '';
                    document.getElementById('profile-new-password').value = '';
                    document.getElementById('modal-profile').classList.add('hidden');
                } else {
                    const error = await response.json();
                    alert(error.message || 'Gagal memperbarui profil');
                }
            } catch (error) {
                console.error('Update profile failed:', error);
                alert('Terjadi kesalahan saat memperbarui profil');
            }
        });
    }
    
    // Setup admin user management form
    setupAdminUserForm();
}

function setupAdminUserForm() {
    const userForm = document.getElementById('form-user');
    if (!userForm) return;
    
    const btnAddUser = document.getElementById('btn-add-user');
    if (btnAddUser) {
        btnAddUser.addEventListener('click', () => {
            userForm.reset();
            document.getElementById('user-id').value = '';
            document.getElementById('generated-password-display').classList.add('hidden');
            document.getElementById('user-form-title').textContent = 'Tambah Admin';
            document.getElementById('user-admin-umum').checked = true;
            document.getElementById('user-managed-assets-wrapper').classList.add('hidden');
            document.getElementById('modal-user-form').classList.remove('hidden');
        });
    }
    
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userId = document.getElementById('user-id').value;
        const payload = {
            username: document.getElementById('user-username').value.trim(),
            name: document.getElementById('user-name').value.trim(),
            email: document.getElementById('user-email').value.trim(),
            phone: document.getElementById('user-phone').value.trim(),
            adminType: document.querySelector('input[name="user-admin-type"]:checked')?.value || 'umum',
            managedAssetCodes: []
        };
        
        // Collect checked assets for admin khusus
        if (payload.adminType === 'khusus') {
            const checkedAssets = document.querySelectorAll('input[name="managed-asset"]:checked');
            payload.managedAssetCodes = Array.from(checkedAssets).map(cb => cb.value);
        }
        
        if (!payload.username || !payload.name || !payload.email) {
            alert('Username, nama, dan email wajib diisi');
            return;
        }
        
        try {
            const method = userId ? 'PUT' : 'POST';
            const url = userId ? `${API_BASE}/auth/admin/${userId}` : `${API_BASE}/auth/admin`;
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Gagal menyimpan admin');
            }
            
            const result = await response.json();
            
            // Show password only for new admins
            if (!userId && result.generatedPassword) {
                document.getElementById('generated-password-text').textContent = result.generatedPassword;
                document.getElementById('generated-password-display').classList.remove('hidden');
                document.getElementById('copy-password-btn').addEventListener('click', () => {
                    navigator.clipboard.writeText(result.generatedPassword);
                    alert('Password berhasil disalin');
                });
            } else {
                alert(`Admin berhasil ${userId ? 'diperbarui' : 'dibuat'}`);
                document.getElementById('modal-user-form').classList.add('hidden');
                loadAdminsList();
            }
        } catch (error) {
            alert(`Gagal: ${error.message}`);
        }
    });
}

// ===== DATA LOADING & RENDERING =====
function initializeApp() {
    const state = {
        assets: {},
        allBookingsCache: [],
        allRequestsCache: [],
        allDrivers: [],
        allAssetsCache: [],
    };

    const api = {
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

    const ui = {
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
                    const driverName = typeof b.driver === 'object' && b.driver ? b.driver.nama : (b.driver || '-');
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
            setupTableClickHandlers();
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
            const sorted = [...drivers].sort((a, b) => (a.kode || '').localeCompare(b.kode || ''));
            
            if (sorted.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-3 text-center text-gray-500">Tidak ada data</td></tr>`;
                return;
            }
            
            tableBody.innerHTML = sorted.map(d => {
                const cellClass = "px-6 py-3 whitespace-nowrap text-sm text-gray-500";
                return `<tr class="cursor-pointer" data-driver-id="${d._id}">
                    <td class="${cellClass}">${d.kode || '-'}</td>
                    <td class="${cellClass}">${d.nama || '-'}</td>
                    <td class="${cellClass}">${d.noTelp || '-'}</td>
                    <td class="${cellClass}">${d.detail || '-'}</td>
                    <td class="px-6 py-3 text-right">
                        <button type="button" class="mr-2" title="Edit" aria-label="Edit supir"><i class="fas fa-pen-to-square text-emerald-700 hover:text-emerald-800 btn"></i></button>
                        <button type="button" title="Hapus" aria-label="Hapus supir"><i class="fas fa-trash color-gedung hover:opacity-80 btn"></i></button>
                    </td>
                </tr>`;
            }).join('');
        },

        renderMasterTable: function(assets) {
            const tableBody = document.getElementById('master-asset-table');
            if (!tableBody) return;
            
            tableBody.innerHTML = '';
            const sorted = [...assets].sort((a, b) => a.nama.localeCompare(b.nama));
            
            if (sorted.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-3 text-center text-gray-500">Tidak ada data</td></tr>`;
                return;
            }
            
            tableBody.innerHTML = sorted.map(a => {
                const cellClass = "px-6 py-3 whitespace-nowrap text-sm text-gray-500";
                const badgeClass = "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700";
                return `<tr class="cursor-pointer" data-asset-id="${a._id}">
                    <td class="${cellClass}">${a.kode || '-'}</td>
                    <td class="${cellClass}">${a.nama || '-'}</td>
                    <td class="${cellClass}"><span class="${badgeClass}">${a.tipe || '-'}</span></td>
                    <td class="${cellClass}">${a.num ?? '-'}</td>
                    <td class="${cellClass}">${a.detail || '-'}</td>
                    <td class="px-6 py-3 text-right">
                        <button type="button" class="mr-2" title="Edit" aria-label="Edit aset"><i class="fas fa-pen-to-square text-emerald-700 hover:text-emerald-800 btn"></i></button>
                        <button type="button" title="Hapus" aria-label="Hapus aset"><i class="fas fa-trash color-gedung hover:opacity-80 btn"></i></button>
                    </td>
                </tr>`;
            }).join('');
        },

        showDetailModal: function(props, context = 'admin') {
            let assetDisplay = props.assetName;
            if (props.bookingType === 'kendaraan' && state.assets && state.assets.kendaraan) {
                const kendaraan = state.assets.kendaraan.find(k => k.nama === props.assetName);
                const kode = kendaraan && kendaraan.kode ? kendaraan.kode : '';
                assetDisplay = kode ? `${props.assetName} (${kode})` : props.assetName;
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
            const waktuText = formatRangeForModal(start, end);
            
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
                    if (props.driver && (typeof props.driver === 'object' ? props.driver.nama : props.driver)) {
                        const driverName = typeof props.driver === 'object' ? props.driver.nama : props.driver;
                        detailsHtml += `<p><strong>Supir:</strong> ${driverName}</p>`;
                    }
                }
                if (props.notes) {
                    detailsHtml += `<p><strong>Keterangan:</strong> ${props.notes}</p>`;
                }
                
                if (props.letterFile) {
                    detailsHtml += `<p><strong>Surat:</strong> <a href="/api/requests/download-surat/${props.letterFile}" target="_blank" class="text-blue-500 underline">Download Surat</a></p>`;
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

    function formatRangeForModal(start, end) {
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

    async function loadAndRender() {
        try {
            // Load all data
            state.allBookingsCache = await api.fetchAllBookings();
            state.allRequestsCache = await api.fetchAllRequests();
            state.assets = await api.fetchAssets();
            state.allDrivers = await api.fetchDrivers();
            
            // Filter bookings by type
            const bookingsGedung = state.allBookingsCache.filter(b => b.bookingType === 'gedung');
            const bookingsKendaraan = state.allBookingsCache.filter(b => b.bookingType === 'kendaraan');
            
            // Combine all assets
            state.allAssetsCache = [
                ...(state.assets.gedung || []),
                ...(state.assets.kendaraan || []),
                ...(state.assets.barang || [])
            ];
            
            // Render all tables
            ui.renderRequestList(state.allRequestsCache);
            ui.renderBookingList('gedung', bookingsGedung);
            ui.renderBookingList('kendaraan', bookingsKendaraan);
            applyDriverFilters();
            applyMasterFilters();
            
            // Initialize table sorting after rendering
            initTableSorting();
            
            // Populate filter dropdowns
            populateFilterOptions(state);

            // Set default filters (request: pending; gedung/kendaraan: current month) then apply
            setDefaultFilters();
            applyRequestFilters();
            applyAdminFilters('gedung');
            applyAdminFilters('kendaraan');
            
            // Setup filter event listeners
            setupFilterListeners();
            setupManagementFilters();
            
            // Setup click handlers for table rows
            setupTableClickHandlers();
            
            console.log('✅ All data loaded and rendered');
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    function setupTableClickHandlers() {
        // Remove old listeners first to prevent duplicates
        const requestTable = document.getElementById('request-list-table');
        if (requestTable) {
            const newRequestTable = requestTable.cloneNode(true);
            requestTable.parentNode.replaceChild(newRequestTable, requestTable);
            
            newRequestTable.addEventListener('click', (e) => {
                const row = e.target.closest('tr[data-request-id]');
                if (row) {
                    const id = row.dataset.requestId;
                    const req = state.allRequestsCache.find(r => r._id === id);
                    if (req) showRequestDetail(req);
                }
            }, true);
        }
        
        // Gedung table click handler
        const gedungTable = document.getElementById('gedung-list-table');
        if (gedungTable) {
            gedungTable.addEventListener('click', (e) => {
                const editBtn = e.target.closest('.btn-edit');
                const deleteBtn = e.target.closest('.btn-delete');
                const row = e.target.closest('tr[data-booking-id]');
                
                if (!row) return;
                if (editBtn) {
                    e.stopPropagation();
                    console.log('Edit gedung booking:', editBtn.dataset.id || row.dataset.bookingId);
                } else if (deleteBtn) {
                    e.stopPropagation();
                    console.log('Delete gedung booking:', deleteBtn.dataset.id || row.dataset.bookingId);
                } else if (!editBtn && !deleteBtn) {
                    const bookingData = state.allBookingsCache.find(b => b._id === row.dataset.bookingId);
                    if (bookingData) ui.showDetailModal(bookingData, 'admin');
                }
            }, true);
        }

        // Kendaraan table click handler
        const kendaraanTable = document.getElementById('kendaraan-list-table');
        if (kendaraanTable) {
            kendaraanTable.addEventListener('click', (e) => {
                const editBtn = e.target.closest('.btn-edit');
                const deleteBtn = e.target.closest('.btn-delete');
                const row = e.target.closest('tr[data-booking-id]');
                
                if (!row) return;
                if (editBtn) {
                    e.stopPropagation();
                    console.log('Edit kendaraan booking:', editBtn.dataset.id || row.dataset.bookingId);
                } else if (deleteBtn) {
                    e.stopPropagation();
                    console.log('Delete kendaraan booking:', deleteBtn.dataset.id || row.dataset.bookingId);
                } else if (!editBtn && !deleteBtn) {
                    const bookingData = state.allBookingsCache.find(b => b._id === row.dataset.bookingId);
                    if (bookingData) ui.showDetailModal(bookingData, 'admin');
                }
            }, true);
        }

        // Driver table click handler
        const driverTable = document.getElementById('driver-list-table');
        if (driverTable) {
            driverTable.addEventListener('click', (e) => {
                const editBtn = e.target.closest('i.fa-pen-to-square');
                const deleteBtn = e.target.closest('i.fa-trash');
                const row = e.target.closest('tr[data-driver-id]');
                
                if (!row) return;
                if (editBtn) {
                    e.stopPropagation();
                    console.log('Edit driver:', row.dataset.driverId);
                } else if (deleteBtn) {
                    e.stopPropagation();
                    console.log('Delete driver:', row.dataset.driverId);
                }
            }, true);
        }

        // Master asset table click handler
        const masterTable = document.getElementById('master-asset-table');
        if (masterTable) {
            masterTable.addEventListener('click', (e) => {
                const editBtn = e.target.closest('i.fa-pen-to-square');
                const deleteBtn = e.target.closest('i.fa-trash');
                const row = e.target.closest('tr[data-asset-id]');
                
                if (!row) return;
                if (editBtn) {
                    e.stopPropagation();
                    console.log('Edit asset:', row.dataset.assetId);
                } else if (deleteBtn) {
                    e.stopPropagation();
                    console.log('Delete asset:', row.dataset.assetId);
                }
            }, true);
        }
    }

    // ========== HELPER FUNCTIONS ==========
    function formatBorrowedItemsForDisplay(borrowedItems) {
        if (!borrowedItems) return '-';
        if (Array.isArray(borrowedItems) && borrowedItems.length) {
            return borrowedItems.map(it => `${it.assetName}: ${it.quantity}`).join(', ');
        }
        if (typeof borrowedItems === 'string' && borrowedItems.trim()) return borrowedItems;
        return '-';
    }

    // ========== FILTER POPULATION ==========
    function populateFilterOptions(state) {
        const filterGedungAsset = document.getElementById('filter-gedung-asset');
        if (filterGedungAsset && state.assets && state.assets.gedung) {
            filterGedungAsset.innerHTML = '<option value="all">Semua Gedung</option>';
            state.assets.gedung.forEach(asset => {
                filterGedungAsset.innerHTML += `<option value="${asset.kode}">${asset.nama}</option>`;
            });
            console.log('✅ Populated gedung assets:', state.assets.gedung.length);
        }
        
        const filterGedungBarang = document.getElementById('filter-gedung-barang');
        if (filterGedungBarang && state.assets && state.assets.barang) {
            filterGedungBarang.innerHTML = '<option value="all">Semua Barang</option>';
            state.assets.barang.forEach(asset => {
                filterGedungBarang.innerHTML += `<option value="${asset.kode}">${asset.nama}</option>`;
            });
            console.log('✅ Populated barang:', state.assets.barang.length);
        }
        
        const filterKendaraanAsset = document.getElementById('filter-kendaraan-asset');
        if (filterKendaraanAsset && state.assets && state.assets.kendaraan) {
            filterKendaraanAsset.innerHTML = '<option value="all">Semua Kendaraan</option>';
            state.assets.kendaraan.forEach(asset => {
                filterKendaraanAsset.innerHTML += `<option value="${asset.kode}">${asset.nama}</option>`;
            });
            console.log('✅ Populated kendaraan assets:', state.assets.kendaraan.length);
        }
        
        const filterKendaraanDriver = document.getElementById('filter-kendaraan-driver');
        if (filterKendaraanDriver && state.allDrivers && state.allDrivers.length > 0) {
            filterKendaraanDriver.innerHTML = '<option value="all">Semua Supir</option>';
            state.allDrivers.forEach(driver => {
                filterKendaraanDriver.innerHTML += `<option value="${driver._id}">${driver.nama}</option>`;
            });
            console.log('✅ Populated drivers:', state.allDrivers.length);
        } else {
            console.log('❌ Could not populate drivers');
        }
    }

    // ========== DRIVER & ASSET MANAGEMENT FILTERS ==========
    function setupManagementFilters() {
        const driverSearch = document.getElementById('filter-driver-search');
        if (driverSearch) {
            driverSearch.addEventListener('input', applyDriverFilters);
            driverSearch.addEventListener('keyup', applyDriverFilters);
        }

        const masterType = document.getElementById('master-filter-type');
        const masterSearch = document.getElementById('master-search');
        if (masterType) masterType.addEventListener('change', applyMasterFilters);
        if (masterSearch) {
            masterSearch.addEventListener('input', applyMasterFilters);
            masterSearch.addEventListener('keyup', applyMasterFilters);
        }
    }

    function applyDriverFilters() {
        const searchInput = document.getElementById('filter-driver-search');
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const source = Array.isArray(state.allDrivers) ? state.allDrivers : [];

        const filtered = !query ? source : source.filter(driver => {
            const fields = [driver.kode, driver.nama, driver.noTelp, driver.detail]
                .map(val => (val || '').toString().toLowerCase());
            return fields.some(text => text.includes(query));
        });

        ui.renderDriverList(filtered);
    }

    function applyMasterFilters() {
        const typeSelect = document.getElementById('master-filter-type');
        const searchInput = document.getElementById('master-search');
        const selectedType = typeSelect ? typeSelect.value : 'all';
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

        let assets = Array.isArray(state.allAssetsCache) ? [...state.allAssetsCache] : [];

        if (selectedType && selectedType !== 'all') {
            assets = assets.filter(asset => asset.tipe === selectedType);
        }

        if (query) {
            assets = assets.filter(asset => {
                const fields = [asset.kode, asset.nama, asset.detail]
                    .map(val => (val || '').toString().toLowerCase());
                return fields.some(text => text.includes(query));
            });
        }

        ui.renderMasterTable(assets);
    }

    // ========== FILTER SETUP ==========
    function setDefaultFilters() {
        const today = new Date();
        const ym = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

        const reqStatus = document.getElementById('filter-request-status');
        if (reqStatus) reqStatus.value = 'pending';

        const gedungMonth = document.getElementById('filter-gedung-month');
        if (gedungMonth) gedungMonth.value = ym;

        const kendaraanMonth = document.getElementById('filter-kendaraan-month');
        if (kendaraanMonth) kendaraanMonth.value = ym;
    }

    function setupFilterListeners() {
        const filtersGedung = document.getElementById('filters-gedung');
        const filtersKendaraan = document.getElementById('filters-kendaraan');
        const filtersRequest = document.getElementById('filters-request');
        
        if (filtersGedung) {
            filtersGedung.addEventListener('input', () => applyAdminFilters('gedung'));
            filtersGedung.addEventListener('change', () => applyAdminFilters('gedung'));
            const searchInput = document.getElementById('filter-gedung-search');
            if (searchInput) {
                searchInput.addEventListener('keyup', () => applyAdminFilters('gedung'));
            }
        }
        
        if (filtersKendaraan) {
            filtersKendaraan.addEventListener('input', () => applyAdminFilters('kendaraan'));
            filtersKendaraan.addEventListener('change', () => applyAdminFilters('kendaraan'));
            const searchInput = document.getElementById('filter-kendaraan-search');
            if (searchInput) {
                searchInput.addEventListener('keyup', () => applyAdminFilters('kendaraan'));
            }
        }
        
        if (filtersRequest) {
            filtersRequest.addEventListener('input', () => applyRequestFilters());
            filtersRequest.addEventListener('change', () => applyRequestFilters());
        }
    }

    function applyAdminFilters(type) {
        console.log(`🔍 applyAdminFilters called for type: ${type}`);
        const filterPanel = document.getElementById(`filters-${type}`);
        if (!filterPanel) {
            console.warn(`⚠️  Filter panel not found for type: ${type}`);
            return;
        }
        
        const monthInput = filterPanel.querySelector(`#filter-${type}-month`);
        const assetInput = filterPanel.querySelector(`#filter-${type}-asset`);
        const barangInput = type === 'gedung' ? filterPanel.querySelector('#filter-gedung-barang') : null;
        const searchInput = filterPanel.querySelector(`#filter-${type}-search`);
        const driverInput = (type === 'kendaraan') ? filterPanel.querySelector(`#filter-${type}-driver`) : null;
        
        const month = monthInput ? monthInput.value : '';
        const asset = assetInput ? assetInput.value : 'all';
        const barang = barangInput ? barangInput.value : 'all';
        const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const driver = driverInput ? driverInput.value : 'all';
        
        console.log(`📋 Filter values - month: ${month}, asset: ${asset}, barang: ${barang}, driver: ${driver}, search: ${searchQuery}`);
        console.log(`📦 state.allBookingsCache has ${state.allBookingsCache.length} items`);
        const bookingsToFilter = filterData(state.allBookingsCache, { type, month, asset, barang, driver, searchQuery });
        console.log(`🎯 Filtered to ${bookingsToFilter.length} bookings, rendering...`);
        ui.renderBookingList(type, bookingsToFilter);
    }

    function filterData(bookings, filters) {
        return bookings.filter(b => {
            if (b.bookingType !== filters.type) return false;
            
            if (filters.month) {
                const bookingDate = new Date(b.startDate);
                const bookingYear = bookingDate.getFullYear();
                const bookingMonth = String(bookingDate.getMonth() + 1).padStart(2, '0');
                const bookingYearMonth = `${bookingYear}-${bookingMonth}`;
                if (bookingYearMonth !== filters.month) return false;
            }
            
            if (filters.asset && filters.asset !== 'all' && b.assetCode !== filters.asset) return false;

            if (filters.barang && filters.barang !== 'all') {
                const hasBarang = Array.isArray(b.borrowedItems) && b.borrowedItems.some(it => it.assetCode === filters.barang);
                if (!hasBarang) return false;
            }
            
            if (filters.driver && filters.driver !== 'all') {
                const driverId = typeof b.driver === 'object' && b.driver ? b.driver._id : b.driver;
                if (!driverId || driverId !== filters.driver) return false;
            }
            
            if (filters.searchQuery) {
                const assetNameMatch = b.assetName && b.assetName.toLowerCase().includes(filters.searchQuery);
                const userNameMatch = b.userName && b.userName.toLowerCase().includes(filters.searchQuery);
                const notesMatch = b.notes && b.notes.toLowerCase().includes(filters.searchQuery);
                
                let additionalFieldsMatch = false;
                if (b.bookingType === 'gedung' && Array.isArray(b.borrowedItems)) {
                    const borrowedItemsText = b.borrowedItems.map(it => `${it.assetName} ${it.assetCode}`).join(' ').toLowerCase();
                    if (borrowedItemsText.includes(filters.searchQuery)) additionalFieldsMatch = true;
                }
                if (b.bookingType === 'kendaraan') {
                    const driverName = typeof b.driver === 'object' && b.driver ? b.driver.nama : (b.driver || '');
                    if (driverName.toLowerCase().includes(filters.searchQuery)) additionalFieldsMatch = true;
                    if (b.destination && b.destination.toLowerCase().includes(filters.searchQuery)) additionalFieldsMatch = true;
                }
                
                if (!(assetNameMatch || userNameMatch || notesMatch || additionalFieldsMatch)) {
                    return false;
                }
            }
            
            return true;
        });
    }

    function applyRequestFilters() {
        console.log('🔍 applyRequestFilters called');
        const filterPanel = document.getElementById('filters-request');
        if (!filterPanel) {
            console.warn('⚠️  Request filter panel not found');
            return;
        }
        const typeInput = filterPanel.querySelector('#filter-request-type');
        const statusInput = filterPanel.querySelector('#filter-request-status');
        const monthInput = filterPanel.querySelector('#filter-request-month');
        const searchInput = filterPanel.querySelector('#filter-request-search');

        const type = typeInput ? typeInput.value : 'all';
        const status = statusInput ? statusInput.value : 'all';
        const month = monthInput ? monthInput.value : '';
        const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';

        const filtered = state.allRequestsCache.filter(r => {
            if (type !== 'all' && r.bookingType !== type) return false;
            if (status !== 'all' && r.status !== status) return false;

            if (month) {
                const reqDate = new Date(r.startDate);
                const reqYear = reqDate.getFullYear();
                const reqMonth = String(reqDate.getMonth() + 1).padStart(2, '0');
                const reqYearMonth = `${reqYear}-${reqMonth}`;
                if (reqYearMonth !== month) return false;
            }

            if (searchQuery) {
                const assetMatch = r.assetName?.toLowerCase().includes(searchQuery);
                const userMatch = r.userName?.toLowerCase().includes(searchQuery);
                const noteMatch = r.notes ? r.notes.toLowerCase().includes(searchQuery) : false;
                const codeMatch = r.requestId ? r.requestId.toLowerCase().includes(searchQuery) : false;
                const idMatch = r._id ? String(r._id).toLowerCase().includes(searchQuery) : false;
                if (!(assetMatch || userMatch || noteMatch || codeMatch || idMatch)) return false;
            }
            return true;
        });

        ui.renderRequestList(filtered);
    }

    async function handleApproveRequest(id, driver = 'Tanpa Supir') {
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

    async function handleRejectRequest(id) {
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

    function showRequestDetail(request) {
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
                const driverName = typeof request.driver === 'object' ? request.driver.nama : request.driver;
                detailHtml += `<p><strong>Supir:</strong> ${driverName}</p>`;
            }
            if (request.destination) detailHtml += `<p><strong>Tujuan:</strong> ${request.destination}</p>`;
        }
        
        if (request.notes) detailHtml += `<p><strong>Keterangan:</strong> ${request.notes}</p>`;
        if (request.status === 'rejected' && request.rejectionReason) {
            detailHtml += `<p><strong>Alasan Penolakan:</strong> <span class="text-red-600">${request.rejectionReason}</span></p>`;
        }
        
        if (request.status === 'pending') {
            const drivers = Array.isArray(state.allDrivers) ? state.allDrivers : [];
            const driverSelectHtml = request.bookingType === 'kendaraan' ? `
                <div class="mt-3">
                    <label for="req-approve-supir" class="form-label text-sm font-semibold">Pilih Supir</label>
                    <select id="req-approve-supir" class="form-input">
                        <option value="">Tanpa Supir</option>
                        ${drivers.map(d => `<option value="${d._id}">${d.nama}</option>`).join('')}
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
                            handleApproveRequest(request._id, selectedDriver);
                        });
                    }
                    
                    if (rejectBtn) {
                        const newRejectBtn = rejectBtn.cloneNode(true);
                        rejectBtn.parentNode.replaceChild(newRejectBtn, rejectBtn);
                        newRejectBtn.addEventListener('click', () => handleRejectRequest(request._id));
                    }
                }, 0);
            }
        }
        
        if (modalRequestAction) modalRequestAction.classList.remove('hidden');
    }

    // ========== TABLE SORTING FUNCTIONS ===========
    function initTableSorting() {
        const sortableHeaders = document.querySelectorAll('th.sortable');
        if (!sortableHeaders.length) return;
        
        const sortState = {
            column: null,
            direction: 'asc'
        };
        
        sortableHeaders.forEach(header => {
            const newHeader = header.cloneNode(true);
            header.parentNode.replaceChild(newHeader, header);
            
            newHeader.addEventListener('click', function() {
                const sortKey = this.getAttribute('data-sort');
                const tableId = this.closest('table').querySelector('tbody').id;
                
                document.querySelectorAll('th.sortable').forEach(h => {
                    const icon = h.querySelector('.sort-icon');
                    if (icon) {
                        icon.innerHTML = '<i class="fa fa-sort"></i>';
                    }
                    h.classList.remove('sort-asc', 'sort-desc');
                });
                
                if (sortState.column === sortKey) {
                    sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    sortState.column = sortKey;
                    sortState.direction = 'asc';
                }
                
                if (sortState.direction === 'asc') {
                    this.classList.add('sort-asc');
                    const icon = this.querySelector('.sort-icon');
                    if (icon) {
                        icon.innerHTML = '<i class="fa fa-sort-up"></i>';
                    }
                } else {
                    this.classList.add('sort-desc');
                    const icon = this.querySelector('.sort-icon');
                    if (icon) {
                        icon.innerHTML = '<i class="fa fa-sort-down"></i>';
                    }
                }
                
                sortTable(tableId, sortKey, sortState.direction);
            });
        });
    }

    function sortTable(tableId, sortKey, direction) {
        const tbody = document.getElementById(tableId);
        if (!tbody) return;
        
        const rows = Array.from(tbody.querySelectorAll('tr'));
        if (rows.length === 0) return;
        
        const sortedRows = rows.sort((rowA, rowB) => {
            let valueA, valueB;
            
            switch(sortKey) {
                case 'created': {
                    valueA = parseIndonesianDate(rowA.cells[0].textContent.trim());
                    valueB = parseIndonesianDate(rowB.cells[0].textContent.trim());
                    break;
                }
                case 'tipe': {
                    const idx = tableId === 'master-asset-table' ? 2 : 1;
                    valueA = rowA.cells[idx].textContent.trim().toLowerCase();
                    valueB = rowB.cells[idx].textContent.trim().toLowerCase();
                    break;
                }
                case 'aset': {
                    const idx = tableId === 'request-list-table' ? 2 : 1;
                    valueA = rowA.cells[idx].textContent.trim().toLowerCase();
                    valueB = rowB.cells[idx].textContent.trim().toLowerCase();
                    break;
                }
                case 'peminjam':
                case 'pemakai': {
                    const idx = tableId === 'request-list-table' ? 3 : 2;
                    valueA = rowA.cells[idx].textContent.trim().toLowerCase();
                    valueB = rowB.cells[idx].textContent.trim().toLowerCase();
                    break;
                }
                case 'tanggal': {
                    const idx = tableId === 'request-list-table' ? 4 : 3;
                    valueA = parseIndonesianDate(rowA.cells[idx].textContent.trim());
                    valueB = parseIndonesianDate(rowB.cells[idx].textContent.trim());
                    break;
                }
                case 'status': {
                    if (tableId !== 'request-list-table') {
                        valueA = '';
                        valueB = '';
                        break;
                    }
                    valueA = rowA.cells[5].textContent.trim().toLowerCase();
                    valueB = rowB.cells[5].textContent.trim().toLowerCase();
                    break;
                }
                case 'gedung':
                case 'kendaraan': {
                    valueA = rowA.cells[1].textContent.trim().toLowerCase();
                    valueB = rowB.cells[1].textContent.trim().toLowerCase();
                    break;
                }
                case 'barang': {
                    valueA = rowA.cells[4].textContent.trim().toLowerCase();
                    valueB = rowB.cells[4].textContent.trim().toLowerCase();
                    break;
                }
                case 'supir': {
                    valueA = rowA.cells[4].textContent.trim().toLowerCase();
                    valueB = rowB.cells[4].textContent.trim().toLowerCase();
                    break;
                }
                case 'keterangan': {
                    const idx = 5;
                    valueA = rowA.cells[idx].textContent.trim().toLowerCase();
                    valueB = rowB.cells[idx].textContent.trim().toLowerCase();
                    break;
                }
                case 'kode': {
                    valueA = rowA.cells[0].textContent.trim().toLowerCase();
                    valueB = rowB.cells[0].textContent.trim().toLowerCase();
                    break;
                }
                case 'nama': {
                    valueA = rowA.cells[1].textContent.trim().toLowerCase();
                    valueB = rowB.cells[1].textContent.trim().toLowerCase();
                    break;
                }
                case 'no-telp': {
                    valueA = rowA.cells[2].textContent.trim().toLowerCase();
                    valueB = rowB.cells[2].textContent.trim().toLowerCase();
                    break;
                }
                case 'qty': {
                    valueA = parseInt(rowA.cells[3].textContent.trim()) || 0;
                    valueB = parseInt(rowB.cells[3].textContent.trim()) || 0;
                    break;
                }
                case 'detail': {
                    const idx = tableId === 'driver-list-table' ? 3 : 4;
                    valueA = rowA.cells[idx].textContent.trim().toLowerCase();
                    valueB = rowB.cells[idx].textContent.trim().toLowerCase();
                    break;
                }
                default: {
                    valueA = '';
                    valueB = '';
                }
            }
            
            let comparison = 0;
            if (valueA instanceof Date && valueB instanceof Date) {
                comparison = valueA - valueB;
            } else if (typeof valueA === 'number' && typeof valueB === 'number') {
                comparison = valueA - valueB;
            } else {
                comparison = String(valueA).localeCompare(String(valueB), 'id');
            }
            
            return direction === 'asc' ? comparison : -comparison;
        });
        
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }
        
        sortedRows.forEach(row => tbody.appendChild(row));
    }

    function parseIndonesianDate(dateStr) {
        try {
            if (dateStr.includes('-')) {
                dateStr = dateStr.split('-')[0].trim();
            }
            
            if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(dateStr)) {
                const [day, month, year] = dateStr.split('/').map(Number);
                return new Date(year, month - 1, day);
            }
            
            if (/\d{1,2}-\d{1,2}-\d{4}/.test(dateStr)) {
                const [day, month, year] = dateStr.split('-').map(Number);
                return new Date(year, month - 1, day);
            }
            
            const parts = dateStr.split(' ');
            const months = {
                'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 
                'Mei': 4, 'Juni': 5, 'Juli': 6, 'Agustus': 7,
                'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
            };
            
            if (parts.length >= 3) {
                const day = parseInt(parts[0], 10);
                const month = months[parts[1]];
                const year = parseInt(parts[2], 10);
                
                if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                    return new Date(year, month, day);
                }
            }
            
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date;
            }
            
            return dateStr;
        } catch (e) {
            console.error('Error parsing date:', e);
            return dateStr;
        }
    }

    // Load data on init
    loadAndRender();
}

// ===== MODAL & FORM FUNCTIONS =====

// Open Gedung Modal
function openGedungModal(booking = null) {
    const modal = document.getElementById('modal-form-gedung');
    const form = document.getElementById('form-gedung');
    const title = document.getElementById('gedung-form-title');
    
    if (!modal || !form) return;
    
    title.textContent = booking ? 'Edit Peminjaman Gedung' : 'Tambah Peminjaman Gedung';
    form.reset();
    
    if (booking) {
        document.getElementById('gedung-booking-id').value = booking._id;
        document.getElementById('gedung-peminjam').value = booking.userName;
        document.getElementById('gedung-nama').value = booking.assetCode;
        document.getElementById('gedung-penanggung-jawab').value = booking.personInCharge;
        document.getElementById('gedung-nomor-penanggung-jawab').value = booking.picPhoneNumber;
        document.getElementById('gedung-kegiatan').value = booking.activityName || '';
        document.getElementById('gedung-keterangan').value = booking.notes || '';
        document.getElementById('gedung-mulai-tanggal').value = new Date(booking.startDate).toISOString().split('T')[0];
        document.getElementById('gedung-selesai-tanggal').value = new Date(booking.endDate).toISOString().split('T')[0];
    }
    
    modal.classList.remove('hidden');
}

// Open Kendaraan Modal
function openKendaraanModal(booking = null) {
    const modal = document.getElementById('modal-form-kendaraan');
    const form = document.getElementById('form-kendaraan');
    const title = document.getElementById('kendaraan-form-title');
    
    if (!modal || !form) return;
    
    title.textContent = booking ? 'Edit Peminjaman Kendaraan' : 'Tambah Peminjaman Kendaraan';
    form.reset();
    
    if (booking) {
        document.getElementById('kendaraan-booking-id').value = booking._id;
        document.getElementById('kendaraan-peminjam').value = booking.userName;
        document.getElementById('kendaraan-nama').value = booking.assetCode;
        document.getElementById('kendaraan-penanggung-jawab').value = booking.personInCharge;
        document.getElementById('kendaraan-nomor-penanggung-jawab').value = booking.picPhoneNumber;
        document.getElementById('kendaraan-tujuan').value = booking.destination || '';
        document.getElementById('kendaraan-keterangan').value = booking.notes || '';
        document.getElementById('kendaraan-mulai-tanggal').value = new Date(booking.startDate).toISOString().split('T')[0];
        document.getElementById('kendaraan-selesai-tanggal').value = new Date(booking.endDate).toISOString().split('T')[0];
        if (booking.driver) {
            document.getElementById('kendaraan-supir').value = typeof booking.driver === 'object' ? booking.driver._id : booking.driver;
        }
    }
    
    modal.classList.remove('hidden');
}

// Open Driver Modal
function openDriverModal(driver = null) {
    const modal = document.getElementById('modal-form-driver');
    const form = document.getElementById('form-driver');
    const title = document.getElementById('driver-form-title');
    
    if (!modal || !form) return;
    
    title.textContent = driver ? 'Edit Supir' : 'Tambah Supir';
    form.reset();
    
    if (driver) {
        document.getElementById('driver-id').value = driver._id;
        document.getElementById('driver-kode').value = driver.kode;
        document.getElementById('driver-nama').value = driver.nama;
        document.getElementById('driver-notelp').value = driver.noTelp || '';
        document.getElementById('driver-detail').value = driver.detail || '';
    }
    
    modal.classList.remove('hidden');
}

// Open Asset Modal
function openAssetModal(asset = null) {
    const modal = document.getElementById('modal-asset');
    const form = document.getElementById('form-asset');
    const title = document.getElementById('asset-form-title');
    
    if (!modal || !form) return;
    
    title.textContent = asset ? 'Edit Aset' : 'Tambah Aset';
    form.reset();
    
    if (asset) {
        document.getElementById('asset-id').value = asset._id;
        document.getElementById('asset-kode').value = asset.kode;
        document.getElementById('asset-nama').value = asset.nama;
        document.getElementById('asset-tipe').value = asset.tipe;
        document.getElementById('asset-detail').value = asset.detail || '';
        if (asset.num !== undefined && asset.num !== null) {
            document.getElementById('asset-num').value = asset.num;
        }
        updateAssetNumVisibility(asset.tipe);
    } else {
        updateAssetNumVisibility('gedung');
    }
    
    modal.classList.remove('hidden');
}

// Update Asset Num Visibility based on type
function updateAssetNumVisibility(tipe) {
    const wrapper = document.getElementById('asset-num-wrapper');
    const input = document.getElementById('asset-num');
    if (!wrapper || !input) return;
    
    const show = tipe === 'barang' || tipe === 'kendaraan';
    wrapper.classList.toggle('hidden', !show);
    input.placeholder = tipe === 'barang' ? 'Qty (misal: 40)' : 'Max penumpang (misal: 15)';
}

// Setup Form Submit Handlers
function setupFormSubmitHandlers() {
    // Gedung Form
    const gedungForm = document.getElementById('form-gedung');
    if (gedungForm) {
        gedungForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('gedung-booking-id').value || null;
            const payload = {
                bookingType: 'gedung',
                userName: document.getElementById('gedung-peminjam').value,
                assetCode: document.getElementById('gedung-nama').value,
                personInCharge: document.getElementById('gedung-penanggung-jawab').value,
                picPhoneNumber: document.getElementById('gedung-nomor-penanggung-jawab').value,
                activityName: document.getElementById('gedung-kegiatan').value,
                notes: document.getElementById('gedung-keterangan').value,
                startDate: new Date(document.getElementById('gedung-mulai-tanggal').value),
                endDate: new Date(document.getElementById('gedung-selesai-tanggal').value)
            };
            
            if (!payload.userName || !payload.assetCode) {
                alert('Nama peminjam dan gedung wajib diisi.');
                return;
            }
            
            try {
                const method = id ? 'PUT' : 'POST';
                const url = id ? `${API_BASE}/api/bookings/${id}` : `${API_BASE}/api/bookings`;
                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Gagal menyimpan');
                }
                
                alert(`Peminjaman gedung berhasil ${id ? 'diperbarui' : 'ditambahkan'}.`);
                document.getElementById('modal-form-gedung').classList.add('hidden');
                // Reload data
                window.initializeApp?.();
            } catch (error) {
                alert(`Gagal: ${error.message}`);
            }
        });
    }
    
    // Kendaraan Form
    const kendaraanForm = document.getElementById('form-kendaraan');
    if (kendaraanForm) {
        kendaraanForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('kendaraan-booking-id').value || null;
            const payload = {
                bookingType: 'kendaraan',
                userName: document.getElementById('kendaraan-peminjam').value,
                assetCode: document.getElementById('kendaraan-nama').value,
                personInCharge: document.getElementById('kendaraan-penanggung-jawab').value,
                picPhoneNumber: document.getElementById('kendaraan-nomor-penanggung-jawab').value,
                destination: document.getElementById('kendaraan-tujuan').value,
                notes: document.getElementById('kendaraan-keterangan').value,
                driver: document.getElementById('kendaraan-supir').value || null,
                startDate: new Date(document.getElementById('kendaraan-mulai-tanggal').value),
                endDate: new Date(document.getElementById('kendaraan-selesai-tanggal').value)
            };
            
            if (!payload.userName || !payload.assetCode) {
                alert('Nama peminjam dan kendaraan wajib diisi.');
                return;
            }
            
            try {
                const method = id ? 'PUT' : 'POST';
                const url = id ? `${API_BASE}/api/bookings/${id}` : `${API_BASE}/api/bookings`;
                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Gagal menyimpan');
                }
                
                alert(`Peminjaman kendaraan berhasil ${id ? 'diperbarui' : 'ditambahkan'}.`);
                document.getElementById('modal-form-kendaraan').classList.add('hidden');
                // Reload data
                window.initializeApp?.();
            } catch (error) {
                alert(`Gagal: ${error.message}`);
            }
        });
    }
    
    // Driver Form
    const driverForm = document.getElementById('form-driver');
    if (driverForm) {
        driverForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('driver-id').value || null;
            const payload = {
                kode: document.getElementById('driver-kode').value.trim(),
                nama: document.getElementById('driver-nama').value.trim(),
                noTelp: document.getElementById('driver-notelp').value.trim(),
                detail: document.getElementById('driver-detail').value.trim()
            };
            
            if (!payload.kode || !payload.nama) {
                alert('Kode dan nama supir wajib diisi.');
                return;
            }
            
            try {
                const method = id ? 'PUT' : 'POST';
                const url = id ? `${API_BASE}/api/drivers/${id}` : `${API_BASE}/api/drivers`;
                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Gagal menyimpan');
                }
                
                alert(`Supir berhasil ${id ? 'diperbarui' : 'ditambahkan'}.`);
                document.getElementById('modal-form-driver').classList.add('hidden');
                // Reload data
                window.initializeApp?.();
            } catch (error) {
                alert(`Gagal: ${error.message}`);
            }
        });
    }
    
    // Asset Form
    const assetForm = document.getElementById('form-asset');
    if (assetForm) {
        assetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('asset-id').value || null;
            const payload = {
                kode: document.getElementById('asset-kode').value.trim(),
                nama: document.getElementById('asset-nama').value.trim(),
                tipe: document.getElementById('asset-tipe').value,
                detail: document.getElementById('asset-detail').value.trim(),
            };
            
            const numValue = document.getElementById('asset-num').value;
            if (numValue !== '') {
                payload.num = Number(numValue);
            }
            
            if (!payload.kode || !payload.nama) {
                alert('Kode dan nama aset wajib diisi.');
                return;
            }
            
            try {
                const method = id ? 'PUT' : 'POST';
                const url = id ? `${API_BASE}/api/assets/${id}` : `${API_BASE}/api/assets`;
                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Gagal menyimpan');
                }
                
                alert(`Aset berhasil ${id ? 'diperbarui' : 'ditambahkan'}.`);
                document.getElementById('modal-asset').classList.add('hidden');
                // Reload data
                window.initializeApp?.();
            } catch (error) {
                alert(`Gagal: ${error.message}`);
            }
        });
    }
}

// Setup Table Event Delegation
function setupTableEventDelegation() {
    // Gedung List Table
    const gedungTable = document.getElementById('gedung-list-table');
    if (gedungTable) {
        gedungTable.addEventListener('click', async (e) => {
            const editBtn = e.target.closest('.btn-edit');
            const deleteBtn = e.target.closest('.btn-delete');
            const row = e.target.closest('tr[data-booking-id]');
            
            if (!row) return;
            
            if (editBtn) {
                const bookingId = row.dataset.bookingId;
                try {
                    const response = await fetch(`${API_BASE}/api/bookings/by-code/${bookingId}`, { credentials: 'include' });
                    const booking = await response.json();
                    openGedungModal(booking);
                } catch (error) {
                    alert('Gagal memuat data: ' + error.message);
                }
            } else if (deleteBtn) {
                const bookingId = row.dataset.bookingId;
                if (confirm('Hapus peminjaman ini?')) {
                    try {
                        await fetch(`${API_BASE}/api/bookings/${bookingId}`, { method: 'DELETE', credentials: 'include' });
                        alert('Peminjaman berhasil dihapus.');
                        window.initializeApp?.();
                    } catch (error) {
                        alert('Gagal menghapus: ' + error.message);
                    }
                }
            }
        });
    }
    
    // Kendaraan List Table
    const kendaraanTable = document.getElementById('kendaraan-list-table');
    if (kendaraanTable) {
        kendaraanTable.addEventListener('click', async (e) => {
            const editBtn = e.target.closest('.btn-edit');
            const deleteBtn = e.target.closest('.btn-delete');
            const row = e.target.closest('tr[data-booking-id]');
            
            if (!row) return;
            
            if (editBtn) {
                const bookingId = row.dataset.bookingId;
                try {
                    const response = await fetch(`${API_BASE}/api/bookings/by-code/${bookingId}`, { credentials: 'include' });
                    const booking = await response.json();
                    openKendaraanModal(booking);
                } catch (error) {
                    alert('Gagal memuat data: ' + error.message);
                }
            } else if (deleteBtn) {
                const bookingId = row.dataset.bookingId;
                if (confirm('Hapus peminjaman ini?')) {
                    try {
                        await fetch(`${API_BASE}/api/bookings/${bookingId}`, { method: 'DELETE', credentials: 'include' });
                        alert('Peminjaman berhasil dihapus.');
                        window.initializeApp?.();
                    } catch (error) {
                        alert('Gagal menghapus: ' + error.message);
                    }
                }
            }
        });
    }
    
    // Driver List Table
    const driverTable = document.getElementById('driver-list-table');
    if (driverTable) {
        driverTable.addEventListener('click', async (e) => {
            const editBtn = e.target.closest('.btn-edit');
            const deleteBtn = e.target.closest('.btn-delete');
            const row = e.target.closest('tr[data-driver-id]');
            
            if (!row) return;
            
            if (editBtn) {
                const driverId = row.dataset.driverId;
                try {
                    const response = await fetch(`${API_BASE}/api/drivers/${driverId}`, { credentials: 'include' });
                    const driver = await response.json();
                    openDriverModal(driver);
                } catch (error) {
                    alert('Gagal memuat data: ' + error.message);
                }
            } else if (deleteBtn) {
                const driverId = row.dataset.driverId;
                if (confirm('Hapus supir ini?')) {
                    try {
                        await fetch(`${API_BASE}/api/drivers/${driverId}`, { method: 'DELETE', credentials: 'include' });
                        alert('Supir berhasil dihapus.');
                        window.initializeApp?.();
                    } catch (error) {
                        alert('Gagal menghapus: ' + error.message);
                    }
                }
            }
        });
    }
    
    // Master Asset Table
    const masterTable = document.getElementById('master-asset-table');
    if (masterTable) {
        masterTable.addEventListener('click', async (e) => {
            const editBtn = e.target.closest('.btn-edit');
            const deleteBtn = e.target.closest('.btn-delete');
            const row = e.target.closest('tr[data-asset-id]');
            
            if (!row) return;
            
            if (editBtn) {
                const assetId = row.dataset.assetId;
                try {
                    const response = await fetch(`${API_BASE}/api/assets/${assetId}`, { credentials: 'include' });
                    const asset = await response.json();
                    openAssetModal(asset);
                } catch (error) {
                    alert('Gagal memuat data: ' + error.message);
                }
            } else if (deleteBtn) {
                const assetId = row.dataset.assetId;
                if (confirm('Hapus aset ini?')) {
                    try {
                        await fetch(`${API_BASE}/api/assets/${assetId}`, { method: 'DELETE', credentials: 'include' });
                        alert('Aset berhasil dihapus.');
                        window.initializeApp?.();
                    } catch (error) {
                        alert('Gagal menghapus: ' + error.message);
                    }
                }
            }
        });
    }
}

// Setup Modal Close Buttons
function setupModalCloseHandlers() {
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
        const closeBtn = modal.querySelector('.modal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
            });
        }
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });
}

// Setup Add Buttons
function setupAddButtonHandlers() {
    const btnAddGedung = document.getElementById('btn-add-gedung');
    if (btnAddGedung) {
        btnAddGedung.addEventListener('click', () => openGedungModal());
    }
    
    const btnAddKendaraan = document.getElementById('btn-add-kendaraan');
    if (btnAddKendaraan) {
        btnAddKendaraan.addEventListener('click', () => openKendaraanModal());
    }
    
    const btnAddDriver = document.getElementById('btn-add-driver');
    if (btnAddDriver) {
        btnAddDriver.addEventListener('click', () => openDriverModal());
    }
    
    const btnAddAsset = document.getElementById('btn-add-asset');
    if (btnAddAsset) {
        btnAddAsset.addEventListener('click', () => openAssetModal());
    }
}

// Setup Asset Type Change Handler
function setupAssetTypeChangeHandler() {
    const assetTypeSelect = document.getElementById('asset-tipe');
    if (assetTypeSelect) {
        assetTypeSelect.addEventListener('change', (e) => {
            updateAssetNumVisibility(e.target.value);
        });
    }
}

// Setup User Form for Admin Type
function setupUserAdminTypeHandlers() {
    const adminTypeRadios = document.querySelectorAll('input[name="user-admin-type"]');
    const managedAssetsWrapper = document.getElementById('user-managed-assets-wrapper');
    
    adminTypeRadios.forEach(radio => {
        radio.addEventListener('change', async (e) => {
            if (e.target.value === 'khusus') {
                managedAssetsWrapper?.classList.remove('hidden');
                // Populate assets
                try {
                    const response = await fetch(`${API_BASE}/api/assets`, { credentials: 'include' });
                    const assets = await response.json();
                    const container = document.getElementById('user-managed-assets');
                    if (container && assets && assets.length > 0) {
                        container.innerHTML = assets.map(asset => `
                            <label class="flex items-center">
                                <input type="checkbox" class="mr-2" value="${asset.kode}" name="managed-asset">
                                <span>${asset.kode} - ${asset.nama}</span>
                            </label>
                        `).join('');
                    }
                } catch (error) {
                    console.error('Gagal memuat aset:', error);
                }
            } else {
                managedAssetsWrapper?.classList.add('hidden');
            }
        });
    });
}

// Load and render admins list
async function loadAdminsList() {
    try {
        const response = await fetch(`${API_BASE}/auth/admins`, { credentials: 'include' });
        const data = await response.json();
        const admins = data.admins || [];
        
        const tableBody = document.getElementById('users-list-table');
        if (!tableBody) return;
        
        if (admins.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">Belum ada admin.</td></tr>';
            return;
        }
        
        tableBody.innerHTML = admins.map(admin => `
            <tr class="table-row" data-admin-id="${admin._id}">
                <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-700 font-mono">${admin.username}</td>
                <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">${admin.name}</td>
                <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-700">${admin.email}</td>
                <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-700">${admin.phone || '-'}</td>
                <td class="px-6 py-3 whitespace-nowrap text-sm">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${admin.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}">
                        ${admin.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                </td>
                <td class="px-6 py-3 text-right text-sm">
                    <button class="btn-edit" data-id="${admin._id}" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" data-id="${admin._id}" title="Hapus"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Gagal memuat admin:', error);
    }
}

// Setup admin table event delegation
function setupAdminTableEvents() {
    const tableBody = document.getElementById('users-list-table');
    if (!tableBody) return;
    
    tableBody.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.btn-edit');
        const deleteBtn = e.target.closest('.btn-delete');
        const row = e.target.closest('tr[data-admin-id]');
        
        if (!row) return;
        
        if (editBtn) {
            const adminId = editBtn.dataset.id;
            try {
                const response = await fetch(`${API_BASE}/auth/admin/${adminId}`, { credentials: 'include' });
                const data = await response.json();
                const admin = data.admin || data;
                
                document.getElementById('user-id').value = admin._id;
                document.getElementById('user-username').value = admin.username;
                document.getElementById('user-name').value = admin.name;
                document.getElementById('user-email').value = admin.email;
                document.getElementById('user-phone').value = admin.phone || '';
                
                const adminType = admin.adminType || 'umum';
                document.getElementById('user-admin-umum').checked = adminType === 'umum';
                document.getElementById('user-admin-khusus').checked = adminType === 'khusus';
                
                if (adminType === 'khusus') {
                    document.getElementById('user-managed-assets-wrapper').classList.remove('hidden');
                    // Populate assets and check managed ones
                    const assetsResponse = await fetch(`${API_BASE}/api/assets`, { credentials: 'include' });
                    const assets = await assetsResponse.json();
                    const container = document.getElementById('user-managed-assets');
                    if (container) {
                        container.innerHTML = assets.map(asset => {
                            const isManaged = (admin.managedAssetCodes || []).includes(asset.kode);
                            return `
                                <label class="flex items-center">
                                    <input type="checkbox" class="mr-2" value="${asset.kode}" name="managed-asset" ${isManaged ? 'checked' : ''}>
                                    <span>${asset.kode} - ${asset.nama}</span>
                                </label>
                            `;
                        }).join('');
                    }
                } else {
                    document.getElementById('user-managed-assets-wrapper').classList.add('hidden');
                }
                
                document.getElementById('user-form-title').textContent = 'Edit Admin';
                document.getElementById('generated-password-display').classList.add('hidden');
                document.getElementById('modal-user-form').classList.remove('hidden');
            } catch (error) {
                alert('Gagal memuat data admin: ' + error.message);
            }
        } else if (deleteBtn) {
            const adminId = deleteBtn.dataset.id;
            if (confirm('Hapus admin ini?')) {
                try {
                    const response = await fetch(`${API_BASE}/auth/admin/${adminId}`, { 
                        method: 'DELETE', 
                        credentials: 'include' 
                    });
                    
                    if (response.ok) {
                        alert('Admin berhasil dihapus');
                        loadAdminsList();
                    } else {
                        const error = await response.json();
                        alert('Gagal menghapus: ' + (error.message || 'Error'));
                    }
                } catch (error) {
                    alert('Gagal menghapus admin: ' + error.message);
                }
            }
        }
    });
}

// Initialize admin functionality
function setupAdminManagement() {
    // Load admins list on page load if user is superadmin
    fetch(`${API_BASE}/auth/me`, { credentials: 'include' })
        .then(r => r.json())
        .then(user => {
            if (user.role === 'superadmin') {
                loadAdminsList();
                setupAdminTableEvents();
            }
        })
        .catch(err => console.error('Error loading admin data:', err));
}

// Initialize all modal/form functionality
function initializeModalFunctionality() {
    setupFormSubmitHandlers();
    setupTableEventDelegation();
    setupModalCloseHandlers();
    setupAddButtonHandlers();
    setupAssetTypeChangeHandler();
    setupUserAdminTypeHandlers();
    setupAdminManagement();
}

// Call initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeModalFunctionality);
} else {
    initializeModalFunctionality();
}

// Expose functions globally for inline onclick handlers if needed
window.openGedungModal = openGedungModal;
window.openKendaraanModal = openKendaraanModal;
window.openDriverModal = openDriverModal;
window.openAssetModal = openAssetModal;
