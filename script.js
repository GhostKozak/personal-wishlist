const FORM = document.getElementById('wishlist-form');
const VIEW = document.getElementById('wishlist-view');
const TotalPrice = document.getElementById('total-price');
const MonthlyInstallment = document.getElementById('monthly-installment');
const InstallmentCount = document.getElementById('installment-count');


let wishlist = JSON.parse(localStorage.getItem('myWishlist')) || [];

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
  const newWishlistItem = {
    id: crypto.randomUUID(), 
    ...Object.fromEntries(formData)
  };

  wishlist.push(newWishlistItem);
  updateWishlist(wishlist);
  FORM.reset();
});

const renderWishlist = () => {
  const sortedList = [...wishlist].sort((a, b) => {
    const priorityA = getPriorityInfo(a.importance, a.urgency).score;
    const priorityB = getPriorityInfo(b.importance, b.urgency).score;
    return priorityA - priorityB;
  });

  VIEW.innerHTML = sortedList.map(element => {
    const priority = getPriorityInfo(element.importance, element.urgency);
    const formattedPrice = element.price ? `${Number(element.price).toLocaleString('tr-TR')} TL` : '-';

    return ` 
      <tr>
        <td>${element.name}</td>
        <td>${formattedPrice}</td>
        <td>${element.isInstallment == "on" ? "Taksit" : "Peşin"}</td>
        <td><span class="badge ${priority.class}">${priority.label}</span></td>
        <td>${element.link ? `<a href="${element.link}" target="_blank" rel="noopener noreferrer">Link</a>` : '-'}</td>
        <td><button class="btn-delete" data-id="${element.id}">Delete</button></td>
      </tr>
    `
  }).join('');
}

const renderSummaryCards = () => {
  const {wishlistTotal, installmentTotal} = calculateBudget();
  const Count = wishlist.filter(item => item.isInstallment === "on").length;
  
  TotalPrice.innerHTML = `${wishlistTotal.toLocaleString('tr-TR')} TL`;
  MonthlyInstallment.innerHTML = `${installmentTotal.toLocaleString('tr-TR')} TL / monthly`;
  InstallmentCount.innerHTML = `${Count} Item`;
}

const updateWishlist = (updatedArray) => {
  wishlist = updatedArray;
  localStorage.setItem('myWishlist', JSON.stringify(wishlist));
  renderWishlist();
  renderSummaryCards();
}

VIEW.addEventListener('click', (event) => {
  if (event.target.classList.contains('btn-delete')) {
    const newWishlist = wishlist.filter(item => item.id !== event.target.dataset.id);
    updateWishlist(newWishlist)
  }
})

window.addEventListener('DOMContentLoaded', () => {
  renderWishlist();
  renderSummaryCards();
});