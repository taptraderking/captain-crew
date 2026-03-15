require('dotenv').config();
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const sheetsRoutes = require('./routes/sheets');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1);

app.use(session({
  secret: process.env.SESSION_SECRET || 'captain-crew-change-me-32chars',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/sheets', sheetsRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚰 Captain Crew running on port ${PORT}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   GOOGLE_SHEET_ID: ${process.env.GOOGLE_SHEET_ID ? '✅ Set (' + process.env.GOOGLE_SHEET_ID.substring(0,10) + '...)' : '❌ MISSING'}`);
  try {
    const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}');
    console.log(`   SERVICE_ACCOUNT: ${creds.client_email ? '✅ ' + creds.client_email : '❌ JSON parsed but no client_email found'}`);
  } catch (e) {
    console.log(`   SERVICE_ACCOUNT: ❌ JSON PARSE FAILED — ${e.message.substring(0,80)}`);
    console.log(`   First 50 chars of env: ${(process.env.GOOGLE_SERVICE_ACCOUNT_JSON||'').substring(0,50)}`);
  }
});
