# Sovereign On-Premise Agentic AI Workbench

## Architecture Specification

**Status:** Design (no implementation in this document)  
**Audience:** Hackathon team + future production maintainers  
**Constraint:** Entire system runs locally. No external AI API is required. Model serving, embeddings, OCR, vision, retrieval, and tooling stay on-premise.

---

## 1. Design principles

1. **Sovereignty by default.** Inference, embeddings, storage, and tools never leave the host or the customer network. Cloud AI providers are not part of the runtime.
2. **Policy before tokens.** Routing, tool access, and output generation are gated by policy, not by model preference.
3. **Prove isolation.** The UI must show live evidence of zero unauthorized external network calls, not a marketing claim.
4. **Pluggable models.** New local models are registered, not forked into the orchestrator.
5. **Human authority on high risk.** Destructive, irreversible, or confidentiality-elevating actions pause for approval.
6. **Audit every action.** Prompts, tool calls, routing decisions, approvals, and artifacts are attributable and tamper-evident.
7. **Demo now, production later.** MVP uses simpler local runtimes (single host, SQLite, Ollama). Interfaces stay stable so vLLM, Postgres, and multi-GPU can drop in.

---

## 2. System context

The workbench is a **control plane + agent runtime + local model fabric** for confidential industrial work (engineering, quality, legal, operations). Users interact through a local web UI. All compute stays on a workstation or on-prem cluster.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        Customer / air-gapped network                     │
│                                                                          │
│   Operator UI ──► API Gateway ──► Orchestrator ──► Policy + Router       │
│                         │                │                │              │
│                         │                ▼                ▼              │
│                         │         Agent Runtime     Model Fabric         │
│                         │                │          (Ollama/vLLM/…)      │
│                         │                ▼                               │
│                         │         Tool Runtime                           │
│                         │         (files, RAG, OCR, vision,              │
│                         │          sandbox, sheets, docs)                │
│                         ▼                                                │
│              Audit • Store • Network Sentinel                            │
└──────────────────────────────────────────────────────────────────────────┘
         ▲
         │  No required path
         ✕  External AI APIs (OpenAI, Anthropic, cloud embeddings, etc.)
```

Optional outbound network (if the operator explicitly enables it, never for inference): package mirrors, model file download during admin setup, NTP. The **inference path is always local**. The Network Sentinel treats unexpected egress as a violation.

---

## 3. Logical architecture

Seven layers. Each layer has a stable interface so implementations can be swapped.

| Layer | Purpose |
| ----- | ------- |
| **L0 Isolation** | Host firewall, egress allowlist, Network Sentinel telemetry |
| **L1 Experience** | Workbench UI, approval inbox, audit explorer, model registry UI |
| **L2 Control plane** | REST/WebSocket API, authn/z, session, job control |
| **L3 Orchestration** | Task intake, agent graphs, HITL, artifact assembly |
| **L4 Policy & routing** | Classification, policy evaluation, model selection, risk scoring |
| **L5 Capabilities** | Model adapters, tools, retrieval, multimodal ingest, exporters |
| **L6 Persistence** | Relational store, object store, vector index, append-only audit |

```
┌─────────────────────────────────────────────────────────────────┐
│ L1  Workbench UI   Approvals   Audit   Models   Isolation badge │
├─────────────────────────────────────────────────────────────────┤
│ L2  API Gateway  (REST + WS)   Auth   Rate limits   Contracts   │
├─────────────────────────────────────────────────────────────────┤
│ L3  Session Manager   Agent Orchestrator   Job / Artifact Mgr   │
├──────────────┬──────────────────────────────┬───────────────────┤
│ L4 Policy    │ L4 Router                    │ L4 Risk / HITL    │
│ Engine       │ (task, complexity, modality, │ Gate              │
│              │  confidentiality, GPU, SLA)  │                   │
├──────────────┴──────────────────────────────┴───────────────────┤
│ L5  Model Fabric   Tool Runtime   Ingest   Knowledge   Export   │
├─────────────────────────────────────────────────────────────────┤
│ L6  Postgres/SQLite   Files/MinIO   Qdrant/Chroma   Audit log   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Component responsibilities

