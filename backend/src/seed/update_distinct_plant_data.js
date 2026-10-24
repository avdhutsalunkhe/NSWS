const bcrypt = require('bcryptjs');
const db = require('../config/database');

console.log('Ensuring all 5 sugar mills and clerks are registered with distinct datasets...');

const defaultPlants = [
  {
    plant_code: '8901',
    plant_name: 'Balrampur',
    undertaking_group: 'DELIGHT PROTEINS LIMITED',
    state: 'UTTAR PRADESH',
    capacity_tcd: 15000,
    sws_id: 'SW4267788494',
    project_number: 'P_19',
    approval_id: 'M009_D001_A076',
    pan_number: 'ABCDE1234F',
    pan_name: 'DELIGHT PROTEINS LTD',
    pan_dob: '15/08/1995',
    whitelisted_ip: '65.1.33.103',
    whitelisted_domain: 'balrampur.delightproteins.in'
  },
  {
    plant_code: '102',
    plant_name: 'ZIRA',
    undertaking_group: 'bkrlpwicpk',
    state: 'ANDAMAN AND NICOBAR ISLANDS',
    capacity_tcd: 2500,
    sws_id: 'SW3795947361',
    project_number: 'P_11',
    approval_id: 'M009_D001_A076',
    pan_number: 'BKRLP1928K',
    pan_name: 'BKRLPWICPK SUGAR LTD',
    pan_dob: '01/01/1990',
    whitelisted_ip: '13.126.86.80',
    whitelisted_domain: 'zira.bkrlpwicpk.com'
  },
  {
    plant_code: '101',
    plant_name: 'GURDASPUR',
    undertaking_group: 'bkrlpwicpk',
    state: 'PUNJAB',
    capacity_tcd: 4000,
    sws_id: 'SW3795947362',
    project_number: 'P_12',
    approval_id: 'M009_D001_A076',
    pan_number: 'GURDP4432A',
    pan_name: 'GURDASPUR COOP SUGAR',
    pan_dob: '12/10/1988',
    whitelisted_ip: '13.126.86.81',
    whitelisted_domain: 'gurdaspur.sugarmills.in'
  },
  {
    plant_code: '103',
    plant_name: 'MORINDA',
    undertaking_group: 'bkrlpwicpk',
    state: 'PUNJAB',
    capacity_tcd: 3500,
    sws_id: 'SW3795947363',
    project_number: 'P_13',
    approval_id: 'M009_D001_A076',
    pan_number: 'MORND9921B',
    pan_name: 'MORINDA SUGAR MILLS',
    pan_dob: '20/05/1992',
    whitelisted_ip: '13.126.86.82',
    whitelisted_domain: 'morinda.sugarmills.in'
  },
  {
    plant_code: '15501',
    plant_name: 'Unit No. 1 Sakhrale',
    undertaking_group: 'Rajarambapu Patil Sahakari Sakhar Karkhana Ltd.',
    state: 'Maharashtra',
    capacity_tcd: 7000,
    sws_id: 'SW5591028472',
    project_number: 'P_25',
    approval_id: 'M009_D001_A076',
    pan_number: 'RAJAR5512M',
    pan_name: 'RAJARAMBAPU PATIL SAKHAR',
    pan_dob: '05/06/1985',
    whitelisted_ip: '103.24.12.55',
    whitelisted_domain: 'rajaramsugar.com'
  }
];

