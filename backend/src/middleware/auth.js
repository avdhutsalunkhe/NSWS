const jwt = require('jsonwebtoken');
const db = require('../config/database');

const envSecret = process.env.JWT_SECRET;
const JWT_SECRET = (envSecret !== undefined && envSecret !== null && envSecret !== '')
  ? envSecret
  : 'sugar_mill_erp_secret_key_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = null;
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length > 1) {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please log in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired session. Please log in again.' });
    }

    // Refresh user from DB to verify active status
    const user = db.prepare(`
      SELECT u.id, u.username, u.role, u.full_name, u.email, u.plant_id, u.is_active,
             p.plant_code, p.plant_name
      FROM users u
      LEFT JOIN plants p ON u.plant_id = p.id
      WHERE u.id = ?
    `).get(decoded.id);

    if (!user) {
      return res.status(403).json({ error: 'User account not found.' });
    }
    if (!user.is_active) {
      return res.status(403).json({ error: 'User account is deactivated.' });
    }

    req.user = user;
    next();
  });
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Requires one of [${roles.join(', ')}] role.` 
      });
    }

    next();
  };
}

function getRequestedPlantId(req) {
  if (req.query && req.query.plantId) {
    return req.query.plantId;
  }
  if (req.body && req.body.plantId) {
    return req.body.plantId;
  }
  if (req.params && req.params.plantId) {
    return req.params.plantId;
  }
  return null;
}

// Middleware that enforces that a Clerk can only operate on their authorized plant
function enforcePlantAccess(req, res, next) {
  if (req.user.role === 'ADMIN') {
    // Admin has access to all plants. If query or body specifies plantId, use it.
    req.targetPlantId = getRequestedPlantId(req);
    return next();
  }

  // Clerk is strictly locked to their assigned factory
  if (!req.user.plant_id) {
    return res.status(403).json({ error: 'No factory/plant assigned to this clerk account.' });
  }

  // Always force the target plant ID to the clerk's assigned plant
  req.targetPlantId = req.user.plant_id;

  // If the clerk sent a different plantId in query or body, block it
  const requestedPlantId = getRequestedPlantId(req);
  if (requestedPlantId && String(requestedPlantId) !== String(req.user.plant_id)) {
    return res.status(403).json({ 
      error: `Access violation: You are authorized only for Plant ${req.user.plant_code} (${req.user.plant_name}).` 
    });
  }

  next();
}

function logAudit(userId, username, role, action, entityType, entityId, plantCode, details, req) {
  try {
    let ip = '127.0.0.1';
    if (req) {
      if (req.headers && req.headers['x-forwarded-for']) {
        ip = req.headers['x-forwarded-for'];
      } else if (req.socket && req.socket.remoteAddress) {
        ip = req.socket.remoteAddress;
      }
    }

    const userVal = (userId !== undefined && userId !== null) ? userId : null;
    const usernameVal = (username !== undefined && username !== null) ? username : 'SYSTEM';
    const roleVal = (role !== undefined && role !== null) ? role : 'SYSTEM';
    const entityIdVal = (entityId !== undefined && entityId !== null) ? String(entityId) : null;
    const plantCodeVal = (plantCode !== undefined && plantCode !== null) ? plantCode : null;
    const detailsVal = (typeof details === 'object') ? JSON.stringify(details) : String(details);

    db.prepare(`
      INSERT INTO audit_logs (user_id, username, role, action, entity_type, entity_id, plant_code, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userVal,
      usernameVal,
      roleVal,
      action,
      entityType,
      entityIdVal,
      plantCodeVal,
      detailsVal,
      ip
    );
  } catch (err) {
    console.error('Audit logging failed:', err.message);
  }
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  requireRole,
  enforcePlantAccess,
  logAudit,
};
