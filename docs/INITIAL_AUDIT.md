# Initial Repository Audit

**Project Name:** SovereignAI Workbench (SIH26117)  
**Subtitle:** Private Agentic AI for Confidential Industrial Work  
**Module Integration:** TriForge Smart Model Router Engine  

---

## 1. Current Architecture Overview

The repository currently implements a 100% on-premise, air-gapped architecture organized cleanly into frontend and backend layers:

- **Frontend (`frontend/`)**: Vite + React 18 + Tailwind CSS dark enterprise dashboard.
  - **`TopBar.jsx`**: Displays Sovereign Mode, Network Status (`BLOCKED`), Local Inference (`ACTIVE`), and live `EXTERNAL AI CALLS: 0`.
  - **`Sidebar.jsx`**: Navigation across Workbench, Tasks, Documents & Knowledge, Local Models, Approvals, Audit Logs, Security & Sentinel, and Settings.
  - **`ModelRouterPanel.jsx`**: Real-time TriForge Smart Router explanation showing task classification, selected model, alternatives, and routing reasons.
  - **`AgentActivityPanel.jsx`**: Live execution plan step trace, tool activity, and verified outputs.
  - **`ApprovalInbox.jsx`**: Human-in-the-Loop (HITL) ticket review with Approval / Rejection controls.
  - **`AuditExplorer.jsx`**: Cryptographic SHA-256 hash-chained log viewer.
  - **`api.js`**: REST service abstraction connecting to the FastAPI backend.

- **Backend (`backend/app/`)**: FastAPI Python backend with modular components:
  - **`main.py` & `api/endpoints.py`**: OpenAPI endpoint routing with CORS support.
  - **`models/gateway.py` & `registry.py`**: Local model fabric abstraction (Ollama & OpenAI-compatible local servers) supporting `qwen2.5-coder:7b`, `llama3.1:8b`, `deepseek-r1:8b`, `qwen2-vl:7b`, and `nomic-embed-text`.
  - **`router/model_router.py`**: TriForge Smart Model Routing engine providing task classification (`summarization`, `document_analysis`, `vision_analysis`, `coding`, `spreadsheet_analysis`, `reasoning`) and policy-aware scoring.
  - **`security/policy_engine.py`**: Access control rules for confidentiality levels (`INTERNAL`, `CONFIDENTIAL`, `RESTRICTED`, `HIGHLY_CONFIDENTIAL`) and high-risk tool HITL gates.
  - **`ingest/document_processor.py`**: Offline document extraction supporting PDF, DOCX, TXT, XLSX with PyMuPDF layout parsing and OCR fallback.
  - **`rag/vector_store.py`**: Local vector knowledge index for semantic search and page-level citation attribution.
  - **`sandbox/python_sandbox.py`**: Isolated Python execution sandbox with CPU/memory limits, execution timeouts, and no network egress.
  - **`tools/tool_registry.py`**: Controlled local tools (`search_knowledge`, `execute_python_code`, `generate_docx`, `generate_pptx`, `generate_xlsx`).
  - **`agent/orchestrator.py`**: ReAct state-machine agent orchestrator (`PLAN` → `ACT` → `OBSERVE` → `VERIFY` → `COMPLETE`).
  - **`verification/verifier.py`**: Independent `CodeVerifier`, `CalculationVerifier`, and `CitationVerifier`.
  - **`audit/ledger.py`**: Cryptographic SHA-256 hash-chained audit log.
  - **`sentinel/network_sentinel.py`**: Live network socket telemetry proving `External AI Calls: 0`.

---

## 2. Reusable Components & TriForge Integration

- **TriForge Router (`backend/app/router/model_router.py`)**: Seamlessly integrated as the intelligent core routing module inside SovereignAI Workbench. It analyzes task requirements, modality, confidentiality, risk level, and hardware capabilities to select optimal local open-weight models.
- **Verification Engine (`backend/app/verification/verifier.py`)**: Reusable verification subsystem for independent check of LLM code generation and calculations.
- **Document Exporters (`backend/app/tools/tool_registry.py`)**: Native file generators producing real `.docx`, `.pptx`, `.xlsx`, and code deliverables.

---

## 3. Identified Technical Debt & Roadmap Plan

1. **Database Persistence**: Ensure PostgreSQL + pgvector support alongside SQLite embedded storage for scale.
2. **Dockerization**: Create Docker Compose deployment manifest (`docker-compose.yml`) for one-command local startup.
3. **Multimodal Sample Data**: Provide pre-built sample datasets (`sample_data/`) including scanned inspection reports, SOP manuals, maintenance spreadsheets, and P&ID diagrams for instant hackathon judge demonstration.
4. **Complete Documentation Suite**: Finalize `ARCHITECTURE.md`, `API.md`, `SECURITY.md`, `MODEL_ROUTING.md`, `AGENT_WORKFLOWS.md`, `RAG.md`, `DEPLOYMENT.md`, and `DEMO.md`.

---

## 4. Execution Roadmap Order

- **Phase 0**: Initial Audit, Documentation Suite & Sample Data setup.
- **Phase 1**: Sample Data Seeding & Pre-packaged Flagship Scenarios (`sample_data/`).
- **Phase 2**: Docker & Docker Compose Containerization (`docker-compose.yml`, `Dockerfile.backend`, `Dockerfile.frontend`).
- **Phase 3**: End-to-End Demonstration Scripting & Verification (`docs/DEMO.md`).
