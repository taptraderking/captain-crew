const express = require('express');
const { google } = require('googleapis');
const { requireAuth, requireRole } = require('../middleware/auth');
const router = express.Router();

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

function getSheets() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not set');
  let creds;
  try { creds = JSON.parse(raw); } catch (e) { throw new Error('Invalid JSON in GOOGLE_SERVICE_ACCOUNT_JSON: ' + e.message); }
  if (!creds.client_email) throw new Error('Service account JSON missing client_email');
  if (!creds.private_key) throw new Error('Service account JSON missing private_key');
  return google.sheets({ version: 'v4', auth: new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] }) });
}

async function readRange(range) {
  if (!SHEET_ID) throw new Error('GOOGLE_SHEET_ID not set');
  return ((await getSheets().spreadsheets.values.get({ spreadsheetId: SHEET_ID, range, valueRenderOption: 'UNFORMATTED_VALUE' })).data.values || []);
}
async function appendRows(range, values) {
  return (await getSheets().spreadsheets.values.append({ spreadsheetId: SHEET_ID, range, valueInputOption: 'USER_ENTERED', insertDataOption: 'INSERT_ROWS', requestBody: { values } })).data;
}
async function updateRange(range, values) {
  return (await getSheets().spreadsheets.values.update({ spreadsheetId: SHEET_ID, range, valueInputOption: 'USER_ENTERED', requestBody: { values } })).data;
}

function getHint(err) {
  const m = err.message || '';
  if (m.includes('not valid JSON')) return 'Paste entire JSON key file contents into GOOGLE_SERVICE_ACCOUNT_JSON env var';
  if (err.code === 404) return 'Wrong Sheet ID. Check URL of your Google Sheet.';
  if (err.code === 403) return 'Share the Google Sheet with the service account email as Editor.';
  return 'Check Render logs. Visit /api/sheets/debug for diagnostics.';
}

// ─── DIAGNOSTIC ──────────────────────────────────────────────────────────────
router.get('/debug', requireAuth, async (req, res) => {
  const checks = { sheetId: false, jsonParseable: false, hasEmail: false, hasKey: false, apiReachable: false, sheetReadable: false };
  let details = {};
  try {
    checks.sheetId = !!SHEET_ID;
    details.sheetIdPreview = SHEET_ID ? SHEET_ID.substring(0, 12) + '...' : 'NOT SET';
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '';
    details.jsonLength = raw.length;
    const creds = JSON.parse(raw);
    checks.jsonParseable = true;
    checks.hasEmail = !!creds.client_email;
    checks.hasKey = !!creds.private_key;
    details.email = creds.client_email || 'MISSING';
    const sheets = getSheets();
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    checks.apiReachable = true; checks.sheetReadable = true;
    details.sheetTitle = meta.data.properties.title;
    details.sheetCount = meta.data.sheets.length;
  } catch (e) { details.error = e.message; }
  res.json({ checks, details });
});

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const [overheadData, breakeven, pnl, skuConfig] = await Promise.all([
      readRange('Overhead Allocator!B7:C12'), readRange('Breakeven & Sales Target!B15:H48'),
      readRange('Monthly P&L Summary!B3:L15'), readRange('Breakeven & Sales Target!B19:I24'),
    ]);
    res.json({ overheadData, breakeven, pnl, skuConfig, live: true });
  } catch (err) { res.status(500).json({ error: err.message, hint: getHint(err) }); }
});

