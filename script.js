/**
 * @typedef {Object} WishlistItem
 * @property {string} id - Crypto UUID
 * @property {string} name - Ürün adı
 * @property {string} [link] - Ürün linki
 * @property {string} [altLink] - Alt. Ürün linki
 * @property {string} price - Ürün fiyatı
 * @property {string} currency
 * @property {string} initialPrice - İlk Eklendiği Fiyat
 * @property {string} createdAt - Eklenme Tarih
 * @property {'important' | 'not-important'} importance - Öncelik durumu
 * @property {'urgent' | 'not-urgent'} urgency - Aciliyet durumu
 * @property {string} [status]
 * @property {date} [purchaseDate]
 * @property {string} [installmentCount] - Taksit sayısı
 * @property {string} [note]
 */

const FORM = document.getElementById('wishlist-form');
const VIEW = document.getElementById('wishlist-view');
const UI_TOTAL_PRICE = document.getElementById('total-price');
const UI_MONTHLY_INSTALLMENT = document.getElementById('monthly-installment');
const UI_INSTALLMENT_COUNT = document.getElementById('installment-count');
const UI_SEARCH_INPUT = document.getElementById('search-input');
const UI_FILTER_STATUS = document.getElementById('filter-status');
const UI_FILTER_PRIORITY = document.getElementById('filter-priority');
const UI_EXPORT_BUTTON = document.getElementById('btn-export');
const UI_IMPORT_BUTTON = document.getElementById('btn-import-trigger');
const UI_FILE_IMPORT = document.getElementById('file-import');
const UI_RATE_USD = document.getElementById('rate-usd');
const UI_RATE_EUR = document.getElementById('rate-eur');
const UI_RATE_STATUS = document.getElementById('rate-status-badge');
const UI_RATE_LAST_UPDATED = document.getElementById('rate-last-updated');
const UI_BTN_EDIT_RATES = document.getElementById('btn-edit-rates');
const UI_ANALYTICS_CONTAINER = document.querySelector('.analytics-container');
const UI_BTN_TOGGLE_ANALYTICS = document.getElementById('btn-toggle-analytics');
const MODAL = document.getElementById('newItemModal');

let EXCHANGE_RATES = { TRY: 1, USD: 47.54, EUR: 54.88 };
let currentEditID = null;
let filters = { search: '', status: 'all', priority: 'all' };
/** @type {WishlistItem[]} */
let wishlist = JSON.parse(localStorage.getItem('myWishlist')) || [];
let priorityChart = null;

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

const currencyToTRY = (price, currency) => Number(price || 0) * (EXCHANGE_RATES[currency] || 1);

