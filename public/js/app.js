const App = {
  user: null,
  deferredInstallPrompt: null,

  async init() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Capture PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      App.deferredInstallPrompt = e;
      App.showInstallBanner();
    });

    try {
      const session = await API.me();
      if (session.authenticated) {
        App.user = session.user;
        await App.renderForRole(session.user.role);
      } else {
        App.renderLogin();
      }
    } catch {
      App.renderLogin();
    }
  },

  renderLogin() {
    document.getElementById('app').innerHTML = LoginView.render();
    LoginView.init();
  },

  async renderForRole(role) {
    const views = { owner: OwnerView, manager: ManagerView, accountant: AccountantView };
    const view = views[role] || views.owner;
    document.getElementById('app').innerHTML = await view.render();
    await view.init();
  },

  async logout() {
    try { await API.logout(); } catch {}
    App.user = null;
    App.renderLogin();
  },

  showInstallBanner() {
    const banner = document.getElementById('install-banner');
    if (!banner) return;
    banner.style.display = 'block';

    document.getElementById('install-dismiss').onclick = () => {
      banner.style.display = 'none';
    };

    document.getElementById('install-accept').onclick = async () => {
      banner.style.display = 'none';
      if (App.deferredInstallPrompt) {
        App.deferredInstallPrompt.prompt();
        const result = await App.deferredInstallPrompt.userChoice;
        App.deferredInstallPrompt = null;
        if (result.outcome === 'accepted') {
          UI.toast('App installed!', 'success');
        }
      }
    };
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
