

import { AppState } from './state.js';
import { UI } from './ui.js';
import { STATUS_MAP } from './constants.js';
import { debounce } from './utils.js';
import {
  formValidation,
  resetFormState,
  setBudget,
  showPriceHistory,
  updateItem
} from './modal.js';
import {
  getFilteredWishlist,
  renderWishlist,
  updateBulkUI,
  updateSortIcons
} from './table.js';
import { renderSummaryCards } from './summary.js';
import { updateWishlist } from './wishlist.js';
import { renderPriorityChart } from './charts.js';
import { fetchExchangeRates, updateRateUI } from './rates.js';
import { exportCSV, exportJSON, importFile } from './exportImport.js';
import { showConfirm } from './confirmModal.js';

const toggleAnalytics = () => {
  if (!UI.analytics.container) return;

  const isHidden = UI.analytics.container.hidden;
  UI.analytics.container.hidden = !isHidden;

  localStorage.setItem('wishlist_analytics_hidden', (!isHidden).toString());

  if (isHidden && AppState.priorityChart) {
    setTimeout(() => {
      AppState.priorityChart.resize();
    }, 50);
  }
}

const initAnalyticsState = () => {
  if (!UI.analytics.container) return;

  const savedState = localStorage.getItem('wishlist_analytics_hidden');

  if (savedState === null) {
    UI.analytics.container.hidden = true;
  } else {
    UI.analytics.container.hidden = savedState === 'true';
  }
};

const updateThemeUI = (theme) => {
  if (theme === 'dark') {
    UI.themeToggleBtn.textContent = '☀️ Toggle Light Mode'
  } else {
    UI.themeToggleBtn.textContent = '🌙 Toggle Dark Mode'
  }
}

const initTheme = () => {
  const systemTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  const currentTheme = localStorage.getItem('wishlist_theme') || systemTheme;
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeUI(currentTheme);
}

const toggleTheme = () => {
  let currentTheme = document.documentElement.getAttribute('data-theme');
  if (!currentTheme) return;
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('wishlist_theme', currentTheme);
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeUI(currentTheme);
}



UI.form.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const formEntries = Object.fromEntries(formData);
  if (!formValidation(formEntries)) return;

  if (AppState.editId) {
    AppState.wishlist = AppState.wishlist.map(oldItem => { 
      if (oldItem.id !== AppState.editId) {
        return oldItem;
      }

      const isPriceChanged = oldItem.price !== formEntries.price || oldItem.currency !== formEntries.currency;
      const history = [...(oldItem.priceHistory || [])];

      if (isPriceChanged) {
        history.push({
          price: formEntries.price,
          currency: formEntries.currency,
          date: new Date().toISOString().slice(0, 10)
        });
      }

      return {
        ...oldItem,
        ...formEntries,
        priceHistory: history
      };
    });
  } else {
    AppState.wishlist.push({
      id: crypto.randomUUID(), 
      initialPrice: formEntries.price,
      createdAt: new Date().toISOString().slice(0, 10),
      priceHistory: [
        { 
          price: formEntries.price, 
          currency: formEntries.currency, 
          date: new Date().toISOString().slice(0, 10) 
        }
      ],
      ...formEntries
    });
  }
  
  updateWishlist(AppState.wishlist);
  resetFormState();

  UI.modal.close();
});

UI.form.addEventListener('input', (event) => {
  const target = event.target;
  if (target.classList.contains('input-error')) {
    target.classList.remove('input-error');
    const errorSpan = target.parentElement.querySelector('.error-text');
    if (errorSpan) errorSpan.remove();
  }
});

UI.form.elements.cancelBtn.addEventListener('click', () => { resetFormState(); UI.tableBody.scrollIntoView({ block: "center" }); UI.modal.close() });

UI.tableBody.addEventListener('click', async (event) => {
  const deleteBtn = event.target.closest('.btn-delete');
  const editBtn = event.target.closest('.btn-edit');
  const historyBtn = event.target.closest('.btn-history');

  if (deleteBtn) { 
    const isConfirmed = await showConfirm({
      message: 'Are you sure you want to delete this item?', 
      targetElement: deleteBtn
    });

    if (isConfirmed) { 
      const id = deleteBtn.dataset.id;
      updateWishlist(AppState.wishlist.filter(item => item.id !== id));
      AppState.selectedIds.delete(id);
      updateBulkUI();
    }
  }
  if (editBtn) { updateItem(event.target.dataset.id); UI.form.scrollIntoView({ block: "center" }) }
  if (historyBtn) { showPriceHistory(historyBtn.dataset.id) }
});

UI.tableBody.addEventListener('change', (event) => {
  const checkbox = event.target.closest('input[type="checkbox"]');

  if (checkbox) { 
    const id = event.target.dataset.id;
    const checkedStatus = event.target.checked;
    checkedStatus === true ? AppState.selectedIds.add(id) : AppState.selectedIds.delete(id);
    updateBulkUI();
  }
});

