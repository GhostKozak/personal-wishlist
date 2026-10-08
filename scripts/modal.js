import { AppState } from './state.js';
import { UI } from './ui.js';
import { formatCurrency } from './utils.js';
import { renderSummaryCards } from './summary.js';

export const clearAllFieldErrors = () => {
  UI.form.querySelectorAll('.input-error').forEach(element => element.classList.remove('input-error'));
  UI.form.querySelectorAll('.error-text').forEach(element => element.remove());
};

export const formValidation = (input) => {
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

export const resetFormState = () => {
  UI.form.reset();
  clearAllFieldErrors();
  AppState.editId = null;
  UI.form.elements.submitBtn.textContent = 'Save to Wishlist';
  document.querySelector('section.form-section > h2').textContent = "Add New Item";
  UI.form.elements.cancelBtn.disabled = true;
}

export const updateItem = (id) => {
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

export const showPriceHistory = (itemId) => {
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


export const setBudget = (event) => {
  const formData = new FormData(event.target);
  const formEntries = Object.fromEntries(formData);
  AppState.budget = Number(formEntries.budget);
  localStorage.setItem('budgetLimit', Number(formEntries.budget));
  renderSummaryCards();
}