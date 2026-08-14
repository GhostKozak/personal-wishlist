const UI_TOAST = document.getElementById('toast-container');
const UI_TOAST_TITLE = UI_TOAST.querySelector('.toast__title');
const UI_TOAST_MESSAGE = UI_TOAST.querySelector('.toast__message');
const UI_TOAST_TIMER_PROGRESS = UI_TOAST.querySelector('.toast__timer__progress');

const toastState = {
  timer: null,
  startTime: null,
  remainingTime: 0,
  defaultTime: 3000,
  isPaused: false
};

const showToastUI = () => UI_TOAST.classList.add('show');

const hideToastUI = () => {
  UI_TOAST.classList.remove('show');
  clearTimeout(toastState.timer);

  toastState.timer = null;
  toastState.startTime = null;
  toastState.remainingTime = 0;
  toastState.isPaused = false;
};

/**
 * İlerleme çubuğunun animasyonunu sıfırlayıp belirtilen süreye göre başlatır.
 * @param {number} durationMs - Animasyon süresi (milisaniye)
 */
const startProgressBar = (durationMs = toastState.remainingTime) => {
  UI_TOAST_TIMER_PROGRESS.style.animation = 'none';
  void UI_TOAST_TIMER_PROGRESS.offsetWidth; // Reflow tetikleyerek CSS animasyonunu sıfırla (Tarayıcıyı sıfırlamaya zorla)
  UI_TOAST_TIMER_PROGRESS.style.animation = `progressBasicAnimation ${durationMs}ms linear forwards`;
};

/**
 * Otomatik kapanma sayacını ve animasyonu başlatır.
 * @param {number} time - Kapanma süresi
 */
const startCloseTimer = (time = toastState.defaultTime) => {
  toastState.remainingTime = time;
  toastState.startTime = Date.now();
  toastState.isPaused = false;

  clearTimeout(toastState.timer);
  toastState.timer = setTimeout(hideToastUI, toastState.remainingTime);

  startProgressBar(toastState.remainingTime);
};

const pauseTimer = () => {
  if (!toastState.startTime) return;

  clearTimeout(toastState.timer);
  const elapsedTime = Date.now() - toastState.startTime;
  toastState.remainingTime = Math.max(0, toastState.remainingTime - elapsedTime);
  toastState.isPaused = true;
};

const resumeTimer = () => {
  if (!toastState.isPaused) return;
  if (toastState.remainingTime <= 0) return hideToastUI();

  toastState.startTime = Date.now();
  toastState.isPaused = false;
  toastState.timer = setTimeout(hideToastUI, toastState.remainingTime);
};

/**
 * Yeni bir toast bildirimi oluşturur ve ekranda başlatır.
 * @param {string} title - Bildirim başlığı
 * @param {string} message - Bildirim mesajı
 * @param {number} [duration] - İsteğe bağlı özel süre
 */
const createToast = (title, message, duration = toastState.defaultTime) => {
  UI_TOAST_TITLE.innerText = title;
  UI_TOAST_MESSAGE.innerText = message;

  showToastUI();
  startCloseTimer(duration);
};

UI_TOAST.addEventListener('mouseenter', pauseTimer);
UI_TOAST.addEventListener('mouseleave', resumeTimer);