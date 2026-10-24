import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Boxes,
  Building,
  Warehouse,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PlantScopeToolbar } from '../components/PlantScopeToolbar';

export const InventoryPage: React.FC = () => {
  const { user, selectedPlant, allPlants, selectedSeason, selectedMonth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    factory_white_opening: 500,
    factory_white_closing: 480,
    factory_biss_opening: 41,
    factory_biss_closing: 20,
    factory_raw_opening: 255,
    factory_raw_closing: 230,
    godown_white_opening: 1,
    godown_white_closing: 1,
    godown_biss_opening: 1,
    godown_biss_closing: 1,
    godown_raw_opening: 1,
    godown_raw_closing: 1
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
      const res = await api.getInventory(targetPlantId, selectedSeason, selectedMonth);
      if (res && res.record) {
        setFormData({
          factory_white_opening: res.record.factory_white_opening,
          factory_white_closing: res.record.factory_white_closing,
          factory_biss_opening: res.record.factory_biss_opening,
          factory_biss_closing: res.record.factory_biss_closing,
          factory_raw_opening: res.record.factory_raw_opening,
          factory_raw_closing: res.record.factory_raw_closing,
          godown_white_opening: res.record.godown_white_opening,
          godown_white_closing: res.record.godown_white_closing,
          godown_biss_opening: res.record.godown_biss_opening,
          godown_biss_closing: res.record.godown_biss_closing,
          godown_raw_opening: res.record.godown_raw_opening,
          godown_raw_closing: res.record.godown_raw_closing
        });
      } else {
        setFormData({
          factory_white_opening: 0,
          factory_white_closing: 0,
          factory_biss_opening: 0,
          factory_biss_closing: 0,
          factory_raw_opening: 0,
          factory_raw_closing: 0,
          godown_white_opening: 0,
          godown_white_closing: 0,
          godown_biss_opening: 0,
          godown_biss_closing: 0,
          godown_raw_opening: 0,
          godown_raw_closing: 0
        });
      }
    } catch (err: any) {
      console.error('Failed to load inventory:', err);
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

      await api.saveInventory({
        plantId: targetPlantId,
        season_name: selectedSeason,
        month: selectedMonth,
        ...formData
      });

      setSuccessMsg('Sugar stock levels saved successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message ? err.message : 'Failed to save inventory stock');
    } finally {
      setSaving(false);
    }
  };

  const totalFactoryClosing = Number(formData.factory_white_closing) +
                             Number(formData.factory_biss_closing) +
                             Number(formData.factory_raw_closing);

  const totalGodownClosing = Number(formData.godown_white_closing) +
                            Number(formData.godown_biss_closing) +
                            Number(formData.godown_raw_closing);

  const grandTotalClosing = totalFactoryClosing + totalGodownClosing;

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase flex items-center">
              <Boxes className="w-5 h-5 text-red-600 mr-2" />
              Sugar Inventory & Stock Management
            </h1>
            <span className="bg-red-50 text-red-700 border border-red-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {selectedMonth} {selectedSeason}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Section 8: Opening and closing stock levels across Factory Premises and Outside Godowns (Duty-Paid).
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving ? true : loading}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-1.5" />
          {saving ? 'Saving...' : 'Save Stock Levels'}
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

      {/* Stock Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-xs text-slate-500 font-bold uppercase">Factory Premises Closing</span>
          <div className="text-xl font-black text-slate-900 mt-1">
            {totalFactoryClosing.toFixed(2)} <span className="text-xs font-semibold text-slate-500">MT</span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-xs text-slate-500 font-bold uppercase">Outside Godown Closing</span>
          <div className="text-xl font-black text-slate-900 mt-1">
            {totalGodownClosing.toFixed(2)} <span className="text-xs font-semibold text-slate-500">MT</span>
          </div>
        </div>

        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <span className="text-xs text-red-700 font-bold uppercase">Total Closing Stock (Section 8)</span>
          <div className="text-xl font-black text-red-700 mt-1">
            {grandTotalClosing.toFixed(2)} <span className="text-xs font-semibold text-red-600">MT</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Factory Premises Stock Card */}
        <div className="erp-card p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center space-x-2">
            <Building className="w-4 h-4 text-red-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase">
              Factory Premises Stock (MT)
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase block mb-2">
                White / Refined Sugar
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="erp-label">Opening Stock (MT) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="erp-input"
                    value={formData.factory_white_opening}
                    onChange={(e) => setFormData({ ...formData, factory_white_opening: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="erp-label">Closing Stock (MT)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="erp-input"
                    value={formData.factory_white_closing}
                    onChange={(e) => setFormData({ ...formData, factory_white_closing: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase block mb-2">
                BISS / Brown Sugar, If Any
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="erp-label">Opening Stock (MT) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="erp-input"
                    value={formData.factory_biss_opening}
                    onChange={(e) => setFormData({ ...formData, factory_biss_opening: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="erp-label">Closing Stock (MT) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="erp-input"
                    value={formData.factory_biss_closing}
                    onChange={(e) => setFormData({ ...formData, factory_biss_closing: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase block mb-2">
                Raw Sugar
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="erp-label">Opening Stock (MT) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="erp-input"
                    value={formData.factory_raw_opening}
                    onChange={(e) => setFormData({ ...formData, factory_raw_opening: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="erp-label">Closing Stock (MT)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="erp-input"
                    value={formData.factory_raw_closing}
                    onChange={(e) => setFormData({ ...formData, factory_raw_closing: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Outside Godown Stock Card */}
        <div className="erp-card p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center space-x-2">
            <Warehouse className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase">
              Outside Godown Stock (Duty Paid) (MT)
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase block mb-2">
                White / Refined Sugar
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="erp-label">Opening Stock (MT) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="erp-input"
                    value={formData.godown_white_opening}
                    onChange={(e) => setFormData({ ...formData, godown_white_opening: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="erp-label">Closing Stock (MT) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="erp-input"
                    value={formData.godown_white_closing}
                    onChange={(e) => setFormData({ ...formData, godown_white_closing: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase block mb-2">
                BISS / Brown Sugar, If Any
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="erp-label">Opening Stock (MT) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="erp-input"
                    value={formData.godown_biss_opening}
                    onChange={(e) => setFormData({ ...formData, godown_biss_opening: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="erp-label">Closing Stock (MT) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="erp-input"
                    value={formData.godown_biss_closing}
                    onChange={(e) => setFormData({ ...formData, godown_biss_closing: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase block mb-2">
                Raw Sugar
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="erp-label">Opening Stock (MT) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="erp-input"
                    value={formData.godown_raw_opening}
                    onChange={(e) => setFormData({ ...formData, godown_raw_opening: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="erp-label">Closing Stock (MT) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="erp-input"
                    value={formData.godown_raw_closing}
                    onChange={(e) => setFormData({ ...formData, godown_raw_closing: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
