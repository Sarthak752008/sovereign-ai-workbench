import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─────────────────────────────────────────────────────────────────────────────
   Scroll-reveal hook using IntersectionObserver — no GSAP required
───────────────────────────────────────────────────────────────────────────── */
function useScrollReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─────────────────────────────────────────────────────────────────────────────
   Reusable reveal wrapper
───────────────────────────────────────────────────────────────────────────── */
function Reveal({ children, delay = 0, className = '' }) {
  const [ref, visible] = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   NAVBAR
───────────────────────────────────────────────────────────────────────────── */
function Navbar({ onLiveUse }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const links = ['Product', 'Architecture', 'Security', 'Research'];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#090d16]/95 border-b border-white/5 backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" strokeWidth="1.5" fill="none"/>
              <circle cx="8" cy="8" r="2" fill="white" fillOpacity="0.9"/>
            </svg>
          </div>
          <span className="text-sm font-bold text-white tracking-wide">
            Sovereign<span className="text-cyan-400">AI</span>
          </span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} className="text-sm text-slate-400 hover:text-white transition-colors duration-200">
              {l}
            </a>
          ))}
          <a
            href="https://github.com/Sarthak752008/sovereign-ai-workbench"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-400 hover:text-white transition-colors duration-200 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>
          <button
            onClick={onLiveUse}
            className="px-4 py-1.5 rounded text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors duration-200 tracking-wide"
          >
            Live Use →
          </button>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0d1220]/98 border-t border-white/5 px-6 py-4 space-y-3">
          {links.map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMenuOpen(false)} className="block text-sm text-slate-300 hover:text-white py-1">
              {l}
            </a>
          ))}
          <a href="https://github.com/Sarthak752008/sovereign-ai-workbench" target="_blank" rel="noopener noreferrer" className="block text-sm text-slate-300 hover:text-white py-1">GitHub</a>
          <button onClick={() => { onLiveUse(); setMenuOpen(false); }} className="w-full mt-2 px-4 py-2 rounded text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors">
            Live Use →
          </button>
        </div>
      )}
    </nav>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   HERO — animated pipeline flow