### 4.1 Workbench UI (`apps/web`)

- Chat / project workbench with streaming tokens and tool-call traces.
- **Isolation badge:** live “external AI calls = 0” plus last egress check timestamp.
- Approval inbox: pending high-risk actions with diffs / command previews.
- Model catalog: registered local models, health, VRAM, capabilities.
- Audit explorer: filter by user, session, tool, risk, artifact.
- Artifact panel: download DOCX/PPTX/XLSX/code from a run.

Does **not** talk to model servers directly. All traffic goes through the control-plane API.

### 4.2 API Gateway (`services/gateway`)

- Authenticate local users (MVP: local accounts; later: OIDC/LDAP).
- Authorize by role (Operator, Reviewer, Admin, Auditor).
- Validate request contracts; attach `request_id` / `trace_id`.
- WebSocket for token/tool streaming.
- Enforce max upload size, MIME allowlist, workspace path sandbox.

### 4.3 Session & project manager (`services/control`)

- Projects, workspaces (directory roots), threads, runs.
- Confidentiality label on project (e.g. `internal`, `confidential`, `restricted`).
- Binds a run to a workspace so file tools cannot escape the root.

### 4.4 Agent orchestrator (`services/orchestrator`)

- Turns a user task into an agent graph (plan → act → observe → iterate).
- Maintains working memory for the run (messages, tool results, citations).
- Invokes the router **before each model call**.
- Invokes the HITL gate **before high-risk tools**.
- Emits structured events to Audit and to the UI stream.
- Stops on policy deny, budget exhaustion, or user cancel.

### 4.5 Task classifier (`services/router` — classify)

- Infers: task type, complexity, required modality, language, expected output.
- Does **not** require a cloud classifier. MVP: rules + small local model. Advanced: dedicated local classifier head.

### 4.6 Policy engine (`services/policy`)

- Evaluates: confidentiality, data classes in the prompt/files, user role, tool risk, destination (always local).
- Outputs: allow / deny / require_approval, plus constraints (no code exec, no write outside workspace, force small local model, disable vision export, etc.).
- Policies are versioned files (YAML) + DB snapshot of the version used on each run.

### 4.7 Model router (`services/router`)

Selects a **model adapter + model id + decoding profile** using:

| Signal | Source |
| ------ | ------ |
| Task type | classifier (summarize, extract, code, vision-QA, spreadsheet, generate-doc, plan) |
| Complexity | token estimate, multi-step need, reasoning flag |
| Modality | text / image / PDF / table |
| Confidentiality | project label + detected entities |
| Risk | policy score + tool plan |
| GPU availability | Resource manager (VRAM free, queue) |
| Latency SLO | user/session preference + model p50/p95 |

Supports: primary candidate, fallbacks, explicit pin (`model_id` override by Admin only), and **never** a remote SaaS adapter in the default registry.

### 4.8 Model fabric (`services/models`)

- Adapter interface: `complete`, `stream`, `embed`, `vision` (optional).
- Implementations: Ollama, llama.cpp HTTP, vLLM OpenAI-compatible (local), optional TensorRT-LLM later.
- Health checks, unload/load hints, context-length and modality metadata.
- **Model registry** is data, not code: adding a model is a registry row + weights on disk.

### 4.9 Resource manager (`services/resources`)

- Inventories GPUs/CPU RAM.
- Tracks in-flight VRAM reservations.
- Feeds the router (e.g. 8B on GPU 0 if 70B does not fit).

### 4.10 Tool runtime (`services/tools`)

Each tool is a plugin with: name, schema, risk class, timeout, sandbox profile.

