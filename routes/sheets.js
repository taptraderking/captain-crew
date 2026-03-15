const express = require('express');
const { google } = require('googleapis');
const { requireAuth, requireRole } = require('../middleware/auth');
const router = express.Router();

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

function getSheets() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON environment variable is empty or not set');
  let credentials;
  try {
    credentials = JSON.parse(raw);
  } catch (e) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON. Make sure you pasted the ENTIRE contents of the .json key file. Error: ' + e.message);
  }
  if (!credentials.client_email) {
    throw new Error('Service account JSON is missing client_email. The JSON may be truncated or corrupted. It should start with {"type":"service_account"...');
  }
  if (!credentials.private_key) {
    throw new Error('Service account JSON is missing private_key. The JSON may be truncated.');
  }
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

async function readRange(range) {
  if (!SHEET_ID) throw new Error('GOOGLE_SHEET_ID not set in environment variables');
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID, range, valueRenderOption: 'UNFORMATTED_VALUE',
  });
  return res.data.values || [];
}

async function appendRows(range, values) {
  const sheets = getSheets();
  return (await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID, range, valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS', requestBody: { values },
  })).data;
}

async function updateRange(range, values) {
  const sheets = getSheets();
  return (await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID, range, valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  })).data;
}

// ─── DIAGNOSTIC ENDPOINT ─────────────────────────────────────────────────────
router.get('/debug', requireAuth, async (req, res) => {
  const checks = { sheetId: false, jsonParseable: false, hasEmail: false, hasKey: false, apiReachable: false, sheetReadable: false };
  let details = {};
  try {
    checks.sheetId = !!SHEET_ID;
    details.sheetIdPreview = SHEET_ID ? SHEET_ID.substring(0,12) + '...' : 'NOT SET';

    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '';
    details.jsonLength = raw.length;
    details.jsonStart = raw.substring(0, 40) + '...';

    const creds = JSON.parse(raw);
    checks.jsonParseable = true;
    checks.hasEmail = !!creds.client_email;
    checks.hasKey = !!creds.private_key;
    details.email = creds.client_email || 'MISSING';
    details.projectId = creds.project_id || 'MISSING';

    const sheets = getSheets();
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    checks.apiReachable = true;
    checks.sheetReadable = true;
    details.sheetTitle = meta.data.properties.title;
    details.sheetCount = meta.data.sheets.length;
    details.sheetNames = meta.data.sheets.map(s => s.properties.title);
  } catch (e) {
    details.error = e.message;
    if (e.code) details.errorCode = e.code;
    if (e.response && e.response.data) details.apiError = JSON.stringify(e.response.data).substring(0, 300);
  }
  res.json({ checks, details });
});

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const [overheadData, breakeven, pnl, skuConfig] = await Promise.all([
      readRange('Overhead Allocator!B7:C12'),
      readRange('Breakeven & Sales Target!B15:H48'),
      readRange('Monthly P&L Summary!B3:L15'),
      readRange('Breakeven & Sales Target!B19:I24'),
    ]);
    res.json({ overheadData, breakeven, pnl, skuConfig, live: true });
  } catch (err) {
    console.error('Dashboard error:', err.message);
    res.status(500).json({ error: 'Sheets connection failed', details: err.message, code: err.code || null, hint: getHint(err) });
  }
});

function getHint(err) {
  const msg = err.message || '';
  if (msg.includes('not valid JSON')) return 'The GOOGLE_SERVICE_ACCOUNT_JSON env var is not valid JSON. Open the downloaded .json file in Notepad, copy ALL text, paste into Render env var.';
  if (msg.includes('GOOGLE_SHEET_ID not set')) return 'Add GOOGLE_SHEET_ID to your Render environment variables. It is the long string from your Google Sheet URL between /d/ and /edit';
  if (msg.includes('not found') || (err.code === 404)) return 'Sheet ID is wrong or the spreadsheet was deleted. Double-check the ID from your Google Sheet URL.';
  if (err.code === 403) return 'The service account does not have permission. Go to Google Sheets → Share → add the service account email as Editor.';
  if (msg.includes('invalid_grant') || msg.includes('JWT')) return 'Service account credentials are invalid. Download a fresh JSON key from Google Cloud Console.';
  return 'Check Render logs for more details. Visit /api/sheets/debug for full diagnostics.';
}

