# 🚰 Captain Crew — Water Business Operations v2

Dark, modern PWA for managing packaged drinking water operations.

## Deploy on Render
1. Push to GitHub
2. Render → New Web Service → Connect repo
3. Build: `npm install` | Start: `node server.js`
4. Add env vars: NODE_ENV, SESSION_SECRET, OWNER_USERNAME, OWNER_PASSWORD, OWNER_NAME, MANAGER_USERNAME, MANAGER_PASSWORD, MANAGER_NAME, ACCOUNTANT_USERNAME, ACCOUNTANT_PASSWORD, ACCOUNTANT_NAME, GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_JSON

## Diagnostics
- Login as Owner → Config tab → Run Diagnostics
- Or visit: /api/health (no auth needed)
