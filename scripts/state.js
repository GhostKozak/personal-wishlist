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

export const AppState = {
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