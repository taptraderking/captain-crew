const API = {
  async request(url, options = {}) {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.details || 'Request failed');
    return data;
  },

  login: (u, p) => API.request('/auth/login', { method: 'POST', body: { username: u, password: p } }),
  logout: () => API.request('/auth/logout', { method: 'POST' }),
  me: () => API.request('/auth/me'),
  config: () => API.request('/api/config'),
  health: () => API.request('/api/health'),

  // Sheets
  debug: () => API.request('/api/sheets/debug'),
  dashboard: () => API.request('/api/sheets/dashboard'),
  pricing: (sku) => API.request(`/api/sheets/pricing/${sku}`),
  rawMaterials: (sku) => API.request(`/api/sheets/rawmaterials/${sku}`),
  sensitivity: () => API.request('/api/sheets/sensitivity'),
  channels: () => API.request('/api/sheets/channels'),
  overheads: () => API.request('/api/sheets/overheads'),

  updateOverheads: (values) => API.request('/api/sheets/overheads', { method: 'PUT', body: { values } }),
  updateProduction: (t, m) => API.request('/api/sheets/production', { method: 'PUT', body: { totalProduction: t, salesMix: m } }),
  updateTargetProfit: (v) => API.request('/api/sheets/target-profit', { method: 'PUT', body: { targetProfit: v } }),
  updateMargin: (sku, m) => API.request(`/api/sheets/margin/${sku}`, { method: 'PUT', body: { margin: m } }),
  updateRawMaterials: (sku, r) => API.request(`/api/sheets/rawmaterials/${sku}`, { method: 'PUT', body: { rates: r } }),

  getSalesLog: () => API.request('/api/sheets/sales-log'),
  logSale: (d) => API.request('/api/sheets/sales-log', { method: 'POST', body: d }),
  getPurchaseLog: () => API.request('/api/sheets/purchase-log'),
  logPurchase: (d) => API.request('/api/sheets/purchase-log', { method: 'POST', body: d }),
  getExpenseLog: () => API.request('/api/sheets/expense-log'),
  logExpense: (d) => API.request('/api/sheets/expense-log', { method: 'POST', body: d }),
  getProductionLog: () => API.request('/api/sheets/daily-production'),
  logProduction: (d) => API.request('/api/sheets/daily-production', { method: 'POST', body: d }),
  setup: () => API.request('/api/sheets/setup', { method: 'POST' }),
};
