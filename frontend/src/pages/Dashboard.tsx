import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import {
  Factory,
  Boxes,
  Truck,
  IndianRupee,
  FileCheck2,
  TrendingUp,
  Percent,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Clock
} from 'lucide-react';
import { PlantScopeToolbar } from '../components/PlantScopeToolbar';

export const Dashboard: React.FC = () => {
  const { user, selectedPlant, allPlants, selectedSeason, selectedMonth } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  let activePlant = null;
  if (user && user.role === 'CLERK') {
    if (user.plantId) {
      activePlant = allPlants.find(p => String(p.id) === String(user.plantId));
    }
    if (!activePlant && user.plantCode) {
      activePlant = allPlants.find(p => String(p.plant_code) === String(user.plantCode));
    }
    if (!activePlant && user.username) {
      activePlant = allPlants.find(p => String(p.plant_code) === String(user.username));
    }
  } else {
    activePlant = selectedPlant && allPlants.some(p => p.id === selectedPlant.id)
      ? selectedPlant
      : (allPlants.length > 0 ? allPlants[0] : null);
  }

  const targetPlantId = activePlant ? activePlant.id : undefined;

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats(targetPlantId, selectedSeason, selectedMonth);
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [targetPlantId, selectedSeason, selectedMonth, user]);

  const kpis = stats && stats.kpis ? stats.kpis : {
    caneCrushedMt: 0,
    whiteSugarMt: 0,
    rawSugarMt: 0,
    totalSugarMt: 0,
    sugarRecoveryPct: 0,
    domesticDispatchMt: 0,
    exportDispatchMt: 0,
    closingStockMt: 0,
    canePricePayableCr: 0,
    canePricePaidCr: 0,
    canePriceArrearsCr: 0,
    farmersCount: 0
  };

  const recentActivity = stats && stats.recentActivity ? stats.recentActivity : [];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              {user && user.role === 'ADMIN' ? 'Executive ERP & Regulatory Dashboard' : 'Factory Operational Dashboard'}
            </h1>
            <span className="bg-red-50 text-red-700 border border-red-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {selectedMonth} {selectedSeason}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {user && user.role === 'ADMIN'
              ? (selectedPlant ? `Viewing Sugar Mill: ${selectedPlant.plant_name} (Code: ${selectedPlant.plant_code})` : 'Consolidated view across all registered mills')
              : `Factory: ${user ? user.plantName : ''} (Plant Code: ${user ? user.plantCode : ''})`}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-red-600' : ''}`} />
            Refresh
          </button>

          <Link
            to="/regulatory/p2-reports"
            className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer uppercase tracking-wider"
          >
            <FileCheck2 className="w-3.5 h-3.5 mr-1.5" />
            Monthly P2 Report
          </Link>
        </div>
      </div>

      {/* Sugar Mill Scope & Switcher */}
      <PlantScopeToolbar />

      {/* 8 Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Cane Crushed */}
        <div className="erp-card p-4 border-l-4 border-l-red-600">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-1">
            <span>Cane Crushed</span>
            <Factory className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {kpis.caneCrushedMt.toLocaleString()} <span className="text-xs font-semibold text-slate-500">MT</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Month: {selectedMonth}</span>
            <span className="text-emerald-600 font-semibold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> Active
            </span>
          </div>
        </div>

        {/* Sugar Production */}
        <div className="erp-card p-4 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-1">
            <span>Sugar Production</span>
            <Boxes className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {kpis.totalSugarMt.toLocaleString()} <span className="text-xs font-semibold text-slate-500">MT</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>White: {kpis.whiteSugarMt} MT</span>
            <span>Raw: {kpis.rawSugarMt} MT</span>
          </div>
        </div>

        {/* Sugar Recovery */}
        <div className="erp-card p-4 border-l-4 border-l-slate-700">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-1">
            <span>Sugar Recovery</span>
            <Percent className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {kpis.sugarRecoveryPct} <span className="text-xs font-semibold text-slate-500">%</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Official formula: [P * (J - 35.60) * 1.002] / [0.644 * J]
          </div>
        </div>

        {/* Closing Stock */}
        <div className="erp-card p-4 border-l-4 border-l-slate-800">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-1">
            <span>Closing Sugar Stock</span>
            <Boxes className="w-4 h-4 text-slate-800" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {kpis.closingStockMt.toLocaleString()} <span className="text-xs font-semibold text-slate-500">MT</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Factory Premises & Outside Godown
          </div>
        </div>

        {/* Domestic Dispatches */}
        <div className="erp-card p-4 border-l-4 border-l-red-600">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-1">
            <span>Domestic Dispatches</span>
            <Truck className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {kpis.domesticDispatchMt.toLocaleString()} <span className="text-xs font-semibold text-slate-500">MT</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            6.1 to 6.5 Category Dispatches
          </div>
        </div>

        {/* Exports */}
        <div className="erp-card p-4 border-l-4 border-l-slate-600">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-1">
            <span>Export Dispatches</span>
            <Truck className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {kpis.exportDispatchMt.toLocaleString()} <span className="text-xs font-semibold text-slate-500">MT</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            OGL Quota & Refinery Dispatches
          </div>
        </div>

        {/* Cane Dues Paid */}
        <div className="erp-card p-4 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-1">
            <span>Cane Price Paid</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{kpis.canePricePaidCr} <span className="text-xs font-semibold text-slate-500">Cr</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Payable: ₹{kpis.canePricePayableCr} Cr</span>
            <span className="text-emerald-700 font-bold">
              {kpis.canePricePayableCr > 0 ? Math.round((kpis.canePricePaidCr / kpis.canePricePayableCr) * 100) : 0}% Paid
            </span>
          </div>
        </div>

        {/* Cane Dues Arrears */}
        <div className="erp-card p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-1">
            <span>Cane Price Arrears</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{kpis.canePriceArrearsCr} <span className="text-xs font-semibold text-slate-500">Cr</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Farmers: {kpis.farmersCount} procured
          </div>
        </div>

      </div>

      {/* Mid Section: Production Breakdown & Regulatory Submission Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Production & Dispatch Balance Ledger */}
        <div className="lg:col-span-2 erp-card p-5">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                Operational Balance Ledger ({selectedMonth})
              </h2>
              <p className="text-xs text-slate-500">
                Monthly production vs dispatch and stock movements
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
              Unit: Metric Tonnes (MT)
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Cane Crushed: {kpis.caneCrushedMt} MT</span>
                <span className="text-slate-500">100% of seasonal intake</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-red-600 h-2.5 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Total Sugar Produced: {kpis.totalSugarMt} MT</span>
                <span className="text-red-600 font-bold">
                  {kpis.caneCrushedMt > 0 ? ((kpis.totalSugarMt / kpis.caneCrushedMt) * 100).toFixed(2) : 0}% of cane
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-red-500 h-2.5 rounded-full"
                  style={{ width: `${Math.min(100, kpis.caneCrushedMt > 0 ? (kpis.totalSugarMt / kpis.caneCrushedMt) * 500 : 20)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Dispatches & Exports: {kpis.domesticDispatchMt + kpis.exportDispatchMt} MT</span>
                <span className="text-slate-500">
                  {kpis.totalSugarMt > 0 ? Math.round(((kpis.domesticDispatchMt + kpis.exportDispatchMt) / kpis.totalSugarMt) * 100) : 0}% dispatched
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-slate-700 h-2.5 rounded-full"
                  style={{ width: `${Math.min(100, kpis.totalSugarMt > 0 ? ((kpis.domesticDispatchMt + kpis.exportDispatchMt) / kpis.totalSugarMt) * 100 : 30)}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-center">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-bold">White Sugar</div>
                <div className="text-sm font-black text-slate-900 mt-0.5">{kpis.whiteSugarMt} MT</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Raw Sugar</div>
                <div className="text-sm font-black text-slate-900 mt-0.5">{kpis.rawSugarMt} MT</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Stock on Premises</div>
                <div className="text-sm font-black text-slate-900 mt-0.5">{kpis.closingStockMt} MT</div>
              </div>
            </div>
          </div>
        </div>

        {/* P2 Regulatory Compliance Status Widget */}
        <div className="erp-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center">
                <FileCheck2 className="w-4 h-4 text-red-600 mr-1.5" />
                P2 Regulatory Status
              </h2>
              <span className="text-[11px] font-semibold text-slate-500">NSWS v1.3</span>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Official Directorate of Sugar monthly submission status for {selectedMonth} {selectedSeason}.
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <span className="font-semibold text-slate-700">Approval ID:</span>
                <span className="font-mono font-bold text-slate-900">M009_D001_A076</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <span className="font-semibold text-slate-700">Form ID:</span>
                <span className="font-mono font-bold text-slate-900">F01554 (P2 Form)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <span className="font-semibold text-slate-700">Submission Window:</span>
                <span className="font-bold text-emerald-700">Open till 11th of month</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 bg-red-50/40">
              <div className="text-[11px] font-bold text-red-800 uppercase tracking-wide mb-1">
                Workflow Lifecycle:
              </div>
              <div className="text-xs text-slate-600">
                1. Data Entry &rarr; 2. Validation &rarr; 3. Internal Approval &rarr; 4. Push to NSWS
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              to="/regulatory/p2-reports"
              className="w-full flex items-center justify-center py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-colors"
            >
              <span>Manage P2 Form Submissions</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* Bottom Section: Recent Audit Activity */}
      <div className="erp-card p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center">
              <Clock className="w-4 h-4 text-slate-600 mr-2" />
              Recent System Activity & Audit Trail
            </h2>
            <p className="text-xs text-slate-500">
              Verifiable audit trail of operational entries, validations, approvals, and regulatory submissions
            </p>
          </div>
          <Link
            to="/admin/audit-logs"
            className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center"
          >
            <span>View All Logs</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User / Role</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Plant</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-400">
                    No recent audit activity recorded.
                  </td>
                </tr>
              ) : (
                recentActivity.slice(0, 6).map((log: any) => (
                  <tr key={log.id}>
                    <td className="text-xs text-slate-500 font-mono">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="text-xs font-semibold text-slate-900">
                      {log.username} <span className="text-[10px] text-slate-400 uppercase">({log.role})</span>
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="text-xs text-slate-600 font-medium">
                      {log.entity_type}
                    </td>
                    <td className="text-xs font-bold text-slate-700">
                      {log.plant_code ? `Plant ${log.plant_code}` : 'All Plants'}
                    </td>
                    <td className="text-xs text-slate-600 max-w-md truncate">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
