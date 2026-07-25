const FORM = document.getElementById('wishlist-form');
const VIEW = document.getElementById('wishlist-view');

let wishlist = JSON.parse(localStorage.getItem('myWishlist')) || [];

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
  VIEW.innerHTML = wishlist.map(element => `
    <tr>
      <td>${element.name}</td>
      <td>${element.price}</td>
      <td><a href="${element.link}">Link</a></td>
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