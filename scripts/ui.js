import { AppState } from "./state.js";
import { STATUS_MAP } from "./constants.js";
import { formatCurrency, toTRY, getPriorityInfo, escapeHtml, sanitizeUrl } from "./utils.js";

export const UI = {
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

export const calculateInstallmentDetails = item => {
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

export const renderTitleCell = (element) => {
  const safeLink = sanitizeUrl(element.link);
  const safeAltLink = sanitizeUrl(element.altLink);
  const safeName = escapeHtml(element.name);
  const safeNote = escapeHtml(element.note)

  return `
    ${safeLink ? `<a href="${safeLink}" target="_blank" rel="noopener noreferrer">${safeName}</a>` : safeName}
    ${safeAltLink ? `<a href="${safeAltLink}" title="Alt Link" target="_blank" rel="noopener noreferrer">🔗</a>` : "" }  
    ${safeNote ? `<br><small class="has-tooltip" data-tooltip="${safeNote}">📝</small>` : ""}
  `
}

export const renderPriceDiff = (element) => {
  const priceDiff = toTRY(element.price, element.currency, AppState.rates) - toTRY(element.initialPrice || element.price, element.currency, AppState.rates);

  let diffHtml = "";
  
  if (priceDiff > 0) diffHtml = `<br><small class="priceDiff negative">▲ +${formatCurrency(priceDiff)} TL</small>`;
  else if (priceDiff < 0) diffHtml = `<br><small class="priceDiff positive">▼ -${formatCurrency(Math.abs(priceDiff))} TL</small>`;
  
  return diffHtml
}

export const renderPaymentCell = (element) => {
  const installmentDetails = calculateInstallmentDetails(element);

  let paymentHtml = "Cash";
  if (element.status === "purchased") {
    if (installmentDetails) {
      paymentHtml = `Installment <br><small>${formatCurrency(toTRY(element.price, element.currency) / installmentDetails.total, AppState.rates)} TL/mo</small>`;
      paymentHtml += installmentDetails.remaining > 0
        ? `<br/><small style="color: var(--p2-blue)">Remaining: ${installmentDetails.remaining} / ${installmentDetails.total} mos</small>`
        : `<br /><small style="color: var(--success)">Installment Finished 🎉</small>`;
    }
  } else {
    paymentHtml = "-";
  }

  return paymentHtml
}

export const generateTableRow = element => {
  const priority = getPriorityInfo(element.importance, element.urgency);

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
        ${renderTitleCell(element)}
      </td>
      <td>
        <span class="price">${formatCurrency(element.price)} ${element.currency || "TL"} </span>
        ${renderPriceDiff(element)}
        ${element.priceHistory?.length > 1 ? `<button type="button" class="btn-history" data-id="${element.id}" title="Price History">📈</button>` : ''}
      </td>
      <td>${renderPaymentCell(element)}</td>
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