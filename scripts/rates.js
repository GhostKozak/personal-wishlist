import { AppState } from './state.js';
import { UI } from './ui.js';
import { renderWishlist } from './table.js';
import { renderSummaryCards } from './summary.js';

export const fetchExchangeRates = async () => {
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

export const updateRateUI = (isLive, lastUpdatedText) => {
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