# SovereignAI Workbench — Reality Audit Report

**Audit Date:** August 31, 2026  
**Audited Target:** `sovereign-ai-workbench` codebase  

This document evaluates the codebase against the master specification to distinguish features that are **REAL** and connected to backend execution from those that are **PARTIAL**, **MOCKED**, **PLACEHOLDER**, **BROKEN**, or **NOT IMPLEMENTED**.

---

## 1. Reality Matrix

| Feature | Implementation Location | Current Status | Evidence | What is Missing | Priority |
| --- | --- | --- | --- | --- | --- |
| **FastAPI Edge API** | `backend/app/main.py`, `backend/app/api/endpoints.py` | **REAL** | `pytest` 6/6 tests passing; REST `/api/v1/health`, `/api/v1/models`, `/api/v1/sentinel/status`, `/api/v1/tasks`, `/api/v1/approvals`, `/api/v1/audit/events` functional. | WebSocket live streaming endpoint for agent token streaming. | P2 |
| **Model Router Engine (TriForge)** | `backend/app/router/model_router.py` | **REAL** | Task classifier & deterministic scoring formula routes prompts by type, risk, confidentiality, and modality. Returns reasons and fallbacks. | LLM-based dynamic task classification head; GPU VRAM live telemetry integration. | P2 |
| **Model Fabric Gateway** | `backend/app/models/gateway.py` | **PARTIAL** | HTTP client POST to `http://127.0.0.1:11434/api/generate` is implemented. | Ollama service was offline during audit; gateway catches exception and uses fallback simulated response. | P1 |
| **Model Registry** | `backend/app/models/registry.py` | **REAL** | Extensible metadata registry for `qwen2.5-coder:7b`, `llama3.1:8b`, `deepseek-r1:8b`, `qwen2-vl:7b`, and `nomic-embed-text`. | Dynamic weights discovery on local filesystem. | P3 |
| **Security Policy Engine** | `backend/app/security/policy_engine.py` | **REAL** | Evaluates data confidentiality levels and triggers `REQUIRE_APPROVAL` for sensitive tools (`python.exec`, `file.delete`). | User RBAC role permissions DB integration. | P2 |
| **Document Ingestion (PDF/TXT)** | `backend/app/ingest/document_processor.py` | **REAL** | PyMuPDF layout parsing and text extraction implemented for digital PDFs and text files. | Native DOCX/XLSX text parsing routines; scanned page image extraction for OCR. | P1 |
| **OCR Pipeline** | `backend/app/ingest/document_processor.py` | **PLACEHOLDER** | Empty PDF pages currently emit string `[OCR Scanned Page X]: Technical visual inspection diagram...`. | Integration with local Tesseract / PaddleOCR engine. | P1 |
| **Multimodal Vision VLM Pipeline** | `backend/app/router/model_router.py`, `backend/app/models/gateway.py` | **PARTIAL** | Router identifies vision prompts and selects `qwen2-vl:7b`. | Direct base64 image encoding transmission in Ollama `/api/generate` payload. | P1 |
| **Local Knowledge RAG Store** | `backend/app/rag/vector_store.py` | **PARTIAL** | In-memory text chunk storage and keyword overlap search implemented with page citations. | ChromaDB / pgvector embedded vector database with dense embeddings (`nomic-embed-text`). | P2 |
| **Citation Attribution** | `backend/app/rag/vector_store.py`, `backend/app/verification/verifier.py` | **REAL** | Formats chunk IDs, source document names, and page numbers. | Source chunk text exact substring matching verifier. | P2 |
| **ReAct Agent Orchestrator** | `backend/app/agent/orchestrator.py` | **REAL** | Executes graph loop (`PLAN` → `ACT` → `OBSERVE` → `VERIFY` → `COMPLETE`). | Multi-agent collaboration graph (Planner, Drafter, Critic). | P3 |
| **Python Code Execution Sandbox** | `backend/app/sandbox/python_sandbox.py` | **PARTIAL** | Subprocess execution with isolated temp directory, 10s timeout, and stdout/stderr capture. | OS-level Docker container sandbox with disabled network interface. | P1 |
| **Document Exporters** | `backend/app/tools/tool_registry.py` | **REAL** | Native `.docx`, `.pptx`, and `.xlsx` document generators using `python-docx`, `python-pptx`, and `openpyxl`. | ReportLab PDF generator. | P3 |
| **Verification Engine** | `backend/app/verification/verifier.py` | **REAL** | Independent `CodeVerifier`, `CalculationVerifier`, and `CitationVerifier`. | Automated unit test generation & test execution inside sandbox. | P2 |
| **Human-in-the-Loop (HITL) Approvals** | `backend/app/agent/orchestrator.py`, `frontend/src/components/ApprovalInbox.jsx` | **PARTIAL** | Task pauses on `python.exec` and creates approval ticket. `decide_approval` updates task state to completed. | Resuming execution of actual pending code payload and generating `.docx` output upon approval. | P1 |
| **SHA-256 Audit Ledger** | `backend/app/audit/ledger.py` | **REAL** | Cryptographic SHA-256 hash chaining linked to `prev_hash` with `verify_ledger_integrity()`. | SQLite WAL append-only persistent storage table. | P2 |
| **Network Sentinel Telemetry** | `backend/app/sentinel/network_sentinel.py` | **PARTIAL** | Endpoint `/api/v1/sentinel/status` returns active local models and zero egress status. | Live OS socket sampling (`netstat` / TCP table) to detect WAN exfiltration attempts. | P2 |
| **Enterprise Dark Dashboard (UI)** | `frontend/src/App.jsx`, `frontend/src/components/*` | **REAL** | React 18 dashboard connected to backend APIs via `frontend/src/services/api.js`. Live TopBar isolation badge, Model Router panel, Agent timeline, HITL inbox, Audit explorer. | Visual workflow canvas builder page. | P3 |

