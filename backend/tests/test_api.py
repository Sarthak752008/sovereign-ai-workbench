from fastapi.testclient import TestClient
from app.main import app
from app.router.model_router import model_router
from app.schemas.workbench import RouteRequest, TaskType, ConfidentialityLevel
from app.audit.ledger import audit_ledger

client = TestClient(app)

def test_health():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["sovereign_mode"] == "ACTIVE"
    assert data["airgap"] == "ENFORCED"

def test_sentinel():
    res = client.get("/api/v1/sentinel/status")
    assert res.status_code == 200
    data = res.json()
    assert data["external_ai_calls"] == 0
    assert data["sovereign_mode"] == "ACTIVE"

def test_list_models():
    res = client.get("/api/v1/models")
    assert res.status_code == 200
    models = res.json()
    assert len(models) >= 4
    model_ids = [m["model_id"] for m in models]
    assert "qwen2.5-coder:7b" in model_ids
    assert "llama3.1:8b" in model_ids

def test_model_router_coding():
    req = RouteRequest(task_prompt="Write a python script to parse CSV data", confidentiality=ConfidentialityLevel.INTERNAL)
    decision = model_router.route(req)
    assert decision.selected_model == "qwen2.5-coder:7b"
    assert decision.task_classification == TaskType.CODING

def test_model_router_vision():
    req = RouteRequest(task_prompt="Analyze this visual P&ID diagram image", modality="vision")
    decision = model_router.route(req)
    assert decision.selected_model == "qwen2-vl:7b"
    assert decision.task_classification == TaskType.VISION_ANALYSIS

def test_audit_ledger_integrity():
    audit_ledger.record_event(action="TEST_ACTION", details={"test": "data"})
    assert audit_ledger.verify_ledger_integrity() is True
