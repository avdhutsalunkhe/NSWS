import React, { useState } from 'react';
import type { P2Report } from '../types';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { StatusBadge } from '../components/Badge';
import { api } from '../services/api';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Send,
  Check,
  ShieldCheck,
  FileCode,
  FileCheck2,
  RotateCcw,
  ListChecks,
  Terminal
} from 'lucide-react';

interface Props {
  reportId: number;
  onClose: () => void;
  onRefresh?: () => void;
  onUpdated?: () => void;
  isAdmin?: boolean;
}

export const P2ReportDetailModal: React.FC<Props> = ({ reportId, onClose, onRefresh, onUpdated, isAdmin: propIsAdmin }) => {
  const { user } = useAuth();
  const dialog = useDialog();
  const isAdmin = propIsAdmin !== undefined ? propIsAdmin : (user ? user.role === 'ADMIN' : false);
  const [data, setData] = useState<{ report: P2Report; payload: any; validation: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'checklist' | 'sections' | 'payload' | 'submission'>('checklist');
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [curlCopied, setCurlCopied] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await api.getP2Report(reportId);
      setData(res);
    } catch (err: any) {
      await dialog.alert({
        title: 'Report Load Failure',
        message: `Failed to load report: ${err.message}`,
        variant: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadReport();
  }, [reportId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-700 uppercase">Generating Report Console...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { report, payload, validation } = data;
  const payloadStr = JSON.stringify(payload, null, 2);

  const handleValidate = async () => {
    try {
      setActionLoading(true);
      await api.validateP2Report(reportId);
      loadReport();
      if (onRefresh) onRefresh();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      await dialog.alert({
        title: 'Validation Error',
        message: err.message,
        variant: 'danger',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    const ok = await dialog.confirm({
      title: 'Approve P2 Report',
      message: 'Are you sure you want to approve this monthly P2 report? Once approved, it will be authorized for submission to the National Single Window System (NSWS).',
      confirmText: 'Approve Report',
      cancelText: 'Cancel',
      variant: 'success',
    });
    if (!ok) return;

    try {
      setActionLoading(true);
      await api.approveP2Report(reportId);
      loadReport();
      if (onRefresh) onRefresh();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      await dialog.alert({
        title: 'Approval Error',
        message: err.message,
        variant: 'danger',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      await dialog.alert({
        title: 'Reason Required',
        message: 'Please enter a reason for returning this report for correction.',
        variant: 'warning',
      });
      return;
    }
    try {
      setActionLoading(true);
      await api.rejectP2Report(reportId, rejectionReason.trim());
      setShowRejectInput(false);
      setRejectionReason('');
      loadReport();
      if (onRefresh) onRefresh();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      await dialog.alert({
        title: 'Correction Request Error',
        message: err.message,
        variant: 'danger',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePushNSWS = async () => {
    const ok = await dialog.confirm({
      title: 'Submit to NSWS Gateway',
      message: 'Transmit this approved monthly P2 report to the Central Government National Single Window System (NSWS)?',
      confirmText: 'Submit to NSWS',
      cancelText: 'Cancel',
      variant: 'nsws',
    });
    if (!ok) return;

    try {
      setActionLoading(true);
      const res = await api.pushP2ReportToNSWS(reportId);
      const resp = res.result?.response || {};
      const uniqueId = resp.UniqueId || resp.uniqueId || 'None';
      const msg = resp.message || res.message || 'Transmission recorded';

      const targetUrl = res.result?.targetUrl || 'https://uat-nsws-mnstrportal.investindia.gov.in/nsws_license/saveP2Data';
      const env = res.result?.environment || 'UAT';

      await dialog.alert({
        title: 'NSWS Government Gateway Response',
        message: `Environment: ${env} Live Gateway\nTarget Endpoint: ${targetUrl}\nTransmission Status: ${res.result?.status || 'SUBMITTED'}\nUnique Reference ID: ${uniqueId}\n\nCentral Government Acknowledgment:\n${msg}`,
        variant: res.result?.status === 'ACCEPTED' || res.result?.status === 'SUCCESS' ? 'success' : 'info',
        details: resp,
      });

      loadReport();
      if (onRefresh) onRefresh();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      await dialog.alert({
        title: 'NSWS Push Failed',
        message: err.message || 'An error occurred during submission to the NSWS gateway.',
        variant: 'danger',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const copyPayload = () => {
    navigator.clipboard.writeText(payloadStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCurl = () => {
    const curl = `curl --location 'https://uat-nsws-mnstrportal.investindia.gov.in/nsws_license/saveP2Data' \\
--header 'access-id: SaveP2Data' \\
--header 'access-secret: SaveP2Data#0605_NSWS@1252' \\
--header 'api-key: SaveP2Data#0605@AK1161' \\
--header 'Content-Type: application/json' \\
--data '${JSON.stringify(payload)}'`;
    navigator.clipboard.writeText(curl);
    setCurlCopied(true);
    setTimeout(() => setCurlCopied(false), 2000);
  };

  const downloadJson = () => {
    const blob = new Blob([payloadStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NSWS_P2_${report.plant_code ? report.plant_code : 'MILL'}_${report.month}_${report.season_name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sectionsStatus = validation && validation.sectionsStatus ? validation.sectionsStatus : {};
  const sectionsList = [
    { key: 'seasonApplied', name: '1. Form applied for - (Sugar Season & Month)', status: Boolean(sectionsStatus.seasonApplied) },
    { key: 'millDetails', name: '2. Sugar Mill Details (Plant Code, Name, Group, State)', status: Boolean(sectionsStatus.millDetails) },
    { key: 'caneCrushed', name: '3. Cane Crushed (Capacity & Crushing Volume)', status: Boolean(sectionsStatus.caneCrushed) },
    { key: 'production', name: '4. Production of White / Raw Sugar (2.I & 2.II)', status: Boolean(sectionsStatus.production) },
    { key: 'dispatches', name: '5. Dispatches & Transfers (6.1 to 6.5 & HSN Sales)', status: Boolean(sectionsStatus.dispatches) },
    { key: 'exports', name: '6. Export Details (OGL Quota & AAS Orders)', status: Boolean(sectionsStatus.exports) },
    { key: 'imports', name: '7. Import Details (OGL & AAS Applicability)', status: Boolean(sectionsStatus.imports) },
    { key: 'stock', name: '8. Stock of Sugar (Premises & Outside Godown)', status: Boolean(sectionsStatus.stock) },
    { key: 'packaging', name: '9. Packing details of Sugar (Jute, PP/HDPE Bags)', status: Boolean(sectionsStatus.packaging) },
    { key: 'caneDues', name: '10. Cane Dues Data (Payable, Paid & Historical)', status: Boolean(sectionsStatus.caneDues) },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-lg shadow-xs">
              P2
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  P2 Regulatory Console: {report.month} {report.season_name}
                </h2>
                <StatusBadge status={report.status} />
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Plant {report.plant_code} ({report.plant_name}) | SWS ID: {report.sws_id} | Whitelisted IP: {report.whitelisted_ip ? report.whitelisted_ip : 'Corporate/HQ Default'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="px-6 bg-white border-b border-slate-200 flex space-x-6">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center cursor-pointer transition-colors ${
              activeTab === 'checklist'
                ? 'border-red-600 text-red-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5 mr-1.5" />
            1. Completeness & Validation
          </button>

          <button
            onClick={() => setActiveTab('sections')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center cursor-pointer transition-colors ${
              activeTab === 'sections'
                ? 'border-red-600 text-red-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5 mr-1.5" />
            2. Report Form Preview
          </button>

          <button
            onClick={() => setActiveTab('payload')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center cursor-pointer transition-colors ${
              activeTab === 'payload'
                ? 'border-red-600 text-red-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 mr-1.5" />
            3. Official NSWS v1.3 JSON Payload
          </button>

          <button
            onClick={() => setActiveTab('submission')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center cursor-pointer transition-colors ${
              activeTab === 'submission'
                ? 'border-red-600 text-red-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 mr-1.5" />
            4. Integration Logs & Response
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-white">
          
          {/* Tab 1: Checklist & Validation */}
          {activeTab === 'checklist' ? (
            <div className="space-y-6">
              
              {/* Completeness Bar */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase">
                    Section-Wise Completeness Progress
                  </span>
                  <span className="text-sm font-black text-red-600">
                    {validation ? validation.completenessPct : 0}% Complete
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-red-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${validation ? validation.completenessPct : 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Validation Errors & Warnings */}
              {validation && validation.errors && validation.errors.length > 0 ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-red-800 uppercase flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1.5 text-red-600" />
                    Blocking Validation Errors ({validation.errors.length}):
                  </span>
                  <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
                    {validation.errors.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {validation && validation.warnings && validation.warnings.length > 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-amber-800 uppercase flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1.5 text-amber-600" />
                    Regulatory Observations & Warnings ({validation.warnings.length}):
                  </span>
                  <ul className="list-disc list-inside text-xs text-amber-700 space-y-1">
                    {validation.warnings.map((warn: string, i: number) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* 10 Sections Checklist */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 font-bold text-xs uppercase text-slate-700">
                  Official Section Readiness Checklist
                </div>
                <div className="divide-y divide-slate-100">
                  {sectionsList.map((sec, idx) => (
                    <div key={idx} className="px-4 py-3 flex items-center justify-between text-xs hover:bg-slate-50/50">
                      <span className="font-semibold text-slate-800">{sec.name}</span>
                      {sec.status ? (
                        <span className="inline-flex items-center text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-amber-700 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-600" /> Pending Entries
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculated Metrics */}
              {validation && validation.calculatedMetrics ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Max Crushing Limit</div>
                    <div className="text-xs font-mono font-bold text-slate-800 mt-1">
                      {validation.calculatedMetrics.maxCrushingAllowed} MT
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Calculated Recovery</div>
                    <div className="text-xs font-mono font-bold text-red-600 mt-1">
                      {validation.calculatedMetrics.sugarRecoveryPct} %
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Domestic Dispatches</div>
                    <div className="text-xs font-mono font-bold text-slate-800 mt-1">
                      {validation.calculatedMetrics.totalDomesticDispatch} MT
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Total Closing Stock</div>
                    <div className="text-xs font-mono font-bold text-slate-800 mt-1">
                      {validation.calculatedMetrics.totalClosingStock} MT
                    </div>
                  </div>
                </div>
              ) : null}

            </div>
          ) : null}

          {/* Tab 2: Sections Overview */}
          {activeTab === 'sections' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Verified structured view of all 10 P2 sections compiled from the factory&apos;s operational database records.
              </p>
              {payload && payload[0] && payload[0].forms && payload[0].forms[0] && payload[0].forms[0].sections ? (
                payload[0].forms[0].sections.map((sec: any, idx: number) => (
                  <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 font-bold text-xs uppercase text-slate-800 flex justify-between items-center">
                      <span>{sec.sectionName}</span>
                      <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                        Section {idx + 1}
                      </span>
                    </div>
                    <div className="p-4 overflow-x-auto text-xs space-y-2">
                      {Array.isArray(sec.fieldResponses) ? (
                        sec.fieldResponses.map((fieldItem: any, fIdx: number) => {
                          if (Array.isArray(fieldItem)) {
                            // Repeated list (6.3, 6.4, 6.5)
                            return (
                              <div key={fIdx} className="p-2.5 bg-slate-50 rounded border border-slate-200 my-2">
                                <span className="font-bold text-slate-700 block mb-1.5">
                                  Repeated Transfers List ({fieldItem.length} items):
                                </span>
                                <div className="space-y-1">
                                  {fieldItem.map((repeatItem: any, rIdx: number) => (
                                    <div key={rIdx} className="flex justify-between items-center text-[11px] font-mono bg-white p-1.5 rounded border border-slate-100">
                                      <span>#{repeatItem.serialNumber}: Plant {repeatItem.subFields && repeatItem.subFields[0] ? repeatItem.subFields[0].inputValue : ''}</span>
                                      <span className="font-bold text-red-600">{repeatItem.subFields && repeatItem.subFields[1] ? repeatItem.subFields[1].inputValue : ''} MT</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }

                          if (fieldItem.subFields) {
                            return (
                              <div key={fIdx} className="py-2 border-b border-slate-100 last:border-none">
                                <span className="font-bold text-slate-800 block mb-1">{fieldItem.fieldName}</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-3">
                                  {fieldItem.subFields.map((sub: any, sIdx: number) => (
                                    <div key={sIdx} className="flex justify-between text-[11px]">
                                      <span className="text-slate-600">{sub.fieldName}:</span>
                                      <span className="font-mono font-bold text-slate-900">{sub.inputValue}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div key={fIdx} className="flex justify-between py-1.5 border-b border-slate-100 last:border-none text-xs">
                              <span className="text-slate-600 font-medium">{fieldItem.fieldName}:</span>
                              <span className="font-mono font-bold text-slate-900 truncate max-w-md">{fieldItem.inputValue}</span>
                            </div>
                          );
                        })
                      ) : null}
                    </div>
                  </div>
                ))
              ) : null}
            </div>
          ) : null}

          {/* Tab 3: Official Payload */}
          {activeTab === 'payload' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-600 font-medium">
                  Exact JSON structure as required by NSWS P2 Form Push API Version 1.3:
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={copyCurl}
                    className="inline-flex items-center px-2.5 py-1 rounded bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    {curlCopied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Terminal className="w-3.5 h-3.5 mr-1 text-slate-500" />}
                    {curlCopied ? 'cURL Copied!' : 'Copy cURL'}
                  </button>

                  <button
                    onClick={copyPayload}
                    className="inline-flex items-center px-2.5 py-1 rounded bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1 text-slate-500" />}
                    {copied ? 'Copied!' : 'Copy JSON'}
                  </button>

                  <button
                    onClick={downloadJson}
                    className="inline-flex items-center px-2.5 py-1 rounded bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Download JSON
                  </button>
                </div>
              </div>

              <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-[500px] leading-relaxed shadow-inner">
                {payloadStr}
              </pre>
            </div>
          ) : null}

          {/* Tab 4: Submissions Log */}
          {activeTab === 'submission' ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase">
                    NSWS Gateway Submission Status
                  </span>
                  <StatusBadge status={report.status} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Target Gateway Endpoint:</span>
                    <span className="font-mono font-bold text-red-700 break-all">
                      https://uat-nsws-mnstrportal.investindia.gov.in/nsws_license/saveP2Data
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Server Authority:</span>
                    <span className="font-semibold text-slate-800">
                      National Single Window System (Invest India / Central Govt UAT)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Submitted At:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {report.submitted_at ? new Date(report.submitted_at).toLocaleString() : 'Not Yet Submitted'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Submitted By:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {report.submitted_by ? report.submitted_by : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Approved By:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {report.approved_by ? report.approved_by : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Gateway Status / Rejection:</span>
                    <span className="font-semibold text-red-600">
                      {report.rejection_reason ? report.rejection_reason : (report.status === 'ACCEPTED' ? 'Accepted by NSWS' : 'None')}
                    </span>
                  </div>
                </div>
              </div>

              {report.response_log ? (
                <div>
                  <span className="text-xs font-bold text-slate-700 uppercase block mb-2">
                    External Gateway Response Log
                  </span>
                  <pre className="p-4 bg-slate-900 text-slate-100 font-mono text-xs rounded-xl overflow-x-auto leading-relaxed">
                    {JSON.stringify(JSON.parse(report.response_log), null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                  No gateway response log recorded yet. Report must be approved and pushed to NSWS.
                </div>
              )}
            </div>
          ) : null}

        </div>

        {/* Modal Action Bar */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          
          <button
            onClick={handleValidate}
            disabled={actionLoading}
            className="inline-flex items-center px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer shadow-2xs"
          >
            <CheckCircle2 className="w-4 h-4 mr-1 text-slate-600" />
            Re-run Validation
          </button>

          {/* Action buttons based on Role & Status */}
          <div className="flex items-center space-x-2">
            
            {/* Clerk: Submit for Review */}
            {/* Admin: Request Correction or Approve */}
            {isAdmin && ['PENDING_APPROVAL', 'DRAFT'].includes(report.status) ? (
              <>
                <button
                  onClick={() => setShowRejectInput(!showRejectInput)}
                  disabled={actionLoading}
                  className="inline-flex items-center px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1 text-orange-600" />
                  Request Correction
                </button>

                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                  Approve Report
                </button>
              </>
            ) : null}

            {/* Push to NSWS Gateway: Direct submission allowed for Factory Clerks & Admins */}
            {['DRAFT', 'APPROVED', 'PENDING_APPROVAL'].includes(report.status) ? (
              <button
                onClick={handlePushNSWS}
                disabled={actionLoading}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider cursor-pointer shadow-md hover:scale-102 transition-all"
                title="Transmit official return to NSWS Directorate of Sugar Gateway"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Push Live to NSWS Gateway
              </button>
            ) : null}

          </div>
        </div>

        {/* Rejection input drawer */}
        {showRejectInput ? (
          <div className="p-4 bg-orange-50 border-t border-orange-200 flex items-center space-x-3">
            <input
              type="text"
              placeholder="Enter specific correction reason for the factory clerk..."
              className="erp-input flex-1"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <button
              onClick={handleReject}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg bg-orange-600 text-white font-bold text-xs uppercase cursor-pointer"
            >
              Confirm Correction Request
            </button>
          </div>
        ) : null}

      </div>
    </div>
  );
};
