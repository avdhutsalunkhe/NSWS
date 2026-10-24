import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Plant } from '../types';
import {
  PlusCircle,
  Edit2,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Save,
  RefreshCw,
  Trash2
} from 'lucide-react';

export const PlantsMaster: React.FC = () => {
  const { user, refreshPlants } = useAuth();
  const isAdmin = user ? user.role === 'ADMIN' : false;

  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Partial<Plant> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deletePlantTarget, setDeletePlantTarget] = useState<Plant | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getPlants();
      setPlants(res.plants ? res.plants : []);
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message ? err.message : 'Failed to load plants', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (plant: Plant) => {
    setEditingPlant({ ...plant });
    setIsNew(false);
  };

  const handleConfirmDeletePlant = async () => {
    if (!deletePlantTarget) return;
    try {
      setDeleting(true);
      const res = await api.deletePlant(deletePlantTarget.id);
      setMessage({ text: res.message ? res.message : 'Sugar mill deleted successfully', type: 'success' });
      setDeletePlantTarget(null);
      await loadData();
      await refreshPlants();
    } catch (err: any) {
      setMessage({ text: err.message ? err.message : 'Failed to delete sugar mill', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateNew = () => {
    setEditingPlant({
      plant_code: '',
      plant_name: '',
      undertaking_group: '',
      state: 'UTTAR PRADESH',
      capacity_tcd: 5000,
      sws_id: 'SW4267788494',
      project_number: 'P_19',
      approval_id: 'M009_D001_A076',
      pan_number: '',
      pan_name: '',
      pan_dob: '',
      whitelisted_ip: '',
      whitelisted_domain: '',
      is_active: 1
    });
    setIsNew(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlant) return;
    setSaving(true);
    setMessage(null);

    try {
      if (isNew) {
        await api.createPlant(editingPlant);
        setMessage({ text: 'Plant created successfully', type: 'success' });
      } else if (editingPlant.id) {
        await api.updatePlant(editingPlant.id, editingPlant);
        setMessage({ text: 'Plant updated successfully', type: 'success' });
      }
      setEditingPlant(null);
      await loadData();
      await refreshPlants();
    } catch (err: any) {
      setMessage({ text: err.message ? err.message : 'Save operation failed', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
              Regulatory Directory
            </span>
            <span className="text-xs text-slate-500">NSWS Whitelisting & Factory Master</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            {isAdmin ? 'Sugar Mills & Plants Master' : 'My Factory Profile'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Single Window System IDs, Undertaking Groups, Staging & Production Whitelisting Credentials.
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Register New Sugar Mill
          </button>
        ) : null}
      </div>

      {/* Alert Banner */}
      {message ? (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600 font-bold ml-4">
            ×
          </button>
        </div>
      ) : null}

      {/* Plant Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">
          <RefreshCw className="w-6 h-6 mx-auto animate-spin text-red-600 mb-2" />
          Loading registered sugar mills...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plants.map((p) => (
          <div
            key={p.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:border-red-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-red-100 text-red-800 rounded">
                    PLANT {p.plant_code}
                  </span>
                  <h2 className="text-base font-black text-slate-900 mt-1">{p.plant_name}</h2>
                  <div className="text-xs text-slate-500 font-semibold">{p.undertaking_group}</div>
                </div>
                {isAdmin ? (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEdit(p)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Edit Plant Master"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletePlantTarget(p)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete Plant (Admin Only)"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">State</span>
                  <span className="font-semibold text-slate-800">{p.state}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Crushing Capacity</span>
                  <span className="font-semibold text-slate-800">{p.capacity_tcd?.toLocaleString()} TCD</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">NSWS SWS ID</span>
                  <span className="font-mono font-bold text-slate-900">{p.sws_id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Project No</span>
                  <span className="font-mono font-bold text-slate-900">{p.project_number}</span>
                </div>
              </div>

              {/* PPE Whitelisting Section */}
              <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-red-600" />
                  PPE Whitelisting Records
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">PAN No:</span>
                  <span className="font-mono font-bold text-slate-800">{p.pan_number ? p.pan_number : 'Pending'}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Static IP:</span>
                  <span className="font-mono text-slate-800">{p.whitelisted_ip ? p.whitelisted_ip : 'Not Configured'}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Domain:</span>
                  <span className="font-mono text-slate-800">{p.whitelisted_domain ? p.whitelisted_domain : 'Not Configured'}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-mono">Appr: {p.approval_id}</span>
              <span className={`px-2 py-0.5 rounded-full font-bold ${p.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                {p.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Edit/Create Modal */}
      {editingPlant ? (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {isNew ? 'Register New Sugar Mill' : `Edit Plant ${editingPlant.plant_code}`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure factory credentials and NSWS gateway whitelisting parameters.
                </p>
              </div>
              <button
                onClick={() => setEditingPlant(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Plant Code (Factory ID) *</label>
                  <input
                    type="text"
                    required
                    value={editingPlant.plant_code ? editingPlant.plant_code : ''}
                    onChange={(e) => setEditingPlant({ ...editingPlant, plant_code: e.target.value })}
                    placeholder="e.g. 8901"
                    className="mt-1 w-full text-xs font-mono font-bold border border-slate-300 rounded-lg p-2.5 focus:border-red-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Plant Name *</label>
                  <input
                    type="text"
                    required
                    value={editingPlant.plant_name ? editingPlant.plant_name : ''}
                    onChange={(e) => setEditingPlant({ ...editingPlant, plant_name: e.target.value })}
                    placeholder="e.g. Balrampur Sugar Mills"
                    className="mt-1 w-full text-xs font-semibold border border-slate-300 rounded-lg p-2.5 focus:border-red-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Undertaking / Group *</label>
                  <input
                    type="text"
                    required
                    value={editingPlant.undertaking_group ? editingPlant.undertaking_group : ''}
                    onChange={(e) => setEditingPlant({ ...editingPlant, undertaking_group: e.target.value })}
                    placeholder="e.g. DELIGHT PROTEINS LIMITED"
                    className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:border-red-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">State *</label>
                  <input
                    type="text"
                    required
                    value={editingPlant.state ? editingPlant.state : ''}
                    onChange={(e) => setEditingPlant({ ...editingPlant, state: e.target.value })}
                    placeholder="e.g. UTTAR PRADESH"
                    className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:border-red-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Capacity (TCD / TPD) *</label>
                  <input
                    type="number"
                    required
                    value={editingPlant.capacity_tcd ? editingPlant.capacity_tcd : 0}
                    onChange={(e) => setEditingPlant({ ...editingPlant, capacity_tcd: Number(e.target.value) })}
                    className="mt-1 w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:border-red-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Approval ID</label>
                  <input
                    type="text"
                    value={editingPlant.approval_id ? editingPlant.approval_id : ''}
                    onChange={(e) => setEditingPlant({ ...editingPlant, approval_id: e.target.value })}
                    className="mt-1 w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:border-red-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">SWS ID</label>
                  <input
                    type="text"
                    value={editingPlant.sws_id ? editingPlant.sws_id : ''}
                    onChange={(e) => setEditingPlant({ ...editingPlant, sws_id: e.target.value })}
                    placeholder="SW4267788494"
                    className="mt-1 w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:border-red-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Project No.</label>
                  <input
                    type="text"
                    value={editingPlant.project_number ? editingPlant.project_number : ''}
                    onChange={(e) => setEditingPlant({ ...editingPlant, project_number: e.target.value })}
                    placeholder="P_19"
                    className="mt-1 w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:border-red-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Step 2: PPE Whitelisting Requirements */}
              <div className="p-4 bg-red-50/50 rounded-xl border border-red-200 space-y-3">
                <div className="text-xs font-bold text-red-900 uppercase flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-1 text-red-600" />
                  Pre-requisites for PPE & Production Whitelisting
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">1. PAN Number</label>
                    <input
                      type="text"
                      value={editingPlant.pan_number ? editingPlant.pan_number : ''}
                      onChange={(e) => setEditingPlant({ ...editingPlant, pan_number: e.target.value.toUpperCase() })}
                      placeholder="ABCDE1234F"
                      className="mt-1 w-full text-xs font-mono border border-slate-300 rounded-lg p-2 focus:border-red-600 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">2. Name as per PAN</label>
                    <input
                      type="text"
                      value={editingPlant.pan_name ? editingPlant.pan_name : ''}
                      onChange={(e) => setEditingPlant({ ...editingPlant, pan_name: e.target.value })}
                      placeholder="DELIGHT PROTEINS LTD"
                      className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2 focus:border-red-600 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">3. Date of Birth / Inc</label>
                    <input
                      type="text"
                      value={editingPlant.pan_dob ? editingPlant.pan_dob : ''}
                      onChange={(e) => setEditingPlant({ ...editingPlant, pan_dob: e.target.value })}
                      placeholder="DD/MM/YYYY"
                      className="mt-1 w-full text-xs font-mono border border-slate-300 rounded-lg p-2 focus:border-red-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">Static IP Address</label>
                    <input
                      type="text"
                      value={editingPlant.whitelisted_ip ? editingPlant.whitelisted_ip : ''}
                      onChange={(e) => setEditingPlant({ ...editingPlant, whitelisted_ip: e.target.value })}
                      placeholder="e.g. 103.24.12.55"
                      className="mt-1 w-full text-xs font-mono border border-slate-300 rounded-lg p-2 focus:border-red-600 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">Registered Domain</label>
                    <input
                      type="text"
                      value={editingPlant.whitelisted_domain ? editingPlant.whitelisted_domain : ''}
                      onChange={(e) => setEditingPlant({ ...editingPlant, whitelisted_domain: e.target.value })}
                      placeholder="e.g. balrampur-sugar.in"
                      className="mt-1 w-full text-xs font-mono border border-slate-300 rounded-lg p-2 focus:border-red-600 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingPlant(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  {saving ? 'Saving...' : 'Save Factory Master'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Admin Delete Plant Confirmation Modal */}
      {deletePlantTarget ? (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-100 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                Delete Sugar Mill (Admin Only)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to completely delete the factory master record and associated operational data for:
              </p>
              <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-xs text-red-900 font-bold">
                Plant {deletePlantTarget.plant_code} - {deletePlantTarget.plant_name}
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  State: {deletePlantTarget.state} | Capacity: {deletePlantTarget.capacity_tcd} TCD
                </div>
              </div>
              <p className="text-[11px] text-red-600 font-semibold">
                Warning: This will delete the mill profile and all its crushing, sugar, and dues data.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletePlantTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePlant}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Deleting...' : 'Delete Sugar Mill'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
};
