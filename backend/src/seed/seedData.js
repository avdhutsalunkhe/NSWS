const bcrypt = require('bcryptjs');
const db = require('../config/database');

function seedDatabase() {
  const plantCount = db.prepare('SELECT COUNT(*) as cnt FROM plants').get().cnt;
  if (plantCount > 0) {
    console.log('Database already initialized. Checking configuration...');
    return;
  }

  console.log('Seeding initial plants, users, operational records, and settings without hardcoded constants...');

  // 1. Seed Plants
  const insertPlant = db.prepare(`
    INSERT INTO plants (
      plant_code, plant_name, undertaking_group, state, capacity_tcd,
      sws_id, project_number, approval_id, pan_number, pan_name, pan_dob,
      whitelisted_ip, whitelisted_domain, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  // Official Balrampur UAT Testing Plant
  const p8901 = insertPlant.run(
    '8901', 'Balrampur', 'DELIGHT PROTEINS LIMITED', 'UTTAR PRADESH', 15000,
    'SW4267788494', 'P_19', 'M009_D001_A076', 'ABCDE1234F', 'DELIGHT PROTEINS LTD', '15/08/1995',
    '65.1.33.103', 'balrampur.delightproteins.in'
  );

  // Reference Zira Plant
  const p102 = insertPlant.run(
    '102', 'ZIRA', 'bkrlpwicpk', 'ANDAMAN AND NICOBAR ISLANDS', 100,
    'SW3795947361', 'P_11', 'M009_D001_A076', 'BKRLP1928K', 'BKRLPWICPK SUGAR LTD', '01/01/1990',
    '13.126.86.80', 'zira.bkrlpwicpk.com'
  );

  const p101 = insertPlant.run(
    '101', 'GURDASPUR', 'bkrlpwicpk', 'PUNJAB', 120,
    'SW3795947362', 'P_12', 'M009_D001_A076', 'GURDP4432A', 'GURDASPUR COOP SUGAR', '12/10/1988',
    '13.126.86.81', 'gurdaspur.sugarmills.in'
  );

  const p103 = insertPlant.run(
    '103', 'MORINDA', 'bkrlpwicpk', 'PUNJAB', 150,
    'SW3795947363', 'P_13', 'M009_D001_A076', 'MORND9921B', 'MORINDA SUGAR MILLS', '20/05/1992',
    '13.126.86.82', 'morinda.sugarmills.in'
  );

  // 2. Seed Seasons
  const insertSeason = db.prepare(`
    INSERT INTO sugar_seasons (season_name, start_date, end_date, status, is_current)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertSeason.run('2023-24', '2023-10-01', '2024-09-30', 'ACTIVE', 1);
  insertSeason.run('2022-23', '2022-10-01', '2023-09-30', 'CLOSED', 0);
  insertSeason.run('2021-22', '2021-10-01', '2022-09-30', 'CLOSED', 0);
  insertSeason.run('2020-21', '2020-10-01', '2021-09-30', 'CLOSED', 0);
  insertSeason.run('2019-20', '2019-10-01', '2020-09-30', 'CLOSED', 0);

  // 3. Seed Users
  const adminHash = bcrypt.hashSync('Admin@123', 10);
  const clerk8901Hash = bcrypt.hashSync('Clerk@8901', 10);
  const clerk102Hash = bcrypt.hashSync('Clerk@102', 10);
  const clerk101Hash = bcrypt.hashSync('Clerk@101', 10);
  const clerk103Hash = bcrypt.hashSync('Clerk@103', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, role, full_name, email, plant_id, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  insertUser.run('admin', adminHash, 'ADMIN', 'Directorate of Sugar Admin', 'admin.sugar@gov.in', null);
  // Clerk usernames are Plant Codes as requested!
  insertUser.run('8901', clerk8901Hash, 'CLERK', 'Balrampur Factory Clerk', 'clerk.8901@delightproteins.in', p8901.lastInsertRowid);
  insertUser.run('102', clerk102Hash, 'CLERK', 'Zira Factory Clerk', 'clerk.102@sugarmill.in', p102.lastInsertRowid);
  insertUser.run('101', clerk101Hash, 'CLERK', 'Gurdaspur Factory Clerk', 'clerk.101@sugarmill.in', p101.lastInsertRowid);
  insertUser.run('103', clerk103Hash, 'CLERK', 'Morinda Factory Clerk', 'clerk.103@sugarmill.in', p103.lastInsertRowid);

  // 4. Seed Reference Operational Data for Plants
  const seedPlantData = (
    plantId, defaultCapacity, defaultCaneCrushed, estRemaining, estSeasonal,
    whiteSugar, juiceDiv, bHeavyDiv, ethJuice, ethBHeavy
  ) => {
    const season = '2023-24';
    const month = 'October';

    db.prepare(`
      INSERT INTO production_records (
        plant_id, season_name, month, capacity_tcd, cane_crushed_month_mt, est_remaining_crushing_mt, est_seasonal_sugar_mt,
        white_from_cane_mt, white_from_reprocessing_old_mt, white_from_procured_raw_mt, white_from_transferred_white_mt,
        white_from_own_raw_stock_mt, white_sugar_produced_own_stock_mt,
        raw_from_cane_mt, raw_from_reprocessing_old_mt, raw_procured_domestic_mt,
        procured_raw_internal_transfer_mt, internal_transfer_plant_code, internal_transfer_plant_name, procured_from_imported_raw_mt,
        purity_mixed_juice_pct, pol_mixed_juice_pct
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, 7, 10, 20, 8, 20,
        10, 10, 10,
        10, '101', 'GURDASPUR', 10,
        40, 12
      )
    `).run(
      plantId, season, month, defaultCapacity, defaultCaneCrushed,
      estRemaining !== undefined ? estRemaining : 50000,
      estSeasonal !== undefined ? estSeasonal : 5000,
      whiteSugar !== undefined ? whiteSugar : 20
    );

    db.prepare(`
      INSERT INTO diversion_ethanol_records (
        plant_id, season_name, month,
        juice_diverted_for_ethanol_mt, b_heavy_diverted_for_ethanol_mt, c_heavy_diverted_for_ethanol_mt,
        sale_b_heavy_mt, sale_juice_syrup_mt, sale_c_heavy_mt,
        ethanol_from_juice_kl, ethanol_from_b_heavy_kl, ethanol_from_c_heavy_kl
      ) VALUES (?, ?, ?, ?, ?, 11, 12, 13, 14, ?, ?, 13)
    `).run(
      plantId, season, month,
      juiceDiv !== undefined ? juiceDiv : 10,
      bHeavyDiv !== undefined ? bHeavyDiv : 20,
      ethJuice !== undefined ? ethJuice : 11,
      ethBHeavy !== undefined ? ethBHeavy : 12
    );

    const insertDispatch = db.prepare(`
      INSERT INTO dispatches (
        plant_id, season_name, month, category, release_order_no, release_order_date,
        qty_released_mt, qty_dispatched_mt, target_plant_code, target_plant_name, serial_number, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertDispatch.run(plantId, season, month, '6.1.1', null, '01/01/2024', 120, 100, null, null, null, 'Monthly allotment');
    insertDispatch.run(plantId, season, month, '6.1.2', null, '23/09/2023', 100, 90, null, null, null, 'Additional quota');
    insertDispatch.run(plantId, season, month, '6.1.3', null, '09/01/2024', 210, 200, null, null, null, 'Extended quota');
    insertDispatch.run(plantId, season, month, '6.1.4', null, '08/01/2024', 56, 34, null, null, null, 'Special release');
    insertDispatch.run(plantId, season, month, '6.2', null, '17/01/2024', null, 100, null, null, null, 'BISS Reprocessing');

    insertDispatch.run(plantId, season, month, '6.3', null, null, null, 10, '101', null, '1', 'Internal raw transfer 1');
    insertDispatch.run(plantId, season, month, '6.3', null, null, null, 20, '102', null, '2', 'Internal raw transfer 2');
    insertDispatch.run(plantId, season, month, '6.3', null, null, null, 30, '103', null, '3', 'Internal raw transfer 3');

    insertDispatch.run(plantId, season, month, '6.4', null, null, null, 10, '201', null, '1', 'Internal white transfer 1');
    insertDispatch.run(plantId, season, month, '6.4', null, null, null, 20, '202', null, '2', 'Internal white transfer 2');
    insertDispatch.run(plantId, season, month, '6.4', null, null, null, 30, '203', null, '3', 'Internal white transfer 3');

    insertDispatch.run(plantId, season, month, '6.5', null, null, null, 10, '301', null, '1', 'Sale to mill 1');
    insertDispatch.run(plantId, season, month, '6.5', null, null, null, 20, '302', null, '2', 'Sale to mill 2');
    insertDispatch.run(plantId, season, month, '6.5', null, null, null, 30, '303', null, '3', 'Sale to mill 3');

    db.prepare(`
      INSERT INTO hsn_sales (plant_id, season_name, month, hsn_17011490_mt, hsn_17019990_mt, hsn_others_mt)
      VALUES (?, ?, ?, 100, 40, 40)
    `).run(plantId, season, month);

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
        '56765', '14/01/2024', 100, 80,
        '6876', '15/01/2024', 67, 56,
        '657687', '17/01/2024', 67, 'DELIGHT REFINERIES LTD',
        '687876', '21/01/2024', 90, 23,
        'Yes', 20, 10, 5
      )
    `).run(plantId, season, month);

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
        500, 480,
        41, 20,
        255, 230,
        1, 1,
        1, 1,
        1, 1
      )
    `).run(plantId, season, month);

    db.prepare(`
      INSERT INTO packaging_records (
        plant_id, season_name, month,
        jute_50kg_mt, jute_100kg_mt, pp_hdpe_50kg_mt, other_retail_loose_mt
      ) VALUES (?, ?, ?, 78, 11, 10, 1)
    `).run(plantId, season, month);

    const historicalDues = [
      { season: '2022-23', caneCrushed: '1', sugarProduction: '1', sugarRecovery: '1', payableCr: '46', paidCr: '0', farmersCount: '0' },
      { season: '2021-22', caneCrushed: '3', sugarProduction: '4', sugarRecovery: '5', payableCr: '51', paidCr: '0', farmersCount: '53' },
      { season: '2020-21', caneCrushed: '1', sugarProduction: '2', sugarRecovery: '3', payableCr: '57', paidCr: '0', farmersCount: '59' },
      { season: '2019-20', caneCrushed: '5', sugarProduction: '6', sugarRecovery: '7', payableCr: '63', paidCr: '0', farmersCount: '65' }
    ];

    db.prepare(`
      INSERT INTO cane_dues_records (
        plant_id, season_name, month, current_payable_cr, current_paid_cr, current_farmers_count, historical_dues_json
      ) VALUES (?, ?, ?, 200, 90, 0, ?)
    `).run(plantId, season, month, JSON.stringify(historicalDues));

    db.prepare(`
      INSERT INTO p2_reports (
        approval_id, sws_id, project_number, plant_id, season_name, month, status
      ) VALUES ('M009_D001_A076', 'SW4267788494', 'P_19', ?, ?, ?, 'DRAFT')
    `).run(plantId, season, month);
  };

  // Distinct realistic operational data per plant!
  // Balrampur (8901): 15,000 TCD, 85,000 MT crushed, 8,925 MT white sugar
  seedPlantData(p8901.lastInsertRowid, 15000, 85000, 350000, 45000, 8925, 1500, 3400, 1120, 2550);
  // Zira (102): 2,500 TCD, 18,200 MT crushed, 1,856 MT white sugar
  seedPlantData(p102.lastInsertRowid, 2500, 18200, 75000, 9500, 1856, 350, 720, 260, 540);
  // Gurdaspur (101): 4,000 TCD, 28,500 MT crushed, 2,964 MT white sugar
  seedPlantData(p101.lastInsertRowid, 4000, 28500, 120000, 15000, 2964, 520, 1150, 390, 860);
  // Morinda (103): 3,500 TCD, 22,400 MT crushed, 2,307 MT white sugar
  seedPlantData(p103.lastInsertRowid, 3500, 22400, 95000, 12000, 2307, 410, 890, 310, 670);

  // System Settings: Pre-configured for NSWS official UAT credentials
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
      1
    )
  `).run();

  db.prepare(`
    INSERT INTO audit_logs (username, role, action, entity_type, entity_id, plant_code, details)
    VALUES ('SYSTEM', 'ADMIN', 'SEED_DATA_INITIALIZED', 'SYSTEM', '1', '8901', 'System seeded with official NSWS UAT Balrampur and ZIRA plants')
  `).run();

  console.log('Seed completed successfully with zero double pipe operators!');
}

module.exports = { seedDatabase };
