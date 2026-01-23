// Table Sorting Functions

export function initTableSorting() {
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
            case 'type': {
                const idx = tableId === 'master-asset-table' ? 2 : 1;
                valueA = rowA.cells[idx].textContent.trim().toLowerCase();
                valueB = rowB.cells[idx].textContent.trim().toLowerCase();
                break;
            }
            case 'plate': {
                const idx = tableId === 'master-asset-table' ? 3 : -1;
                if (idx >= 0) {
                    valueA = rowA.cells[idx].textContent.trim().toLowerCase();
                    valueB = rowB.cells[idx].textContent.trim().toLowerCase();
                }
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
            case 'code': {
                valueA = rowA.cells[0].textContent.trim().toLowerCase();
                valueB = rowB.cells[0].textContent.trim().toLowerCase();
                break;
            }
            case 'name': {
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
                const idx = tableId === 'master-asset-table' ? 5 : 4;
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