// ─── PRICING & RAW MATERIALS ─────────────────────────────────────────────────
router.get('/pricing/:sku', requireAuth, async (req, res) => {
  try {
    const map = { reg1l: '1 Ltr_PC', reg500: '500ml PC', cust1l: 'Cust 1L PC', cust500: 'Cust 500ml PC', dav1l: 'DA 1Ltr PC' };
    const sheet = map[req.params.sku];
    if (!sheet) return res.status(400).json({ error: 'Invalid SKU' });
    res.json({ sku: req.params.sku, data: await readRange(`'${sheet}'!B1:F40`) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/rawmaterials/:sku', requireAuth, async (req, res) => {
  try {
    const map = { reg1l: '1ltr_RMC', reg500: '500ml RMC', cust1l: 'cust 1 ltr RMC', cust500: 'Cust 500ml RMC', dav1l: 'DA 1Ltr RMC' };
    const sheet = map[req.params.sku];
    if (!sheet) return res.status(400).json({ error: 'Invalid SKU' });
    res.json({ sku: req.params.sku, data: await readRange(`'${sheet}'!B1:K40`) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/sensitivity', requireAuth, async (req, res) => {
  try { res.json({ data: await readRange('Sensitivity Analysis!B1:J19') }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/channels', requireAuth, async (req, res) => {
  try { res.json({ data: await readRange('Channel Pricing!B1:J10') }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/overheads', requireAuth, async (req, res) => {
  try { res.json({ data: await readRange('Sheet1!C1:D16') }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── OWNER WRITES ────────────────────────────────────────────────────────────
router.put('/overheads', requireRole('owner'), async (req, res) => {
  try { await updateRange('Sheet1!C5:D10', req.body.values); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/production', requireRole('owner'), async (req, res) => {
  try {
    const { totalProduction, salesMix } = req.body;
    await updateRange('Breakeven & Sales Target!D23', [[totalProduction]]);
    if (salesMix && salesMix.length === 4) await updateRange('Breakeven & Sales Target!D24:G24', [salesMix]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/target-profit', requireRole('owner'), async (req, res) => {
  try { await updateRange('Breakeven & Sales Target!D27', [[req.body.targetProfit]]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/margin/:sku', requireRole('owner'), async (req, res) => {
  try {
    const map = { reg1l: "'1 Ltr_PC'!E25", reg500: "'500ml PC'!E24", cust1l: "'Cust 1L PC'!E26", cust500: "'Cust 500ml PC'!E26", dav1l: "'DA 1Ltr PC'!E26" };
    const cell = map[req.params.sku];
    if (!cell) return res.status(400).json({ error: 'Invalid SKU' });
    await updateRange(cell, [[req.body.margin]]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/rawmaterials/:sku', requireRole('manager', 'owner'), async (req, res) => {
  try {
    const { rates } = req.body;
    const map = {
      reg1l: { sheet: '1ltr_RMC', col: 'E', rows: [5,6,7,9,10] },
      reg500: { sheet: '500ml RMC', col: 'F', rows: [9,10,11,13,14] },
      cust1l: { sheet: 'cust 1 ltr RMC', col: 'G', rows: [8,9,10,12,13] },
      cust500: { sheet: 'Cust 500ml RMC', col: 'F', rows: [9,10,11,13,14] },
      dav1l: { sheet: 'DA 1Ltr RMC', col: 'G', rows: [8,9,10,12,13] },
    };
    const m = map[req.params.sku];
    if (!m) return res.status(400).json({ error: 'Invalid SKU' });
    const vals = [rates.preform, rates.cap, rates.bopp, rates.shrink, rates.carton];
    for (let i = 0; i < vals.length; i++) {
      if (vals[i] != null) await updateRange(`'${m.sheet}'!${m.col}${m.rows[i]}`, [[vals[i]]]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── LOG SHEETS ──────────────────────────────────────────────────────────────
router.get('/sales-log', requireAuth, async (req, res) => {
  try { res.json({ data: await readRange('Sales_Log!A1:J500') }); }
  catch (err) { res.json({ data: [], note: 'Run Setup first' }); }
});
router.post('/sales-log', requireRole('accountant', 'owner'), async (req, res) => {
  try {
    const { date, sku, quantity, sellingPrice, customerName, paymentMode, notes } = req.body;
    await appendRows('Sales_Log!A:J', [[date, sku, quantity, sellingPrice, quantity*sellingPrice, customerName||'', paymentMode||'Cash', notes||'', req.session.user.name, new Date().toISOString()]]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/purchase-log', requireAuth, async (req, res) => {
  try { res.json({ data: await readRange('Purchase_Log!A1:L500') }); }
  catch (err) { res.json({ data: [], note: 'Run Setup first' }); }
});
router.post('/purchase-log', requireRole('manager', 'owner'), async (req, res) => {
  try {
    const { date, material, supplier, quantity, unit, unitRate, gstRate, notes } = req.body;
    const total = quantity * unitRate;
    await appendRows('Purchase_Log!A:L', [[date, material, supplier||'', quantity, unit||'kg', unitRate, total, gstRate||0.05, total*(1+(gstRate||0.05)), notes||'', req.session.user.name, new Date().toISOString()]]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/expense-log', requireAuth, async (req, res) => {
  try { res.json({ data: await readRange('Expense_Log!A1:H500') }); }
  catch (err) { res.json({ data: [], note: 'Run Setup first' }); }
});
router.post('/expense-log', requireRole('accountant', 'owner'), async (req, res) => {
  try {
    const { date, category, description, amount, paymentMode, notes } = req.body;
    await appendRows('Expense_Log!A:H', [[date, category, description||'', amount, paymentMode||'Cash', notes||'', req.session.user.name, new Date().toISOString()]]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/daily-production', requireAuth, async (req, res) => {
  try { res.json({ data: await readRange('Daily_Production!A1:J500') }); }
  catch (err) { res.json({ data: [], note: 'Run Setup first' }); }
});
router.post('/daily-production', requireRole('accountant', 'manager', 'owner'), async (req, res) => {
  try {
    const { date, reg1l, reg500, cust1l, cust500, dav1l, notes } = req.body;
    const total = (reg1l||0)+(reg500||0)+(cust1l||0)+(cust500||0)+(dav1l||0);
    await appendRows('Daily_Production!A:J', [[date, reg1l||0, reg500||0, cust1l||0, cust500||0, dav1l||0, total, notes||'', req.session.user.name, new Date().toISOString()]]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── SETUP ───────────────────────────────────────────────────────────────────
router.post('/setup', requireRole('owner'), async (req, res) => {
  try {
    const sheets = getSheets();
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    const existing = meta.data.sheets.map(s => s.properties.title);
    const toCreate = [
      { name: 'Sales_Log', headers: ['Date','SKU','Qty (Pkts)','Selling Price','Revenue','Customer','Payment Mode','Notes','Logged By','Timestamp'] },
      { name: 'Purchase_Log', headers: ['Date','Material','Supplier','Quantity','Unit','Unit Rate','Total (ex-GST)','GST Rate','Total (incl GST)','Notes','Logged By','Timestamp'] },
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
    res.json({ success: true, created, message: created.length ? `Created: ${created.join(', ')}` : 'All log sheets already exist' });
  } catch (err) { res.status(500).json({ error: err.message, hint: getHint(err) }); }
});

module.exports = router;
