import { AppState } from './state.js';
import { renderWishlist } from './table.js';
import { renderSummaryCards } from './summary.js';
import { renderPriorityChart } from './charts.js';

export const updateWishlist = updatedArray => {
  AppState.wishlist = updatedArray;
  localStorage.setItem('myWishlist', JSON.stringify(AppState.wishlist));
  renderWishlist();
  renderSummaryCards();
  renderPriorityChart();
};
