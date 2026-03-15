// ─── LOGIN VIEW ──────────────────────────────────────────────────────────────
const LoginView = {
  render() {
    return `
      <div class="login-wrapper">
        <div class="login-card">
          <div class="login-logo">
            <span class="icon">🚰</span>
            <h1>Captain Crew</h1>
            <p>Water Business Operations</p>
          </div>
          <div id="login-error" style="display:none" class="login-error"></div>
          <form id="login-form">
            ${UI.formField('Username', UI.input('username', { placeholder: 'Enter username', required: true }), 'username')}
            ${UI.formField('Password', UI.input('password', { type: 'password', placeholder: 'Enter password', required: true }), 'password')}
            <button type="submit" class="btn btn-primary" id="login-btn">Sign In</button>
          </form>
          <div style="margin-top:16px;text-align:center;font-size:12px;color:var(--text-muted)">
            Jharkhand, India · Captainproof F&B Pvt. Ltd.
          </div>
        </div>
      </div>
    `;
  },

  init() {
    const form = document.getElementById('login-form');
    const errorDiv = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorDiv.style.display = 'none';
      btn.disabled = true;
      btn.textContent = 'Signing in...';

      try {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        await API.login(username, password);
        App.init(); // Re-initialize the app
      } catch (err) {
        errorDiv.textContent = err.message || 'Invalid credentials';
        errorDiv.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Sign In';
      }
    });
  }
};
