const UI_CONFIRM_MODAL = document.getElementById('confirm-modal');
const UI_CONFIRM_MODAL_MESSAGE = UI_CONFIRM_MODAL.querySelector('.confirm-message');
const UI_CONFIRM_MODAL_CONFIRMBTN = UI_CONFIRM_MODAL.querySelector('.confirmBtn');
const UI_CONFIRM_MODAL_CANCELBTN = UI_CONFIRM_MODAL.querySelector('.cancelBtn');

/**
 *
 *
 * @param {*} {message = "Emin misiniz?"}
 * @return {*} 
 */
const showConfirm = ({message = "Emin misiniz?"}) => {

  if (UI_CONFIRM_MODAL_MESSAGE) UI_CONFIRM_MODAL_MESSAGE.textContent = message;
  UI_CONFIRM_MODAL.showModal();

  return new Promise((resolve) => {
    function returnValue (value) {
      UI_CONFIRM_MODAL_CONFIRMBTN.removeEventListener('click', onConfirm);
      UI_CONFIRM_MODAL_CANCELBTN.removeEventListener('click', onCancel);
      window.removeEventListener('keydown', onKeyDown);
      UI_CONFIRM_MODAL.removeEventListener('click', onBackdropClick);

      UI_CONFIRM_MODAL.close();

      console.log(value);
      resolve(value);
    }

    UI_CONFIRM_MODAL.addEventListener('close', () => {
      resolve(UI_CONFIRM_MODAL.returnValue === 'true');
    }, { once: true });

    const onConfirm = () => returnValue(true);
    const onCancel = () => returnValue(false);
    const onKeyDown = (e) => { if (e.key === 'Escape') returnValue(false) }
    const onBackdropClick = (e) => { if (e.target === UI_CONFIRM_MODAL) returnValue(false) }

    UI_CONFIRM_MODAL_CONFIRMBTN.addEventListener('click', onConfirm, { once : true });
    UI_CONFIRM_MODAL_CANCELBTN.addEventListener('click', onCancel, { once : true });
    window.addEventListener('keydown', onKeyDown, { once : true });
    UI_CONFIRM_MODAL.addEventListener('click', onBackdropClick, { once : true });
  });
}