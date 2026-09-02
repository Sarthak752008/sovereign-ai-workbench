import React from 'react';
import { ShieldCheck, WifiOff, Cpu, Lock, Activity, AlertTriangle, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

export default function TopBar({ sentinel, systemHealth, showBackLink, onBackHome }) {
  const healthStatus = systemHealth?.status || 'CHECKING';
  const ollamaStatus = systemHealth?.services?.ollama;
  const modelCount = ollamaStatus?.models?.length || 0;

  const healthBadge = {
    READY: { color: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400', dot: 'bg-emerald-400', icon: CheckCircle, label: 'READY' },
    DEGRADED: { color: 'bg-amber-950/60 border-amber-500/40 text-amber-400', dot: 'bg-amber-400', icon: AlertTriangle, label: 'DEGRADED' },
    FAILED: { color: 'bg-red-950/60 border-red-500/40 text-red-400', dot: 'bg-red-400', icon: XCircle, label: 'FAILED' },
    CHECKING: { color: 'bg-slate-800/60 border-slate-600/40 text-slate-400', dot: 'bg-slate-400', icon: Activity, label: 'CHECKING...' },
  }[healthStatus] || { color: 'bg-slate-800/60 border-slate-600/40 text-slate-400', dot: 'bg-slate-400', icon: Activity, label: healthStatus };

  const HealthIcon = healthBadge.icon;

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 px-6 flex items-center justify-between glass-panel sticky top-0 z-50">
      <div className="flex items-center space-x-3">
        {showBackLink && (
          <button
            onClick={onBackHome}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors mr-2 font-mono"
            title="Back to Landing Page"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Home</span>
          </button>
        )}
        <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center font-bold text-white shadow-lg glow-cyan">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-slate-100 tracking-wide flex items-center gap-2">
            SOVEREIGN<span className="text-cyan-400 font-extrabold">AI</span>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50 font-mono">
              WORKBENCH v1.0
            </span>
          </h1>
          <p className="text-xs text-slate-400">On-Premise Industrial AI Platform</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* System Health Badge */}
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-mono ${healthBadge.color}`}>
          <span className={`w-2 h-2 rounded-full ${healthBadge.dot} ${healthStatus === 'READY' ? 'animate-pulse' : ''}`}></span>
          <HealthIcon className="w-3.5 h-3.5" />
          <span className="font-bold">{healthBadge.label}</span>
          {systemHealth?.reason && healthStatus !== 'READY' && (
            <span className="text-[10px] opacity-75">— {systemHealth.reason}</span>
          )}
        </div>

        {/* Isolation Status Badge */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-mono glow-emerald">
          <WifiOff className="w-3.5 h-3.5" />
          <span>NETWORK: {sentinel?.network_status || 'BLOCKED'}</span>
          <span className="text-slate-500">|</span>
          <span className="font-bold">EXT AI: {sentinel?.external_ai_calls ?? 0}</span>
        </div>

        {/* Local GPU / Ollama Status */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-mono">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>OLLAMA: <strong className={ollamaStatus?.status === 'online' ? 'text-cyan-400' : 'text-red-400'}>
            {ollamaStatus?.status === 'online' ? `${modelCount} MODEL${modelCount !== 1 ? 'S' : ''}` : 'OFFLINE'}
          </strong></span>
        </div>

        {/* User Profile */}
        <div className="flex items-center space-x-2 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-600 flex items-center justify-center text-cyan-300 font-semibold text-xs">
            OP
          </div>
          <div className="text-left hidden md:block">
            <p className="text-xs font-medium text-slate-200">Industrial Operator</p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5 text-emerald-400" /> Confidential Air-gap
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