| Tool | Responsibility | Risk class (default) |
| ---- | -------------- | -------------------- |
| `file.read` | Read under workspace root | low |
| `file.write` | Write under workspace root | medium |
| `file.delete` | Delete under workspace | high |
| `knowledge.search` | Local RAG query | low |
| `knowledge.ingest` | Chunk + embed into project index | medium |
| `ocr.extract` | OCR images/scanned PDFs | low |
| `vision.analyze` | Local VLM on images/pages | low–medium |
| `python.exec` | Sandboxed Python | high |
| `spreadsheet.read` / `.write` | XLSX/CSV | medium |
| `doc.generate` | DOCX/PPTX/XLSX/code export | medium |
| `shell.exec` | **Not in MVP.** Future, always high + approval | critical |

### 4.11 Ingest pipeline (`services/ingest`)

- PDF (native text + layout), scanned PDF → OCR, images, Office files.
- Produces: normalized text, page images, tables, metadata, PII/classification hints.
- Feeds knowledge index and agent context (with size budgets).

### 4.12 Knowledge plane (`services/knowledge`)

- Chunking, local embeddings, vector search, hybrid BM25+vector (advanced).
- Collection per project. No shared index across confidentiality labels unless policy allows.

### 4.13 Artifact exporters (`services/export`)

- DOCX, PPTX, XLSX, code zip, markdown.
- Templates stored locally. Citation footer optional for RAG-backed docs.

### 4.14 HITL / approval service (`services/approvals`)

- Creates an approval ticket with: action, risk, preview, policy clause, expiry.
- Blocks the orchestrator until approve / deny / timeout.
- Reviewer role can be distinct from the operator.

### 4.15 Audit ledger (`services/audit`)

- Append-only events: auth, routing, model call metadata (not necessarily full weights), tool I/O hashes, approvals, policy version, network sentinel samples.
- Hash-chained rows for tamper evidence (MVP: hash of previous row; advanced: signed batches).
- Redaction rules for displaying secrets in the UI; raw blobs stored encrypted at rest if configured.

### 4.16 Network Sentinel (`services/sentinel`)

- Periodically samples process/socket egress (host-level).
- Classifies destinations: localhost / private LAN / unexpected WAN.
- Publishes: `external_ai_calls = 0`, `unexpected_egress_count`, last probe time.
- UI fails **closed** visually: if sentinel is down, badge is “unverified”, not “secure”.

### 4.17 Identity (`services/identity`)

- Local users, roles, API tokens for automation.
- Session binding to audit actor.

---

## 5. API boundaries

All public APIs are served by the gateway. Internal services communicate over localhost (MVP: in-process modules or HTTP on loopback). No service binds a model port to a public interface in production defaults.

### 5.1 External (UI / local clients)

Base: `http://127.0.0.1:<port>/api/v1`

| Method | Path | Purpose |
| ------ | ---- | ------- |
| POST | `/auth/login` | Local session |
| GET | `/me` | Identity + roles |
| GET/POST | `/projects` | Project CRUD |
| GET/PATCH | `/projects/{id}` | Labels, workspace root |
| POST | `/projects/{id}/files` | Upload into workspace |
| GET | `/projects/{id}/files` | List workspace |
| POST | `/threads` | New conversation |
| POST | `/threads/{id}/runs` | Start agent run |
| GET | `/runs/{id}` | Status, selected model, risk |
| WS | `/runs/{id}/events` | Tokens, tool events, approvals |
| POST | `/runs/{id}/cancel` | Stop |
| GET | `/approvals` | Inbox |
| POST | `/approvals/{id}/decide` | approve / deny + comment |
| GET | `/models` | Registry + health |
| POST | `/models` | Register local model (Admin) |
| POST | `/models/{id}/health` | Probe |
| GET | `/audit/events` | Query (Auditor+) |
| GET | `/sentinel/status` | Isolation proof payload |
| GET | `/artifacts/{id}` | Download generated file |

### 5.2 Internal contracts (not exposed to browser)

| Interface | Owner | Consumer | Notes |
| --------- | ----- | -------- | ----- |
| `Router.route(RouteRequest) → RouteDecision` | router | orchestrator | Must be called per model invocation |
| `Policy.evaluate(PolicyInput) → PolicyDecision` | policy | orchestrator, tools | Deny wins |
| `ModelAdapter.stream(CompletionRequest)` | models | orchestrator | Local only |
| `Tool.invoke(ToolCall) → ToolResult` | tools | orchestrator | Sandboxed |
| `Audit.append(Event)` | audit | everyone | Sync, fail-loud in production |
| `Sentinel.snapshot() → SentinelStatus` | sentinel | gateway | Cached 1–5s |

