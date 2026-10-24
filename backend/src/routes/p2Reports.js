const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, enforcePlantAccess, requireRole, logAudit } = require('../middleware/auth');
const { generateP2Payload, validateP2Data } = require('../services/p2PayloadGenerator');
const { pushP2ReportToNSWS } = require('../services/nswsIntegrationService');

// GET /api/p2-reports (List)
router.get('/', authenticateToken, enforcePlantAccess, (req, res) => {
  const plantId = req.targetPlantId;
  const season = req.query.season;
  const month = req.query.month;
  const status = req.query.status;

  let query = `
    SELECT r.*, p.plant_code, p.plant_name, p.state, p.undertaking_group
    FROM p2_reports r
    JOIN plants p ON r.plant_id = p.id
    WHERE 1=1
  `;
  const params = [];

  if (plantId) {
    query += ' AND r.plant_id = ?';
    params.push(plantId);
  }
  if (season) {
    query += ' AND r.season_name = ?';
    params.push(season);
  }
  if (month) {
    query += ' AND r.month = ?';
    params.push(month);
  }
  if (status) {
    query += ' AND r.status = ?';
    params.push(status);
  }

  query += ' ORDER BY r.id DESC';

  const reports = db.prepare(query).all(...params);
  res.json({ reports });
});

// GET /api/p2-reports/:id (Detail & payload preview)
router.get('/:id', authenticateToken, (req, res) => {
  const reportId = req.params.id;
  const report = db.prepare(`
    SELECT r.*, p.plant_code, p.plant_name, p.state, p.undertaking_group, p.capacity_tcd, p.whitelisted_ip
    FROM p2_reports r
    JOIN plants p ON r.plant_id = p.id
    WHERE r.id = ?
  `).get(reportId);

  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  if (req.user.role === 'CLERK' && String(report.plant_id) !== String(req.user.plant_id)) {
    return res.status(403).json({ error: 'Access denied to this report' });
  }

  // Generate real-time payload
  let payload = null;
  try {
    payload = generateP2Payload(report.plant_id, report.season_name, report.month);
  } catch (err) {
    payload = { error: err.message };
  }

  // Validate
  const validation = validateP2Data(report.plant_id, report.season_name, report.month);

  res.json({
    report,
    payload,
    validation
  });
});

