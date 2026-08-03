/**
 * @typedef {Object} WishlistItem
 * @property {string} id - Crypto UUID
 * @property {string} name - Ürün adı
 * @property {string} [link] - Ürün linki
 * @property {string} [altLink] - Alt. Ürün linki
 * @property {string} price - Ürün fiyatı
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

let currentEditID = null;
let filters = { search: '', status: 'all', priority: 'all' };
/** @type {WishlistItem[]} */
let wishlist = JSON.parse(localStorage.getItem('myWishlist')) || [];

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
    .reduce((total, item) => total + Number(item.price), 0);

  const installmentTotal = wishlist
    .filter(item => (Number(item.installmentCount) > 1 && item.status === "purchased"))
    .reduce((total, item) => total + (Number(item.price) / Number(item.installmentCount || 1)), 0);

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
  const priceDiff = Number(element.price) - Number(element.initialPrice || element.price);
  const installmentDetails = calculateInstallmentDetails(element);

  let diffHtml = "";
  if (priceDiff > 0) diffHtml = `<br><small class="priceDiff negative">▲ +${formatCurrency(priceDiff)} TL</small>`;
  else if (priceDiff < 0) diffHtml = `<br><small class="priceDiff positive">▼ -${formatCurrency(Math.abs(priceDiff))} TL</small>`;

  let paymentHtml = "Peşin";
  if (element.status === "purchased") {
    if (installmentDetails) {
      paymentHtml = `Taksit <br><small>${formatCurrency(element.price / installmentDetails.total)} TL/ay</small>`;
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
        ${formatCurrency(element.price)} TL ${diffHtml}
      </td>
      <td>${paymentHtml}</td>
      <td><span class="badge ${priority.class}">${priority.label}</span></td>
      <td><span class="status-label">${STATUS_MAP[element.status] || element.status}</span></td>
      <td>
        <button class="btn-edit" data-id="${element.id}">Edit</button>
        <button class="btn-delete" data-id="${element.id}">Delete</button>
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

  FORM.elements.name.value = editItem.name;
  FORM.elements.price.value = editItem.price;
  FORM.elements.link.value = editItem.link;
  FORM.elements.altLink.value = editItem.altLink || "";
  FORM.elements.importance.value = editItem.importance;
  FORM.elements.urgency.value = editItem.urgency;
  FORM.elements.purchaseDate.value = editItem.purchaseDate;
  FORM.elements.installmentCount.value = editItem.installmentCount;
  FORM.elements.status.value = editItem.status;
  FORM.elements.note.value = editItem.note || "";
  FORM.elements.submitBtn.textContent = 'Update Item';
  document.querySelector('section.form-section > h2').textContent = "Update Item";
  FORM.elements.cancelBtn.disabled = false;
}

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
});

FORM.elements.cancelBtn.addEventListener('click', () => { resetFormState(); VIEW.scrollIntoView({ block: "center" }) });

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

window.addEventListener('DOMContentLoaded', () => {
  renderWishlist();
  renderSummaryCards();
});