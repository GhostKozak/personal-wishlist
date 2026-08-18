const UI_CONFIRM_MODAL = document.getElementById('confirm-modal');
const UI_CONFIRM_MODAL_MESSAGE = UI_CONFIRM_MODAL.querySelector('.confirm-message');
const UI_CONFIRM_MODAL_CONFIRMBTN = UI_CONFIRM_MODAL.querySelector('.confirmBtn');
const UI_CONFIRM_MODAL_CANCELBTN = UI_CONFIRM_MODAL.querySelector('.cancelBtn');

/**
 * @param {Object} options
 * @param {string} [options.message="Emin misiniz?"]
 * @param {HTMLElement} [options.targetElement] - Tıklanan buton
 * @returns {Promise<boolean>}
 */
const showConfirm = ({message = "Emin misiniz?", targetElement = null}) => {
  if (!UI_CONFIRM_MODAL) return Promise.resolve(false);
  if (UI_CONFIRM_MODAL_MESSAGE) UI_CONFIRM_MODAL_MESSAGE.textContent = message;

  UI_CONFIRM_MODAL.showModal();

  if (targetElement) {
    const rect = targetElement.getBoundingClientRect();
    UI_CONFIRM_MODAL.style.position = 'fixed';
    UI_CONFIRM_MODAL.style.margin = '0';
    // Butonun 8px üstüne ve ortalayarak yerleştir:
    UI_CONFIRM_MODAL.style.top = `${rect.top - 70}px`; 
    UI_CONFIRM_MODAL.style.left = `${rect.left - 0}px`;
  }

  return new Promise((resolve) => {
    const controller = new AbortController();
    const { signal } = controller;

    const finish = (value) => {
      controller.abort();
      UI_CONFIRM_MODAL.close();
      resolve(value);
    };

    UI_CONFIRM_MODAL_CONFIRMBTN?.addEventListener('click', () => finish(true), { signal });
    UI_CONFIRM_MODAL_CANCELBTN?.addEventListener('click', () => finish(false), { signal });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') finish(false); }, { signal });
    UI_CONFIRM_MODAL.addEventListener('click', (e) => { if (e.target === UI_CONFIRM_MODAL) finish(false); }, { signal });
  });
}