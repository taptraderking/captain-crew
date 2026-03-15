const OwnerView = {
  data: null,
  liveMode: false,
  currentTab: 'home',

  async render() {
    return `
      <div class="topbar">
        <div>
          <div class="topbar-title">🚰 Captain Crew</div>
          <div class="topbar-sub" id="topbar-sub">Loading...</div>
        </div>
        <div class="topbar-actions">
          <button class="topbar-btn" onclick="App.logout()">Logout</button>
        </div>
      </div>
      <div class="content fade-in" id="owner-content">${UI.loading('Connecting to Google Sheets...')}</div>
      <nav class="bottom-nav">
        <button class="nav-item active" data-tab="home"><span class="nav-icon">📊</span><span class="nav-label">Home</span></button>
        <button class="nav-item" data-tab="costs"><span class="nav-icon">💸</span><span class="nav-label">Costs</span></button>
        <button class="nav-item" data-tab="revenue"><span class="nav-icon">💰</span><span class="nav-label">Revenue</span></button>
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
      document.getElementById('topbar-sub').textContent = OwnerView.liveMode ? 'Live · Google Sheets connected' : 'Demo mode';
      OwnerView.renderTab();
    } catch (err) {
      OwnerView.liveMode = false;
      OwnerView.data = {};
      document.getElementById('topbar-sub').textContent = 'Connection issue — running diagnostics...';
      OwnerView.showConnectionError(err.message);
    }
  },

  async showConnectionError(errMsg) {
    const c = document.getElementById('owner-content');
    let debugHtml = '';
    try {
      const d = await API.debug();
      const ck = d.checks;
      debugHtml = `<div class="debug-box">` +
        `<span class="${ck.sheetId ? 'ok' : 'fail'}">SHEET_ID:         ${ck.sheetId ? '✅ Set' : '❌ Missing'}</span>\n` +
        `<span class="${ck.jsonParseable ? 'ok' : 'fail'}">JSON_PARSEABLE:   ${ck.jsonParseable ? '✅ Yes' : '❌ No'}</span>\n` +
        `<span class="${ck.hasEmail ? 'ok' : 'fail'}">HAS_EMAIL:        ${ck.hasEmail ? '✅ ' + d.details.email : '❌ Missing'}</span>\n` +
        `<span class="${ck.hasKey ? 'ok' : 'fail'}">HAS_PRIVATE_KEY:  ${ck.hasKey ? '✅ Yes' : '❌ Missing'}</span>\n` +
        `<span class="${ck.apiReachable ? 'ok' : 'fail'}">API_REACHABLE:    ${ck.apiReachable ? '✅ Yes' : '❌ No'}</span>\n` +
        `<span class="${ck.sheetReadable ? 'ok' : 'fail'}">SHEET_READABLE:   ${ck.sheetReadable ? '✅ Yes — ' + d.details.sheetTitle : '❌ No'}</span>\n` +
        (d.details.error ? `\n<span class="fail">ERROR: ${d.details.error}</span>` : '') +
        (d.details.apiError ? `\n<span class="fail">API: ${d.details.apiError}</span>` : '') +
        `\nJSON length: ${d.details.jsonLength || 0} chars` +
        `\nJSON start: ${d.details.jsonStart || 'empty'}` +
        `</div>`;
    } catch (e) {
      debugHtml = `<div class="debug-box"><span class="fail">Could not run diagnostics: ${e.message}</span></div>`;
    }

    c.innerHTML = `
      <div class="alert alert-critical">
        <div class="alert-title">Google Sheets Connection Failed</div>
        <div class="alert-text">${errMsg}</div>
      </div>
      <div class="section-title">🔍 Diagnostic Report</div>
      ${debugHtml}
      <div style="margin-top:16px; display:flex; gap:10px;">
        <button class="btn btn-primary btn-sm" onclick="OwnerView.init()">🔄 Retry</button>
        <button class="btn btn-secondary btn-sm" onclick="OwnerView.loadDemo()">📊 Demo Dashboard</button>
      </div>
      <div class="card" style="margin-top:16px">
        <div style="font-weight:600;font-size:13px;margin-bottom:8px">Common Fixes:</div>
        <div style="font-size:12px;color:var(--text2);line-height:1.8">
          1. <b>JSON not valid?</b> Open the .json key file in Notepad, Ctrl+A to select ALL, Ctrl+C to copy, paste into Render env var.<br>
          2. <b>403 Permission denied?</b> Go to Google Sheets → Share → add the service account email as <b>Editor</b>.<br>
          3. <b>404 Not found?</b> Double-check your GOOGLE_SHEET_ID from the Google Sheet URL.<br>
          4. <b>Missing private_key?</b> The JSON got truncated. Paste it again — it should be ~2400 chars long.
        </div>
      </div>`;
  },

  loadDemo() {
    OwnerView.data = {};
    OwnerView.liveMode = false;
    document.getElementById('topbar-sub').textContent = 'Demo mode (spreadsheet data)';
    OwnerView.renderTab();
  },

  renderTab() {
    const c = document.getElementById('owner-content');
    const tabs = { home: OwnerView.renderHome, costs: OwnerView.renderCosts, revenue: OwnerView.renderRevenue, config: OwnerView.renderConfig };
    c.innerHTML = '<div class="fade-in">' + (tabs[OwnerView.currentTab] || tabs.home)() + '</div>';
    OwnerView.attachEvents();
  },

  getPnL() {
    return {
      skus: [
        { name: 'Reg 1000ml', qty: 32500, sp: 76.74, revenue: 2494050, rmCost: 1620125, opCost: 375050, totalCost: 1995175, grossProfit: 498875, gm: 0.20, status: 'ok', icon: '💧', color: '#4F8FFF' },
        { name: 'Reg 500ml', qty: 5000, sp: 107.66, revenue: 538300, rmCost: 372950, opCost: 57700, totalCost: 430650, grossProfit: 107650, gm: 0.20, status: 'ok', icon: '💦', color: '#06B6D4' },
        { name: 'Cust 1000ml', qty: 2500, sp: 120.34, revenue: 300850, rmCost: 211825, opCost: 28850, totalCost: 240675, grossProfit: 60175, gm: 0.20, status: 'ok', icon: '🏨', color: '#A855F7' },
        { name: 'Cust 500ml', qty: 2500, sp: 155.30, revenue: 388250, rmCost: 349425, opCost: 28850, totalCost: 378275, grossProfit: 9975, gm: 0.026, status: 'critical', icon: '🍽️', color: '#EC4899' },
        { name: 'DaV Aqua 1L', qty: 7500, sp: 78.70, revenue: 590250, rmCost: 373875, opCost: 86550, totalCost: 460425, grossProfit: 129825, gm: 0.22, status: 'ok', icon: '🚂', color: '#F59E0B' },
      ],
      totalRevenue: 4311700, totalCost: 3505200, grossProfit: 806500, blendedGM: 0.187, fixedCosts: 1075000, netProfit: -243500,
    };
  },

  renderHome() {
    const p = OwnerView.getPnL();
    const totalSpent = p.totalCost + p.fixedCosts;
    const be = 25727;

    let h = '';
    // Hero cards
    h += `<div class="card-glass blue" style="margin-bottom:12px">
      <div class="card-label">Total Spent</div>
      <div class="card-value">${Utils.currencyFull(totalSpent)}</div>
      <div class="card-sub">Variable ${Utils.currency(p.totalCost)} + Fixed ${Utils.currency(p.fixedCosts)}</div>
    </div>`;
    h += `<div class="grid-2">
      <div class="card-glass green">
        <div class="card-label">Revenue</div>
        <div class="card-value sm">${Utils.currency(p.totalRevenue)}</div>
        <div class="card-sub">50K pkts/mo</div>
      </div>
      <div class="card-glass ${p.netProfit >= 0 ? 'green' : 'red'}">
        <div class="card-label">Net P/L</div>
        <div class="card-value sm">${Utils.currency(p.netProfit)}</div>
        <div class="card-sub">GM: ${Utils.pct(p.blendedGM)}</div>
      </div>
    </div>`;

    // Breakeven
    h += `<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div><span style="font-weight:700;font-size:13px">Breakeven</span><div class="card-sub">${Utils.num(be)} pkts needed (990/day)</div></div>
        <span style="font-weight:800;font-size:20px;color:var(--amber)">${Math.round((be/50000)*100)}%</span>
      </div>
      ${UI.progress(be, 50000, 'var(--amber)')}
    </div>`;

    // SKU performance
    h += '<div class="section-title">SKU Performance</div>';
    p.skus.forEach(s => {
      h += `<div class="card" style="display:flex;align-items:center;gap:12px">
        <span style="font-size:24px">${s.icon}</span>
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-weight:600;font-size:13px">${s.name}</span>
            ${UI.badge(s.status)}
          </div>
          <div style="display:flex;gap:16px;margin-top:4px;font-size:12px;color:var(--text2)">
            <span>Rev: <b style="color:var(--text)">${Utils.currency(s.revenue)}</b></span>
            <span>GM: <b style="color:${s.gm>=0.20?'var(--green)':s.gm>=0.15?'var(--amber)':'var(--red)'}">${Utils.pct(s.gm)}</b></span>
            <span>${Utils.num(s.qty)} pkts</span>
          </div>
        </div>
      </div>`;
    });

    // Profit scenarios
    h += '<div class="section-title">Profit by Capacity</div>';
    const sc = [{l:'50%',p:-30377},{l:'60%',p:178547},{l:'70%',p:387472},{l:'80%',p:596397},{l:'90%',p:805321},{l:'100%',p:1014246}];
    h += `<div class="card"><div style="display:flex;align-items:flex-end;gap:6px;height:90px">`;
    sc.forEach(s => {
      const max = 1014246;
      const ht = (Math.abs(s.p)/max)*70;
      h += `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%">
        <div style="width:100%;max-width:28px;height:${ht}px;border-radius:5px 5px 0 0;background:${s.p>=0?'var(--green)':'var(--red)'};opacity:0.75"></div>
        <span style="font-size:9px;color:var(--text3);margin-top:3px">${s.l}</span>
      </div>`;
    });
    h += `</div><div style="text-align:center;font-size:11px;color:var(--text3);margin-top:8px">Breakeven at ~60% capacity</div></div>`;

    // Alerts
    h += '<div class="section-title">🚨 Actions Required</div>';
    h += UI.alert('Cust 500ml — Loss-Making', 'Market ₹155 far below minimum ₹189. Raise price or renegotiate supplier immediately.', 'critical');
    h += UI.alert('Reg 1L — Margin Squeeze', 'Market ₹72 below ex-factory ₹77. Your 65% volume product. Raise MRP to ₹78+.', 'warning');
    h += UI.alert('Monthly Net Loss ₹2.44L', 'Gross profit ₹8.07L cannot cover fixed costs ₹10.75L. Need 60%+ capacity or price hikes.', 'info');

    if (!OwnerView.liveMode) {
      h += `<div style="text-align:center;margin-top:16px;padding:12px;border-radius:var(--radius-sm);background:var(--amber-dim);color:var(--amber);font-size:12px;font-weight:600">
        📋 Showing spreadsheet demo data. Connect Google Sheets for live data.
      </div>`;
    }
    return h;
  },

  renderCosts() {
    const p = OwnerView.getPnL();
    const fixed = [{n:'EMI',a:200000,c:'var(--accent)'},{n:'Wages',a:300000,c:'var(--cyan)'},{n:'Delivery Van',a:100000,c:'var(--purple)'},{n:'Diesel',a:200000,c:'var(--pink)'},{n:'Electricity',a:200000,c:'var(--amber)'},{n:'Admin',a:50000,c:'var(--green)'},{n:'Misc RM',a:25000,c:'var(--text2)'}];
    const totalFixed = 1075000;
    const totalAll = p.totalCost + totalFixed;

    let h = `<div class="grid-2">
      <div class="card"><div class="card-label">Variable</div><div class="card-value sm">${Utils.currency(p.totalCost)}</div></div>
      <div class="card"><div class="card-label">Fixed</div><div class="card-value sm">${Utils.currency(totalFixed)}</div></div>
    </div>`;

    // Cost split
    const rmPct=((p.totalCost-577000)/totalAll*100),opPct=(577000/totalAll*100),fxPct=(totalFixed/totalAll*100);
    h += `<div class="card">
      <div style="font-weight:600;font-size:13px;margin-bottom:10px">Cost Split</div>
      <div style="display:flex;border-radius:6px;overflow:hidden;height:24px;margin-bottom:8px">
        <div style="width:${rmPct}%;background:var(--red);display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;font-weight:600">RM</div>
        <div style="width:${opPct}%;background:var(--amber);display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;font-weight:600">Op</div>
        <div style="width:${fxPct}%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;font-weight:600">Fixed</div>
      </div>
      <div style="display:flex;gap:12px;font-size:11px;color:var(--text2)">
        <span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:var(--red);margin-right:4px;vertical-align:middle"></span>RM ${Utils.pct((p.totalCost-577000)/totalAll)}</span>
        <span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:var(--amber);margin-right:4px;vertical-align:middle"></span>Op ${Utils.pct(577000/totalAll)}</span>
        <span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:var(--accent);margin-right:4px;vertical-align:middle"></span>Fixed ${Utils.pct(totalFixed/totalAll)}</span>
      </div>
    </div>`;

    // Fixed breakdown
    h += '<div class="section-title">Fixed Cost Breakdown</div><div class="card">';
    fixed.forEach(f => {
      h += `<div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px"><span style="color:var(--text2)">${f.n}</span><b>${Utils.currencyFull(f.a)}</b></div>
        ${UI.progress(f.a, 300000, f.c)}
      </div>`;
    });
    h += '</div>';

    // RM per SKU
    h += '<div class="section-title">RM Cost / Packet</div><div class="grid-2" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr))">';
    const rm = [49.85,74.59,84.73,139.77,49.85];
    p.skus.forEach((s,i) => {
      h += `<div class="card" style="text-align:center"><span style="font-size:20px">${s.icon}</span>
        <div style="font-size:11px;color:var(--text3);margin:2px 0">${s.name}</div>
        <div style="font-weight:800;font-size:18px;color:${s.color}">${Utils.currencyFull(rm[i])}</div>
      </div>`;
    });
    h += '</div>';
    return h;
  },

  renderRevenue() {
    const p = OwnerView.getPnL();
    const maxRev = Math.max(...p.skus.map(s=>s.revenue));
    let h = `<div class="grid-2">
      <div class="card-glass green"><div class="card-label">Revenue</div><div class="card-value sm">${Utils.currency(p.totalRevenue)}</div></div>
      <div class="card-glass purple"><div class="card-label">Gross Profit</div><div class="card-value sm">${Utils.currency(p.grossProfit)}</div><div class="card-sub">GM ${Utils.pct(p.blendedGM)}</div></div>
    </div>`;

    h += '<div class="section-title">Revenue by SKU</div><div class="card">';
    [...p.skus].sort((a,b)=>b.revenue-a.revenue).forEach(s => {
      h += `<div style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
          <div style="display:flex;align-items:center;gap:6px"><span>${s.icon}</span><b style="font-size:13px">${s.name}</b></div>
          <b style="font-size:13px">${Utils.currency(s.revenue)}</b>
        </div>
        ${UI.progress(s.revenue, maxRev, s.color)}
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text3);margin-top:2px">
          <span>${Utils.num(s.qty)} pkts × ${Utils.currencyFull(s.sp)}</span>
          <span>Profit: ${Utils.currency(s.grossProfit)}</span>
        </div>
      </div>`;
    });
    h += '</div>';

    // Revenue mix
    h += '<div class="section-title">Revenue Mix</div><div class="card">';
    p.skus.forEach(s => {
      const pctW = (s.revenue/p.totalRevenue*100);
      h += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:12px">
        <span style="width:10px;height:10px;border-radius:3px;background:${s.color};flex-shrink:0"></span>
        <span style="flex:1;color:var(--text2)">${s.name}</span>
        <div style="width:100px;height:5px;border-radius:5px;background:var(--bg2);overflow:hidden"><div style="width:${pctW}%;height:100%;background:${s.color};border-radius:5px"></div></div>
        <b style="width:40px;text-align:right">${Utils.pct(s.revenue/p.totalRevenue)}</b>
      </div>`;
    });
    h += '</div>';
    return h;
  },

  renderConfig() {
    let h = '<div class="section-title">⚙️ Configuration</div>';
    h += `<div class="card">
      <div style="font-weight:600;font-size:13px;margin-bottom:6px">📋 Initial Setup</div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:10px">Create log sheets (Sales, Purchases, Expenses, Production) in your Google Sheet.</div>
      <button class="btn btn-primary btn-sm" id="btn-setup">Run Setup</button>
    </div>`;

    h += `<div class="card">
      <div style="font-weight:600;font-size:13px;margin-bottom:6px">🔍 Connection Diagnostics</div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:10px">Test if the app can reach your Google Sheet.</div>
      <button class="btn btn-secondary btn-sm" id="btn-debug">Run Diagnostics</button>
      <div id="debug-result"></div>
    </div>`;

    h += `<div class="card">
      <div style="font-weight:600;font-size:13px;margin-bottom:10px">💰 Monthly Overheads</div>
      ${[['EMI',200000],['Wages',300000],['Delivery Van',100000],['Diesel',200000],['Electricity',200000],['Admin',50000]].map(([l,v],i)=>`
        <div class="form-row" style="margin-bottom:6px">
          <label class="form-label" style="padding-top:10px">${l}</label>
          <input class="form-input" type="number" id="oh-${i}" value="${v}" step="1000">
        </div>`).join('')}
      <button class="btn btn-success btn-sm" id="btn-save-oh" style="margin-top:8px">Save Overheads</button>
    </div>`;

    h += `<div class="card">
      <div style="font-weight:600;font-size:13px;margin-bottom:10px">📦 Production & Sales Mix</div>
      ${UI.formField('Total Monthly Production', UI.input('cfg-prod', {type:'number',value:'50000',step:'1000'}))}
      <div class="form-row">
        ${UI.formField('Reg 1L %', UI.input('cfg-m0', {type:'number',value:'65',step:'1',min:'0'}))}
        ${UI.formField('Reg 500 %', UI.input('cfg-m1', {type:'number',value:'10',step:'1',min:'0'}))}
      </div>
      <div class="form-row">
        ${UI.formField('Cust 1L %', UI.input('cfg-m2', {type:'number',value:'5',step:'1',min:'0'}))}
        ${UI.formField('Cust 500 %', UI.input('cfg-m3', {type:'number',value:'5',step:'1',min:'0'}))}
      </div>
      <div style="font-size:11px;color:var(--text3);margin-bottom:10px">DaV Aqua auto = 100% minus others</div>
      <button class="btn btn-success btn-sm" id="btn-save-prod">Save Production</button>
    </div>`;

    h += `<div class="card">
      <div style="font-weight:600;font-size:13px;margin-bottom:10px">🎯 Target Profit</div>
      ${UI.formField('Target (₹/month)', UI.input('cfg-target', {type:'number',value:'1000000',step:'50000'}))}
      <button class="btn btn-success btn-sm" id="btn-save-target">Save Target</button>
    </div>`;
    return h;
  },

  attachEvents() {
    const setup = document.getElementById('btn-setup');
    if (setup) setup.onclick = async () => {
      setup.disabled = true; setup.textContent = 'Running...';
      try { const r = await API.setup(); UI.toast(r.message, 'success'); }
      catch (e) { UI.toast(e.message, 'error'); }
      setup.disabled = false; setup.textContent = 'Run Setup';
    };

    const dbg = document.getElementById('btn-debug');
    if (dbg) dbg.onclick = async () => {
      dbg.disabled = true; dbg.textContent = 'Testing...';
      const out = document.getElementById('debug-result');
      try {
        const d = await API.debug();
        const ck = d.checks;
        out.innerHTML = `<div class="debug-box">` +
          Object.entries(ck).map(([k,v]) => `<span class="${v?'ok':'fail'}">${k}: ${v?'✅':'❌'}</span>`).join('\n') +
          (d.details.email ? `\n\nEmail: ${d.details.email}` : '') +
          (d.details.sheetTitle ? `\nSheet: ${d.details.sheetTitle} (${d.details.sheetCount} tabs)` : '') +
          (d.details.error ? `\n\n<span class="fail">Error: ${d.details.error}</span>` : '') +
          `</div>`;
      } catch (e) { out.innerHTML = `<div class="debug-box"><span class="fail">${e.message}</span></div>`; }
      dbg.disabled = false; dbg.textContent = 'Run Diagnostics';
    };

    const ohBtn = document.getElementById('btn-save-oh');
    if (ohBtn) ohBtn.onclick = async () => {
      if (!await UI.confirm('Update Overheads','Save new overhead values to Google Sheet?')) return;
      const labels = ['EMI','Wages & Labour','Delivery van expenses','Diesel','Electricity ','Admin'];
      try { await API.updateOverheads(labels.map((l,i) => [l, Number(document.getElementById(`oh-${i}`).value)])); UI.toast('Saved!','success'); }
      catch (e) { UI.toast(e.message,'error'); }
    };

    const prodBtn = document.getElementById('btn-save-prod');
    if (prodBtn) prodBtn.onclick = async () => {
      if (!await UI.confirm('Update Production','Save production settings?')) return;
      try { await API.updateProduction(Number(document.getElementById('cfg-prod').value), [0,1,2,3].map(i=>Number(document.getElementById(`cfg-m${i}`).value)/100)); UI.toast('Saved!','success'); }
      catch (e) { UI.toast(e.message,'error'); }
    };

    const tBtn = document.getElementById('btn-save-target');
    if (tBtn) tBtn.onclick = async () => {
      try { await API.updateTargetProfit(Number(document.getElementById('cfg-target').value)); UI.toast('Saved!','success'); }
      catch (e) { UI.toast(e.message,'error'); }
    };
  }
};
