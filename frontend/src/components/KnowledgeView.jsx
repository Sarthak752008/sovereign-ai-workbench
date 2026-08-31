import React, { useState, useEffect } from 'react';
import { Database, Search, FileText, CheckCircle2, AlertCircle, RefreshCw, Hash, BookOpen } from 'lucide-react';
import { fetchKnowledgeChunks, searchKnowledge } from '../services/api';

export default function KnowledgeView() {
  const [chunks, setChunks] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const loadChunks = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchKnowledgeChunks();
      setChunks(data);
    } catch (err) {
      setError('Failed to load local vector index chunks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChunks();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const results = await searchKnowledge(query);
      setSearchResults(results);
    } catch (err) {
      setError('Error searching local vector database');
    } finally {
      setSearching(false);
    }
  };

  const displayedChunks = searchResults || chunks;

  return (
    <div className="space-y-6">
      {/* Header & Search Bar */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 glass-panel space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" /> Local Vector Knowledge Base & RAG Index
            </h2>
            <p className="text-xs text-slate-400">Search indexed SOP sections, technical manuals, and chunk citations stored in local vector index.</p>
          </div>
          <button onClick={loadChunks} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search local vector index (e.g. 'Pressure relief valve inspection SOP', 'Operating temperature ceiling')..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-mono flex items-center gap-2 shadow glow-cyan transition disabled:opacity-50"
          >
            {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Vector Search</span>
          </button>
        </form>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" /> {error}
        </div>
      )}

      {/* RAG Chunks Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs font-mono space-y-2 glass-panel rounded-xl border border-slate-800">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400" />
          <p>Querying local vector store index...</p>
        </div>
      ) : displayedChunks.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs font-mono space-y-2 glass-panel rounded-xl border border-slate-800">
          <BookOpen className="w-8 h-8 mx-auto text-slate-600" />
          <p className="text-slate-400 font-semibold">No indexed knowledge chunks found</p>
          <p className="text-[11px] text-slate-500">Upload a PDF or SOP manual to index chunks into the local vector database.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400 px-1">
            <span>{searchResults ? `SEARCH HITS (${displayedChunks.length})` : `INDEXED VECTOR CHUNKS (${displayedChunks.length})`}</span>
            <span>EMBEDDINGS: NOMIC-EMBED-TEXT (LOCAL)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedChunks.map((chunk, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 glass-panel space-y-2.5">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="font-bold text-cyan-300 flex items-center gap-1.5 truncate max-w-[200px]" title={chunk.filename}>
                    <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    {chunk.filename}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400 font-mono">
                    Page {chunk.page || 1}
                  </span>
                </div>

                <p className="text-xs text-slate-200 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800/80 leading-relaxed max-h-32 overflow-y-auto">
                  {chunk.text}
                </p>

                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3 text-slate-600" /> {chunk.chunk_id}
                  </span>
                  <span className="text-emerald-400 font-semibold">LOCAL VECTOR GROUNDED</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
