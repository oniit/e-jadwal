// Authentication and Profile Management
const API_BASE = window.location.origin;

// Check authentication
export async function checkAuth() {
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
        
        // Store user role globally for later use
        window.__adminUserRole = user.role;
        
        // Show admin tab only for superadmin
        if (user.role === 'superadmin') {
            const usersTab = document.getElementById('admin-tab-users');
            if (usersTab) {
                usersTab.classList.remove('hidden');
            }
        }
        
        // Hide tabs for supir - only show kendaraan
        if (user.role === 'supir') {
            const tabContainer = document.querySelector('.flex.space-x-1.p-1.rounded-xl.bg-gray-100');
            if (tabContainer) {
                tabContainer.classList.add('hidden');
            }
            
            // Hide all content except kendaraan
            document.querySelectorAll('[id^="admin-content-"]').forEach(div => {
                div.classList.add('hidden');
            });
            
            // Show only kendaraan content
            const kendaraanContent = document.getElementById('admin-content-kendaraan');
            if (kendaraanContent) {
                kendaraanContent.classList.remove('hidden');
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
            
            // Filter managedAssetCodes to only show gedung assets
            if (user.managedAssetCodes && Array.isArray(user.managedAssetCodes)) {
                window.__adminKhususGedungOnly = user.managedAssetCodes.filter(code => code.startsWith('GD'));
            }
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

// Setup logout
export function setupLogout() {
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
export function setupModalHandlers() {
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
                
                // Hide status field - only visible when superadmin edits other users
                const statusWrapper = document.getElementById('profile-status-wrapper');
                if (statusWrapper) {
                    statusWrapper.classList.add('hidden');
                }
                
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
export function setupProfileForm() {
    const profileForm = document.getElementById('form-profile');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('profile-name').value;
            const email = document.getElementById('profile-email').value;
            const phone = document.getElementById('profile-phone').value;
            const currentPassword = document.getElementById('profile-current-password').value;
            const newPassword = document.getElementById('profile-new-password').value;
            const statusField = document.getElementById('profile-status');
            
            try {
                const updateData = { name, email, phone };
                
                // Include isActive if status field is visible
                if (statusField && !document.getElementById('profile-status-wrapper').classList.contains('hidden')) {
                    updateData.isActive = statusField.value === 'true';
                }
                
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
            
            // Hide status field for new user
            const userStatusWrapper = document.getElementById('user-status-wrapper');
            if (userStatusWrapper) {
                userStatusWrapper.classList.add('hidden');
            }
            
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
        
        // Include isActive if status field is visible (editing existing user)
        const userStatusWrapper = document.getElementById('user-status-wrapper');
        const userStatusField = document.getElementById('user-status');
        if (userId && userStatusWrapper && !userStatusWrapper.classList.contains('hidden') && userStatusField) {
            payload.isActive = userStatusField.value === 'true';
        }
        
        // Collect checked assets for admin khusus
        if (payload.adminType === 'khusus') {
            const checkedAssets = document.querySelectorAll('input[name="managed-asset"]:checked');
            payload.managedAssetCodes = Array.from(checkedAssets).map(cb => cb.value);
        }
        
        if (!payload.username || !payload.name || !payload.email) {
            alert('Username, name, dan email wajib diisi');
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

// Load and render admins list
export async function loadAdminsList() {
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
                    <div class="flex justify-end gap-3">
                        <button class="btn-edit" data-id="${admin._id}" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="btn-delete" data-id="${admin._id}" title="Hapus"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Gagal memuat admin:', error);
    }
}

// Setup admin table event delegation
export function setupAdminTableEvents() {
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
                
                // Show status field for editing
                const userStatusWrapper = document.getElementById('user-status-wrapper');
                const userStatusField = document.getElementById('user-status');
                if (userStatusWrapper && userStatusField) {
                    userStatusWrapper.classList.remove('hidden');
                    userStatusField.value = admin.isActive ? 'true' : 'false';
                }
                
                if (adminType === 'khusus') {
                    document.getElementById('user-managed-assets-wrapper').classList.remove('hidden');
                    // Admin khusus hanya untuk gedung
                    const assetsResponse = await fetch(`${API_BASE}/api/assets`, { credentials: 'include' });
                    const assetsData = await assetsResponse.json();
                    const assets = assetsData.gedung || [];
                    const container = document.getElementById('user-managed-assets');
                    if (container) {
                        container.innerHTML = assets.map(asset => {
                            const isManaged = (admin.managedAssetCodes || []).includes(asset.code);
                            return `
                                <label class="flex items-center">
                                    <input type="checkbox" class="mr-2" value="${asset.code}" name="managed-asset" ${isManaged ? 'checked' : ''}>
                                    <span>${asset.code} - ${asset.name}</span>
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

// Setup User Form for Admin Type
export function setupUserAdminTypeHandlers() {
    const adminTypeRadios = document.querySelectorAll('input[name="user-admin-type"]');
    const managedAssetsWrapper = document.getElementById('user-managed-assets-wrapper');
    
    adminTypeRadios.forEach(radio => {
        radio.addEventListener('change', async (e) => {
            if (e.target.value === 'khusus') {
                managedAssetsWrapper?.classList.remove('hidden');
                // Populate assets
                try {
                    const response = await fetch(`${API_BASE}/api/assets`, { credentials: 'include' });
                    const assetsData = await response.json();
                    // Admin khusus hanya untuk gedung
                    const assets = assetsData.gedung || [];
                    const container = document.getElementById('user-managed-assets');
                    if (container && assets && assets.length > 0) {
                        container.innerHTML = assets.map(asset => `
                            <label class="flex items-center">
                                <input type="checkbox" class="mr-2" value="${asset.code}" name="managed-asset">
                                <span>${asset.code} - ${asset.name}</span>
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

// Initialize admin functionality
export function setupAdminManagement() {
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