// 1. Ensure all plants exist
for (const p of defaultPlants) {
  const existing = db.prepare('SELECT id FROM plants WHERE plant_code = ?').get(p.plant_code);
  let pId = null;
  if (!existing) {
    const res = db.prepare(`
      INSERT INTO plants (
        plant_code, plant_name, undertaking_group, state, capacity_tcd,
        sws_id, project_number, approval_id, pan_number, pan_name, pan_dob,
        whitelisted_ip, whitelisted_domain, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      p.plant_code, p.plant_name, p.undertaking_group, p.state, p.capacity_tcd,
      p.sws_id, p.project_number, p.approval_id, p.pan_number, p.pan_name, p.pan_dob,
      p.whitelisted_ip, p.whitelisted_domain
    );
    pId = res.lastInsertRowid;
    console.log(`Inserted Plant ${p.plant_code} (${p.plant_name}) with ID ${pId}`);
  } else {
    pId = existing.id;
    db.prepare('UPDATE plants SET capacity_tcd = ?, plant_name = ?, undertaking_group = ?, state = ? WHERE id = ?')
      .run(p.capacity_tcd, p.plant_name, p.undertaking_group, p.state, pId);
  }

  // Ensure Clerk user exists for this plant
  const existingClerk = db.prepare('SELECT id FROM users WHERE username = ?').get(p.plant_code);
  if (!existingClerk) {
    const hash = bcrypt.hashSync(`Clerk@${p.plant_code}`, 10);
    db.prepare(`
      INSERT INTO users (username, password_hash, role, full_name, email, plant_id, is_active)
      VALUES (?, ?, 'CLERK', ?, ?, ?, 1)
    `).run(p.plant_code, hash, `${p.plant_name} Factory Clerk`, `clerk.${p.plant_code}@sugarmill.in`, pId);
    console.log(`Created Clerk account for Plant ${p.plant_code}`);
  } else {
    db.prepare('UPDATE users SET plant_id = ?, full_name = ? WHERE id = ?')
      .run(pId, `${p.plant_name} Factory Clerk`, existingClerk.id);
  }
}

const plants = db.prepare('SELECT id, plant_code, plant_name, capacity_tcd FROM plants ORDER BY id ASC').all();

const plantConfigs = {
  '8901': {
    capacity: 15000,
    crushed: 85000,
    remaining: 350000,
    estSeasonal: 45000,
    whiteSugar: 8925,
    whiteReprocess: 7,
    whiteProcured: 10,
    whiteTransfer: 20,
    rawCane: 10,
    rawReprocess: 10,
    rawProcured: 10,
    purity: 82.5,
    pol: 12.8,
    juiceDiv: 1500,
    bHeavyDiv: 3400,
    cHeavyDiv: 11,
    saleBHeavy: 12,
    saleJuice: 13,
    saleCHeavy: 14,
    ethJuice: 1120,
    ethBHeavy: 2550,
    ethCHeavy: 13
  },
  '102': {
    capacity: 2500,
    crushed: 18200,
    remaining: 75000,
    estSeasonal: 9500,
    whiteSugar: 1856,
    whiteReprocess: 5,
    whiteProcured: 0,
    whiteTransfer: 10,
    rawCane: 0,
    rawReprocess: 0,
    rawProcured: 5,
    purity: 81.0,
    pol: 12.2,
    juiceDiv: 350,
    bHeavyDiv: 720,
    cHeavyDiv: 8,
    saleBHeavy: 10,
    saleJuice: 5,
    saleCHeavy: 10,
    ethJuice: 260,
    ethBHeavy: 540,
    ethCHeavy: 8
  },
  '101': {
    capacity: 4000,
    crushed: 28500,
    remaining: 120000,
    estSeasonal: 15000,
    whiteSugar: 2964,
    whiteReprocess: 8,
    whiteProcured: 0,
    whiteTransfer: 15,
    rawCane: 0,
    rawReprocess: 0,
    rawProcured: 0,
    purity: 83.0,
    pol: 13.0,
    juiceDiv: 520,
    bHeavyDiv: 1150,
    cHeavyDiv: 12,
    saleBHeavy: 15,
    saleJuice: 8,
    saleCHeavy: 12,
    ethJuice: 390,
    ethBHeavy: 860,
    ethCHeavy: 12
  },
  '103': {
    capacity: 3500,
    crushed: 22400,
    remaining: 95000,
    estSeasonal: 12000,
    whiteSugar: 2307,
    whiteReprocess: 4,
    whiteProcured: 0,
    whiteTransfer: 10,
    rawCane: 0,
    rawReprocess: 0,
    rawProcured: 0,
    purity: 80.5,
    pol: 12.0,
    juiceDiv: 410,
    bHeavyDiv: 890,
    cHeavyDiv: 10,
    saleBHeavy: 10,
    saleJuice: 6,
    saleCHeavy: 10,
    ethJuice: 310,
    ethBHeavy: 670,
    ethCHeavy: 10
  },
  '15501': {
    capacity: 7000,
    crushed: 45000,
    remaining: 180000,
    estSeasonal: 24000,
    whiteSugar: 5100,
    whiteReprocess: 10,
    whiteProcured: 0,
    whiteTransfer: 25,
    rawCane: 0,
    rawReprocess: 0,
    rawProcured: 0,
    purity: 84.0,
    pol: 13.2,
    juiceDiv: 800,
    bHeavyDiv: 1800,
    cHeavyDiv: 15,
    saleBHeavy: 20,
    saleJuice: 10,
    saleCHeavy: 15,
    ethJuice: 600,
    ethBHeavy: 1350,
    ethCHeavy: 15
  }
};

const season = '2023-24';
const month = 'October';

for (const p of plants) {
  const cfg = plantConfigs[p.plant_code] ? plantConfigs[p.plant_code] : {
    capacity: p.capacity_tcd,
    crushed: 10000,
    remaining: 40000,
    estSeasonal: 5000,
    whiteSugar: 1050,
    whiteReprocess: 0,
    whiteProcured: 0,
    whiteTransfer: 0,
    rawCane: 0,
    rawReprocess: 0,
    rawProcured: 0,
    purity: 81.0,
    pol: 12.0,
    juiceDiv: 200,
    bHeavyDiv: 400,
    cHeavyDiv: 5,
    saleBHeavy: 5,
    saleJuice: 5,
    saleCHeavy: 5,
    ethJuice: 150,
    ethBHeavy: 300,
    ethCHeavy: 5
  };

  // Upsert production record
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
      ?, ?, ?, ?,
      8, 20,
      ?, ?, ?,
      10, '101', 'GURDASPUR', 10,
      ?, ?
    )
    ON CONFLICT(plant_id, season_name, month) DO UPDATE SET
      capacity_tcd = excluded.capacity_tcd,
      cane_crushed_month_mt = excluded.cane_crushed_month_mt,
      est_remaining_crushing_mt = excluded.est_remaining_crushing_mt,
      est_seasonal_sugar_mt = excluded.est_seasonal_sugar_mt,
      white_from_cane_mt = excluded.white_from_cane_mt,
      white_from_reprocessing_old_mt = excluded.white_from_reprocessing_old_mt,
      white_from_procured_raw_mt = excluded.white_from_procured_raw_mt,
      white_from_transferred_white_mt = excluded.white_from_transferred_white_mt,
      raw_from_cane_mt = excluded.raw_from_cane_mt,
      raw_from_reprocessing_old_mt = excluded.raw_from_reprocessing_old_mt,
      raw_procured_domestic_mt = excluded.raw_procured_domestic_mt,
      purity_mixed_juice_pct = excluded.purity_mixed_juice_pct,
      pol_mixed_juice_pct = excluded.pol_mixed_juice_pct
  `).run(
    p.id, season, month, cfg.capacity, cfg.crushed, cfg.remaining, cfg.estSeasonal,
    cfg.whiteSugar, cfg.whiteReprocess, cfg.whiteProcured, cfg.whiteTransfer,
    cfg.rawCane, cfg.rawReprocess, cfg.rawProcured,
    cfg.purity, cfg.pol
  );

  // Upsert diversion record
  db.prepare(`
    INSERT INTO diversion_ethanol_records (
      plant_id, season_name, month,
      juice_diverted_for_ethanol_mt, b_heavy_diverted_for_ethanol_mt, c_heavy_diverted_for_ethanol_mt,
      sale_b_heavy_mt, sale_juice_syrup_mt, sale_c_heavy_mt,
      ethanol_from_juice_kl, ethanol_from_b_heavy_kl, ethanol_from_c_heavy_kl
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(plant_id, season_name, month) DO UPDATE SET
      juice_diverted_for_ethanol_mt = excluded.juice_diverted_for_ethanol_mt,
      b_heavy_diverted_for_ethanol_mt = excluded.b_heavy_diverted_for_ethanol_mt,
      c_heavy_diverted_for_ethanol_mt = excluded.c_heavy_diverted_for_ethanol_mt,
      sale_b_heavy_mt = excluded.sale_b_heavy_mt,
      sale_juice_syrup_mt = excluded.sale_juice_syrup_mt,
      sale_c_heavy_mt = excluded.sale_c_heavy_mt,
      ethanol_from_juice_kl = excluded.ethanol_from_juice_kl,
      ethanol_from_b_heavy_kl = excluded.ethanol_from_b_heavy_kl,
      ethanol_from_c_heavy_kl = excluded.ethanol_from_c_heavy_kl
  `).run(
    p.id, season, month,
    cfg.juiceDiv, cfg.bHeavyDiv, cfg.cHeavyDiv,
    cfg.saleBHeavy, cfg.saleJuice, cfg.saleCHeavy,
    cfg.ethJuice, cfg.ethBHeavy, cfg.ethCHeavy
  );

  // Upsert inventory
  const invMap = {
    '8901': { fo: 5200, fc: 4800, bo: 320, bc: 280, ro: 1500, rc: 1350 },
    '102': { fo: 850, fc: 780, bo: 45, bc: 35, ro: 220, rc: 190 },
    '101': { fo: 1400, fc: 1250, bo: 80, bc: 70, ro: 380, rc: 340 },
    '103': { fo: 1100, fc: 980, bo: 65, bc: 55, ro: 310, rc: 270 },
    '15501': { fo: 2800, fc: 2450, bo: 190, bc: 160, ro: 850, rc: 760 }
  };
  const inv = invMap[p.plant_code] ? invMap[p.plant_code] : { fo: 500, fc: 450, bo: 30, bc: 25, ro: 100, rc: 90 };

  db.prepare(`
    INSERT INTO inventory_stock (
      plant_id, season_name, month,
      factory_white_opening, factory_white_closing,
      factory_biss_opening, factory_biss_closing,
      factory_raw_opening, factory_raw_closing,
      godown_white_opening, godown_white_closing,
      godown_biss_opening, godown_biss_closing,
      godown_raw_opening, godown_raw_closing
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 10, 8, 5, 4, 10, 9)
    ON CONFLICT(plant_id, season_name, month) DO UPDATE SET
      factory_white_opening = excluded.factory_white_opening,
      factory_white_closing = excluded.factory_white_closing,
      factory_biss_opening = excluded.factory_biss_opening,
      factory_biss_closing = excluded.factory_biss_closing,
      factory_raw_opening = excluded.factory_raw_opening,
      factory_raw_closing = excluded.factory_raw_closing
  `).run(p.id, season, month, inv.fo, inv.fc, inv.bo, inv.bc, inv.ro, inv.rc);

  // Upsert packaging
  const pkgMap = {
    '8901': { j50: 1200, j100: 450, pp: 320, other: 15 },
    '102': { j50: 180, j100: 60, pp: 40, other: 2 },
    '101': { j50: 310, j100: 95, pp: 75, other: 5 },
    '103': { j50: 240, j100: 80, pp: 55, other: 4 },
    '15501': { j50: 650, j100: 220, pp: 160, other: 10 }
  };
  const pkg = pkgMap[p.plant_code] ? pkgMap[p.plant_code] : { j50: 100, j100: 30, pp: 20, other: 1 };

  db.prepare(`
    INSERT INTO packaging_records (
      plant_id, season_name, month,
      jute_50kg_mt, jute_100kg_mt, pp_hdpe_50kg_mt, other_retail_loose_mt
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(plant_id, season_name, month) DO UPDATE SET
      jute_50kg_mt = excluded.jute_50kg_mt,
      jute_100kg_mt = excluded.jute_100kg_mt,
      pp_hdpe_50kg_mt = excluded.pp_hdpe_50kg_mt,
      other_retail_loose_mt = excluded.other_retail_loose_mt
  `).run(p.id, season, month, pkg.j50, pkg.j100, pkg.pp, pkg.other);

  // Upsert cane dues
  const duesMap = {
    '8901': { payable: 125.5, paid: 110.2, farmers: 14200 },
    '102': { payable: 26.8, paid: 23.4, farmers: 3100 },
    '101': { payable: 42.1, paid: 38.6, farmers: 4950 },
    '103': { payable: 33.4, paid: 29.8, farmers: 3800 },
    '15501': { payable: 68.2, paid: 61.5, farmers: 7600 }
  };
  const due = duesMap[p.plant_code] ? duesMap[p.plant_code] : { payable: 20, paid: 18, farmers: 2000 };

  const hist = [
    { season: '2022-23', caneCrushed: '15000', sugarProduction: '1550', sugarRecovery: '10.3', payableCr: '22', paidCr: '22', farmersCount: '2500' },
    { season: '2021-22', caneCrushed: '14200', sugarProduction: '1460', sugarRecovery: '10.2', payableCr: '20', paidCr: '20', farmersCount: '2400' }
  ];

  db.prepare(`
    INSERT INTO cane_dues_records (
      plant_id, season_name, month,
      current_payable_cr, current_paid_cr, current_farmers_count, historical_dues_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(plant_id, season_name, month) DO UPDATE SET
      current_payable_cr = excluded.current_payable_cr,
      current_paid_cr = excluded.current_paid_cr,
      current_farmers_count = excluded.current_farmers_count,
      historical_dues_json = excluded.historical_dues_json
  `).run(p.id, season, month, due.payable, due.paid, due.farmers, JSON.stringify(hist));

  console.log(`Updated Plant ${p.plant_code} (${p.plant_name}): Crushed=${cfg.crushed} MT, WhiteSugar=${cfg.whiteSugar} MT, Capacity=${cfg.capacity} TCD`);
}

// Link all clerk accounts to their plants
for (const p of plants) {
  db.prepare("UPDATE users SET plant_id = ? WHERE username = ? AND role = 'CLERK'").run(p.id, p.plant_code);
}

console.log('All plant records updated and clerk accounts mapped successfully!');
