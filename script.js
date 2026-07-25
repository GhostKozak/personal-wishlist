const FORM = document.getElementById('wishlist-form');
const VIEW = document.getElementById('wishlist-view');

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
  // Monitör senaryosu: Not Important & Not Urgent
  return { score: 4, label: 'P4: Someday', class: 'badge-p4' };
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

  const priority = getPriorityInfo(element.importance, element.urgency);
  const formattedPrice = element.price ? `${Number(element.price).toLocaleString('tr-TR')} TL` : '-';

  VIEW.innerHTML = sortedList.map(element => `
    <tr>
      <td>${element.name}</td>
      <td>${formattedPrice}</td>
        <td><span class="badge ${priority.class}">${priority.label}</span></td>
      <td>${element.link ? `<a href="${element.link}" target="_blank" rel="noopener noreferrer">Link</a>` : '-'}</td>
      <td><button class="btn-delete" data-id="${element.id}">Delete</button></td>
    </tr>
  `).join('');
}

const updateWishlist = (updatedArray) => {
  wishlist = updatedArray;
  localStorage.setItem('myWishlist', JSON.stringify(wishlist));
  renderWishlist();
}

VIEW.addEventListener('click', (event) => {
  if (event.target.classList.contains('btn-delete')) {
    const newWishlist = wishlist.filter(item => item.id !== event.target.dataset.id);
    updateWishlist(newWishlist)
  }
})

window.addEventListener('DOMContentLoaded', renderWishlist);