import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PlantScopeToolbar } from '../components/PlantScopeToolbar';

export const ImportsExportsPage: React.FC = () => {
  const { user, selectedPlant, allPlants, selectedSeason, selectedMonth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    exp_66a_i_order_no: '56765',
    exp_66a_i_order_date: '14/01/2024',
    exp_66a_i_qty_released: 100,
    exp_66a_i_qty_dispatched: 80,
    exp_66a_ii_order_no: '6876',
    exp_66a_ii_order_date: '15/01/2024',
    exp_66a_ii_qty_released: 67,
    exp_66a_ii_qty_dispatched: 56,
    exp_66a_iii_order_no: '657687',
    exp_66a_iii_order_date: '17/01/2024',
    exp_66a_iii_qty_dispatched: 67,
    exp_66a_iii_buyer_refinery: 'DELIGHT REFINERIES LTD',
    exp_66b_order_no: '687876',
    exp_66b_order_date: '21/01/2024',
    exp_66b_qty_released: 90,
    exp_66b_qty_received: 23,
    import_applicable: 'Yes',
    imp_67a_i_white_mt: 20,
    imp_67a_ii_raw_mt: 10,
    imp_67b_aas_mt: 5
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
      const res = await api.getImportsExports(targetPlantId, selectedSeason, selectedMonth);
      if (res && res.record) {
        setFormData({
          exp_66a_i_order_no: res.record.exp_66a_i_order_no ? res.record.exp_66a_i_order_no : '',
          exp_66a_i_order_date: res.record.exp_66a_i_order_date ? res.record.exp_66a_i_order_date : '',
          exp_66a_i_qty_released: res.record.exp_66a_i_qty_released,
          exp_66a_i_qty_dispatched: res.record.exp_66a_i_qty_dispatched,
          exp_66a_ii_order_no: res.record.exp_66a_ii_order_no ? res.record.exp_66a_ii_order_no : '',
          exp_66a_ii_order_date: res.record.exp_66a_ii_order_date ? res.record.exp_66a_ii_order_date : '',
          exp_66a_ii_qty_released: res.record.exp_66a_ii_qty_released,
          exp_66a_ii_qty_dispatched: res.record.exp_66a_ii_qty_dispatched,
          exp_66a_iii_order_no: res.record.exp_66a_iii_order_no ? res.record.exp_66a_iii_order_no : '',
          exp_66a_iii_order_date: res.record.exp_66a_iii_order_date ? res.record.exp_66a_iii_order_date : '',
          exp_66a_iii_qty_dispatched: res.record.exp_66a_iii_qty_dispatched,
          exp_66a_iii_buyer_refinery: res.record.exp_66a_iii_buyer_refinery ? res.record.exp_66a_iii_buyer_refinery : '',
          exp_66b_order_no: res.record.exp_66b_order_no ? res.record.exp_66b_order_no : '',
          exp_66b_order_date: res.record.exp_66b_order_date ? res.record.exp_66b_order_date : '',
          exp_66b_qty_released: res.record.exp_66b_qty_released,
          exp_66b_qty_received: res.record.exp_66b_qty_received,
          import_applicable: res.record.import_applicable ? res.record.import_applicable : 'Yes',
          imp_67a_i_white_mt: res.record.imp_67a_i_white_mt,
          imp_67a_ii_raw_mt: res.record.imp_67a_ii_raw_mt,
          imp_67b_aas_mt: res.record.imp_67b_aas_mt
        });
      }
    } catch (err: any) {
      console.error('Failed to load imports/exports:', err);
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

      await api.saveImportsExports({
        plantId: targetPlantId,
        season_name: selectedSeason,
        month: selectedMonth,
        ...formData
      });

      setSuccessMsg('Imports and Exports records saved successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message ? err.message : 'Failed to save records');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase flex items-center">
              <ArrowDownToLine className="w-5 h-5 text-red-600 mr-2" />
              Import & Export Regulatory Management
            </h1>
            <span className="bg-red-50 text-red-700 border border-red-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {selectedMonth} {selectedSeason}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Section 6 (Exports) and Section 7 (Imports) under Open General Licence (OGL) & Advance Authorisation Scheme (AAS).
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving ? true : loading}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-1.5" />
          {saving ? 'Saving...' : 'Save Import/Export Data'}
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

      {/* Section 6: Exports */}
      <div className="erp-card p-6 space-y-6">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ArrowUpFromLine className="w-4 h-4 text-red-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase">Section 6: Export Details</h2>
          </div>
          <span className="text-xs font-bold text-slate-500">OGL Quota & AAS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 6.6(a)(i) White/refined Sugar under OGL */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase block">
              6.6 (a) (i) White / Refined Sugar under OGL
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="erp-label">Release Order No.</label>
                <input
                  type="text"
                  className="erp-input"
                  value={formData.exp_66a_i_order_no}
                  onChange={(e) => setFormData({ ...formData, exp_66a_i_order_no: e.target.value })}
                />
              </div>
              <div>
                <label className="erp-label">Order Date</label>
                <input
                  type="text"
                  placeholder="DD/MM/YYYY"
                  className="erp-input"
                  value={formData.exp_66a_i_order_date}
                  onChange={(e) => setFormData({ ...formData, exp_66a_i_order_date: e.target.value })}
                />
              </div>
              <div>
                <label className="erp-label">Qty Released (MT)</label>
                <input
                  type="number"
                  step="0.01"
                  className="erp-input"
                  value={formData.exp_66a_i_qty_released}
                  onChange={(e) => setFormData({ ...formData, exp_66a_i_qty_released: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="erp-label">Qty Dispatched (MT) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="erp-input"
                  value={formData.exp_66a_i_qty_dispatched}
                  onChange={(e) => setFormData({ ...formData, exp_66a_i_qty_dispatched: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {/* 6.6(a)(ii) Raw Sugar under OGL */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase block">
              6.6 (a) (ii) Raw Sugar under OGL (incl. SEZ)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="erp-label">Release Order No.</label>
                <input
                  type="text"
                  className="erp-input"
                  value={formData.exp_66a_ii_order_no}
                  onChange={(e) => setFormData({ ...formData, exp_66a_ii_order_no: e.target.value })}
                />
              </div>
              <div>
                <label className="erp-label">Order Date</label>
                <input
                  type="text"
                  placeholder="DD/MM/YYYY"
                  className="erp-input"
                  value={formData.exp_66a_ii_order_date}
                  onChange={(e) => setFormData({ ...formData, exp_66a_ii_order_date: e.target.value })}
                />
              </div>
              <div>
                <label className="erp-label">Qty Released (MT)</label>
                <input
                  type="number"
                  step="0.01"
                  className="erp-input"
                  value={formData.exp_66a_ii_qty_released}
                  onChange={(e) => setFormData({ ...formData, exp_66a_ii_qty_released: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="erp-label">Qty Dispatched (MT) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="erp-input"
                  value={formData.exp_66a_ii_qty_dispatched}
                  onChange={(e) => setFormData({ ...formData, exp_66a_ii_qty_dispatched: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {/* 6.6(a)(iii) Raw Sugar Sold to Refineries for Export */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase block">
              6.6 (a) (iii) Sold to Refineries for Export
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="erp-label">Release Order No.</label>
                <input
                  type="text"
                  className="erp-input"
                  value={formData.exp_66a_iii_order_no}
                  onChange={(e) => setFormData({ ...formData, exp_66a_iii_order_no: e.target.value })}
                />
              </div>
              <div>
                <label className="erp-label">Order Date</label>
                <input
                  type="text"
                  placeholder="DD/MM/YYYY"
                  className="erp-input"
                  value={formData.exp_66a_iii_order_date}
                  onChange={(e) => setFormData({ ...formData, exp_66a_iii_order_date: e.target.value })}
                />
              </div>
              <div>
                <label className="erp-label">Qty Dispatched (MT) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="erp-input"
                  value={formData.exp_66a_iii_qty_dispatched}
                  onChange={(e) => setFormData({ ...formData, exp_66a_iii_qty_dispatched: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="erp-label">Refinery / Buyer Name</label>
                <input
                  type="text"
                  className="erp-input"
                  value={formData.exp_66a_iii_buyer_refinery}
                  onChange={(e) => setFormData({ ...formData, exp_66a_iii_buyer_refinery: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* 6.6(b) Export under AAS */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase block">
              6.6 (b) Export under AAS (White Sugar)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="erp-label">Export Order No.</label>
                <input
                  type="text"
                  className="erp-input"
                  value={formData.exp_66b_order_no}
                  onChange={(e) => setFormData({ ...formData, exp_66b_order_no: e.target.value })}
                />
              </div>
              <div>
                <label className="erp-label">Order Date</label>
                <input
                  type="text"
                  placeholder="DD/MM/YYYY"
                  className="erp-input"
                  value={formData.exp_66b_order_date}
                  onChange={(e) => setFormData({ ...formData, exp_66b_order_date: e.target.value })}
                />
              </div>
              <div>
                <label className="erp-label">Qty Released</label>
                <input
                  type="number"
                  step="0.01"
                  className="erp-input"
                  value={formData.exp_66b_qty_released}
                  onChange={(e) => setFormData({ ...formData, exp_66b_qty_released: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="erp-label">Qty Received (MT)</label>
                <input
                  type="number"
                  step="0.01"
                  className="erp-input"
                  value={formData.exp_66b_qty_received}
                  onChange={(e) => setFormData({ ...formData, exp_66b_qty_received: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Section 7: Imports */}
      <div className="erp-card p-6 space-y-6">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ArrowDownToLine className="w-4 h-4 text-red-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase">Section 7: Import Details</h2>
          </div>
          
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <span>Is import applicable?</span>
            <select
              aria-label="Is import applicable?"
              className="erp-input py-1 px-2 text-xs"
              value={formData.import_applicable}
              onChange={(e) => setFormData({ ...formData, import_applicable: e.target.value })}
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>

        {formData.import_applicable === 'Yes' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="erp-label">
                6.7 (a) Import under OGL &ndash; (i) White / Refined Sugar (MT)
              </label>
              <input
                type="number"
                step="0.01"
                className="erp-input"
                value={formData.imp_67a_i_white_mt}
                onChange={(e) => setFormData({ ...formData, imp_67a_i_white_mt: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="erp-label">
                6.7 (a) Import under OGL &ndash; (ii) Raw Sugar (MT)
              </label>
              <input
                type="number"
                step="0.01"
                className="erp-input"
                value={formData.imp_67a_ii_raw_mt}
                onChange={(e) => setFormData({ ...formData, imp_67a_ii_raw_mt: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="erp-label">
                6.7 (b) Import under AAS (MT)
              </label>
              <input
                type="number"
                step="0.01"
                className="erp-input"
                value={formData.imp_67b_aas_mt}
                onChange={(e) => setFormData({ ...formData, imp_67b_aas_mt: Number(e.target.value) })}
              />
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">
            Import is marked as Not Applicable for this reporting period.
          </p>
        )}
      </div>

    </div>
  );
};
