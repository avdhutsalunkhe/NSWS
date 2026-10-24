import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { P2Report } from '../types';
import { StatusBadge } from '../components/Badge';
import { P2ReportDetailModal } from './P2ReportDetailModal';
import {
  FileCheck2,
  PlusCircle,
  RefreshCw,
  CheckCircle,
  Eye,
  AlertTriangle,
  Layers
} from 'lucide-react';
import { PlantScopeToolbar } from '../components/PlantScopeToolbar';

export const P2ReportsPage: React.FC = () => {
  const { user, selectedPlant, allPlants, selectedSeason, selectedMonth } = useAuth();
  const isAdmin = user ? user.role === 'ADMIN' : false;

  const [reports, setReports] = useState<P2Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

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

  const loadReports = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const data = await api.getP2Reports(
        targetPlantId,
        selectedSeason ? selectedSeason : undefined,
        undefined,
        statusFilter !== 'ALL' ? statusFilter : undefined
      );
      setReports(data.reports ? data.reports : []);
    } catch (err: any) {
      console.error('Failed to load reports:', err);
      setMessage({ text: err.message ? err.message : 'Failed to fetch reports', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [targetPlantId, selectedSeason, statusFilter]);

  const handleGenerateDraft = async () => {
    if (!activePlant) {
      setMessage({ text: 'Please select a sugar mill plant first.', type: 'error' });
      return;
    }
    setGenerating(true);
    setMessage(null);
    try {
      const res = await api.generateP2Draft(activePlant.id, selectedSeason, selectedMonth);
      setMessage({
        text: `Draft P2 Report successfully compiled for ${activePlant.plant_name} (${selectedMonth} ${selectedSeason}).`,
        type: 'success'
      });
      await loadReports();
      if (res.reportId) {
        setSelectedReportId(res.reportId);
      }
    } catch (err: any) {
      setMessage({ text: err.message ? err.message : 'Draft compilation failed', type: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  // Filtered counts
  const totalCount = reports.length;
  const acceptedCount = reports.filter((r) => r.status === 'ACCEPTED').length;
  const draftCount = reports.filter((r) => r.status === 'DRAFT').length;
  const pendingCount = reports.filter((r) => r.status === 'PENDING_APPROVAL').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
              NSWS API v1.3
            </span>
            <span className="text-xs text-slate-500 font-mono">Form ID: F01554</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            P2 Regulatory Filing Console
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Directorate of Sugar monthly statutory return submission and National Single Window System gateway transmission.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadReports}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleGenerateDraft}
            disabled={generating ? true : !selectedPlant}
            className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            {generating ? 'Compiling Ledger...' : `Compile ${selectedMonth} Draft`}
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {message ? (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : message.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-blue-50 text-blue-800 border-blue-200'
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
          <button
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-4"
          >
            ×
          </button>
        </div>
      ) : null}

      {/* Sugar Mill Scope & Switcher */}
      <PlantScopeToolbar />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Total Filings</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Season {selectedSeason}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-emerald-600 uppercase">Accepted by NSWS</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{acceptedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Verified Gateways</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-amber-600 uppercase">Draft Workflows</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{draftCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">In preparation</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-indigo-600 uppercase">Pending Approval</div>
          <div className="text-2xl font-black text-indigo-600 mt-1">{pendingCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Awaiting Directorate</div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200 pb-2 overflow-x-auto">
        {['ALL', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SUBMITTED', 'ACCEPTED', 'REJECTED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              statusFilter === st
                ? 'bg-red-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Reports Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-slate-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              P2 Monthly Returns Ledger
            </h2>
          </div>
          <div className="text-xs text-slate-500">
            Showing {reports.length} return{reports.length === 1 ? '' : 's'}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 mx-auto animate-spin text-red-600 mb-2" />
            Fetching regulatory reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center">
            <FileCheck2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <div className="text-sm font-bold text-slate-800">No P2 Returns Found</div>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No filing matches the selected plant and season criteria. Click "Compile {selectedMonth} Draft" to assemble this month's return.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Plant Details</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">SWS Identifier</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{r.plant_name}</div>
                      <div className="text-[11px] text-slate-500">
                        Code: <span className="font-mono font-bold text-red-600">{r.plant_code}</span> | {r.state}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{r.month}</div>
                      <div className="text-[11px] text-slate-500 font-mono">Season: {r.season_name}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div>{r.sws_id}</div>
                      <div className="text-slate-400">Proj: {r.project_number}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-500">
                      <div>{r.updated_at ? new Date(r.updated_at).toLocaleDateString() : '-'}</div>
                      <div className="text-[10px] text-slate-400">
                        {r.submitted_by ? `By: ${r.submitted_by}` : 'Unsubmitted'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedReportId(r.id)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Inspect & Transmit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Console */}
      {selectedReportId ? (
        <P2ReportDetailModal
          reportId={selectedReportId}
          onClose={() => {
            setSelectedReportId(null);
            loadReports();
          }}
          onUpdated={loadReports}
          isAdmin={isAdmin}
        />
      ) : null}
    </div>
  );
};
