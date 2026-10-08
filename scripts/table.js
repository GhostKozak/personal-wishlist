import { AppState } from './state.js';
import { UI, generateTableRow } from './ui.js';
import { getPriorityInfo, toTRY } from './utils.js';

const getMonthlyPayment = (item) => {
  if (item.status !== "purchased") return 0;
  
  const count = Number(item.installmentCount || 0);
  if (count <= 1) return 0;

  return toTRY(item.price, item.currency) / count;
};

export const updateSortIcons = () => {
  document.querySelectorAll('.table-section table thead th.sortable').forEach(th => {
    const key = th.dataset.sort;
    const icon = th.querySelector('.sort-icon');
    
    // Önceki sınıfları temizle
    th.classList.remove('sort-asc', 'sort-desc');

    if (key === AppState.sort.key) {
      // Aktif sıralanan sütuna uygun class'ı ve oku ver
      th.classList.add(AppState.sort.order === 'asc' ? 'sort-asc' : 'sort-desc');
      if (icon) icon.textContent = AppState.sort.order === 'asc' ? '▲' : '▼';
    } else {
      // Aktif olmayan sütunların okunu nötr tut
      if (icon) icon.textContent = '↕';
    }
  });
};

export const getFilteredWishlist = () => {
  return AppState.wishlist.filter( item => {
    const matchesSearch = item.name.toLowerCase().includes(AppState.filters.search) || (item.note || '').toLowerCase().includes(AppState.filters.search);
    const matchesStatus = AppState.filters.status === 'all' || item.status === AppState.filters.status;
    const itemPriority = getPriorityInfo(item.importance, item.urgency).class;
    const matchesPriority = AppState.filters.priority === 'all' || itemPriority.includes(AppState.filters.priority);

    return matchesSearch && matchesStatus && matchesPriority;
  });
}

export const updateBulkUI = () => {
  const currentItems = getFilteredWishlist();
  const visibleSelectedCount = currentItems.filter(item => AppState.selectedIds.has(item.id)).length;
  const isAllSelected = currentItems.length > 0 && visibleSelectedCount === currentItems.length;

  UI.bulk.selectAllCheckbox.checked = isAllSelected;
  UI.bulk.selectAllCheckbox.indeterminate = visibleSelectedCount > 0 && !isAllSelected;
  UI.bulk.bar.style.display = AppState.selectedIds.size > 0 ? 'flex' : 'none';
  if (AppState.selectedIds.size > 0) {
    UI.bulk.count.textContent = AppState.selectedIds.size;
  }
};

export const renderWishlist = () => {
  const filteredList = getFilteredWishlist();

  const modifier = AppState.sort.order === 'asc' ? 1 : -1;

  const sortedList = [...filteredList].sort((a, b) => {
    let diff = 0;

    switch (AppState.sort.key) {
      case 'name':
        diff = a.name.localeCompare(b.name, 'tr');
        break;
      case 'price':
        diff = toTRY(a.price, a.currency) - toTRY(b.price, b.currency);
        break;
      case 'priority':
        diff = getPriorityInfo(a.importance, a.urgency).score - getPriorityInfo(b.importance, b.urgency).score;
        break;
      case 'createdAt':
        diff = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        break;
      case 'status':
        const STATUS_WEIGHT = { wishlist: 1, researching: 2, purchased: 3, canceled: 4 };
        diff = (STATUS_WEIGHT[a.status] || 99) - (STATUS_WEIGHT[b.status] || 99);
        break;
      case 'payment': {
        const payA = getMonthlyPayment(a);
        const payB = getMonthlyPayment(b);

        const hasA = payA > 0;
        const hasB = payB > 0;

        if (hasA && !hasB) return -1;
        if (!hasA && hasB) return 1;
        if (!hasA && !hasB) return 0;

        return (payA - payB) * modifier;
        }
      default:
        diff = 0;
        break;
    }

    return diff * modifier;
  });

  UI.tableBody.innerHTML = sortedList.map(generateTableRow).join('');
  updateSortIcons();
  updateBulkUI();
}