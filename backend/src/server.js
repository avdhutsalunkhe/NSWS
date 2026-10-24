const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const { initSchema } = require('./models/schema');
const { seedDatabase } = require('./seed/seedData');

// Route modules
const authRoutes = require('./routes/auth');
const plantRoutes = require('./routes/plants');
const seasonRoutes = require('./routes/seasons');
const productionRoutes = require('./routes/production');
const diversionRoutes = require('./routes/diversions');
const dispatchRoutes = require('./routes/dispatches');
const impExpRoutes = require('./routes/importsExports');
const inventoryRoutes = require('./routes/inventory');
const packagingRoutes = require('./routes/packaging');
const caneDuesRoutes = require('./routes/caneDues');
const p2ReportRoutes = require('./routes/p2Reports');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/users');
const settingRoutes = require('./routes/settings');
const auditLogRoutes = require('./routes/auditLogs');

const app = express();
const PORT = process.env.PORT ? process.env.PORT : 5000;
const HOST = process.env.HOST ? process.env.HOST : '0.0.0.0';

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize DB schema & seed data
try {
  initSchema();
  seedDatabase();
} catch (initErr) {
  console.error('Database initialization error:', initErr.message);
}

// Helper to get active LAN IP
function getLanIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('127.') && !net.address.startsWith('172.21.')) {
        return net.address;
      }
    }
  }
  return '192.168.1.93';
}

// Root & Health check endpoints
app.get('/', (req, res) => {
  const lanIp = getLanIp();
  res.json({
    status: 'UP',
    service: 'Sugar Mill ERP & NSWS Integration Backend API',
    frontend: `http://${lanIp}:3000`,
    health: '/api/health'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', service: 'Sugar Mill ERP & NSWS Integration Backend' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/sugar-seasons', seasonRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/diversions', diversionRoutes);
app.use('/api/dispatches', dispatchRoutes);
app.use('/api/imports-exports', impExpRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/packaging', packagingRoutes);
app.use('/api/cane-dues', caneDuesRoutes);
app.use('/api/p2-reports', p2ReportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Process-level safety listeners
process.on('uncaughtException', (err) => {
  const errMsg = err && err.stack ? err.stack : err;
  console.error('Uncaught Exception:', errMsg);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global Error Handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid JSON payload provided'
    });
  }

  const errDetail = err && err.stack ? err.stack : err;
  console.error('Unhandled server error:', errDetail);
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = 500;
  if (err && err.status) {
    statusCode = err.status;
  } else if (err && err.statusCode) {
    statusCode = err.statusCode;
  }
  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Internal Server Error' : 'Request Error',
    message: err.message
  });
});

app.listen(PORT, HOST, () => {
  const lanIp = getLanIp();
  console.log(`Sugar Mill ERP Backend running:`);
  console.log(`  ➜ Network (LAN): http://${lanIp}:${PORT}`);
  console.log(`  ➜ Frontend UI:   http://${lanIp}:3000`);
});
