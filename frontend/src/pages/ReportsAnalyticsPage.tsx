import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Download,
  FileSpreadsheet,
  TrendingUp,
  Factory,
  Truck,
  IndianRupee,
  RefreshCw
} from 'lucide-react';
import { PlantScopeToolbar } from '../components/PlantScopeToolbar';

export const ReportsAnalyticsPage: React.FC = () => {
  const { selectedPlant, selectedSeason, selectedMonth } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const plantId = selectedPlant ? selectedPlant.id : undefined;
      const res = await api.getDashboardStats(plantId, selectedSeason, selectedMonth);
      setData(res.stats ? res.stats : null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [selectedPlant, selectedSeason, selectedMonth]);

  const handleExportJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sugar_Analytics_${selectedPlant ? selectedPlant.plant_code : 'All'}_${selectedMonth}_${selectedSeason}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!data) return;
    const prod = data.production ? data.production : {};
    const cane = data.caneDues ? data.caneDues : {};
    const stock = data.stock ? data.stock : {};

    const rows = [
      ['Metric', 'Value', 'Unit'],
      ['Plant Code', selectedPlant ? selectedPlant.plant_code : 'All', ''],
      ['Season', selectedSeason, ''],
      ['Month', selectedMonth, ''],
      ['Cane Crushed', prod.cane_crushed_month_mt ? prod.cane_crushed_month_mt : 0, 'MT'],
      ['White Sugar Produced', prod.white_from_cane_mt ? prod.white_from_cane_mt : 0, 'MT'],
      ['Sugar Recovery', `${data.sugarRecoveryPercent ? data.sugarRecoveryPercent : 0}%`, ''],
      ['B-Heavy Molasses Diverted', data.diversions?.b_heavy_diverted_mt ? data.diversions.b_heavy_diverted_mt : 0, 'MT'],
      ['Sugarcane Juice Diverted', data.diversions?.cane_juice_diverted_mt ? data.diversions.cane_juice_diverted_mt : 0, 'MT'],
      ['Total Dispatch', data.totalDispatchMt ? data.totalDispatchMt : 0, 'MT'],
      ['Total White Sugar Stock', (stock.factory_white_closing ? stock.factory_white_closing : 0) + (stock.godown_white_closing ? stock.godown_white_closing : 0), 'MT'],
      ['Cane Price Payable', cane.current_payable_cr ? cane.current_payable_cr : 0, 'Crores'],
      ['Cane Price Paid', cane.current_paid_cr ? cane.current_paid_cr : 0, 'Crores'],
      ['Cane Price Unpaid', (cane.current_payable_cr ? cane.current_payable_cr : 0) - (cane.current_paid_cr ? cane.current_paid_cr : 0), 'Crores'],
      ['Beneficiary Farmers', cane.current_farmers_count ? cane.current_farmers_count : 0, 'Count']
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sugar_Operations_${selectedPlant ? selectedPlant.plant_code : 'All'}_${selectedMonth}_${selectedSeason}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const prod = data?.production ? data.production : {};
  const cane = data?.caneDues ? data.caneDues : {};
  const stock = data?.stock ? data.stock : {};
  const unpaidDues = (cane.current_payable_cr ? cane.current_payable_cr : 0) - (cane.current_paid_cr ? cane.current_paid_cr : 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
              Executive Analytics
            </span>
            <span className="text-xs text-slate-500 font-mono">Consolidated Ledger</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Operational Analytics & Data Export
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational summaries across crushing, ethanol diversions, statutory dispatches, and cane dues.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            disabled={!data}
            className="inline-flex items-center px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Export CSV
          </button>
          <button
            onClick={handleExportJSON}
            disabled={!data}
            className="inline-flex items-center px-3 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Sugar Mill Scope & Switcher */}
      <PlantScopeToolbar />

      {/* Grid of Key Analytical Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Crushing & Recovery */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Cane Crushed</span>
            <Factory className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {prod.cane_crushed_month_mt?.toLocaleString() ? prod.cane_crushed_month_mt?.toLocaleString() : '0'} <span className="text-xs font-normal text-slate-500">MT</span>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            Sugar Recovery: <span className="font-bold text-emerald-600">{data?.sugarRecoveryPercent ? data.sugarRecoveryPercent : '0.00'}%</span>
          </div>
        </div>

        {/* Sugar Production */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>White Sugar</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {prod.white_from_cane_mt?.toLocaleString() ? prod.white_from_cane_mt?.toLocaleString() : '0'} <span className="text-xs font-normal text-slate-500">MT</span>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            Seasonal Est: <span className="font-bold">{prod.est_seasonal_sugar_mt?.toLocaleString() ? prod.est_seasonal_sugar_mt?.toLocaleString() : '0'} MT</span>
          </div>
        </div>

        {/* Dispatches */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Monthly Dispatches</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {data?.totalDispatchMt?.toLocaleString() ? data.totalDispatchMt?.toLocaleString() : '0'} <span className="text-xs font-normal text-slate-500">MT</span>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            Internal Transfers & Free Sale
          </div>
        </div>

        {/* Cane Dues */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Cane Dues Unpaid</span>
            <IndianRupee className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            ₹{unpaidDues >= 0 ? unpaidDues.toFixed(2) : '0.00'} <span className="text-xs font-normal text-slate-500">Cr</span>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            Paid: ₹{cane.current_paid_cr ? cane.current_paid_cr : 0} Cr / ₹{cane.current_payable_cr ? cane.current_payable_cr : 0} Cr
          </div>
        </div>
      </div>

      {/* Comprehensive Operational Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-xs uppercase tracking-wider text-slate-700">
          Statutory Reconciliation Summary ({selectedMonth} {selectedSeason})
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-600 border-b pb-1">
                Ethanol Diversions & By-Products
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">B-Heavy Molasses Diverted:</span>
                  <span className="font-mono font-bold">{data?.diversions?.b_heavy_diverted_mt ? data.diversions.b_heavy_diverted_mt : 0} MT</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Sugarcane Juice Diverted:</span>
                  <span className="font-mono font-bold">{data?.diversions?.cane_juice_diverted_mt ? data.diversions.cane_juice_diverted_mt : 0} MT</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Sugar Sacrifice Equivalent:</span>
                  <span className="font-mono font-bold">{data?.diversions?.sugar_sacrificed_b_heavy_mt ? data.diversions.sugar_sacrificed_b_heavy_mt : 0} MT</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Estimated Ethanol Produced:</span>
                  <span className="font-mono font-bold">{data?.diversions?.ethanol_produced_kl ? data.diversions.ethanol_produced_kl : 0} KL</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-600 border-b pb-1">
                Stock & Packaging Integrity
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Factory White Sugar Closing:</span>
                  <span className="font-mono font-bold">{stock.factory_white_closing ? stock.factory_white_closing : 0} MT</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Godown White Sugar Closing:</span>
                  <span className="font-mono font-bold">{stock.godown_white_closing ? stock.godown_white_closing : 0} MT</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Jute 50kg Bags Packaged:</span>
                  <span className="font-mono font-bold">{data?.packaging?.jute_50kg_mt ? data.packaging.jute_50kg_mt : 0} MT</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">PP / HDPE 50kg Bags Packaged:</span>
                  <span className="font-mono font-bold">{data?.packaging?.pp_hdpe_50kg_mt ? data.packaging.pp_hdpe_50kg_mt : 0} MT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
