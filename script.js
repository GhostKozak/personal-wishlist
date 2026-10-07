/**
 * @typedef {Object} WishlistItem
 * @property {string} id - Crypto UUID
 * @property {string} name - Ürün adı
 * @property {string} [link] - Ürün linki
 * @property {string} [altLink] - Alt. Ürün linki
 * @property {string} price - Ürün fiyatı
 * @property {string} currency
 * @property {string} initialPrice - İlk Eklendiği Fiyat
 * @property {Object} priceHistory
 * @property {string} createdAt - Eklenme Tarih
 * @property {'important' | 'not-important'} importance - Öncelik durumu
 * @property {'urgent' | 'not-urgent'} urgency - Aciliyet durumu
 * @property {string} [status]
 * @property {date} [purchaseDate]
 * @property {string} [installmentCount] - Taksit sayısı
 * @property {string} [note]
 */


const UI = {
  form: document.getElementById('wishlist-form'),
  tableBody: document.getElementById('wishlist-view'),
  tableHeader: document.querySelector('.table-section table thead'),
  modal: document.getElementById('newItemModal'),
  themeToggleBtn: document.getElementById('btn-theme-toggle'),

  filters: {
    search: document.getElementById('search-input'),
    status: document.getElementById('filter-status'),
    priority: document.getElementById('filter-priority'),
  },

  summary: {
    totalPrice: document.getElementById('total-price'),
    monthlyInstallment: document.getElementById('monthly-installment'),
    installmentCount: document.getElementById('installment-count'),
  },

  exportImport: {
    jsonBtn: document.getElementById('btn-export-json'),
    csvBtn: document.getElementById('btn-export-csv'),
    importBtn: document.getElementById('btn-import-trigger'),
    fileInput: document.getElementById('file-import'),
  },

  rates: {
    usd: document.getElementById('rate-usd'),
    eur: document.getElementById('rate-eur'),
    statusBadge: document.getElementById('rate-status-badge'),
    lastUpdated: document.getElementById('rate-last-updated'),
    editBtn: document.getElementById('btn-edit-rates'),
    dialog: document.getElementById('ratesModal'),
    get form() {
      return this.dialog?.querySelector('form');
    },
  },

  budget: {
    limitText: document.getElementById('budget-limit-text'),
    statusText: document.getElementById('budget-status-text'),
    progressBar: document.getElementById('budget-progress-bar'),
    editBtn: document.querySelector('.budget-card .btn-edit-budget'),
    modal: document.getElementById('budgetModal'),
    get form() {
      return this.modal?.querySelector('form');
    },
  },

  priceHistory: {
    modal: document.getElementById('priceHistoryModal'),
    title: document.getElementById('history-modal-title'),
    summary: document.getElementById('history-summary'),
    list: document.getElementById('history-list'),
    closeBtn: document.getElementById('btn-close-history'),
  },

  analytics: {
    container: document.querySelector('.analytics-container'),
    toggleBtn: document.getElementById('btn-toggle-analytics'),
  },

  bulk: {
    bar: document.getElementById('bulk-action-bar'),
    count: document.getElementById('selected-count'),
    deleteBtn: document.getElementById('bulk-delete'),
    cancelBtn: document.getElementById('bulk-cancel'),
    selectAllCheckbox: document.getElementById('select-all-checkbox'),
    statusSelect: document.getElementById('bulk-status-select'),
  },
};

const AppState = {
  /** @type {WishlistItem[]} */
  wishlist: JSON.parse(localStorage.getItem('myWishlist')) || [],
  selectedIds: new Set(),
  filters: { search: '', status: 'all', priority: 'all' },
  sort: { key: null, order: 'asc' },
  rates: { TRY: 1, USD: 47.54, EUR: 54.88 },
  budget: JSON.parse(localStorage.getItem('budgetLimit')) || 0,
  draggedId: null,
  editId: null,
  priorityChart: null
};

const PRIORITY_MAP = {
  'important-urgent': { score: 1, label: 'P1: Urgent & Important', class: 'badge-p1' },
  'important-not-urgent': { score: 2, label: 'P2: Important', class: 'badge-p2' },
  'not-important-urgent': { score: 3, label: 'P3: Urgent', class: 'badge-p3' },
  'not-important-not-urgent': { score: 4, label: 'P4: Someday', class: 'badge-p4' }
}

const STATUS_MAP = {
  wishlist: '💭 Wishlist',
  researching: '🔍 Researching',
  purchased: '✅ Purchased',
  canceled: '❌ Canceled'
}

