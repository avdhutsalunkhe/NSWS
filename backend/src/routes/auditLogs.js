const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/audit-logs
router.get('/', authenticateToken, (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 50;

  let query = 'SELECT * FROM audit_logs';
  const params = [];

  if (req.user.role === 'CLERK') {
    query += ' WHERE user_id = ?';
    params.push(req.user.id);
  }

  query += ' ORDER BY id DESC LIMIT ?';
  params.push(limit);

  const logs = db.prepare(query).all(...params);
  res.json({ logs });
});

module.exports = router;
