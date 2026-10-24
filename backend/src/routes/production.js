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

// GET /api/production
router.get('/', authenticateToken, enforcePlantAccess, (req, res) => {
  const season = req.query.season ? req.query.season : '2023-24';
  const month = req.query.month ? req.query.month : 'October';

  // If Admin requests all plants consolidated data
  if (req.user.role === 'ADMIN' && req.query.all === 'true') {
    const allRecords = db.prepare(`
      SELECT pl.id as plant_id, pl.plant_code, pl.plant_name, pl.state, pl.undertaking_group, pl.capacity_tcd as plant_capacity,
             p.capacity_tcd, p.cane_crushed_month_mt, p.white_from_cane_mt, p.est_seasonal_sugar_mt,
             p.purity_mixed_juice_pct, p.pol_mixed_juice_pct,
             d.b_heavy_diverted_for_ethanol_mt, d.juice_diverted_for_ethanol_mt, d.ethanol_from_b_heavy_kl, d.ethanol_from_juice_kl
      FROM plants pl
      LEFT JOIN production_records p ON pl.id = p.plant_id AND p.season_name = ? AND p.month = ?
      LEFT JOIN diversion_ethanol_records d ON pl.id = d.plant_id AND d.season_name = ? AND d.month = ?
      ORDER BY pl.id ASC
    `).all(season, month, season, month);
    return res.json({ allRecords });
  }

  const plantId = req.targetPlantId;

  if (!plantId) {
    return res.status(400).json({ error: 'Plant ID is required' });
  }

  const record = db.prepare(`
    SELECT p.*, pl.plant_code, pl.plant_name
    FROM production_records p
    JOIN plants pl ON p.plant_id = pl.id
    WHERE p.plant_id = ? AND p.season_name = ? AND p.month = ?
  `).get(plantId, season, month);

  res.json({ record: record ? record : null });
});

