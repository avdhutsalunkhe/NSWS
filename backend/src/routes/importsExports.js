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

// GET /api/imports-exports
router.get('/', authenticateToken, enforcePlantAccess, (req, res) => {
  const plantId = req.targetPlantId;
  const season = req.query.season ? req.query.season : '2023-24';
  const month = req.query.month ? req.query.month : 'October';

  if (!plantId) {
    return res.status(400).json({ error: 'Plant ID is required' });
  }

  const record = db.prepare('SELECT * FROM imports_exports WHERE plant_id = ? AND season_name = ? AND month = ?').get(plantId, season, month);
  res.json({ record: record ? record : null });
});

// POST /api/imports-exports
router.post('/', authenticateToken, enforcePlantAccess, (req, res) => {
  const plantId = req.targetPlantId;
  const {
    season_name,
    month,
    exp_66a_i_order_no,
    exp_66a_i_order_date,
    exp_66a_i_qty_released,
    exp_66a_i_qty_dispatched,
    exp_66a_ii_order_no,
    exp_66a_ii_order_date,
    exp_66a_ii_qty_released,
    exp_66a_ii_qty_dispatched,
    exp_66a_iii_order_no,
    exp_66a_iii_order_date,
    exp_66a_iii_qty_dispatched,
    exp_66a_iii_buyer_refinery,
    exp_66b_order_no,
    exp_66b_order_date,
    exp_66b_qty_released,
    exp_66b_qty_received,
    import_applicable,
    imp_67a_i_white_mt,
    imp_67a_ii_raw_mt,
    imp_67b_aas_mt
  } = req.body;

  if (!plantId) return res.status(400).json({ error: 'Plant is required' });
  if (!season_name) return res.status(400).json({ error: 'Season is required' });
  if (!month) return res.status(400).json({ error: 'Month is required' });

  const existing = db.prepare('SELECT id FROM imports_exports WHERE plant_id = ? AND season_name = ? AND month = ?').get(plantId, season_name, month);

  if (existing) {
    db.prepare(`
      UPDATE imports_exports
      SET exp_66a_i_order_no = ?,
          exp_66a_i_order_date = ?,
          exp_66a_i_qty_released = ?,
          exp_66a_i_qty_dispatched = ?,
          exp_66a_ii_order_no = ?,
          exp_66a_ii_order_date = ?,
          exp_66a_ii_qty_released = ?,
          exp_66a_ii_qty_dispatched = ?,
          exp_66a_iii_order_no = ?,
          exp_66a_iii_order_date = ?,
          exp_66a_iii_qty_dispatched = ?,
          exp_66a_iii_buyer_refinery = ?,
          exp_66b_order_no = ?,
          exp_66b_order_date = ?,
          exp_66b_qty_released = ?,
          exp_66b_qty_received = ?,
          import_applicable = ?,
          imp_67a_i_white_mt = ?,
          imp_67a_ii_raw_mt = ?,
          imp_67b_aas_mt = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      exp_66a_i_order_no ? exp_66a_i_order_no : null,
      exp_66a_i_order_date ? exp_66a_i_order_date : null,
      num(exp_66a_i_qty_released),
      num(exp_66a_i_qty_dispatched),
      exp_66a_ii_order_no ? exp_66a_ii_order_no : null,
      exp_66a_ii_order_date ? exp_66a_ii_order_date : null,
      num(exp_66a_ii_qty_released),
      num(exp_66a_ii_qty_dispatched),
      exp_66a_iii_order_no ? exp_66a_iii_order_no : null,
      exp_66a_iii_order_date ? exp_66a_iii_order_date : null,
      num(exp_66a_iii_qty_dispatched),
      exp_66a_iii_buyer_refinery ? exp_66a_iii_buyer_refinery : null,
      exp_66b_order_no ? exp_66b_order_no : null,
      exp_66b_order_date ? exp_66b_order_date : null,
      num(exp_66b_qty_released),
      num(exp_66b_qty_received),
      import_applicable ? import_applicable : 'Yes',
      num(imp_67a_i_white_mt),
      num(imp_67a_ii_raw_mt),
      num(imp_67b_aas_mt),
      existing.id
    );
  } else {
    db.prepare(`
      INSERT INTO imports_exports (
        plant_id, season_name, month,
        exp_66a_i_order_no, exp_66a_i_order_date, exp_66a_i_qty_released, exp_66a_i_qty_dispatched,
        exp_66a_ii_order_no, exp_66a_ii_order_date, exp_66a_ii_qty_released, exp_66a_ii_qty_dispatched,
        exp_66a_iii_order_no, exp_66a_iii_order_date, exp_66a_iii_qty_dispatched, exp_66a_iii_buyer_refinery,
        exp_66b_order_no, exp_66b_order_date, exp_66b_qty_released, exp_66b_qty_received,
        import_applicable, imp_67a_i_white_mt, imp_67a_ii_raw_mt, imp_67b_aas_mt
      ) VALUES (
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `).run(
      plantId,
      season_name,
      month,
      exp_66a_i_order_no ? exp_66a_i_order_no : null,
      exp_66a_i_order_date ? exp_66a_i_order_date : null,
      num(exp_66a_i_qty_released),
      num(exp_66a_i_qty_dispatched),
      exp_66a_ii_order_no ? exp_66a_ii_order_no : null,
      exp_66a_ii_order_date ? exp_66a_ii_order_date : null,
      num(exp_66a_ii_qty_released),
      num(exp_66a_ii_qty_dispatched),
      exp_66a_iii_order_no ? exp_66a_iii_order_no : null,
      exp_66a_iii_order_date ? exp_66a_iii_order_date : null,
      num(exp_66a_iii_qty_dispatched),
      exp_66a_iii_buyer_refinery ? exp_66a_iii_buyer_refinery : null,
      exp_66b_order_no ? exp_66b_order_no : null,
      exp_66b_order_date ? exp_66b_order_date : null,
      num(exp_66b_qty_released),
      num(exp_66b_qty_received),
      import_applicable ? import_applicable : 'Yes',
      num(imp_67a_i_white_mt),
      num(imp_67a_ii_raw_mt),
      num(imp_67b_aas_mt)
    );
  }

  logAudit(req.user.id, req.user.username, req.user.role, 'SAVE_IMP_EXP', 'IMPORT_EXPORT', plantId, null, `Imports/Exports saved for ${month} ${season_name}`, req);

  res.json({ message: 'Import/Export records saved successfully' });
});

module.exports = router;
