const LoginView = {
  render() {
    return `
      <div class="login-wrapper">
        <div class="login-card">
          <div class="login-logo">
            <span class="icon">💧</span>
            <h1>Captain Crew</h1>
            <p>Water Business Operations</p>
          </div>
          <div id="login-error" style="display:none" class="login-error"></div>
          <form id="login-form">
            ${UI.formField('Username', UI.input('username', { placeholder: 'Enter your username', required: true }), 'username')}
            ${UI.formField('Password', UI.input('password', { type: 'password', placeholder: 'Enter your password', required: true }), 'password')}
            <button type="submit" class="btn btn-primary" id="login-btn" style="margin-top:6px">Sign In →</button>
          </form>
          <div style="margin-top:20px;text-align:center;font-size:11px;color:var(--text-faint);letter-spacing:0.5px">
            CAPTAINPROOF F&B PVT. LTD. · JHARKHAND
          </div>
        </div>
      </div>`;
  },

  init() {
    const form = document.getElementById('login-form');
    const err = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.style.display = 'none';
      btn.disabled = true; btn.textContent = 'Signing in...';
      try {
        await API.login(document.getElementById('username').value.trim(), document.getElementById('password').value);
        App.init();
      } catch (ex) {
        err.textContent = ex.message || 'Invalid credentials';
        err.style.display = 'block';
        btn.disabled = false; btn.textContent = 'Sign In →';
      }
    });
  }
};