// ─── LIVE ACTIVITY FEED — ALL ROLES CAN SEE ─────────────────────────────────
router.get('/activity', requireAuth, async (req, res) => {
  try {
    const [sales, purchases, expenses, production] = await Promise.all([
      readRange('Sales_Log!A1:J500').catch(() => []),
      readRange('Purchase_Log!A1:M500').catch(() => []),
      readRange('Expense_Log!A1:H500').catch(() => []),
      readRange('Daily_Production!A1:J500').catch(() => []),
    ]);

    // Build unified feed sorted by timestamp (last column)
    const feed = [];
    if (sales.length > 1) sales.slice(1).forEach(r => feed.push({ type: 'sale', date: r[0], detail: `${r[1]} × ${r[2]} pkts @ ₹${r[3]}`, amount: r[4], by: r[8], time: r[9], customer: r[5], payment: r[6] }));
    if (purchases.length > 1) purchases.slice(1).forEach(r => feed.push({ type: 'purchase', date: r[0], detail: `${r[1]} — ${r[3]} ${r[4]} @ ₹${r[5]}`, amount: r[8], by: r[10], time: r[11], supplier: r[2], status: r[9] || 'pending' }));
    if (expenses.length > 1) expenses.slice(1).forEach(r => feed.push({ type: 'expense', date: r[0], detail: `${r[1]}: ${r[2]}`, amount: r[3], by: r[6], time: r[7], payment: r[4] }));
    if (production.length > 1) production.slice(1).forEach(r => feed.push({ type: 'production', date: r[0], detail: `${r[6]} total pkts (R1L:${r[1]} R500:${r[2]} C1L:${r[3]} C500:${r[4]} DaV:${r[5]})`, by: r[8], time: r[9] }));

    feed.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
    res.json({ feed: feed.slice(0, 50), counts: { sales: sales.length - 1, purchases: purchases.length - 1, expenses: expenses.length - 1, production: production.length - 1 } });
  } catch (err) { res.json({ feed: [], counts: {}, error: err.message }); }
});

// ─── ALL LOGS — READABLE BY EVERYONE ─────────────────────────────────────────
router.get('/sales-log', requireAuth, async (req, res) => {
  try { res.json({ data: await readRange('Sales_Log!A1:J500') }); } catch { res.json({ data: [] }); }
});
router.get('/purchase-log', requireAuth, async (req, res) => {
  try { res.json({ data: await readRange('Purchase_Log!A1:M500') }); } catch { res.json({ data: [] }); }
});
router.get('/expense-log', requireAuth, async (req, res) => {
  try { res.json({ data: await readRange('Expense_Log!A1:H500') }); } catch { res.json({ data: [] }); }
});
router.get('/daily-production', requireAuth, async (req, res) => {
  try { res.json({ data: await readRange('Daily_Production!A1:J500') }); } catch { res.json({ data: [] }); }
});

