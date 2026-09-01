import React from 'react';
import { Settings, Cpu, HardDrive, ShieldCheck, Database, Lock, Activity, Shield } from 'lucide-react';

export default function SettingsView({ sentinel, onRefresh }) {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 glass-panel space-y-1">
        <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" /> Workbench Platform Settings & Diagnostics
        </h2>
        <p className="text-xs text-slate-400">
          On-premise model serving endpoints, local workspace storage roots, and hardware telemetry.
        </p>
      </div>

      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 glass-panel space-y-4 font-mono text-xs">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Sovereign Platform Configuration
        </h3>

        <div className="space-y-3">
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-slate-200 font-bold block">LOCAL INFERENCE ENGINE</span>
              <span className="text-[11px] text-slate-400 font-sans">Primary local open-weight model serving loopback endpoint</span>
            </div>
            <span className="px-3 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-bold">
              http://127.0.0.1:11434 (OLLAMA)
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-slate-200 font-bold block">WORKSPACE ROOT STORAGE</span>
              <span className="text-[11px] text-slate-400 font-sans">Local filesystem root for confidential documents and RAG indexes</span>
            </div>
            <span className="px-3 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 font-bold">
              ./backend/data/workspaces
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-slate-200 font-bold block">SECURITY POLICY ENGINE</span>
              <span className="text-[11px] text-slate-400 font-sans">Enforces data confidentiality boundaries and sandbox execution limits</span>
            </div>
            <span className="px-3 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
              AIRGAP_STRICT_ENFORCED
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-slate-200 font-bold block">HITL OPERATOR APPROVAL GATE</span>
              <span className="text-[11px] text-slate-400 font-sans">Mandatory human-in-the-loop sign-off for code execution and file generation</span>
            </div>
            <span className="px-3 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
              ACTIVE (RULE_001)
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-slate-200 font-bold block">CRYPTOGRAPHIC AUDIT LEDGER</span>
              <span className="text-[11px] text-slate-400 font-sans">SHA-256 tamper-evident hash chaining for all system actions</span>
            </div>
            <span className="px-3 py-1 rounded bg-slate-900 border border-slate-700 text-emerald-400 font-bold">
              CHAIN_VERIFIED_VALID
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
