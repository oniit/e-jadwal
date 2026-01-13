# Refactored Admin Script Structure

File `script-admin.js` (2496 baris) telah dipecah menjadi struktur modular untuk kemudahan maintenance.

## Struktur File Baru

```
public/
  js/
    admin/
      main.js              # Entry point utama, mengintegrasikan semua modul
      auth.js              # Autentikasi, profil, dan user management
      api.js               # API helper functions
      ui.js                # Rendering UI (tabel, list, modals)
      filters.js           # Filter management (gedung, kendaraan, request, driver, asset)
      table-sort.js        # Table sorting functionality
      events.js            # Event handlers (form submit, table delegation, buttons)
      modals.js            # Modal HTML rendering dan select population
      requests.js          # Request handling (approve, reject, detail)
      forms/
        gedung.js          # Gedung form logic + barang management
        kendaraan.js       # Kendaraan form logic
        driver.js          # Driver form logic
        asset.js           # Asset form logic
    utils/
      helpers.js           # Helper utilities (tab switching, date format, state getter)
```

## File Breakdown

### Main Modules

- **main.js** (~120 baris)
  - Entry point yang mengintegrasikan semua modul
  - Inisialisasi app dan state management
  - Global function exports

- **auth.js** (~390 baris)
  - `checkAuth()` - Validasi autentikasi user
  - `setupLogout()` - Logout handler
  - `setupModalHandlers()` - Profile modal
  - `setupProfileForm()` - Update profil
  - `loadAdminsList()` - List admin users (superadmin)
  - `setupAdminTableEvents()` - CRUD admin users

- **api.js** (~30 baris)
  - Centralized API fetch functions
  - Error handling
  - All backend endpoints

- **ui.js** (~260 baris)
  - `renderBookingList()` - Render gedung/kendaraan table
  - `renderRequestList()` - Render request table
  - `renderDriverList()` - Render driver table
  - `renderMasterTable()` - Render asset table
  - `showDetailModal()` - Booking detail modal
  - Date/time formatting utilities

- **filters.js** (~240 baris)
  - `populateFilterOptions()` - Populate filter dropdowns
  - `setDefaultFilters()` - Set default filter values
  - `applyAdminFilters()` - Apply gedung/kendaraan filters
  - `applyRequestFilters()` - Apply request filters
  - `applyDriverFilters()` - Apply driver filters
  - `applyMasterFilters()` - Apply asset filters
  - `filterData()` - Core filter logic

- **table-sort.js** (~220 baris)
  - `initTableSorting()` - Initialize sortable headers
  - `sortTable()` - Sort table by column
  - `parseIndonesianDate()` - Parse Indonesian date format

- **events.js** (~480 baris)
  - `setupFormSubmitHandlers()` - All form submissions (gedung, kendaraan, driver, asset)
  - `setupTableEventDelegation()` - Table click events (edit, delete, view)
  - `setupModalCloseHandlers()` - Modal close handlers
  - `setupAddButtonHandlers()` - Add button handlers

- **modals.js** (~130 baris)
  - `renderForms()` - Generate form HTML dynamically
  - `populateFormSelectOptions()` - Populate selects (gedung, kendaraan, driver, barang)

- **requests.js** (~180 baris)
  - `handleApproveRequest()` - Approve request + create booking
  - `handleRejectRequest()` - Reject request with reason
  - `showRequestDetail()` - Display request detail modal with actions

### Form Modules

- **forms/gedung.js** (~240 baris)
  - Gedung form management
  - Barang availability calculation
  - Barang chips UI management
  - `openGedungModal()` - Open gedung modal for add/edit

- **forms/kendaraan.js** (~30 baris)
  - `openKendaraanModal()` - Open kendaraan modal for add/edit

- **forms/driver.js** (~40 baris)
  - `openDriverModal()` - Open driver modal for add/edit

- **forms/asset.js** (~50 baris)
  - `openAssetModal()` - Open asset modal for add/edit
  - `updateAssetNumVisibility()` - Show/hide num field based on type

### Utilities

- **utils/helpers.js** (~35 baris)
  - `setupTabSwitching()` - Tab navigation
  - `formatDateForInput()` - Format date for input fields
  - `getAdminState()` - Get global state

## Perubahan pada admin.html

```html
<!-- OLD -->
<script src="/script-admin.js"></script>

<!-- NEW -->
<script type="module" src="/js/admin/main.js"></script>
```

## Benefits

✅ **Maintainability**: Setiap file fokus pada satu tanggung jawab
✅ **Readability**: Lebih mudah menemukan dan membaca kode
✅ **Testability**: Mudah untuk unit testing
✅ **Collaboration**: Tim bisa bekerja di file berbeda tanpa conflict
✅ **Scalability**: Mudah menambah fitur baru

## Backup

File original disimpan sebagai: `public/script-admin.js.backup`

## Testing

Pastikan semua fungsi bekerja normal:
1. ✅ Login & authentication
2. ✅ Tab switching (Request, Gedung, Kendaraan, Driver, Master, Users)
3. ✅ Filter & search untuk semua tab
4. ✅ Table sorting
5. ✅ CRUD operations (Create, Read, Update, Delete)
6. ✅ Request approval/rejection
7. ✅ Gedung barang management
8. ✅ Profile update
9. ✅ Admin user management (superadmin only)

## Migration Notes

**Tidak ada perubahan fungsionalitas** - Hanya refactoring struktur file. Semua logic tetap sama, hanya dipindahkan ke modul yang sesuai.