### 5.3 `RouteRequest` / `RouteDecision` (canonical)

**RouteRequest:** `task_type`, `complexity`, `modalities[]`, `confidentiality`, `risk`, `max_latency_ms`, `gpu_hints`, `context_tokens`, `tools_planned[]`, `project_id`, `policy_version`.

**RouteDecision:** `model_id`, `adapter`, `reason[]`, `fallbacks[]`, `decoding_profile`, `constraints[]`, `policy_ref`.

### 5.4 Versioning

- API version in path (`/api/v1`).
- Policy and prompt templates versioned; run stores the versions used.
- Model registry schema version independent of adapter implementation.

---

## 6. Data flow

### 6.1 Document / multimodal ingest

```
User upload
    → Gateway (MIME, size, malware stub)
    → Workspace object store (content-addressed blob)
    → Ingest: detect type
         ├─ digital PDF → text + tables
         ├─ scanned PDF / image → OCR (+ optional VLM)
         └─ xlsx/csv → sheet extractor
    → Classification hints (confidential patterns)
    → Optional knowledge.ingest (chunk → embed local → vector DB)
    → Audit: file_ingested (hash, pages, ocr_engine)
```

### 6.2 Interactive run (happy path)

```
UI run request
    → AuthZ + project confidentiality
    → Orchestrator creates Run
    → Classifier + Policy
    → Router selects model
    → Agent loop:
         model stream → UI
         tool calls → Tool runtime → results into memory
         knowledge hits → citations
    → Exporters if requested
    → Run completed + artifacts
    → Audit closed
```

### 6.3 Isolation proof data flow

```
OS sockets / process table
    → Sentinel sampler
    → Classify dest (loopback, RFC1918, other)
    → Status record
    → GET /sentinel/status
    → UI badge (zero external AI; unexpected WAN highlighted)
```

---

## 7. Agent flow

Agents are **graphs**, not a single prompt. MVP uses a ReAct-style loop with explicit HITL nodes. Advanced uses multi-agent (planner, researcher, drafter, critic) still on the same orchestrator.

```
                    ┌─────────────┐
                    │  User task  │
                    └──────┬──────┘
                           ▼
                    ┌─────────────┐
              ┌─────│  Classify   │
              │     └──────┬──────┘
              │            ▼
              │     ┌─────────────┐
              │     │   Policy    │──deny──► Fail run (audited)
              │     └──────┬──────┘
              │            ▼
              │     ┌─────────────┐
              │     │   Route     │  (model + constraints)
              │     └──────┬──────┘
              │            ▼
              │     ┌─────────────┐
              │     │   Plan      │  (optional local planner model)
              │     └──────┬──────┘
              │            ▼
              │     ┌─────────────┐     need tool
              └──►  │    Act      │────────────┐
                    └──────┬──────┘            ▼
                           │            ┌─────────────┐
                           │            │ Risk class? │
                           │            └──────┬──────┘
                           │         low/med   │    high/critical
                           │            ▼      │         ▼
                           │         Invoke    │   Approval ticket
                           │         tool      │         │
                           │            ▼      │    approve / deny
                           │         Observe   │         │
                           │            └──────┴─────────┘
                           ▼
                    Budget / done?
                     no → Act again (re-route if modality/risk changed)
                     yes → Synthesize + Export → Complete
```

**Rules:**

- Re-route when modality changes (e.g. first text, then image page).
- Tool schemas are the only way the model reaches the filesystem or Python.
- Python sandbox has no network, limited CPU/RAM, no workspace escape.
- Max steps / max tokens / max tool calls are run budgets.

**Demo agent recipes (prebuilt graphs):**

