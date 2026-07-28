/**
 * @typedef {Object} WishlistItem
 * @property {string} id - Crypto UUID
 * @property {string} name - Ürün adı
 * @property {string} [link] - Ürün linki
 * @property {string} price - Ürün fiyatı
 * @property {'important' | 'not-important'} importance - Öncelik durumu
 * @property {'urgent' | 'not-urgent'} urgency - Aciliyet durumu
 * @property {'on'} [isInstallment] - Checkbox işaretli ise 'on' gelir
 * @property {string} [installmentCount] - Taksit sayısı
 */

const FORM = document.getElementById('wishlist-form');
const VIEW = document.getElementById('wishlist-view');
const TotalPrice = document.getElementById('total-price');
const MonthlyInstallment = document.getElementById('monthly-installment');
const InstallmentCount = document.getElementById('installment-count');

let currentEditID = null;

/** @type {WishlistItem[]} */
let wishlist = JSON.parse(localStorage.getItem('myWishlist')) || [];

const formatCurrency = (price) => {
  return Number(price || 0).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const getPriorityInfo = (importance, urgency) => {
  if (importance === 'important' && urgency === 'urgent') {
    return { score: 1, label: 'P1: Urgent & Important', class: 'badge-p1' };
  }
  if (importance === 'important' && urgency === 'not-urgent') {
    return { score: 2, label: 'P2: Important', class: 'badge-p2' };
  }
  if (importance === 'not-important' && urgency === 'urgent') {
    return { score: 3, label: 'P3: Urgent', class: 'badge-p3' };
  }

  return { score: 4, label: 'P4: Someday', class: 'badge-p4' };
}

const resetFormState = () => {
  FORM.reset();
  currentEditID = null;
  FORM.elements.submitBtn.textContent = 'Save to Wishlist';
  document.querySelector('section.form-section > h2').textContent = "Add New Item";
  FORM.elements.cancelBtn.disabled = true;
}

const calculateBudget = () => {
  
  const totalWishlistCost = wishlist.reduce((total, item) => {
    return total + Number(item.price);
  }, 0);

  const totalMonthlyInstallment = wishlist.filter(item => item.isInstallment === "on").reduce((acc, item) => {
    acc += (Number(item.price) / Number(item.installmentCount));
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
    const newUpdatedItem = {
      id: currentEditID,
      ...Object.fromEntries(formData)
    };
    
    const updatedWishlist = wishlist.map(item => {
      return item.id === currentEditID ? newUpdatedItem : item
    })

    wishlist = updatedWishlist;
  } else {
    const newWishlistItem = {
      id: crypto.randomUUID(), 
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

    return ` 
      <tr>
        <td>${element.name}</td>
        <td>${formatCurrency(element.price)} TL</td>
        <td>${element.isInstallment == "on" ? `${element.installmentCount} Taksit <br><small>(${formatCurrency(element.price / element.installmentCount)} TL/ay)</small>` : "Peşin"}</td>
        <td><span class="badge ${priority.class}">${priority.label}</span></td>
        <td>${element.link ? `<a href="${element.link}" target="_blank" rel="noopener noreferrer">Link</a>` : '-'}</td>
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
  const Count = wishlist.filter(item => item.isInstallment === "on").length;
  
  TotalPrice.innerHTML = `${formatCurrency(wishlistTotal)} TL`;
  MonthlyInstallment.innerHTML = `${formatCurrency(installmentTotal)} TL / monthly`;
  InstallmentCount.innerHTML = `${Count} Item`;
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
  FORM.elements.importance.value = editItem.importance;
  FORM.elements.urgency.value = editItem.urgency;
  FORM.elements.isInstallment.checked = editItem.isInstallment === "on";
  FORM.elements.installmentCount.value = editItem.installmentCount;
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