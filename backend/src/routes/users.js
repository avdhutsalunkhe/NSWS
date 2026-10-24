const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticateToken, requireRole, logAudit } = require('../middleware/auth');

// GET /api/users (Admin only)
router.get('/', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.username, u.role, u.full_name, u.email, u.plant_id, u.is_active, u.created_at,
           p.plant_code, p.plant_name
    FROM users u
    LEFT JOIN plants p ON u.plant_id = p.id
    ORDER BY u.id ASC
  `).all();
  res.json({ users });
});

// POST /api/users (Admin creates user: Clerk ID is Plant Code!)
router.post('/', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const role = req.body.role;
  const fullName = req.body.full_name ? req.body.full_name : req.body.fullName;
  const email = req.body.email;
  const plantId = req.body.plant_id !== undefined ? req.body.plant_id : req.body.plantId;

  if (!username) return res.status(400).json({ error: 'Username (Plant Code for clerks) is required.' });
  if (!password) return res.status(400).json({ error: 'Password is required.' });
  if (!role) return res.status(400).json({ error: 'Role is required.' });
  if (!fullName) return res.status(400).json({ error: 'Full name is required.' });

  // If role is CLERK, plant_id is mandatory and username should be the plant code
  if (role === 'CLERK') {
    if (!plantId) {
      return res.status(400).json({ error: 'Factory/Plant assignment is mandatory for Clerk role.' });
    }
  }

  // Check for duplicate username
  const existingUser = db.prepare('SELECT id, username FROM users WHERE username = ?').get(String(username).trim());
  if (existingUser) {
    return res.status(400).json({
      error: `User with ID / Plant Code '${username}' already exists. Use the table below to edit or reset password.`
    });
  }

  try {
    const hash = bcrypt.hashSync(password, 10);
    const insert = db.prepare(`
      INSERT INTO users (username, password_hash, role, full_name, email, plant_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    const result = insert.run(
      String(username).trim(),
      hash,
      role,
      fullName,
      email ? email : null,
      plantId ? Number(plantId) : null
    );

    logAudit(req.user.id, req.user.username, req.user.role, 'CREATE_USER', 'USER', result.lastInsertRowid, null, `Created user ${username} with role ${role}`, req);

    res.status(201).json({ message: 'User account created successfully', userId: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/users/:id (Admin updates status or resets password)
router.put('/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const userId = req.params.id;
  const { full_name, email, plant_id, is_active, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  let newHash = user.password_hash;
  if (password && password.trim().length > 0) {
    newHash = bcrypt.hashSync(password, 10);
  }

  db.prepare(`
    UPDATE users
    SET full_name = CASE WHEN ? IS NOT NULL THEN ? ELSE full_name END,
        email = CASE WHEN ? IS NOT NULL THEN ? ELSE email END,
        plant_id = CASE WHEN ? IS NOT NULL THEN ? ELSE plant_id END,
        is_active = CASE WHEN ? IS NOT NULL THEN ? ELSE is_active END,
        password_hash = ?
    WHERE id = ?
  `).run(
    full_name, full_name,
    email, email,
    plant_id, plant_id,
    is_active, is_active,
    newHash,
    userId
  );

  logAudit(req.user.id, req.user.username, req.user.role, 'UPDATE_USER', 'USER', userId, null, `Updated user ${user.username}`, req);

  res.json({ message: 'User updated successfully' });
});

module.exports = router;
