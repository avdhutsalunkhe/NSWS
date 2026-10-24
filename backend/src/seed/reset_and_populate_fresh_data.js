const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { validateP2Data } = require('../services/p2PayloadGenerator');

function resetAndSeedFreshData() {
  console.log('=== Clearing Old Operational Data ===');

  const tablesToClear = [
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

  const clearTx = db.transaction(() => {
    for (const t of tablesToClear) {
      db.prepare(`DELETE FROM ${t}`).run();
    }
    try {
      db.prepare(`DELETE FROM sqlite_sequence WHERE name IN (${tablesToClear.map(t => `'${t}'`).join(',')})`).run();
    } catch (e) {}
  });
  clearTx();
  console.log('Tables cleared.');

  // 1. Upsert Plants
  console.log('=== Synchronizing Plants Master ===');
  const upsertPlant = (code, name, group, state, capacity, swsId, projectNo, approvalId, panNo, panName, panDob, ip, domain) => {
    let existing = db.prepare('SELECT id FROM plants WHERE plant_code = ?').get(code);
    if (!existing) {
      const res = db.prepare(`
        INSERT INTO plants (
          plant_code, plant_name, undertaking_group, state, capacity_tcd,
          sws_id, project_number, approval_id, pan_number, pan_name, pan_dob,
          whitelisted_ip, whitelisted_domain, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(code, name, group, state, capacity, swsId, projectNo, approvalId, panNo, panName, panDob, ip, domain);
      return res.lastInsertRowid;
    } else {
      db.prepare(`
        UPDATE plants SET
          plant_name = ?, undertaking_group = ?, state = ?, capacity_tcd = ?,
          sws_id = ?, project_number = ?, approval_id = ?, pan_number = ?,
          pan_name = ?, pan_dob = ?, whitelisted_ip = ?, whitelisted_domain = ?, is_active = 1
        WHERE id = ?
      `).run(name, group, state, capacity, swsId, projectNo, approvalId, panNo, panName, panDob, ip, domain, existing.id);
      return existing.id;
    }
  };

  const p8901Id = upsertPlant(
    '8901', 'BALRAMPUR', 'DELIGHT PROTEINS LIMITED', 'UTTAR PRADESH', 15000,
    'SW4267788494', 'P_19', 'M009_D001_A076', 'ABCDE1234F', 'DELIGHT PROTEINS LTD', '15/08/1995',
    '65.1.33.103', 'balrampur.delightproteins.in'
  );

  const p102Id = upsertPlant(
    '102', 'ZIRA', 'DELIGHT PROTEINS LIMITED', 'ANDAMAN AND NICOBAR ISLANDS', 2500,
    'SW3795947361', 'P_11', 'M009_D001_A076', 'BKRLP1928K', 'DELIGHT PROTEINS LTD', '01/01/1990',
    '13.126.86.80', 'zira.delightproteins.com'
  );

  const p15501Id = upsertPlant(
    '15501', 'UNIT NO. 1 SAKHRALE', 'Rajarambapu Patil Sahakari Sakhar Karkhana Ltd.', 'MAHARASHTRA', 5000,
    'SW4267788494', 'P_20', 'M009_D001_A076', 'MHRPK1550K', 'RAJARAMBAPU PATIL SAKHAR LTD', '01/06/1985',
    '192.168.1.93', 'sakhrale.rajarambapu.com'
  );

  // 2. Ensure Clerk and Admin User Accounts
  console.log('=== Updating User Logins ===');
  const upsertUser = (username, password, role, fullName, email, plantId) => {
    const hash = bcrypt.hashSync(password, 10);
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (!existing) {
      db.prepare(`
        INSERT INTO users (username, password_hash, role, full_name, email, plant_id, is_active)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `).run(username, hash, role, fullName, email, plantId);
    } else {
      db.prepare(`
        UPDATE users SET password_hash = ?, role = ?, full_name = ?, email = ?, plant_id = ?, is_active = 1
        WHERE id = ?
      `).run(hash, role, fullName, email, plantId, existing.id);
    }
  };

  upsertUser('admin', 'Admin@123', 'ADMIN', 'Directorate Administrator', 'admin@sugar.gov.in', null);
  upsertUser('8901', 'Clerk@8901', 'CLERK', 'Balrampur Factory Clerk', 'clerk.8901@delightproteins.in', p8901Id);
  upsertUser('102', 'Clerk@102', 'CLERK', 'Zira Factory Clerk', 'clerk.102@delightproteins.in', p102Id);
  upsertUser('15501', 'Clerk@15501', 'CLERK', 'Sakhrale Factory Clerk', 'clerk.15501@sakhrale.com', p15501Id);

  // 3. System Settings (UAT Real, Mock Mode OFF)
  console.log('=== Setting NSWS Gateway to Real UAT ===');
  const existingSettings = db.prepare('SELECT id FROM system_settings ORDER BY id DESC LIMIT 1').get();
  if (existingSettings) {
    db.prepare(`
      UPDATE system_settings SET
        active_environment = 'UAT',
        uat_url = 'https://uat-nsws-mnstrportal.investindia.gov.in/nsws_license/saveP2Data',
        access_id = 'SaveP2Data',
        access_secret = 'SaveP2Data#0605_NSWS@1252',
        api_key = 'SaveP2Data#0605@AK1161',
        jsession_id = '87C2405550A874E21D02299E47E6A504',
        is_mock_mode = 0,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(existingSettings.id);
  } else {
    db.prepare(`
      INSERT INTO system_settings (
        active_environment, uat_url, ppe_url, prod_url,
        access_id, access_secret, api_key, jsession_id, is_mock_mode
      ) VALUES (
        'UAT',
        'https://uat-nsws-mnstrportal.investindia.gov.in/nsws_license/saveP2Data',
        'https://www.ppe-nodal-authority.nsws.gov.in/nsws_license/saveP2Data',
        'https://nsws.gov.in/nsws_license/saveP2Data',
        'SaveP2Data',
        'SaveP2Data#0605_NSWS@1252',
        'SaveP2Data#0605@AK1161',
        '87C2405550A874E21D02299E47E6A504',
        0
      )
    `).run();
  }

  // 4. Sugar Seasons Master
  const seasonsMaster = ['2026-27', '2025-26', '2024-25', '2023-24'];
  for (const s of seasonsMaster) {
    const exSeason = db.prepare('SELECT id FROM sugar_seasons WHERE season_name = ?').get(s);
    const isCurrent = s === '2026-27' ? 1 : 0;
    if (!exSeason) {
      db.prepare(`
        INSERT INTO sugar_seasons (season_name, start_date, end_date, is_current, status)
        VALUES (?, '01-10', '30-09', ?, 'ACTIVE')
      `).run(s, isCurrent);
    } else {
      db.prepare('UPDATE sugar_seasons SET is_current = ? WHERE id = ?').run(isCurrent, exSeason.id);
    }
  }

  // 5. Helper to seed clean operational data
  const seedPlantSeasonMonth = (plantId, season, month, cfg) => {
    // 1. Production
    db.prepare(`
      INSERT INTO production_records (
        plant_id, season_name, month, capacity_tcd, cane_crushed_month_mt,
        est_remaining_crushing_mt, est_seasonal_sugar_mt,
        white_from_cane_mt, white_from_reprocessing_old_mt, white_from_procured_raw_mt,
        white_from_transferred_white_mt, white_from_own_raw_stock_mt, white_sugar_produced_own_stock_mt,
        raw_from_cane_mt, raw_from_reprocessing_old_mt, raw_procured_domestic_mt,
        procured_raw_internal_transfer_mt, internal_transfer_plant_code, internal_transfer_plant_name,
        procured_from_imported_raw_mt, purity_mixed_juice_pct, pol_mixed_juice_pct
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?,
        ?, 0, 0,
        0, 0, 0,
        0, 0, 0,
        0, '', '',
        0, 85.5, 12.8
      )
    `).run(
      plantId, season, month, cfg.capacity, cfg.crushed,
      cfg.remaining, cfg.seasonalSugar,
      cfg.whiteSugar
    );

    // 2. Diversion / Ethanol
    db.prepare(`
      INSERT INTO diversion_ethanol_records (
        plant_id, season_name, month,
        juice_diverted_for_ethanol_mt, b_heavy_diverted_for_ethanol_mt, c_heavy_diverted_for_ethanol_mt,
        sale_b_heavy_mt, sale_juice_syrup_mt, sale_c_heavy_mt,
        ethanol_from_juice_kl, ethanol_from_b_heavy_kl, ethanol_from_c_heavy_kl
      ) VALUES (
        ?, ?, ?,
        ?, ?, 0,
        0, 0, 0,
        ?, ?, 0
      )
    `).run(
      plantId, season, month,
      cfg.juiceDiv, cfg.bHeavyDiv,
      cfg.ethJuice, cfg.ethBHeavy
    );

    // 3. Dispatches (6.1.1 Monthly Release)
    db.prepare(`
      INSERT INTO dispatches (
        plant_id, season_name, month, category,
        release_order_date, qty_released_mt, qty_dispatched_mt, remarks
      ) VALUES (
        ?, ?, ?, '6.1.1',
        '2026-10-01', ?, ?, 'Statutory Monthly Release Allocation'
      )
    `).run(plantId, season, month, cfg.dispatch, cfg.dispatch);

    // 4. HSN Sales
    db.prepare(`
      INSERT INTO hsn_sales (
        plant_id, season_name, month,
        hsn_17011490_mt, hsn_17019990_mt
      ) VALUES (
        ?, ?, ?,
        0, ?
      )
    `).run(plantId, season, month, cfg.dispatch);

    // 5. Imports / Exports
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
        'EXP-56765', '14/10/2026', 100, 80,
        'EXP-6876', '15/10/2026', 67, 56,
        'EXP-657687', '17/10/2026', 67, 'DELIGHT REFINERIES LTD',
        'EXP-687876', '21/10/2026', 90, 23,
        'Yes', 20, 10, 5
      )
    `).run(plantId, season, month);

    // 6. Inventory Stock (Balanced)
    db.prepare(`
      INSERT INTO inventory_stock (
        plant_id, season_name, month,
        factory_white_opening, factory_white_closing,
        factory_biss_opening, factory_biss_closing,
        factory_raw_opening, factory_raw_closing,
        godown_white_opening, godown_white_closing,
        godown_biss_opening, godown_biss_closing,
        godown_raw_opening, godown_raw_closing
      ) VALUES (
        ?, ?, ?,
        ?, ?,
        0, 0,
        0, 0,
        0, 0,
        0, 0,
        0, 0
      )
    `).run(plantId, season, month, cfg.stockOpen, cfg.stockClose);

    // 7. Packaging Records (Exact match to Closing Stock)
    const pJute = Math.floor(cfg.stockClose * 0.6);
    const pPp = cfg.stockClose - pJute;
    db.prepare(`
      INSERT INTO packaging_records (
        plant_id, season_name, month,
        jute_50kg_mt, jute_100kg_mt, pp_hdpe_50kg_mt, other_retail_loose_mt
      ) VALUES (
        ?, ?, ?,
        ?, 0, ?, 0
      )
    `).run(plantId, season, month, pJute, pPp);

    // 8. Cane Dues (Clean 4 rolling seasons)
    const historicalDues = [
      { season: '2025-26', caneCrushed: '85000', sugarProduction: '8925', sugarRecovery: '10.5', payableCr: '120.0', paidCr: '115.0', farmersCount: '13500' },
      { season: '2024-25', caneCrushed: '82000', sugarProduction: '8610', sugarRecovery: '10.5', payableCr: '110.0', paidCr: '110.0', farmersCount: '13000' },
      { season: '2023-24', caneCrushed: '79000', sugarProduction: '8295', sugarRecovery: '10.5', payableCr: '105.0', paidCr: '105.0', farmersCount: '12500' },
      { season: '2022-23', caneCrushed: '75000', sugarProduction: '7875', sugarRecovery: '10.5', payableCr: '98.0', paidCr: '98.0', farmersCount: '12000' }
    ];

    db.prepare(`
      INSERT INTO cane_dues_records (
        plant_id, season_name, month,
        current_payable_cr, current_paid_cr, current_farmers_count, historical_dues_json
      ) VALUES (
        ?, ?, ?,
        ?, ?, ?, ?
      )
    `).run(
      plantId, season, month,
      cfg.duesPayable, cfg.duesPaid, cfg.duesFarmers,
      JSON.stringify(historicalDues)
    );

    // 9. Create Fresh DRAFT P2 Report
    const plant = db.prepare('SELECT * FROM plants WHERE id = ?').get(plantId);
    const draftRes = db.prepare(`
      INSERT INTO p2_reports (
        approval_id, sws_id, project_number, plant_id, season_name, month, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'DRAFT')
    `).run(plant.approval_id, plant.sws_id, plant.project_number, plantId, season, month);

    const valResult = validateP2Data(plantId, season, month);
    db.prepare(`
      UPDATE p2_reports
      SET validation_errors = ?,
          status = 'DRAFT'
      WHERE id = ?
    `).run(JSON.stringify(valResult), draftRes.lastInsertRowid);

    console.log(`Seeded Plant ${plant.plant_code} - ${season} ${month} -> Report ID #${draftRes.lastInsertRowid} (Draft)`);
  };

  // Populate data across plants & seasons
  console.log('=== Populating Fresh Factory Data across Plants & Seasons ===');

  // BALRAMPUR (8901) - 15,000 TCD
  seedPlantSeasonMonth(p8901Id, '2026-27', 'October', {
    capacity: 15000, crushed: 85000, remaining: 350000, seasonalSugar: 45000, whiteSugar: 8925,
    juiceDiv: 1500, bHeavyDiv: 3400, ethJuice: 1120, ethBHeavy: 2550, dispatch: 5200,
    stockOpen: 3000, stockClose: 6725, duesPayable: 125.5, duesPaid: 110.2, duesFarmers: 14200
  });

  seedPlantSeasonMonth(p8901Id, '2026-27', 'November', {
    capacity: 15000, crushed: 92000, remaining: 258000, seasonalSugar: 45000, whiteSugar: 9660,
    juiceDiv: 1600, bHeavyDiv: 3600, ethJuice: 1200, ethBHeavy: 2700, dispatch: 6000,
    stockOpen: 6725, stockClose: 10385, duesPayable: 135.0, duesPaid: 125.0, duesFarmers: 14500
  });

  seedPlantSeasonMonth(p8901Id, '2025-26', 'October', {
    capacity: 15000, crushed: 80000, remaining: 320000, seasonalSugar: 42000, whiteSugar: 8400,
    juiceDiv: 1400, bHeavyDiv: 3200, ethJuice: 1050, ethBHeavy: 2400, dispatch: 5000,
    stockOpen: 2500, stockClose: 5900, duesPayable: 118.0, duesPaid: 105.0, duesFarmers: 13800
  });

  // ZIRA (102) - 2,500 TCD
  seedPlantSeasonMonth(p102Id, '2026-27', 'October', {
    capacity: 2500, crushed: 18200, remaining: 75000, seasonalSugar: 9500, whiteSugar: 1911,
    juiceDiv: 350, bHeavyDiv: 720, ethJuice: 260, ethBHeavy: 540, dispatch: 1100,
    stockOpen: 800, stockClose: 1611, duesPayable: 26.8, duesPaid: 24.1, duesFarmers: 3100
  });

  seedPlantSeasonMonth(p102Id, '2026-27', 'November', {
    capacity: 2500, crushed: 19500, remaining: 55500, seasonalSugar: 9500, whiteSugar: 2047,
    juiceDiv: 380, bHeavyDiv: 750, ethJuice: 280, ethBHeavy: 560, dispatch: 1200,
    stockOpen: 1611, stockClose: 2458, duesPayable: 28.5, duesPaid: 26.0, duesFarmers: 3200
  });

  // UNIT NO. 1 SAKHRALE (15501) - 5,000 TCD
  seedPlantSeasonMonth(p15501Id, '2026-27', 'October', {
    capacity: 5000, crushed: 35000, remaining: 150000, seasonalSugar: 18000, whiteSugar: 3675,
    juiceDiv: 700, bHeavyDiv: 1400, ethJuice: 520, ethBHeavy: 1050, dispatch: 2200,
    stockOpen: 1500, stockClose: 2975, duesPayable: 52.0, duesPaid: 48.0, duesFarmers: 6200
  });

  console.log('=== Fresh Database Seeding Complete ===');
}

resetAndSeedFreshData();