// POST /api/p2-reports/generate (Draft creation)
router.post('/generate', authenticateToken, enforcePlantAccess, (req, res) => {
  const plantId = req.targetPlantId;
  const { season_name, month } = req.body;

  if (!plantId) return res.status(400).json({ error: 'Plant is required' });
  if (!season_name) return res.status(400).json({ error: 'Season is required' });
  if (!month) return res.status(400).json({ error: 'Month is required' });

  const plant = db.prepare('SELECT * FROM plants WHERE id = ?').get(plantId);
  if (!plant) {
    return res.status(404).json({ error: 'Plant not found' });
  }

  const existing = db.prepare('SELECT id, status FROM p2_reports WHERE plant_id = ? AND season_name = ? AND month = ?').get(plantId, season_name, month);

  const payload = generateP2Payload(plantId, season_name, month);
  const payloadStr = JSON.stringify(payload, null, 2);

  let reportId = null;

  if (existing) {
    if (['SUBMITTED', 'ACCEPTED'].includes(existing.status)) {
      return res.status(400).json({ error: 'Report is already submitted/accepted. Cannot regenerate without correction workflow.' });
    }

    db.prepare(`
      UPDATE p2_reports
      SET generated_payload = ?,
          status = 'DRAFT',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(payloadStr, existing.id);

    reportId = existing.id;
  } else {
    const insert = db.prepare(`
      INSERT INTO p2_reports (
        approval_id, sws_id, project_number, plant_id, season_name, month, status, generated_payload
      ) VALUES (?, ?, ?, ?, ?, ?, 'DRAFT', ?)
    `).run(
      plant.approval_id ? plant.approval_id : 'M009_D001_A076',
      plant.sws_id ? plant.sws_id : 'SW4267788494',
      plant.project_number ? plant.project_number : 'P_19',
      plantId,
      season_name,
      month,
      payloadStr
    );
    reportId = insert.lastInsertRowid;
  }

  logAudit(req.user.id, req.user.username, req.user.role, 'GENERATE_REPORT', 'P2_REPORT', reportId, plant.plant_code, `Draft P2 generated for ${month} ${season_name}`, req);

  res.status(201).json({ message: 'Draft report generated successfully', reportId });
});

// POST /api/p2-reports/:id/validate
router.post('/:id/validate', authenticateToken, (req, res) => {
  const reportId = req.params.id;
  const report = db.prepare('SELECT * FROM p2_reports WHERE id = ?').get(reportId);

  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  if (req.user.role === 'CLERK' && String(report.plant_id) !== String(req.user.plant_id)) {
    return res.status(403).json({ error: 'Access denied to this report' });
  }

  const validation = validateP2Data(report.plant_id, report.season_name, report.month);

  db.prepare(`
    UPDATE p2_reports
    SET validation_errors = ?,
        status = CASE WHEN status = 'DRAFT' AND ? = 0 THEN 'VALIDATION_FAILED' ELSE status END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(JSON.stringify(validation), validation.isValid ? 1 : 0, reportId);

  res.json({ validation });
});

// POST /api/p2-reports/:id/submit-for-review (Clerk submits to Admin)
router.post('/:id/submit-for-review', authenticateToken, (req, res) => {
  const reportId = req.params.id;
  const report = db.prepare('SELECT * FROM p2_reports WHERE id = ?').get(reportId);

  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  if (req.user.role === 'CLERK' && String(report.plant_id) !== String(req.user.plant_id)) {
    return res.status(403).json({ error: 'Access denied to this report' });
  }

  const validation = validateP2Data(report.plant_id, report.season_name, report.month);
  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Cannot submit report with blocking validation errors. Please resolve errors first.',
      errors: validation.errors
    });
  }

  db.prepare(`
    UPDATE p2_reports
    SET status = 'PENDING_APPROVAL',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(reportId);

  logAudit(req.user.id, req.user.username, req.user.role, 'SUBMIT_FOR_REVIEW', 'P2_REPORT', reportId, null, `Report submitted for Admin review`, req);

  res.json({ message: 'Report submitted for Admin approval successfully' });
});

// POST /api/p2-reports/:id/approve (Admin only)
router.post('/:id/approve', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const reportId = req.params.id;
  const report = db.prepare('SELECT * FROM p2_reports WHERE id = ?').get(reportId);

  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  db.prepare(`
    UPDATE p2_reports
    SET status = 'APPROVED',
        approved_by = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.user.username, reportId);

  logAudit(req.user.id, req.user.username, req.user.role, 'APPROVE_REPORT', 'P2_REPORT', reportId, null, 'Report approved by Admin', req);

  res.json({ message: 'Report approved successfully' });
});

// POST /api/p2-reports/:id/reject (Admin requests correction)
router.post('/:id/reject', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const reportId = req.params.id;
  const { reason } = req.body;

  const report = db.prepare('SELECT * FROM p2_reports WHERE id = ?').get(reportId);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  db.prepare(`
    UPDATE p2_reports
    SET status = 'CORRECTION_REQUIRED',
        rejection_reason = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(reason ? reason : 'Correction requested by Admin', reportId);

  logAudit(req.user.id, req.user.username, req.user.role, 'REJECT_REPORT', 'P2_REPORT', reportId, null, `Correction requested: ${reason}`, req);

  res.json({ message: 'Report marked for correction' });
});

// POST /api/p2-reports/:id/push-nsws (Submit to NSWS portal)
router.post('/:id/push-nsws', authenticateToken, async (req, res) => {
  const reportId = req.params.id;
  const report = db.prepare('SELECT * FROM p2_reports WHERE id = ?').get(reportId);

  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  // Clerks are authorized to submit reports for their assigned plant; Admin can submit for any plant
  if (req.user.role === 'CLERK' && req.user.plant_id && Number(report.plant_id) !== Number(req.user.plant_id)) {
    return res.status(403).json({ error: 'You are only authorized to submit reports for your assigned plant.' });
  }

  try {
    const result = await pushP2ReportToNSWS(reportId, req.user.id, req.user.username);

    logAudit(
      req.user.id,
      req.user.username,
      req.user.role,
      'PUSH_NSWS',
      'P2_REPORT',
      reportId,
      null,
      `Pushed to NSWS (${result.environment}). Status: ${result.status}`,
      req
    );

    res.json({
      message: 'NSWS Push executed',
      result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
