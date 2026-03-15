// ─── MANAGER VIEW ────────────────────────────────────────────────────────────
const ManagerView = {
  config: null,
  currentTab: 'purchase',

  async render() {
    return `
      <div class="topbar">
        <div>
          <div class="topbar-title">📦 Manager Panel</div>
          <div class="topbar-sub">Raw Material Purchases & Production</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="topbar-btn" onclick="App.toggleTheme()">🌓</button>
          <button class="topbar-btn" onclick="App.logout()">↗</button>
        </div>
      </div>
      <div class="content fade-in" id="manager-content">${UI.loading()}</div>
      <nav class="bottom-nav">
        <button class="nav-item active" data-tab="purchase"><span class="nav-icon">🛒</span><span class="nav-label">Purchase</span></button>
        <button class="nav-item" data-tab="production"><span class="nav-icon">🏭</span><span class="nav-label">Production</span></button>
        <button class="nav-item" data-tab="history"><span class="nav-icon">📋</span><span class="nav-label">History</span></button>
        <button class="nav-item" data-tab="rates"><span class="nav-icon">📊</span><span class="nav-label">RM Rates</span></button>
      </nav>
    `;
  },

  async init() {
    try {
      ManagerView.config = await API.config();
    } catch { ManagerView.config = { skus: [], rawMaterials: [], paymentModes: ['Cash','UPI','Bank Transfer'] }; }

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
    const c = document.getElementById('manager-content');
    const tabs = {
      purchase: ManagerView.renderPurchaseForm,
      production: ManagerView.renderProductionForm,
      history: ManagerView.renderHistory,
      rates: ManagerView.renderRates,
    };
    c.innerHTML = '<div class="fade-in">' + (tabs[ManagerView.currentTab] || tabs.purchase)() + '</div>';
    ManagerView.attachEvents();
  },

  renderPurchaseForm() {
    const materials = ['Preform', 'Cap', 'Bopp', 'Sticker', 'Shrink', 'Carton', 'Ink', 'Glue', 'Minerals', 'Micro Filter', 'Other'];
    const units = ['kg', 'pcs', 'rolls', 'litres', 'packets', 'boxes'];

    return `
      ${UI.sectionTitle('🛒 Log Raw Material Purchase')}
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
          ${UI.formField('GST %', UI.select('p-gst', [{value:'0.05',label:'5%'},{value:'0.12',label:'12%'},{value:'0.18',label:'18%'},{value:'0',label:'None'}], { selected: '0.05' }))}
        </div>
        <div id="p-total" style="padding:10px;background:var(--surface);border-radius:8px;margin-bottom:12px;font-size:14px">
          Total: <strong>₹0.00</strong>
        </div>
        ${UI.formField('Notes', UI.textarea('p-notes', { placeholder: 'Any additional notes...', rows: 2 }))}
        <button type="submit" class="btn btn-primary">✓ Log Purchase</button>
      </form>
    `;
  },

  renderProductionForm() {
    return `
      ${UI.sectionTitle('🏭 Log Daily Production')}
      <form id="production-form" class="card">
        ${UI.formField('Date', UI.input('prod-date', { type: 'date', value: Utils.today(), required: true }))}
        <div class="grid-2">
          ${UI.formField('💧 Reg 1L (pkts)', UI.input('prod-reg1l', { type: 'number', placeholder: '0', min: '0' }))}
          ${UI.formField('💦 Reg 500ml (pkts)', UI.input('prod-reg500', { type: 'number', placeholder: '0', min: '0' }))}
        </div>
        <div class="grid-2">
          ${UI.formField('🏨 Cust 1L (pkts)', UI.input('prod-cust1l', { type: 'number', placeholder: '0', min: '0' }))}
          ${UI.formField('🍽️ Cust 500ml (pkts)', UI.input('prod-cust500', { type: 'number', placeholder: '0', min: '0' }))}
        </div>
        ${UI.formField('🚂 DaV Aqua 1L (pkts)', UI.input('prod-dav1l', { type: 'number', placeholder: '0', min: '0' }))}
        <div id="prod-total" style="padding:10px;background:var(--surface);border-radius:8px;margin-bottom:12px;font-size:14px">
          Total packets: <strong>0</strong>
        </div>
        ${UI.formField('Notes', UI.textarea('prod-notes', { placeholder: 'Shift details, issues...', rows: 2 }))}
        <button type="submit" class="btn btn-primary">✓ Log Production</button>
      </form>
    `;
  },

  renderHistory() {
    return `
      ${UI.sectionTitle('📋 Recent Entries')}
      <div class="card" id="purchase-history">${UI.loading('Loading purchase log...')}</div>
      <div class="card" id="production-history" style="margin-top:12px">${UI.loading('Loading production log...')}</div>
    `;
  },

  renderRates() {
    return `
      ${UI.sectionTitle('📊 Update Raw Material Rates')}
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">Update revised rates for any SKU. This updates the pricing calculator.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px" id="sku-selector">
        ${['reg1l','reg500','cust1l','cust500','dav1l'].map((id, i) => 
          `<button class="sku-pill ${i===0?'active':''}" data-sku="${id}"><span class="sku-icon">${['💧','💦','🏨','🍽️','🚂'][i]}</span><span class="sku-name">${['Reg 1L','Reg 500','Cust 1L','Cust 500','DaV Aqua'][i]}</span></button>`
        ).join('')}
      </div>
      <form id="rates-form" class="card">
        ${['Preform','Cap','Bopp/Sticker','Shrink','Carton'].map(m => 
          UI.formField(`${m} (₹)`, UI.input(`rate-${m.toLowerCase().replace(/\//g,'')}`, { type: 'number', step: '0.01', placeholder: 'Revised rate' }))
        ).join('')}
        <button type="submit" class="btn btn-success">Update Rates</button>
      </form>
    `;
  },

  attachEvents() {
    // Purchase form
    const pForm = document.getElementById('purchase-form');
    if (pForm) {
      const calcTotal = () => {
        const qty = Number(document.getElementById('p-qty')?.value || 0);
        const rate = Number(document.getElementById('p-rate')?.value || 0);
        const gst = Number(document.getElementById('p-gst')?.value || 0.05);
        const total = qty * rate * (1 + gst);
        document.getElementById('p-total').innerHTML = `Total: <strong>${Utils.currencyFull(total)}</strong> (incl. GST)`;
      };
      ['p-qty', 'p-rate', 'p-gst'].forEach(id => document.getElementById(id)?.addEventListener('input', calcTotal));

      pForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const confirmed = await UI.confirm('Log Purchase', 'Submit this purchase entry?');
        if (!confirmed) return;
        try {
          await API.logPurchase({
            date: document.getElementById('p-date').value,
            material: document.getElementById('p-material').value,
            supplier: document.getElementById('p-supplier').value,
            quantity: Number(document.getElementById('p-qty').value),
            unit: document.getElementById('p-unit').value,
            unitRate: Number(document.getElementById('p-rate').value),
            gstRate: Number(document.getElementById('p-gst').value),
            notes: document.getElementById('p-notes').value,
          });
          UI.toast('Purchase logged!', 'success');
          pForm.reset();
          document.getElementById('p-date').value = Utils.today();
        } catch (err) { UI.toast(err.message, 'error'); }
      });
    }

    // Production form
    const prodForm = document.getElementById('production-form');
    if (prodForm) {
      const calcProdTotal = () => {
        const fields = ['prod-reg1l','prod-reg500','prod-cust1l','prod-cust500','prod-dav1l'];
        const total = fields.reduce((sum, id) => sum + Number(document.getElementById(id)?.value || 0), 0);
        document.getElementById('prod-total').innerHTML = `Total packets: <strong>${Utils.num(total)}</strong>`;
      };
      ['prod-reg1l','prod-reg500','prod-cust1l','prod-cust500','prod-dav1l'].forEach(id =>
        document.getElementById(id)?.addEventListener('input', calcProdTotal));

      prodForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const confirmed = await UI.confirm('Log Production', 'Submit today\'s production?');
        if (!confirmed) return;
        try {
          await API.logProduction({
            date: document.getElementById('prod-date').value,
            reg1l: Number(document.getElementById('prod-reg1l').value || 0),
            reg500: Number(document.getElementById('prod-reg500').value || 0),
            cust1l: Number(document.getElementById('prod-cust1l').value || 0),
            cust500: Number(document.getElementById('prod-cust500').value || 0),
            dav1l: Number(document.getElementById('prod-dav1l').value || 0),
            notes: document.getElementById('prod-notes').value,
          });
          UI.toast('Production logged!', 'success');
          prodForm.reset();
          document.getElementById('prod-date').value = Utils.today();
        } catch (err) { UI.toast(err.message, 'error'); }
      });
    }

    // History tab - load data
    if (ManagerView.currentTab === 'history') {
      ManagerView.loadHistory();
    }

    // SKU selector for rates
    document.querySelectorAll('.sku-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.sku-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
      });
    });

    // Rates form
    const ratesForm = document.getElementById('rates-form');
    if (ratesForm) {
      ratesForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const activeSku = document.querySelector('.sku-pill.active')?.dataset.sku;
        if (!activeSku) return UI.toast('Select a SKU first', 'error');
        const confirmed = await UI.confirm('Update Rates', `Update raw material rates for ${activeSku}? This changes pricing calculations.`);
        if (!confirmed) return;
        try {
          await API.updateRawMaterials(activeSku, {
            preform: Number(document.getElementById('rate-preform')?.value) || undefined,
            cap: Number(document.getElementById('rate-cap')?.value) || undefined,
            bopp: Number(document.getElementById('rate-boppsticker')?.value) || undefined,
            shrink: Number(document.getElementById('rate-shrink')?.value) || undefined,
            carton: Number(document.getElementById('rate-carton')?.value) || undefined,
          });
          UI.toast('Rates updated!', 'success');
        } catch (err) { UI.toast(err.message, 'error'); }
      });
    }
  },

  async loadHistory() {
    try {
      const [purchases, production] = await Promise.all([API.getPurchaseLog(), API.getProductionLog()]);
      const ph = document.getElementById('purchase-history');
      const prh = document.getElementById('production-history');
      if (ph) {
        ph.innerHTML = '<strong style="font-size:14px">Recent Purchases</strong>' +
          UI.logTable(['Date','Material','Supplier','Qty','Unit','Rate','Total','GST','Total+GST','Notes'], purchases.data, { limit: 15 });
      }
      if (prh) {
        prh.innerHTML = '<strong style="font-size:14px">Recent Production</strong>' +
          UI.logTable(['Date','Reg 1L','Reg 500','Cust 1L','Cust 500','DaV Aqua','Total','Notes'], production.data, { limit: 15 });
      }
    } catch (err) {
      const ph = document.getElementById('purchase-history');
      if (ph) ph.innerHTML = UI.alert('Could not load history', err.message + '. Run Setup from Owner Config tab first.', 'warning');
    }
  }
};
