import React from 'react';
import { AlertTriangle, Check, X, ShieldAlert } from 'lucide-react';

export default function ApprovalInbox({ approvals, onDecide }) {
  const pendingApprovals = approvals.filter(a => a.status === 'pending');

  return (
    <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 glass-panel space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" /> Pending High-Risk Approvals (HITL)
        </h3>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800/50">
          {pendingApprovals.length} PENDING
        </span>
      </div>

      {pendingApprovals.length === 0 ? (
        <p className="text-xs text-slate-500 italic py-2">No pending approval tickets requiring operator review.</p>
      ) : (
        <div className="space-y-3">
          {pendingApprovals.map((req) => (
            <div key={req.approval_id} className="p-4 rounded-lg bg-amber-950/20 border border-amber-800/40 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-300 font-mono flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Action: {req.action_name}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  RISK: {req.risk_level}
                </span>
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
                <span className="text-[10px] text-slate-500 block mb-1">EXECUTION PAYLOAD</span>
                {JSON.stringify(req.payload, null, 2)}
              </div>

              <div className="flex space-x-2 pt-1">
                <button
                  onClick={() => onDecide(req.approval_id, 'approved')}
                  className="flex-1 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center space-x-1 shadow transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve Execution</span>
                </button>
                <button
                  onClick={() => onDecide(req.approval_id, 'denied')}
                  className="flex-1 py-1.5 rounded bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold flex items-center justify-center space-x-1 shadow transition"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
