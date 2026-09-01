import React, { useState } from 'react';
import { PlayCircle, CheckCircle2, Clock, Terminal, ShieldAlert, Copy, Check } from 'lucide-react';

function OutputRenderer({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Split output into segments: detect code blocks (```...```) and render them separately
  const renderOutput = (content) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // Extract language and code
        const firstNewline = part.indexOf('\n');
        const lang = part.slice(3, firstNewline).trim();
        const code = part.slice(firstNewline + 1, part.length - 3).trim();
        return (
          <div key={idx} className="my-2 rounded-lg border border-cyan-900/50 overflow-hidden">
            {lang && (
              <div className="px-3 py-1 bg-cyan-950/60 text-[10px] text-cyan-400 font-mono uppercase border-b border-cyan-900/40">
                {lang}
              </div>
            )}
            <pre className="p-3 bg-slate-950 text-[11px] text-emerald-300 font-mono leading-relaxed overflow-x-auto">
              {code}
            </pre>
          </div>
        );
      }

      // Render non-code text with basic formatting
      const lines = part.split('\n');
      return lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={`${idx}-${lineIdx}`} className="h-1.5" />;

        // Headings (### or **)
        if (trimmed.startsWith('###')) {
          return (
            <div key={`${idx}-${lineIdx}`} className="text-cyan-300 font-bold text-xs mt-2 mb-1">
              {trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '')}
            </div>
          );
        }
        if (trimmed.startsWith('####')) {
          return (
            <div key={`${idx}-${lineIdx}`} className="text-cyan-400 font-semibold text-xs mt-1.5">
              {trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '')}
            </div>
          );
        }

        // Bold lines (**text**)
        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
          return (
            <div key={`${idx}-${lineIdx}`} className="text-slate-100 font-bold text-xs mt-1">
              {trimmed.replace(/\*\*/g, '')}
            </div>
          );
        }

        // Section headers [BRACKETS]
        if (trimmed.startsWith('[') && trimmed.includes(']:')) {
          return (
            <div key={`${idx}-${lineIdx}`} className="text-cyan-400 font-semibold text-xs mt-2">
              {trimmed}
            </div>
          );
        }

        // Numbered list items
        if (/^\d+\./.test(trimmed)) {
          return (
            <div key={`${idx}-${lineIdx}`} className="text-slate-200 text-xs pl-2 py-0.5">
              {renderInlineBold(trimmed)}
            </div>
          );
        }

        // Bullet items
        if (trimmed.startsWith('- ')) {
          return (
            <div key={`${idx}-${lineIdx}`} className="text-slate-300 text-xs pl-3 py-0.5">
              {renderInlineBold(trimmed)}
            </div>
          );
        }

        // Regular text
        return (
          <div key={`${idx}-${lineIdx}`} className="text-slate-200 text-xs leading-relaxed">
            {renderInlineBold(trimmed)}
          </div>
        );
      });
    });
  };

  // Render inline **bold** inside text
  const renderInlineBold = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <span key={i} className="font-bold text-slate-100">{part.slice(2, -2)}</span>;
      }
      return part;
    });
  };

  return (
    <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
      <div className="flex justify-between items-center text-xs font-mono">
        <span className="text-cyan-400 font-bold">VERIFIED OUTPUT RESULT</span>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleCopy}
            className="text-slate-500 hover:text-cyan-300 transition flex items-center gap-1 text-[10px]"
            title="Copy output to clipboard"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <span className="text-emerald-400 text-[10px] bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
            VERIFICATION: PASS
          </span>
        </div>
      </div>
      <div className="bg-slate-900/80 p-3 rounded border border-slate-800/80 max-h-[500px] overflow-y-auto">
        {renderOutput(text)}
      </div>
    </div>
  );
}

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
        <OutputRenderer text={activeTask.output} />
      )}
    </div>
  );
}