const fetchExchangeRates = async () => {
  const ONE_HOUR = 60 * 60 * 1000;
  const cachedData = JSON.parse(localStorage.getItem('wishlist_exchange_rates'));
  const now = Date.now();

  if (cachedData) {
    if (cachedData.isManual || (now - cachedData.timestamp < ONE_HOUR)) {
      EXCHANGE_RATES = cachedData.rates;
      const dateStr = new Date(cachedData.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      updateRateUI(!cachedData.isManual, `${cachedData.isManual ? 'Manuel' : 'Cache'}: ${dateStr}`);
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

      EXCHANGE_RATES = {
        TRY: 1,
        USD: Number(rates.TRY.toFixed(2)),
        EUR: Number((rates.TRY / rates.EUR).toFixed(2))
      };

      localStorage.setItem('wishlist_exchange_rates', JSON.stringify({
        rates: EXCHANGE_RATES,
        timestamp: now,
        isManual: false
      }));

      const dateStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      updateRateUI(true, `Canlı: ${dateStr}`);

      renderWishlist();
      renderSummaryCards();
    }
  } catch (error) {
    console.warn('Canlı kur alınamadı:', error);
    updateRateUI(false, '⚠️ Canlı Kur Alınamadı!');
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
    if (priorityChart) {
      priorityChart.destroy();
      priorityChart = null;
    }
    return;
  }

  chartSection.style.display = 'block';

  if (priorityChart) {
    priorityChart.destroy();
  }

  // 2. Yeni Pie Chart oluştur
  priorityChart = new Chart(ctx, {
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
  if (UI_RATE_USD) UI_RATE_USD.textContent = EXCHANGE_RATES.USD;
  if (UI_RATE_EUR) UI_RATE_EUR.textContent = EXCHANGE_RATES.EUR;
  if (UI_RATE_LAST_UPDATED) UI_RATE_LAST_UPDATED.textContent = lastUpdatedText;

  if (UI_RATE_STATUS) {
    if (isLive) {
      UI_RATE_STATUS.className = 'badge-status online';
      UI_RATE_STATUS.title = 'Kurlar canlı API üzerinden güncel tutuluyor.';
    } else {
      UI_RATE_STATUS.className = 'badge-status warning';
      UI_RATE_STATUS.title = 'Canlı kur bağlantısı kurulamadı! Sabit/Manuel kurlar kullanılıyor.';
    }
  }
};

const getPriorityBudgetDistribution = () => {
  let priTotal = {p1: 0, p2: 0, p3: 0, p4: 0};
  wishlist
    .filter(item => item.status !== "canceled")
    .forEach(item => {
      const key = `p${getPriorityInfo(item.importance, item.urgency).score}`;
      priTotal[key] += currencyToTRY(item.price, item.currency);
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
  const wishlistTotal = wishlist
    .filter(item => item.status !== "canceled")
    .reduce((total, item) => total + currencyToTRY(item.price, item.currency), 0);

  const installmentTotal = wishlist
    .filter(item => (Number(item.installmentCount) > 1 && item.status === "purchased"))
    .reduce((total, item) => total + (currencyToTRY(item.price, item.currency) / Number(item.installmentCount || 1)), 0);

  return { wishlistTotal, installmentTotal };
}

const renderSummaryCards = () => {
  const { wishlistTotal, installmentTotal } = calculateBudget();
  const activeInstallmentItems = wishlist.filter(item => (Number(item.installmentCount) > 1 && item.status === "purchased")).length;
  
  UI_TOTAL_PRICE.innerHTML = `${formatCurrency(wishlistTotal)} TL`;
  UI_MONTHLY_INSTALLMENT.innerHTML = `${formatCurrency(installmentTotal)} TL / monthly`;
  UI_INSTALLMENT_COUNT.innerHTML = `${activeInstallmentItems} Item`;
}

const generateTableRow = element => {
  const priority = getPriorityInfo(element.importance, element.urgency);
  const priceDiff = currencyToTRY(element.price, element.currency) - currencyToTRY(element.initialPrice || element.price, element.currency);
  const installmentDetails = calculateInstallmentDetails(element);

  let diffHtml = "";
  if (priceDiff > 0) diffHtml = `<br><small class="priceDiff negative">▲ +${formatCurrency(priceDiff)} TL</small>`;
  else if (priceDiff < 0) diffHtml = `<br><small class="priceDiff positive">▼ -${formatCurrency(Math.abs(priceDiff))} TL</small>`;

  let paymentHtml = "Peşin";
  if (element.status === "purchased") {
    if (installmentDetails) {
      paymentHtml = `Taksit <br><small>${formatCurrency(currencyToTRY(element.price, element.currency) / installmentDetails.total)} TL/ay</small>`;
      paymentHtml += installmentDetails.remaining > 0
        ? `<br/><small style="color: var(--p2-blue)">Kalan: ${installmentDetails.remaining} / ${installmentDetails.total} ay</small>`
        : `<br /><small style="color: var(--success)">Taksit Bitti 🎉</small>`;
    }
  } else {
    paymentHtml = "-";
  }

  const rowClass = element.status === "canceled" ? 'style="opacity: 0.5;"' : "";

  return `
    <tr ${rowClass}>
      <td>
        ${element.link ? `<a href="${element.link}" target="_blank" rel="noopener noreferrer">${element.name}</a>` : element.name}
        ${element.altLink ? `<a href="${element.altLink}" title="Alt Link" target="_blank" rel="noopener noreferrer">🔗</a>` : "" }  
        ${element.note ? `<br><small class="has-tooltip" data-tooltip="${element.note}">📝</small>` : ""}
      </td>
      <td>
        <span class="price">${formatCurrency(element.price)} ${element.currency || "TL"} </span>
        ${diffHtml}
      </td>
      <td>${paymentHtml}</td>
      <td><span class="badge ${priority.class}">${priority.label}</span></td>
      <td><span class="status-label">${STATUS_MAP[element.status] || element.status}</span></td>
      <td>
        <div class="actionButtons">
          <button class="btn-edit" data-id="${element.id}">Edit</button>
          <button class="btn-delete" data-id="${element.id}">Delete</button>
        </div>
      </td>
    </tr>
  `;
}

const renderWishlist = () => {
  const filteredList = wishlist.filter( item => {
    const matchesSearch = item.name.toLowerCase().includes(filters.search) || (item.note || '').toLowerCase().includes(filters.search);

    const matchesStatus = filters.status === 'all' || item.status === filters.status;

    const itemPriority = getPriorityInfo(item.importance, item.urgency).class;
    const matchesPriority = filters.priority === 'all' || itemPriority.includes(filters.priority);

    return matchesSearch && matchesStatus && matchesPriority;
  });
  const sortedList = [...filteredList].sort((a, b) => getPriorityInfo(a.importance, a.urgency).score - getPriorityInfo(b.importance, b.urgency).score);
  VIEW.innerHTML = sortedList.map(generateTableRow).join('');
}

const updateWishlist = (updatedArray) => {
  wishlist = updatedArray;
  localStorage.setItem('myWishlist', JSON.stringify(wishlist));
  renderWishlist();
  renderSummaryCards();
  renderPriorityChart();
}

const resetFormState = () => {
  FORM.reset();
  currentEditID = null;
  FORM.elements.submitBtn.textContent = 'Save to Wishlist';
  document.querySelector('section.form-section > h2').textContent = "Add New Item";
  FORM.elements.cancelBtn.disabled = true;
}

const updateItem = (id) => {
  const editItem = wishlist.find(item => item.id === id);
  currentEditID = editItem.id;
  

  Object.entries(editItem).forEach( ([key, value]) => {
    if (FORM.elements[key]) {
      FORM.elements[key].value = value || "";
    }
  });

  document.querySelector('section.form-section > h2').textContent = "Update Item";
  FORM.elements.submitBtn.textContent = 'Update Item';
  FORM.elements.cancelBtn.disabled = false;

  MODAL.showModal();
}

const exportJSON = () => {
  if (wishlist.length === 0) return alert('İndirilecek veri yok!');
  
  const jsonString = JSON.stringify(wishlist, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `wishlist-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

const importJSON = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result);

      if (Array.isArray(importedData)) {
        updateWishlist(importedData);
        alert('Veriler başarıyla yüklendi! 🎉');
      } else {
        alert('Geçersiz dosya biçimi!');
      }
    } catch (err) {
      alert('JSON dosyası okunamadı!');
    }
  }

  reader.readAsText(file);
  event.target.value = '';
}

const toggleAnalytics = () => {
  if (!UI_ANALYTICS_CONTAINER) return;

  const isHidden = UI_ANALYTICS_CONTAINER.hidden;
  UI_ANALYTICS_CONTAINER.hidden = !isHidden;

  localStorage.setItem('wishlist_analytics_hidden', (!isHidden).toString());

  if (isHidden && priorityChart) {
    setTimeout(() => {
      priorityChart.resize();
    }, 50);
  }
}

const initAnalyticsState = () => {
  if (!UI_ANALYTICS_CONTAINER) return;

  const savedState = localStorage.getItem('wishlist_analytics_hidden');

  if (savedState === null) {
    UI_ANALYTICS_CONTAINER.hidden = true;
  } else {
    UI_ANALYTICS_CONTAINER.hidden = savedState === 'true';
  }
};

FORM.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const formEntries = Object.fromEntries(formData);

  if (currentEditID) {
    wishlist = wishlist.map(item => item.id === currentEditID ? { ...item, ...formEntries } : item);
  } else {
    wishlist.push({
      id: crypto.randomUUID(), 
      initialPrice: formEntries.price,
      createdAt: new Date().toLocaleDateString("tr-TR"),
      ...formEntries
    });
  }
  
  updateWishlist(wishlist);
  resetFormState();

  MODAL.close();
});

FORM.elements.cancelBtn.addEventListener('click', () => { resetFormState(); VIEW.scrollIntoView({ block: "center" }); MODAL.close() });

VIEW.addEventListener('click', (event) => {
  if (event.target.classList.contains('btn-delete')) { updateWishlist(wishlist.filter(item => item.id !== event.target.dataset.id)) }
  if (event.target.classList.contains('btn-edit')) { updateItem(event.target.dataset.id); FORM.scrollIntoView({ block: "center" }) }
});

UI_SEARCH_INPUT.addEventListener('input', (event) => {
  filters.search = event.target.value.toLowerCase();
  renderWishlist();
});

UI_FILTER_STATUS.addEventListener('change', (event) => {
  filters.status = event.target.value;
  renderWishlist();
});

UI_FILTER_PRIORITY.addEventListener('change', (event) => {
  filters.priority = event.target.value;
  renderWishlist();
});

UI_EXPORT_BUTTON.addEventListener('click', () => exportJSON());

UI_IMPORT_BUTTON.addEventListener('click', (event) => UI_FILE_IMPORT.click());

UI_FILE_IMPORT.addEventListener('change', (event) => importJSON(event));

UI_BTN_EDIT_RATES?.addEventListener('click', () => {
  const newUsd = prompt('Güncel USD Kuru (TL):', EXCHANGE_RATES.USD);
  const newEur = prompt('Güncel EUR Kuru (TL):', EXCHANGE_RATES.EUR);

  if (newUsd && newEur && !isNaN(newUsd) && !isNaN(newEur)) {
    EXCHANGE_RATES = {
      TRY: 1,
      USD: Number(newUsd),
      EUR: Number(newEur)
    };

    localStorage.setItem('wishlist_exchange_rates', JSON.stringify({
      rates: EXCHANGE_RATES,
      timestamp: Date.now(),
      isManual: true // Manuel girildiğini işaretle
    }));

    updateRateUI(false, 'Manuel Ayarlandı');
    updateWishlist(wishlist);
    alert('Kurlar manuel olarak güncellendi! 🎉');
  }
});

MODAL.addEventListener('close', () => {
  resetFormState();
});

UI_BTN_TOGGLE_ANALYTICS?.addEventListener('click', toggleAnalytics);

window.addEventListener('DOMContentLoaded', () => {
  initAnalyticsState();
  renderWishlist();
  renderSummaryCards();

  fetchExchangeRates();
  renderPriorityChart();
});