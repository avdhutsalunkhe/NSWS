const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole, logAudit } = require('../middleware/auth');

// GET /api/sugar-seasons
router.get('/', authenticateToken, (req, res) => {
  const seasons = db.prepare('SELECT * FROM sugar_seasons ORDER BY season_name DESC').all();
  res.json({ seasons });
});

// POST /api/sugar-seasons (Admin only)
router.post('/', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const { season_name, start_date, end_date, status, is_current } = req.body;
  if (!season_name) {
    return res.status(400).json({ error: 'Season name is required' });
  }

  try {
    if (Number(is_current) === 1) {
      db.prepare('UPDATE sugar_seasons SET is_current = 0').run();
    }

    const insert = db.prepare(`
      INSERT INTO sugar_seasons (season_name, start_date, end_date, status, is_current)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      season_name,
      start_date ? start_date : null,
      end_date ? end_date : null,
      status ? status : 'ACTIVE',
      is_current ? Number(is_current) : 0
    );

    logAudit(req.user.id, req.user.username, req.user.role, 'CREATE_SEASON', 'SEASON', result.lastInsertRowid, null, `Created season ${season_name}`, req);

    res.status(201).json({ message: 'Season created successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/sugar-seasons/:id (Admin only)
router.put('/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const seasonId = req.params.id;
  const { status, is_current } = req.body;

  if (Number(is_current) === 1) {
    db.prepare('UPDATE sugar_seasons SET is_current = 0').run();
  }

  db.prepare(`
    UPDATE sugar_seasons
    SET status = CASE WHEN ? IS NOT NULL THEN ? ELSE status END,
        is_current = CASE WHEN ? IS NOT NULL THEN ? ELSE is_current END
    WHERE id = ?
  `).run(status, status, is_current, Number(is_current), seasonId);

  res.json({ message: 'Season updated successfully' });
});

// POST /api/sugar-seasons/set-current (Admin only)
router.post('/set-current', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const { season_name } = req.body;
  if (!season_name) {
    return res.status(400).json({ error: 'season_name is required' });
  }

  db.prepare('UPDATE sugar_seasons SET is_current = 0').run();
  const result = db.prepare('UPDATE sugar_seasons SET is_current = 1 WHERE season_name = ?').run(season_name);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Season not found' });
  }

  logAudit(req.user.id, req.user.username, req.user.role, 'SET_CURRENT_SEASON', 'SEASON', null, null, `Set current season to ${season_name}`, req);
  res.json({ message: `Season ${season_name} set as current` });
});

// DELETE /api/sugar-seasons/:id (Admin only)
router.delete('/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const seasonId = req.params.id;
  const season = db.prepare('SELECT * FROM sugar_seasons WHERE id = ?').get(seasonId);
  if (!season) {
    return res.status(404).json({ error: 'Season not found' });
  }
  if (season.is_current === 1) {
    return res.status(400).json({ error: 'Cannot delete active current season. Set another season as current first.' });
  }

  db.prepare('DELETE FROM sugar_seasons WHERE id = ?').run(seasonId);
  logAudit(req.user.id, req.user.username, req.user.role, 'DELETE_SEASON', 'SEASON', seasonId, null, `Deleted season ${season.season_name}`, req);
  res.json({ message: `Season ${season.season_name} deleted successfully` });
});

module.exports = router;
