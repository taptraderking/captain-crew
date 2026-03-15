// ─── REUSABLE COMPONENTS ─────────────────────────────────────────────────────
const UI = {
  // Toast notifications
  toast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = Utils.el('div', { className: 'toast-container' });
      document.body.appendChild(container);
    }
    const t = Utils.el('div', { className: `toast toast-${type}`, textContent: message });
    container.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  },

  // Confirmation modal
  confirm(title, message) {
    return new Promise(resolve => {
      const overlay = Utils.el('div', { className: 'modal-overlay' });
      const modal = Utils.el('div', { className: 'modal' }, [
        Utils.el('h3', { textContent: title }),
        Utils.el('p', { textContent: message }),
        Utils.el('div', { className: 'modal-actions' }, [
          Utils.el('button', { className: 'btn btn-secondary', textContent: 'Cancel', onClick: () => { overlay.remove(); resolve(false); } }),
          Utils.el('button', { className: 'btn btn-primary', textContent: 'Confirm', onClick: () => { overlay.remove(); resolve(true); } }),
        ]),
      ]);
      overlay.appendChild(modal);
      overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.remove(); resolve(false); } });
      document.body.appendChild(overlay);
    });
  },

  // Loading spinner
  loading(message = 'Loading...') {
    return `<div class="spinner"></div><div class="loading-text">${message}</div>`;
  },

  // Status badge
  badge(status) {
    const map = { ok: 'badge-ok', warning: 'badge-warning', critical: 'badge-critical', low: 'badge-warning' };
    const labels = { ok: 'Healthy', warning: 'Warning', critical: 'Critical', low: 'Low' };
    return `<span class="badge ${map[status] || 'badge-ok'}">${labels[status] || status}</span>`;
  },

  // Progress bar
  progress(value, max, color = 'var(--accent)') {
    const pctW = Math.min((value / max) * 100, 100);
    return `<div class="progress"><div class="progress-fill" style="width:${pctW}%;background:${color}"></div></div>`;
  },

  // Card
  card(content, opts = {}) {
    const cls = ['card', opts.clickable ? 'clickable' : '', opts.hero || '', opts.className || ''].filter(Boolean).join(' ');
    return `<div class="${cls}" ${opts.id ? `id="${opts.id}"` : ''} style="${opts.style || ''}">${content}</div>`;
  },

  // Alert
  alert(title, text, type = 'info') {
    return `<div class="alert alert-${type} card"><div class="alert-title">${title}</div><div class="alert-text">${text}</div></div>`;
  },

  // Section title
  sectionTitle(text) {
    return `<div class="section-title">${text}</div>`;
  },

  // Form field
  formField(label, inputHtml, id) {
    return `<div class="form-group"><label class="form-label" for="${id || ''}">${label}</label>${inputHtml}</div>`;
  },

  input(id, opts = {}) {
    return `<input class="form-input" id="${id}" name="${id}" type="${opts.type || 'text'}" placeholder="${opts.placeholder || ''}" value="${opts.value || ''}" ${opts.required ? 'required' : ''} ${opts.step ? `step="${opts.step}"` : ''} ${opts.min !== undefined ? `min="${opts.min}"` : ''}>`;
  },

  select(id, options, opts = {}) {
    const optHtml = options.map(o => {
      const val = typeof o === 'string' ? o : o.value;
      const label = typeof o === 'string' ? o : o.label;
      const sel = val === opts.selected ? ' selected' : '';
      return `<option value="${val}"${sel}>${label}</option>`;
    }).join('');
    return `<select class="form-select" id="${id}" name="${id}" ${opts.required ? 'required' : ''}><option value="">Select...</option>${optHtml}</select>`;
  },

  textarea(id, opts = {}) {
    return `<textarea class="form-textarea" id="${id}" name="${id}" placeholder="${opts.placeholder || ''}" rows="${opts.rows || 3}">${opts.value || ''}</textarea>`;
  },

  // Recent log table
  logTable(headers, rows, opts = {}) {
    if (!rows || rows.length <= 1) return '<div style="text-align:center;color:var(--text-muted);padding:24px;font-size:14px;">No entries yet</div>';
    const headerRow = headers.map(h => `<th>${h}</th>`).join('');
    const dataRows = rows.slice(1).reverse().slice(0, opts.limit || 20).map(row => {
      return '<tr>' + row.map(cell => `<td>${cell != null ? cell : ''}</td>`).join('') + '</tr>';
    }).join('');
    return `<div class="table-wrap"><table class="table"><thead><tr>${headerRow}</tr></thead><tbody>${dataRows}</tbody></table></div>`;
  }
};
