import { AppState } from './state.js';
import { UI } from './ui.js';
import { formatCurrency, toTRY } from './utils.js';

const calculateBudget = () => {
  const wishlistTotal = AppState.wishlist
    .filter(item => item.status !== 'canceled')
    .reduce((total, item) => total + toTRY(item.price, item.currency), 0);

  const installmentTotal = AppState.wishlist
    .filter(item => Number(item.installmentCount) > 1 && item.status === 'purchased')
    .reduce((total, item) => total + toTRY(item.price, item.currency) / Number(item.installmentCount || 1), 0);

  return { wishlistTotal, installmentTotal };
};

export const renderSummaryCards = () => {
  const { wishlistTotal, installmentTotal } = calculateBudget();
  const activeInstallmentItems = AppState.wishlist
    .filter(item => Number(item.installmentCount) > 1 && item.status === 'purchased').length;
  const remainingBudget = AppState.budget - installmentTotal;
  const percentageBudget = AppState.budget > 0 ? (installmentTotal / AppState.budget) * 100 : 0;

  UI.summary.totalPrice.innerHTML = `${formatCurrency(wishlistTotal)} TL`;
  UI.summary.monthlyInstallment.innerHTML = `${formatCurrency(installmentTotal)} TL / monthly`;
  UI.summary.installmentCount.innerHTML = `${activeInstallmentItems} Item`;

  if (AppState.budget !== 0) {
    UI.budget.limitText.innerText = `${formatCurrency(AppState.budget)} TRY`;
    UI.budget.statusText.innerText = `%${Math.round(percentageBudget)} used (Remaining: ${formatCurrency(remainingBudget)} TL)`;
    UI.budget.progressBar.style.width = `${Math.min(percentageBudget, 100)}%`;
    UI.budget.progressBar.classList.remove('safe', 'warning', 'danger');
    UI.budget.progressBar.classList.add(
      percentageBudget >= 90 ? 'danger' : percentageBudget >= 70 ? 'warning' : 'safe'
    );
  } else {
    UI.budget.statusText.innerText = 'No budget set';
    UI.budget.progressBar.classList.remove('safe', 'warning', 'danger');
    UI.budget.progressBar.style.width = '0%';
  }
};