1. Confidential document Q&A (RAG + citations).
2. Scanned PDF → structured extraction → XLSX.
3. Engineering note → DOCX/PPTX pack.
4. Spreadsheet analysis (pandas in sandbox) → charts in PPTX.
5. Local code generation into workspace (with approval on write/exec).

---

## 8. Model routing flow

```
RouteRequest
    → Filter registry by:
         required modality (text/vision/embed)
         confidentiality ceiling (model allowed for this label)
         min context window
         adapter health == up
    → Score survivors:
         task_affinity (declared capabilities)
         complexity vs size (small/medium/large)
         estimated latency vs SLO
         VRAM fit (resource manager)
         load / queue
    → Apply policy constraints (force_local, ban_python, pin_family)
    → Pick primary + ordered fallbacks
    → Persist RouteDecision on the run/step
    → If all fail: error, do not silently call a cloud API
```

**Example mapping (illustrative, not a vendor lock):**

| Situation | Typical choice |
| --------- | -------------- |
| Fast classify / route assist | 1–3B instruct, CPU or small GPU |
| RAG answer, confidential | 7–14B instruct |
| Hard reasoning / long plan | 32B+ or MoE if VRAM allows; else 14B + more steps |
| OCR-heavy / page vision | Local VLM (e.g. Qwen2-VL / LLaVA class) |
| Embeddings | Dedicated embed model (nomic / bge class) |
| GPU busy | Smaller model or queued job; UI shows wait |

**Adding a model without redesign:**

1. Place weights on local disk (or Ollama pull on an admin-controlled machine).
2. `POST /models` with: id, adapter, endpoint (loopback), modalities, size, VRAM, task tags, confidentiality max, latency hints.
3. Optional routing weight in policy YAML.
4. Health probe. Router includes it on next request.

No orchestrator code change. No UI rewrite. Adapter code only if the **serving engine** is new (e.g. first-time TensorRT).

---

## 9. Security flow

```
Request
  → TLS optional on loopback; TLS required if bound beyond localhost
  → Authenticate
  → Authorize (RBAC + project membership)
  → Workspace path canonicalization (reject `..`, symlinks out)
  → Policy evaluate (data class + action)
  → If tool risk ≥ high: freeze → approval
  → Execute in sandbox (seccomp/job object / no-net)
  → Hash inputs/outputs → audit chain
  → Sentinel records that no WAN AI occurred
```

**Controls:**

| Threat | Control |
| ------ | ------- |
| Data exfil via model API | No cloud adapters; sentinel + deny unknown egress |
| Prompt injection → `file.delete` | High-risk tools always HITL; path allowlist |
| Sandbox breakout | No network in Python; drop privileges; workspace chroot/job |
| Model substitution | Registry signed by Admin; adapter endpoint must be loopback/private |
| Audit tampering | Hash chain; Auditor role read-only; optional WORM volume |
| Cross-project leak | Separate vector collections; gateway scoped queries |
| Supply chain | Pin model hashes in registry; record digest on each load |

**Secrets:** API tokens and local passwords hashed; never sent to models. Tool results may be redacted in UI for Auditor vs Operator views.

---

## 10. Folder structure

Hackathon-friendly monorepo. Services can start as Python packages behind one FastAPI process, then split.

