import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { AuditLog } from '../types';
import {
  ClipboardList,
  RefreshCw,
  Search
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState(100);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs(limit);
      setLogs(data.logs ? data.logs : []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [limit]);

  const filteredLogs = logs.filter((l) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchesAction = l.action ? l.action.toLowerCase().includes(term) : false;
    const matchesEntity = l.entity_type ? l.entity_type.toLowerCase().includes(term) : false;
    const matchesDetails = l.details ? l.details.toLowerCase().includes(term) : false;
    const matchesUser = l.username ? l.username.toLowerCase().includes(term) : false;
    const matchesPlant = l.plant_code ? l.plant_code.toLowerCase().includes(term) : false;
    return [matchesAction, matchesEntity, matchesDetails, matchesUser, matchesPlant].includes(true);
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
              Statutory Compliance
            </span>
            <span className="text-xs text-slate-500">Immutable Audit Trail</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            System & Regulatory Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographic ledger tracking all operational updates, approvals, credential resets, and NSWS gateway transmissions.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadLogs}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Trail
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by action, user, plant code, or detail..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:border-red-600 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-600">
          <span>Show:</span>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="border border-slate-300 rounded-md p-1.5 text-xs focus:border-red-600 focus:outline-hidden"
          >
            <option value={50}>Latest 50 entries</option>
            <option value={100}>Latest 100 entries</option>
            <option value={200}>Latest 200 entries</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ClipboardList className="w-4 h-4 text-slate-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Activity Records ({filteredLogs.length})
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 mx-auto animate-spin text-red-600 mb-2" />
            Loading compliance logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No activity logs match the search query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User & Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Plant Code</th>
                  <th className="py-3 px-4">Operation Details</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{log.username}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">{log.role}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                      {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {log.plant_code ? (
                        <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                          {log.plant_code}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 text-xs max-w-md truncate">
                      {log.details ? log.details : '-'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {log.ip_address ? log.ip_address : '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
