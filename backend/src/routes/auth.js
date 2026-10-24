const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { JWT_SECRET, authenticateToken, logAudit } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  const user = db.prepare(`
    SELECT u.*, p.plant_code, p.plant_name, p.state as plant_state, p.capacity_tcd
    FROM users u
    LEFT JOIN plants p ON u.plant_id = p.id
    WHERE u.username = ?
  `).get(String(username).trim());

  if (!user) {
    return res.status(401).json({ error: 'Invalid username/plant code or password' });
  }

  if (!user.is_active) {
    return res.status(403).json({ error: 'Account is deactivated. Contact Admin.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid username/plant code or password' });
  }

  const tokenPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
    plant_id: user.plant_id
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

  logAudit(user.id, user.username, user.role, 'LOGIN_SUCCESS', 'USER', user.id, user.plant_code, 'User logged in', req);

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.full_name,
      email: user.email,
      plantId: user.plant_id,
      plantCode: user.plant_code,
      plantName: user.plant_name,
      plantState: user.plant_state
    }
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      fullName: req.user.full_name,
      email: req.user.email,
      plantId: req.user.plant_id,
      plantCode: req.user.plant_code,
      plantName: req.user.plant_name
    }
  });
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword) {
    return res.status(400).json({ error: 'Current password is required' });
  }
  if (!newPassword) {
    return res.status(400).json({ error: 'New password is required' });
  }

  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
  const isMatch = bcrypt.compareSync(currentPassword, user.password_hash);
  if (!isMatch) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);

  logAudit(req.user.id, req.user.username, req.user.role, 'PASSWORD_CHANGED', 'USER', req.user.id, req.user.plant_code, 'Password updated', req);

  res.json({ message: 'Password updated successfully' });
});

// GET /api/auth/switchable-users (Dynamic active accounts for role switcher)
router.get('/switchable-users', (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.username, u.role, u.full_name, u.email, u.plant_id,
           p.plant_code, p.plant_name, p.state as plant_state, p.capacity_tcd
    FROM users u
    LEFT JOIN plants p ON u.plant_id = p.id
    WHERE u.is_active = 1
    ORDER BY CASE WHEN u.role = 'ADMIN' THEN 0 ELSE 1 END, u.id ASC
  `).all();

  res.json({ users });
});

// POST /api/auth/quick-switch (Dynamically switch active session by user ID without hardcoded passwords)
router.post('/quick-switch', (req, res) => {
  const { userId, username } = req.body;
  let user = null;

  if (userId) {
    user = db.prepare(`
      SELECT u.*, p.plant_code, p.plant_name, p.state as plant_state, p.capacity_tcd
      FROM users u
      LEFT JOIN plants p ON u.plant_id = p.id
      WHERE u.id = ? AND u.is_active = 1
    `).get(Number(userId));
  } else if (username) {
    user = db.prepare(`
      SELECT u.*, p.plant_code, p.plant_name, p.state as plant_state, p.capacity_tcd
      FROM users u
      LEFT JOIN plants p ON u.plant_id = p.id
      WHERE u.username = ? AND u.is_active = 1
    `).get(String(username).trim());
  }

  if (!user) {
    return res.status(404).json({ error: 'Active user account not found' });
  }

  const tokenPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
    plant_id: user.plant_id
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

  logAudit(user.id, user.username, user.role, 'ROLE_SWITCH', 'USER', user.id, user.plant_code, `Session switched to ${user.username} (${user.role})`, req);

  res.json({
    message: 'Switched user successfully',
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.full_name,
      email: user.email,
      plantId: user.plant_id,
      plantCode: user.plant_code,
      plantName: user.plant_name,
      plantState: user.plant_state
    }
  });
});

module.exports = router;
