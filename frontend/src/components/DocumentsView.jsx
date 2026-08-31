import React, { useState, useEffect } from 'react';
import { FileText, Upload, Trash2, Download, AlertCircle, RefreshCw, FileCheck, CheckCircle2 } from 'lucide-react';
import { fetchDocuments, uploadDocument, deleteDocument } from '../services/api';

export default function DocumentsView() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');

  const loadDocs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchDocuments();
      setDocuments(data);
    } catch (err) {
      setError('Failed to load workspace documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setStatusMsg(`Uploading & processing ${file.name}...`);
    setError('');
    try {
      const res = await uploadDocument(file);
      if (res) {
        setStatusMsg(`Uploaded ${file.name} successfully (${res.pages} pages extracted & RAG indexed).`);
        await loadDocs();
      } else {
        setError(`Failed to upload ${file.name}`);
      }
    } catch (err) {
      setError(`Error uploading ${file.name}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename) => {
    if (!confirm(`Are you sure you want to delete ${filename} from local workspace?`)) return;
    try {
      await deleteDocument(filename);
      setStatusMsg(`Deleted ${filename} from workspace.`);
      await loadDocs();
    } catch (err) {
      setError(`Failed to delete ${filename}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Upload Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60 glass-panel">
        <div>
          <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" /> Confidential Workspace Documents ({documents.length})
          </h2>
          <p className="text-xs text-slate-400">All uploaded industrial reports, SOP manuals, and generated deliverable files.</p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="cursor-pointer px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg glow-cyan transition">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Processing File...' : 'Upload Document'}</span>
            <input type="file" onChange={handleUpload} disabled={uploading} className="hidden" />
          </label>
          <button onClick={loadDocs} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {statusMsg}
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" /> {error}
        </div>
      )}

      {/* Documents List Table / Cards */}
      {loading && documents.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs font-mono space-y-2 glass-panel rounded-xl border border-slate-800">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400" />
          <p>Scanning local workspace directory...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs font-mono space-y-2 glass-panel rounded-xl border border-slate-800">
          <FileText className="w-8 h-8 mx-auto text-slate-600" />
          <p className="text-slate-400 font-semibold">No documents found in local workspace</p>
          <p className="text-[11px] text-slate-500">Upload a PDF, SOP manual, or spreadsheet to begin confidential processing.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div key={doc.filename} className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 glass-panel space-y-3 hover:border-slate-700 transition">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center font-mono text-cyan-400 text-xs font-bold uppercase">
                    {doc.extension.replace('.', '') || 'DOC'}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 font-mono truncate max-w-[170px]" title={doc.filename}>
                      {doc.filename}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono font-semibold">
                      {(doc.size_bytes / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                  STORED
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(doc.modified_at * 1000).toLocaleTimeString()}
                </span>

                <button
                  onClick={() => handleDelete(doc.filename)}
                  className="p-1.5 rounded hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
                  title="Delete file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