───────────────────────────────────────────────────────────────────────────── */
function Hero({ onLiveUse }) {
  const nodes = ['User', 'Policy', 'TriForge', 'Models', 'Agent', 'Verified'];

  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-16 overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      {/* Faint gradient accent */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-800/60 bg-cyan-950/30 text-cyan-400 text-xs font-mono mb-8 hero-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          AIR-GAPPED · ON-PREMISE · ZERO EGRESS
        </div>

        {/* Product name */}
        <p className="text-sm font-mono text-slate-400 tracking-[0.3em] uppercase mb-3 hero-fade-in" style={{ animationDelay: '100ms' }}>
          SovereignAI Workbench
        </p>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-5 hero-fade-in" style={{ animationDelay: '200ms' }}>
          Private AI.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">
            Inside Your Infrastructure.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-3 hero-fade-in" style={{ animationDelay: '300ms' }}>
          An on-premise agentic AI workbench for confidential industrial knowledge work.
        </p>
        <p className="text-sm font-mono text-slate-500 tracking-widest mb-10 hero-fade-in" style={{ animationDelay: '400ms' }}>
          Own the data.&nbsp;&nbsp;Own the models.&nbsp;&nbsp;Own the execution.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16 hero-fade-in" style={{ animationDelay: '500ms' }}>
          <a
            href="https://github.com/Sarthak752008/sovereign-ai-workbench"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-6 py-3 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-semibold transition-all duration-200 hover:border-slate-500"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub Repository
          </a>
          <button
            onClick={onLiveUse}
            className="flex items-center gap-2 px-6 py-3 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-cyan-900/30"
          >
            Live Use
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>

        {/* Animated pipeline flow */}
        <div className="hero-fade-in flex items-center justify-center gap-0 overflow-x-auto pb-2" style={{ animationDelay: '700ms' }}>
          {nodes.map((node, i) => (
            <React.Fragment key={node}>
              <div
                className="pipeline-node flex-shrink-0 px-3 py-1.5 rounded border text-[11px] font-mono"
                style={{ animationDelay: `${800 + i * 180}ms` }}
              >
                {node}
              </div>
              {i < nodes.length - 1 && (
                <div className="pipeline-arrow flex-shrink-0 w-5 text-slate-700 text-center text-xs select-none" style={{ animationDelay: `${900 + i * 180}ms` }}>
                  →
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="mt-16 flex justify-center hero-fade-in" style={{ animationDelay: '1600ms' }}>
          <div className="flex flex-col items-center gap-2 text-slate-600 text-xs font-mono">
            <span>scroll</span>
            <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PROBLEM SECTION
───────────────────────────────────────────────────────────────────────────── */
function ProblemSection() {
  const items = [
    {
      icon: '⚠',
      title: 'Cloud AI is a data liability',
      desc: 'Sending confidential inspection reports, engineering specs, or financial data to third-party AI APIs creates irrecoverable exposure.'
    },
    {
      icon: '🔒',
      title: 'Regulated industries cannot comply',
      desc: 'Industrial, defence, healthcare, and legal organisations operate under strict data residency and sovereignty requirements.'
    },
    {
      icon: '📡',
      title: 'Connectivity cannot be assumed',
      desc: 'Remote facilities, air-gapped environments, and secure facilities cannot depend on external cloud inference.'
    }
  ];

  return (
    <section id="product" className="py-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-3">The Problem</p>
          <h2 className="text-3xl font-bold text-white mb-4">Industrial AI requires a different approach</h2>
          <p className="text-slate-400 max-w-xl mb-16 text-sm leading-relaxed">
            Existing AI tools were built for consumer convenience, not enterprise sovereignty.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <Reveal key={item.title} delay={i * 120}>
              <div className="p-6 rounded-lg border border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12] transition-colors duration-300">
                <span className="text-2xl mb-4 block">{item.icon}</span>
                <h3 className="text-sm font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   WHY SOVEREIGN AI
───────────────────────────────────────────────────────────────────────────── */
function WhySovereign() {
  const pillars = [
    { label: 'LOCAL INFERENCE', desc: 'Models run entirely on your hardware — no tokens leave the premise.' },
    { label: 'LOCAL DATA', desc: 'Documents, embeddings, and outputs are stored on your infrastructure.' },
    { label: 'LOCAL RAG', desc: 'Vector retrieval, chunking and ranking happen without cloud dependencies.' },
    { label: 'EXTERNAL AI CALLS: 0', desc: 'The system makes zero outbound calls to third-party AI services.', accent: true },
  ];

  return (
    <section id="security" className="py-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-3">Sovereignty</p>
          <h2 className="text-3xl font-bold text-white mb-4">Why Sovereign AI</h2>
          <p className="text-slate-400 max-w-2xl mb-16 text-sm leading-relaxed">
            SovereignAI Workbench is designed from the ground up to operate inside your infrastructure.
            No cloud dependency. No data egress. No vendor lock-in.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {pillars.map((p, i) => (
            <Reveal key={p.label} delay={i * 100}>
              <div className={`p-5 rounded-lg border ${p.accent ? 'border-cyan-700/50 bg-cyan-950/20' : 'border-white/[0.07] bg-white/[0.02]'} h-full`}>
                <p className={`text-xs font-mono font-bold mb-3 ${p.accent ? 'text-cyan-400' : 'text-slate-300'}`}>{p.label}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   HOW IT WORKS — animated vertical pipeline
───────────────────────────────────────────────────────────────────────────── */
function HowItWorks() {
  const [ref, visible] = useScrollReveal(0.05);

  const steps = [
    { label: 'User', sub: 'Submits task with classification' },
    { label: 'Security Policy', sub: 'Sentinel validates and enforces data rules' },
    { label: 'TriForge', sub: 'Adaptive router selects optimal model path' },
    { label: 'Local Models', sub: 'On-premise LLMs execute the task' },
    { label: 'Agent', sub: 'Orchestrates tools, code, and document actions' },
    { label: 'RAG / Vision / Tools', sub: 'Retrieves evidence, processes images, runs sandboxed code' },
    { label: 'Verification', sub: 'Output is checked for consistency and accuracy' },
    { label: 'Human Approval', sub: 'HITL review gate before delivery' },
    { label: 'Deliverable', sub: 'DOCX / XLSX / PPTX report delivered locally' },
  ];

  return (
    <section id="architecture" className="py-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-3">How It Works</p>
          <h2 className="text-3xl font-bold text-white mb-4">From request to verified deliverable</h2>
          <p className="text-slate-400 max-w-xl mb-16 text-sm leading-relaxed">
            Every task passes through a structured pipeline — policy-controlled, model-routed, agent-executed, and human-approved.
          </p>
        </Reveal>

        <div ref={ref} className="max-w-xl mx-auto">
          {steps.map((step, i) => (
            <div
              key={step.label}
              className="pipeline-step flex items-start gap-4"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateX(0)' : 'translateX(-16px)',
                transition: 'opacity 0.5s ease, transform 0.5s ease',
                transitionDelay: `${i * 100}ms`,
              }}
            >
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0 ${
                  i === 0 ? 'border-cyan-500 bg-cyan-950 text-cyan-300' :
                  i === steps.length - 1 ? 'border-emerald-500 bg-emerald-950 text-emerald-300' :
                  'border-slate-700 bg-slate-900 text-slate-300'
                }`}>{i + 1}</div>
                {i < steps.length - 1 && <div className="w-px flex-1 my-1 bg-slate-800 min-h-[28px]" />}
              </div>
              <div className="pb-6">
                <p className="text-sm font-semibold text-white">{step.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{step.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   TRIFORGE — model routing diagram
───────────────────────────────────────────────────────────────────────────── */
function TriForgeSection() {
  const [ref, visible] = useScrollReveal(0.1);
  const [active, setActive] = useState(null);

  // Auto-cycle highlighting
  useEffect(() => {
    if (!visible) return;
    const models = ['coding', 'reasoning', 'vision', 'general'];
    let i = 0;
    const t = setInterval(() => { setActive(models[i % models.length]); i++; }, 900);
    return () => clearInterval(t);
  }, [visible]);

  const models = [
    { id: 'coding', label: 'Coding Model', desc: 'Python, scripts, sandbox' },
    { id: 'reasoning', label: 'Reasoning Model', desc: 'Analysis, planning' },
    { id: 'vision', label: 'Vision Model', desc: 'Images, OCR, inspection' },
    { id: 'general', label: 'General Model', desc: 'Documents, RAG, Q&A' },
  ];

  return (
    <section className="py-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-3">TriForge Router</p>
          <h2 className="text-3xl font-bold text-white mb-4">Adaptive model routing</h2>
          <p className="text-slate-400 max-w-xl mb-16 text-sm leading-relaxed">
            TriForge analyses each request and routes it to the most appropriate local model — dynamically, without cloud lookups.
          </p>
        </Reveal>

        <div ref={ref} className="flex flex-col items-center gap-8">
          {/* Request node */}
          <div
            className="px-6 py-3 rounded-md border border-violet-700/50 bg-violet-950/30 text-violet-300 text-sm font-mono font-semibold"
            style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease' }}
          >
            Incoming Request
          </div>

          {/* Arrow */}
          <div className="w-px h-6 bg-slate-700" />

          {/* TriForge box */}
          <div
            className="px-8 py-4 rounded-lg border border-cyan-700/60 bg-cyan-950/25 text-center"
            style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease', transitionDelay: '200ms' }}
          >
            <p className="text-cyan-300 font-mono font-bold text-sm">TriForge</p>
            <p className="text-[11px] text-slate-400 mt-1">Capability analysis · Confidence scoring · Route selection</p>
          </div>

          {/* Fan-out to models */}
          <div className="flex flex-wrap justify-center gap-4 w-full max-w-2xl">
            {models.map((m, i) => (
              <div
                key={m.id}
                className={`px-4 py-3 rounded-md border text-center w-36 transition-all duration-300 ${
                  active === m.id
                    ? 'border-cyan-500 bg-cyan-950/40 shadow-md shadow-cyan-900/30'
                    : 'border-white/[0.07] bg-white/[0.02]'
                }`}
                style={{
                  opacity: visible ? 1 : 0,
                  transition: 'opacity 0.5s ease, border-color 0.3s ease, background 0.3s ease',
                  transitionDelay: `${400 + i * 80}ms`,
                }}
              >
                <p className={`text-xs font-semibold ${active === m.id ? 'text-cyan-300' : 'text-slate-300'}`}>{m.label}</p>
                <p className="text-[10px] text-slate-500 mt-1">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MULTIMODAL + RAG
───────────────────────────────────────────────────────────────────────────── */
function RAGSection() {
  const steps = ['Document', 'Chunks', 'Embeddings', 'Retrieval', 'Evidence', 'Answer'];
  const [ref, visible] = useScrollReveal(0.1);

  return (
    <section className="py-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-3">Local RAG · Multimodal</p>
          <h2 className="text-3xl font-bold text-white mb-4">Evidence-grounded responses</h2>
          <p className="text-slate-400 max-w-xl mb-16 text-sm leading-relaxed">
            Documents are processed locally into a vector index. At query time, relevant evidence is retrieved and
            provided to the model — no hallucinations from memory, no data leaving the machine.
          </p>
        </Reveal>

        <div ref={ref} className="flex flex-wrap items-center justify-center gap-2">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div
                className={`px-4 py-2 rounded border text-xs font-mono transition-all duration-500 ${
                  i === 0 || i === steps.length - 1 ? 'border-cyan-700/60 bg-cyan-950/20 text-cyan-300' : 'border-white/[0.08] bg-white/[0.02] text-slate-300'
                }`}
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(12px)',
                  transition: `opacity 0.5s ease ${i * 120}ms, transform 0.5s ease ${i * 120}ms`,
                }}
              >
                {s}
              </div>
              {i < steps.length - 1 && (
                <span
                  className="text-slate-700 text-sm"
                  style={{ opacity: visible ? 1 : 0, transition: `opacity 0.4s ease ${i * 120 + 60}ms` }}
                >→</span>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'PDF & DOCX Ingestion', desc: 'Locally extracted text, tables, and images chunked for retrieval.' },
            { title: 'Vision Processing', desc: 'Inspection images and diagrams analysed by on-premise vision models.' },
            { title: 'Multimodal Fusion', desc: 'Text, vision, and structured data combined in a single reasoning pass.' },
          ].map((c, i) => (
            <Reveal key={c.title} delay={i * 100}>
              <div className="p-5 rounded-lg border border-white/[0.07] bg-white/[0.02]">
                <h3 className="text-sm font-semibold text-white mb-2">{c.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{c.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   AGENT + VERIFICATION
───────────────────────────────────────────────────────────────────────────── */
function AgentSection() {
  return (
    <section className="py-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-3">Agentic Execution</p>
          <h2 className="text-3xl font-bold text-white mb-4">Agents with oversight</h2>
          <p className="text-slate-400 max-w-xl mb-16 text-sm leading-relaxed">
            The workbench executes multi-step agentic tasks with sandboxed tool access. Every output is verified
            before human review. No autonomous delivery without approval.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Execution flow */}
          <Reveal>
            <div className="space-y-3">
              {[
                { step: 'Task Submitted', note: 'User provides task + classification level', color: 'text-slate-300' },
                { step: 'Agent Planning', note: 'Breaks task into sub-steps with tool assignments', color: 'text-slate-300' },
                { step: 'Sandboxed Execution', note: 'Python code runs in isolated local environment', color: 'text-cyan-300' },
                { step: 'Document & RAG Actions', note: 'Retrieves evidence from local vector index', color: 'text-cyan-300' },
                { step: 'Output Verification', note: 'Automated consistency check against source material', color: 'text-violet-300' },
                { step: 'Human Approval Gate', note: 'Operator reviews and approves or rejects', color: 'text-emerald-300' },
                { step: 'Deliverable Output', note: 'DOCX / XLSX / PPTX generated locally', color: 'text-emerald-300' },
              ].map((item, i) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-1 h-full min-h-[36px] flex flex-col items-center">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                      item.color === 'text-cyan-300' ? 'bg-cyan-500' :
                      item.color === 'text-violet-300' ? 'bg-violet-500' :
                      item.color === 'text-emerald-300' ? 'bg-emerald-500' :
                      'bg-slate-600'
                    }`} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${item.color}`}>{item.step}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* HITL card */}
          <Reveal delay={200}>
            <div className="p-6 rounded-lg border border-violet-800/40 bg-violet-950/10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded bg-violet-950 border border-violet-700/50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-white">Human-in-the-Loop Approval</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                No task completes without explicit human authorisation. The approval inbox presents the full output,
                verification status, and confidence metrics. Operators approve, reject, or request revision.
              </p>
              <div className="space-y-2 font-mono text-[11px]">
                {['Output presented for review', 'Verification status displayed', 'Approve / Reject / Revise', 'Full audit trail recorded'].map(item => (
                  <div key={item} className="flex items-center gap-2 text-slate-400">
                    <span className="text-emerald-400">✓</span> {item}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SECURITY SECTION
───────────────────────────────────────────────────────────────────────────── */
function SecuritySection() {
  const [ref, visible] = useScrollReveal(0.1);

  return (
    <section className="py-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-3">Security</p>
          <h2 className="text-3xl font-bold text-white mb-4">Designed for secure environments</h2>
          <p className="text-slate-400 max-w-xl mb-16 text-sm leading-relaxed">
            The Sentinel subsystem monitors all activity, enforces classification policies, and provides a real-time security posture view.
          </p>
        </Reveal>

        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Shield indicator */}
          <div
            className="flex flex-col items-center gap-6"
            style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.7s ease' }}
          >
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-2 border-emerald-700/60 bg-emerald-950/20 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border border-emerald-600/40 bg-emerald-950/30 flex items-center justify-center">
                  <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              {/* Pulse ring */}
              <div className="absolute inset-0 rounded-full border border-emerald-600/20 animate-ping" style={{ animationDuration: '2.5s' }} />
            </div>

            <div className="space-y-2 font-mono text-[11px] text-center">
              {['LOCAL INFERENCE', 'LOCAL DATA', 'LOCAL RAG', 'EXTERNAL AI CALLS: 0'].map(label => (
                <div key={label} className="px-4 py-1.5 rounded border border-emerald-800/40 bg-emerald-950/15 text-emerald-400">
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Security features list */}
          <div className="space-y-5">
            {[
              { title: 'Sentinel Monitor', desc: 'Continuous monitoring of network status, egress calls, and policy compliance. Blocks any attempt to route data externally.' },
              { title: 'Classification Enforcement', desc: 'Every task is tagged INTERNAL / CONFIDENTIAL / RESTRICTED / HIGHLY CONFIDENTIAL. Policy is applied at submission time.' },
              { title: 'AES-256 Storage', desc: 'All documents, embeddings, and outputs stored with AES-256 encryption at rest.' },
              { title: 'Immutable Audit Log', desc: 'Every action — submission, model call, approval, rejection — is written to an append-only audit trail.' },
              { title: 'Sandboxed Execution', desc: 'Python code and tool use are executed in isolated environments. No filesystem or network escape possible.' },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 80}>
                <div className="flex gap-4">
                  <div className="w-1 rounded-full bg-emerald-800/60 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   INDUSTRIAL WORKFLOW
───────────────────────────────────────────────────────────────────────────── */
function IndustrialWorkflow() {
  const [ref, visible] = useScrollReveal(0.1);

  const steps = [
    { label: 'Inspection PDF', icon: '📄' },
    { label: 'OCR / Vision', icon: '👁' },
    { label: 'RAG', icon: '🔍' },
    { label: 'TriForge Analysis', icon: '⚡' },
    { label: 'Verification', icon: '✓' },
    { label: 'HITL Approval', icon: '👤' },
    { label: 'DOCX Output', icon: '📋' },
  ];

  return (
    <section className="py-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-3">Industrial Workflow</p>
          <h2 className="text-3xl font-bold text-white mb-4">End-to-end document intelligence</h2>
          <p className="text-slate-400 max-w-xl mb-16 text-sm leading-relaxed">
            From raw inspection document to verified, approved deliverable — entirely on-premise.
          </p>
        </Reveal>

        <div ref={ref} className="flex flex-wrap items-center justify-center gap-3">
          {steps.map((s, i) => (
            <React.Fragment key={s.label}>
              <div
                className="flex flex-col items-center gap-2 w-24"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(16px)',
                  transition: `opacity 0.5s ease ${i * 100}ms, transform 0.5s ease ${i * 100}ms`,
                }}
              >
                <div className={`w-12 h-12 rounded-lg border flex items-center justify-center text-xl ${
                  i === 0 ? 'border-cyan-700/60 bg-cyan-950/20' :
                  i === steps.length - 1 ? 'border-emerald-700/60 bg-emerald-950/20' :
                  'border-white/[0.08] bg-white/[0.02]'
                }`}>
                  {s.icon}
                </div>
                <p className="text-[11px] font-mono text-slate-400 text-center leading-tight">{s.label}</p>
              </div>
              {i < steps.length - 1 && (
                <span
                  className="text-slate-700 text-lg"
                  style={{ opacity: visible ? 1 : 0, transition: `opacity 0.4s ease ${i * 100 + 60}ms` }}
                >→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CAPABILITIES
───────────────────────────────────────────────────────────────────────────── */
function Capabilities() {
  const caps = [
    { title: 'Adaptive Model Routing', desc: 'TriForge selects the best local model per task type automatically.' },
    { title: 'Local RAG', desc: 'Full vector retrieval pipeline running entirely on-premise.' },
    { title: 'Multimodal AI', desc: 'Process PDFs, images, tables, and OCR in a unified pipeline.' },
    { title: 'Agentic Execution', desc: 'Multi-step task orchestration with tool use and memory.' },
    { title: 'Sandboxed Tools', desc: 'Python and shell execution in isolated local environments.' },
    { title: 'Verification', desc: 'Automated output consistency checking before human review.' },
    { title: 'Human Approval', desc: 'Structured HITL gate with approve / reject / revise workflow.' },
    { title: 'Auditability', desc: 'Immutable, timestamped audit log of every operation.' },
    { title: 'Sovereignty', desc: 'Zero cloud dependency. All compute, data, and models stay local.' },
  ];

  return (
    <section className="py-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-3">Capabilities</p>
          <h2 className="text-3xl font-bold text-white mb-4">Core platform capabilities</h2>
          <p className="text-slate-400 max-w-xl mb-16 text-sm leading-relaxed">
            A complete agentic AI platform with everything needed for secure industrial knowledge work.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {caps.map((c, i) => (
            <Reveal key={c.title} delay={i * 60}>
              <div className="p-5 rounded-lg border border-white/[0.07] bg-white/[0.02] hover:border-cyan-800/40 hover:bg-cyan-950/5 transition-all duration-300 group h-full">
                <h3 className="text-sm font-semibold text-white mb-2 group-hover:text-cyan-300 transition-colors duration-200">{c.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{c.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   RESEARCH FOUNDATION
───────────────────────────────────────────────────────────────────────────── */
function ResearchSection() {
  const areas = [
    {
      title: 'Adaptive Multi-LLM Routing',
      desc: 'Routing strategies that match task semantics to model capability profiles, enabling efficient multi-model orchestration without cloud dependency.'
    },
    {
      title: 'Air-Gapped Local AI',
      desc: 'Architecture patterns for deploying and operating large language models in disconnected or restricted network environments using local inference engines.'
    },
    {
      title: 'Industrial AI Safety',
      desc: 'Policy enforcement, classification-aware data handling, and output verification mechanisms designed for regulated industrial contexts.'
    },
    {
      title: 'Multimodal Document Understanding',
      desc: 'Combining OCR, vision models, and structured extraction for industrial documents — inspection reports, SOPs, engineering drawings.'
    },
    {
      title: 'Agentic Orchestration',
      desc: 'Multi-step task decomposition and tool-augmented execution with state tracking, error recovery, and resource-aware scheduling.'
    },
    {
      title: 'Verification & Auditability',
      desc: 'Automated consistency checking and immutable audit logging to support accountability in high-stakes operational contexts.'
    },
  ];

  return (
    <section id="research" className="py-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-3">Research & Engineering Foundation</p>
          <h2 className="text-3xl font-bold text-white mb-4">Grounded in applied research</h2>
          <p className="text-slate-400 max-w-xl mb-16 text-sm leading-relaxed">
            SovereignAI Workbench draws from active areas of AI engineering research to address real operational challenges.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {areas.map((a, i) => (
            <Reveal key={a.title} delay={i * 80}>
              <div className="p-5 rounded-lg border border-white/[0.07] bg-white/[0.02] h-full">
                <h3 className="text-sm font-semibold text-white mb-2">{a.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{a.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   FINAL CTA
───────────────────────────────────────────────────────────────────────────── */
function FinalCTA({ onLiveUse }) {
  return (
    <section className="py-32 border-t border-white/5">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <Reveal>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-4">Get Started</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
            Ready to run AI <span className="text-cyan-400">on your terms</span>?
          </h2>
          <p className="text-slate-400 text-sm mb-10 leading-relaxed">
            Explore the source code or open the live workbench and run your first sovereign AI task.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://github.com/Sarthak752008/sovereign-ai-workbench"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-6 py-3 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-semibold transition-all duration-200 hover:border-slate-500"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub Repository
            </a>
            <button
              onClick={onLiveUse}
              className="flex items-center gap-2 px-6 py-3 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-cyan-900/30"
            >
              Live Use
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────────────────────────────────────── */
function Footer({ onLiveUse }) {
  return (
    <footer className="border-t border-white/5 py-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" strokeWidth="1.5" fill="none"/>
                  <circle cx="8" cy="8" r="2" fill="white" fillOpacity="0.9"/>
                </svg>
              </div>
              <span className="text-sm font-bold text-white">SovereignAI Workbench</span>
            </div>
            <p className="text-[11px] font-mono text-slate-500">SIH26117</p>
            <p className="text-[11px] text-slate-500 mt-2 max-w-xs leading-relaxed">
              All data, models, and execution remain on your infrastructure. No data is transmitted to external services.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-6 text-xs text-slate-500">
            <a
              href="https://github.com/Sarthak752008/sovereign-ai-workbench"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
            <button onClick={onLiveUse} className="hover:text-white transition-colors text-xs text-slate-500">
              Live Workbench
            </button>
            <span className="text-slate-600">·</span>
            <span className="text-slate-600 text-[11px]">Data Sovereignty: LOCAL ONLY</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ROOT LANDING PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const handleLiveUse = () => navigate('/workbench');

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100">
      <Navbar onLiveUse={handleLiveUse} />
      <Hero onLiveUse={handleLiveUse} />
      <ProblemSection />
      <WhySovereign />
      <HowItWorks />
      <TriForgeSection />
      <RAGSection />
      <AgentSection />
      <SecuritySection />
      <IndustrialWorkflow />
      <Capabilities />
      <ResearchSection />
      <FinalCTA onLiveUse={handleLiveUse} />
      <Footer onLiveUse={handleLiveUse} />
    </div>
  );
}
