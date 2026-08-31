# Private Knowledge Base & Local RAG Architecture

SovereignAI Workbench features a private, local-first retrieval-augmented generation (RAG) architecture.

---

## 1. Document Ingestion Pipeline

```
[Upload PDF/DOCX/XLSX/Image]
             │
             ▼
[File Type & MIME Validation]
             │
             ▼
[PyMuPDF Page Layout Extraction]
             │
             ▼ (Scanned Fallback)
[Local OCR Extraction]
             │
             ▼
[Semantic Text Chunking]
             │
             ▼
[Local Embedding Generation (nomic-embed-text)]
             │
             ▼
[Local Vector Storage Indexing]
```

---

## 2. Citation Verification

Retrieved document chunks maintain page-level metadata. The `CitationVerifier` validates generated LLM statements against source chunk text and attaches verifiable document citations (`Document.pdf, Page X`).
