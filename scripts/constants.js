export const PRIORITY_MAP = {
  'important-urgent': { score: 1, label: 'P1: Urgent & Important', class: 'badge-p1' },
  'important-not-urgent': { score: 2, label: 'P2: Important', class: 'badge-p2' },
  'not-important-urgent': { score: 3, label: 'P3: Urgent', class: 'badge-p3' },
  'not-important-not-urgent': { score: 4, label: 'P4: Someday', class: 'badge-p4' }
}

export const STATUS_MAP = {
  wishlist: '💭 Wishlist',
  researching: '🔍 Researching',
  purchased: '✅ Purchased',
  canceled: '❌ Canceled'
}