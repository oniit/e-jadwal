// Helper utility functions

// Setup tab switching
export function setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const userRole = window.__adminUserRole;
    
    tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Supir users cannot switch tabs
            if (userRole === 'supir') {
                e.preventDefault();
                return;
            }
            
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
    
    // For supir: show kendaraan and hide everything else
    if (userRole === 'supir') {
        document.querySelectorAll('[id^="admin-content-"]').forEach(div => {
            div.classList.add('hidden');
        });
        const kendaraanContent = document.getElementById('admin-content-kendaraan');
        if (kendaraanContent) {
            kendaraanContent.classList.remove('hidden');
        }
    } else {
        // Default tab for admin users: request
        const requestTab = document.getElementById('admin-tab-request');
        if (requestTab && !requestTab.classList.contains('hidden')) {
            requestTab.click();
        }
    }
}

// Helper to safely format date for input[type=date]
export function formatDateForInput(dateStr) {
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    } catch (e) {
        console.error('Error formatting date:', dateStr, e);
        return '';
    }
}

export function getAdminState() {
    return window.__adminState || null;
}