```
sovereign-ai-workbench/
├── docs/
│   └── ARCHITECTURE.md          # this file
├── apps/
│   └── web/                     # Workbench UI (Vite + React + TS)
├── services/
│   ├── gateway/                 # HTTP/WS edge
│   ├── control/                 # projects, threads, runs
│   ├── orchestrator/            # agent graphs
│   ├── policy/                  # YAML policies + evaluator
│   ├── router/                  # classifier + scorer
│   ├── models/                  # adapters + registry client
│   ├── tools/                   # tool plugins
│   ├── ingest/                  # PDF/OCR/office
│   ├── knowledge/               # chunk, embed, retrieve
│   ├── export/                  # docx/pptx/xlsx/code
│   ├── approvals/               # HITL tickets
│   ├── audit/                   # ledger
│   ├── sentinel/                # egress proof
│   ├── resources/               # GPU/CPU inventory
│   └── identity/                # users, roles
├── packages/
│   ├── contracts/               # OpenAPI + JSON schemas + pydantic
│   └── policy-packs/            # default industrial policies
├── adapters/
│   ├── ollama/
│   ├── llamacpp/
│   └── vllm/                    # local OpenAI-compatible
├── models/                      # optional local weights dir (gitignored)
├── data/
│   ├── workspaces/              # per-project files
│   ├── blobs/                   # content-addressed
│   └── indexes/                 # vector segments if file-backed
├── policies/                    # deployed policy YAML
├── tests/
│   ├── contract/
│   ├── policy/
│   ├── router/
│   └── isolation/               # sentinel / no-egress tests
├── scripts/                     # dev up, model register, demo seed
├── deploy/
│   ├── compose.yml              # optional: qdrant, ollama
│   └── airgap/                  # offline install notes
├── .env.example                 # local paths only, no cloud keys
└── README.md
```

MVP may collapse `services/*` into `backend/app/{gateway,orchestrator,...}` with the same module names so a later split is mechanical.

---

## 11. Database entities

Relational store holds control-plane state. Blobs live on disk. Vectors live in the vector DB. IDs are UUIDs.

### 11.1 Identity & access

- **User:** id, username, password_hash, role, created_at, disabled
- **ApiToken:** id, user_id, hash, scope, expires_at
- **ProjectMember:** project_id, user_id, role

### 11.2 Workspaces & files

- **Project:** id, name, confidentiality (`internal` \| `confidential` \| `restricted`), workspace_path, created_by, created_at
- **Blob:** id, sha256, size, mime, storage_path, created_at
- **FileNode:** id, project_id, blob_id, relative_path, kind, ingested_at

### 11.3 Conversation & runs

- **Thread:** id, project_id, title, created_by, created_at
- **Run:** id, thread_id, status, user_task, classifier_json, policy_version, started_at, ended_at, error
- **RunStep:** id, run_id, seq, type (`llm` \| `tool` \| `approval` \| `route`), input_hash, output_hash, started_at, ended_at
- **Message:** id, thread_id, run_id, role, content_ref, created_at

### 11.4 Routing & models

- **Model:** id, display_name, adapter, endpoint, modalities[], context_length, param_size, vram_mb, task_tags[], confidentiality_max, latency_p50_ms, digest_sha256, enabled
- **RouteDecision:** id, run_id, step_id, request_json, model_id, reason_json, fallbacks_json, created_at
- **GpuSnapshot:** id, captured_at, devices_json (VRAM free/used)

### 11.5 Policy & approvals

- **PolicyVersion:** id, version, sha256, body (YAML), created_at
- **Approval:** id, run_id, step_id, tool_name, risk, preview_ref, status (`pending` \| `approved` \| `denied` \| `expired`), requested_by, decided_by, decided_at, comment

### 11.6 Knowledge & artifacts

- **KnowledgeCollection:** id, project_id, embed_model_id
- **Chunk:** id, collection_id, file_node_id, ordinal, text_ref, vector_ref, metadata_json
- **Artifact:** id, run_id, kind (`docx` \| `pptx` \| `xlsx` \| `code` \| `md`), blob_id, filename

### 11.7 Audit & sentinel

- **AuditEvent:** id, prev_hash, hash, at, actor_id, trace_id, kind, payload_json (or payload_ref), project_id, run_id
- **SentinelSample:** id, at, loopback_ok, private_ok, unexpected_egress, details_json, external_ai_calls (always 0 if compliant)

### 11.8 Entity relationships (summary)

```
User ──┬── ProjectMember ── Project ── FileNode ── Blob
       │                      │
       │                      ├── KnowledgeCollection ── Chunk
       │                      └── Thread ── Run ── RunStep
       │                                    ├── RouteDecision ── Model
       │                                    ├── Approval
       │                                    ├── Artifact
       │                                    └── AuditEvent
PolicyVersion is referenced by Run
SentinelSample is standalone time-series
```

