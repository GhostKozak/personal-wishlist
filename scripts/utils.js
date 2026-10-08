import { PRIORITY_MAP } from './constants.js';
import { AppState } from './state.js';

export const formatCurrency = (price) => Number(price || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2,maximumFractionDigits: 2 });

export const getPriorityInfo = (importance, urgency) => PRIORITY_MAP[`${importance}-${urgency}`] || PRIORITY_MAP['not-important-not-urgent'];

export const toTRY = (price, currency, rates = AppState.rates) =>
  Number(price || 0) * (rates[currency] || 1);

export const debounce = (fn, delay = 250) =>{
  let timerId;

  return function(...args) {
    clearTimeout(timerId);

    timerId = setTimeout(() => {
      fn(...args);
    }, delay);
  }
}

export const escapeHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const sanitizeUrl = (url) => {
  if (!url) return '';
  const trimmed = url.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return encodeURI(trimmed);
  }
  return '';
}