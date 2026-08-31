# TriForge Smart Model Router Specification

TriForge is the intelligent model routing module inside SovereignAI Workbench. It evaluates incoming user tasks and deterministically selects the optimal open-weight local model.

---

## 1. Routing Signals & Scoring Criteria

1. **Task Type Classification**:
   - `coding` → `qwen2.5-coder:7b` (Code synthesis, script testing)
   - `vision_analysis` → `qwen2-vl:7b` (Scanned inspection diagrams, P&ID visual analysis)
   - `reasoning` → `deepseek-r1:8b` (Complex industrial compliance, SOP verification)
   - `document_analysis` → `deepseek-r1:8b` (Multi-page report analysis)
   - `summarization` → `llama3.1:8b` (Fast general text summarization)

2. **Confidentiality & Policy Rules**:
   - `RESTRICTED` or `HIGHLY_CONFIDENTIAL` prompts strictly enforce local air-gapped models.
   - External cloud fallbacks are explicitly prohibited.

3. **Hardware & Latency Constraints**:
   - Dynamically checks available GPU VRAM.
   - Chooses lighter models if VRAM budget is constrained.

---

## 2. Explainable Routing

Every routing decision produces an explicit explanation displayed in the UI Model Router panel:

```json
{
  "selected_model": "qwen2.5-coder:7b",
  "reason": "Task involves software engineering and script synthesis. Routed to Qwen 2.5 Coder. (Confidentiality: INTERNAL, VRAM: 8192MB free)",
  "alternatives": ["deepseek-r1:8b", "llama3.1:8b"]
}
```
