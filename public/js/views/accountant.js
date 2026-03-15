// ─── ACCOUNTANT VIEW ─────────────────────────────────────────────────────────
const AccountantView = {
  config: null,
  currentTab: 'sales',

  async render() {
    return `
      <div class="topbar">
        <div>
          <div class="topbar-title">📝 Accountant Panel</div>
          <div class="topbar-sub">Sales, Expenses & Financial Records</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="topbar-btn" onclick="App.toggleTheme()">🌓</button>
          <button class="topbar-btn" onclick="App.logout()">↗</button>
        </div>
      </div>
      <div class="content fade-in" id="acct-content">${UI.loading()}</div>
      <nav class="bottom-nav">
        <button class="nav-item active" data-tab="sales"><span class="nav-icon">💰</span><span class="nav-label">Sales</span></button>
        <button class="nav-item" data-tab="expenses"><span class="nav-icon">💸</span><span class="nav-label">Expenses</span></button>
        <button class="nav-item" data-tab="production"><span class="nav-icon">🏭</span><span class="nav-label">Production</span></button>
        <button class="nav-item" data-tab="history"><span class="nav-icon">📋</span><span class="nav-label">History</span></button>
      </nav>
    `;
  },

  async init() {
    try {
      AccountantView.config = await API.config();
    } catch {
      AccountantView.config = {
        skus: [
          { id: 'reg1l', name: 'Regular 1L', icon: '💧' },
          { id: 'reg500', name: 'Regular 500ml', icon: '💦' },
          { id: 'cust1l', name: 'Custom 1L', icon: '🏨' },
          { id: 'cust500', name: 'Custom 500ml', icon: '🍽️' },
          { id: 'dav1l', name: 'DaV Aqua 1L', icon: '🚂' },
        ],
        expenseCategories: ['EMI','Wages','Diesel/Fuel','Electricity','Delivery Van','Admin','Maintenance','Marketing','Rent','Insurance','Other'],
        paymentModes: ['Cash','UPI','Bank Transfer','Cheque','Credit']
      };
    }

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
    const tabs = {
      sales: AccountantView.renderSalesForm,
      expenses: AccountantView.renderExpenseForm,
      production: AccountantView.renderProductionForm,
      history: AccountantView.renderHistory,
    };
    c.innerHTML = '<div class="fade-in">' + (tabs[AccountantView.currentTab] || tabs.sales)() + '</div>';
    AccountantView.attachEvents();
  },

  renderSalesForm() {
    const cfg = AccountantView.config;
    const skuOpts = cfg.skus.map(s => ({ value: s.id, label: `${s.icon} ${s.name}` }));
    const payOpts = cfg.paymentModes;

    return `
      ${UI.sectionTitle('💰 Log Sale')}
      <form id="sale-form" class="card">
        ${UI.formField('Date', UI.input('s-date', { type: 'date', value: Utils.today(), required: true }))}
        <div class="form-row">
          ${UI.formField('SKU', UI.select('s-sku', skuOpts, { required: true }))}
          ${UI.formField('Quantity (Pkts)', UI.input('s-qty', { type: 'number', placeholder: '0', min: '1', required: true }))}
        </div>
        <div class="form-row">
          ${UI.formField('Selling Price/Pkt (₹)', UI.input('s-price', { type: 'number', step: '0.01', placeholder: '0.00', required: true }))}
          ${UI.formField('Payment', UI.select('s-payment', payOpts, { selected: 'Cash' }))}
        </div>
        <div id="s-total" style="padding:10px;background:var(--surface);border-radius:8px;margin-bottom:12px;font-size:14px">
          Revenue: <strong>₹0.00</strong>
        </div>
        ${UI.formField('Customer Name', UI.input('s-customer', { placeholder: 'Optional' }))}
        ${UI.formField('Notes', UI.textarea('s-notes', { placeholder: 'Invoice ref, delivery details...', rows: 2 }))}
        <button type="submit" class="btn btn-primary">✓ Log Sale</button>
      </form>
    `;
  },

  renderExpenseForm() {
    const cfg = AccountantView.config;
    const catOpts = cfg.expenseCategories;
    const payOpts = cfg.paymentModes;

    return `
      ${UI.sectionTitle('💸 Log Expense')}
      <form id="expense-form" class="card">
        ${UI.formField('Date', UI.input('e-date', { type: 'date', value: Utils.today(), required: true }))}
        <div class="form-row">
          ${UI.formField('Category', UI.select('e-category', catOpts, { required: true }))}
          ${UI.formField('Amount (₹)', UI.input('e-amount', { type: 'number', step: '0.01', placeholder: '0.00', required: true }))}
        </div>
        <div class="form-row">
          ${UI.formField('Payment Mode', UI.select('e-payment', payOpts, { selected: 'Cash' }))}
          ${UI.formField('Description', UI.input('e-desc', { placeholder: 'Brief description' }))}
        </div>
        ${UI.formField('Notes', UI.textarea('e-notes', { placeholder: 'Receipt no, vendor details...', rows: 2 }))}
        <button type="submit" class="btn btn-primary">✓ Log Expense</button>
      </form>

      ${UI.sectionTitle('Quick Entry — Common Expenses')}
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${[
          { label: '⛽ Diesel', cat: 'Diesel/Fuel' },
          { label: '⚡ Electricity', cat: 'Electricity' },
          { label: '🚚 Van', cat: 'Delivery Van' },
          { label: '👷 Wages', cat: 'Wages' },
          { label: '🔧 Maintenance', cat: 'Maintenance' },
        ].map(q => `<button class="btn btn-secondary btn-sm quick-expense" data-cat="${q.cat}">${q.label}</button>`).join('')}
      </div>
    `;
  },

  renderProductionForm() {
    return `
      ${UI.sectionTitle('🏭 Log Daily Production')}
      <form id="acct-prod-form" class="card">
        ${UI.formField('Date', UI.input('ap-date', { type: 'date', value: Utils.today(), required: true }))}
        <div class="grid-2">
          ${UI.formField('💧 Reg 1L (pkts)', UI.input('ap-reg1l', { type: 'number', placeholder: '0', min: '0' }))}
          ${UI.formField('💦 Reg 500ml (pkts)', UI.input('ap-reg500', { type: 'number', placeholder: '0', min: '0' }))}
        </div>
        <div class="grid-2">
          ${UI.formField('🏨 Cust 1L (pkts)', UI.input('ap-cust1l', { type: 'number', placeholder: '0', min: '0' }))}
          ${UI.formField('🍽️ Cust 500ml (pkts)', UI.input('ap-cust500', { type: 'number', placeholder: '0', min: '0' }))}
        </div>
        ${UI.formField('🚂 DaV Aqua 1L (pkts)', UI.input('ap-dav1l', { type: 'number', placeholder: '0', min: '0' }))}
        <div id="ap-total" style="padding:10px;background:var(--surface);border-radius:8px;margin-bottom:12px;font-size:14px">
          Total packets: <strong>0</strong>
        </div>
        ${UI.formField('Notes', UI.textarea('ap-notes', { placeholder: 'Shift, issues, downtime...', rows: 2 }))}
        <button type="submit" class="btn btn-primary">✓ Log Production</button>
      </form>
    `;
  },

  renderHistory() {
    return `
      ${UI.sectionTitle('📋 Recent Entries')}
      <div class="card" id="sales-history">${UI.loading('Loading sales log...')}</div>
      <div class="card" id="expense-history" style="margin-top:12px">${UI.loading('Loading expense log...')}</div>
    `;
  },

  attachEvents() {
    // Sale form
    const saleForm = document.getElementById('sale-form');
    if (saleForm) {
      const calcSaleTotal = () => {
        const qty = Number(document.getElementById('s-qty')?.value || 0);
        const price = Number(document.getElementById('s-price')?.value || 0);
        document.getElementById('s-total').innerHTML = `Revenue: <strong>${Utils.currencyFull(qty * price)}</strong>`;
      };
      ['s-qty', 's-price'].forEach(id => document.getElementById(id)?.addEventListener('input', calcSaleTotal));

      // Auto-fill selling price when SKU changes
      document.getElementById('s-sku')?.addEventListener('change', (e) => {
        const prices = { reg1l: 76.74, reg500: 107.66, cust1l: 120.34, cust500: 155.30, dav1l: 78.70 };
        const priceField = document.getElementById('s-price');
        if (priceField && prices[e.target.value]) {
          priceField.value = prices[e.target.value];
          calcSaleTotal();
        }
      });

      saleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const confirmed = await UI.confirm('Log Sale', 'Submit this sale entry?');
        if (!confirmed) return;
        try {
          await API.logSale({
            date: document.getElementById('s-date').value,
            sku: document.getElementById('s-sku').value,
            quantity: Number(document.getElementById('s-qty').value),
            sellingPrice: Number(document.getElementById('s-price').value),
            customerName: document.getElementById('s-customer').value,
            paymentMode: document.getElementById('s-payment').value,
            notes: document.getElementById('s-notes').value,
          });
          UI.toast('Sale logged!', 'success');
          saleForm.reset();
          document.getElementById('s-date').value = Utils.today();
        } catch (err) { UI.toast(err.message, 'error'); }
      });
    }

    // Expense form
    const expForm = document.getElementById('expense-form');
    if (expForm) {
      expForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const confirmed = await UI.confirm('Log Expense', 'Submit this expense?');
        if (!confirmed) return;
        try {
          await API.logExpense({
            date: document.getElementById('e-date').value,
            category: document.getElementById('e-category').value,
            description: document.getElementById('e-desc').value,
            amount: Number(document.getElementById('e-amount').value),
            paymentMode: document.getElementById('e-payment').value,
            notes: document.getElementById('e-notes').value,
          });
          UI.toast('Expense logged!', 'success');
          expForm.reset();
          document.getElementById('e-date').value = Utils.today();
        } catch (err) { UI.toast(err.message, 'error'); }
      });

      // Quick expense buttons
      document.querySelectorAll('.quick-expense').forEach(btn => {
        btn.addEventListener('click', () => {
          const cat = btn.dataset.cat;
          const catSelect = document.getElementById('e-category');
          if (catSelect) catSelect.value = cat;
          document.getElementById('e-amount')?.focus();
        });
      });
    }

    // Production form
    const prodForm = document.getElementById('acct-prod-form');
    if (prodForm) {
      const calcTotal = () => {
        const fields = ['ap-reg1l','ap-reg500','ap-cust1l','ap-cust500','ap-dav1l'];
        const total = fields.reduce((sum, id) => sum + Number(document.getElementById(id)?.value || 0), 0);
        document.getElementById('ap-total').innerHTML = `Total packets: <strong>${Utils.num(total)}</strong>`;
      };
      ['ap-reg1l','ap-reg500','ap-cust1l','ap-cust500','ap-dav1l'].forEach(id =>
        document.getElementById(id)?.addEventListener('input', calcTotal));

      prodForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const confirmed = await UI.confirm('Log Production', 'Submit production data?');
        if (!confirmed) return;
        try {
          await API.logProduction({
            date: document.getElementById('ap-date').value,
            reg1l: Number(document.getElementById('ap-reg1l').value || 0),
            reg500: Number(document.getElementById('ap-reg500').value || 0),
            cust1l: Number(document.getElementById('ap-cust1l').value || 0),
            cust500: Number(document.getElementById('ap-cust500').value || 0),
            dav1l: Number(document.getElementById('ap-dav1l').value || 0),
            notes: document.getElementById('ap-notes').value,
          });
          UI.toast('Production logged!', 'success');
          prodForm.reset();
          document.getElementById('ap-date').value = Utils.today();
        } catch (err) { UI.toast(err.message, 'error'); }
      });
    }

    // History
    if (AccountantView.currentTab === 'history') {
      AccountantView.loadHistory();
    }
  },

  async loadHistory() {
    try {
      const [sales, expenses] = await Promise.all([API.getSalesLog(), API.getExpenseLog()]);
      const sh = document.getElementById('sales-history');
      const eh = document.getElementById('expense-history');
      if (sh) {
        sh.innerHTML = '<strong style="font-size:14px">Recent Sales</strong>' +
          UI.logTable(['Date','SKU','Qty','Price','Revenue','Customer','Payment','Notes'], sales.data, { limit: 15 });
      }
      if (eh) {
        eh.innerHTML = '<strong style="font-size:14px">Recent Expenses</strong>' +
          UI.logTable(['Date','Category','Description','Amount','Payment','Notes'], expenses.data, { limit: 15 });
      }
    } catch (err) {
      const sh = document.getElementById('sales-history');
      if (sh) sh.innerHTML = UI.alert('Could not load history', err.message + '. Ask Owner to run Setup first.', 'warning');
    }
  }
};
