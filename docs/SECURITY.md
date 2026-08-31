# SovereignAI Workbench — Security & Sovereignty Architecture

## 1. Core Principles

1. **Strict Air-Gap Sovereignty**: The workbench executes 100% of LLM inference, embedding, OCR, vision processing, and vector search locally. No cloud AI APIs (OpenAI, Anthropic, Gemini) are ever invoked.
2. **Network Sentinel Telemetry**: Process-level socket monitoring verifies that `external_ai_calls` remains strictly at `0`.
3. **Data Classification & Access Enforcement**:
   - `INTERNAL`: Standard operational documents.
   - `CONFIDENTIAL`: Business and technical specifications.
   - `RESTRICTED`: High-consequence engineering and safety documents.
   - `HIGHLY_CONFIDENTIAL`: Air-gapped strictly local execution required.
4. **Human-in-the-Loop (HITL) Approval Gate**: Sensitive tool executions (`python.exec`, `file.delete`, system writes) trigger mandatory operator approval before proceeding.
5. **Tamper-Evident Audit Ledger**: All actions are logged into a SHA-256 hash-chained ledger, linking each event's cryptographic digest to the previous event's hash.

---

## 2. Security Threat Controls

| Threat | System Security Control |
| --- | --- |
| **Data Exfiltration via Model API** | Cloud model adapters strictly prohibited in gateway registry; host firewall & sentinel egress monitoring |
| **Malicious Code Execution** | Python scripts executed inside isolated sub-processes with CPU/memory limits, timeouts, and no network access |
| **Uncited / Hallucinated Outputs** | Independent Citation & Calculation Verifiers check claims against verified RAG source chunks |
| **Unauthorized High-Risk Actions** | Security Policy Engine freezes task state until human reviewer signs off via Approvals Inbox |
| **Audit Log Tampering** | SHA-256 cryptographic hash-chaining prevents backdating or modifying audit history |
