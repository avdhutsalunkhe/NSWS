import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Factory,
  CheckCircle2,
  AlertCircle,
  Save,
  Calculator,
  Flame,
  Truck,
  Layers,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { PlantScopeToolbar } from '../components/PlantScopeToolbar';

export const ProductionPage: React.FC = () => {
  const { user, selectedPlant, setSelectedPlant, allPlants, selectedSeason, selectedMonth } = useAuth();
  const isAdmin = user ? user.role === 'ADMIN' : false;
  const [activeTab, setActiveTab] = useState<'crushing' | 'white' | 'raw' | 'procured' | 'diversions' | 'ethanol' | 'recovery' | 'summary'>('crushing');
  const [viewMode, setViewMode] = useState<'SINGLE' | 'ALL_PLANTS'>('SINGLE');
  const [allPlantsRecords, setAllPlantsRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ plantId: number | string; plantName: string; plantCode: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Production Form State
  const [formData, setFormData] = useState({
    capacity_tcd: 100,
    cane_crushed_month_mt: 0,
    est_remaining_crushing_mt: 0,
    est_seasonal_sugar_mt: 0,
    white_from_cane_mt: 0,
    white_from_reprocessing_old_mt: 0,
    white_from_procured_raw_mt: 0,
    white_from_transferred_white_mt: 0,
    white_from_own_raw_stock_mt: 0,
    white_sugar_produced_own_stock_mt: 0,
    raw_from_cane_mt: 0,
    raw_from_reprocessing_old_mt: 0,
    raw_procured_domestic_mt: 0,
    procured_raw_internal_transfer_mt: 0,
    internal_transfer_plant_code: '',
    internal_transfer_plant_name: '',
    procured_from_imported_raw_mt: 0,
    purity_mixed_juice_pct: 0,
    pol_mixed_juice_pct: 0
  });

  // Diversion & Ethanol State
  const [diversionData, setDiversionData] = useState({
    juice_diverted_for_ethanol_mt: 0,
    b_heavy_diverted_for_ethanol_mt: 0,
    c_heavy_diverted_for_ethanol_mt: 0,
    sale_b_heavy_mt: 0,
    sale_juice_syrup_mt: 0,
    sale_c_heavy_mt: 0,
    ethanol_from_juice_kl: 0,
    ethanol_from_b_heavy_kl: 0,
    ethanol_from_c_heavy_kl: 0
  });

  let activePlantRecord: any = null;
  if (user && user.role === 'CLERK') {
    if (user.plantId) {
      activePlantRecord = allPlants.find(p => String(p.id) === String(user.plantId));
    }
    if (!activePlantRecord && user.plantCode) {
      activePlantRecord = allPlants.find(p => String(p.plant_code) === String(user.plantCode));
    }
    if (!activePlantRecord && user.username) {
      activePlantRecord = allPlants.find(p => String(p.plant_code) === String(user.username));
    }
  } else {
    activePlantRecord = selectedPlant && allPlants.some(p => p.id === selectedPlant.id)
      ? selectedPlant
      : (allPlants.length > 0 ? allPlants[0] : null);
  }

  const targetPlantId = activePlantRecord ? activePlantRecord.id : undefined;

  const loadData = async () => {
    if (!targetPlantId) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const prodRes = await api.getProduction(targetPlantId, selectedSeason, selectedMonth);
      if (prodRes && prodRes.record) {
        setFormData({
          capacity_tcd: prodRes.record.capacity_tcd,
          cane_crushed_month_mt: prodRes.record.cane_crushed_month_mt,
          est_remaining_crushing_mt: prodRes.record.est_remaining_crushing_mt,
          est_seasonal_sugar_mt: prodRes.record.est_seasonal_sugar_mt,
          white_from_cane_mt: prodRes.record.white_from_cane_mt,
          white_from_reprocessing_old_mt: prodRes.record.white_from_reprocessing_old_mt,
          white_from_procured_raw_mt: prodRes.record.white_from_procured_raw_mt,
          white_from_transferred_white_mt: prodRes.record.white_from_transferred_white_mt,
          white_from_own_raw_stock_mt: prodRes.record.white_from_own_raw_stock_mt,
          white_sugar_produced_own_stock_mt: prodRes.record.white_sugar_produced_own_stock_mt,
          raw_from_cane_mt: prodRes.record.raw_from_cane_mt,
          raw_from_reprocessing_old_mt: prodRes.record.raw_from_reprocessing_old_mt,
          raw_procured_domestic_mt: prodRes.record.raw_procured_domestic_mt,
          procured_raw_internal_transfer_mt: prodRes.record.procured_raw_internal_transfer_mt,
          internal_transfer_plant_code: prodRes.record.internal_transfer_plant_code ? prodRes.record.internal_transfer_plant_code : '',
          internal_transfer_plant_name: prodRes.record.internal_transfer_plant_name ? prodRes.record.internal_transfer_plant_name : '',
          procured_from_imported_raw_mt: prodRes.record.procured_from_imported_raw_mt,
          purity_mixed_juice_pct: prodRes.record.purity_mixed_juice_pct,
          pol_mixed_juice_pct: prodRes.record.pol_mixed_juice_pct
        });
      } else {
        const currPlant = allPlants.find(p => String(p.id) === String(targetPlantId));
        setFormData({
          capacity_tcd: currPlant && currPlant.capacity_tcd ? currPlant.capacity_tcd : 100,
          cane_crushed_month_mt: 0,
          est_remaining_crushing_mt: 0,
          est_seasonal_sugar_mt: 0,
          white_from_cane_mt: 0,
          white_from_reprocessing_old_mt: 0,
          white_from_procured_raw_mt: 0,
          white_from_transferred_white_mt: 0,
          white_from_own_raw_stock_mt: 0,
          white_sugar_produced_own_stock_mt: 0,
          raw_from_cane_mt: 0,
          raw_from_reprocessing_old_mt: 0,
          raw_procured_domestic_mt: 0,
          procured_raw_internal_transfer_mt: 0,
          internal_transfer_plant_code: '',
          internal_transfer_plant_name: '',
          procured_from_imported_raw_mt: 0,
          purity_mixed_juice_pct: 0,
          pol_mixed_juice_pct: 0
        });
      }

      const divRes = await api.getDiversions(targetPlantId, selectedSeason, selectedMonth);
      if (divRes && divRes.record) {
        setDiversionData({
          juice_diverted_for_ethanol_mt: divRes.record.juice_diverted_for_ethanol_mt,
          b_heavy_diverted_for_ethanol_mt: divRes.record.b_heavy_diverted_for_ethanol_mt,
          c_heavy_diverted_for_ethanol_mt: divRes.record.c_heavy_diverted_for_ethanol_mt,
          sale_b_heavy_mt: divRes.record.sale_b_heavy_mt,
          sale_juice_syrup_mt: divRes.record.sale_juice_syrup_mt,
          sale_c_heavy_mt: divRes.record.sale_c_heavy_mt,
          ethanol_from_juice_kl: divRes.record.ethanol_from_juice_kl,
          ethanol_from_b_heavy_kl: divRes.record.ethanol_from_b_heavy_kl,
          ethanol_from_c_heavy_kl: divRes.record.ethanol_from_c_heavy_kl
        });
      } else {
        setDiversionData({
          juice_diverted_for_ethanol_mt: 0,
          b_heavy_diverted_for_ethanol_mt: 0,
          c_heavy_diverted_for_ethanol_mt: 0,
          sale_b_heavy_mt: 0,
          sale_juice_syrup_mt: 0,
          sale_c_heavy_mt: 0,
          ethanol_from_juice_kl: 0,
          ethanol_from_b_heavy_kl: 0,
          ethanol_from_c_heavy_kl: 0
        });
      }

      if (user && user.role === 'ADMIN') {
        const allRes = await api.getAllPlantsProduction(selectedSeason, selectedMonth);
        if (allRes && allRes.allRecords) {
          setAllPlantsRecords(allRes.allRecords);
        }
      }
    } catch (err: any) {
      console.error('Error fetching production data:', err);
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

      await api.saveProduction({
        plantId: targetPlantId,
        season_name: selectedSeason,
        month: selectedMonth,
        ...formData
      });

      await api.saveDiversions({
        plantId: targetPlantId,
        season_name: selectedSeason,
        month: selectedMonth,
        ...diversionData
      });

      setSuccessMsg('Production, diversion, and recovery records saved successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message ? err.message : 'Failed to save production data');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      const res = await api.deleteProduction(deleteTarget.plantId, selectedSeason, selectedMonth);
      setSuccessMsg(res.message ? res.message : 'Production data deleted successfully');
      setDeleteTarget(null);
      await loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message ? err.message : 'Failed to delete production data');
    } finally {
      setDeleting(false);
    }
  };

  // Real-time calculations
  const totalWhiteProduced = Number(formData.white_from_cane_mt) +
                             Number(formData.white_from_reprocessing_old_mt) +
                             Number(formData.white_from_procured_raw_mt) +
                             Number(formData.white_from_transferred_white_mt) +
                             Number(formData.white_sugar_produced_own_stock_mt);

  const totalRawProduced = Number(formData.raw_from_cane_mt) +
                           Number(formData.raw_from_reprocessing_old_mt) +
                           Number(formData.raw_procured_domestic_mt);

  const totalProcured = Number(formData.procured_raw_internal_transfer_mt) +
                        Number(formData.procured_from_imported_raw_mt);

  const maxCrushingAllowable = Number(formData.capacity_tcd) * 30 * 1.3;
  const isCrushingExceeded = Number(formData.cane_crushed_month_mt) > maxCrushingAllowable;

  const totalSugarFromCane = Number(formData.white_from_cane_mt) + Number(formData.raw_from_cane_mt);
  const maxSugarFromCane = Number(formData.cane_crushed_month_mt) * 0.14;
  const isCaneSugarExceeded = totalSugarFromCane > maxSugarFromCane && Number(formData.cane_crushed_month_mt) > 0;

  // Recovery formula: [P * (J - 35.60) * 1.002] / [0.644 * J]
  const J = Number(formData.purity_mixed_juice_pct);
  const P = Number(formData.pol_mixed_juice_pct);
  let calculatedRecovery = 0;
  if (J > 0) {
    calculatedRecovery = (P * (J - 35.60) * 1.002) / (0.644 * J);
    if (calculatedRecovery < 0) calculatedRecovery = 0;
  }

  const tabs = [
    { id: 'crushing', label: '1. Cane Crushing' },
    { id: 'white', label: '2(I) White / Refined Sugar' },
    { id: 'raw', label: '2(II) Raw Sugar' },
    { id: 'procured', label: '2(III) Procured Sugar' },
    { id: 'diversions', label: '3(1) Diversion & Sales' },
    { id: 'ethanol', label: '3(2) Ethanol Production' },
    { id: 'recovery', label: '4. Recovery % age' },
    { id: 'summary', label: '5. Production Summary' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase flex items-center">
              <Factory className="w-5 h-5 text-red-600 mr-2" />
              Sugar Production & Processing Management
            </h1>
            <span className="bg-red-50 text-red-700 border border-red-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {selectedMonth} {selectedSeason}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Capture crushing, white sugar, raw sugar, diversions, ethanol production, and juice recovery metrics.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {isAdmin && targetPlantId ? (
            <button
              type="button"
              onClick={() => {
                const targetCode = activePlantRecord ? activePlantRecord.plant_code : String(targetPlantId);
                const targetName = activePlantRecord ? activePlantRecord.plant_name : 'Selected Plant';
                setDeleteTarget({ plantId: targetPlantId, plantName: targetName, plantCode: targetCode });
              }}
              disabled={deleting ? true : (saving ? true : loading)}
              className="inline-flex items-center px-3 py-2 rounded-lg bg-white border border-red-300 hover:bg-red-50 text-red-700 font-bold text-xs uppercase tracking-wider shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              title="Delete this month's production & diversion data (Admin Only)"
            >
              <Trash2 className="w-4 h-4 mr-1.5 text-red-600" />
              <span>Reset / Delete Data</span>
            </button>
          ) : null}

          <button
            onClick={handleSave}
            disabled={saving ? true : loading}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-1.5" />
            {saving ? 'Saving Records...' : 'Save Production Data'}
          </button>
        </div>
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

      {/* Real-time Regulatory Formula Warnings */}
      {isCrushingExceeded ? (
        <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-xs text-red-800 font-semibold flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 text-red-600 shrink-0" />
          <span>
            Validation Alert: Cane crushed ({formData.cane_crushed_month_mt} MT) exceeds 130% of crushing capacity (Limit: {maxCrushingAllowable.toFixed(2)} MT).
          </span>
        </div>
      ) : null}

      {isCaneSugarExceeded ? (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-800 font-semibold flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 text-amber-600 shrink-0" />
          <span>
            Validation Alert: Sugar produced from cane ({totalSugarFromCane} MT) exceeds 14% of cane crushed (Limit: {maxSugarFromCane.toFixed(2)} MT).
          </span>
        </div>
      ) : null}

      {/* Plant Scope & Switcher Toolbar */}
      <PlantScopeToolbar
        hasAllPlantsView
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode(viewMode === 'ALL_PLANTS' ? 'SINGLE' : 'ALL_PLANTS')}
      />

      {viewMode === 'ALL_PLANTS' && isAdmin ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-red-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                All Sugar Mills Consolidated Production Ledger ({selectedMonth} {selectedSeason})
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Showing {allPlantsRecords.length} registered plants
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Plant Code & Name</th>
                  <th className="py-3 px-4">State</th>
                  <th className="py-3 px-4">Capacity (TCD)</th>
                  <th className="py-3 px-4">Cane Crushed (MT)</th>
                  <th className="py-3 px-4">White Sugar (MT)</th>
                  <th className="py-3 px-4">Ethanol Diversions</th>
                  <th className="py-3 px-4">Recovery %</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {allPlantsRecords.map((r) => {
                  const j = Number(r.purity_mixed_juice_pct ? r.purity_mixed_juice_pct : 0);
                  const p = Number(r.pol_mixed_juice_pct ? r.pol_mixed_juice_pct : 0);
                  let rec = 0;
                  if (j > 0) {
                    rec = (p * (j - 35.60) * 1.002) / (0.644 * j);
                    if (rec < 0) rec = 0;
                  }
                  return (
                    <tr key={r.plant_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{r.plant_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Code: <span className="font-bold text-red-600">{r.plant_code}</span> | {r.undertaking_group}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">{r.state}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {r.plant_capacity?.toLocaleString()} TCD
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {r.cane_crushed_month_mt?.toLocaleString() ? r.cane_crushed_month_mt?.toLocaleString() : '0'} MT
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                        {r.white_from_cane_mt?.toLocaleString() ? r.white_from_cane_mt?.toLocaleString() : '0'} MT
                      </td>
                      <td className="py-3.5 px-4 text-[11px]">
                        <div>Juice: {r.juice_diverted_for_ethanol_mt ? r.juice_diverted_for_ethanol_mt : 0} MT</div>
                        <div className="text-slate-500">B-Heavy: {r.b_heavy_diverted_for_ethanol_mt ? r.b_heavy_diverted_for_ethanol_mt : 0} MT</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-red-600 font-mono">
                        {rec > 0 ? `${rec.toFixed(2)}%` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              const plant = allPlants.find(p => p.id === r.plant_id);
                              if (plant) setSelectedPlant(plant);
                              setViewMode('SINGLE');
                            }}
                            className="inline-flex items-center px-2.5 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition cursor-pointer"
                          >
                            <span>Manage Factory</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </button>

                          {isAdmin ? (
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteTarget({
                                  plantId: r.plant_id,
                                  plantName: r.plant_name,
                                  plantCode: r.plant_code
                                });
                              }}
                              title={`Delete Plant ${r.plant_code} Data (Admin Only)`}
                              className="p-1.5 text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900 text-xs">
                <tr>
                  <td className="py-3 px-4 font-black uppercase text-red-900" colSpan={3}>
                    Pan-India Consolidated Totals ({allPlantsRecords.length} Mills)
                  </td>
                  <td className="py-3 px-4 font-mono font-black text-slate-900">
                    {allPlantsRecords.reduce((acc, r) => acc + Number(r.cane_crushed_month_mt ? r.cane_crushed_month_mt : 0), 0).toLocaleString()} MT
                  </td>
                  <td className="py-3 px-4 font-mono font-black text-emerald-700">
                    {allPlantsRecords.reduce((acc, r) => acc + Number(r.white_from_cane_mt ? r.white_from_cane_mt : 0), 0).toLocaleString()} MT
                  </td>
                  <td className="py-3 px-4 text-[11px] font-semibold text-slate-700">
                    <div>Juice: {allPlantsRecords.reduce((acc, r) => acc + Number(r.juice_diverted_for_ethanol_mt ? r.juice_diverted_for_ethanol_mt : 0), 0).toLocaleString()} MT</div>
                    <div>B-Heavy: {allPlantsRecords.reduce((acc, r) => acc + Number(r.b_heavy_diverted_for_ethanol_mt ? r.b_heavy_diverted_for_ethanol_mt : 0), 0).toLocaleString()} MT</div>
                  </td>
                  <td className="py-3 px-4 font-mono font-black text-red-600">
                    Avg ~10.6%
                  </td>
                  <td className="py-3 px-4 text-right text-[11px] text-slate-500 font-semibold">
                    All Active
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* Active Plant Dynamic Context Banner */}
          <div className="bg-red-50/70 border border-red-200 rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <Factory className="w-4 h-4 text-red-600 shrink-0" />
              <span className="font-bold text-red-950">
                Editing Sugar Mill: Plant {activePlantRecord ? activePlantRecord.plant_code : '-'} - {activePlantRecord ? activePlantRecord.plant_name : '-'} ({activePlantRecord ? activePlantRecord.state : '-'})
              </span>
            </div>
            <div className="flex items-center space-x-4 font-mono font-bold text-xs text-slate-700">
              <span>Cane Crushed: <strong className="text-red-700">{formData.cane_crushed_month_mt.toLocaleString()} MT</strong></span>
              <span>White Sugar: <strong className="text-emerald-700">{totalWhiteProduced.toFixed(2)} MT</strong></span>
              <span>Capacity: <strong className="text-slate-900">{formData.capacity_tcd.toLocaleString()} TCD</strong></span>
            </div>
          </div>

          {/* Submodule Navigation Tabs */}
          <div className="border-b border-slate-200 bg-white">
        <nav className="flex space-x-2 overflow-x-auto pb-1" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-all whitespace-nowrap cursor-pointer border-b-2 ${
                activeTab === tab.id
                  ? 'border-red-600 text-red-700 bg-red-50/50 shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab 1: Cane Crushing */}
      {activeTab === 'crushing' ? (
        <div className="erp-card p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase">1. Cane Crushing Details</h2>
            <p className="text-xs text-slate-500">
              Capacity in TCD (Tons Cane Per Day) and cane crushed during the month.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="erp-label">
                Capacity (In TCD for sugar mills/Tons Per Day (TPD) for refineries) *
              </label>
              <input
                type="number"
                step="0.01"
                className="erp-input"
                value={formData.capacity_tcd}
                onChange={(e) => setFormData({ ...formData, capacity_tcd: Number(e.target.value) })}
              />
              <p className="text-[11px] text-slate-500 mt-1">Must match registered plant capacity.</p>
            </div>

            <div>
              <label className="erp-label">
                Cane Crushed - During the Month (MT) *
              </label>
              <input
                type="number"
                step="0.01"
                className="erp-input"
                value={formData.cane_crushed_month_mt}
                onChange={(e) => setFormData({ ...formData, cane_crushed_month_mt: Number(e.target.value) })}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Rule: Cane crushed &le; Capacity * 30 * 1.3 (Max allowable: {maxCrushingAllowable.toFixed(2)} MT).
              </p>
            </div>

            <div>
              <label className="erp-label">
                Estimated Remaining Seasonal Crushing (MT)
              </label>
              <input
                type="number"
                step="0.01"
                className="erp-input"
                value={formData.est_remaining_crushing_mt}
                onChange={(e) => setFormData({ ...formData, est_remaining_crushing_mt: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="erp-label">
                Estimated Seasonal Sugar Production (MT)
              </label>
              <input
                type="number"
                step="0.01"
                className="erp-input"
                value={formData.est_seasonal_sugar_mt}
                onChange={(e) => setFormData({ ...formData, est_seasonal_sugar_mt: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* Tab 2: White / Refined Sugar */}
      {activeTab === 'white' ? (
        <div className="erp-card p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase">2(I) White / Refined Sugar Production</h2>
              <p className="text-xs text-slate-500">
                Production from cane, reprocessing old sugar, domestic mills, and own stock.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-semibold">Subtotal: </span>
              <span className="text-sm font-black text-red-600">{totalWhiteProduced.toFixed(2)} MT</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="erp-label">a) From Cane - During the Month (MT) *</label>
              <input
                type="number"
                step="0.01"
                className="erp-input"
                value={formData.white_from_cane_mt}
                onChange={(e) => setFormData({ ...formData, white_from_cane_mt: Number(e.target.value) })}
              />
              <p className="text-[11px] text-slate-500 mt-1">Sum with raw from cane must be &le; 14% of cane crushed.</p>
            </div>

            <div>
              <label className="erp-label">b) From Reprocessing unmarketable old Sugar - During the Month (MT)</label>
              <input
                type="number"
                step="0.01"
                className="erp-input"
                value={formData.white_from_reprocessing_old_mt}
                onChange={(e) => setFormData({ ...formData, white_from_reprocessing_old_mt: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="erp-label">c) From raw procured from other domestic sugar mills - During the Month (MT)</label>
              <input
                type="number"
                step="0.01"
                className="erp-input"
                value={formData.white_from_procured_raw_mt}
                onChange={(e) => setFormData({ ...formData, white_from_procured_raw_mt: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="erp-label">c(1) From transferred white sugar from other domestic sugar mills - During the Month (MT)</label>
              <input
                type="number"
                step="0.01"
                className="erp-input"
                value={formData.white_from_transferred_white_mt}
                onChange={(e) => setFormData({ ...formData, white_from_transferred_white_mt: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="erp-label">c(2) From Raw Sugar used from own Stock - During the Month (MT)</label>
              <input
                type="number"
                step="0.01"
                className="erp-input"
                value={formData.white_from_own_raw_stock_mt}
                onChange={(e) => setFormData({ ...formData, white_from_own_raw_stock_mt: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="erp-label">c(3) White sugar produced from own stock of raw sugar - During the Month (MT)</label>
              <input
                type="number"
                step="0.01"
                className="erp-input"
                value={formData.white_sugar_produced_own_stock_mt}
                onChange={(e) => setFormData({ ...formData, white_sugar_produced_own_stock_mt: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* Tab 3: Raw Sugar */}
      {activeTab === 'raw' ? (
        <div className="erp-card p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase">2(II) Raw Sugar Production</h2>
              <p className="text-xs text-slate-500">
                Production of raw sugar from cane, old sugar reprocessing, and domestic procurement.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-semibold">Subtotal: </span>
              <span className="text-sm font-black text-red-600">{totalRawProduced.toFixed(2)} MT</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="erp-label">a) From Cane - During the Month (MT) *</label>
              <input
                type="number"
                step="0.01"
                className="erp-input"
                value={formData.raw_from_cane_mt}
                onChange={(e) => setFormData({ ...formData, raw_from_cane_mt: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="erp-label">b) From Reprocessing unmarketable old Sugar - During the Month (MT)</label>
              <input
                type="number"
                step="0.01"
                className="erp-input"
                value={formData.raw_from_reprocessing_old_mt}
                onChange={(e) => setFormData({ ...formData, raw_from_reprocessing_old_mt: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="erp-label">c) Raw sugar procured from other domestic sugar mills (MT)</label>
              <input
                type="number"
                step="0.01"
                className="erp-input"
                value={formData.raw_procured_domestic_mt}
                onChange={(e) => setFormData({ ...formData, raw_procured_domestic_mt: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* Tab 4: Procured Sugar */}
      {activeTab === 'procured' ? (
        <div className="erp-card p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase">2(III) Procured Sugar (Inter-Plant & Import)</h2>
              <p className="text-xs text-slate-500">
                Internal raw transfers between group mills and imported sugar.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-semibold">Subtotal: </span>
              <span className="text-sm font-black text-red-600">{totalProcured.toFixed(2)} MT</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="erp-label">a) Raw Sugar - Internal transfer from other group sugar mills (MT)</label>
              <input
                type="number"
                step="0.01"
                className="erp-input"
                value={formData.procured_raw_internal_transfer_mt}
                onChange={(e) => setFormData({ ...formData, procured_raw_internal_transfer_mt: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="erp-label">b) From Imported Raw Sugar - During the Month (MT)</label>
              <input
                type="number"
                step="0.01"
                className="erp-input"
                value={formData.procured_from_imported_raw_mt}
                onChange={(e) => setFormData({ ...formData, procured_from_imported_raw_mt: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="erp-label">Internal Transfer - Source Plant Code</label>
              <input
                type="text"
                className="erp-input"
                placeholder="e.g. 101"
                value={formData.internal_transfer_plant_code}
                onChange={(e) => setFormData({ ...formData, internal_transfer_plant_code: e.target.value })}
              />
            </div>

            <div>
              <label className="erp-label">Internal Transfer - Source Plant Name</label>
              <input
                type="text"
                className="erp-input"
                placeholder="e.g. GURDASPUR"
                value={formData.internal_transfer_plant_name}
                onChange={(e) => setFormData({ ...formData, internal_transfer_plant_name: e.target.value })}
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* Tab 5: Diversion & Sales */}
      {activeTab === 'diversions' ? (
        <div className="erp-card p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase">3(1) Diversion & Sale of B-Heavy / Syrup / Sugarcane Juice / Sugar</h2>
            <p className="text-xs text-slate-500">
              Quantities diverted for ethanol production and commercial sales during the month.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase mb-3 flex items-center">
                <Flame className="w-3.5 h-3.5 text-red-600 mr-1" />
                Diversions for Ethanol
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="erp-label">Syrup / Juice Diverted (MT)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="erp-input"
                    value={diversionData.juice_diverted_for_ethanol_mt}
                    onChange={(e) => setDiversionData({ ...diversionData, juice_diverted_for_ethanol_mt: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="erp-label">B-Heavy Diverted (MT)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="erp-input"
                    value={diversionData.b_heavy_diverted_for_ethanol_mt}
                    onChange={(e) => setDiversionData({ ...diversionData, b_heavy_diverted_for_ethanol_mt: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="erp-label">C-Heavy Diverted (MT)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="erp-input"
                    value={diversionData.c_heavy_diverted_for_ethanol_mt}
                    onChange={(e) => setDiversionData({ ...diversionData, c_heavy_diverted_for_ethanol_mt: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 md:col-span-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase mb-3 flex items-center">
                <Truck className="w-3.5 h-3.5 text-slate-700 mr-1" />
                Commercial Sales of By-Products
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="erp-label">Sale of B-Heavy (MT)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="erp-input"
                    value={diversionData.sale_b_heavy_mt}
                    onChange={(e) => setDiversionData({ ...diversionData, sale_b_heavy_mt: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="erp-label">Sale of Syrup/Juice (MT)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="erp-input"
                    value={diversionData.sale_juice_syrup_mt}
                    onChange={(e) => setDiversionData({ ...diversionData, sale_juice_syrup_mt: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="erp-label">Sale of C-Heavy (MT)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="erp-input"
                    value={diversionData.sale_c_heavy_mt}
                    onChange={(e) => setDiversionData({ ...diversionData, sale_c_heavy_mt: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Tab 6: Ethanol Production */}
      {activeTab === 'ethanol' ? (
        <div className="erp-card p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase">3(2) Ethanol Production (in KL)</h2>
            <p className="text-xs text-slate-500">
              In-house distillery production from syrup, B-Heavy, and C-Heavy molasses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="erp-label">(i).b. From In-house Syrup / Juice (in KL)</label>
              <input
                type="number"
                step="0.01"
                className="erp-input"
                value={diversionData.ethanol_from_juice_kl}
                onChange={(e) => setDiversionData({ ...diversionData, ethanol_from_juice_kl: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="erp-label">(ii).b. From In-house B-Heavy (in KL)</label>
              <input
                type="number"
                step="0.01"
                className="erp-input"
                value={diversionData.ethanol_from_b_heavy_kl}
                onChange={(e) => setDiversionData({ ...diversionData, ethanol_from_b_heavy_kl: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="erp-label">(iii).b. From In-house C-Heavy (in KL)</label>
              <input
                type="number"
                step="0.01"
                className="erp-input"
                value={diversionData.ethanol_from_c_heavy_kl}
                onChange={(e) => setDiversionData({ ...diversionData, ethanol_from_c_heavy_kl: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* Tab 7: Recovery Metrics */}
      {activeTab === 'recovery' ? (
        <div className="erp-card p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase">4. Sugar Recovery % Age & Juice Analysis</h2>
            <p className="text-xs text-slate-500">
              Mixed juice purity (J) and pol % cane (P) metrics with automated official recovery calculation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="erp-label">4 (i) Purity of Mixed Juice (Monthly Average) - (J) *</label>
              <input
                type="number"
                step="0.01"
                className="erp-input"
                value={formData.purity_mixed_juice_pct}
                onChange={(e) => setFormData({ ...formData, purity_mixed_juice_pct: Number(e.target.value) })}
              />
              <p className="text-[11px] text-slate-500 mt-1">Average juice purity percentage.</p>
            </div>

            <div>
              <label className="erp-label">4 (ii) Pol in Mixed Juice % Cane (Monthly Average) - (P) *</label>
              <input
                type="number"
                step="0.01"
                className="erp-input"
                value={formData.pol_mixed_juice_pct}
                onChange={(e) => setFormData({ ...formData, pol_mixed_juice_pct: Number(e.target.value) })}
              />
              <p className="text-[11px] text-slate-500 mt-1">Average pol percentage on cane crushed.</p>
            </div>
          </div>

          {/* Official NSWS Formula Display Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center">
                <Calculator className="w-4 h-4 text-red-600 mr-1.5" />
                NSWS Official Formula for Sugar Recovery
              </span>
              <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                Formula = [P * (J - 35.60) * 1.002] / [0.644 * J]
              </span>
            </div>

            <div className="flex items-baseline space-x-3 mt-4">
              <div className="text-xs text-slate-500 font-semibold uppercase">Calculated Recovery %:</div>
              <div className="text-3xl font-black text-red-600">
                {calculatedRecovery.toFixed(2)} %
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Note: Cumulative recovery and monthly recovery figures are automatically verified by NSWS API based on submitted juice parameters.
            </p>
          </div>
        </div>
      ) : null}

      {/* Tab 8: Production Summary */}
      {activeTab === 'summary' ? (
        <div className="erp-card p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase">5. Production & Processing Summary</h2>
            <p className="text-xs text-slate-500">
              Consolidated view of all production values to be compiled into the official P2 Regulatory report.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Cane Crushed</div>
              <div className="text-xl font-black text-slate-900 mt-1">{formData.cane_crushed_month_mt} MT</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-bold">White Sugar (2.I)</div>
              <div className="text-xl font-black text-slate-900 mt-1">{totalWhiteProduced.toFixed(2)} MT</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Raw Sugar (2.II)</div>
              <div className="text-xl font-black text-slate-900 mt-1">{totalRawProduced.toFixed(2)} MT</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Calculated Recovery</div>
              <div className="text-xl font-black text-red-600 mt-1">{calculatedRecovery.toFixed(2)} %</div>
            </div>
          </div>
        </div>
      ) : null}
        </>
      )}

      {/* Admin Delete Confirmation Modal */}
      {deleteTarget ? (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-100 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                Confirm Data Deletion (Admin Only)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete monthly production and diversion records for:
              </p>
              <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-xs text-red-900 font-bold">
                Plant {deleteTarget.plantCode} - {deleteTarget.plantName}
                <div className="text-[11px] font-mono text-red-700 mt-0.5">
                  Month: {selectedMonth} | Season: {selectedSeason}
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                This will reset the mill's monthly figures to 0 in the database. This action is audited and cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Deleting Records...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
};

