import React, { useState } from 'react';
import { ListTodo, CheckCircle2, AlertCircle, Clock, ShieldCheck, FileText, ChevronRight, RefreshCw } from 'lucide-react';

export default function TasksView({ tasks, loading, error, onRefresh }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [filter, setFilter] = useState('ALL');

  const filteredTasks = tasks.filter(t => {
    if (filter === 'COMPLETED') return t.status === 'completed';
    if (filter === 'WAITING') return t.status === 'WAITING_APPROVAL';
    if (filter === 'RUNNING') return t.status === 'running';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60 glass-panel">
        <div>
          <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-cyan-400" /> Stored Industrial Tasks ({tasks.length})
          </h2>
          <p className="text-xs text-slate-400">View and inspect agent task execution traces, model selections, and verified outputs.</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800 text-xs font-mono">
            {['ALL', 'COMPLETED', 'WAITING', 'RUNNING'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-md transition ${
                  filter === f ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button 
            onClick={onRefresh}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Refresh tasks"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>Error loading tasks: {error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && tasks.length === 0 && (
        <div className="p-12 text-center text-slate-400 text-xs font-mono space-y-2 glass-panel rounded-xl border border-slate-800">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400" />
          <p>Connecting to backend agent orchestrator...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredTasks.length === 0 && (
        <div className="p-12 text-center text-slate-500 text-xs font-mono space-y-2 glass-panel rounded-xl border border-slate-800">
          <ListTodo className="w-8 h-8 mx-auto text-slate-600" />
          <p className="text-slate-400 font-semibold">No tasks found in filter mode "{filter}"</p>
          <p className="text-[11px] text-slate-500">Submit a task from the Workbench command center to trigger agent execution.</p>
        </div>
      )}

      {/* Task List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {filteredTasks.map((t) => (
            <div 
              key={t.task_id}
              onClick={() => setSelectedTask(t)}
              className={`p-4 rounded-xl border transition cursor-pointer glass-panel ${
                selectedTask?.task_id === t.task_id
                  ? 'border-cyan-500/80 bg-cyan-950/30 glow-cyan'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-100 flex items-center gap-2">
                    {t.title}
                    {t.verification_passed && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/80 font-mono">
                        VERIFIED
                      </span>
                    )}
                  </span>
                  <p className="text-[11px] text-slate-400 font-mono">ID: {t.task_id}</p>
                </div>

                <span className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase ${
                  t.status === 'completed' 
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : t.status === 'WAITING_APPROVAL'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-cyan-950 text-cyan-300 border border-cyan-800 animate-pulse'
                }`}>
                  {t.status}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Model: <strong className="text-cyan-300">{t.selected_model || 'TriForge Auto'}</strong></span>
                <span>Risk: <strong className={t.risk_level === 'HIGH' ? 'text-amber-400' : 'text-emerald-400'}>{t.risk_level}</strong></span>
                <span className="flex items-center text-slate-300 hover:text-cyan-300">
                  Inspect Trace <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Task Detail Inspector */}
        <div>
          {selectedTask ? (
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 glass-panel space-y-4 sticky top-20">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Task Inspector</h3>
                <p className="text-xs text-slate-200 font-semibold mt-1">{selectedTask.title}</p>
                <p className="text-[10px] text-slate-500 font-mono">{selectedTask.task_id}</p>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">STATUS:</span>
                  <span className="text-emerald-400 font-bold">{selectedTask.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SELECTED MODEL:</span>
                  <span className="text-cyan-400 font-bold">{selectedTask.selected_model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">RISK ASSESSMENT:</span>
                  <span className="text-amber-400 font-bold">{selectedTask.risk_level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">VERIFICATION:</span>
                  <span className="text-emerald-400 font-bold">{selectedTask.verification_passed ? 'PASS (100%)' : 'PENDING'}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-mono block font-semibold">Graph Execution Plan</span>
                {selectedTask.plan?.map((step, idx) => (
                  <div key={idx} className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-start space-x-2">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>

              {selectedTask.output && (
                <div className="space-y-1 pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-cyan-400 font-mono font-bold block uppercase">VERIFIED OUTPUT DELIVERABLE</span>
                  <pre className="p-3 rounded bg-slate-950 text-[11px] font-mono text-slate-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto border border-slate-800">
                    {selectedTask.output}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-xl border border-slate-800 bg-slate-900/40 glass-panel text-center text-slate-500 text-xs font-mono space-y-2">
              <FileText className="w-6 h-6 mx-auto text-slate-600" />
              <p>Select a task from the list to view full execution details and output report.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
