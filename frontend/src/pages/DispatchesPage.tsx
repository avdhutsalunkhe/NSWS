import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { api } from '../services/api';
import type { DispatchItem, HsnSales } from '../types';
import {
  Truck,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { PlantScopeToolbar } from '../components/PlantScopeToolbar';

export const DispatchesPage: React.FC = () => {
  const { user, selectedPlant, allPlants, selectedSeason, selectedMonth } = useAuth();
  const dialog = useDialog();
  const [dispatches, setDispatches] = useState<DispatchItem[]>([]);
  const [hsn, setHsn] = useState<HsnSales>({ hsn_17011490_mt: 100, hsn_17019990_mt: 40, hsn_others_mt: 40 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal for adding repeated transfer (6.3, 6.4, 6.5)
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState<'6.3' | '6.4' | '6.5'>('6.3');
  const [modalPlantCode, setModalPlantCode] = useState('');
  const [modalQty, setModalQty] = useState<number>(0);
  const [modalSerial, setModalSerial] = useState('1');

  // Single category dispatches (6.1.1, 6.1.2, 6.1.3, 6.1.4, 6.2)
  const [d611, setD611] = useState({ date: '01/01/2024', released: 120, dispatched: 100, remarks: 'GHFJHGJHG' });
  const [d612, setD612] = useState({ date: '23/09/2023', released: 100, dispatched: 90, remarks: 'GFBVCV' });
  const [d613, setD613] = useState({ date: '09/01/2024', released: 210, dispatched: 200, remarks: 'UKJHKJHKJ' });
  const [d614, setD614] = useState({ date: '08/01/2024', released: 56, dispatched: 34, remarks: 'HVNVNB' });
  const [d62, setD62] = useState({ date: '17/01/2024', qty: 100 });

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
      const res = await api.getDispatches(targetPlantId, selectedSeason, selectedMonth);
      const list: DispatchItem[] = res && res.dispatches ? res.dispatches : [];
      setDispatches(list);

      if (res && res.hsn) {
        setHsn(res.hsn);
      }

      // Populate single category items
      const f611 = list.find(d => d.category === '6.1.1');
      if (f611) {
        setD611({ date: f611.release_order_date ? f611.release_order_date : '', released: f611.qty_released_mt, dispatched: f611.qty_dispatched_mt, remarks: f611.remarks ? f611.remarks : '' });
      } else {
        setD611({ date: '', released: 0, dispatched: 0, remarks: '' });
      }

      const f612 = list.find(d => d.category === '6.1.2');
      if (f612) {
        setD612({ date: f612.release_order_date ? f612.release_order_date : '', released: f612.qty_released_mt, dispatched: f612.qty_dispatched_mt, remarks: f612.remarks ? f612.remarks : '' });
      } else {
        setD612({ date: '', released: 0, dispatched: 0, remarks: '' });
      }

      const f613 = list.find(d => d.category === '6.1.3');
      if (f613) {
        setD613({ date: f613.release_order_date ? f613.release_order_date : '', released: f613.qty_released_mt, dispatched: f613.qty_dispatched_mt, remarks: f613.remarks ? f613.remarks : '' });
      } else {
        setD613({ date: '', released: 0, dispatched: 0, remarks: '' });
      }

      const f614 = list.find(d => d.category === '6.1.4');
      if (f614) {
        setD614({ date: f614.release_order_date ? f614.release_order_date : '', released: f614.qty_released_mt, dispatched: f614.qty_dispatched_mt, remarks: f614.remarks ? f614.remarks : '' });
      } else {
        setD614({ date: '', released: 0, dispatched: 0, remarks: '' });
      }

      const f62 = list.find(d => d.category === '6.2');
      if (f62) {
        setD62({ date: f62.release_order_date ? f62.release_order_date : '', qty: f62.qty_dispatched_mt });
      } else {
        setD62({ date: '', qty: 0 });
      }

    } catch (err: any) {
      console.error('Failed to load dispatches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [targetPlantId, selectedSeason, selectedMonth]);

  const handleSaveAll = async () => {
    if (!targetPlantId) return;
    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      // Save 6.1.1
      await api.saveDispatch({
        plantId: targetPlantId,
        season_name: selectedSeason,
        month: selectedMonth,
        category: '6.1.1',
        release_order_date: d611.date,
        qty_released_mt: d611.released,
        qty_dispatched_mt: d611.dispatched,
        remarks: d611.remarks
      });

      // Save 6.1.2
      await api.saveDispatch({
        plantId: targetPlantId,
        season_name: selectedSeason,
        month: selectedMonth,
        category: '6.1.2',
        release_order_date: d612.date,
        qty_released_mt: d612.released,
        qty_dispatched_mt: d612.dispatched,
        remarks: d612.remarks
      });

      // Save 6.1.3
      await api.saveDispatch({
        plantId: targetPlantId,
        season_name: selectedSeason,
        month: selectedMonth,
        category: '6.1.3',
        release_order_date: d613.date,
        qty_released_mt: d613.released,
        qty_dispatched_mt: d613.dispatched,
        remarks: d613.remarks
      });

      // Save 6.1.4
      await api.saveDispatch({
        plantId: targetPlantId,
        season_name: selectedSeason,
        month: selectedMonth,
        category: '6.1.4',
        release_order_date: d614.date,
        qty_released_mt: d614.released,
        qty_dispatched_mt: d614.dispatched,
        remarks: d614.remarks
      });

      // Save 6.2
      await api.saveDispatch({
        plantId: targetPlantId,
        season_name: selectedSeason,
        month: selectedMonth,
        category: '6.2',
        release_order_date: d62.date,
        qty_dispatched_mt: d62.qty
      });

      // Save HSN
      await api.saveHsn({
        plantId: targetPlantId,
        season_name: selectedSeason,
        month: selectedMonth,
        ...hsn
      });

      setSuccessMsg('All dispatch quotas and HSN details saved successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message ? err.message : 'Failed to save dispatches');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRepeatedItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPlantId) return;
    try {
      setSaving(true);
      await api.saveDispatch({
        plantId: targetPlantId,
        season_name: selectedSeason,
        month: selectedMonth,
        category: modalCategory,
        target_plant_code: modalPlantCode,
        qty_dispatched_mt: modalQty,
        serial_number: modalSerial
      });
      setModalOpen(false);
      setModalPlantCode('');
      setModalQty(0);
      loadData();
    } catch (err: any) {
      await dialog.alert({
        title: 'Transfer Failed',
        message: `Failed to add transfer record: ${err.message}`,
        variant: 'danger',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    const ok = await dialog.confirm({
      title: 'Remove Transfer Record',
      message: 'Are you sure you want to remove this internal factory transfer record? This action cannot be undone.',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await api.deleteDispatch(id);
      loadData();
    } catch (err: any) {
      await dialog.alert({
        title: 'Delete Failed',
        message: `Delete failed: ${err.message}`,
        variant: 'danger',
      });
    }
  };

  const list63 = dispatches.filter(d => d.category === '6.3');
  const list64 = dispatches.filter(d => d.category === '6.4');
  const list65 = dispatches.filter(d => d.category === '6.5');

  const totalDomestic = Number(d611.dispatched) +
                        Number(d612.dispatched) +
                        Number(d613.dispatched) +
                        Number(d614.dispatched) +
                        Number(d62.qty) +
                        list63.reduce((sum, i) => sum + Number(i.qty_dispatched_mt), 0) +
                        list64.reduce((sum, i) => sum + Number(i.qty_dispatched_mt), 0) +
                        list65.reduce((sum, i) => sum + Number(i.qty_dispatched_mt), 0);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase flex items-center">
              <Truck className="w-5 h-5 text-red-600 mr-2" />
              Domestic Dispatches & Inter-Plant Transfers
            </h1>
            <span className="bg-red-50 text-red-700 border border-red-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {selectedMonth} {selectedSeason}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Section 5: Dispatches according to official release orders, BISS processing, internal group transfers, and HSN codes.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving ? true : loading}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-1.5" />
          {saving ? 'Saving Dispatches...' : 'Save All Dispatches'}
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

      {/* Summary Banner */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-500 font-bold uppercase">Total Domestic Dispatches (Section 5)</span>
          <div className="text-2xl font-black text-slate-900 mt-0.5">
            {totalDomestic.toFixed(2)} <span className="text-xs font-semibold text-slate-500">MT</span>
          </div>
        </div>
        <div className="text-xs text-slate-500 max-w-sm text-right">
          Formula = 6.1.1 + 6.1.2 + 6.1.3 + 6.1.4 + 6.2 + 6.3 Total + 6.4 Total + 6.5 Total
        </div>
      </div>

      {/* 6.1.1 to 6.1.4 Domestic Release Orders Grid */}
      <div className="erp-card p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase pb-2 border-b border-slate-100">
          6.1 Domestic Dispatches w.r.t. Release Orders
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 6.1.1 Monthly Release */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase block">
              6.1.1 Monthly Release Quantity
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="erp-label">Release Order Date</label>
                <input
                  type="text"
                  placeholder="DD/MM/YYYY"
                  className="erp-input"
                  value={d611.date}
                  onChange={(e) => setD611({ ...d611, date: e.target.value })}
                />
              </div>
              <div>
                <label className="erp-label">Qty Released (MT)</label>
                <input
                  type="number"
                  step="0.01"
                  className="erp-input"
                  value={d611.released}
                  onChange={(e) => setD611({ ...d611, released: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="erp-label">Qty Dispatched (MT) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="erp-input"
                  value={d611.dispatched}
                  onChange={(e) => setD611({ ...d611, dispatched: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="erp-label">Remarks</label>
                <input
                  type="text"
                  className="erp-input"
                  value={d611.remarks}
                  onChange={(e) => setD611({ ...d611, remarks: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* 6.1.2 Additional Allotment */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase block">
              6.1.2 Additional Allotment
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="erp-label">Release Order Date</label>
                <input
                  type="text"
                  placeholder="DD/MM/YYYY"
                  className="erp-input"
                  value={d612.date}
                  onChange={(e) => setD612({ ...d612, date: e.target.value })}
                />
              </div>
              <div>
                <label className="erp-label">Qty Released (MT)</label>
                <input
                  type="number"
                  step="0.01"
                  className="erp-input"
                  value={d612.released}
                  onChange={(e) => setD612({ ...d612, released: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="erp-label">Qty Dispatched (MT) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="erp-input"
                  value={d612.dispatched}
                  onChange={(e) => setD612({ ...d612, dispatched: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="erp-label">Remarks</label>
                <input
                  type="text"
                  className="erp-input"
                  value={d612.remarks}
                  onChange={(e) => setD612({ ...d612, remarks: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* 6.1.3 Extended Quota */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase block">
              6.1.3 Extended Quota
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="erp-label">Release Order Date</label>
                <input
                  type="text"
                  placeholder="DD/MM/YYYY"
                  className="erp-input"
                  value={d613.date}
                  onChange={(e) => setD613({ ...d613, date: e.target.value })}
                />
              </div>
              <div>
                <label className="erp-label">Qty Released (MT)</label>
                <input
                  type="number"
                  step="0.01"
                  className="erp-input"
                  value={d613.released}
                  onChange={(e) => setD613({ ...d613, released: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="erp-label">Qty Dispatched (MT) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="erp-input"
                  value={d613.dispatched}
                  onChange={(e) => setD613({ ...d613, dispatched: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="erp-label">Remarks</label>
                <input
                  type="text"
                  className="erp-input"
                  value={d613.remarks}
                  onChange={(e) => setD613({ ...d613, remarks: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* 6.1.4 Any Other Domestic Dispatch */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase block">
              6.1.4 Any Other Domestic Dispatch
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="erp-label">Release Order Date</label>
                <input
                  type="text"
                  placeholder="DD/MM/YYYY"
                  className="erp-input"
                  value={d614.date}
                  onChange={(e) => setD614({ ...d614, date: e.target.value })}
                />
              </div>
              <div>
                <label className="erp-label">Qty Released (MT)</label>
                <input
                  type="number"
                  step="0.01"
                  className="erp-input"
                  value={d614.released}
                  onChange={(e) => setD614({ ...d614, released: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="erp-label">Qty Dispatched (MT) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="erp-input"
                  value={d614.dispatched}
                  onChange={(e) => setD614({ ...d614, dispatched: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="erp-label">Remarks</label>
                <input
                  type="text"
                  className="erp-input"
                  value={d614.remarks}
                  onChange={(e) => setD614({ ...d614, remarks: e.target.value })}
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 6.2 BISS Dispatch */}
      <div className="erp-card p-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase pb-2 border-b border-slate-100 mb-4">
          6.2 BISS Dispatch of unmarketable old Sugar for further processing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="erp-label">Release Order Date</label>
            <input
              type="text"
              placeholder="DD/MM/YYYY"
              className="erp-input"
              value={d62.date}
              onChange={(e) => setD62({ ...d62, date: e.target.value })}
            />
          </div>
          <div>
            <label className="erp-label">Qty Used for Reprocessing (MT) *</label>
            <input
              type="number"
              step="0.01"
              className="erp-input"
              value={d62.qty}
              onChange={(e) => setD62({ ...d62, qty: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      {/* 6.3, 6.4, 6.5 Repeatable Inter-Plant Transfers */}
      <div className="erp-card p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase">
              Repeatable Internal Transfers & Sugar Sales (6.3, 6.4, 6.5)
            </h2>
            <p className="text-xs text-slate-500">
              Required by NSWS API to contain explicit serial numbers for repeatable group array entries.
            </p>
          </div>
          <button
            onClick={() => { setModalOpen(true); setModalCategory('6.3'); }}
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Transfer Record
          </button>
        </div>

        {/* 6.3 Raw Sugar Internal Transfers */}
        <div>
          <span className="text-xs font-bold text-slate-800 uppercase block mb-2">
            6.3 Internal transfer of raw sugar within a group ({list63.length} entries)
          </span>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Serial No.</th>
                  <th>Destination Plant Code</th>
                  <th>Quantity Transferred (MT)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {list63.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-slate-400 text-xs">No records.</td>
                  </tr>
                ) : (
                  list63.map((item) => (
                    <tr key={item.id}>
                      <td className="font-mono font-bold text-xs">{item.serial_number}</td>
                      <td className="font-semibold text-xs text-slate-900">Plant {item.target_plant_code}</td>
                      <td className="font-mono font-bold text-xs text-red-600">{item.qty_dispatched_mt} MT</td>
                      <td>
                        <button
                          onClick={() => item.id && handleDeleteItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 6.4 White Sugar Internal Transfers */}
        <div>
          <span className="text-xs font-bold text-slate-800 uppercase block mb-2">
            6.4 Internal transfer of white sugar within a group ({list64.length} entries)
          </span>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Serial No.</th>
                  <th>Destination Plant Code</th>
                  <th>Quantity Transferred (MT)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {list64.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-slate-400 text-xs">No records.</td>
                  </tr>
                ) : (
                  list64.map((item) => (
                    <tr key={item.id}>
                      <td className="font-mono font-bold text-xs">{item.serial_number}</td>
                      <td className="font-semibold text-xs text-slate-900">Plant {item.target_plant_code}</td>
                      <td className="font-mono font-bold text-xs text-red-600">{item.qty_dispatched_mt} MT</td>
                      <td>
                        <button
                          onClick={() => item.id && handleDeleteItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 6.5 Sale of Raw Sugar to other mills */}
        <div>
          <span className="text-xs font-bold text-slate-800 uppercase block mb-2">
            6.5 Sale of raw sugar to other sugar mills for domestic purpose ({list65.length} entries)
          </span>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Serial No.</th>
                  <th>Destination Mill Code</th>
                  <th>Quantity Transferred (MT)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {list65.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-slate-400 text-xs">No records.</td>
                  </tr>
                ) : (
                  list65.map((item) => (
                    <tr key={item.id}>
                      <td className="font-mono font-bold text-xs">{item.serial_number}</td>
                      <td className="font-semibold text-xs text-slate-900">Mill {item.target_plant_code}</td>
                      <td className="font-mono font-bold text-xs text-red-600">{item.qty_dispatched_mt} MT</td>
                      <td>
                        <button
                          onClick={() => item.id && handleDeleteItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* HSN Code Sales Summary */}
      <div className="erp-card p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase pb-2 border-b border-slate-100 flex items-center">
          <FileSpreadsheet className="w-4 h-4 text-red-600 mr-2" />
          HSN Code Sales Breakdown
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="erp-label">Total Sales (MT) for HSN Code - 17011490 *</label>
            <input
              type="number"
              step="0.01"
              className="erp-input"
              value={hsn.hsn_17011490_mt}
              onChange={(e) => setHsn({ ...hsn, hsn_17011490_mt: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="erp-label">Total Sales (MT) for HSN Code - 17019990 *</label>
            <input
              type="number"
              step="0.01"
              className="erp-input"
              value={hsn.hsn_17019990_mt}
              onChange={(e) => setHsn({ ...hsn, hsn_17019990_mt: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="erp-label">Total Sales (MT) for HSN Code - Others *</label>
            <input
              type="number"
              step="0.01"
              className="erp-input"
              value={hsn.hsn_others_mt}
              onChange={(e) => setHsn({ ...hsn, hsn_others_mt: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      {/* Add Transfer Modal */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 uppercase mb-4">
              Add New Transfer Record
            </h3>

            <form onSubmit={handleAddRepeatedItem} className="space-y-4">
              <div>
                <label className="erp-label">Transfer Category</label>
                <select
                  aria-label="Select Transfer Category"
                  className="erp-input"
                  value={modalCategory}
                  onChange={(e) => setModalCategory(e.target.value as any)}
                >
                  <option value="6.3">6.3 Internal raw sugar transfer within group</option>
                  <option value="6.4">6.4 Internal white sugar transfer within group</option>
                  <option value="6.5">6.5 Sale of raw sugar to other sugar mills</option>
                </select>
              </div>

              <div>
                <label className="erp-label">Serial Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1, 2, 3"
                  className="erp-input"
                  value={modalSerial}
                  onChange={(e) => setModalSerial(e.target.value)}
                />
              </div>

              <div>
                <label className="erp-label">Destination Sugar Mill Plant Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 101 or 201"
                  className="erp-input"
                  value={modalPlantCode}
                  onChange={(e) => setModalPlantCode(e.target.value)}
                />
              </div>

              <div>
                <label className="erp-label">Quantity Transferred (MT)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="erp-input"
                  value={modalQty}
                  onChange={(e) => setModalQty(Number(e.target.value))}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  {saving ? 'Adding...' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

    </div>
  );
};
