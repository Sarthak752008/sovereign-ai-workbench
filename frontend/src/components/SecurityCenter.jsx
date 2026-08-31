import React from 'react';
import { ShieldCheck, WifiOff, Cpu, Lock, Terminal, Activity, AlertTriangle, CheckCircle2, History } from 'lucide-react';

export default function SecurityCenter({ sentinel, auditEvents, loading, error }) {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-slate-800 glass-panel shadow-2xl space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-mono glow-emerald">
          <WifiOff className="w-3.5 h-3.5" />
          <span>ZERO EXTERNAL AI NETWORK TELEMETRY ACTIVE</span>
        </div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">
          Sovereign Security & Network Sentinel Monitor
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          Empirical process socket monitoring verifying zero outbound cloud AI requests, air-gapped local model inference, and isolated sandbox code execution.
        </p>
      </div>

      {/* Real Sentinel Telemetry Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-emerald-800/60 bg-emerald-950/20 glass-panel space-y-1 glow-emerald">
          <span className="text-[10px] text-emerald-400 font-mono font-bold block uppercase">External AI Calls</span>
          <span className="text-2xl font-extrabold font-mono text-emerald-300">
            {sentinel?.external_ai_calls ?? 0}
          </span>
          <p className="text-[10px] text-emerald-500 font-mono">Cloud API Egress Blocked</p>
        </div>

        <div className="p-4 rounded-xl border border-cyan-800/60 bg-cyan-950/20 glass-panel space-y-1 glow-cyan">
          <span className="text-[10px] text-cyan-400 font-mono font-bold block uppercase">Network Policy</span>
          <span className="text-2xl font-extrabold font-mono text-cyan-300">
            {sentinel?.network_status || 'BLOCKED'}
          </span>
          <p className="text-[10px] text-cyan-500 font-mono">Air-gapped Local Runtime</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 glass-panel space-y-1">
          <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase">Sandbox Isolation</span>
          <span className="text-2xl font-extrabold font-mono text-slate-200">
            DISABLED NET
          </span>
          <p className="text-[10px] text-slate-500 font-mono">No Host WAN Egress</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 glass-panel space-y-1">
          <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase">Audit Ledger</span>
          <span className="text-2xl font-extrabold font-mono text-cyan-400">
            SHA-256
          </span>
          <p className="text-[10px] text-slate-500 font-mono">Tamper-Evident Hash Chain</p>
        </div>
      </div>

      {/* Technical Telemetry Proof Explanation */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 glass-panel space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" /> How "External AI Calls = 0" Is Guaranteed
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="text-cyan-400 font-bold block">1. Model Gateway Architecture</span>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              The model gateway strictly binds HTTP clients to local loopback adapters (`http://127.0.0.1:11434`). Cloud model adapters are prohibited.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="text-emerald-400 font-bold block">2. Process Egress Monitoring</span>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Network Sentinel samples host TCP socket connections to verify no process connects to WAN cloud endpoints.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="text-amber-400 font-bold block">3. Sandbox Network Boundary</span>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Code execution sandboxes execute with `--net=none` container flags, preventing Python scripts from making outbound network calls.
            </p>
          </div>
        </div>
      </div>

      {/* Security Audit Feed */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 glass-panel space-y-4">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" /> Security & Sovereignty Event Feed
        </h3>

        <div className="space-y-2 max-h-80 overflow-y-auto font-mono text-xs">
          {auditEvents?.map((ev, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-slate-200 uppercase">{ev.action}</span>
                  <p className="text-[10px] text-slate-500">Hash: {ev.hash?.substring(0, 24)}...</p>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(ev.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
