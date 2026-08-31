# SovereignAI Workbench — Flagship Hackathon Demo Guide

## Flagship Demo #1: Confidential Inspection Report → Approval Note

### Scenario
Upload a confidential scanned industrial inspection report. Ask SovereignAI Workbench to analyze findings against internal safety SOPs, perform Python risk calculation, verify citations, request operator approval for high-risk actions, and generate an official `.docx` approval note.

### Demo Steps

1. **Check Sovereignty Badge**:
   - Observe TopBar: `EXTERNAL AI CALLS: 0`, `NETWORK: BLOCKED`, `SOVEREIGN MODE: ACTIVE`.

2. **Upload Scanned Inspection Report**:
   - Click **Upload PDF / SOP** button in the dashboard.
   - Select `sample_data/scanned_inspection_report.pdf`.
   - Local OCR & layout processor parses document pages and indexes chunks into the vector store.

3. **Submit Inspection Task**:
   - Click **Demo: Inspection Workflow** button.
   - Prompt: *"Analyze confidential inspection report PDF, execute python calculation for pressure metrics, and export DOCX summary"*.

4. **Observe TriForge Smart Model Router**:
   - Router classifies task as `REASONING / DOCUMENT_ANALYSIS`.
   - Selected Model: **DeepSeek R1 8B / Qwen 2.5 Coder**.
   - Displays routing reasons and fallback models.

5. **Observe Human-in-the-Loop (HITL) Approval Gate**:
   - Agent requests high-risk tool call `python.exec`.
   - Task enters `WAITING_APPROVAL` status.
   - Navigate to **Approvals Inbox**.
   - Click **Approve Execution**.

6. **Verify Output & Artifact Generation**:
   - Code sandbox executes calculation.
   - Citation Verifier verifies SOP references.
   - `.docx` report is saved to `data/workspaces/Approval_Note.docx`.

7. **Inspect Audit Ledger & Security Sentinel**:
   - Open **Audit Logs** to view the cryptographic SHA-256 hash chain.
   - Open **Security Center** to confirm **`External AI Calls: 0`**.
