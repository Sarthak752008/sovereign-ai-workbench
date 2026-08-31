import os
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)

def test_flagship_inspection_workflow():
    # 1. Verify health & sentinel status
    health_res = client.get("/api/v1/health")
    assert health_res.status_code == 200
    assert health_res.json()["sovereign_mode"] == "ACTIVE"

    sentinel_res = client.get("/api/v1/sentinel/status")
    assert sentinel_res.status_code == 200
    assert sentinel_res.json()["external_ai_calls"] == 0

    # 2. Upload sample Safety SOP document
    sop_content = (
        "# SAFETY SOP-17: INDUSTRIAL PRESSURE RELIEF VALVES\n"
        "Maximum Operating Pressure Ceiling: 120.0 PSI.\n"
        "Over-pressure Threshold: Any reading exceeding 135.0 PSI constitutes a CRITICAL SAFETY DEVIATION.\n"
    )
    upload_res = client.post(
        "/api/v1/documents/upload",
        files={"file": ("Safety_SOP_Standard_Procedure.txt", sop_content.encode("utf-8"), "text/plain")}
    )
    assert upload_res.status_code == 200
    assert upload_res.json()["status"] == "success"

    # 3. Create inspection analysis task
    task_res = client.post(
        "/api/v1/tasks",
        json={
            "title": "Confidential Inspection Analysis",
            "prompt": "Analyze confidential inspection report PDF, execute python calculation for pressure metrics, and export DOCX summary",
            "confidentiality": "CONFIDENTIAL"
        }
    )
    assert task_res.status_code == 200
    task_data = task_res.json()
    task_id = task_data["task_id"]
    assert task_data["status"] == "WAITING_APPROVAL"
    assert task_data["current_step"] == "AWAITING_HUMAN_APPROVAL"

    # 4. Fetch pending approvals list
    approvals_res = client.get("/api/v1/approvals")
    assert approvals_res.status_code == 200
    approvals = approvals_res.json()
    assert len(approvals) >= 1
    
    pending_app = [a for a in approvals if a["task_id"] == task_id][0]
    app_id = pending_app["approval_id"]

    # 5. Submit Operator Approval
    decide_res = client.post(
        "/api/v1/approvals/decide",
        json={"approval_id": app_id, "decision": "approved"}
    )
    assert decide_res.status_code == 200
    assert decide_res.json()["status"] == "approved"

    # 6. Verify task is completed & DOCX deliverable is generated
    updated_task_res = client.get(f"/api/v1/tasks/{task_id}")
    assert updated_task_res.status_code == 200
    updated_task = updated_task_res.json()
    assert updated_task["status"] == "completed"
    assert updated_task["verification_passed"] is True
    assert "CRITICAL OVERPRESSURE" in updated_task["output"]
    assert "Approval_Note.docx" in updated_task["output"]

    # 7. Check generated DOCX file exists on disk
    expected_docx_path = os.path.join(settings.WORKSPACES_DIR, "Approval_Note.docx")
    assert os.path.exists(expected_docx_path) is True

    # 8. Verify audit ledger chain contains events
    audit_res = client.get("/api/v1/audit/events")
    assert audit_res.status_code == 200
    events = audit_res.json()
    actions = [e["action"] for e in events]
    assert "TASK_CREATE" in actions
    assert "APPROVAL_REQUESTED" in actions
    assert "APPROVAL_DECIDED" in actions
    assert "DOCX_GENERATED" in actions
    assert "TASK_COMPLETED" in actions
