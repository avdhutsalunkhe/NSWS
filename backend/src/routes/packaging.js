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

// GET /api/packaging
router.get('/', authenticateToken, enforcePlantAccess, (req, res) => {
  const plantId = req.targetPlantId;
  const season = req.query.season ? req.query.season : '2023-24';
  const month = req.query.month ? req.query.month : 'October';

  if (!plantId) {
    return res.status(400).json({ error: 'Plant ID is required' });
  }

  const record = db.prepare('SELECT * FROM packaging_records WHERE plant_id = ? AND season_name = ? AND month = ?').get(plantId, season, month);
  res.json({ record: record ? record : null });
});

// POST /api/packaging
router.post('/', authenticateToken, enforcePlantAccess, (req, res) => {
  const plantId = req.targetPlantId;
  const {
    season_name,
    month,
    jute_50kg_mt,
    jute_100kg_mt,
    pp_hdpe_50kg_mt,
    other_retail_loose_mt
  } = req.body;

  if (!plantId) return res.status(400).json({ error: 'Plant is required' });
  if (!season_name) return res.status(400).json({ error: 'Season is required' });
  if (!month) return res.status(400).json({ error: 'Month is required' });

  const existing = db.prepare('SELECT id FROM packaging_records WHERE plant_id = ? AND season_name = ? AND month = ?').get(plantId, season_name, month);

  if (existing) {
    db.prepare(`
      UPDATE packaging_records
      SET jute_50kg_mt = ?,
          jute_100kg_mt = ?,
          pp_hdpe_50kg_mt = ?,
          other_retail_loose_mt = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      num(jute_50kg_mt),
      num(jute_100kg_mt),
      num(pp_hdpe_50kg_mt),
      num(other_retail_loose_mt),
      existing.id
    );
  } else {
    db.prepare(`
      INSERT INTO packaging_records (
        plant_id, season_name, month,
        jute_50kg_mt, jute_100kg_mt, pp_hdpe_50kg_mt, other_retail_loose_mt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      plantId,
      season_name,
      month,
      num(jute_50kg_mt),
      num(jute_100kg_mt),
      num(pp_hdpe_50kg_mt),
      num(other_retail_loose_mt)
    );
  }

  logAudit(req.user.id, req.user.username, req.user.role, 'SAVE_PACKAGING', 'PACKAGING', plantId, null, `Packaging saved for ${month} ${season_name}`, req);

  res.json({ message: 'Packaging breakdown saved successfully' });
});

// DELETE /api/packaging (Admin only)
router.delete('/', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const plantId = req.query.plantId ? req.query.plantId : req.body.plantId;
  const season = req.query.season ? req.query.season : (req.body.season ? req.body.season : '2023-24');
  const month = req.query.month ? req.query.month : (req.body.month ? req.body.month : 'October');

  if (!plantId) {
    return res.status(400).json({ error: 'Plant ID is required' });
  }

  db.prepare('DELETE FROM packaging_records WHERE plant_id = ? AND season_name = ? AND month = ?').run(plantId, season, month);
  logAudit(req.user.id, req.user.username, req.user.role, 'DELETE_PACKAGING', 'PACKAGING', plantId, null, `Packaging records deleted for ${month} ${season}`, req);

  res.json({ message: 'Packaging records deleted successfully' });
});

module.exports = router;