---

## 12. Recommended open-source technologies

Chosen for **local-first**, **hackathon speed**, and a **clean production upgrade path**.

| Concern | MVP (demo weekend) | Production-oriented next step |
| ------- | ------------------ | ----------------------------- |
| UI | React 18+, TypeScript, Vite, a11y-friendly component library | Same; optional Tauri/desktop wrapper |
| API | Python 3.12, FastAPI, Pydantic v2, Uvicorn | Split services; OpenAPI generated from `packages/contracts` |
| Agent graphs | LangGraph (self-contained, no SaaS) or a small custom loop | LangGraph + durable checkpointer on Postgres |
| Local LLMs | **Ollama** (fastest multi-model DX) | **vLLM** or **llama.cpp** server for throughput/control |
| Vision | Ollama VLM (Qwen2-VL / LLaVA-class) | Dedicated VLM endpoint; page renderer (PyMuPDF) |
| Embeddings | `nomic-embed-text` or BGE via Ollama | Same weights on TEI / vLLM embed |
| Vector DB | **Chroma** (embedded) or **Qdrant** single container | Qdrant HA / pgvector if ops prefers one DB |
| Relational | **SQLite** (WAL) | **PostgreSQL** |
| Search hybrid | Optional: BM25 via sqlite FTS5 | Qdrant sparse + dense or OpenSearch local |
| PDF | PyMuPDF / pypdf | Unstructured (local) for messy layouts |
| OCR | **Tesseract** or **PaddleOCR** (fully offline) | PaddleOCR + layout model |
| Spreadsheets | pandas, openpyxl | Same |
| DOCX/PPTX | python-docx, python-pptx | Same + org templates |
| Python sandbox | Restricted subprocess: no net, timeout, tempdir; Windows Job Objects | gVisor / Firecracker / nsjail on Linux |
| Auth | Local users, session cookies, RBAC | Keycloak / LDAP / mTLS between services |
| Audit | Hash-chained SQLite table | Postgres + WORM / signed batches |
| Isolation proof | Sentinel polling `netstat`/Windows TCP table; allowlist localhost | eBPF/Windows ETW + default-deny firewall |
| Packaging | docker compose **optional**; native GPU on host for demo | Offline installer, signed artifacts |
| Observability | Structured JSON logs | OpenTelemetry **local** collector (no cloud export) |

**Explicit non-goals for default runtime:** OpenAI API, Anthropic, Gemini, cloud embeddings, cloud OCR, SaaS vector DBs.

**Suggested demo model set (operator-downloadable, not bundled in git):**

- Small instruct (routing/classify assist)
- 7–14B general instruct
- Embedding model
- One VLM for scans/images

Exact names are left to GPU VRAM; the registry is the source of truth.

---

## 13. MVP vs advanced features

### 13.1 MVP (hackathon demo — must show)

- Single-host, loopback UI + API.
- Local auth (1–2 roles: Operator, Admin).
- Ollama adapter + at least **two** chat models + **one** embed + **one** VLM **or** OCR path.
- Policy-aware router with visible **reason** in the UI (task, confidentiality, VRAM, latency).
- One agent graph: ingest PDF/image → retrieve or OCR → answer / extract → export XLSX or DOCX.
- Tools: file read/write (workspace), knowledge search/ingest, OCR, spreadsheet read/write, document generate, Python sandbox (tight).
- HITL on `python.exec`, `file.delete`, and writes that match “high risk” policy.
- Append-only audit viewer.
- Network Sentinel badge: **External AI calls: 0**, last check time, unexpected egress = 0.
- Register a third model via Admin UI without code change.

### 13.2 Advanced (post-demo, architecture already allows)

- Multi-agent graphs (planner / critic).
- vLLM + multi-GPU, speculative decoding, prefix cache.
- Hybrid search, rerankers (local).
- LDAP/OIDC, step-up auth for approvals.
- Signed model registry, SBOM, air-gap installer.
- Durable orchestration, run resume after crash.
- Fine-grained DLP (local NER) feeding policy.
- Shell tool with dual approval.
- High-availability Qdrant/Postgres.
- Formal evaluation harness for routing quality.
- Desktop wrapper and kiosk mode for shop-floor.
- Confidential computing (GPU TEE) if hardware exists.