const formatCurrency = (price) => Number(price || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2,maximumFractionDigits: 2 });

const getPriorityInfo = (importance, urgency) => PRIORITY_MAP[`${importance}-${urgency}`] || PRIORITY_MAP['not-important-not-urgent'];

const toTRY = (price, currency, rates = AppState.rates) => Number(price || 0) * (rates[currency] || 1);

const debounce = (fn, delay = 250) =>{
  let timerId;

  return function(...args) {
    clearTimeout(timerId);

    timerId = setTimeout(() => {
      fn(...args);
    }, delay);
  }
  
}

const escapeHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const sanitizeUrl = (url) => {
  if (!url) return '';
  const trimmed = url.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return encodeURI(trimmed);
  }
  return '';
}

const getMonthlyPayment = (item) => {
  if (item.status !== "purchased") return 0;
  
  const count = Number(item.installmentCount || 0);
  if (count <= 1) return 0;

  return toTRY(item.price, item.currency) / count;
};

const updateSortIcons = () => {
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

const fetchExchangeRates = async () => {
  const ONE_HOUR = 60 * 60 * 1000;
  const cachedData = JSON.parse(localStorage.getItem('wishlist_exchange_rates'));
  const now = Date.now();

  if (cachedData) {
    if (cachedData.isManual || (now - cachedData.timestamp < ONE_HOUR)) {
      AppState.rates = cachedData.rates;
      const dateStr = new Date(cachedData.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      updateRateUI(!cachedData.isManual, `${cachedData.isManual ? 'Manual' : 'Cache'}: ${dateStr}`);
      renderWishlist();
      renderSummaryCards();
      return;
    }
  }

  try {
    const response = await fetch('https://v6.exchangerate-api.com/v6/0778a08612dec62fae4971a6/latest/USD');
    if (!response.ok) throw new Error('Kur servisine ulaşılamadı');

    const data = await response.json();

    if (data.result === 'success') {
      const rates = data.conversion_rates;

      AppState.rates = {
        TRY: 1,
        USD: Number(rates.TRY.toFixed(2)),
        EUR: Number((rates.TRY / rates.EUR).toFixed(2))
      };

      localStorage.setItem('wishlist_exchange_rates', JSON.stringify({
        rates: AppState.rates,
        timestamp: now,
        isManual: false
      }));

      const dateStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      updateRateUI(true, `Live: ${dateStr}`);

      renderWishlist();
      renderSummaryCards();
    }
  } catch (error) {
    updateRateUI(false, '⚠️ Failed to fetch live rates!');
  }
}

const renderPriorityChart = () => {
  const chartSection = document.querySelector('.chart-section');
  const ctx = document.getElementById('priority-chart');
  if (!ctx || !chartSection) return;

  const dataValues = getPriorityBudgetDistribution();

  const hasData = dataValues.some(value => value > 0);

  if (!hasData) {
    chartSection.style.display = 'none';
    if (AppState.priorityChart) {
      AppState.priorityChart.destroy();
      AppState.priorityChart = null;
    }
    return;
  }

  chartSection.style.display = 'block';

  if (AppState.priorityChart) {
    AppState.priorityChart.destroy();
  }

  // 2. Yeni Pie Chart oluştur
  AppState.priorityChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['P1: Urgent & Important', 'P2: Important', 'P3: Urgent', 'P4: Someday'],
      datasets: [{
        data: dataValues,
        backgroundColor: ['#ff6384', '#36a2eb', '#ffcd67', '#64748b'],
        borderWidth: 0,
        borderColor: 'transparent',
        hoverOffset: 15
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 15,
            padding: 25,
            font: { size: 16 },
            generateLabels: (chart) => {
              const { labels, datasets } = chart.data;
              if (!labels?.length || !datasets?.length) return [];

              const dataset = datasets[0];

              return labels.map((label, index) => {
                const value = dataset.data[index] || 0;
                const isHidden = !chart.getDataVisibility(index);

                return {
                  text: `${label}: ${formatCurrency(value)} TL`,
                  fillStyle: dataset.backgroundColor[index],
                  fontColor: '#cbd5e1',
                  hidden: isHidden,
                  index
                };
              });
            }
          },
          onHover: handleHover,
          onLeave: handleLeave
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (context) => ` ${context.label}: ${formatCurrency(context.raw)} TL`
          }
        }
      }
    }
  });
};

