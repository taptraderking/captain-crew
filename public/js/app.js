const App = {
  user: null,

  async init() {
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
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