---

## 14. Development order

Build **vertical slices** that stay demoable after each step.

### Phase 0 — Skeleton (half day)

1. Monorepo layout, contracts package, FastAPI hello, Vite UI shell.
2. SQLite schema: User, Project, Thread, Run, AuditEvent, Model, SentinelSample.
3. Isolation badge wired to a **stub** sentinel (always 0) so the UI contract exists.

### Phase 1 — Local models without agents

4. Ollama adapter + model registry seed.
5. Streaming chat through gateway (no tools).
6. Admin: list models, health, register model.

### Phase 2 — Policy + router (the differentiator)

7. Classifier (rules + optional small model).
8. Policy YAML (confidentiality, tool risk).
9. Router scoring + persist `RouteDecision`.
10. UI panel: “why this model”.

### Phase 3 — Tools + multimodal

11. Workspace file tools + path sandbox.
12. Ingest PDF/images; Tesseract/PaddleOCR.
13. Knowledge ingest/search (Chroma + local embed).
14. Spreadsheet + DOCX/PPTX export.
15. Python sandbox (no network).

### Phase 4 — Agents + HITL + audit

16. Orchestrator loop (plan/act/observe) with per-step routing.
17. Approval tickets for high-risk tools; UI inbox.
18. Audit explorer (hash chain visible).

### Phase 5 — Prove sovereignty

19. Real Network Sentinel (host socket sampling).
20. Demo script: show WAN blocked / unused; badge stays 0 during a full agent run.
21. Seed industrial demo: scanned SOP + spreadsheet + generated briefing deck.

### Phase 6 — Hardening if time

22. Resource manager (VRAM) influencing router.
23. Fallbacks when GPU busy.
24. Tests: policy deny, path escape, no cloud adapter in registry, sentinel.

**Critical path for judges:** Phase 2 + Phase 5 + one multimodal agent (Phase 3–4). If time is short, cut multi-export formats to DOCX+XLSX only; keep router reasons and the isolation badge.

---

## 15. Hackathon demo narrative (architecture-aligned)

1. **Show the badge:** External AI calls = 0 before any prompt.
2. **Register / switch models** live; router explanation updates.
3. **Drop a scanned PDF** (confidential project). OCR + local VLM/RAG. No upload to the internet.
4. **Agent** extracts a table → XLSX; drafts a PPTX/DOCX.
5. **Trigger Python** or delete → approval inbox → approve → audit row.
6. **Open audit:** routing reasons, tool hashes, policy version, sentinel samples still 0.

---

## 16. Non-functional targets (demo vs production)

| NFR | Demo | Production intent |
| --- | ---- | ----------------- |
| Deployment | One Windows/Linux GPU box | On-prem VM/K8s, air-gap |
| Latency | Interactive streaming | SLO-aware routing |
| Availability | Best effort | Checkpoints, retries, local HA |
| Tenancy | Single org, few users | Projects as hard isolation |
| Evidence | Sentinel + audit UI | Exportable compliance pack |

---

## 17. Open decisions (do not block MVP)

- LangGraph vs minimal custom orchestrator (both fit; LangGraph speeds HITL nodes).
- Chroma vs Qdrant on day one (Chroma simpler; Qdrant if demo already uses Docker).
- Tesseract vs PaddleOCR (Paddle better on industrial scans; Tesseract easier to install).
- Whether the classifier is pure rules for the demo (acceptable) or a tiny local model.

These are implementation choices behind the interfaces in §5.

---

## 18. Summary

The workbench is a **local control plane**: a policy-aware router in front of a pluggable model fabric, an auditable agent runtime with sandboxed tools, and a Network Sentinel that makes sovereignty visible. MVP implements one process, SQLite, Ollama, and a thin UI; production replaces storage, serving, and isolation machinery **without changing the API or routing/policy contracts**.
