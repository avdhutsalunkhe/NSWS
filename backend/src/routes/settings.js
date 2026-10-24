const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole, logAudit } = require('../middleware/auth');

// GET /api/settings
router.get('/', authenticateToken, (req, res) => {
  const settings = db.prepare('SELECT * FROM system_settings ORDER BY id DESC LIMIT 1').get();
  res.json({ settings: settings ? settings : {} });
});

// PUT /api/settings (Admin only)
router.put('/', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const {
    active_environment,
    uat_url,
    ppe_url,
    prod_url,
    access_id,
    access_secret,
    api_key,
    jsession_id,
    is_mock_mode,
    auto_approve_clerk
  } = req.body;

  const current = db.prepare('SELECT * FROM system_settings ORDER BY id DESC LIMIT 1').get();

  if (current) {
    db.prepare(`
      UPDATE system_settings
      SET active_environment = ?,
          uat_url = ?,
          ppe_url = ?,
          prod_url = ?,
          access_id = ?,
          access_secret = ?,
          api_key = ?,
          jsession_id = ?,
          is_mock_mode = ?,
          auto_approve_clerk = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      active_environment ? active_environment : current.active_environment,
      uat_url ? uat_url : current.uat_url,
      ppe_url ? ppe_url : current.ppe_url,
      prod_url ? prod_url : current.prod_url,
      access_id ? access_id : current.access_id,
      access_secret ? access_secret : current.access_secret,
      api_key ? api_key : current.api_key,
      jsession_id ? jsession_id : current.jsession_id,
      is_mock_mode !== undefined ? Number(is_mock_mode) : current.is_mock_mode,
      auto_approve_clerk !== undefined ? Number(auto_approve_clerk) : current.auto_approve_clerk,
      current.id
    );
  } else {
    db.prepare(`
      INSERT INTO system_settings (
        active_environment, uat_url, ppe_url, prod_url,
        access_id, access_secret, api_key, jsession_id, is_mock_mode, auto_approve_clerk
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      active_environment ? active_environment : 'UAT',
      uat_url ? uat_url : 'https://uat-nsws-mnstrportal.investindia.gov.in/nsws_license/saveP2Data',
      ppe_url ? ppe_url : 'https://www.ppe-nodal-authority.nsws.gov.in/nsws_license/saveP2Data',
      prod_url ? prod_url : 'https://nsws.gov.in/nsws_license/saveP2Data',
      access_id ? access_id : 'SaveP2Data',
      access_secret ? access_secret : 'SaveP2Data#0605_NSWS@1252',
      api_key ? api_key : 'SaveP2Data#0605@AK1161',
      jsession_id ? jsession_id : '87C2405550A874E21D02299E47E6A504',
      is_mock_mode !== undefined ? Number(is_mock_mode) : 1,
      auto_approve_clerk !== undefined ? Number(auto_approve_clerk) : 0
    );
  }

  logAudit(req.user.id, req.user.username, req.user.role, 'UPDATE_SETTINGS', 'SYSTEM_SETTINGS', '1', null, `NSWS integration settings updated. Active: ${active_environment}`, req);

  res.json({ message: 'Integration settings saved successfully' });
});

module.exports = router;
