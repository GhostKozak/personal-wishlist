const UI_TOAST = document.getElementById('toast-container');
const UI_TOAST_TITLE = UI_TOAST.querySelector('.toast__title');
const UI_TOAST_MESSAGE = UI_TOAST.querySelector('.toast__message');
const UI_TOAST_TIMER_PROGRESS = UI_TOAST.querySelector('.toast__timer__progress');

const TOAST_STATE = {
  timer: null,
  startTime: null,
  remainingTime: 0,
  defaultTime: 3000,
  isPaused: false
};

const TOAST_TYPES = {
  success: { icon: '✔️', className: 'toast-success' },
  error:   { icon: '❌', className: 'toast-error' },
  warning: { icon: '⚠️', className: 'toast-warning' },
  info:    { icon: '❕', className: 'toast-info' }
};

const ALL_TOAST_CLASSES = Object.values(TOAST_TYPES).map(t => t.className);

const showToastUI = () => UI_TOAST.classList.add('show');

const hideToastUI = () => {
  UI_TOAST.classList.remove('show', ...ALL_TOAST_CLASSES);
  clearTimeout(TOAST_STATE.timer);

  TOAST_STATE.timer = null;
  TOAST_STATE.startTime = null;
  TOAST_STATE.remainingTime = 0;
  TOAST_STATE.isPaused = false;
};

/**
 * İlerleme çubuğunun animasyonunu sıfırlayıp belirtilen süreye göre başlatır.
 * @param {number} durationMs - Animasyon süresi (milisaniye)
 */
const startProgressBar = (durationMs = TOAST_STATE.remainingTime) => {
  UI_TOAST_TIMER_PROGRESS.style.animation = 'none';
  void UI_TOAST_TIMER_PROGRESS.offsetWidth; // Reflow tetikleyerek CSS animasyonunu sıfırla (Tarayıcıyı sıfırlamaya zorla)
  UI_TOAST_TIMER_PROGRESS.style.animation = `progressBasicAnimation ${durationMs}ms linear forwards`;
};

/**
 * Otomatik kapanma sayacını ve animasyonu başlatır.
 * @param {number} time - Kapanma süresi
 */
const startCloseTimer = (time = TOAST_STATE.defaultTime) => {
  TOAST_STATE.remainingTime = time;
  TOAST_STATE.startTime = Date.now();
  TOAST_STATE.isPaused = false;

  clearTimeout(TOAST_STATE.timer);
  TOAST_STATE.timer = setTimeout(hideToastUI, TOAST_STATE.remainingTime);

  startProgressBar(TOAST_STATE.remainingTime);
};

const pauseTimer = () => {
  if (!TOAST_STATE.startTime) return;

  clearTimeout(TOAST_STATE.timer);
  const elapsedTime = Date.now() - TOAST_STATE.startTime;
  TOAST_STATE.remainingTime = Math.max(0, TOAST_STATE.remainingTime - elapsedTime);
  TOAST_STATE.isPaused = true;
};

const resumeTimer = () => {
  if (!TOAST_STATE.isPaused) return;
  if (TOAST_STATE.remainingTime <= 0) return hideToastUI();

  TOAST_STATE.startTime = Date.now();
  TOAST_STATE.isPaused = false;
  TOAST_STATE.timer = setTimeout(hideToastUI, TOAST_STATE.remainingTime);
};

/**
 * Yeni bir toast bildirimi oluşturur ve ekranda başlatır.
 * @param {string} title - Bildirim başlığı
 * @param {string} message - Bildirim mesajı
 * @param {number} [duration] - İsteğe bağlı özel süre
 */
const createToast = ({
  iconless = false,
  type = 'info',
  title, 
  message, 
  duration = TOAST_STATE.defaultTime
}) => {
  const currentType = TOAST_TYPES[type] || TOAST_TYPES.info;

  UI_TOAST.classList.remove(...ALL_TOAST_CLASSES);
  UI_TOAST.classList.add(currentType.className);

  const displayTitle = title || currentType.defaultTitle;
  UI_TOAST_TITLE.innerText = iconless ? displayTitle : `${currentType.icon} ${displayTitle}`;
  UI_TOAST_MESSAGE.innerText = message;

  showToastUI();
  startCloseTimer(duration);
};

UI_TOAST.addEventListener('mouseenter', pauseTimer);
UI_TOAST.addEventListener('mouseleave', resumeTimer);