---

## 2. Top 10 Priority Issues to Fix for Flagship Hackathon Demo

1. **Flagship Inspection Workflow Integration (P1)**:
   - Ensure the end-to-end inspection PDF workflow runs seamlessly from upload → TriForge routing → local RAG search → Python calculation → HITL approval → `.docx` document generation.

2. **HITL Approval Resume Execution (P1)**:
   - Update `decide_approval()` in `AgentOrchestrator` to execute the actual pending code in `python_sandbox` and generate the `.docx` report upon human operator sign-off instead of setting a mock text string.

3. **OCR Engine Integration (P1)**:
   - Connect `DocumentProcessor` to Tesseract / PaddleOCR so scanned PDF pages extract real text instead of placeholder fallback text.

4. **Docker Execution Sandbox Hardening (P1)**:
   - Wrap `PythonSandbox` in a Docker execution container with disabled network (`--net=none`), CPU/memory limits, and filesystem boundaries.

5. **Multimodal VLM Image Transmission (P1)**:
   - Connect image/scanned PDF page renderings as base64 images into `LocalModelGateway` for `qwen2-vl:7b`.

6. **ChromaDB / Embedded Vector Database Upgrade (P2)**:
   - Replace in-memory keyword overlap with ChromaDB embedded vector store using `nomic-embed-text` embeddings.

7. **Network Sentinel OS Socket Telemetry (P2)**:
   - Implement process socket sampling (`psutil` / TCP socket table) in `NetworkSentinel` to prove `external_ai_calls: 0` empirically.

8. **Automated Integration Test Expansion (P2)**:
   - Expand unit/integration test coverage from 6 tests to 30+ tests covering RAG, OCR, Router fallbacks, Policy Engine rules, Sandbox security bounds, and E2E Inspection PDF workflow.

9. **Persistence Layer (P2)**:
   - Persist audit events, tasks, approvals, and model registry metadata to SQLite / PostgreSQL database tables.

10. **Offline Flagship Demo Script & Rehearsal (P3)**:
    - Package `sample_data/` inspection PDF, SOP document, and execution script for seamless offline judge demonstration.
