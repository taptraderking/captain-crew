const AccountantView = {
  currentTab: 'sales',

  async render() {
    return `
      <div class="topbar">
        <div class="topbar-left"><span class="topbar-icon">📝</span><div><div class="topbar-title">Accountant Panel</div><div class="topbar-sub">Sales · Purchases · Expenses</div></div></div>
        <button class="topbar-btn" onclick="App.logout()">Logout</button>
      </div>
      <div class="content" id="acct-content">${UI.loading()}</div>
      <nav class="bottom-nav">
        <button class="nav-item active" data-tab="sales"><span class="nav-icon">💰</span><span class="nav-label">Sales</span></button>
        <button class="nav-item" data-tab="purchase"><span class="nav-icon">📦</span><span class="nav-label">Purchase</span></button>
        <button class="nav-item" data-tab="expense"><span class="nav-icon">💸</span><span class="nav-label">Expense</span></button>
        <button class="nav-item" data-tab="activity"><span class="nav-icon">🔔</span><span class="nav-label">Activity</span></button>
      </nav>`;
  },

  async init() {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        AccountantView.currentTab = btn.dataset.tab;
        AccountantView.renderTab();
      });
    });
    AccountantView.renderTab();
  },

  renderTab() {
    const c = document.getElementById('acct-content');
    const fn = { sales: AccountantView.renderSales, purchase: AccountantView.renderPurchase, expense: AccountantView.renderExpense, activity: AccountantView.renderActivityTab }[AccountantView.currentTab] || AccountantView.renderSales;
    c.innerHTML = '<div class="reveal">' + fn() + '</div>';
    AccountantView.attachEvents();
    if (AccountantView.currentTab === 'activity') AccountantView.loadActivity();
  },

  renderSales() {
    const skus = [{ value: 'Reg 1000ml', label: '💧 Regular 1L' }, { value: 'Reg 500ml', label: '💦 Regular 500ml' }, { value: 'Cust 1000ml', label: '🏨 Custom 1L' }, { value: 'Cust 500ml', label: '🍽️ Custom 500ml' }, { value: 'DaV Aqua 1L', label: '🚂 DaV Aqua 1L' }];
    const payments = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Credit'];
    return `${UI.sectionTitle('💰 Log Sale')}
      <form id="sale-form" class="card">
        ${UI.formField('Date', UI.input('s-date', { type: 'date', value: Utils.today(), required: true }))}
        <div class="form-row">
          ${UI.formField('SKU', UI.select('s-sku', skus, { required: true }))}
          ${UI.formField('Qty (Packets)', UI.input('s-qty', { type: 'number', placeholder: '0', min: '1', required: true }))}
        </div>
        <div class="form-row">
          ${UI.formField('Price/Pkt (₹)', UI.input('s-price', { type: 'number', step: '0.01', placeholder: '0.00', required: true }))}
          ${UI.formField('Payment', UI.select('s-pay', payments, { selected: 'Cash' }))}
        </div>
        <div id="s-total" style="padding:10px;background:rgba(16,185,129,0.08);border-radius:10px;margin-bottom:12px;font-size:14px;border:1px solid rgba(16,185,129,0.15)">
          Revenue: <b style="color:var(--green)">₹0</b>
        </div>
        ${UI.formField('Customer', UI.input('s-cust', { placeholder: 'Customer name (optional)' }))}
        ${UI.formField('Notes', UI.textarea('s-notes', { placeholder: 'Invoice ref, delivery details...', rows: 2 }))}
        <button type="submit" class="btn btn-primary">✓ Log Sale</button>
      </form>`;
  },

  renderPurchase() {
    const materials = ['Preform', 'Cap', 'Bopp', 'Sticker', 'Shrink', 'Carton', 'Ink', 'Glue', 'Minerals', 'Micro Filter', 'Bottles', 'Labels', 'Other'];
    const units = ['kg', 'pcs', 'rolls', 'litres', 'packets', 'boxes', 'bags', 'drums', 'sheets', 'meters'];
    return `${UI.sectionTitle('📦 Log Raw Material Purchase')}
      <div style="font-size:12px;color:var(--text-faint);margin-bottom:12px;padding:10px;background:var(--card);border-radius:10px;border:1px dashed rgba(59,130,246,0.2)">
        ℹ️ Log the purchase here. <b style="color:var(--blue)">Manager will approve it.</b> Status starts as "pending" until approved.
      </div>
      <form id="purchase-form" class="card">
        ${UI.formField('Date', UI.input('p-date', { type: 'date', value: Utils.today(), required: true }))}
        <div class="form-row">
          ${UI.formField('Material', UI.select('p-material', materials, { required: true }))}
          ${UI.formField('Supplier', UI.input('p-supplier', { placeholder: 'Supplier name' }))}
        </div>
        <div class="form-row">
          ${UI.formField('Quantity', UI.input('p-qty', { type: 'number', placeholder: '0', step: '0.01', required: true }))}
          ${UI.formField('Unit', UI.select('p-unit', units, { selected: 'kg' }))}
        </div>
        <div class="form-row">
          ${UI.formField('Rate per Unit (₹)', UI.input('p-rate', { type: 'number', placeholder: '0.00', step: '0.01', required: true }))}
          ${UI.formField('GST', UI.select('p-gst', [{ value: '0.05', label: '5%' }, { value: '0.12', label: '12%' }, { value: '0.18', label: '18%' }, { value: '0', label: 'None' }], { selected: '0.05' }))}
        </div>
        <div id="p-total" style="padding:10px;background:rgba(59,130,246,0.08);border-radius:10px;margin-bottom:12px;font-size:14px;border:1px solid rgba(59,130,246,0.15)">
          Total: <b style="color:var(--blue)">₹0</b>
        </div>
        ${UI.formField('Notes', UI.textarea('p-notes', { placeholder: 'Bill no, quality notes...', rows: 2 }))}
        <button type="submit" class="btn btn-primary">✓ Log Purchase (Pending Approval)</button>
      </form>`;
  },

  renderExpense() {
    const cats = ['EMI', 'Wages', 'Diesel/Fuel', 'Electricity', 'Delivery Van', 'Admin', 'Maintenance', 'Marketing', 'Rent', 'Insurance', 'Packaging', 'Water Treatment', 'Lab Testing', 'Repairs', 'Other'];
    const payments = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Credit'];
    return `${UI.sectionTitle('💸 Log Expense')}
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">
        ${['⛽ Diesel', '⚡ Electricity', '🚚 Van', '👷 Wages', '🔧 Repairs'].map(q => {
          const cat = q.split(' ')[1];
          return `<button class="btn btn-secondary btn-sm quick-exp" data-cat="${cat === 'Diesel' ? 'Diesel/Fuel' : cat}">${q}</button>`;
        }).join('')}
      </div>
      <form id="expense-form" class="card">
        ${UI.formField('Date', UI.input('e-date', { type: 'date', value: Utils.today(), required: true }))}
        <div class="form-row">
          ${UI.formField('Category', UI.select('e-cat', cats, { required: true }))}
          ${UI.formField('Amount (₹)', UI.input('e-amt', { type: 'number', step: '0.01', placeholder: '0.00', required: true }))}
        </div>
        <div class="form-row">
          ${UI.formField('Payment', UI.select('e-pay', payments, { selected: 'Cash' }))}
          ${UI.formField('Description', UI.input('e-desc', { placeholder: 'Brief description' }))}
        </div>
        ${UI.formField('Notes', UI.textarea('e-notes', { placeholder: 'Receipt no, vendor...', rows: 2 }))}
        <button type="submit" class="btn btn-primary">✓ Log Expense</button>
      </form>`;
  },

  renderActivityTab() {
    return `${UI.sectionTitle('🔔 Live Activity')}
      <button class="btn btn-secondary btn-sm" id="btn-refresh-acct" style="margin-bottom:12px">↻ Refresh</button>
      <div id="acct-feed">${UI.loading()}</div>`;
  },

  async loadActivity() {
    try {
      const d = await API.activity();
      const el = document.getElementById('acct-feed');
      if (el) {
        let h = `<div class="stats-row">
          <div class="stat-chip"><span class="stat-num" style="color:var(--green)">${d.counts.sales || 0}</span><span class="stat-label">Sales</span></div>
          <div class="stat-chip"><span class="stat-num" style="color:var(--blue)">${d.counts.purchases || 0}</span><span class="stat-label">Purchases</span></div>
          <div class="stat-chip"><span class="stat-num" style="color:var(--red)">${d.counts.expenses || 0}</span><span class="stat-label">Expenses</span></div>
          <div class="stat-chip"><span class="stat-num" style="color:var(--cyan)">${d.counts.production || 0}</span><span class="stat-label">Production</span></div>
        </div>`;
        h += UI.activityFeed(d.feed);
        el.innerHTML = h;
      }
    } catch (e) { const el = document.getElementById('acct-feed'); if (el) el.innerHTML = UI.alert('Error', e.message, 'warning'); }
  },

  attachEvents() {
    const $ = id => document.getElementById(id);
    const btn = (id, fn) => { const e = $(id); if (e) e.onclick = fn; };
    btn('btn-refresh-acct', () => AccountantView.loadActivity());

    // Sale form
    const saleForm = $('sale-form');
    if (saleForm) {
      const prices = { 'Reg 1000ml': 76.74, 'Reg 500ml': 107.66, 'Cust 1000ml': 120.34, 'Cust 500ml': 155.30, 'DaV Aqua 1L': 78.70 };
      const calcS = () => {
        const rev = (+($('s-qty')?.value || 0)) * (+($('s-price')?.value || 0));
        $('s-total').innerHTML = `Revenue: <b style="color:var(--green)">₹${rev.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</b>`;
      };
      $('s-sku')?.addEventListener('change', e => { const p = $('s-price'); if (p && prices[e.target.value]) { p.value = prices[e.target.value]; calcS(); } });
      ['s-qty', 's-price'].forEach(id => $(id)?.addEventListener('input', calcS));
      saleForm.onsubmit = async e => {
        e.preventDefault();
        if (!await UI.confirm('Log Sale', 'Submit this sale?')) return;
        try {
          await API.logSale({ date: $('s-date').value, sku: $('s-sku').value, quantity: +$('s-qty').value, sellingPrice: +$('s-price').value, customerName: $('s-cust').value, paymentMode: $('s-pay').value, notes: $('s-notes').value });
          UI.toast('Sale logged!', 'success'); saleForm.reset(); $('s-date').value = Utils.today();
        } catch (e) { UI.toast(e.message, 'error'); }
      };
    }

    // Purchase form
    const purchForm = $('purchase-form');
    if (purchForm) {
      const calcP = () => {
        const qty = +($('p-qty')?.value || 0), rate = +($('p-rate')?.value || 0), gst = +($('p-gst')?.value || 0.05);
        const total = qty * rate * (1 + gst);
        $('p-total').innerHTML = `Total: <b style="color:var(--blue)">₹${total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</b> (incl GST)`;
      };
      ['p-qty', 'p-rate', 'p-gst'].forEach(id => $(id)?.addEventListener('input', calcP));
      purchForm.onsubmit = async e => {
        e.preventDefault();
        if (!await UI.confirm('Log Purchase', 'Submit? Manager will need to approve this.')) return;
        try {
          const res = await API.logPurchase({ date: $('p-date').value, material: $('p-material').value, supplier: $('p-supplier').value, quantity: +$('p-qty').value, unit: $('p-unit').value, unitRate: +$('p-rate').value, gstRate: +$('p-gst').value, notes: $('p-notes').value });
          UI.toast(`Purchase logged (${res.status || 'pending'})!`, 'success'); purchForm.reset(); $('p-date').value = Utils.today();
        } catch (e) { UI.toast(e.message, 'error'); }
      };
    }

    // Expense form
    const expForm = $('expense-form');
    if (expForm) {
      document.querySelectorAll('.quick-exp').forEach(b => b.addEventListener('click', () => { const s = $('e-cat'); if (s) s.value = b.dataset.cat; $('e-amt')?.focus(); }));
      expForm.onsubmit = async e => {
        e.preventDefault();
        if (!await UI.confirm('Log Expense', 'Submit this expense?')) return;
        try {
          await API.logExpense({ date: $('e-date').value, category: $('e-cat').value, description: $('e-desc').value, amount: +$('e-amt').value, paymentMode: $('e-pay').value, notes: $('e-notes').value });
          UI.toast('Expense logged!', 'success'); expForm.reset(); $('e-date').value = Utils.today();
        } catch (e) { UI.toast(e.message, 'error'); }
      };
    }
  }
};
