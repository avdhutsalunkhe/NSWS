const db = require('../config/database');
const { generateP2Payload, validateP2Data } = require('../services/p2PayloadGenerator');

function populateUATTestData() {
  console.log('--- Populating UAT Test Data for Balrampur (8901) & Zira (102) ---');

  // 1. Upsert Plants
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
    '8901', 'Balrampur', 'DELIGHT PROTEINS LIMITED', 'UTTAR PRADESH', 15000,
    'SW4267788494', 'P_19', 'M009_D001_A076', 'ABCDE1234F', 'DELIGHT PROTEINS LTD', '15/08/1995',
    '65.1.33.103', 'balrampur.delightproteins.in'
  );

  const p102Id = upsertPlant(
    '102', 'ZIRA', 'bkrlpwicpk', 'ANDAMAN AND NICOBAR ISLANDS', 2500,
    'SW3795947361', 'P_11', 'M009_D001_A076', 'BKRLP1928K', 'BKRLPWICPK SUGAR LTD', '01/01/1990',
    '13.126.86.80', 'zira.bkrlpwicpk.com'
  );

  // Link users to their plants
  db.prepare('UPDATE users SET plant_id = ? WHERE username = ?').run(p8901Id, '8901');
  db.prepare('UPDATE users SET plant_id = ? WHERE username = ?').run(p102Id, '102');

  // 2. Ensure System Settings has official NSWS credentials
  const currentSettings = db.prepare('SELECT id FROM system_settings ORDER BY id DESC LIMIT 1').get();
  if (currentSettings) {
    db.prepare(`
      UPDATE system_settings SET
        active_environment = 'UAT',
        uat_url = 'https://uat-nsws-mnstrportal.investindia.gov.in/nsws_license/saveP2Data',
        access_id = 'SaveP2Data',
        access_secret = 'SaveP2Data#0605_NSWS@1252',
        api_key = 'SaveP2Data#0605@AK1161',
        jsession_id = '87C2405550A874E21D02299E47E6A504',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(currentSettings.id);
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
        1
      )
    `).run();
  }

  // 3. Helper to insert operational records
  const insertTestDataForPlant = (plantId, season, month, cap, caneCrushed, whiteSugar, juiceDiv, bHeavyDiv, ethJuice, ethBHeavy) => {
    // Clear existing for this plant/season/month
    db.prepare('DELETE FROM production_records WHERE plant_id = ? AND season_name = ? AND month = ?').run(plantId, season, month);
    db.prepare('DELETE FROM diversion_ethanol_records WHERE plant_id = ? AND season_name = ? AND month = ?').run(plantId, season, month);
    db.prepare('DELETE FROM dispatches WHERE plant_id = ? AND season_name = ? AND month = ?').run(plantId, season, month);
    db.prepare('DELETE FROM hsn_sales WHERE plant_id = ? AND season_name = ? AND month = ?').run(plantId, season, month);
    db.prepare('DELETE FROM imports_exports WHERE plant_id = ? AND season_name = ? AND month = ?').run(plantId, season, month);
    db.prepare('DELETE FROM inventory_stock WHERE plant_id = ? AND season_name = ? AND month = ?').run(plantId, season, month);
    db.prepare('DELETE FROM packaging_records WHERE plant_id = ? AND season_name = ? AND month = ?').run(plantId, season, month);
    db.prepare('DELETE FROM cane_dues_records WHERE plant_id = ? AND season_name = ? AND month = ?').run(plantId, season, month);
    db.prepare('DELETE FROM p2_reports WHERE plant_id = ? AND season_name = ? AND month = ?').run(plantId, season, month);

    // Production
    db.prepare(`
      INSERT INTO production_records (
        plant_id, season_name, month, capacity_tcd, cane_crushed_month_mt, est_remaining_crushing_mt, est_seasonal_sugar_mt,
        white_from_cane_mt, white_from_reprocessing_old_mt, white_from_procured_raw_mt, white_from_transferred_white_mt,
        white_from_own_raw_stock_mt, white_sugar_produced_own_stock_mt,
        raw_from_cane_mt, raw_from_reprocessing_old_mt, raw_procured_domestic_mt,
        procured_raw_internal_transfer_mt, internal_transfer_plant_code, internal_transfer_plant_name, procured_from_imported_raw_mt,
        purity_mixed_juice_pct, pol_mixed_juice_pct
      ) VALUES (
        ?, ?, ?, ?, ?, 350000, 45000,
        ?, 0, 0, 0,
        0, 0,
        0, 0, 0,
        0, '101', 'GURDASPUR', 0,
        82.5, 12.8
      )
    `).run(plantId, season, month, cap, caneCrushed, whiteSugar);

    // Diversions
    db.prepare(`
      INSERT INTO diversion_ethanol_records (
        plant_id, season_name, month,
        juice_diverted_for_ethanol_mt, b_heavy_diverted_for_ethanol_mt, c_heavy_diverted_for_ethanol_mt,
        sale_b_heavy_mt, sale_juice_syrup_mt, sale_c_heavy_mt,
        ethanol_from_juice_kl, ethanol_from_b_heavy_kl, ethanol_from_c_heavy_kl
      ) VALUES (?, ?, ?, ?, ?, 11, 12, 13, 14, ?, ?, 13)
    `).run(plantId, season, month, juiceDiv, bHeavyDiv, ethJuice, ethBHeavy);

    // Dispatches
    const insertDispatch = db.prepare(`
      INSERT INTO dispatches (
        plant_id, season_name, month, category, release_order_no, release_order_date,
        qty_released_mt, qty_dispatched_mt, target_plant_code, target_plant_name, serial_number, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertDispatch.run(plantId, season, month, '6.1.1', 'RO-2023-01', '01/10/2023', 1200, 1000, null, null, null, 'Monthly allotment');
    insertDispatch.run(plantId, season, month, '6.1.2', 'RO-2023-02', '15/10/2023', 1000, 900, null, null, null, 'Additional quota');
    insertDispatch.run(plantId, season, month, '6.1.3', 'RO-2023-03', '20/10/2023', 2100, 2000, null, null, null, 'Extended quota');
    insertDispatch.run(plantId, season, month, '6.1.4', 'RO-2023-04', '25/10/2023', 560, 340, null, null, null, 'Special release');
    insertDispatch.run(plantId, season, month, '6.2', null, '28/10/2023', null, 100, null, null, null, 'BISS Reprocessing');

    insertDispatch.run(plantId, season, month, '6.3', null, null, null, 100, '101', 'GURDASPUR', '1', 'Internal raw transfer 1');
    insertDispatch.run(plantId, season, month, '6.4', null, null, null, 100, '201', 'MILL_201', '1', 'Internal white transfer 1');
    insertDispatch.run(plantId, season, month, '6.5', null, null, null, 100, '301', 'MILL_301', '1', 'Sale to mill 1');

    // HSN Sales
    db.prepare(`
      INSERT INTO hsn_sales (plant_id, season_name, month, hsn_17011490_mt, hsn_17019990_mt, hsn_others_mt)
      VALUES (?, ?, ?, 1000, 400, 400)
    `).run(plantId, season, month);

    // Imports / Exports
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
        'EXP-56765', '14/10/2023', 100, 80,
        'EXP-6876', '15/10/2023', 67, 56,
        'EXP-657687', '17/10/2023', 67, 'DELIGHT REFINERIES LTD',
        'EXP-687876', '21/10/2023', 90, 23,
        'Yes', 20, 10, 5
      )
    `).run(plantId, season, month);

    // Inventory Stock (Closing totals = 500 MT)
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
        500, 400,
        40, 50,
        250, 50,
        0, 0,
        0, 0,
        0, 0
      )
    `).run(plantId, season, month);

    // Packaging Records (Exact 500 MT matching closing stock)
    db.prepare(`
      INSERT INTO packaging_records (
        plant_id, season_name, month,
        jute_50kg_mt, jute_100kg_mt, pp_hdpe_50kg_mt, other_retail_loose_mt
      ) VALUES (?, ?, ?, 200, 100, 150, 50)
    `).run(plantId, season, month);

    // Cane Dues
    const historicalDues = [
      { season: '2022-23', caneCrushed: '1', sugarProduction: '1', sugarRecovery: '1', payableCr: '46', paidCr: '0', farmersCount: '0' },
      { season: '2021-22', caneCrushed: '3', sugarProduction: '4', sugarRecovery: '5', payableCr: '51', paidCr: '0', farmersCount: '53' },
      { season: '2020-21', caneCrushed: '1', sugarProduction: '2', sugarRecovery: '3', payableCr: '57', paidCr: '0', farmersCount: '59' },
      { season: '2019-20', caneCrushed: '5', sugarProduction: '6', sugarRecovery: '7', payableCr: '63', paidCr: '0', farmersCount: '65' }
    ];

    db.prepare(`
      INSERT INTO cane_dues_records (
        plant_id, season_name, month, current_payable_cr, current_paid_cr, current_farmers_count, historical_dues_json
      ) VALUES (?, ?, ?, 200, 90, 450, ?)
    `).run(plantId, season, month, JSON.stringify(historicalDues));

    // Seed Initial P2 Report in DRAFT state
    const plant = db.prepare('SELECT * FROM plants WHERE id = ?').get(plantId);
    const draftRes = db.prepare(`
      INSERT INTO p2_reports (
        approval_id, sws_id, project_number, plant_id, season_name, month, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'DRAFT')
    `).run(plant.approval_id, plant.sws_id, plant.project_number, plantId, season, month);

    // Pre-validate
    const valResult = validateP2Data(plantId, season, month);
    db.prepare(`
      UPDATE p2_reports
      SET validation_errors = ?,
          status = CASE WHEN ? = 1 THEN 'DRAFT' ELSE 'VALIDATION_FAILED' END
      WHERE id = ?
    `).run(JSON.stringify(valResult), valResult.isValid ? 1 : 0, draftRes.lastInsertRowid);

    console.log(`Created test data for Plant ${plant.plant_code} (${season} - ${month}). Valid: ${valResult.isValid}, Completeness: ${valResult.completenessPct}%`);
  };

  // Seed for 2023-24 and 2026-27 for October
  const seasonsToSeed = ['2023-24', '2026-27'];
  for (const s of seasonsToSeed) {
    // Balrampur (8901)
    insertTestDataForPlant(p8901Id, s, 'October', 15000, 85000, 8500, 1500, 3400, 1120, 2550);
    // ZIRA (102)
    insertTestDataForPlant(p102Id, s, 'October', 2500, 18200, 1820, 350, 720, 260, 540);
  }

  console.log('--- Seeding Completed Successfully ---');
}

populateUATTestData();
