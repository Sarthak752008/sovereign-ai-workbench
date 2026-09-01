# Sovereign AI Workbench — Stable Setup Guide

## Quick Start

### One-Command Startup
```batch
start_workbench.bat
```

This will:
1. ✅ Check Python, Node.js, and Ollama are installed
2. ✅ Start Ollama if not already running
3. ✅ Install Python/npm dependencies if needed
4. ✅ Start the backend on `http://localhost:8000`
5. ✅ Start the frontend on `http://localhost:3000`
6. ✅ Open your browser automatically

### One-Command Stop
```batch
stop_workbench.bat
```

This safely stops the frontend and backend. Ollama is left running (it may be system-managed).

---

## Services & Ports

| Service   | Port  | URL                                      |
|-----------|-------|------------------------------------------|
| Frontend  | 3000  | http://localhost:3000                     |
| Backend   | 8000  | http://localhost:8000                     |
| API Docs  | 8000  | http://localhost:8000/docs                |
| Health    | 8000  | http://localhost:8000/api/v1/system/health|
| Ollama    | 11434 | http://127.0.0.1:11434 (loopback only)   |

---

## Troubleshooting

### Port Conflicts

If you see "Address already in use" errors:

**Check what's using a port:**
```batch
netstat -ano | findstr ":8000 "
netstat -ano | findstr ":3000 "
netstat -ano | findstr ":11434 "
```

**If it's your own workbench process:** `start_workbench.bat` will detect and reuse it.

**If it's another application:** Stop that application first, or change the port in `.env`.

**Force stop all workbench processes:**
```batch
stop_workbench.bat
```

### Ollama Not Running

If the health check shows "DEGRADED — Ollama offline":

```batch
:: Start Ollama
ollama serve

:: Verify it's running
ollama list

:: Pull a model if needed
ollama pull llama3.1:8b
```

### Backend Won't Start

1. Check Python dependencies:
   ```batch
   cd backend
   pip install -r requirements.txt
   ```

2. Check the `.env` file exists in the project root (copy from `.env.example`).

3. Verify the backend starts manually:
   ```batch
   cd backend
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend Won't Start

1. Check Node.js is installed: `node --version`
2. Install dependencies:
   ```batch
   cd frontend
   npm install
   ```
3. Start manually:
   ```batch
   cd frontend
   npm run dev
   ```

---

## Local-Only Mode (Default)

By default, the workbench runs in **LOCAL_ONLY** mode:

- All AI inference stays on your machine via Ollama
- No data is sent to cloud providers
- No API keys are required
- The `ALLOW_EXTERNAL_AI_CALLS` flag is `false`

This is the recommended mode for confidential/industrial data.

---

## LAN Mode

To access the workbench from other machines on your network:

1. The backend binds to `0.0.0.0:8000` by default (accessible on LAN)
2. The frontend binds to `0.0.0.0:3000` by default
3. Set `VITE_API_BASE_URL` in `frontend/.env` to your LAN IP:
   ```
   VITE_API_BASE_URL=http://10.21.128.122:8000
   ```
4. Access the UI from other machines at `http://<your-lan-ip>:3000`

> **Note:** Ollama stays on `127.0.0.1:11434` (loopback only) and is never exposed to LAN.

---

## Environment Variables

Copy `.env.example` to `.env` in the project root:

```batch
copy .env.example .env
```

### Key Variables

| Variable                  | Default                        | Description |
|---------------------------|--------------------------------|-------------|
| `HOST`                    | `0.0.0.0`                      | Backend bind address |
| `PORT`                    | `8000`                         | Backend port |
| `OLLAMA_BASE_URL`         | `http://127.0.0.1:11434`       | Ollama API URL |
| `CLOUD_POLICY`            | `LOCAL_ONLY`                   | Cloud provider policy |
| `GEMINI_API_KEY`          | *(empty)*                      | Google Gemini key (optional) |
| `GROQ_API_KEY`            | *(empty)*                      | Groq key (optional) |
| `ALLOW_EXTERNAL_AI_CALLS` | `false`                        | Master switch for external calls |

---

## Cloud Provider Policy

The workbench supports two cloud provider policies:

### `LOCAL_ONLY` (Default)
- All inference stays local
- Cloud providers cannot be used even if API keys are configured
- Recommended for confidential data

### `CLOUD_ALLOWED_PUBLIC_ONLY`
- Cloud providers (Gemini, Groq) can be used **only for PUBLIC or INTERNAL data**
- CONFIDENTIAL, RESTRICTED, HIGHLY_CONFIDENTIAL, and CRITICAL data **always stays local**
- The system enforces this policy at the API level — it cannot be bypassed from the frontend

### Configuring Cloud Providers

1. Add your API keys to `.env` (server-side only):
   ```
   GEMINI_API_KEY=your_actual_key_here
   GROQ_API_KEY=your_actual_key_here
   ```

2. Change policy via Settings UI or API:
   ```
   POST /api/v1/system/policy
   {"cloud_policy": "CLOUD_ALLOWED_PUBLIC_ONLY"}
   ```

> **Security:** API keys are NEVER exposed to the frontend, logs, or screenshots. They are read exclusively from server-side environment variables.

---

## Security Notes

### API Keys
- Store API keys **only** in `.env` (which is `.gitignore`'d)
- Never commit `.env` to Git
- Never display keys in logs, frontend, screenshots, or documentation
- The backend reads keys from environment variables only

### Data Classification
- All data defaults to `CONFIDENTIAL` classification
- Higher classifications (`RESTRICTED`, `HIGHLY_CONFIDENTIAL`) enforce stricter policies
- Cloud providers are blocked for anything above `INTERNAL` classification

### Audit Trail
- Every action is logged to a tamper-evident SHA-256 hash-chained audit ledger
- Audit events include: model used, provider, timestamps, policy decisions
- View audit logs via the Audit tab in the UI or `GET /api/v1/audit/events`

### Sandbox Execution
- Python code execution runs in an isolated sandbox
- Docker isolation (if available): `--net=none`, 512MB RAM, 1 CPU
- Subprocess isolation (fallback): isolated temp directory with cleared PYTHONPATH
- High-risk tool calls require human operator approval (HITL)

---

## Health Check API

```
GET /api/v1/system/health
```

Returns real status for all services:

```json
{
  "status": "READY",
  "reason": "All systems operational",
  "cloud_policy": "LOCAL_ONLY",
  "services": {
    "backend": {"status": "ok"},
    "ollama": {"status": "online", "models": ["llama3.1:8b"]},
    "rag": {"status": "ok", "chunks": 1},
    "storage": {"status": "ok"},
    "sandbox": {"status": "ok", "mode": "process_isolated"},
    "cloud_providers": {
      "gemini": {"configured": false},
      "groq": {"configured": false}
    }
  }
}
```

Status values:
- **READY**: All critical services running
- **DEGRADED**: Some services down (e.g., Ollama offline)
- **FAILED**: Critical failure

---

## Data Persistence

The following data persists across restarts:

| Data               | Location                  | Persists? |
|--------------------|---------------------------|-----------|
| Uploaded documents | `backend/data/workspaces/`| ✅ Yes    |
| RAG vector index   | `backend/data/indexes/`   | ✅ Yes    |
| Generated reports  | `backend/data/workspaces/`| ✅ Yes    |
| Audit logs         | In-memory                 | ❌ Session |
| Task history       | In-memory                 | ❌ Session |
| Model configuration| `backend/data/indexes/`   | ✅ Yes    |

Only the "New Report / Reset Session" button clears session-specific state. Normal restarts preserve documents and RAG data.
