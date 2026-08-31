import React from 'react';
import { History, Hash, ShieldCheck } from 'lucide-react';

export default function AuditExplorer({ events }) {
  return (
    <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 glass-panel space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" /> Tamper-Evident Audit Ledger
        </h3>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/50 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" /> HASH CHAIN VERIFIED
        </span>
      </div>

      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
        {events.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">No audit events recorded yet.</p>
        ) : (
          events.map((ev, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs space-y-1 font-mono">
              <div className="flex justify-between items-center text-slate-400">
                <span className="font-bold text-cyan-300 uppercase">{ev.action}</span>
                <span className="text-[10px] text-slate-500">{new Date(ev.timestamp).toLocaleTimeString()}</span>
              </div>
              
              <div className="text-[11px] text-slate-300 flex items-center space-x-2">
                <span>Actor: {ev.actor}</span>
                {ev.model_used && <span>| Model: <strong className="text-cyan-400">{ev.model_used}</strong></span>}
                {ev.tool_used && <span>| Tool: <strong className="text-amber-400">{ev.tool_used}</strong></span>}
              </div>

              <div className="text-[10px] text-slate-500 truncate flex items-center gap-1 pt-0.5">
                <Hash className="w-3 h-3 text-slate-600 shrink-0" />
                <span className="truncate">Hash: {ev.hash}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