// POST /api/production (Upsert)
router.post('/', authenticateToken, enforcePlantAccess, (req, res) => {
  const plantId = req.targetPlantId;
  const {
    season_name,
    month,
    capacity_tcd,
    cane_crushed_month_mt,
    est_remaining_crushing_mt,
    est_seasonal_sugar_mt,
    white_from_cane_mt,
    white_from_reprocessing_old_mt,
    white_from_procured_raw_mt,
    white_from_transferred_white_mt,
    white_from_own_raw_stock_mt,
    white_sugar_produced_own_stock_mt,
    raw_from_cane_mt,
    raw_from_reprocessing_old_mt,
    raw_procured_domestic_mt,
    procured_raw_internal_transfer_mt,
    internal_transfer_plant_code,
    internal_transfer_plant_name,
    procured_from_imported_raw_mt,
    purity_mixed_juice_pct,
    pol_mixed_juice_pct
  } = req.body;

  if (!plantId) return res.status(400).json({ error: 'Plant is required' });
  if (!season_name) return res.status(400).json({ error: 'Season is required' });
  if (!month) return res.status(400).json({ error: 'Month is required' });

  // Check if report is already submitted/locked
  const report = db.prepare('SELECT status FROM p2_reports WHERE plant_id = ? AND season_name = ? AND month = ?').get(plantId, season_name, month);
  if (report && ['SUBMITTED', 'ACCEPTED'].includes(report.status)) {
    return res.status(403).json({ error: 'This report has already been submitted to NSWS and is locked for changes.' });
  }

  const existing = db.prepare('SELECT id FROM production_records WHERE plant_id = ? AND season_name = ? AND month = ?').get(plantId, season_name, month);

  if (existing) {
    db.prepare(`
      UPDATE production_records
      SET capacity_tcd = ?,
          cane_crushed_month_mt = ?,
          est_remaining_crushing_mt = ?,
          est_seasonal_sugar_mt = ?,
          white_from_cane_mt = ?,
          white_from_reprocessing_old_mt = ?,
          white_from_procured_raw_mt = ?,
          white_from_transferred_white_mt = ?,
          white_from_own_raw_stock_mt = ?,
          white_sugar_produced_own_stock_mt = ?,
          raw_from_cane_mt = ?,
          raw_from_reprocessing_old_mt = ?,
          raw_procured_domestic_mt = ?,
          procured_raw_internal_transfer_mt = ?,
          internal_transfer_plant_code = ?,
          internal_transfer_plant_name = ?,
          procured_from_imported_raw_mt = ?,
          purity_mixed_juice_pct = ?,
          pol_mixed_juice_pct = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      num(capacity_tcd),
      num(cane_crushed_month_mt),
      num(est_remaining_crushing_mt),
      num(est_seasonal_sugar_mt),
      num(white_from_cane_mt),
      num(white_from_reprocessing_old_mt),
      num(white_from_procured_raw_mt),
      num(white_from_transferred_white_mt),
      num(white_from_own_raw_stock_mt),
      num(white_sugar_produced_own_stock_mt),
      num(raw_from_cane_mt),
      num(raw_from_reprocessing_old_mt),
      num(raw_procured_domestic_mt),
      num(procured_raw_internal_transfer_mt),
      internal_transfer_plant_code ? internal_transfer_plant_code : null,
      internal_transfer_plant_name ? internal_transfer_plant_name : null,
      num(procured_from_imported_raw_mt),
      num(purity_mixed_juice_pct),
      num(pol_mixed_juice_pct),
      existing.id
    );
  } else {
    db.prepare(`
      INSERT INTO production_records (
        plant_id, season_name, month, capacity_tcd, cane_crushed_month_mt, est_remaining_crushing_mt, est_seasonal_sugar_mt,
        white_from_cane_mt, white_from_reprocessing_old_mt, white_from_procured_raw_mt, white_from_transferred_white_mt,
        white_from_own_raw_stock_mt, white_sugar_produced_own_stock_mt,
        raw_from_cane_mt, raw_from_reprocessing_old_mt, raw_procured_domestic_mt,
        procured_raw_internal_transfer_mt, internal_transfer_plant_code, internal_transfer_plant_name, procured_from_imported_raw_mt,
        purity_mixed_juice_pct, pol_mixed_juice_pct
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?
      )
    `).run(
      plantId,
      season_name,
      month,
      num(capacity_tcd),
      num(cane_crushed_month_mt),
      num(est_remaining_crushing_mt),
      num(est_seasonal_sugar_mt),
      num(white_from_cane_mt),
      num(white_from_reprocessing_old_mt),
      num(white_from_procured_raw_mt),
      num(white_from_transferred_white_mt),
      num(white_from_own_raw_stock_mt),
      num(white_sugar_produced_own_stock_mt),
      num(raw_from_cane_mt),
      num(raw_from_reprocessing_old_mt),
      num(raw_procured_domestic_mt),
      num(procured_raw_internal_transfer_mt),
      internal_transfer_plant_code ? internal_transfer_plant_code : null,
      internal_transfer_plant_name ? internal_transfer_plant_name : null,
      num(procured_from_imported_raw_mt),
      num(purity_mixed_juice_pct),
      num(pol_mixed_juice_pct)
    );
  }

  logAudit(req.user.id, req.user.username, req.user.role, 'SAVE_PRODUCTION', 'PRODUCTION', plantId, null, `Production saved for ${month} ${season_name}`, req);

  res.json({ message: 'Production data saved successfully' });
});

// DELETE /api/production (Admin only)
router.delete('/', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const plantId = req.query.plantId ? req.query.plantId : req.body.plantId;
  const season = req.query.season ? req.query.season : (req.body.season ? req.body.season : '2023-24');
  const month = req.query.month ? req.query.month : (req.body.month ? req.body.month : 'October');

  if (!plantId) {
    return res.status(400).json({ error: 'Plant ID is required to delete production data' });
  }

  // Check if locked
  const report = db.prepare('SELECT status FROM p2_reports WHERE plant_id = ? AND season_name = ? AND month = ?').get(plantId, season, month);
  if (report && ['SUBMITTED', 'ACCEPTED'].includes(report.status)) {
    return res.status(403).json({ error: 'This report has already been submitted to NSWS and cannot be deleted.' });
  }

  const plant = db.prepare('SELECT plant_code, plant_name FROM plants WHERE id = ?').get(plantId);
  const plantCode = plant && plant.plant_code ? plant.plant_code : String(plantId);

  db.prepare('DELETE FROM production_records WHERE plant_id = ? AND season_name = ? AND month = ?').run(plantId, season, month);
  db.prepare('DELETE FROM diversion_ethanol_records WHERE plant_id = ? AND season_name = ? AND month = ?').run(plantId, season, month);

  logAudit(req.user.id, req.user.username, req.user.role, 'DELETE_PRODUCTION', 'PRODUCTION', plantId, plantCode, `Production & diversion records deleted for ${month} ${season}`, req);

  res.json({ message: `Production and diversion data for Plant ${plantCode} (${month} ${season}) successfully deleted.` });
});

module.exports = router;
