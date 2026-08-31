import React from 'react';
import { Settings, Cpu, HardDrive, ShieldCheck, Database, RefreshCw } from 'lucide-react';

export default function SettingsView({ sentinel, onRefresh }) {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 glass-panel space-y-1">
        <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" /> Workbench Platform Settings & Diagnostics
        </h2>
        <p className="text-xs text-slate-400">Configure local model engine URLs, local workspace storage roots, and airgap policies.</p>
      </div>

      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 glass-panel space-y-4 font-mono text-xs">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">System Configuration Parameters</h3>

        <div className="space-y-3">
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-slate-200 font-bold block">LOCAL OLLAMA BASE URL</span>
              <span className="text-[11px] text-slate-400 font-sans">Primary local open-weight model serving endpoint</span>
            </div>
            <span className="px-3 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-bold">
              http://127.0.0.1:11434
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-slate-200 font-bold block">LOCAL WORKSPACE DIRECTORY</span>
              <span className="text-[11px] text-slate-400 font-sans">Root directory for workspace files and generated deliverables</span>
            </div>
            <span className="px-3 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 font-bold">
              ./data/workspaces
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-slate-200 font-bold block">SOVEREIGN AIRGAP POLICY</span>
              <span className="text-[11px] text-slate-400 font-sans">Enforces zero external cloud AI network calls</span>
            </div>
            <span className="px-3 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
              STRICT_ENFORCED
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-slate-200 font-bold block">HITL APPROVAL ENFORCEMENT</span>
              <span className="text-[11px] text-slate-400 font-sans">High-risk tools (python.exec, file.delete) require operator sign-off</span>
            </div>
            <span className="px-3 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
              ENABLED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
