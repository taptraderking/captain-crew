const express = require('express');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/health', (req, res) => {
  let serviceAccountStatus = 'NOT_SET';
  let serviceAccountEmail = null;
  try {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '';
    if (!raw) { serviceAccountStatus = 'ENV_EMPTY'; }
    else {
      const creds = JSON.parse(raw);
      serviceAccountEmail = creds.client_email || null;
      serviceAccountStatus = creds.client_email ? 'OK' : 'JSON_VALID_BUT_NO_EMAIL';
    }
  } catch (e) {
    serviceAccountStatus = 'JSON_PARSE_ERROR: ' + e.message.substring(0, 100);
  }

  res.json({
    status: 'running',
    sheetId: process.env.GOOGLE_SHEET_ID ? 'SET' : 'MISSING',
    sheetIdPreview: process.env.GOOGLE_SHEET_ID ? process.env.GOOGLE_SHEET_ID.substring(0, 12) + '...' : null,
    serviceAccount: serviceAccountStatus,
    serviceAccountEmail,
    timestamp: new Date().toISOString()
  });
});

router.get('/config', requireAuth, (req, res) => {
  const role = req.session.user.role;
  res.json({
    user: req.session.user,
    skus: [
      { id: 'reg1l', name: 'Regular 1L', shortName: 'Reg 1L', bottles: 12, icon: '💧' },
      { id: 'reg500', name: 'Regular 500ml', shortName: 'Reg 500', bottles: 24, icon: '💦' },
      { id: 'cust1l', name: 'Custom 1L', shortName: 'Cust 1L', bottles: 12, icon: '🏨' },
      { id: 'cust500', name: 'Custom 500ml', shortName: 'Cust 500', bottles: 24, icon: '🍽️' },
      { id: 'dav1l', name: 'DaV Aqua 1L', shortName: 'DaV Aqua', bottles: 12, icon: '🚂' },
    ],
    rawMaterials: ['Preform', 'Cap', 'Bopp/Sticker', 'Shrink', 'Carton', 'Ink', 'Glue', 'Minerals'],
    expenseCategories: ['EMI', 'Wages', 'Diesel/Fuel', 'Electricity', 'Delivery Van', 'Admin', 'Maintenance', 'Marketing', 'Rent', 'Insurance', 'Other'],
    paymentModes: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Credit'],
    permissions: {
      canEditConfig: role === 'owner',
      canLogSales: role === 'accountant' || role === 'owner',
      canLogExpenses: role === 'accountant' || role === 'owner',
      canLogPurchases: role === 'manager' || role === 'owner',
      canLogProduction: true,
      canViewDashboard: true,
      canRunSetup: role === 'owner',
    }
  });
});

module.exports = router;