// ─── SALES LOG (Accountant) ──────────────────────────────────────────────────
router.post('/sales-log', requireRole('accountant', 'owner'), async (req, res) => {
  try {
    const { date, sku, quantity, sellingPrice, customerName, paymentMode, notes } = req.body;
    await appendRows('Sales_Log!A:J', [[date, sku, quantity, sellingPrice, quantity * sellingPrice, customerName || '', paymentMode || 'Cash', notes || '', req.session.user.name, new Date().toISOString()]]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PURCHASE LOG (Accountant logs, Manager approves) ────────────────────────
// Columns: Date | Material | Supplier | Qty | Unit | UnitRate | Total ex-GST | GST% | Total+GST | Status | Notes | LoggedBy | Timestamp
router.post('/purchase-log', requireRole('accountant', 'manager', 'owner'), async (req, res) => {
  try {
    const { date, material, supplier, quantity, unit, unitRate, gstRate, notes } = req.body;
    const total = quantity * unitRate;
    const totalGST = total * (1 + (gstRate || 0.05));
    const status = req.session.user.role === 'manager' ? 'approved' : 'pending';
    await appendRows('Purchase_Log!A:M', [[date, material, supplier || '', quantity, unit || 'kg', unitRate, total, gstRate || 0.05, totalGST, status, notes || '', req.session.user.name, new Date().toISOString()]]);
    res.json({ success: true, status });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Manager approves a purchase (update status column)
router.put('/purchase-approve/:row', requireRole('manager', 'owner'), async (req, res) => {
  try {
    const row = parseInt(req.params.row);
    if (isNaN(row) || row < 2) return res.status(400).json({ error: 'Invalid row' });
    await updateRange(`Purchase_Log!J${row}`, [['approved']]);
    res.json({ success: true, message: 'Purchase approved' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/purchase-reject/:row', requireRole('manager', 'owner'), async (req, res) => {
  try {
    const row = parseInt(req.params.row);
    if (isNaN(row) || row < 2) return res.status(400).json({ error: 'Invalid row' });
    await updateRange(`Purchase_Log!J${row}`, [['rejected']]);
    res.json({ success: true, message: 'Purchase rejected' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── EXPENSE LOG (Accountant) ────────────────────────────────────────────────
router.post('/expense-log', requireRole('accountant', 'owner'), async (req, res) => {
  try {
    const { date, category, description, amount, paymentMode, notes } = req.body;
    await appendRows('Expense_Log!A:H', [[date, category, description || '', amount, paymentMode || 'Cash', notes || '', req.session.user.name, new Date().toISOString()]]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PRODUCTION LOG (Anyone) ─────────────────────────────────────────────────
router.post('/daily-production', requireRole('accountant', 'manager', 'owner'), async (req, res) => {
  try {
    const { date, reg1l, reg500, cust1l, cust500, dav1l, notes } = req.body;
    const total = (reg1l||0)+(reg500||0)+(cust1l||0)+(cust500||0)+(dav1l||0);
    await appendRows('Daily_Production!A:J', [[date, reg1l||0, reg500||0, cust1l||0, cust500||0, dav1l||0, total, notes||'', req.session.user.name, new Date().toISOString()]]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── OWNER CONFIG WRITES ─────────────────────────────────────────────────────
router.get('/overheads', requireAuth, async (req, res) => {
  try { res.json({ data: await readRange('Sheet1!C1:D16') }); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/overheads', requireRole('owner'), async (req, res) => {
  try { await updateRange('Sheet1!C5:D10', req.body.values); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/production', requireRole('owner'), async (req, res) => {
  try {
    await updateRange('Breakeven & Sales Target!D23', [[req.body.totalProduction]]);
    if (req.body.salesMix?.length === 4) await updateRange('Breakeven & Sales Target!D24:G24', [req.body.salesMix]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/target-profit', requireRole('owner'), async (req, res) => {
  try { await updateRange('Breakeven & Sales Target!D27', [[req.body.targetProfit]]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── SETUP ───────────────────────────────────────────────────────────────────
router.post('/setup', requireRole('owner'), async (req, res) => {
  try {
    const sheets = getSheets();
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    const existing = meta.data.sheets.map(s => s.properties.title);
    const toCreate = [
      { name: 'Sales_Log', headers: ['Date','SKU','Qty (Pkts)','Selling Price','Revenue','Customer','Payment Mode','Notes','Logged By','Timestamp'] },
      { name: 'Purchase_Log', headers: ['Date','Material','Supplier','Quantity','Unit','Unit Rate','Total (ex-GST)','GST Rate','Total (incl GST)','Status','Notes','Logged By','Timestamp'] },
      { name: 'Expense_Log', headers: ['Date','Category','Description','Amount','Payment Mode','Notes','Logged By','Timestamp'] },
      { name: 'Daily_Production', headers: ['Date','Reg 1L Pkts','Reg 500ml Pkts','Cust 1L Pkts','Cust 500ml Pkts','DaV Aqua Pkts','Total Pkts','Notes','Logged By','Timestamp'] },
    ];
    const created = [];
    for (const s of toCreate) {
      if (!existing.includes(s.name)) {
        await sheets.spreadsheets.batchUpdate({ spreadsheetId: SHEET_ID, requestBody: { requests: [{ addSheet: { properties: { title: s.name } } }] } });
        await appendRows(`${s.name}!A1`, [s.headers]);
        created.push(s.name);
      }
    }
    res.json({ success: true, created, message: created.length ? `Created: ${created.join(', ')}` : 'All sheets exist' });
  } catch (err) { res.status(500).json({ error: err.message, hint: getHint(err) }); }
});

module.exports = router;
