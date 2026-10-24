import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { HistoricalDueItem } from '../types';
import {
  IndianRupee,
  Save,
  CheckCircle2,
  AlertCircle,
  Users,
  Calendar,
  History
} from 'lucide-react';
import { PlantScopeToolbar } from '../components/PlantScopeToolbar';

export const CaneDuesPage: React.FC = () => {
  const { user, selectedPlant, allPlants, selectedSeason, selectedMonth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Current Season State
  const [currentPayableCr, setCurrentPayableCr] = useState<number>(200);
  const [currentPaidCr, setCurrentPaidCr] = useState<number>(90);
  const [currentFarmersCount, setCurrentFarmersCount] = useState<number>(0);

  // Historical Seasons State
  const [historicalDues, setHistoricalDues] = useState<HistoricalDueItem[]>([
    { season: '2022-23', caneCrushed: '1', sugarProduction: '1', sugarRecovery: '1', payableCr: '46', paidCr: '0', farmersCount: '0' },
    { season: '2021-22', caneCrushed: '3', sugarProduction: '4', sugarRecovery: '5', payableCr: '51', paidCr: '0', farmersCount: '53' },
    { season: '2020-21', caneCrushed: '1', sugarProduction: '2', sugarRecovery: '3', payableCr: '57', paidCr: '0', farmersCount: '59' },
    { season: '2019-20', caneCrushed: '5', sugarProduction: '6', sugarRecovery: '7', payableCr: '63', paidCr: '0', farmersCount: '65' }
  ]);

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

  const loadData = async () => {
    if (!targetPlantId) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await api.getCaneDues(targetPlantId, selectedSeason, selectedMonth);
      if (res && res.record) {
        setCurrentPayableCr(res.record.current_payable_cr);
        setCurrentPaidCr(res.record.current_paid_cr);
        setCurrentFarmersCount(res.record.current_farmers_count);
      } else {
        setCurrentPayableCr(0);
        setCurrentPaidCr(0);
        setCurrentFarmersCount(0);
      }
      if (res && res.historical && res.historical.length > 0) {
        setHistoricalDues(res.historical);
      }
    } catch (err: any) {
      console.error('Failed to load cane dues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [targetPlantId, selectedSeason, selectedMonth]);

  const handleSave = async () => {
    if (!targetPlantId) return;
    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      await api.saveCaneDues({
        plantId: targetPlantId,
        season_name: selectedSeason,
        month: selectedMonth,
        current_payable_cr: currentPayableCr,
        current_paid_cr: currentPaidCr,
        current_farmers_count: currentFarmersCount,
        historical_dues: historicalDues
      });

      setSuccessMsg('Cane dues and farmer procurement data saved successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message ? err.message : 'Failed to save cane dues');
    } finally {
      setSaving(false);
    }
  };

  const updateHistoricalField = (index: number, field: keyof HistoricalDueItem, value: string) => {
    const updated = [...historicalDues];
    updated[index] = { ...updated[index], [field]: value };
    setHistoricalDues(updated);
  };

  const currentArrears = Math.max(0, currentPayableCr - currentPaidCr);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase flex items-center">
              <IndianRupee className="w-5 h-5 text-red-600 mr-2" />
              Cane Dues & Farmer Payment Management
            </h1>
            <span className="bg-red-50 text-red-700 border border-red-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {selectedMonth} {selectedSeason}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Section 10: Cane price payable, amounts paid, farmers count for current season and historical sugar seasons.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving ? true : loading}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-1.5" />
          {saving ? 'Saving...' : 'Save Cane Dues Data'}
        </button>
      </div>

      {successMsg ? (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      ) : null}

      {errorMsg ? (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      ) : null}

      {/* Sugar Mill Scope & Switcher */}
      <PlantScopeToolbar />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-xs text-slate-500 font-bold uppercase">Cane Price Payable</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₹{currentPayableCr} <span className="text-xs font-semibold text-slate-500">Cr</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">During the month</div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-xs text-slate-500 font-bold uppercase">Cane Price Paid</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            ₹{currentPaidCr} <span className="text-xs font-semibold text-slate-500">Cr</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            {currentPayableCr > 0 ? Math.round((currentPaidCr / currentPayableCr) * 100) : 0}% cleared
          </div>
        </div>

        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <span className="text-xs text-red-700 font-bold uppercase">Estimated Arrears</span>
          <div className="text-2xl font-black text-red-700 mt-1">
            ₹{currentArrears} <span className="text-xs font-semibold text-red-600">Cr</span>
          </div>
          <div className="text-[11px] text-red-600 font-medium mt-1">Pending clearance</div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-xs text-slate-500 font-bold uppercase">Farmers Procured From</span>
          <div className="text-2xl font-black text-slate-900 mt-1 flex items-center">
            <Users className="w-5 h-5 text-slate-600 mr-2" />
            {currentFarmersCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">During the month</div>
        </div>
      </div>

      {/* Current Season Input */}
      <div className="erp-card p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-red-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase">
            Current Sugar Season ({selectedSeason}) Payment Details
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="erp-label">Cane Price Payable (in Rs Cr) - During the Month *</label>
            <input
              type="number"
              step="0.01"
              className="erp-input"
              value={currentPayableCr}
              onChange={(e) => setCurrentPayableCr(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="erp-label">Cane Price Paid (in Rs Cr) - During the Month *</label>
            <input
              type="number"
              step="0.01"
              className="erp-input"
              value={currentPaidCr}
              onChange={(e) => setCurrentPaidCr(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="erp-label">No. of farmers from which cane procured - During the Month</label>
            <input
              type="number"
              className="erp-input"
              value={currentFarmersCount}
              onChange={(e) => setCurrentFarmersCount(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Historical Sugar Seasons Table */}
      <div className="erp-card p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase">
              Historical Sugar Seasons (Past 4 Seasons)
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Mandatory historical metrics for Directorate of Sugar records
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Sugar Season</th>
                <th>Cane Crushed (MT)</th>
                <th>Sugar Production (MT)</th>
                <th>Sugar Recovery (%)</th>
                <th>Payable Season (Rs Cr)</th>
                <th>Paid Month (Rs Cr)</th>
                <th>Farmers Count</th>
              </tr>
            </thead>
            <tbody>
              {historicalDues.map((item, idx) => (
                <tr key={item.season}>
                  <td className="font-bold text-xs text-slate-900 font-mono">
                    {item.season}
                  </td>
                  <td>
                    <input
                      type="text"
                      className="erp-input py-1 px-2 text-xs w-24"
                      value={item.caneCrushed}
                      onChange={(e) => updateHistoricalField(idx, 'caneCrushed', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="erp-input py-1 px-2 text-xs w-24"
                      value={item.sugarProduction}
                      onChange={(e) => updateHistoricalField(idx, 'sugarProduction', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="erp-input py-1 px-2 text-xs w-20"
                      value={item.sugarRecovery}
                      onChange={(e) => updateHistoricalField(idx, 'sugarRecovery', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="erp-input py-1 px-2 text-xs w-24 font-bold"
                      value={item.payableCr}
                      onChange={(e) => updateHistoricalField(idx, 'payableCr', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="erp-input py-1 px-2 text-xs w-24 font-bold text-emerald-700"
                      value={item.paidCr}
                      onChange={(e) => updateHistoricalField(idx, 'paidCr', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="erp-input py-1 px-2 text-xs w-20"
                      value={item.farmersCount}
                      onChange={(e) => updateHistoricalField(idx, 'farmersCount', e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
