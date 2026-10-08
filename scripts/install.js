const installButton = document.getElementById('install-app-btn');
const standaloneMedia = window.matchMedia('(display-mode: standalone)');
let deferredInstallPrompt = null;

const isAppInstalled = () =>
  standaloneMedia.matches || navigator.standalone === true;

const hideInstallButton = () => {
  if (installButton) installButton.hidden = true;
};

if (installButton) {
  if (isAppInstalled()) {
    hideInstallButton();
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    if (isAppInstalled()) return;

    deferredInstallPrompt = event;
    installButton.hidden = false;
  });

  installButton.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;

    installButton.disabled = true;
    try {
      const promptEvent = deferredInstallPrompt;
      deferredInstallPrompt = null;
      await promptEvent.prompt();
      await promptEvent.userChoice;
      hideInstallButton();
    } catch (error) {
      console.error('Could not open the app installation prompt.', error);
      hideInstallButton();
    } finally {
      installButton.disabled = false;
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    hideInstallButton();
  });

  standaloneMedia.addEventListener('change', event => {
    if (event.matches) {
      deferredInstallPrompt = null;
      hideInstallButton();
    }
  });
}