UI.filters.search.addEventListener('input', debounce((event) => {
  AppState.filters.search = event.target.value.toLowerCase();
  renderWishlist();
}));

UI.filters.status.addEventListener('change', (event) => {
  AppState.filters.status = event.target.value;
  renderWishlist();
});

UI.filters.priority.addEventListener('change', (event) => {
  AppState.filters.priority = event.target.value;
  renderWishlist();
});

UI.exportImport.jsonBtn.addEventListener('click', () => exportJSON());

UI.exportImport.csvBtn.addEventListener('click', () => exportCSV());

UI.exportImport.importBtn.addEventListener('click', (event) => UI.exportImport.fileInput.click());

UI.exportImport.fileInput.addEventListener('change', (event) => importFile(event));

UI.rates.editBtn?.addEventListener('click', () => {
  UI.rates.dialog.showModal();

  Object.entries(AppState.rates).forEach( ([key, value]) => {
    if (UI.rates.form.elements[key]) {
      UI.rates.form.elements[key].value = value || "";
    }
  });
});

UI.rates.form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const rawEntries = Object.fromEntries(formData);
    const formEntries = Object.fromEntries(
      Object.entries(rawEntries).map(([key, value]) => [key, Number(value) || 0])
    );
    console.log(formEntries);

    AppState.rates = {
      ...AppState.rates,
      ...formEntries
    };

    localStorage.setItem('wishlist_exchange_rates', JSON.stringify({
      rates: AppState.rates,
      timestamp: Date.now(),
      isManual: true
    }));

    updateRateUI(false, 'Manually Set');
    updateWishlist(AppState.wishlist);
  });

UI.modal.addEventListener('close', () => {
  resetFormState();
});

UI.budget.form.addEventListener('submit', (event) => {
  event.preventDefault();
  setBudget(event);
  UI.budget.modal.close();
});

UI.analytics.toggleBtn?.addEventListener('click', toggleAnalytics);

UI.tableHeader.addEventListener('click', (event) => {
  const th = event.target.closest('th');
  if (!th || !th.dataset.sort) return; // Geçersiz veya data-sort olmayan başlıkları engelle

  if (AppState.sort.key === th.dataset.sort) {
    AppState.sort.order = AppState.sort.order === 'asc' ? 'desc' : 'asc';
  } else {
    AppState.sort.key = th.dataset.sort;
    AppState.sort.order = 'asc';
  }

  renderWishlist();
});

UI.themeToggleBtn.addEventListener('click', toggleTheme);

UI.priceHistory.closeBtn?.addEventListener('click', () => UI.priceHistory.modal.close());

UI.tableBody.addEventListener("dblclick", (event) => {
  const statusTrigger = event.target.closest('.status-cell');
  if (!statusTrigger) return;

  const wishlistID = statusTrigger.dataset.id;
  const oldHTML = statusTrigger.innerHTML;
  const selected = statusTrigger.dataset.selected;

  // STATUS HTML
  const statusElement = document.createElement('select');
  statusElement.innerHTML = Object.keys(STATUS_MAP).map((key) => {
    return key === selected ? (`<option value="${key}" selected>${STATUS_MAP[key]}</option>`) : (`<option value="${key}">${STATUS_MAP[key]}</option>`)
  }).join('');

  statusElement.addEventListener('change', (event) => {
    const targetWishlistItem = AppState.wishlist.find(item => item.id === wishlistID);
    if (!targetWishlistItem) return;

    targetWishlistItem.status = event.target.value;
    if (targetWishlistItem.status === 'purchased' && !targetWishlistItem.purchaseDate) {
      targetWishlistItem.purchaseDate = new Date().toISOString().slice(0, 10);
    }
    

    updateWishlist(AppState.wishlist);
  });

  statusElement.addEventListener('blur', () => {
    renderWishlist();
  });

  statusTrigger.innerHTML = "";
  statusTrigger.appendChild(statusElement);
  statusElement.focus();
  statusElement.showPicker();
});

document.addEventListener('keydown', (event) => {
  if (event.key === '/' && event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
    event.preventDefault();
    UI.filters.search.focus();
  }

  if ((event.ctrlKey || event.metaKey) &&  event.key.toLowerCase() == 'k') {
    event.preventDefault();
    if (UI.modal.open) {
      UI.modal.close();
    } else {
      UI.modal.showModal();
    }
  }
});

const clearDropIndicators = () => {
  UI.tableBody.querySelectorAll('.drop-target-above, .drop-target-below').forEach(row => {
    row.classList.remove('drop-target-above', 'drop-target-below');
  });
};

