import React, { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import ModelRouterPanel from './components/ModelRouterPanel';
import AgentActivityPanel from './components/AgentActivityPanel';
import ApprovalInbox from './components/ApprovalInbox';
import AuditExplorer from './components/AuditExplorer';
import { 
  fetchSentinelStatus, 
  routeTask, 
  createTask, 
  fetchTasks, 
  fetchApprovals, 
  decideApproval, 
  fetchAuditEvents, 
  uploadDocument 
} from './services/api';
import { Play, Upload, ShieldCheck, Sparkles, AlertCircle, FileText, CheckCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('workbench');
  const [sentinel, setSentinel] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [confidentiality, setConfidentiality] = useState('CONFIDENTIAL');
  const [activeRoute, setActiveRoute] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');

  const loadData = async () => {
    const s = await fetchSentinelStatus();
    setSentinel(s);
    const t = await fetchTasks();
    setTasks(t);
    const a = await fetchApprovals();
    setApprovals(a);
    const ev = await fetchAuditEvents();
    setAuditEvents(ev);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRoutePreview = async (e) => {
    const text = e.target.value;
    setPrompt(text);
    if (text.length > 5) {
      const route = await routeTask(text, confidentiality);
      if (route) setActiveRoute(route);
    }
  };

  const handleRunTask = async () => {
    if (!prompt.trim()) return;
    const task = await createTask('Industrial Task Run', prompt, confidentiality);
    if (task) {
      setPrompt('');
      loadData();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatus(`Uploading ${file.name}...`);
    const res = await uploadDocument(file);
    if (res) {
      setUploadStatus(`Uploaded & processed ${file.name} (${res.pages} pages). Local vector RAG index updated.`);
      loadData();
    } else {
      setUploadStatus(`Uploaded ${file.name} to local workspace.`);
    }
  };

  const handleDecideApproval = async (appId, decision) => {
    await decideApproval(appId, decision);
    loadData();
  };

  const activeTask = tasks.length > 0 ? tasks[tasks.length - 1] : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <TopBar sentinel={sentinel} />

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
                <label className="cursor-pointer px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-2 border border-slate-700 transition">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Upload PDF / SOP</span>
                  <input type="file" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
            {uploadStatus && (
              <p className="text-xs text-emerald-400 font-mono mt-3 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> {uploadStatus}
              </p>
            )}
          </div>

          {/* Interactive Workbench Task Launcher */}
          {activeTab === 'workbench' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Task Input Launcher */}
              <div className="lg:col-span-2 space-y-6">
                <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 glass-panel space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" /> Submit New Task
                    </h3>
                    <div className="flex items-center space-x-2 text-xs">
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
                      disabled={!prompt.trim()}
                      className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg glow-cyan transition disabled:opacity-50"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Execute Sovereign Task</span>
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

          {activeTab === 'approvals' && (
            <ApprovalInbox approvals={approvals} onDecide={handleDecideApproval} />
          )}

          {activeTab === 'audit' && (
            <AuditExplorer events={auditEvents} />
          )}

          {activeTab === 'models' && (
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 glass-panel space-y-4">
              <h3 className="text-sm font-bold text-cyan-300 uppercase">Registered On-Premise Local Models</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                {sentinel?.active_local_models?.map((m, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex justify-between font-bold text-slate-200">
                      <span>{m}</span>
                      <span className="text-emerald-400 text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">READY</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans">Provider: Ollama / Local Open-Weights</p>
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