function handleHover(evt, item, legend) {
  legend.chart.data.datasets[0].backgroundColor.forEach((color, index, colors) => {
    colors[index] = index === item.index || color.length === 9 ? color : color + '4D';
  });
  legend.chart.update();
}

function handleLeave(evt, item, legend) {
  legend.chart.data.datasets[0].backgroundColor.forEach((color, index, colors) => {
    colors[index] = color.length === 9 ? color.slice(0, -2) : color;
  });
  legend.chart.update();
}

const updateRateUI = (isLive, lastUpdatedText) => {
  if (UI.rates.usd) UI.rates.usd.textContent = AppState.rates.USD;
  if (UI.rates.eur) UI.rates.eur.textContent = AppState.rates.EUR;
  if (UI.rates.lastUpdated) UI.rates.lastUpdated.textContent = lastUpdatedText;

  if (UI.rates.statusBadge) {
    if (isLive) {
      UI.rates.statusBadge.className = 'badge-status online';
      UI.rates.statusBadge.title = 'Rates are kept up to date via live API.';
    } else {
      UI.rates.statusBadge.className = 'badge-status warning';
      UI.rates.statusBadge.title = 'Live rate connection failed! Using fixed/manual rates.';
    }
  }
};

const getPriorityBudgetDistribution = () => {
  let priTotal = {p1: 0, p2: 0, p3: 0, p4: 0};
  AppState.wishlist
    .filter(item => item.status !== "canceled")
    .forEach(item => {
      const key = `p${getPriorityInfo(item.importance, item.urgency).score}`;
      priTotal[key] += toTRY(item.price, item.currency);
    });
  return Object.values(priTotal);
}

const calculateInstallmentDetails = item => {
  if (item.status !== "purchased" || !item.purchaseDate) return null;
  
  const totalInstallment = Number(item.installmentCount || 0);
  if (totalInstallment <= 1) return null;
  
  const today = new Date();
  const purchasedDate = new Date(item.purchaseDate)
  const passedMonths = (today.getFullYear() - purchasedDate.getFullYear()) * 12 + (today.getMonth() - purchasedDate.getMonth());

  return {
    total: totalInstallment,
    remaining: totalInstallment - passedMonths
  }
}

const calculateBudget = () => {
  const wishlistTotal = AppState.wishlist
    .filter(item => item.status !== "canceled")
    .reduce((total, item) => total + toTRY(item.price, item.currency), 0);

  const installmentTotal = AppState.wishlist
    .filter(item => (Number(item.installmentCount) > 1 && item.status === "purchased"))
    .reduce((total, item) => total + (toTRY(item.price, item.currency) / Number(item.installmentCount || 1)), 0);

  return { wishlistTotal, installmentTotal };
}

const renderSummaryCards = () => {
  const { wishlistTotal, installmentTotal } = calculateBudget();
  const activeInstallmentItems = AppState.wishlist.filter(item => (Number(item.installmentCount) > 1 && item.status === "purchased")).length;
  const remainingBudget = AppState.budget - installmentTotal;
  const percentageBudget = AppState.budget > 0 ? (installmentTotal / AppState.budget) * 100 : 0;

  UI.summary.totalPrice.innerHTML = `${formatCurrency(wishlistTotal)} TL`;
  UI.summary.monthlyInstallment.innerHTML = `${formatCurrency(installmentTotal)} TL / monthly`;
  UI.summary.installmentCount.innerHTML = `${activeInstallmentItems} Item`;
  
  if (AppState.budget !== 0) {
    UI.budget.limitText.innerText = `${formatCurrency(AppState.budget)} TRY`;
    UI.budget.statusText.innerText = `%${Math.round(percentageBudget)} used (Remaining: ${formatCurrency(remainingBudget)} TL)`;
    UI.budget.progressBar.style.width = `${Math.min(percentageBudget, 100)}%`
    UI.budget.progressBar.classList.remove('safe', 'warning', 'danger');
    if (percentageBudget >= 90) {
      UI.budget.progressBar.classList.add('danger');
    } else if (percentageBudget >= 70) {
      UI.budget.progressBar.classList.add('warning');
    } else {
      UI.budget.progressBar.classList.add('safe');
    }
  } else {
    UI.budget.statusText.innerText = 'No budget set';
    UI.budget.progressBar.classList.remove('safe', 'warning', 'danger');
    UI.budget.progressBar.style.width = '0%';
  }
}

