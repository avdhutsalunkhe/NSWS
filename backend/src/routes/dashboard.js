const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, enforcePlantAccess } = require('../middleware/auth');

function num(val) {
  if (val !== undefined && val !== null && !isNaN(Number(val))) {
    return Number(val);
  }
  return 0;
}

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, enforcePlantAccess, (req, res) => {
  const plantId = req.targetPlantId;
  const season = req.query.season ? req.query.season : '2023-24';
  const month = req.query.month ? req.query.month : 'October';

  // Overall plant info
  let plants = [];
  if (req.user.role === 'ADMIN') {
    plants = db.prepare('SELECT id, plant_code, plant_name, state, capacity_tcd FROM plants WHERE is_active = 1').all();
  } else {
    plants = db.prepare('SELECT id, plant_code, plant_name, state, capacity_tcd FROM plants WHERE id = ?').all(req.user.plant_id);
  }

  // Target plant query condition
  let plantFilterSql = '';
  const filterParams = [];

  if (plantId) {
    plantFilterSql = ' AND plant_id = ?';
    filterParams.push(plantId);
  } else if (req.user.role === 'CLERK') {
    plantFilterSql = ' AND plant_id = ?';
    filterParams.push(req.user.plant_id);
  }

  // 1. Production metrics
  const prodRow = db.prepare(`
    SELECT
      SUM(cane_crushed_month_mt) as total_cane_crushed,
      SUM(white_from_cane_mt) as total_white_cane,
      SUM(white_from_reprocessing_old_mt) as total_white_reproc,
      SUM(white_from_procured_raw_mt) as total_white_procured,
      SUM(white_sugar_produced_own_stock_mt) as total_white_own_stock,
      SUM(raw_from_cane_mt) as total_raw_cane,
      SUM(raw_from_reprocessing_old_mt) as total_raw_reproc,
      SUM(raw_procured_domestic_mt) as total_raw_procured,
      AVG(purity_mixed_juice_pct) as avg_purity,
      AVG(pol_mixed_juice_pct) as avg_pol
    FROM production_records
    WHERE season_name = ? AND month = ? ${plantFilterSql}
  `).get(season, month, ...filterParams);

  const caneCrushed = num(prodRow ? prodRow.total_cane_crushed : 0);
  const whiteSugar = num(prodRow ? prodRow.total_white_cane : 0) +
                     num(prodRow ? prodRow.total_white_reproc : 0) +
                     num(prodRow ? prodRow.total_white_procured : 0) +
                     num(prodRow ? prodRow.total_white_own_stock : 0);
  const rawSugar = num(prodRow ? prodRow.total_raw_cane : 0) +
                   num(prodRow ? prodRow.total_raw_reproc : 0) +
                   num(prodRow ? prodRow.total_raw_procured : 0);
  const totalSugar = whiteSugar + rawSugar;

  // Recovery formula: [P * (J - 35.60) * 1.002] / [0.644 * J]
  const purity = num(prodRow ? prodRow.avg_purity : 0);
  const pol = num(prodRow ? prodRow.avg_pol : 0);
  let sugarRecovery = 0;
  if (purity > 0) {
    sugarRecovery = (pol * (purity - 35.60) * 1.002) / (0.644 * purity);
    if (sugarRecovery < 0) sugarRecovery = 0;
  }

  // 2. Dispatches
  const dispatchRows = db.prepare(`
    SELECT category, SUM(qty_dispatched_mt) as total_dispatched
    FROM dispatches
    WHERE season_name = ? AND month = ? ${plantFilterSql}
    GROUP BY category
  `).all(season, month, ...filterParams);

  let domesticDispatch = 0;
  dispatchRows.forEach(r => {
    domesticDispatch += num(r.total_dispatched);
  });

  // Exports
  const expRow = db.prepare(`
    SELECT
      SUM(exp_66a_i_qty_dispatched) as exp_white,
      SUM(exp_66a_ii_qty_dispatched) as exp_raw,
      SUM(exp_66a_iii_qty_dispatched) as exp_refinery
    FROM imports_exports
    WHERE season_name = ? AND month = ? ${plantFilterSql}
  `).get(season, month, ...filterParams);

  const exportDispatch = num(expRow ? expRow.exp_white : 0) +
                         num(expRow ? expRow.exp_raw : 0) +
                         num(expRow ? expRow.exp_refinery : 0);

  // 3. Inventory Stock
  const stockRow = db.prepare(`
    SELECT
      SUM(factory_white_closing) as factory_white,
      SUM(factory_biss_closing) as factory_biss,
      SUM(factory_raw_closing) as factory_raw,
      SUM(godown_white_closing) as godown_white,
      SUM(godown_biss_closing) as godown_biss,
      SUM(godown_raw_closing) as godown_raw
    FROM inventory_stock
    WHERE season_name = ? AND month = ? ${plantFilterSql}
  `).get(season, month, ...filterParams);

  const closingStock = num(stockRow ? stockRow.factory_white : 0) +
                       num(stockRow ? stockRow.factory_biss : 0) +
                       num(stockRow ? stockRow.factory_raw : 0) +
                       num(stockRow ? stockRow.godown_white : 0) +
                       num(stockRow ? stockRow.godown_biss : 0) +
                       num(stockRow ? stockRow.godown_raw : 0);

  // 4. Cane Dues
  const duesRow = db.prepare(`
    SELECT
      SUM(current_payable_cr) as payable_cr,
      SUM(current_paid_cr) as paid_cr,
      SUM(current_farmers_count) as farmers
    FROM cane_dues_records
    WHERE season_name = ? AND month = ? ${plantFilterSql}
  `).get(season, month, ...filterParams);

  const payableCr = num(duesRow ? duesRow.payable_cr : 0);
  const paidCr = num(duesRow ? duesRow.paid_cr : 0);
  const arrearsCr = Math.max(0, payableCr - paidCr);

  // 5. Reports status breakdown
  const statusCounts = db.prepare(`
    SELECT status, COUNT(*) as cnt
    FROM p2_reports
    WHERE season_name = ? ${plantFilterSql}
    GROUP BY status
  `).all(season, ...filterParams);

  // 6. Recent Audit Activities
  const recentActivity = db.prepare(`
    SELECT * FROM audit_logs
    ORDER BY id DESC
    LIMIT 10
  `).all();

  res.json({
    kpis: {
      caneCrushedMt: caneCrushed,
      whiteSugarMt: whiteSugar,
      rawSugarMt: rawSugar,
      totalSugarMt: totalSugar,
      sugarRecoveryPct: Number(sugarRecovery.toFixed(2)),
      domesticDispatchMt: domesticDispatch,
      exportDispatchMt: exportDispatch,
      closingStockMt: closingStock,
      canePricePayableCr: payableCr,
      canePricePaidCr: paidCr,
      canePriceArrearsCr: arrearsCr,
      farmersCount: duesRow ? duesRow.farmers : 0
    },
    statusCounts,
    plants,
    recentActivity,
    selectedFilters: {
      season,
      month,
      plantId: plantId ? plantId : null
    }
  });
});

module.exports = router;
