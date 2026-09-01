import React, { useState } from 'react';
import { CheckCircle2, Terminal, Copy, Check } from 'lucide-react';

function OutputRenderer({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse output into segments: code blocks vs text
  const renderOutput = (content) => {
    // Split on code blocks: ```lang\ncode\n```
    const segments = content.split(/(```[\s\S]*?```)/g);

    return segments.map((segment, idx) => {
      // Code block
      if (segment.startsWith('```') && segment.endsWith('```')) {
        const firstNewline = segment.indexOf('\n');
        const lang = segment.slice(3, firstNewline).trim();
        const code = segment.slice(firstNewline + 1, segment.length - 3).trim();
        return (
          <div key={idx} className="my-2 rounded-lg border border-cyan-900/50 overflow-hidden">
            {lang && (
              <div className="px-3 py-1 bg-cyan-950/60 text-[10px] text-cyan-400 font-mono uppercase border-b border-cyan-900/40 flex justify-between items-center">
                <span>{lang}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(code); }}
                  className="text-slate-500 hover:text-cyan-300 text-[9px]"
                >
                  Copy
                </button>
              </div>
            )}
            <pre className="p-3 bg-slate-950 text-[11px] text-emerald-300 font-mono leading-relaxed overflow-x-auto whitespace-pre">
              {code}
            </pre>
          </div>
        );
      }

      // Plain text — render with basic markdown formatting
      return <TextBlock key={idx} text={segment} />;
    });
  };

  return (
    <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
      <div className="flex justify-between items-center text-xs font-mono">
        <span className="text-cyan-400 font-bold">LLM OUTPUT</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="text-slate-500 hover:text-cyan-300 transition flex items-center gap-1 text-[10px]"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy All'}
          </button>
          <span className="text-emerald-400 text-[10px] bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
            COMPLETED
          </span>
        </div>
      </div>
      <div className="bg-slate-900/80 p-3 rounded border border-slate-800/80 max-h-[600px] overflow-y-auto">
        {renderOutput(text)}
      </div>
    </div>
  );
}

function TextBlock({ text }) {
  if (!text || !text.trim()) return null;

  const lines = text.split('\n');

  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;

        // Headings
        if (trimmed.startsWith('#### '))
          return <div key={i} className="text-cyan-400 font-semibold text-xs mt-1.5 mb-0.5">{formatInline(trimmed.slice(5))}</div>;
        if (trimmed.startsWith('### '))
          return <div key={i} className="text-cyan-300 font-bold text-sm mt-2 mb-1">{formatInline(trimmed.slice(4))}</div>;
        if (trimmed.startsWith('## '))
          return <div key={i} className="text-cyan-200 font-bold text-sm mt-2.5 mb-1">{formatInline(trimmed.slice(3))}</div>;
        if (trimmed.startsWith('# '))
          return <div key={i} className="text-white font-extrabold text-base mt-3 mb-1">{formatInline(trimmed.slice(2))}</div>;

        // Horizontal rule
        if (/^[-*_]{3,}$/.test(trimmed))
          return <hr key={i} className="border-slate-700 my-2" />;

        // Numbered list
        if (/^\d+\.\s/.test(trimmed))
          return <div key={i} className="text-slate-200 text-xs pl-2 py-0.5 leading-relaxed">{formatInline(trimmed)}</div>;

        // Bullet list
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• '))
          return <div key={i} className="text-slate-300 text-xs pl-3 py-0.5 leading-relaxed">{formatInline(trimmed)}</div>;

        // Inline code line (single backtick whole line)
        if (trimmed.startsWith('`') && trimmed.endsWith('`') && !trimmed.startsWith('```'))
          return <code key={i} className="text-emerald-400 text-[11px] font-mono bg-slate-950 px-1.5 py-0.5 rounded">{trimmed.slice(1, -1)}</code>;

        // Regular paragraph
        return <div key={i} className="text-slate-200 text-xs leading-relaxed">{formatInline(trimmed)}</div>;
      })}
    </>
  );
}

function formatInline(text) {
  // Handle **bold**, *italic*, `code`, [text](url) inline formatting
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`[^`]+`|\[.*?\]\(.*?\))/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-bold text-slate-100">{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**'))
      return <em key={i} className="italic text-slate-300">{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="text-emerald-400 text-[11px] font-mono bg-slate-950 px-1 py-0.5 rounded">{part.slice(1, -1)}</code>;
    // Links [text](url)
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch)
      return <a key={i} href={linkMatch[2]} className="text-cyan-400 underline" target="_blank" rel="noopener noreferrer">{linkMatch[1]}</a>;
    return part;
  });
}

export default function AgentActivityPanel({ activeTask }) {
  if (!activeTask) {
    return (
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 glass-panel">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
          <Terminal className="w-4 h-4 text-cyan-400" /> Agent Activity & State Trace
        </h3>
        <p className="text-xs text-slate-500 italic">No task currently running. Submit a query above to get started.</p>
      </div>
    );
  }

  const isError = activeTask.output && (
    activeTask.output.includes('[LOCAL MODEL UNAVAILABLE]') ||
    activeTask.output.includes('[LOCAL MODEL ERROR]') ||
    activeTask.output.includes('[LOCAL MODEL TIMEOUT]')
  );

  return (
    <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 glass-panel space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" /> Agent Activity: {activeTask.title}
          </h3>
          <p className="text-[11px] text-slate-400 font-mono">
            ID: {activeTask.task_id} | Model: {activeTask.selected_model || 'routing...'}
          </p>
        </div>
        <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase ${
          activeTask.status === 'completed' && !isError
            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50' 
            : activeTask.status === 'WAITING_APPROVAL'
            ? 'bg-amber-950 text-amber-300 border border-amber-700/50'
            : isError
            ? 'bg-red-950 text-red-300 border border-red-700/50'
            : 'bg-cyan-950 text-cyan-300 border border-cyan-700/50 animate-pulse'
        }`}>
          {isError ? 'ERROR' : activeTask.status}
        </span>
      </div>

      {/* Execution Plan */}
      <div className="space-y-2">
        <span className="text-[10px] text-slate-500 uppercase font-semibold">Orchestration Plan</span>
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
