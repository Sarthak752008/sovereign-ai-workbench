import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import ModelRouterPanel from '../components/ModelRouterPanel';
import AgentActivityPanel from '../components/AgentActivityPanel';
import ApprovalInbox from '../components/ApprovalInbox';
import AuditExplorer from '../components/AuditExplorer';
import TasksView from '../components/TasksView';
import DocumentsView from '../components/DocumentsView';
import KnowledgeView from '../components/KnowledgeView';
import SecurityCenter from '../components/SecurityCenter';
import SettingsView from '../components/SettingsView';
import {
  fetchSentinelStatus,
  routeTask,
  createTask,
  fetchTasks,
  fetchApprovals,
  decideApproval,
  fetchAuditEvents,
  uploadDocument,
  resetWorkbench,
  fetchSystemHealth,
  fetchSystemPolicy
} from '../services/api';
import { Play, Upload, ShieldCheck, Sparkles, AlertCircle, FileText, CheckCircle, RotateCcw } from 'lucide-react';

export default function WorkbenchApp() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('workbench');
  const [sentinel, setSentinel] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [confidentiality, setConfidentiality] = useState('CONFIDENTIAL');
  const [activeRoute, setActiveRoute] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [systemHealth, setSystemHealth] = useState(null);
  const [retryPrompt, setRetryPrompt] = useState('');

  const loadData = async () => {
    try {
      const s = await fetchSentinelStatus();
      setSentinel(s);
      const t = await fetchTasks();
      setTasks(t);
      const a = await fetchApprovals();
      setApprovals(a);
      const ev = await fetchAuditEvents();
      setAuditEvents(ev);
      const health = await fetchSystemHealth();
      setSystemHealth(health);
    } catch (err) {
      setError('Failed to sync backend state');
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRoutePreview = async (e) => {
    const text = e.target.value;
    setPrompt(text);
    if (text.trim().length > 5) {
      const decision = await routeTask(text, confidentiality);
      if (decision) setActiveRoute(decision);
    }
  };

  const handleRunTask = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    const savedPrompt = prompt;
    try {
      const task = await createTask('Industrial Task Run', prompt, confidentiality, null);
      if (task) {
        if (task.output && (task.output.includes('[LOCAL MODEL UNAVAILABLE]') || task.output.includes('[LOCAL MODEL ERROR]'))) {
          setRetryPrompt(savedPrompt);
          setError('Local model unavailable. Check Ollama status and try again.');
        } else {
          setPrompt('');
          setRetryPrompt('');
        }
        await loadData();
      } else {
        setRetryPrompt(savedPrompt);
        setError('Failed to submit task. Backend may be unreachable.');
      }
    } catch (err) {
      setRetryPrompt(savedPrompt);
      setError(`Failed to submit task: ${err.message || 'Connection error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatus(`Uploading ${file.name}...`);
    const res = await uploadDocument(file);
    if (res) {
      setUploadStatus(`Uploaded & processed ${file.name} (${res.pages} pages). Local vector RAG index updated.`);
      await loadData();
    } else {
      setUploadStatus(`Uploaded ${file.name} to local workspace.`);
    }
  };

  const handleResetWorkbench = async () => {
    setLoading(true);
    try {
      await resetWorkbench();
      setPrompt('');
      setUploadStatus('');
      setActiveRoute(null);
      await loadData();
    } catch (err) {
      setError('Failed to reset workbench session');
    } finally {
      setLoading(false);
    }
  };

  const handleDecideApproval = async (appId, decision) => {
    await decideApproval(appId, decision);
    await loadData();
  };

  const activeTask = tasks.length > 0 ? tasks[tasks.length - 1] : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <TopBar sentinel={sentinel} systemHealth={systemHealth} showBackLink onBackHome={() => navigate('/')} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingApprovalsCount={approvals.filter(a => a.status === 'pending').length}
        />

        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Top Hero Card / Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-slate-800 glass-panel shadow-2xl relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex justify-between items-start">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AIR-GAPPED CONFIDENTIAL WORKBENCH</span>
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  Sovereign On-Premise Industrial AI Command Center
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Execute confidential document intelligence, python calculations, image visual inspections, and RAG workflows with zero cloud network exfiltration.
                </p>
              </div>

              {/* Action Quick Launch Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleResetWorkbench}
                  className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-2 border border-slate-700 transition shadow-sm"
                  title="Clear current session, reset vector index, and start new report"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>New Report / Refresh</span>
                </button>
                <label className="cursor-pointer px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-2 border border-slate-700 transition">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Upload PDF / SOP</span>
                  <input type="file" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
            {uploadStatus && (
              <div className="mt-3 flex items-center justify-between bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                <p className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> {uploadStatus}
                </p>
                <button
                  onClick={handleResetWorkbench}
                  className="text-[11px] font-mono text-slate-400 hover:text-cyan-300 underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Clear / Reset
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <p className="text-sm text-red-300 font-medium">{error}</p>
                  {systemHealth?.reason && <p className="text-xs text-red-400/70 mt-0.5">{systemHealth.reason}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {retryPrompt && (
                  <button
                    onClick={() => { setPrompt(retryPrompt); setError(''); }}
                    className="px-3 py-1.5 rounded bg-red-900/50 hover:bg-red-800/50 text-red-300 text-xs font-semibold border border-red-700/50 transition"
                  >
                    Restore Prompt & Retry
                  </button>
                )}
                <button
                  onClick={() => setError('')}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Page Routing Views */}
          {activeTab === 'workbench' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Task Input Launcher */}
              <div className="lg:col-span-2 space-y-6">
                <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 glass-panel space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" /> Submit New Task
                    </h3>
                    <div className="flex items-center space-x-3 text-xs">
                      <button
                        onClick={handleResetWorkbench}
                        className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-mono flex items-center space-x-1.5 transition"
                        title="Reset workspace for new report"
                      >
                        <RotateCcw className="w-3 h-3 text-cyan-400" />
                        <span>New Report</span>
                      </button>
                      <span className="text-slate-400">Classification:</span>
                      <select
                        value={confidentiality}
                        onChange={(e) => setConfidentiality(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="INTERNAL">INTERNAL</option>
                        <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                        <option value="RESTRICTED">RESTRICTED</option>
                        <option value="HIGHLY_CONFIDENTIAL">HIGHLY CONFIDENTIAL</option>
                      </select>
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    value={prompt}
                    onChange={handleRoutePreview}
                    placeholder="Enter industrial task request (e.g. 'Analyze inspection report PDF, calculate monthly equipment efficiency metrics using Python, and generate DOCX report')..."
                    className="w-full p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono leading-relaxed resize-none"
                  />

                  <div className="flex justify-between items-center pt-1">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          const sample = "Analyze confidential inspection report PDF, execute python calculation for pressure metrics, and export DOCX summary";
                          setPrompt(sample);
                          routeTask(sample, confidentiality).then(setActiveRoute);
                        }}
                        className="px-3 py-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-mono border border-slate-700"
                      >
                        Demo: Inspection Workflow
                      </button>
                      <button
                        onClick={() => {
                          const sample = "Write Python script to parse spreadsheet equipment metrics, calculate maintenance score, and test code in sandbox";
                          setPrompt(sample);
                          routeTask(sample, confidentiality).then(setActiveRoute);
                        }}
                        className="px-3 py-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-mono border border-slate-700"
                      >
                        Demo: Python Sandbox Task
                      </button>
                    </div>

                    <button
                      onClick={handleRunTask}
                      disabled={!prompt.trim() || loading}
                      className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg glow-cyan transition disabled:opacity-50"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{loading ? 'Submitting...' : 'Execute Sovereign Task'}</span>
                    </button>
                  </div>
                </div>

                <AgentActivityPanel activeTask={activeTask} />
                <ApprovalInbox approvals={approvals} onDecide={handleDecideApproval} />
              </div>

              {/* Sidebar Info Panels */}
              <div className="space-y-6">
                <ModelRouterPanel routeDecision={activeRoute} />
                <AuditExplorer events={auditEvents} />
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <TasksView tasks={tasks} loading={loading} error={error} onRefresh={loadData} />
          )}

          {activeTab === 'documents' && (
            <DocumentsView />
          )}

          {activeTab === 'knowledge' && (
            <KnowledgeView />
          )}

          {activeTab === 'approvals' && (
            <ApprovalInbox approvals={approvals} onDecide={handleDecideApproval} />
          )}

          {activeTab === 'audit' && (
            <AuditExplorer events={auditEvents} />
          )}

          {activeTab === 'security' && (
            <SecurityCenter sentinel={sentinel} auditEvents={auditEvents} loading={loading} error={error} />
          )}

          {activeTab === 'settings' && (
            <SettingsView sentinel={sentinel} onRefresh={loadData} />
          )}

          {activeTab === 'models' && (
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 glass-panel space-y-4">
              <h3 className="text-sm font-bold text-cyan-300 uppercase font-mono">Registered On-Premise Local Models</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                {sentinel?.active_local_models?.map((m, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex justify-between font-bold text-slate-200">
                      <span>{m}</span>
                      <span className="text-emerald-400 text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">READY</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans">Provider: Ollama / Local Open-Weights Engine</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
