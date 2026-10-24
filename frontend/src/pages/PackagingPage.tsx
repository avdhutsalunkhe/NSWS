import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Package,
  Save,
  CheckCircle2,
  AlertCircle,
  Calculator
} from 'lucide-react';
import { PlantScopeToolbar } from '../components/PlantScopeToolbar';

export const PackagingPage: React.FC = () => {
  const { user, selectedPlant, allPlants, selectedSeason, selectedMonth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    jute_50kg_mt: 78,
    jute_100kg_mt: 11,
    pp_hdpe_50kg_mt: 10,
    other_retail_loose_mt: 1
  });

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
      const res = await api.getPackaging(targetPlantId, selectedSeason, selectedMonth);
      if (res && res.record) {
        setFormData({
          jute_50kg_mt: res.record.jute_50kg_mt,
          jute_100kg_mt: res.record.jute_100kg_mt,
          pp_hdpe_50kg_mt: res.record.pp_hdpe_50kg_mt,
          other_retail_loose_mt: res.record.other_retail_loose_mt
        });
      } else {
        setFormData({
          jute_50kg_mt: 0,
          jute_100kg_mt: 0,
          pp_hdpe_50kg_mt: 0,
          other_retail_loose_mt: 0
        });
      }
    } catch (err: any) {
      console.error('Failed to load packaging:', err);
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

      await api.savePackaging({
        plantId: targetPlantId,
        season_name: selectedSeason,
        month: selectedMonth,
        ...formData
      });

      setSuccessMsg('Packaging details saved successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message ? err.message : 'Failed to save packaging');
    } finally {
      setSaving(false);
    }
  };

  // Calculations
  const totalJute = Number(formData.jute_50kg_mt) + Number(formData.jute_100kg_mt);
  const totalPpHdpe = Number(formData.pp_hdpe_50kg_mt);
  const totalPacked = totalJute + totalPpHdpe + Number(formData.other_retail_loose_mt);

  const jutePct = totalPacked > 0 ? (totalJute / totalPacked) * 100 : 0;
  const ppPct = totalPacked > 0 ? (totalPpHdpe / totalPacked) * 100 : 0;

  // Approximate Bag Counts (1 MT = 1000 kg)
  const count50kgJute = Math.round((Number(formData.jute_50kg_mt) * 1000) / 50);
  const count100kgJute = Math.round((Number(formData.jute_100kg_mt) * 1000) / 100);
  const count50kgPp = Math.round((Number(formData.pp_hdpe_50kg_mt) * 1000) / 50);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase flex items-center">
              <Package className="w-5 h-5 text-red-600 mr-2" />
              Packaging & Bag-Wise Production Management
            </h1>
            <span className="bg-red-50 text-red-700 border border-red-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {selectedMonth} {selectedSeason}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Section 9: Breakup of packed sugar in 50 Kg Jute, 100 Kg Jute, 50 Kg PP/HDPE, and retail/loose sugar in Metric Tonnes (MT).
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving ? true : loading}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-1.5" />
          {saving ? 'Saving...' : 'Save Packaging Breakdown'}
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

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-xs text-slate-500 font-bold uppercase">Total Packed Sugar</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {totalPacked.toFixed(2)} <span className="text-xs font-semibold text-slate-500">MT</span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-xs text-slate-500 font-bold uppercase">Total in Jute Bags</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {totalJute.toFixed(2)} <span className="text-xs font-semibold text-slate-500">MT</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-bold mt-1">
            {jutePct.toFixed(1)}% of total production
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-xs text-slate-500 font-bold uppercase">Total in PP/HDPE Bags</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {totalPpHdpe.toFixed(2)} <span className="text-xs font-semibold text-slate-500">MT</span>
          </div>
          <div className="text-[11px] text-slate-600 font-bold mt-1">
            {ppPct.toFixed(1)}% of total production
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-xs text-slate-500 font-bold uppercase">Retail / Loose Sugar</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formData.other_retail_loose_mt} <span className="text-xs font-semibold text-slate-500">MT</span>
          </div>
        </div>
      </div>

      {/* Packaging Input Grid */}
      <div className="erp-card p-6 space-y-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase pb-2 border-b border-slate-100 flex items-center">
          <Calculator className="w-4 h-4 text-red-600 mr-2" />
          Packaging Category Inputs
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <label className="erp-label">50 Kg Jute Bag - Qty in MT *</label>
            <input
              type="number"
              step="0.01"
              className="erp-input"
              value={formData.jute_50kg_mt}
              onChange={(e) => setFormData({ ...formData, jute_50kg_mt: Number(e.target.value) })}
            />
            <p className="text-[11px] text-slate-500">
              Approximate Bag Count: <strong className="text-slate-800">{count50kgJute.toLocaleString()} bags</strong>
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <label className="erp-label">100 Kg Jute Bag - Qty in MT *</label>
            <input
              type="number"
              step="0.01"
              className="erp-input"
              value={formData.jute_100kg_mt}
              onChange={(e) => setFormData({ ...formData, jute_100kg_mt: Number(e.target.value) })}
            />
            <p className="text-[11px] text-slate-500">
              Approximate Bag Count: <strong className="text-slate-800">{count100kgJute.toLocaleString()} bags</strong>
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <label className="erp-label">50 Kg PP/HDPE Bag - Qty in MT *</label>
            <input
              type="number"
              step="0.01"
              className="erp-input"
              value={formData.pp_hdpe_50kg_mt}
              onChange={(e) => setFormData({ ...formData, pp_hdpe_50kg_mt: Number(e.target.value) })}
            />
            <p className="text-[11px] text-slate-500">
              Approximate Bag Count: <strong className="text-slate-800">{count50kgPp.toLocaleString()} bags</strong>
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <label className="erp-label">Other Retail Bags (&le; 25 Kg and &gt; 100 Kg) / Loose Sugar (MT) *</label>
            <input
              type="number"
              step="0.01"
              className="erp-input"
              value={formData.other_retail_loose_mt}
              onChange={(e) => setFormData({ ...formData, other_retail_loose_mt: Number(e.target.value) })}
            />
            <p className="text-[11px] text-slate-500">
              Includes small retail pouch packaging or bulk loose sugar.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
