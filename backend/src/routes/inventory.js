const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, enforcePlantAccess, requireRole, logAudit } = require('../middleware/auth');

function num(val) {
  if (val !== undefined && val !== null && !isNaN(Number(val))) {
    return Number(val);
  }
  return 0;
}

// GET /api/inventory
router.get('/', authenticateToken, enforcePlantAccess, (req, res) => {
  const plantId = req.targetPlantId;
  const season = req.query.season ? req.query.season : '2023-24';
  const month = req.query.month ? req.query.month : 'October';

  if (!plantId) {
    return res.status(400).json({ error: 'Plant ID is required' });
  }

  const record = db.prepare('SELECT * FROM inventory_stock WHERE plant_id = ? AND season_name = ? AND month = ?').get(plantId, season, month);
  res.json({ record: record ? record : null });
});

// POST /api/inventory
router.post('/', authenticateToken, enforcePlantAccess, (req, res) => {
  const plantId = req.targetPlantId;
  const {
    season_name,
    month,
    factory_white_opening,
    factory_white_closing,
    factory_biss_opening,
    factory_biss_closing,
    factory_raw_opening,
    factory_raw_closing,
    godown_white_opening,
    godown_white_closing,
    godown_biss_opening,
    godown_biss_closing,
    godown_raw_opening,
    godown_raw_closing
  } = req.body;

  if (!plantId) return res.status(400).json({ error: 'Plant is required' });
  if (!season_name) return res.status(400).json({ error: 'Season is required' });
  if (!month) return res.status(400).json({ error: 'Month is required' });

  const existing = db.prepare('SELECT id FROM inventory_stock WHERE plant_id = ? AND season_name = ? AND month = ?').get(plantId, season_name, month);

  if (existing) {
    db.prepare(`
      UPDATE inventory_stock
      SET factory_white_opening = ?,
          factory_white_closing = ?,
          factory_biss_opening = ?,
          factory_biss_closing = ?,
          factory_raw_opening = ?,
          factory_raw_closing = ?,
          godown_white_opening = ?,
          godown_white_closing = ?,
          godown_biss_opening = ?,
          godown_biss_closing = ?,
          godown_raw_opening = ?,
          godown_raw_closing = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      num(factory_white_opening),
      num(factory_white_closing),
      num(factory_biss_opening),
      num(factory_biss_closing),
      num(factory_raw_opening),
      num(factory_raw_closing),
      num(godown_white_opening),
      num(godown_white_closing),
      num(godown_biss_opening),
      num(godown_biss_closing),
      num(godown_raw_opening),
      num(godown_raw_closing),
      existing.id
    );
  } else {
    db.prepare(`
      INSERT INTO inventory_stock (
        plant_id, season_name, month,
        factory_white_opening, factory_white_closing,
        factory_biss_opening, factory_biss_closing,
        factory_raw_opening, factory_raw_closing,
        godown_white_opening, godown_white_closing,
        godown_biss_opening, godown_biss_closing,
        godown_raw_opening, godown_raw_closing
      ) VALUES (
        ?, ?, ?,
        ?, ?,
        ?, ?,
        ?, ?,
        ?, ?,
        ?, ?,
        ?, ?
      )
    `).run(
      plantId,
      season_name,
      month,
      num(factory_white_opening),
      num(factory_white_closing),
      num(factory_biss_opening),
      num(factory_biss_closing),
      num(factory_raw_opening),
      num(factory_raw_closing),
      num(godown_white_opening),
      num(godown_white_closing),
      num(godown_biss_opening),
      num(godown_biss_closing),
      num(godown_raw_opening),
      num(godown_raw_closing)
    );
  }

  logAudit(req.user.id, req.user.username, req.user.role, 'SAVE_INVENTORY', 'INVENTORY', plantId, null, `Inventory saved for ${month} ${season_name}`, req);

  res.json({ message: 'Stock levels saved successfully' });
});

// DELETE /api/inventory (Admin only)
router.delete('/', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const plantId = req.query.plantId ? req.query.plantId : req.body.plantId;
  const season = req.query.season ? req.query.season : (req.body.season ? req.body.season : '2023-24');
  const month = req.query.month ? req.query.month : (req.body.month ? req.body.month : 'October');

  if (!plantId) {
    return res.status(400).json({ error: 'Plant ID is required' });
  }

  db.prepare('DELETE FROM inventory_stock WHERE plant_id = ? AND season_name = ? AND month = ?').run(plantId, season, month);
  logAudit(req.user.id, req.user.username, req.user.role, 'DELETE_INVENTORY', 'INVENTORY', plantId, null, `Inventory deleted for ${month} ${season}`, req);

  res.json({ message: 'Inventory records deleted successfully' });
});

module.exports = router;
