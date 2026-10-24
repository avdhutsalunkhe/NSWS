const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole, logAudit } = require('../middleware/auth');

// GET /api/plants
router.get('/', authenticateToken, (req, res) => {
  if (req.user.role === 'ADMIN') {
    const plants = db.prepare('SELECT * FROM plants ORDER BY id ASC').all();
    return res.json({ plants });
  }

  // Clerk sees only their assigned plant
  if (!req.user.plant_id) {
    return res.status(403).json({ error: 'No plant assigned to this clerk' });
  }

  const plant = db.prepare('SELECT * FROM plants WHERE id = ?').get(req.user.plant_id);
  res.json({ plants: plant ? [plant] : [] });
});

// GET /api/plants/:id
router.get('/:id', authenticateToken, (req, res) => {
  const targetId = req.params.id;
  if (req.user.role === 'CLERK' && String(req.user.plant_id) !== String(targetId)) {
    return res.status(403).json({ error: 'Access denied to this plant' });
  }

  const plant = db.prepare('SELECT * FROM plants WHERE id = ?').get(targetId);
  if (!plant) {
    return res.status(404).json({ error: 'Plant not found' });
  }
  res.json({ plant });
});

// POST /api/plants (Admin only)
router.post('/', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const {
    plant_code,
    plant_name,
    undertaking_group,
    state,
    capacity_tcd,
    sws_id,
    project_number,
    approval_id,
    pan_number,
    pan_name,
    pan_dob,
    whitelisted_ip,
    whitelisted_domain
  } = req.body;

  if (!plant_code) return res.status(400).json({ error: 'Plant code is required.' });
  if (!plant_name) return res.status(400).json({ error: 'Plant name is required.' });
  if (!undertaking_group) return res.status(400).json({ error: 'Undertaking/Group is required.' });
  if (!state) return res.status(400).json({ error: 'State is required.' });

  try {
    const insert = db.prepare(`
      INSERT INTO plants (
        plant_code, plant_name, undertaking_group, state, capacity_tcd,
        sws_id, project_number, approval_id, pan_number, pan_name, pan_dob,
        whitelisted_ip, whitelisted_domain, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const result = insert.run(
      String(plant_code).trim(),
      String(plant_name).trim(),
      String(undertaking_group).trim(),
      String(state).trim(),
      capacity_tcd ? Number(capacity_tcd) : 100,
      sws_id ? sws_id : 'SW3795947361',
      project_number ? project_number : 'P_11',
      approval_id ? approval_id : 'M009_D001_A076',
      pan_number ? pan_number : null,
      pan_name ? pan_name : null,
      pan_dob ? pan_dob : null,
      whitelisted_ip ? whitelisted_ip : null,
      whitelisted_domain ? whitelisted_domain : null
    );

    logAudit(req.user.id, req.user.username, req.user.role, 'CREATE_PLANT', 'PLANT', result.lastInsertRowid, plant_code, 'New sugar mill added', req);

    res.status(201).json({ message: 'Plant created successfully', plantId: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/plants/:id (Admin only)
router.put('/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const plantId = req.params.id;
  const {
    plant_code,
    plant_name,
    undertaking_group,
    state,
    capacity_tcd,
    sws_id,
    project_number,
    approval_id,
    pan_number,
    pan_name,
    pan_dob,
    whitelisted_ip,
    whitelisted_domain,
    is_active
  } = req.body;

  const existing = db.prepare('SELECT * FROM plants WHERE id = ?').get(plantId);
  if (!existing) {
    return res.status(404).json({ error: 'Plant not found' });
  }

  db.prepare(`
    UPDATE plants
    SET plant_code = ?,
        plant_name = ?,
        undertaking_group = ?,
        state = ?,
        capacity_tcd = ?,
        sws_id = ?,
        project_number = ?,
        approval_id = ?,
        pan_number = ?,
        pan_name = ?,
        pan_dob = ?,
        whitelisted_ip = ?,
        whitelisted_domain = ?,
        is_active = ?
    WHERE id = ?
  `).run(
    plant_code !== undefined ? plant_code : existing.plant_code,
    plant_name !== undefined ? plant_name : existing.plant_name,
    undertaking_group !== undefined ? undertaking_group : existing.undertaking_group,
    state !== undefined ? state : existing.state,
    capacity_tcd !== undefined ? Number(capacity_tcd) : existing.capacity_tcd,
    sws_id !== undefined ? sws_id : existing.sws_id,
    project_number !== undefined ? project_number : existing.project_number,
    approval_id !== undefined ? approval_id : existing.approval_id,
    pan_number !== undefined ? pan_number : existing.pan_number,
    pan_name !== undefined ? pan_name : existing.pan_name,
    pan_dob !== undefined ? pan_dob : existing.pan_dob,
    whitelisted_ip !== undefined ? whitelisted_ip : existing.whitelisted_ip,
    whitelisted_domain !== undefined ? whitelisted_domain : existing.whitelisted_domain,
    is_active !== undefined ? Number(is_active) : existing.is_active,
    plantId
  );

  logAudit(req.user.id, req.user.username, req.user.role, 'UPDATE_PLANT', 'PLANT', plantId, plant_code, 'Sugar mill profile updated', req);

  res.json({ message: 'Plant updated successfully' });
});

// DELETE /api/plants/:id (Admin only)
router.delete('/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const plantId = req.params.id;
  const plant = db.prepare('SELECT * FROM plants WHERE id = ?').get(plantId);
  if (!plant) {
    return res.status(404).json({ error: 'Plant not found' });
  }

  // Prevent deleting if report is submitted/accepted
  const activeReports = db.prepare("SELECT COUNT(*) as cnt FROM p2_reports WHERE plant_id = ? AND status IN ('SUBMITTED', 'ACCEPTED')").get(plantId);
  if (activeReports && activeReports.cnt > 0) {
    return res.status(403).json({ error: 'Cannot delete plant with submitted or accepted NSWS regulatory reports.' });
  }

  db.prepare('DELETE FROM plants WHERE id = ?').run(plantId);
  db.prepare('DELETE FROM production_records WHERE plant_id = ?').run(plantId);
  db.prepare('DELETE FROM diversion_ethanol_records WHERE plant_id = ?').run(plantId);
  db.prepare('DELETE FROM dispatches WHERE plant_id = ?').run(plantId);
  db.prepare('DELETE FROM inventory_stock WHERE plant_id = ?').run(plantId);
  db.prepare('DELETE FROM packaging_records WHERE plant_id = ?').run(plantId);
  db.prepare('DELETE FROM cane_dues_records WHERE plant_id = ?').run(plantId);

  logAudit(req.user.id, req.user.username, req.user.role, 'DELETE_PLANT', 'PLANT', plantId, plant.plant_code, `Plant ${plant.plant_code} deleted by Admin`, req);

  res.json({ message: `Sugar Mill Plant ${plant.plant_code} (${plant.plant_name}) deleted successfully` });
});

module.exports = router;
