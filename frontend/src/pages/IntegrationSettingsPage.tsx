import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { SystemSettings } from '../types';
import {
  Server,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Key,
  Radio,
  Save,
  HelpCircle
} from 'lucide-react';

export const IntegrationSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user ? user.role === 'ADMIN' : false;

  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await api.getSettings();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (err: any) {
      setMessage({ text: err.message ? err.message : 'Failed to load settings', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage(null);

    try {
      await api.updateSettings(settings);
      setMessage({
        text: `NSWS Integration settings saved. Active Target: ${settings.active_environment}`,
        type: 'success'
      });
      await loadSettings();
    } catch (err: any) {
      setMessage({ text: err.message ? err.message : 'Failed to save settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchEnvironment = (env: 'UAT' | 'PPE' | 'PRODUCTION') => {
    if (settings) {
      setSettings({
        ...settings,
        active_environment: env
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-center">
        <ShieldCheck className="w-8 h-8 mx-auto text-red-600 mb-2" />
        <h2 className="text-sm font-bold text-red-900 uppercase">Administrator Access Required</h2>
        <p className="text-xs text-red-700 mt-1">
          Gateway credentials, endpoints, and 3-step integration lifecycle configuration require Directorate Admin privileges.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        <Server className="w-6 h-6 mx-auto animate-pulse text-red-600 mb-2" />
        Loading NSWS Integration Console...
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        <Server className="w-6 h-6 mx-auto animate-pulse text-red-600 mb-2" />
        Loading NSWS Integration Console...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
              National Single Window System
            </span>
            <span className="text-xs text-slate-500 font-mono">P2 Form API v1.3</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            API Integration Lifecycle & Endpoints
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure dynamic endpoints, authentication keys, and whitelisting requirements across the 3 integration stages.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Active Gateway</div>
            <div className="text-xs font-mono font-bold text-red-600">{settings.active_environment}</div>
          </div>
        </div>
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

      {/* 3-Step Lifecycle Visual Pipeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">
          Government API Integration 3-Stage Pipeline
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1: UAT */}
          <div
            onClick={() => handleSwitchEnvironment('UAT')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
              settings.active_environment === 'UAT'
                ? 'border-red-600 bg-red-50/40 ring-1 ring-red-600'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                STAGE 1
              </span>
              <Radio className={`w-4 h-4 ${settings.active_environment === 'UAT' ? 'text-red-600' : 'text-slate-300'}`} />
            </div>
            <div className="text-base font-black text-slate-900 mt-2">1. UAT Testing</div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Initial testing with official sample credentials (Balrampur 8901, Delight Proteins, Capacity 15000 TCD).
            </p>
            <div className="mt-3 pt-3 border-t border-slate-200/60 text-[10px] text-slate-400 font-mono truncate">
              {settings.uat_url}
            </div>
          </div>

          {/* Step 2: PPE */}
          <div
            onClick={() => handleSwitchEnvironment('PPE')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
              settings.active_environment === 'PPE'
                ? 'border-red-600 bg-red-50/40 ring-1 ring-red-600'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                STAGE 2
              </span>
              <Radio className={`w-4 h-4 ${settings.active_environment === 'PPE' ? 'text-red-600' : 'text-slate-300'}`} />
            </div>
            <div className="text-base font-black text-slate-900 mt-2">2. PPE Testing</div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Pre-Production Environment with investor PAN registration, static IP & domain whitelisting. October & November testing.
            </p>
            <div className="mt-3 pt-3 border-t border-slate-200/60 text-[10px] text-slate-400 font-mono truncate">
              {settings.ppe_url}
            </div>
          </div>

          {/* Step 3: Production */}
          <div
            onClick={() => handleSwitchEnvironment('PRODUCTION')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
              settings.active_environment === 'PRODUCTION'
                ? 'border-red-600 bg-red-50/40 ring-1 ring-red-600'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                STAGE 3 (FINAL)
              </span>
              <Radio className={`w-4 h-4 ${settings.active_environment === 'PRODUCTION' ? 'text-red-600' : 'text-slate-300'}`} />
            </div>
            <div className="text-base font-black text-slate-900 mt-2">3. Production Server</div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Live NSWS regulatory transmission after 2 successful consecutive months. Live data pushed for August.
            </p>
            <div className="mt-3 pt-3 border-t border-slate-200/60 text-[10px] text-slate-400 font-mono truncate">
              {settings.prod_url}
            </div>
          </div>
        </div>
      </div>

      {/* Main Configuration Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Active Gateway Endpoints & Authentication Headers
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Headers and URLs configured here apply dynamically to all regulatory submissions without code changes.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Number(settings.is_mock_mode) === 1}
                  onChange={(e) => setSettings({ ...settings, is_mock_mode: e.target.checked ? 1 : 0 })}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span>Simulate NSWS Gateway Responses (Mock Mode)</span>
              </label>
            </div>
          </div>

          {/* Endpoints */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Step 1: UAT Endpoint URL
              </label>
              <input
                type="text"
                required
                value={settings.uat_url ? settings.uat_url : ''}
                onChange={(e) => setSettings({ ...settings, uat_url: e.target.value })}
                className="mt-1 w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:border-red-600 focus:outline-hidden"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Step 2: PPE Endpoint URL
                </label>
                <a
                  href="https://www.ppe.nsws.gov.in/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold text-red-600 hover:underline inline-flex items-center"
                >
                  PPE Portal Link <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
              <input
                type="text"
                required
                value={settings.ppe_url ? settings.ppe_url : ''}
                onChange={(e) => setSettings({ ...settings, ppe_url: e.target.value })}
                className="mt-1 w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:border-red-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Step 3: Production Endpoint URL
              </label>
              <input
                type="text"
                required
                value={settings.prod_url ? settings.prod_url : ''}
                onChange={(e) => setSettings({ ...settings, prod_url: e.target.value })}
                className="mt-1 w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:border-red-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Authentication Headers */}
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center">
              <Key className="w-4 h-4 mr-1 text-red-600" />
              Required HTTP Gateway Headers
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">access-id</label>
                <input
                  type="text"
                  required
                  value={settings.access_id ? settings.access_id : ''}
                  onChange={(e) => setSettings({ ...settings, access_id: e.target.value })}
                  placeholder="SaveP2Data"
                  className="mt-1 w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:border-red-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">access-secret</label>
                <input
                  type="text"
                  required
                  value={settings.access_secret ? settings.access_secret : ''}
                  onChange={(e) => setSettings({ ...settings, access_secret: e.target.value })}
                  placeholder="SaveP2Data#0605_NSWS@1252"
                  className="mt-1 w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:border-red-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">api-key</label>
                <input
                  type="text"
                  required
                  value={settings.api_key ? settings.api_key : ''}
                  onChange={(e) => setSettings({ ...settings, api_key: e.target.value })}
                  placeholder="SaveP2Data#0605@AK1161"
                  className="mt-1 w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:border-red-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Cookie (Optional Session JSESSIONID)
              </label>
              <input
                type="text"
                value={settings.jsession_id ? settings.jsession_id : ''}
                onChange={(e) => setSettings({ ...settings, jsession_id: e.target.value })}
                placeholder="JSESSIONID=87C2405550A874E21D02299E47E6A504"
                className="mt-1 w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:border-red-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Step 2 & 3 Process Guide Accordion */}
          <div className="pt-4 border-t border-slate-200 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center">
              <HelpCircle className="w-4 h-4 mr-1 text-red-600" />
              Regulatory Filing Execution Rules & Troubleshooting:
            </h4>
            <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5">
              <li>
                <strong>Sequential Monthly Transmission:</strong> PPE testing requires pushing Month 1 (October). Once accepted, inform NSWS, who execute calculations and confirm DB insertion. Then push Month 2 (November).
              </li>
              <li>
                <strong>Duplicate Month Error Handling:</strong> If NSWS gateway returns:
                <code className="block mt-1 p-1 bg-white border border-slate-200 rounded font-mono text-[11px] text-red-700">
                  {`{"status": "200", "message": "P2 Data already submitted for the month i.e. October", "uniqueId": null}`}
                </code>
                Immediately select and push the subsequent month (e.g. November) without altering data.
              </li>
              <li>
                <strong>Production Readiness:</strong> Only after 2 consecutive months (October & November) have been confirmed by NSWS in PPE environment, switch the active gateway to <strong>Production Server</strong>. Production requires whitelisted Production Static IP and initiates by pushing previous month (August).
              </li>
            </ul>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-6 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {saving ? 'Saving...' : 'Save NSWS Gateway Configuration'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
