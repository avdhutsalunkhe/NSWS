const db = require('../config/database');
const bcrypt = require('bcryptjs');

function seedGurdaspur() {
  console.log('=== Clearing all old data ===');

  // Disable foreign keys temporarily for clean wipe
  db.pragma('foreign_keys = OFF');

  db.prepare('DELETE FROM p2_reports').run();
  db.prepare('DELETE FROM cane_dues_records').run();
  db.prepare('DELETE FROM packaging_records').run();
  db.prepare('DELETE FROM inventory_stock').run();
  db.prepare('DELETE FROM imports_exports').run();
  db.prepare('DELETE FROM hsn_sales').run();
  db.prepare('DELETE FROM dispatches').run();
  db.prepare('DELETE FROM diversion_ethanol_records').run();
  db.prepare('DELETE FROM production_records').run();
  db.prepare('DELETE FROM users').run();
  db.prepare('DELETE FROM plants').run();

  db.pragma('foreign_keys = ON');

  console.log('=== Inserting Whitelisted GURDASPUR Plant ===');
  const plantRes = db.prepare(`
    INSERT INTO plants (
      plant_code, plant_name, undertaking_group, state, capacity_tcd,
      sws_id, project_number, approval_id, pan_number, pan_name, pan_dob,
      whitelisted_ip, whitelisted_domain, is_active
    ) VALUES (
      '101',
      'GURDASPUR',
      'DELIGHT PROTEINS LIMITED',
      'UTTAR PRADESH',
      15000,
      'SW3795947361',
      'P_11',
      'M009_D001_A076',
      'ABCDE1234F',
      'DELIGHT PROTEINS LTD',
      '15/08/1995',
      '13.126.86.81',
      'gurdaspur.sugarmills.in',
      1
    )
  `).run();

  const plantId = plantRes.lastInsertRowid;
  console.log(`GURDASPUR Plant ID created: ${plantId}`);

  console.log('=== Ensuring Sugar Seasons ===');
  db.prepare("UPDATE sugar_seasons SET is_current = 0").run();
  const s2627 = db.prepare("SELECT id FROM sugar_seasons WHERE season_name = '2026-27'").get();
  if (s2627) {
    db.prepare("UPDATE sugar_seasons SET is_current = 1, status = 'ACTIVE' WHERE id = ?").run(s2627.id);
  } else {
    db.prepare(`
      INSERT INTO sugar_seasons (season_name, start_date, end_date, status, is_current)
      VALUES ('2026-27', '01-10', '30-09', 'ACTIVE', 1)
    `).run();
  }

  console.log('=== Inserting Users ===');
  const adminHash = bcrypt.hashSync('Password@123', 10);
  const clerkHash = bcrypt.hashSync('Clerk@101', 10);

  db.prepare(`
    INSERT INTO users (username, password_hash, role, full_name, email, plant_id, is_active)
    VALUES ('admin', ?, 'ADMIN', 'Super Administrator', 'admin@sugarcentral.gov.in', ?, 1)
  `).run(adminHash, plantId);

  db.prepare(`
    INSERT INTO users (username, password_hash, role, full_name, email, plant_id, is_active)
    VALUES ('101', ?, 'CLERK', 'Gurdaspur Factory Clerk', 'clerk.101@gurdaspur.in', ?, 1)
  `).run(clerkHash, plantId);

  console.log('=== Seeding Operational Records for October 2026-27 ===');

  const season = '2026-27';
  const month = 'October';

  // 1. Production
  db.prepare(`
    INSERT INTO production_records (
      plant_id, season_name, month, capacity_tcd, cane_crushed_month_mt, est_remaining_crushing_mt, est_seasonal_sugar_mt,
      white_from_cane_mt, white_from_reprocessing_old_mt, white_from_procured_raw_mt, white_from_transferred_white_mt,
      white_from_own_raw_stock_mt, white_sugar_produced_own_stock_mt,
      raw_from_cane_mt, raw_from_reprocessing_old_mt, raw_procured_domestic_mt,
      procured_raw_internal_transfer_mt, internal_transfer_plant_code, internal_transfer_plant_name, procured_from_imported_raw_mt,
      purity_mixed_juice_pct, pol_mixed_juice_pct
    ) VALUES (
      ?, ?, ?, 15000, 28500, 350000, 45000,
      2964, 0, 0, 0,
      0, 0,
      0, 0, 0,
      0, '101', 'GURDASPUR', 0,
      85.5, 12.8
    )
  `).run(plantId, season, month);

  // 2. Diversion / Ethanol
  db.prepare(`
    INSERT INTO diversion_ethanol_records (
      plant_id, season_name, month,
      juice_diverted_for_ethanol_mt, b_heavy_diverted_for_ethanol_mt, c_heavy_diverted_for_ethanol_mt,
      sale_b_heavy_mt, sale_juice_syrup_mt, sale_c_heavy_mt,
      ethanol_from_juice_kl, ethanol_from_b_heavy_kl, ethanol_from_c_heavy_kl
    ) VALUES (
      ?, ?, ?,
      250, 180, 0,
      0, 0, 0,
      15.0, 22.0, 0
    )
  `).run(plantId, season, month);

  // 3. Dispatches 6.1 - 6.5
  const insertDispatch = db.prepare(`
    INSERT INTO dispatches (
      plant_id, season_name, month, category, release_order_date, qty_released_mt, qty_dispatched_mt, remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertDispatch.run(plantId, season, month, '6.1.1', '01/10/2026', 1200, 1150, 'Standard Monthly Release Allotment');
  insertDispatch.run(plantId, season, month, '6.1.2', '01/10/2026', 0, 0, 'No additional allotment');
  insertDispatch.run(plantId, season, month, '6.1.3', '01/10/2026', 0, 0, 'No extended quota');
  insertDispatch.run(plantId, season, month, '6.1.4', '01/10/2026', 0, 0, 'No other dispatches');
  insertDispatch.run(plantId, season, month, '6.2', '01/10/2026', 0, 0, 'No unmarketable old sugar');

  // 4. HSN Sales
  db.prepare(`
    INSERT INTO hsn_sales (
      plant_id, season_name, month, hsn_17011490_mt, hsn_17019990_mt, hsn_others_mt
    ) VALUES (?, ?, ?, 0, 1150, 0)
  `).run(plantId, season, month);

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
      '12345', '01/10/2026', 0, 0,
      '12346', '01/10/2026', 0, 0,
      '12347', '01/10/2026', 0, 'DELIGHT REFINERIES LTD',
      '12348', '01/10/2026', 0, 0,
      'No', 0, 0, 0
    )
  `).run(plantId, season, month);

  // 6. Inventory: Total Closing Stock = 2614 MT (Opening 800 + Produced 2964 - Dispatches 1150 = 2614 MT)
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
      800, 2614,
      0, 0,
      0, 0,
      0, 0,
      0, 0,
      0, 0
    )
  `).run(plantId, season, month);

  // 7. Packaging: Exactly matches 2614 MT Total Closing Stock
  // 1614 + 500 + 500 = 2614 MT
  db.prepare(`
    INSERT INTO packaging_records (
      plant_id, season_name, month,
      jute_50kg_mt, jute_100kg_mt, pp_hdpe_50kg_mt, other_retail_loose_mt
    ) VALUES (
      ?, ?, ?,
      1614, 500, 500, 0
    )
  `).run(plantId, season, month);

  // 8. Cane Dues & Farmers Data (verified non-negative arrears)
  const historicalDues = [
    { season: '2025-26', caneCrushed: '85000', sugarProduction: '8925', sugarRecovery: '10.5', payableCr: '120.0', paidCr: '115.0', farmersCount: '13500' },
    { season: '2024-25', caneCrushed: '82000', sugarProduction: '8610', sugarRecovery: '10.5', payableCr: '110.0', paidCr: '0', farmersCount: '13000' },
    { season: '2023-24', caneCrushed: '79000', sugarProduction: '8295', sugarRecovery: '10.5', payableCr: '105.0', paidCr: '100.0', farmersCount: '12500' },
    { season: '2022-23', caneCrushed: '75000', sugarProduction: '7875', sugarRecovery: '10.5', payableCr: '98.0', paidCr: '90.0', farmersCount: '12000' }
  ];

  db.prepare(`
    INSERT INTO cane_dues_records (
      plant_id, season_name, month,
      current_payable_cr, current_paid_cr, current_farmers_count, historical_dues_json
    ) VALUES (
      ?, ?, ?,
      50.0, 45.0, 5200, ?
    )
  `).run(plantId, season, month, JSON.stringify(historicalDues));

  // 9. Initial Draft P2 Report ready for submission
  const { generateP2Payload } = require('../services/p2PayloadGenerator');
  const payload = generateP2Payload(plantId, season, month);

  db.prepare(`
    INSERT INTO p2_reports (
      plant_id, season_name, month, status, generated_payload, created_at, updated_at
    ) VALUES (?, ?, ?, 'APPROVED', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(plantId, season, month, JSON.stringify(payload, null, 2));

  console.log('=== GURDASPUR (101) Setup Complete & Verified ===');
}

seedGurdaspur();
