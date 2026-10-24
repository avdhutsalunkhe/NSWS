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

// GET /api/dispatches
router.get('/', authenticateToken, enforcePlantAccess, (req, res) => {
  const plantId = req.targetPlantId;
  const season = req.query.season ? req.query.season : '2023-24';
  const month = req.query.month ? req.query.month : 'October';
  const category = req.query.category;

  if (!plantId) {
    return res.status(400).json({ error: 'Plant ID is required' });
  }

  let query = 'SELECT * FROM dispatches WHERE plant_id = ? AND season_name = ? AND month = ?';
  const params = [plantId, season, month];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY id ASC';

  const dispatches = db.prepare(query).all(...params);

  // Also get HSN summary
  const hsn = db.prepare('SELECT * FROM hsn_sales WHERE plant_id = ? AND season_name = ? AND month = ?').get(plantId, season, month);

  res.json({
    dispatches,
    hsn: hsn ? hsn : { hsn_17011490_mt: 0, hsn_17019990_mt: 0, hsn_others_mt: 0 }
  });
});

// POST /api/dispatches (Add or Update dispatch item)
router.post('/', authenticateToken, enforcePlantAccess, (req, res) => {
  const plantId = req.targetPlantId;
  const {
    id,
    season_name,
    month,
    category,
    release_order_no,
    release_order_date,
    qty_released_mt,
    qty_dispatched_mt,
    target_plant_code,
    target_plant_name,
    serial_number,
    remarks
  } = req.body;

  if (!plantId) return res.status(400).json({ error: 'Plant is required' });
  if (!season_name) return res.status(400).json({ error: 'Season is required' });
  if (!month) return res.status(400).json({ error: 'Month is required' });
  if (!category) return res.status(400).json({ error: 'Category is required' });

  const report = db.prepare('SELECT status FROM p2_reports WHERE plant_id = ? AND season_name = ? AND month = ?').get(plantId, season_name, month);
  if (report && ['SUBMITTED', 'ACCEPTED'].includes(report.status)) {
    return res.status(403).json({ error: 'This report has already been submitted to NSWS and is locked for changes.' });
  }

  if (id) {
    db.prepare(`
      UPDATE dispatches
      SET release_order_no = ?,
          release_order_date = ?,
          qty_released_mt = ?,
          qty_dispatched_mt = ?,
          target_plant_code = ?,
          target_plant_name = ?,
          serial_number = ?,
          remarks = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND plant_id = ?
    `).run(
      release_order_no ? release_order_no : null,
      release_order_date ? release_order_date : null,
      num(qty_released_mt),
      num(qty_dispatched_mt),
      target_plant_code ? target_plant_code : null,
      target_plant_name ? target_plant_name : null,
      serial_number ? String(serial_number) : null,
      remarks ? remarks : null,
      id,
      plantId
    );
  } else {
    // For single category items like 6.1.1, 6.1.2, 6.1.3, 6.1.4, 6.2, check if already exists
    if (!['6.3', '6.4', '6.5'].includes(category)) {
      const existing = db.prepare('SELECT id FROM dispatches WHERE plant_id = ? AND season_name = ? AND month = ? AND category = ?').get(plantId, season_name, month, category);
      if (existing) {
        db.prepare(`
          UPDATE dispatches
          SET release_order_no = ?,
              release_order_date = ?,
              qty_released_mt = ?,
              qty_dispatched_mt = ?,
              remarks = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(
          release_order_no ? release_order_no : null,
          release_order_date ? release_order_date : null,
          num(qty_released_mt),
          num(qty_dispatched_mt),
          remarks ? remarks : null,
          existing.id
        );
        return res.json({ message: 'Dispatch record updated successfully' });
      }
    }

    db.prepare(`
      INSERT INTO dispatches (
        plant_id, season_name, month, category, release_order_no, release_order_date,
        qty_released_mt, qty_dispatched_mt, target_plant_code, target_plant_name, serial_number, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      plantId,
      season_name,
      month,
      category,
      release_order_no ? release_order_no : null,
      release_order_date ? release_order_date : null,
      num(qty_released_mt),
      num(qty_dispatched_mt),
      target_plant_code ? target_plant_code : null,
      target_plant_name ? target_plant_name : null,
      serial_number ? String(serial_number) : null,
      remarks ? remarks : null
    );
  }

  logAudit(req.user.id, req.user.username, req.user.role, 'SAVE_DISPATCH', 'DISPATCH', plantId, null, `Dispatch (${category}) saved`, req);

  res.json({ message: 'Dispatch saved successfully' });
});

// DELETE /api/dispatches/:id (Repeated items delete)
router.delete('/:id', authenticateToken, enforcePlantAccess, (req, res) => {
  const dispatchId = req.params.id;
  const dispatch = db.prepare('SELECT * FROM dispatches WHERE id = ?').get(dispatchId);

  if (!dispatch) {
    return res.status(404).json({ error: 'Dispatch record not found' });
  }

  if (req.user.role === 'CLERK' && String(dispatch.plant_id) !== String(req.user.plant_id)) {
    return res.status(403).json({ error: 'Unauthorized to delete this record' });
  }

  db.prepare('DELETE FROM dispatches WHERE id = ?').run(dispatchId);
  res.json({ message: 'Record deleted' });
});

// POST /api/dispatches/hsn
router.post('/hsn', authenticateToken, enforcePlantAccess, (req, res) => {
  const plantId = req.targetPlantId;
  const { season_name, month, hsn_17011490_mt, hsn_17019990_mt, hsn_others_mt } = req.body;

  if (!plantId) return res.status(400).json({ error: 'Plant is required' });
  if (!season_name) return res.status(400).json({ error: 'Season is required' });
  if (!month) return res.status(400).json({ error: 'Month is required' });

  const existing = db.prepare('SELECT id FROM hsn_sales WHERE plant_id = ? AND season_name = ? AND month = ?').get(plantId, season_name, month);

  if (existing) {
    db.prepare(`
      UPDATE hsn_sales
      SET hsn_17011490_mt = ?,
          hsn_17019990_mt = ?,
          hsn_others_mt = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(num(hsn_17011490_mt), num(hsn_17019990_mt), num(hsn_others_mt), existing.id);
  } else {
    db.prepare(`
      INSERT INTO hsn_sales (plant_id, season_name, month, hsn_17011490_mt, hsn_17019990_mt, hsn_others_mt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(plantId, season_name, month, num(hsn_17011490_mt), num(hsn_17019990_mt), num(hsn_others_mt));
  }

  res.json({ message: 'HSN breakdown saved successfully' });
});

module.exports = router;
