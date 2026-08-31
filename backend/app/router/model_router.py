import re
from typing import List
from app.schemas.workbench import (
    RouteRequest,
    RouteDecision,
    TaskType,
    RiskLevel,
    ConfidentialityLevel
)
from app.models.registry import model_registry
from app.security.policy_engine import policy_engine

class SovereignModelRouter:
    """
    Policy-aware Model Router.
    Deterministically selects appropriate local model based on prompt content, modality, complexity, and risk.
    """
    def classify_task(self, prompt: str, modality: str) -> TaskType:
        prompt_lower = prompt.lower()
        if modality == "vision" or any(w in prompt_lower for w in ["image", "photo", "drawing", "diagram", "p&id", "scanned", "ocr"]):
            return TaskType.VISION_ANALYSIS
        if any(w in prompt_lower for w in ["code", "python", "script", "function", "bug", "algorithm", "developer", "git"]):
            return TaskType.CODING
        if any(w in prompt_lower for w in ["excel", "xlsx", "spreadsheet", "csv", "table", "calculation", "formula", "financial"]):
            return TaskType.SPREADSHEET_ANALYSIS
        if any(w in prompt_lower for w in ["analyze", "risk", "compliance", "policy", "reason", "proof", "evaluate"]):
            return TaskType.REASONING
        if any(w in prompt_lower for w in ["report", "document", "pdf", "docx", "manual", "sop", "extract"]):
            return TaskType.DOCUMENT_ANALYSIS
        return TaskType.SUMMARIZATION

    def route(self, request: RouteRequest) -> RouteDecision:
        # 1. Classify task
        task_type = request.task_type or self.classify_task(request.task_prompt, request.modality)
        
        # 2. Determine risk level
        risk_level = RiskLevel.LOW
        if task_type in [TaskType.CODING, TaskType.SPREADSHEET_ANALYSIS]:
            risk_level = RiskLevel.MEDIUM
        if request.confidentiality in [ConfidentialityLevel.RESTRICTED, ConfidentialityLevel.HIGHLY_CONFIDENTIAL]:
            risk_level = RiskLevel.HIGH

        # 3. Policy evaluation
        policy_eval = policy_engine.evaluate(
            task_prompt=request.task_prompt,
            confidentiality=request.confidentiality
        )

        # 4. Model selection strategy
        available = model_registry.list_models()
        selected_model = "llama3.1:8b"
        reason = ""
        alternatives: List[str] = []

        if task_type == TaskType.VISION_ANALYSIS:
            selected_model = "qwen2-vl:7b"
            reason = "Task contains visual/scanned elements. Routed to local Vision-Language Model Qwen 2 VL."
            alternatives = ["llama3.1:8b"]
        elif task_type == TaskType.CODING:
            selected_model = "qwen2.5-coder:7b"
            reason = "Task involves software engineering and script synthesis. Routed to Qwen 2.5 Coder."
            alternatives = ["deepseek-r1:8b", "llama3.1:8b"]
        elif task_type in [TaskType.REASONING, TaskType.DOCUMENT_ANALYSIS]:
            selected_model = "deepseek-r1:8b"
            reason = "Task requires multi-step industrial reasoning and compliance logic. Routed to DeepSeek R1."
            alternatives = ["llama3.1:8b", "qwen2.5-coder:7b"]
        else:
            selected_model = "llama3.1:8b"
            reason = "General text & summarization task. Routed to efficient Llama 3.1 8B Instruct."
            alternatives = ["qwen2.5-coder:7b", "deepseek-r1:8b"]

        return RouteDecision(
            selected_model=selected_model,
            reason=f"{reason} (Confidentiality: {request.confidentiality.value}, VRAM: {request.gpu_vram_free_mb}MB free)",
            alternatives=alternatives,
            policy_decision=policy_eval.decision,
            estimated_latency_ms=450,
            task_classification=task_type,
            risk_level=risk_level
        )

model_router = SovereignModelRouter()
