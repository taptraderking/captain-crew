const API = {
  async request(url, opts = {}) {
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts, body: opts.body ? JSON.stringify(opts.body) : undefined });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.details || 'Request failed');
    return data;
  },
  login: (u, p) => API.request('/auth/login', { method: 'POST', body: { username: u, password: p } }),
  logout: () => API.request('/auth/logout', { method: 'POST' }),
  me: () => API.request('/auth/me'),
  config: () => API.request('/api/config'),
  health: () => API.request('/api/health'),
  debug: () => API.request('/api/sheets/debug'),
  dashboard: () => API.request('/api/sheets/dashboard'),
  activity: () => API.request('/api/sheets/activity'),
  getSalesLog: () => API.request('/api/sheets/sales-log'),
  getPurchaseLog: () => API.request('/api/sheets/purchase-log'),
  getExpenseLog: () => API.request('/api/sheets/expense-log'),
  getProductionLog: () => API.request('/api/sheets/daily-production'),
  logSale: d => API.request('/api/sheets/sales-log', { method: 'POST', body: d }),
  logPurchase: d => API.request('/api/sheets/purchase-log', { method: 'POST', body: d }),
  logExpense: d => API.request('/api/sheets/expense-log', { method: 'POST', body: d }),
  logProduction: d => API.request('/api/sheets/daily-production', { method: 'POST', body: d }),
  approvePurchase: row => API.request('/api/sheets/purchase-approve/' + row, { method: 'PUT' }),
  rejectPurchase: row => API.request('/api/sheets/purchase-reject/' + row, { method: 'PUT' }),
  updateOverheads: v => API.request('/api/sheets/overheads', { method: 'PUT', body: { values: v } }),
  updateProduction: (t, m) => API.request('/api/sheets/production', { method: 'PUT', body: { totalProduction: t, salesMix: m } }),
  updateTargetProfit: v => API.request('/api/sheets/target-profit', { method: 'PUT', body: { targetProfit: v } }),
  setup: () => API.request('/api/sheets/setup', { method: 'POST' }),
};