UI.tableBody.addEventListener('dragstart', (event) => {
  const handle = event.target.closest('.drag-handle');
  if (!handle) {
    event.preventDefault();
    return;
  }

  const targetRow = handle.closest('tr[data-wishlist-id]');
  if (!targetRow) return;

  const isFiltered = AppState.filters.search !== '' || AppState.filters.status !== 'all' || AppState.filters.priority !== 'all';
  if (isFiltered) {
    event.preventDefault();
    return;
  }

  AppState.draggedId = targetRow.dataset.wishlistId;
  targetRow.classList.add('dragging');

  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', AppState.draggedId);
    event.dataTransfer.effectAllowed = 'move';
  }
});

UI.tableBody.addEventListener('dragover', (event) => {
  event.preventDefault();

  const targetRow = event.target.closest('tr[data-wishlist-id]');
  if (!targetRow || targetRow.classList.contains('dragging')) return;

  clearDropIndicators();

  const rect = targetRow.getBoundingClientRect();
  const isAbove = (event.clientY - rect.top) < (rect.height / 2);

  if (isAbove) {
    targetRow.classList.add('drop-target-above');
  } else {
    targetRow.classList.add('drop-target-below');
  }
});

UI.tableBody.addEventListener('drop', (event) => {
  event.preventDefault();

  const targetRow = event.target.closest('tr[data-wishlist-id]');
  if (!targetRow) {
    clearDropIndicators();
    return;
  }

  const targetId = targetRow.dataset.wishlistId;
  if (!targetId || targetId === AppState.draggedId) {
    clearDropIndicators();
    return;
  }

  // Çizgileri silmeden önce alt yarıda mı kontrol et
  const isBelow = targetRow.classList.contains('drop-target-below');
  clearDropIndicators();

  if (typeof AppState.sort !== 'undefined') {
    AppState.sort.key = null;
  }

  const toIndex = AppState.wishlist.findIndex(item => item.id === targetId);
  const fromIndex = AppState.wishlist.findIndex(item => item.id === AppState.draggedId);

  const reorderedWishlist = [...AppState.wishlist];
  const [movedItem] = reorderedWishlist.splice(fromIndex, 1);

  let insertIndex = toIndex + (isBelow ? 1 : 0);
  if (fromIndex < insertIndex) {
    insertIndex--;
  }

  reorderedWishlist.splice(insertIndex, 0, movedItem);
  updateWishlist(reorderedWishlist);
  updateSortIcons();
});

UI.tableBody.addEventListener('dragend', () => {
  const draggingRow = UI.tableBody.querySelector('.dragging');
  if (draggingRow) draggingRow.classList.remove('dragging');
  AppState.draggedId = null;
  clearDropIndicators();
});

UI.tableBody.addEventListener('dragleave', (event) => { 
  if (!UI.tableBody.contains(event.relatedTarget)) clearDropIndicators(); 
});

UI.bulk.deleteBtn.addEventListener('click', async () => {
  const count = AppState.selectedIds.size;
  if (count === 0) return;

  const isConfirmed = await showConfirm({
    message: `Are you sure you want to delete ${count} ${count > 1 ? 'items' : 'item'}?`,
    targetElement: UI.bulk.deleteBtn
  });

  if (isConfirmed) {
    updateWishlist(AppState.wishlist.filter(item => !AppState.selectedIds.has(item.id)));
    AppState.selectedIds.clear();
    updateBulkUI();
  }
});

UI.bulk.cancelBtn.addEventListener('click', () => {
  if (AppState.selectedIds.size === 0) return;

  AppState.selectedIds.clear();
  updateBulkUI();
  renderWishlist();
});

UI.bulk.selectAllCheckbox.addEventListener('change', () => {
  const isChecked = UI.bulk.selectAllCheckbox.checked;
  const currentItems = getFilteredWishlist();
  
  if (isChecked) {
    currentItems.forEach(item => AppState.selectedIds.add(item.id));
  } else {
    currentItems.forEach(item => AppState.selectedIds.delete(item.id));
  }

  updateBulkUI();
  renderWishlist();
});

UI.bulk.statusSelect.addEventListener('change', (event) => {
  const count = AppState.selectedIds.size;
  if (count === 0) return;

  const newStatus = event.target.value;
  if (!newStatus) return;

  AppState.wishlist = AppState.wishlist.map(item => { 
    if (!AppState.selectedIds.has(item.id)) {
      return item;
    }

    const purchaseDate = (newStatus === 'purchased' && !item.purchaseDate)
      ? new Date().toISOString().slice(0, 10)
      : item.purchaseDate;

    return {
      ...item,
      status: newStatus,
      purchaseDate: purchaseDate
    }
  });
  
  event.target.value = '';
  AppState.selectedIds.clear();
  updateBulkUI();
  updateWishlist(AppState.wishlist);
});

window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initAnalyticsState();
  renderWishlist();
  renderSummaryCards();
  updateBulkUI();

  fetchExchangeRates();
  renderPriorityChart();
});