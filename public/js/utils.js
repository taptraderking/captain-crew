// ─── FORMATTING ──────────────────────────────────────────────────────────────
const Utils = {
  currency(n) {
    if (n == null || isNaN(n)) return '₹0';
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs >= 10000000) return sign + '₹' + (abs / 10000000).toFixed(2) + ' Cr';
    if (abs >= 100000) return sign + '₹' + (abs / 100000).toFixed(2) + ' L';
    return sign + '₹' + abs.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  },

  currencyFull(n) {
    if (n == null || isNaN(n)) return '₹0';
    return (n < 0 ? '-' : '') + '₹' + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  },

  pct(n) {
    if (n == null || isNaN(n)) return '0%';
    return (n * 100).toFixed(1) + '%';
  },

  num(n) {
    if (n == null || isNaN(n)) return '0';
    return Math.round(n).toLocaleString('en-IN');
  },

  today() {
    return new Date().toISOString().split('T')[0];
  },

  // Sanitize HTML
  esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // Create element helper
  el(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'className') e.className = v;
      else if (k === 'innerHTML') e.innerHTML = v;
      else if (k === 'textContent') e.textContent = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else e.setAttribute(k, v);
    });
    children.forEach(c => {
      if (typeof c === 'string') e.appendChild(document.createTextNode(c));
      else if (c) e.appendChild(c);
    });
    return e;
  }
};
