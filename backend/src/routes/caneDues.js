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

// GET /api/cane-dues
router.get('/', authenticateToken, enforcePlantAccess, (req, res) => {
  const plantId = req.targetPlantId;
  const season = req.query.season ? req.query.season : '2023-24';
  const month = req.query.month ? req.query.month : 'October';

  if (!plantId) {
    return res.status(400).json({ error: 'Plant ID is required' });
  }

  const record = db.prepare('SELECT * FROM cane_dues_records WHERE plant_id = ? AND season_name = ? AND month = ?').get(plantId, season, month);

  let historical = [];
  if (record && record.historical_dues_json) {
    try {
      historical = JSON.parse(record.historical_dues_json);
    } catch (e) {
      historical = [];
    }
  }

  if (historical.length === 0) {
    historical = [
      { season: '2022-23', caneCrushed: '1', sugarProduction: '1', sugarRecovery: '1', payableCr: '46', paidCr: '0', farmersCount: '0' },
      { season: '2021-22', caneCrushed: '3', sugarProduction: '4', sugarRecovery: '5', payableCr: '51', paidCr: '0', farmersCount: '53' },
      { season: '2020-21', caneCrushed: '1', sugarProduction: '2', sugarRecovery: '3', payableCr: '57', paidCr: '0', farmersCount: '59' },
      { season: '2019-20', caneCrushed: '5', sugarProduction: '6', sugarRecovery: '7', payableCr: '63', paidCr: '0', farmersCount: '65' }
    ];
  }

  res.json({
    record: record ? record : null,
    historical
  });
});

// POST /api/cane-dues
router.post('/', authenticateToken, enforcePlantAccess, (req, res) => {
  const plantId = req.targetPlantId;
  const {
    season_name,
    month,
    current_payable_cr,
    current_paid_cr,
    current_farmers_count,
    historical_dues
  } = req.body;

  if (!plantId) return res.status(400).json({ error: 'Plant is required' });
  if (!season_name) return res.status(400).json({ error: 'Season is required' });
  if (!month) return res.status(400).json({ error: 'Month is required' });

  const histJson = historical_dues ? JSON.stringify(historical_dues) : null;
  const existing = db.prepare('SELECT id FROM cane_dues_records WHERE plant_id = ? AND season_name = ? AND month = ?').get(plantId, season_name, month);

  if (existing) {
    db.prepare(`
      UPDATE cane_dues_records
      SET current_payable_cr = ?,
          current_paid_cr = ?,
          current_farmers_count = ?,
          historical_dues_json = CASE WHEN ? IS NOT NULL THEN ? ELSE historical_dues_json END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      num(current_payable_cr),
      num(current_paid_cr),
      Math.round(num(current_farmers_count)),
      histJson,
      histJson,
      existing.id
    );
  } else {
    db.prepare(`
      INSERT INTO cane_dues_records (
        plant_id, season_name, month,
        current_payable_cr, current_paid_cr, current_farmers_count, historical_dues_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      plantId,
      season_name,
      month,
      num(current_payable_cr),
      num(current_paid_cr),
      Math.round(num(current_farmers_count)),
      histJson
    );
  }

  logAudit(req.user.id, req.user.username, req.user.role, 'SAVE_CANE_DUES', 'CANE_DUES', plantId, null, `Cane dues saved for ${month} ${season_name}`, req);

  res.json({ message: 'Cane dues data saved successfully' });
});

// DELETE /api/cane-dues (Admin only)
router.delete('/', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const plantId = req.query.plantId ? req.query.plantId : req.body.plantId;
  const season = req.query.season ? req.query.season : (req.body.season ? req.body.season : '2023-24');
  const month = req.query.month ? req.query.month : (req.body.month ? req.body.month : 'October');

  if (!plantId) {
    return res.status(400).json({ error: 'Plant ID is required' });
  }

  db.prepare('DELETE FROM cane_dues_records WHERE plant_id = ? AND season_name = ? AND month = ?').run(plantId, season, month);
  logAudit(req.user.id, req.user.username, req.user.role, 'DELETE_CANE_DUES', 'CANE_DUES', plantId, null, `Cane dues deleted for ${month} ${season}`, req);

  res.json({ message: 'Cane dues records deleted successfully' });
});

module.exports = router;
