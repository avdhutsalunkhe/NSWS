const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, enforcePlantAccess, logAudit } = require('../middleware/auth');

function num(val) {
  if (val !== undefined && val !== null && !isNaN(Number(val))) {
    return Number(val);
  }
  return 0;
}

// GET /api/diversions
router.get('/', authenticateToken, enforcePlantAccess, (req, res) => {
  const plantId = req.targetPlantId;
  const season = req.query.season ? req.query.season : '2023-24';
  const month = req.query.month ? req.query.month : 'October';

  if (!plantId) {
    return res.status(400).json({ error: 'Plant ID is required' });
  }

  const record = db.prepare(`
    SELECT * FROM diversion_ethanol_records
    WHERE plant_id = ? AND season_name = ? AND month = ?
  `).get(plantId, season, month);

  res.json({ record: record ? record : null });
});

// POST /api/diversions (Upsert)
router.post('/', authenticateToken, enforcePlantAccess, (req, res) => {
  const plantId = req.targetPlantId;
  const {
    season_name,
    month,
    juice_diverted_for_ethanol_mt,
    b_heavy_diverted_for_ethanol_mt,
    c_heavy_diverted_for_ethanol_mt,
    sale_b_heavy_mt,
    sale_juice_syrup_mt,
    sale_c_heavy_mt,
    ethanol_from_juice_kl,
    ethanol_from_b_heavy_kl,
    ethanol_from_c_heavy_kl
  } = req.body;

  if (!plantId) return res.status(400).json({ error: 'Plant is required' });
  if (!season_name) return res.status(400).json({ error: 'Season is required' });
  if (!month) return res.status(400).json({ error: 'Month is required' });

  const report = db.prepare('SELECT status FROM p2_reports WHERE plant_id = ? AND season_name = ? AND month = ?').get(plantId, season_name, month);
  if (report && ['SUBMITTED', 'ACCEPTED'].includes(report.status)) {
    return res.status(403).json({ error: 'This report has already been submitted to NSWS and is locked for changes.' });
  }

  const existing = db.prepare('SELECT id FROM diversion_ethanol_records WHERE plant_id = ? AND season_name = ? AND month = ?').get(plantId, season_name, month);

  if (existing) {
    db.prepare(`
      UPDATE diversion_ethanol_records
      SET juice_diverted_for_ethanol_mt = ?,
          b_heavy_diverted_for_ethanol_mt = ?,
          c_heavy_diverted_for_ethanol_mt = ?,
          sale_b_heavy_mt = ?,
          sale_juice_syrup_mt = ?,
          sale_c_heavy_mt = ?,
          ethanol_from_juice_kl = ?,
          ethanol_from_b_heavy_kl = ?,
          ethanol_from_c_heavy_kl = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      num(juice_diverted_for_ethanol_mt),
      num(b_heavy_diverted_for_ethanol_mt),
      num(c_heavy_diverted_for_ethanol_mt),
      num(sale_b_heavy_mt),
      num(sale_juice_syrup_mt),
      num(sale_c_heavy_mt),
      num(ethanol_from_juice_kl),
      num(ethanol_from_b_heavy_kl),
      num(ethanol_from_c_heavy_kl),
      existing.id
    );
  } else {
    db.prepare(`
      INSERT INTO diversion_ethanol_records (
        plant_id, season_name, month,
        juice_diverted_for_ethanol_mt, b_heavy_diverted_for_ethanol_mt, c_heavy_diverted_for_ethanol_mt,
        sale_b_heavy_mt, sale_juice_syrup_mt, sale_c_heavy_mt,
        ethanol_from_juice_kl, ethanol_from_b_heavy_kl, ethanol_from_c_heavy_kl
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      plantId,
      season_name,
      month,
      num(juice_diverted_for_ethanol_mt),
      num(b_heavy_diverted_for_ethanol_mt),
      num(c_heavy_diverted_for_ethanol_mt),
      num(sale_b_heavy_mt),
      num(sale_juice_syrup_mt),
      num(sale_c_heavy_mt),
      num(ethanol_from_juice_kl),
      num(ethanol_from_b_heavy_kl),
      num(ethanol_from_c_heavy_kl)
    );
  }

  logAudit(req.user.id, req.user.username, req.user.role, 'SAVE_DIVERSIONS', 'DIVERSIONS', plantId, null, `Diversions & Ethanol saved for ${month} ${season_name}`, req);

  res.json({ message: 'Diversions and ethanol production data saved successfully' });
});

module.exports = router;
