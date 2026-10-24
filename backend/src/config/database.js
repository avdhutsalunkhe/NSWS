const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const envDbPath = process.env.DB_PATH;
const dbPath = (envDbPath !== undefined && envDbPath !== null && envDbPath !== '') 
  ? envDbPath 
  : path.join(__dirname, '../../database.sqlite');

const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign key support and WAL mode for high performance and durability
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
