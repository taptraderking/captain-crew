const OwnerView = {
  data: null, liveMode: false, currentTab: 'home',

  async render() {
    return `
      <div class="topbar">
        <div class="topbar-left"><span class="topbar-icon">💧</span><div><div class="topbar-title">Captain Crew</div><div class="topbar-sub" id="topbar-sub">Connecting...</div></div></div>
        <button class="topbar-btn" onclick="App.logout()">Logout</button>
      </div>
      <div class="content" id="owner-content">${UI.loading('Connecting...')}</div>
      <nav class="bottom-nav">
        <button class="nav-item active" data-tab="home"><span class="nav-icon">📊</span><span class="nav-label">Home</span></button>
        <button class="nav-item" data-tab="activity"><span class="nav-icon">🔔</span><span class="nav-label">Activity</span></button>
        <button class="nav-item" data-tab="logs"><span class="nav-icon">📋</span><span class="nav-label">Logs</span></button>
        <button class="nav-item" data-tab="config"><span class="nav-icon">⚙️</span><span class="nav-label">Config</span></button>
      </nav>`;
  },

  async init() {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        OwnerView.currentTab = btn.dataset.tab;
        OwnerView.renderTab();
      });
    });
    try {
      OwnerView.data = await API.dashboard();
      OwnerView.liveMode = !!OwnerView.data.live;
      document.getElementById('topbar-sub').textContent = OwnerView.liveMode ? '● Live · Sheets connected' : 'Demo mode';
    } catch (err) { OwnerView.data = {}; document.getElementById('topbar-sub').textContent = 'Error'; OwnerView.showError(err.message); return; }
    OwnerView.renderTab();
  },

  async showError(msg) {
    const c = document.getElementById('owner-content');
    let dbg = '';
    try { const d = await API.debug(); dbg = `<div class="debug-box">${Object.entries(d.checks).map(([k,v])=>`<span class="${v?'ok':'fail'}">${k}: ${v?'✅':'❌'}</span>`).join('\n')}${d.details.error?'\n<span class="fail">'+d.details.error+'</span>':''}</div>`; } catch(e) { dbg = ''; }
    c.innerHTML = `<div class="reveal">${UI.alert('Connection Failed', msg, 'critical')}${dbg}<div style="display:flex;gap:10px;margin-top:16px"><button class="btn btn-primary btn-sm" onclick="OwnerView.init()">Retry</button><button class="btn btn-secondary btn-sm" onclick="OwnerView.data={};OwnerView.renderTab()">Demo</button></div></div>`;
  },

  renderTab() {
    const c = document.getElementById('owner-content');
    const fn = { home: OwnerView.renderHome, activity: OwnerView.renderActivity, logs: OwnerView.renderLogs, config: OwnerView.renderConfig }[OwnerView.currentTab] || OwnerView.renderHome;
    c.innerHTML = '<div class="reveal">' + fn() + '</div>';
    OwnerView.attachEvents();
    if (OwnerView.currentTab === 'activity') OwnerView.loadActivity();
    if (OwnerView.currentTab === 'logs') OwnerView.loadLogs();
  },

  P() { return {
    skus:[{name:'Reg 1L',qty:32500,sp:76.74,rev:2494050,gp:498875,gm:0.20,st:'ok',icon:'💧',c:'#3B82F6'},{name:'Reg 500ml',qty:5000,sp:107.66,rev:538300,gp:107650,gm:0.20,st:'ok',icon:'💦',c:'#22D3EE'},{name:'Cust 1L',qty:2500,sp:120.34,rev:300850,gp:60175,gm:0.20,st:'ok',icon:'🏨',c:'#A78BFA'},{name:'Cust 500ml',qty:2500,sp:155.30,rev:388250,gp:9975,gm:0.026,st:'critical',icon:'🍽️',c:'#F472B6'},{name:'DaV Aqua',qty:7500,sp:78.70,rev:590250,gp:129825,gm:0.22,st:'ok',icon:'🚂',c:'#F59E0B'}],
    totRev:4311700,totCost:3505200,gp:806500,bGM:0.187,fc:1075000,net:-243500};},

  renderHome() {
    const p = OwnerView.P(), spent=p.totCost+p.fc;
    let h = `<div class="hero-card blue"><div class="card-label">Total Expenditure</div><div class="card-value">${Utils.currencyFull(spent)}</div><div class="card-sub">Variable + Fixed · this month</div></div>`;
    h += `<div class="grid-2"><div class="hero-card green"><div class="card-label">Revenue</div><div class="card-value sm glow-green">${Utils.currency(p.totRev)}</div><div class="card-sub">50K packets</div></div><div class="hero-card ${p.net>=0?'green':'red'}"><div class="card-label">Net P/L</div><div class="card-value sm ${p.net>=0?'glow-green':'glow-red'}">${Utils.currency(p.net)}</div><div class="card-sub">GM ${Utils.pct(p.bGM)}</div></div></div>`;
    // Breakeven
    h += `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div><b style="font-size:13px">Breakeven</b><div style="font-size:11px;color:var(--text-faint)">25,727 pkts · 990/day</div></div><span style="font-weight:800;font-size:20px;color:var(--amber)">51%</span></div>${UI.progress(25727,50000,'var(--amber)')}</div>`;
    // SKUs
    h += UI.sectionTitle('SKU Performance');
    p.skus.forEach(s => { h += `<div class="card" style="display:flex;align-items:center;gap:14px"><div style="width:40px;height:40px;border-radius:12px;background:${s.c}15;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${s.icon}</div><div style="flex:1"><div style="display:flex;justify-content:space-between"><b style="font-size:13px">${s.name}</b>${UI.badge(s.st)}</div><div style="display:flex;gap:14px;margin-top:4px;font-size:12px;color:var(--text-dim)"><span>Rev <b style="color:var(--text)">${Utils.currency(s.rev)}</b></span><span>GM <b style="color:${s.gm>=0.2?'var(--green)':s.gm>=0.15?'var(--amber)':'var(--red)'}">${Utils.pct(s.gm)}</b></span></div></div></div>`; });
    // Alerts
    h += UI.sectionTitle('Action Required');
    h += UI.alert('Cust 500ml — Loss-Making', 'Market ₹155 below minimum ₹189. Raise price immediately.', 'critical');
    h += UI.alert('Reg 1L — Margin Pressure', 'Market ₹72 below ex-factory ₹77. Raise MRP to ₹78+.', 'warning');
    return h;
  },

  renderActivity() {
    return `${UI.sectionTitle('🔔 Live Activity Feed')}
      <div style="font-size:12px;color:var(--text-faint);margin-bottom:12px">Every sale, purchase, expense, and production entry — live from Google Sheets</div>
      <button class="btn btn-secondary btn-sm" id="btn-refresh-feed" style="margin-bottom:16px">↻ Refresh Feed</button>
      <div id="activity-feed">${UI.loading('Loading activity...')}</div>`;
  },

  async loadActivity() {
    try {
      const data = await API.activity();
      const el = document.getElementById('activity-feed');
      if (!el) return;
      let h = '';
      if (data.counts) {
        h += `<div class="stats-row">
          <div class="stat-chip"><span class="stat-num" style="color:var(--green)">${data.counts.sales||0}</span><span class="stat-label">Sales</span></div>
          <div class="stat-chip"><span class="stat-num" style="color:var(--blue)">${data.counts.purchases||0}</span><span class="stat-label">Purchases</span></div>
          <div class="stat-chip"><span class="stat-num" style="color:var(--red)">${data.counts.expenses||0}</span><span class="stat-label">Expenses</span></div>
          <div class="stat-chip"><span class="stat-num" style="color:var(--cyan)">${data.counts.production||0}</span><span class="stat-label">Production</span></div>
        </div>`;
      }
      h += UI.activityFeed(data.feed);
      el.innerHTML = h;
    } catch (e) { const el = document.getElementById('activity-feed'); if (el) el.innerHTML = UI.alert('Error', e.message, 'critical'); }
  },

  renderLogs() {
    return `${UI.sectionTitle('📋 All Logs')}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
        <button class="btn btn-sm btn-secondary log-tab active" data-log="sales">💰 Sales</button>
        <button class="btn btn-sm btn-secondary log-tab" data-log="purchases">📦 Purchases</button>
        <button class="btn btn-sm btn-secondary log-tab" data-log="expenses">💸 Expenses</button>
        <button class="btn btn-sm btn-secondary log-tab" data-log="production">🏭 Production</button>
      </div>
      <div id="log-content">${UI.loading()}</div>`;
  },

  async loadLogs() {
    const tabs = document.querySelectorAll('.log-tab');
    tabs.forEach(t => t.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      t.classList.add('active');
      OwnerView.showLog(t.dataset.log);
    }));
    OwnerView.showLog('sales');
  },

  async showLog(type) {
    const el = document.getElementById('log-content');
    if (!el) return;
    el.innerHTML = UI.loading();
    try {
      if (type === 'sales') { const d = await API.getSalesLog(); el.innerHTML = '<div class="card">' + UI.logTable(['Date','SKU','Qty','Price','Revenue','Customer','Payment','Notes','By','Time'], d.data, {limit:30}) + '</div>'; }
      else if (type === 'purchases') { const d = await API.getPurchaseLog(); el.innerHTML = '<div class="card">' + UI.logTable(['Date','Material','Supplier','Qty','Unit','Rate','Total','GST','Total+GST','Status','Notes','By','Time'], d.data, {limit:30}) + '</div>'; }
      else if (type === 'expenses') { const d = await API.getExpenseLog(); el.innerHTML = '<div class="card">' + UI.logTable(['Date','Category','Description','Amount','Payment','Notes','By','Time'], d.data, {limit:30}) + '</div>'; }
      else if (type === 'production') { const d = await API.getProductionLog(); el.innerHTML = '<div class="card">' + UI.logTable(['Date','Reg 1L','Reg 500','Cust 1L','Cust 500','DaV','Total','Notes','By','Time'], d.data, {limit:30}) + '</div>'; }
    } catch (e) { el.innerHTML = UI.alert('Error', e.message, 'warning'); }
  },

  renderConfig() {
    let h = UI.sectionTitle('Configuration');
    h += `<div class="card"><b style="font-size:13px">📋 Initial Setup</b><div style="font-size:12px;color:var(--text-dim);margin:6px 0 10px">Create log sheets in Google Sheets.</div><button class="btn btn-primary btn-sm" id="btn-setup">Run Setup</button></div>`;
    h += `<div class="card"><b style="font-size:13px">🔍 Diagnostics</b><div style="font-size:12px;color:var(--text-dim);margin:6px 0 10px">Test Google Sheets connection.</div><button class="btn btn-secondary btn-sm" id="btn-debug">Run Diagnostics</button><div id="debug-result"></div></div>`;
    h += `<div class="card"><b style="font-size:13px">💰 Overheads</b><div style="margin-top:10px">${[['EMI',200000],['Wages',300000],['Van',100000],['Diesel',200000],['Electricity',200000],['Admin',50000]].map(([l,v],i)=>`<div class="form-row" style="margin-bottom:6px"><label class="form-label" style="padding-top:10px;text-transform:none;letter-spacing:0">${l}</label><input class="form-input" type="number" id="oh-${i}" value="${v}" step="1000"></div>`).join('')}<button class="btn btn-success btn-sm" id="btn-save-oh" style="margin-top:10px">Save</button></div></div>`;
    return h;
  },

  attachEvents() {
    const $=id=>document.getElementById(id), btn=(id,fn)=>{const e=$(id);if(e)e.onclick=fn;};
    btn('btn-refresh-feed', ()=>OwnerView.loadActivity());
    btn('btn-setup', async function(){this.disabled=true;this.textContent='Running...';try{UI.toast((await API.setup()).message,'success');}catch(e){UI.toast(e.message,'error');}this.disabled=false;this.textContent='Run Setup';});
    btn('btn-debug', async function(){this.disabled=true;try{const d=await API.debug();$('debug-result').innerHTML=`<div class="debug-box">${Object.entries(d.checks).map(([k,v])=>`<span class="${v?'ok':'fail'}">${k}: ${v?'✅':'❌'}</span>`).join('\n')}${d.details.error?'\n<span class="fail">'+d.details.error+'</span>':''}${d.details.email?'\n'+d.details.email:''}${d.details.sheetTitle?'\n'+d.details.sheetTitle:''}</div>`;}catch(e){$('debug-result').innerHTML=`<div class="debug-box"><span class="fail">${e.message}</span></div>`;}this.disabled=false;this.textContent='Run Diagnostics';});
    btn('btn-save-oh', async()=>{if(!await UI.confirm('Save','Update overheads?'))return;try{await API.updateOverheads(['EMI','Wages & Labour','Delivery van expenses','Diesel','Electricity ','Admin'].map((l,i)=>[l,+$(`oh-${i}`).value]));UI.toast('Saved!','success');}catch(e){UI.toast(e.message,'error');}});
  }
};
