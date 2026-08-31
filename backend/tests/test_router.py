from app.router.model_router import model_router
from app.schemas.workbench import RouteRequest, TaskType, RiskLevel, ConfidentialityLevel

def test_classify_coding_task():
    task_type = model_router.classify_task("Write a python script to parse CSV data", "text")
    assert task_type == TaskType.CODING

def test_classify_vision_task():
    task_type = model_router.classify_task("Analyze this scanned P&ID engineering image", "vision")
    assert task_type == TaskType.VISION_ANALYSIS

def test_classify_spreadsheet_task():
    task_type = model_router.classify_task("Analyze this excel workbook and calculate equipment metrics", "text")
    assert task_type == TaskType.SPREADSHEET_ANALYSIS

def test_classify_reasoning_task():
    task_type = model_router.classify_task("Evaluate safety compliance and compliance risk under SOP-17", "text")
    assert task_type == TaskType.REASONING

def test_route_coding_model():
    req = RouteRequest(task_prompt="Develop python data pipeline", confidentiality=ConfidentialityLevel.INTERNAL)
    decision = model_router.route(req)
    assert decision.selected_model == "qwen2.5-coder:7b"
    assert "qwen2.5-coder:7b" in decision.reason or "Qwen" in decision.reason

def test_route_vision_model():
    req = RouteRequest(task_prompt="Inspect diagram photo", modality="vision")
    decision = model_router.route(req)
    assert decision.selected_model == "qwen2-vl:7b"

def test_route_reasoning_model():
    req = RouteRequest(task_prompt="Perform multi-step safety analysis", confidentiality=ConfidentialityLevel.RESTRICTED)
    decision = model_router.route(req)
    assert decision.selected_model == "deepseek-r1:8b"
    assert decision.risk_level == RiskLevel.HIGH

def test_route_fallback_alternatives():
    req = RouteRequest(task_prompt="Summarize meeting notes", confidentiality=ConfidentialityLevel.PUBLIC)
    decision = model_router.route(req)
    assert len(decision.alternatives) >= 2
