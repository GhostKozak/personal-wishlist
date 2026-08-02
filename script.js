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

let currentEditID = null;
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
  let remainingInstallmentText = "";

  if (item.status === "purchased" && item.purchaseDate) {
    const totalInstallment = Number(item.installmentCount || 0);
    if (totalInstallment > 1) {
      const today = new Date();
      const purchasedDate = new Date(item.purchaseDate)
      const passedMonths = (today.getFullYear() - purchasedDate.getFullYear()) * 12 + (today.getMonth() - purchasedDate.getMonth());
      
      
      const remaining = Number(item.installmentCount) - passedMonths;
      
      remainingInstallmentText = remaining > 0
      ? `<br/><small style="color: var(--p2-blue)">Kalan : ${remaining} / ${totalInstallment} ay</small>`
      : `<br /><small style="color: var(--success)">Taksit Bitti 🎉</small>`
    }
  }

  return remainingInstallmentText;
}

const resetFormState = () => {
  FORM.reset();
  currentEditID = null;
  FORM.elements.submitBtn.textContent = 'Save to Wishlist';
  document.querySelector('section.form-section > h2').textContent = "Add New Item";
  FORM.elements.cancelBtn.disabled = true;
}

const calculateBudget = () => {
  
  const totalWishlistCost = wishlist
    .filter(item => item.status !== "canceled")
    .reduce((total, item) => total + Number(item.price), 0);

  const totalMonthlyInstallment = wishlist
    .filter(item => (Number(item.installmentCount) > 1 && item.status === "purchased"))
    .reduce((acc, item) => {
      acc += (Number(item.price) / Number(item.installmentCount || 1));
      return acc;
    }, 0);

  return {
    "wishlistTotal" : totalWishlistCost,
    "installmentTotal" : totalMonthlyInstallment
  };
}

FORM.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData(event.target);

  if (currentEditID !== null) {
    const oldItem = wishlist.find(item => item.id === currentEditID);

    const newUpdatedItem = {
      ...oldItem, // Değişikliğe uğramayan bütün alanları kopyalamak için, bu olmaz ise inputu bulunmuyan bütün alanlar kaybolur örnek: createdAt ve initialPrice
      ...Object.fromEntries(formData) // Formdan gelen yeni alanları eski alanların üzerine yazar.
    };
    
    const updatedWishlist = wishlist.map(item => {
      return item.id === currentEditID ? newUpdatedItem : item
    })

    wishlist = updatedWishlist;
  } else {
    const newWishlistItem = {
      id: crypto.randomUUID(), 
      initialPrice: formData.get('price'),
      createdAt: new Date().toLocaleDateString("tr-TR"),
      ...Object.fromEntries(formData)
    };

    wishlist.push(newWishlistItem);
  }
  
  updateWishlist(wishlist);
  resetFormState();
});

FORM.elements.cancelBtn.addEventListener('click', () => {resetFormState(); VIEW.scrollIntoView({ block: "center" })});

const renderWishlist = () => {
  const sortedList = [...wishlist].sort((a, b) => {
    const priorityA = getPriorityInfo(a.importance, a.urgency).score;
    const priorityB = getPriorityInfo(b.importance, b.urgency).score;
    return priorityA - priorityB;
  });

  VIEW.innerHTML = sortedList.map(element => {
    const priority = getPriorityInfo(element.importance, element.urgency);
    const priceDiff = Number(element.price) - Number(element.initialPrice || element.price);

    const diff = () => {
      if (priceDiff > 0) {
        return `<br><small class="priceDiff negative">▲ +${formatCurrency(priceDiff)} TL</small>`;
      } else if (priceDiff < 0) {
        // Math.abs() ile eksi işaretini çiftlemeyi önlüyoruz
        return `<br><small class="priceDiff positive">▼ -${formatCurrency(Math.abs(priceDiff))} TL</small>`;
      }
      return "";
    };

    return ` 
      <tr>
        <td>
          ${element.link ? `<a href="${element.link}" target="_blank" rel="noopener noreferrer">${element.name}</a>` : element.name}
          ${element.altLink ? `<a href="${element.altLink}" title="Alt Link" target="_blank" rel="noopener noreferrer">🔗</a>` : "" }  
          ${element.note ? `<br><small class="has-tooltip" data-tooltip="${element.note}">📝</small>` : ""}
        </td>
        <td>
          ${formatCurrency(element.price)} TL
          ${diff()}
        </td>
        <td>
          ${
            element.status === "purchased" ? 
            `${element.installmentCount > 1 ? 
              `Taksit <br><small>${formatCurrency(element.price / element.installmentCount)} TL/ay</small>` : "Peşin"}` 
            : "-"
          }
          ${calculateInstallmentDetails(element)}
        </td>
        <td><span class="badge ${priority.class}">${priority.label}</span></td>
        <td><small>${STATUS_MAP[element.status] || element.status}</small></td>
        <td>
          <button class="btn-edit" data-id="${element.id}">Edit</button>
          <button class="btn-delete" data-id="${element.id}">Delete</button>
        </td>
      </tr>
    `
  }).join('');
}

const renderSummaryCards = () => {
  const {wishlistTotal, installmentTotal} = calculateBudget();
  const count = wishlist.filter(item => (Number(item.installmentCount) > 1 && item.status === "purchased")).length;
  
  UI_TOTAL_PRICE.innerHTML = `${formatCurrency(wishlistTotal)} TL`;
  UI_MONTHLY_INSTALLMENT.innerHTML = `${formatCurrency(installmentTotal)} TL / monthly`;
  UI_INSTALLMENT_COUNT.innerHTML = `${count} Item`;
}

const updateWishlist = (updatedArray) => {
  wishlist = updatedArray;
  localStorage.setItem('myWishlist', JSON.stringify(wishlist));
  renderWishlist();
  renderSummaryCards();
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

VIEW.addEventListener('click', (event) => {
  if (event.target.classList.contains('btn-delete')) {
    const newWishlist = wishlist.filter(item => item.id !== event.target.dataset.id);
    updateWishlist(newWishlist)
  }
  if (event.target.classList.contains('btn-edit')) {
    // Edit func
    updateItem(event.target.dataset.id);
    FORM.scrollIntoView({ block: "center" });
  }  
})

window.addEventListener('DOMContentLoaded', () => {
  renderWishlist();
  renderSummaryCards();
});