const db = require('../config/database');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS plants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plant_code TEXT UNIQUE NOT NULL,
      plant_name TEXT NOT NULL,
      undertaking_group TEXT NOT NULL,
      state TEXT NOT NULL,
      capacity_tcd REAL DEFAULT 100,
      sws_id TEXT DEFAULT 'SW3795947361',
      project_number TEXT DEFAULT 'P_11',
      approval_id TEXT DEFAULT 'M009_D001_A076',
      pan_number TEXT,
      pan_name TEXT,
      pan_dob TEXT,
      whitelisted_ip TEXT,
      whitelisted_domain TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sugar_seasons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season_name TEXT UNIQUE NOT NULL,
      start_date TEXT,
      end_date TEXT,
      status TEXT DEFAULT 'ACTIVE',
      is_current INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('ADMIN', 'CLERK')),
      full_name TEXT NOT NULL,
      email TEXT,
      plant_id INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS production_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plant_id INTEGER NOT NULL,
      season_name TEXT NOT NULL,
      month TEXT NOT NULL,
      capacity_tcd REAL DEFAULT 0,
      cane_crushed_month_mt REAL DEFAULT 0,
      est_remaining_crushing_mt REAL DEFAULT 0,
      est_seasonal_sugar_mt REAL DEFAULT 0,
      
      -- White / Refined Sugar
      white_from_cane_mt REAL DEFAULT 0,
      white_from_reprocessing_old_mt REAL DEFAULT 0,
      white_from_procured_raw_mt REAL DEFAULT 0,
      white_from_transferred_white_mt REAL DEFAULT 0,
      white_from_own_raw_stock_mt REAL DEFAULT 0,
      white_sugar_produced_own_stock_mt REAL DEFAULT 0,
      
      -- Raw Sugar
      raw_from_cane_mt REAL DEFAULT 0,
      raw_from_reprocessing_old_mt REAL DEFAULT 0,
      raw_procured_domestic_mt REAL DEFAULT 0,
      
      -- Procured Sugar
      procured_raw_internal_transfer_mt REAL DEFAULT 0,
      internal_transfer_plant_code TEXT,
      internal_transfer_plant_name TEXT,
      procured_from_imported_raw_mt REAL DEFAULT 0,
      
      -- Recovery Metrics
      purity_mixed_juice_pct REAL DEFAULT 0,
      pol_mixed_juice_pct REAL DEFAULT 0,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(plant_id, season_name, month),
      FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS diversion_ethanol_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plant_id INTEGER NOT NULL,
      season_name TEXT NOT NULL,
      month TEXT NOT NULL,
      
      -- Diversion / Sale
      juice_diverted_for_ethanol_mt REAL DEFAULT 0,
      b_heavy_diverted_for_ethanol_mt REAL DEFAULT 0,
      c_heavy_diverted_for_ethanol_mt REAL DEFAULT 0,
      sale_b_heavy_mt REAL DEFAULT 0,
      sale_juice_syrup_mt REAL DEFAULT 0,
      sale_c_heavy_mt REAL DEFAULT 0,
      
      -- Ethanol Production
      ethanol_from_juice_kl REAL DEFAULT 0,
      ethanol_from_b_heavy_kl REAL DEFAULT 0,
      ethanol_from_c_heavy_kl REAL DEFAULT 0,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(plant_id, season_name, month),
      FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS dispatches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plant_id INTEGER NOT NULL,
      season_name TEXT NOT NULL,
      month TEXT NOT NULL,
      category TEXT NOT NULL,
      release_order_no TEXT,
      release_order_date TEXT,
      qty_released_mt REAL DEFAULT 0,
      qty_dispatched_mt REAL DEFAULT 0,
      target_plant_code TEXT,
      target_plant_name TEXT,
      serial_number TEXT,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS hsn_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plant_id INTEGER NOT NULL,
      season_name TEXT NOT NULL,
      month TEXT NOT NULL,
      hsn_17011490_mt REAL DEFAULT 0,
      hsn_17019990_mt REAL DEFAULT 0,
      hsn_others_mt REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(plant_id, season_name, month),
      FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS imports_exports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plant_id INTEGER NOT NULL,
      season_name TEXT NOT NULL,
      month TEXT NOT NULL,
      
      -- Exports
      exp_66a_i_order_no TEXT,
      exp_66a_i_order_date TEXT,
      exp_66a_i_qty_released REAL DEFAULT 0,
      exp_66a_i_qty_dispatched REAL DEFAULT 0,
      
      exp_66a_ii_order_no TEXT,
      exp_66a_ii_order_date TEXT,
      exp_66a_ii_qty_released REAL DEFAULT 0,
      exp_66a_ii_qty_dispatched REAL DEFAULT 0,
      
      exp_66a_iii_order_no TEXT,
      exp_66a_iii_order_date TEXT,
      exp_66a_iii_qty_dispatched REAL DEFAULT 0,
      exp_66a_iii_buyer_refinery TEXT,
      
      exp_66b_order_no TEXT,
      exp_66b_order_date TEXT,
      exp_66b_qty_released REAL DEFAULT 0,
      exp_66b_qty_received REAL DEFAULT 0,
      
      -- Imports
      import_applicable TEXT DEFAULT 'Yes',
      imp_67a_i_white_mt REAL DEFAULT 0,
      imp_67a_ii_raw_mt REAL DEFAULT 0,
      imp_67b_aas_mt REAL DEFAULT 0,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(plant_id, season_name, month),
      FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS inventory_stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plant_id INTEGER NOT NULL,
      season_name TEXT NOT NULL,
      month TEXT NOT NULL,
      
      -- Factory Premises
      factory_white_opening REAL DEFAULT 0,
      factory_white_closing REAL DEFAULT 0,
      factory_biss_opening REAL DEFAULT 0,
      factory_biss_closing REAL DEFAULT 0,
      factory_raw_opening REAL DEFAULT 0,
      factory_raw_closing REAL DEFAULT 0,
      
      -- Outside Godown (Duty paid)
      godown_white_opening REAL DEFAULT 0,
      godown_white_closing REAL DEFAULT 0,
      godown_biss_opening REAL DEFAULT 0,
      godown_biss_closing REAL DEFAULT 0,
      godown_raw_opening REAL DEFAULT 0,
      godown_raw_closing REAL DEFAULT 0,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(plant_id, season_name, month),
      FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS packaging_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plant_id INTEGER NOT NULL,
      season_name TEXT NOT NULL,
      month TEXT NOT NULL,
      jute_50kg_mt REAL DEFAULT 0,
      jute_100kg_mt REAL DEFAULT 0,
      pp_hdpe_50kg_mt REAL DEFAULT 0,
      other_retail_loose_mt REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(plant_id, season_name, month),
      FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cane_dues_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plant_id INTEGER NOT NULL,
      season_name TEXT NOT NULL,
      month TEXT NOT NULL,
      
      -- Current Season
      current_payable_cr REAL DEFAULT 0,
      current_paid_cr REAL DEFAULT 0,
      current_farmers_count INTEGER DEFAULT 0,
      
      -- Historical Seasons
      historical_dues_json TEXT,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(plant_id, season_name, month),
      FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS p2_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      approval_id TEXT DEFAULT 'M009_D001_A076',
      sws_id TEXT DEFAULT 'SW3795947361',
      project_number TEXT DEFAULT 'P_11',
      plant_id INTEGER NOT NULL,
      season_name TEXT NOT NULL,
      month TEXT NOT NULL,
      status TEXT DEFAULT 'DRAFT',
      validation_errors TEXT,
      generated_payload TEXT,
      submitted_at DATETIME,
      submitted_by TEXT,
      approved_by TEXT,
      rejection_reason TEXT,
      response_log TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(plant_id, season_name, month),
      FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT,
      role TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      plant_code TEXT,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      active_environment TEXT DEFAULT 'UAT', -- 'UAT', 'PPE', 'PRODUCTION'
      uat_url TEXT DEFAULT 'https://uat-nsws-mnstrportal.investindia.gov.in/nsws_license/saveP2Data',
      ppe_url TEXT DEFAULT 'https://www.ppe-nodal-authority.nsws.gov.in/nsws_license/saveP2Data',
      prod_url TEXT DEFAULT 'https://nsws.gov.in/nsws_license/saveP2Data',
      access_id TEXT DEFAULT 'SaveP2Data',
      access_secret TEXT DEFAULT 'SaveP2Data#0605_NSWS@1252',
      api_key TEXT DEFAULT 'SaveP2Data#0605@AK1161',
      jsession_id TEXT DEFAULT '87C2405550A874E21D02299E47E6A504',
      is_mock_mode INTEGER DEFAULT 1,
      auto_approve_clerk INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Database tables verified and initialized successfully.');
}

module.exports = { initSchema };
