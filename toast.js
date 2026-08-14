const UI_TOAST = document.getElementById('toast-container');
const UI_TOAST_TITLE = UI_TOAST.querySelector('.toast__title');
const UI_TOAST_MESSAGE = UI_TOAST.querySelector('.toast__message');
const UI_TOAST_TIMER_PROGRESS = UI_TOAST.querySelector('.toast__timer__progress');

let toast = {
  timer: null,
  startTime: null,
  remainingTime: null,
  defaultTime: 3000
}

const toastCloseTimer = (time = toast.defaultTime) => {
  toast.remainingTime = time;
  toast.startTime = Date.now();

  toast.timer = setTimeout(() => toastClose(), toast.remainingTime);

  UI_TOAST_TIMER_PROGRESS.style.animation = 'none'; // Önce animasyonu sök
  void UI_TOAST_TIMER_PROGRESS.offsetWidth;         // Reflow (Tarayıcıyı sıfırlamaya zorla)
  UI_TOAST_TIMER_PROGRESS.style.animation = `progressBasicAnimation ${time}ms linear forwards`;
}

UI_TOAST.addEventListener('mouseenter', () => {
  clearTimeout(toast.timer);
  const elapsedTime = Date.now() - toast.startTime;
  toast.remainingTime = toast.remainingTime - elapsedTime;
})

UI_TOAST.addEventListener('mouseleave', () => {
  toast.startTime = Date.now()
  toast.timer = setTimeout(() => toastClose(), toast.remainingTime);
})

const toastCreate = (title, message) => {
  clearTimeout(toast.timer);
  
  UI_TOAST_TITLE.innerText = title;
  UI_TOAST_MESSAGE.innerText = message;
  toastShow();
  toastCloseTimer();
}

const toastClose = () => {
  UI_TOAST.classList.remove('show');
}

const toastShow = () => {
  UI_TOAST.classList.add('show');
}