import React from 'react';
import { GitBranch, Cpu, Zap, ShieldCheck, HelpCircle } from 'lucide-react';

export default function ModelRouterPanel({ routeDecision }) {
  if (!routeDecision) {
    return (
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 glass-panel">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
          <GitBranch className="w-4 h-4 text-cyan-400" /> Sovereign Model Router
        </h3>
        <p className="text-xs text-slate-500 italic">Submit a task to view deterministic model routing explanation & policy analysis.</p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 glass-panel space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-cyan-400" /> Sovereign Model Router
        </h3>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-700/50">
          DETERMINISTIC ROUTING
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
          <span className="text-slate-500 text-[10px] block uppercase">Task Classification</span>
          <span className="font-semibold text-cyan-300 uppercase font-mono">{routeDecision.task_classification}</span>
        </div>
        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
          <span className="text-slate-500 text-[10px] block uppercase">Risk & Policy</span>
          <span className={`font-semibold uppercase font-mono ${
            routeDecision.risk_level === 'HIGH' ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {routeDecision.risk_level} RISK ({routeDecision.policy_decision})
          </span>
        </div>
      </div>

      <div className="p-3.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-cyan-400 font-semibold flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" /> Selected Local Model:
          </span>
          <span className="font-mono text-xs font-bold text-white bg-cyan-900/60 px-2 py-0.5 rounded border border-cyan-600/50">
            {routeDecision.selected_model}
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">{routeDecision.reason}</p>
      </div>

      <div>
        <span className="text-[10px] text-slate-500 uppercase block mb-1.5 font-semibold">Available Fallback Models</span>
        <div className="flex flex-wrap gap-1.5">
          {routeDecision.alternatives?.map((alt, idx) => (
            <span key={idx} className="px-2.5 py-1 rounded bg-slate-800/60 border border-slate-700 text-[11px] text-slate-400 font-mono">
              {alt}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
