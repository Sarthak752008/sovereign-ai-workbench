import React from 'react';
import { 
  LayoutDashboard, 
  ListTodo, 
  FileText, 
  Database, 
  Cpu, 
  CheckSquare, 
  History, 
  ShieldAlert, 
  Settings 
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, pendingApprovalsCount = 0 }) {
  const menuItems = [
    { id: 'workbench', label: 'Workbench', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks', icon: ListTodo },
    { id: 'documents', label: 'Documents & Knowledge', icon: FileText },
    { id: 'models', label: 'Local Models', icon: Cpu },
    { id: 'approvals', label: 'Approvals', icon: CheckSquare, badge: pendingApprovalsCount },
    { id: 'audit', label: 'Audit Logs', icon: History },
    { id: 'security', label: 'Security & Sentinel', icon: ShieldAlert },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between glass-panel">
      <div className="space-y-6">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Enterprise Control
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive 
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 shadow-md glow-cyan' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] space-y-1 font-mono text-slate-400">
        <div className="flex justify-between">
          <span>AIRGAP MODE:</span>
          <span className="text-emerald-400 font-bold">ENFORCED</span>
        </div>
        <div className="flex justify-between">
          <span>ENCRYPTION:</span>
          <span className="text-slate-300">AES-256</span>
        </div>
        <div className="flex justify-between">
          <span>EGRESS CALLS:</span>
          <span className="text-cyan-400 font-bold">0</span>
        </div>
      </div>
    </aside>
  );
}
