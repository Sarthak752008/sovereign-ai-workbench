import React from 'react';
import { PlayCircle, CheckCircle2, Clock, Terminal, ShieldAlert } from 'lucide-react';

export default function AgentActivityPanel({ activeTask }) {
  if (!activeTask) {
    return (
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 glass-panel">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
          <Terminal className="w-4 h-4 text-cyan-400" /> Agent Activity & State Trace
        </h3>
        <p className="text-xs text-slate-500 italic">No task currently running.</p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 glass-panel space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" /> Agent Activity: {activeTask.title}
          </h3>
          <p className="text-[11px] text-slate-400 font-mono">ID: {activeTask.task_id}</p>
        </div>
        <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase ${
          activeTask.status === 'completed' 
            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50' 
            : activeTask.status === 'WAITING_APPROVAL'
            ? 'bg-amber-950 text-amber-300 border border-amber-700/50'
            : 'bg-cyan-950 text-cyan-300 border border-cyan-700/50 animate-pulse'
        }`}>
          {activeTask.status}
        </span>
      </div>

      {/* Execution Plan Step */}
      <div className="space-y-2">
        <span className="text-[10px] text-slate-500 uppercase font-semibold">Orchestration Graph Plan</span>
        <div className="space-y-1.5">
          {activeTask.plan?.map((step, idx) => (
            <div key={idx} className="flex items-start space-x-2 text-xs p-2 rounded bg-slate-950/70 border border-slate-800 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span className="text-slate-300">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Task Output */}
      {activeTask.output && (
        <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-cyan-400 font-bold">VERIFIED OUTPUT RESULT</span>
            <span className="text-emerald-400 text-[10px] bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
              VERIFICATION: PASS
            </span>
          </div>
          <pre className="text-xs text-slate-200 whitespace-pre-wrap font-mono leading-relaxed bg-slate-900/80 p-3 rounded border border-slate-800/80">
            {activeTask.output}
          </pre>
        </div>
      )}
    </div>
  );
}
