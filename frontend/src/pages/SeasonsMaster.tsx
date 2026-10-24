import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { SugarSeason } from '../types';
import {
  PlusCircle,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Info,
  RefreshCw
} from 'lucide-react';

export const SeasonsMaster: React.FC = () => {
  const { user, setSelectedSeason } = useAuth();
  const isAdmin = user ? user.role === 'ADMIN' : false;

  const [seasons, setSeasons] = useState<SugarSeason[]>([]);
  const [loading, setLoading] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadSeasons = async () => {
    setLoading(true);
    try {
      const data = await api.getSeasons();
      setSeasons(data.seasons ? data.seasons : []);
    } catch (err: any) {
      setMessage({ text: err.message ? err.message : 'Failed to fetch seasons', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeasons();
  }, []);

  const handleSetCurrent = async (seasonName: string) => {
    try {
      await api.setCurrentSeason(seasonName);
      setSelectedSeason(seasonName);
      setMessage({ text: `Season ${seasonName} set as active current regulatory season.`, type: 'success' });
      await loadSeasons();
    } catch (err: any) {
      setMessage({ text: err.message ? err.message : 'Failed to update current season', type: 'error' });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeasonName.trim()) return;

    try {
      await api.createSeason({
        season_name: newSeasonName.trim(),
        start_date: `${newSeasonName.split('-')[0]}-10-01`,
        end_date: `20${newSeasonName.split('-')[1]}-09-30`,
        status: 'ACTIVE'
      });
      setMessage({ text: `Season ${newSeasonName} registered successfully`, type: 'success' });
      setNewSeasonName('');
      await loadSeasons();
    } catch (err: any) {
      setMessage({ text: err.message ? err.message : 'Failed to create season', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
              Regulatory Calendar
            </span>
            <span className="text-xs text-slate-500">Directorate of Sugar (1st Oct - 30th Sept)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Sugar Seasons Master
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure annual cane crushing operational periods and regulatory submission windows.
          </p>
        </div>

        <button
          onClick={loadSeasons}
          disabled={loading}
          className="inline-flex items-center px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-2xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
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

      {/* NSWS Validation Guideline Callout */}
      <div className="bg-red-50/50 border border-red-200 rounded-xl p-4 text-xs space-y-1.5">
        <div className="flex items-center space-x-2 text-red-900 font-bold">
          <Info className="w-4 h-4 text-red-600 shrink-0" />
          <span>NSWS Directorate of Sugar Validation Rule:</span>
        </div>
        <p className="text-slate-700 leading-relaxed pl-6">
          "Value will change in the month of November each year. For example: on 1 Nov 2024, sugar season value changes to 2024-25.
          The operational sugar season cycle runs from 1st October of the first year to 30th September of the following year."
        </p>
      </div>

      {/* Seasons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {seasons.map((s) => (
          <div
            key={s.id}
            className={`bg-white rounded-xl border p-5 transition-all shadow-2xs ${
              s.is_current === 1 ? 'border-red-500 ring-2 ring-red-500/10' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-base font-black text-slate-900 font-mono tracking-tight">
                {s.season_name}
              </span>
              {s.is_current === 1 ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Current Active
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-semibold px-2 py-0.5 bg-slate-100 rounded">
                  {s.status}
                </span>
              )}
            </div>

            <div className="text-xs text-slate-500 space-y-1 mb-4">
              <div>
                <span className="text-slate-400 font-medium">Starts:</span>{' '}
                <span className="font-semibold text-slate-700">{s.start_date ? s.start_date : '01-10'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Ends:</span>{' '}
                <span className="font-semibold text-slate-700">{s.end_date ? s.end_date : '30-09'}</span>
              </div>
            </div>

            {isAdmin && s.is_current !== 1 ? (
              <button
                onClick={() => handleSetCurrent(s.season_name)}
                className="w-full py-2 px-3 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition cursor-pointer"
              >
                Set as Active Season
              </button>
            ) : null}
          </div>
        ))}

        {isAdmin ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-5 flex flex-col justify-center">
            <h3 className="text-xs font-bold text-slate-800 uppercase mb-2">Register New Season</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text"
                required
                value={newSeasonName}
                onChange={(e) => setNewSeasonName(e.target.value)}
                placeholder="e.g. 2024-25"
                className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2 bg-white focus:border-red-600 focus:outline-hidden"
              />
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center px-3 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                Add Sugar Season
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
};
