# SovereignAI Workbench — API Specification

Base Path: `/api/v1`

---

## 1. System & Security Endpoints

### GET `/api/v1/health`
Returns system health status and airgap mode.

**Response:**
```json
{
  "status": "ok",
  "sovereign_mode": "ACTIVE",
  "airgap": "ENFORCED"
}
```

### GET `/api/v1/sentinel/status`
Returns real-time Network Sentinel status proving zero external AI calls.

**Response:**
```json
{
  "sovereign_mode": "ACTIVE",
  "network_status": "BLOCKED",
  "local_inference": "ACTIVE",
  "external_ai_calls": 0,
  "external_dns_requests": 0,
  "cloud_ai_requests": 0,
  "last_egress_check": "2026-08-31T11:20:00Z",
  "active_local_models": [
    "Qwen 2.5 Coder 7B (Local)",
    "Llama 3.1 8B Instruct (Local)",
    "Qwen 2 VL 7B Vision (Local)",
    "DeepSeek R1 8B Reasoning (Local)"
  ]
}
```

---

## 2. Local Model & TriForge Router Endpoints

### GET `/api/v1/models`
Lists all registered local models and capabilities.

### POST `/api/v1/router/route`
Evaluates a task prompt and returns deterministic model routing decision.

**Request Body:**
```json
{
  "task_prompt": "Analyze inspection report PDF and execute python calculation",
  "confidentiality": "CONFIDENTIAL",
  "modality": "text"
}
```

**Response:**
```json
{
  "selected_model": "deepseek-r1:8b",
  "reason": "Task requires multi-step industrial reasoning and compliance logic. Routed to DeepSeek R1.",
  "alternatives": ["llama3.1:8b", "qwen2.5-coder:7b"],
  "policy_decision": "ALLOW",
  "estimated_latency_ms": 450,
  "task_classification": "reasoning",
  "risk_level": "MEDIUM"
}
```

---

## 3. Agent Tasks & Document Endpoints

### POST `/api/v1/tasks`
Creates and executes an agent task.

### GET `/api/v1/tasks`
Lists all submitted agent tasks and execution status.

### POST `/api/v1/documents/upload`
Uploads a document (PDF, DOCX, XLSX, TXT, image) into local workspace and indexes chunks into vector DB.

---

## 4. Human Approvals & Audit Ledger Endpoints

### GET `/api/v1/approvals`
Lists pending Human-in-the-Loop (HITL) approval tickets.

### POST `/api/v1/approvals/decide`
Submits approval or rejection for a pending high-risk tool call.

### GET `/api/v1/audit/events`
Returns tamper-evident SHA-256 hash-chained audit logs.
