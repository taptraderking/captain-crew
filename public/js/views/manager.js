const ManagerView = {
  currentTab: 'approvals',

  async render() {
    return `
      <div class="topbar">
        <div class="topbar-left"><span class="topbar-icon">📦</span><div><div class="topbar-title">Manager Panel</div><div class="topbar-sub">Approvals · Purchases · Production</div></div></div>
        <button class="topbar-btn" onclick="App.logout()">Logout</button>
      </div>
      <div class="content" id="mgr-content">${UI.loading()}</div>
      <nav class="bottom-nav">
        <button class="nav-item active" data-tab="approvals"><span class="nav-icon">✅</span><span class="nav-label">Approve</span></button>
        <button class="nav-item" data-tab="production"><span class="nav-icon">🏭</span><span class="nav-label">Production</span></button>
        <button class="nav-item" data-tab="activity"><span class="nav-icon">🔔</span><span class="nav-label">Activity</span></button>
        <button class="nav-item" data-tab="logs"><span class="nav-icon">📋</span><span class="nav-label">All Logs</span></button>
      </nav>`;
  },

  async init() {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        ManagerView.currentTab = btn.dataset.tab;
        ManagerView.renderTab();
      });
    });
    ManagerView.renderTab();
  },

  renderTab() {
    const c = document.getElementById('mgr-content');
    const fn = { approvals: ManagerView.renderApprovals, production: ManagerView.renderProduction, activity: ManagerView.renderActivityTab, logs: ManagerView.renderLogs }[ManagerView.currentTab] || ManagerView.renderApprovals;
    c.innerHTML = '<div class="reveal">' + fn() + '</div>';
    ManagerView.attachEvents();
    if (ManagerView.currentTab === 'approvals') ManagerView.loadApprovals();
    if (ManagerView.currentTab === 'activity') ManagerView.loadActivity();
    if (ManagerView.currentTab === 'logs') ManagerView.loadLogs();
  },

  renderApprovals() {
    return `${UI.sectionTitle('✅ Purchase Approvals')}
      <div style="font-size:12px;color:var(--text-faint);margin-bottom:16px">Accountant logs raw material purchases → you approve or reject here.</div>
      <button class="btn btn-secondary btn-sm" id="btn-refresh-approvals" style="margin-bottom:12px">↻ Refresh</button>
      <div id="approval-list">${UI.loading('Loading purchases...')}</div>`;
  },

  async loadApprovals() {
    try {
      const d = await API.getPurchaseLog();
      const el = document.getElementById('approval-list');
      if (el) {
        el.innerHTML = UI.purchaseApprovalList(d.data);
        // Attach approve/reject buttons
        el.querySelectorAll('.approve-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            btn.disabled = true; btn.textContent = '...';
            try { await API.approvePurchase(btn.dataset.row); UI.toast('Approved!', 'success'); ManagerView.loadApprovals(); }
            catch (e) { UI.toast(e.message, 'error'); btn.disabled = false; btn.textContent = '✓ Approve'; }
          });
        });
        el.querySelectorAll('.reject-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            if (!await UI.confirm('Reject Purchase', 'Are you sure you want to reject this purchase?')) return;
            btn.disabled = true;
            try { await API.rejectPurchase(btn.dataset.row); UI.toast('Rejected', 'info'); ManagerView.loadApprovals(); }
            catch (e) { UI.toast(e.message, 'error'); btn.disabled = false; }
          });
        });
      }
    } catch (e) { const el = document.getElementById('approval-list'); if (el) el.innerHTML = UI.alert('Error', e.message, 'warning'); }
  },

  renderProduction() {
    return `${UI.sectionTitle('🏭 Log Daily Production')}
      <form id="prod-form" class="card">
        ${UI.formField('Date', UI.input('pd-date', { type: 'date', value: Utils.today(), required: true }))}
        <div class="grid-2">
          ${UI.formField('💧 Reg 1L', UI.input('pd-r1', { type: 'number', placeholder: '0', min: '0' }))}
          ${UI.formField('💦 Reg 500ml', UI.input('pd-r5', { type: 'number', placeholder: '0', min: '0' }))}
        </div>
        <div class="grid-2">
          ${UI.formField('🏨 Cust 1L', UI.input('pd-c1', { type: 'number', placeholder: '0', min: '0' }))}
          ${UI.formField('🍽️ Cust 500ml', UI.input('pd-c5', { type: 'number', placeholder: '0', min: '0' }))}
        </div>
        ${UI.formField('🚂 DaV Aqua 1L', UI.input('pd-dv', { type: 'number', placeholder: '0', min: '0' }))}
        <div id="pd-total" style="padding:10px;background:rgba(255,255,255,0.03);border-radius:10px;margin-bottom:12px;font-size:14px;font-weight:600">Total: <span style="color:var(--cyan)">0</span> packets</div>
        ${UI.formField('Notes', UI.textarea('pd-notes', { placeholder: 'Shift details...', rows: 2 }))}
        <button type="submit" class="btn btn-primary">✓ Log Production</button>
      </form>`;
  },

  renderActivityTab() {
    return `${UI.sectionTitle('🔔 Live Activity')}
      <button class="btn btn-secondary btn-sm" id="btn-refresh-activity" style="margin-bottom:12px">↻ Refresh</button>
      <div id="mgr-feed">${UI.loading()}</div>`;
  },

  async loadActivity() {
    try {
      const d = await API.activity();
      const el = document.getElementById('mgr-feed');
      if (el) {
        let h = `<div class="stats-row">
          <div class="stat-chip"><span class="stat-num" style="color:var(--green)">${d.counts.sales||0}</span><span class="stat-label">Sales</span></div>
          <div class="stat-chip"><span class="stat-num" style="color:var(--blue)">${d.counts.purchases||0}</span><span class="stat-label">Purchases</span></div>
          <div class="stat-chip"><span class="stat-num" style="color:var(--red)">${d.counts.expenses||0}</span><span class="stat-label">Expenses</span></div>
          <div class="stat-chip"><span class="stat-num" style="color:var(--cyan)">${d.counts.production||0}</span><span class="stat-label">Production</span></div>
        </div>`;
        h += UI.activityFeed(d.feed);
        el.innerHTML = h;
      }
    } catch (e) { const el = document.getElementById('mgr-feed'); if (el) el.innerHTML = UI.alert('Error', e.message, 'warning'); }
  },

  renderLogs() {
    return `${UI.sectionTitle('📋 All Business Logs')}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
        <button class="btn btn-sm btn-secondary log-tab active" data-log="sales">💰 Sales</button>
        <button class="btn btn-sm btn-secondary log-tab" data-log="purchases">📦 Purchases</button>
        <button class="btn btn-sm btn-secondary log-tab" data-log="expenses">💸 Expenses</button>
        <button class="btn btn-sm btn-secondary log-tab" data-log="production">🏭 Production</button>
      </div><div id="mgr-log-content">${UI.loading()}</div>`;
  },

  async loadLogs() {
    document.querySelectorAll('.log-tab').forEach(t => t.addEventListener('click', () => {
      document.querySelectorAll('.log-tab').forEach(b => b.classList.remove('active'));
      t.classList.add('active');
      ManagerView.showLog(t.dataset.log);
    }));
    ManagerView.showLog('sales');
  },

  async showLog(type) {
    const el = document.getElementById('mgr-log-content'); if (!el) return;
    el.innerHTML = UI.loading();
    try {
      const loaders = { sales: API.getSalesLog, purchases: API.getPurchaseLog, expenses: API.getExpenseLog, production: API.getProductionLog };
      const headers = { sales: ['Date','SKU','Qty','Price','Revenue','Customer','Payment','Notes','By','Time'], purchases: ['Date','Material','Supplier','Qty','Unit','Rate','Total','GST','Total+GST','Status','Notes','By','Time'], expenses: ['Date','Category','Desc','Amount','Payment','Notes','By','Time'], production: ['Date','R1L','R500','C1L','C500','DaV','Total','Notes','By','Time'] };
      const d = await loaders[type]();
      el.innerHTML = '<div class="card">' + UI.logTable(headers[type], d.data, { limit: 30 }) + '</div>';
    } catch (e) { el.innerHTML = UI.alert('Error', e.message, 'warning'); }
  },

  attachEvents() {
    const $ = id => document.getElementById(id);
    const btn = (id, fn) => { const e = $(id); if (e) e.onclick = fn; };
    btn('btn-refresh-approvals', () => ManagerView.loadApprovals());
    btn('btn-refresh-activity', () => ManagerView.loadActivity());

    const prodForm = $('prod-form');
    if (prodForm) {
      const calc = () => {
        const t = ['pd-r1','pd-r5','pd-c1','pd-c5','pd-dv'].reduce((s,id) => s + (+($(id)?.value)||0), 0);
        $('pd-total').innerHTML = `Total: <span style="color:var(--cyan)">${Utils.num(t)}</span> packets`;
      };
      ['pd-r1','pd-r5','pd-c1','pd-c5','pd-dv'].forEach(id => $(id)?.addEventListener('input', calc));
      prodForm.onsubmit = async e => {
        e.preventDefault();
        if (!await UI.confirm('Log Production', 'Submit production data?')) return;
        try {
          await API.logProduction({ date: $('pd-date').value, reg1l: +($('pd-r1').value||0), reg500: +($('pd-r5').value||0), cust1l: +($('pd-c1').value||0), cust500: +($('pd-c5').value||0), dav1l: +($('pd-dv').value||0), notes: $('pd-notes').value });
          UI.toast('Production logged!', 'success'); prodForm.reset(); $('pd-date').value = Utils.today();
        } catch (e) { UI.toast(e.message, 'error'); }
      };
    }
  }
};
