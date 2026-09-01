# Sovereign On-Premise Agentic AI Workbench 🔒🤖

An air-gapped, on-premise, confidential industrial Agentic AI Workbench designed for privacy-critical enterprise and defense workflows.

## Key Features

1. **100% On-Premise & Air-Gapped**: Runs entirely locally using open-weight models (Ollama / vLLM). No cloud AI APIs required.
2. **Policy-Aware Sovereign Model Router**: Automatically routes tasks (`summarization`, `document_analysis`, `vision`, `coding`, `spreadsheet_analysis`) based on task type, complexity, confidentiality, risk level, and available hardware.
3. **Multimodal Document Intelligence**: Ingests PDFs, scanned documents, images, and spreadsheets with offline OCR and local VLM support.
4. **Sandboxed Code Execution**: Safe Python code execution in isolated sandboxes with resource limits and no network egress.
5. **Human-in-the-Loop (HITL) Approvals**: High-risk actions require explicit operator review and confirmation.
6. **Append-Only Audit Ledger**: Tamper-evident hash-chained logs tracking every prompt, tool call, routing decision, and output.
7. **Live Network Sentinel**: Real-time process socket telemetry demonstrating **`External AI Calls: 0`**.
8. **Structured Document Generators**: Exports verified outputs directly to `.docx`, `.pptx`, `.xlsx`, and code files.

## Architecture

For complete system specification, logical layers, component responsibilities, API contracts, and security flows, see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## LAN & Team Access

The workbench is configured for LAN collaboration across your team:

* **Frontend Dashboard (Teammate Access)**: 👉 [http://10.21.128.122:3000](http://10.21.128.122:3000)
* **FastAPI Backend & Swagger Docs**: 👉 [http://10.21.128.122:8000/docs](http://10.21.128.122:8000/docs)
* **Local Loopback (Server Host)**: `http://localhost:3000`

> 🔒 **Security Notice (Private Inference Engine)**:
> Ollama is kept private on the server host loopback (`127.0.0.1:11434`) and is **never exposed directly to the LAN**. All LAN clients communicate exclusively through the Sovereign FastAPI gateway, which enforces airgap policy checks, RBAC, RAG indexing, sandbox isolation, and cryptographic audit ledger logging.

## Quick Start

### 1. Local Model Engine (Ollama)
Start Ollama on the server (kept private to local loopback):
```bash
ollama serve
# Ensure Ollama binds to 127.0.0.1:11434
```

### 2. Backend Setup (FastAPI → `0.0.0.0:8000`)
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup (Vite React → `0.0.0.0:3000`)
```bash
cd frontend
npm install
npm run dev
```

### 4. Teammate Access
Teammates on the LAN can open:
```
http://10.21.128.122:3000
```

