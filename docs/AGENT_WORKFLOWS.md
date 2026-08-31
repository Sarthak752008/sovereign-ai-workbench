# Sovereign Agent Workflows & Tool Runtime

The Sovereign AI Orchestrator executes agent tasks using a ReAct graph state machine:

```
[USER TASK]
     │
     ▼
[TASK CLASSIFY & POLICY CHECK]
     │
     ▼
[TRIFORGE MODEL ROUTING]
     │
     ▼
[AGENT PLANNING & TOOL SELECTION]
     │
     ├────────► [RAG Knowledge Search]
     ├────────► [PyMuPDF / OCR Extraction]
     ├────────► [Python Execution Sandbox] (Requires HITL if High Risk)
     └────────► [Document Generator: DOCX/PPTX/XLSX]
     │
     ▼
[VERIFICATION ENGINE (Code/Calculation/Citation)]
     │
     ▼
[FINAL VERIFIED ARTIFACT & AUDIT LOG]
```

---

## Controlled Tool Suite

| Tool Name | Capability | Risk Level |
| --- | --- | --- |
| `search_knowledge` | Queries local vector store for SOPs and manuals | LOW |
| `execute_python_code` | Executes script inside isolated Python sandbox | HIGH (HITL Required) |
| `generate_docx` | Produces formatted `.docx` approval notes and reports | MEDIUM |
| `generate_pptx` | Generates executive presentation slides | MEDIUM |
| `generate_xlsx` | Exports structured spreadsheet analysis and formulas | MEDIUM |
