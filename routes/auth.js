const express = require('express');
const router = express.Router();

// Credentials from environment variables
function getUsers() {
  return [
    {
      username: process.env.OWNER_USERNAME || 'owner',
      password: process.env.OWNER_PASSWORD || 'owner123',
      role: 'owner',
      name: process.env.OWNER_NAME || 'Owner'
    },
    {
      username: process.env.MANAGER_USERNAME || 'manager',
      password: process.env.MANAGER_PASSWORD || 'manager123',
      role: 'manager',
      name: process.env.MANAGER_NAME || 'Manager'
    },
    {
      username: process.env.ACCOUNTANT_USERNAME || 'accountant',
      password: process.env.ACCOUNTANT_PASSWORD || 'accountant123',
      role: 'accountant',
      name: process.env.ACCOUNTANT_NAME || 'Accountant'
    }
  ];
}

// POST /auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  req.session.user = { username: user.username, role: user.role, name: user.name };
  res.json({ success: true, user: { username: user.username, role: user.role, name: user.name } });
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// GET /auth/me
router.get('/me', (req, res) => {
  if (req.session && req.session.user) {
    return res.json({ authenticated: true, user: req.session.user });
  }
  res.json({ authenticated: false });
});

module.exports = router;
