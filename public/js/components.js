const UI = {
  toast(message, type = 'success') {
    let c = document.querySelector('.toast-container');
    if (!c) { c = Utils.el('div', { className: 'toast-container' }); document.body.appendChild(c); }
    const t = Utils.el('div', { className: `toast toast-${type}`, textContent: message });
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  },

  confirm(title, message) {
    return new Promise(resolve => {
      const o = Utils.el('div', { className: 'modal-overlay' });
      const m = Utils.el('div', { className: 'modal' }, [
        Utils.el('h3', { textContent: title }),
        Utils.el('p', { textContent: message }),
        Utils.el('div', { className: 'modal-actions' }, [
          Utils.el('button', { className: 'btn btn-secondary', textContent: 'Cancel', onClick: () => { o.remove(); resolve(false); } }),
          Utils.el('button', { className: 'btn btn-primary', textContent: 'Confirm', onClick: () => { o.remove(); resolve(true); } }),
        ]),
      ]);
      o.appendChild(m);
      o.addEventListener('click', e => { if (e.target === o) { o.remove(); resolve(false); } });
      document.body.appendChild(o);
    });
  },

  loading(msg = 'Loading...') { return `<div class="spinner"></div><div class="loading-text">${msg}</div>`; },

  badge(status) {
    const map = { ok: 'badge-ok', warning: 'badge-warning', critical: 'badge-critical' };
    const labels = { ok: 'Healthy', warning: 'Warning', critical: 'Critical' };
    return `<span class="badge ${map[status] || 'badge-ok'}">${labels[status] || status}</span>`;
  },

  progress(value, max, color = 'var(--blue)') {
    return `<div class="progress"><div class="progress-fill" style="width:${Math.min(value/max*100,100)}%;background:${color}"></div></div>`;
  },

  alert(title, text, type = 'info') {
    return `<div class="alert alert-${type}"><div class="alert-title">${title}</div><div class="alert-text">${text}</div></div>`;
  },

  sectionTitle(text) { return `<div class="section-title">${text}</div>`; },

  formField(label, inputHtml, id) {
    return `<div class="form-group"><label class="form-label" for="${id || ''}">${label}</label>${inputHtml}</div>`;
  },

  input(id, opts = {}) {
    return `<input class="form-input" id="${id}" name="${id}" type="${opts.type || 'text'}" placeholder="${opts.placeholder || ''}" value="${opts.value || ''}" ${opts.required ? 'required' : ''} ${opts.step ? `step="${opts.step}"` : ''} ${opts.min !== undefined ? `min="${opts.min}"` : ''}>`;
  },

  select(id, options, opts = {}) {
    const html = options.map(o => {
      const val = typeof o === 'string' ? o : o.value;
      const label = typeof o === 'string' ? o : o.label;
      return `<option value="${val}"${val === opts.selected ? ' selected' : ''}>${label}</option>`;
    }).join('');
    return `<select class="form-select" id="${id}" name="${id}" ${opts.required ? 'required' : ''}><option value="">Select...</option>${html}</select>`;
  },

  textarea(id, opts = {}) {
    return `<textarea class="form-textarea" id="${id}" name="${id}" placeholder="${opts.placeholder || ''}" rows="${opts.rows || 3}">${opts.value || ''}</textarea>`;
  },

  logTable(headers, rows, opts = {}) {
    if (!rows || rows.length <= 1) return '<div style="text-align:center;color:var(--text-faint);padding:24px;font-size:13px">No entries yet</div>';
    const th = headers.map(h => `<th>${h}</th>`).join('');
    const tr = rows.slice(1).reverse().slice(0, opts.limit || 20).map(row =>
      '<tr>' + row.map(cell => `<td>${cell != null ? cell : ''}</td>`).join('') + '</tr>'
    ).join('');
    return `<div class="table-wrap"><table class="table"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>`;
  },

  // ─── ACTIVITY FEED ──────────────────────────────────────────────────────────
  activityFeed(feed) {
    if (!feed || !feed.length) return '<div style="text-align:center;color:var(--text-faint);padding:32px;font-size:13px">No activity yet. Start logging sales, purchases, or production.</div>';

    return feed.map(item => {
      const icons = { sale: '💰', purchase: '📦', expense: '💸', production: '🏭' };
      const colors = { sale: 'var(--green)', purchase: 'var(--blue)', expense: 'var(--red)', production: 'var(--cyan)' };
      const labels = { sale: 'SALE', purchase: 'PURCHASE', expense: 'EXPENSE', production: 'PRODUCTION' };
      const icon = icons[item.type] || '📋';
      const color = colors[item.type] || 'var(--text-dim)';
      const label = labels[item.type] || item.type.toUpperCase();

      let statusHtml = '';
      if (item.type === 'purchase' && item.status) {
        const sc = { pending: 'var(--amber)', approved: 'var(--green)', rejected: 'var(--red)' };
        statusHtml = `<span style="font-size:10px;font-weight:700;color:${sc[item.status]||'var(--text-faint)'};text-transform:uppercase;letter-spacing:0.5px">${item.status}</span>`;
      }

      const timeAgo = item.time ? UI.timeAgo(item.time) : item.date || '';
      const amountHtml = item.amount ? `<span style="font-weight:700;font-size:13px;color:${item.type==='sale'?'var(--green)':'var(--text)'}">₹${Number(item.amount).toLocaleString('en-IN')}</span>` : '';

      return `<div class="activity-item">
        <div class="activity-icon" style="background:${color}15;color:${color}">${icon}</div>
        <div class="activity-body">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="activity-type" style="color:${color}">${label}</span>
            ${statusHtml}
          </div>
          <div class="activity-detail">${item.detail}</div>
          <div class="activity-meta">
            ${item.by ? `<span>by ${item.by}</span>` : ''}
            <span>${timeAgo}</span>
            ${amountHtml}
          </div>
        </div>
      </div>`;
    }).join('');
  },

  timeAgo(ts) {
    try {
      const d = new Date(ts);
      const now = new Date();
      const diff = (now - d) / 1000;
      if (diff < 60) return 'just now';
      if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
      if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
      if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch { return ts || ''; }
  },

  // Purchase approval list for manager
  purchaseApprovalList(rows) {
    if (!rows || rows.length <= 1) return '<div style="text-align:center;color:var(--text-faint);padding:24px;font-size:13px">No pending purchases</div>';
    const pending = [];
    rows.slice(1).forEach((r, i) => {
      if ((r[9] || '').toLowerCase() === 'pending') {
        pending.push({ row: i + 2, date: r[0], material: r[1], supplier: r[2], qty: r[3], unit: r[4], rate: r[5], total: r[8], by: r[11] });
      }
    });
    if (!pending.length) return '<div style="text-align:center;color:var(--green);padding:24px;font-size:13px;font-weight:600">✅ All purchases approved</div>';

    return pending.map(p => `
      <div class="card" style="padding:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-weight:700;font-size:13px">📦 ${p.material}</span>
          <span class="badge badge-warning">Pending</span>
        </div>
        <div style="font-size:12px;color:var(--text-dim);margin-bottom:8px;line-height:1.6">
          ${p.qty} ${p.unit} @ ₹${p.rate} = <b style="color:var(--text)">₹${Number(p.total||0).toLocaleString('en-IN')}</b><br>
          Supplier: ${p.supplier || '—'} · Logged by ${p.by || '—'} · ${p.date}
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-success btn-sm approve-btn" data-row="${p.row}">✓ Approve</button>
          <button class="btn btn-danger btn-sm reject-btn" data-row="${p.row}">✗ Reject</button>
        </div>
      </div>
    `).join('');
  }
};
