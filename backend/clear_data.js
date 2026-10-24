const db = require('./src/config/database');

const tables = [
  'production_records',
  'diversion_ethanol_records',
  'dispatches',
  'hsn_sales',
  'imports_exports',
  'inventory_stock',
  'packaging_records',
  'cane_dues_records',
  'p2_reports',
  'audit_logs'
];

try {
  const deleteTx = db.transaction(() => {
    for (const table of tables) {
      db.prepare(`DELETE FROM ${table}`).run();
    }
    // Reset auto-increment counters if present
    try {
      db.prepare(`DELETE FROM sqlite_sequence WHERE name IN (${tables.map(t => `'${t}'`).join(',')})`).run();
    } catch (seqErr) {
      // sqlite_sequence might be empty or missing, which is fine
    }
  });

  deleteTx();
  console.log('CLEARED_SUCCESSFULLY');

  // Verify counts
  const counts = {};
  for (const table of tables) {
    counts[table] = db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get().c;
  }
  console.log('RECORD_COUNTS:', JSON.stringify(counts));
} catch (err) {
  console.error('ERROR_CLEARING:', err.message);
  process.exit(1);
}