const setBudget = (event) => {
  const formData = new FormData(event.target);
  const formEntries = Object.fromEntries(formData);
  AppState.budget = Number(formEntries.budget);
  localStorage.setItem('budgetLimit', Number(formEntries.budget));
  renderSummaryCards();
}

const generateTableRow = element => {
  const priority = getPriorityInfo(element.importance, element.urgency);
  const priceDiff = toTRY(element.price, element.currency) - toTRY(element.initialPrice || element.price, element.currency);
  const installmentDetails = calculateInstallmentDetails(element);

  let diffHtml = "";
  if (priceDiff > 0) diffHtml = `<br><small class="priceDiff negative">▲ +${formatCurrency(priceDiff)} TL</small>`;
  else if (priceDiff < 0) diffHtml = `<br><small class="priceDiff positive">▼ -${formatCurrency(Math.abs(priceDiff))} TL</small>`;

  let paymentHtml = "Cash";
  if (element.status === "purchased") {
    if (installmentDetails) {
      paymentHtml = `Installment <br><small>${formatCurrency(toTRY(element.price, element.currency) / installmentDetails.total)} TL/mo</small>`;
      paymentHtml += installmentDetails.remaining > 0
        ? `<br/><small style="color: var(--p2-blue)">Remaining: ${installmentDetails.remaining} / ${installmentDetails.total} mos</small>`
        : `<br /><small style="color: var(--success)">Installment Finished 🎉</small>`;
    }
  } else {
    paymentHtml = "-";
  }

  const rowClass = element.status === "canceled" ? 'style="opacity: 0.5;"' : "";

  return `
    <tr ${rowClass} data-wishlist-id="${element.id}">
      <td><input type="checkbox" data-id="${element.id}" ${AppState.selectedIds.has(element.id) ? 'checked' : ''}></td>
      <td class="drag-handle" draggable="true">
        <span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="1.5"></circle>
            <circle cx="15" cy="6" r="1.5"></circle>
            <circle cx="9" cy="12" r="1.5"></circle>
            <circle cx="15" cy="12" r="1.5"></circle>
            <circle cx="9" cy="18" r="1.5"></circle>
            <circle cx="15" cy="18" r="1.5"></circle>
          </svg>
        </span>
      </td>
      <td>
        ${sanitizeUrl(element.link) ? `<a href="${sanitizeUrl(element.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(element.name)}</a>` : escapeHtml(element.name)}
        ${sanitizeUrl(element.altLink) ? `<a href="${sanitizeUrl(element.altLink)}" title="Alt Link" target="_blank" rel="noopener noreferrer">🔗</a>` : "" }  
        ${element.note ? `<br><small class="has-tooltip" data-tooltip="${escapeHtml(element.note)}">📝</small>` : ""}
      </td>
      <td>
        <span class="price">${formatCurrency(element.price)} ${element.currency || "TL"} </span>
        ${diffHtml}
        ${element.priceHistory?.length > 1 ? `<button type="button" class="btn-history" data-id="${element.id}" title="Price History">📈</button>` : ''}
      </td>
      <td>${paymentHtml}</td>
      <td><span class="badge ${priority.class}">${priority.label}</span></td>
      <td class="status-cell" data-id="${element.id}" data-selected="${element.status}"><span class="status-label">${STATUS_MAP[element.status] || element.status}</span></td>
      <td>
        <div class="actionButtons">
          <button class="btn-edit" data-id="${element.id}">Edit</button>
          <button class="btn-delete" data-id="${element.id}">Delete</button>
        </div>
      </td>
    </tr>
  `;
}

const getFilteredWishlist = () => {
  return AppState.wishlist.filter( item => {
    const matchesSearch = item.name.toLowerCase().includes(AppState.filters.search) || (item.note || '').toLowerCase().includes(AppState.filters.search);
    const matchesStatus = AppState.filters.status === 'all' || item.status === AppState.filters.status;
    const itemPriority = getPriorityInfo(item.importance, item.urgency).class;
    const matchesPriority = AppState.filters.priority === 'all' || itemPriority.includes(AppState.filters.priority);

    return matchesSearch && matchesStatus && matchesPriority;
  });
}

const renderWishlist = () => {
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

const updateWishlist = (updatedArray) => {
  AppState.wishlist = updatedArray;
  localStorage.setItem('myWishlist', JSON.stringify(AppState.wishlist));
  renderWishlist();
  renderSummaryCards();
  renderPriorityChart();
}

const resetFormState = () => {
  UI.form.reset();
  clearAllFieldErrors();
  AppState.editId = null;
  UI.form.elements.submitBtn.textContent = 'Save to Wishlist';
  document.querySelector('section.form-section > h2').textContent = "Add New Item";
  UI.form.elements.cancelBtn.disabled = true;
}

const updateItem = (id) => {
  const editItem = AppState.wishlist.find(item => item.id === id);
  AppState.editId = editItem.id;
  

  Object.entries(editItem).forEach( ([key, value]) => {
    if (UI.form.elements[key]) {
      UI.form.elements[key].value = value || "";
    }
  });

  document.querySelector('section.form-section > h2').textContent = "Update Item";
  UI.form.elements.submitBtn.textContent = 'Update Item';
  UI.form.elements.cancelBtn.disabled = false;

  UI.modal.showModal();
}

const exportJSON = () => {
  if (AppState.wishlist.length === 0) return createToast({type: 'info', message: 'No data to export!' });
  
  const jsonString = JSON.stringify(AppState.wishlist, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `wishlist-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

const exportCSV = () => {
  if (AppState.wishlist.length === 0) return createToast({ type: 'info', message: 'No data to export!' });

  const headers = Array.from(new Set(AppState.wishlist.flatMap(item => Object.keys(item))));

  const formatCell = value => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.join(",");

  const dataRows = AppState.wishlist.map(item => headers.map(header => formatCell(item[header])).join(","));
  
  const csvData = [headerRow, ...dataRows].join("\n");
  // return [headerRow, ...dataRows].join("\n");

  const bom = "\uFEFF"; // for Turkish Characters
  const blob = new Blob([bom + csvData], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `wishlist-backup-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}

const importJSON = (file) => {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result);

      if (Array.isArray(importedData)) {
        updateWishlist(importedData);
        createToast({
          type: 'success',
          message: 'Data successfully loaded! 🎉'
        });

      } else {
        createToast({
          type: 'error',
          message: 'Invalid file format!'
        });
      }
    } catch (err) {
      createToast({
          type: 'error',
          message: 'Could not read JSON file!'
        });
    }
  }

  reader.readAsText(file);
}

const importCSV = (file) => {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const importedData = e.target.result;

      // Clean BOM
      const cleanedData = importedData.replace(/^\uFEFF/, '');

      const rows = cleanedData
        .split(/\r?\n/)
        .filter(row => row.trim() !== '');

      if (rows.length === 0) {
        createToast({ type: 'error', message: 'CSV file is empty!' });
        return;
      }
      
      const productRows = rows.map(row => 
        row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
          .map(cell => 
            cell.trim()
              .replace(/^"|"$/g, '')
              .replace(/""/g, '"')
          )
      );

      const headers = productRows[0];
      const products = productRows.slice(1);

      const formattedProducts = products.map(product => {
        return Object.fromEntries(
          headers.map((header,index) => [header, product[index]])
        )
      })

      updateWishlist(formattedProducts);
      createToast({
        type: 'success',
        message: 'Data successfully loaded! 🎉'
      });

    } catch (error) {
      createToast({
        type: 'error',
        message: `Could not read CSV file! ${error}`
      });
    }
  }

  reader.readAsText(file);
}

const importFile = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  switch (file.type) {
    case 'application/json':
      importJSON(file);
      break;
    case 'text/csv':
      importCSV(file);
      break;
    default:
      break;
  }

  console.log(file);
  event.target.value = '';
}

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

const showFieldError = (inputElement, message) => {
  inputElement.classList.add('input-error');

  // Varsa önceki hata mesajını kaldır
  const existingError = inputElement.parentElement.querySelector('.error-text');
  if (existingError) existingError.remove();

  // Yeni hata span'i oluştur
  const errorSpan = document.createElement('span');
  errorSpan.className = 'error-text';
  errorSpan.textContent = message;

  inputElement.parentElement.appendChild(errorSpan);
};

const clearAllFieldErrors = () => {
  UI.form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  UI.form.querySelectorAll('.error-text').forEach(el => el.remove());
};

const formValidation = (input) => {
  clearAllFieldErrors();

  let isValid = true;
  let firstInvalidInput = null;

  // 1. Name validation
  if (!input.name || input.name.trim().length < 2) {
    showFieldError(UI.form.elements.name, 'Please enter a valid item name (at least 2 chars).');
    if (!firstInvalidInput) firstInvalidInput = UI.form.elements.name;
    isValid = false;
  }
  
  // 2. Price validation
  const parsedPrice = Number(input.price);
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    showFieldError(UI.form.elements.price, 'Price must be a valid number greater than 0.');
    if (!firstInvalidInput) firstInvalidInput = UI.form.elements.price;
    isValid = false;
  }

  // URL Helper
  const isValidUrl = (url) => {
    if (!url || url.trim() === '') return true;
    try {
      const parsed = new URL(url.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // 3. Link validation
  if (!isValidUrl(input.link)) {
    showFieldError(UI.form.elements.link, 'Main link must be a valid URL (e.g. https://...).');
    if (!firstInvalidInput) firstInvalidInput = UI.form.elements.link;
    isValid = false;
  }

  // 4. Alt Link validation
  if (!isValidUrl(input.altLink)) {
    showFieldError(UI.form.elements.altLink, 'Alternative link must be a valid URL.');
    if (!firstInvalidInput) firstInvalidInput = UI.form.elements.altLink;
    isValid = false;
  }

  // İlk hatalı inputa otomatik odaklan
  if (firstInvalidInput) {
    firstInvalidInput.focus();
  }

  return isValid;
};

const showPriceHistory = (itemId) => {
  const item = AppState.wishlist.find(i => i.id === itemId);
  if (!item || !item.priceHistory || item.priceHistory.length === 0) return;

  UI.priceHistory.title.textContent = `${item.name} - Price History`;

  // Toplam net değişim özeti
  const firstRecord = item.priceHistory[0];
  const lastRecord = item.priceHistory[item.priceHistory.length - 1];
  const netDiff = Number(lastRecord.price) - Number(firstRecord.price);

  let summaryDiff = '';
  if (netDiff > 0) {
    summaryDiff = `<span class="priceDiff negative">▲ +${formatCurrency(netDiff)} ${lastRecord.currency}</span>`;
  } else if (netDiff < 0) {
    summaryDiff = `<span class="priceDiff positive">▼ -${formatCurrency(Math.abs(netDiff))} ${lastRecord.currency}</span>`;
  } else {
    summaryDiff = '<span>No change</span>';
  }

  UI.priceHistory.summary.innerHTML = `
    <small>Initial: <strong>${formatCurrency(firstRecord.price)} ${firstRecord.currency}</strong> ➔ Latest: <strong>${formatCurrency(lastRecord.price)} ${lastRecord.currency}</strong> (${summaryDiff})</small>
  `;

  // Liste elemanlarını oluştur (kronolojik sıra)
  UI.priceHistory.list.innerHTML = item.priceHistory.map((record, index) => {
    let diffBadge = '';

    if (index > 0) {
      const prevPrice = Number(item.priceHistory[index - 1].price);
      const currPrice = Number(record.price);
      const diff = currPrice - prevPrice;

      if (diff > 0) {
        diffBadge = `<span class="priceDiff negative" style="font-size:0.75rem;">▲ +${formatCurrency(diff)}</span>`;
      } else if (diff < 0) {
        diffBadge = `<span class="priceDiff positive" style="font-size:0.75rem;">▼ -${formatCurrency(Math.abs(diff))}</span>`;
      }
    } else {
      diffBadge = `<small style="opacity: 0.6;">(Initial)</small>`;
    }

    return `
      <li class="history-item">
        <div class="history-date">${record.date}</div>
        <div class="history-price">
          ${formatCurrency(record.price)} ${record.currency || 'TL'}
          ${diffBadge}
        </div>
      </li>
    `;
  }).join('');

  UI.priceHistory.modal.showModal();
};

const updateBulkUI = () => {
  const currentItems = getFilteredWishlist();
  const hasItems = currentItems.length > 0;

  const visibleSelectedCount = currentItems.filter(item => 
    AppState.selectedIds.has(item.id)
  ).length;

  const isAllSelected = hasItems && visibleSelectedCount === currentItems.length;
  const isPartiallySelected = visibleSelectedCount > 0 && !isAllSelected;

  UI.bulk.selectAllCheckbox.checked = isAllSelected;
  UI.bulk.selectAllCheckbox.indeterminate = isPartiallySelected;

  const totalSelected = AppState.selectedIds.size;

  if (totalSelected <= 0) {
    UI.bulk.bar.style.display = 'none';
  } else {
    UI.bulk.bar.style.display = 'flex';
    UI.bulk.count.textContent = totalSelected;
  }
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