import os
from typing import List, Dict, Any
from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from app.schemas.workbench import (
    RouteRequest,
    RouteDecision,
    RegisteredModel,
    SentinelStatus,
    ApprovalRequest,
    ApprovalDecision,
    AuditEvent,
    TaskCreateRequest,
    TaskResponse
)
from app.router.model_router import model_router
from app.models.registry import model_registry
from app.sentinel.network_sentinel import network_sentinel
from app.audit.ledger import audit_ledger
from app.agent.orchestrator import agent_orchestrator
from app.ingest.document_processor import document_processor
from app.rag.vector_store import vector_store
from app.core.config import settings

router = APIRouter()

@router.get("/health")
async def health_check():
    return {"status": "ok", "sovereign_mode": "ACTIVE", "airgap": "ENFORCED"}

@router.get("/sentinel/status", response_model=SentinelStatus)
async def get_sentinel_status():
    return network_sentinel.get_status()

@router.get("/models", response_model=List[RegisteredModel])
async def list_models():
    return model_registry.list_models()

@router.post("/models", response_model=RegisteredModel)
async def register_model(model: RegisteredModel):
    return model_registry.register_model(model)

@router.post("/router/route", response_model=RouteDecision)
async def route_task(request: RouteRequest):
    return model_router.route(request)

@router.post("/tasks", response_model=TaskResponse)
async def create_task(request: TaskCreateRequest):
    return await agent_orchestrator.create_task(request)

@router.get("/tasks", response_model=List[TaskResponse])
async def list_tasks():
    return agent_orchestrator.list_tasks()

@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str):
    task = agent_orchestrator.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.get("/approvals", response_model=List[ApprovalRequest])
async def list_approvals():
    return agent_orchestrator.list_approvals()

@router.post("/approvals/decide", response_model=ApprovalRequest)
async def decide_approval(decision: ApprovalDecision):
    app_req = agent_orchestrator.decide_approval(decision.approval_id, decision.decision)
    if not app_req:
        raise HTTPException(status_code=404, detail="Approval request not found")
    return app_req

@router.get("/audit/events", response_model=List[AuditEvent])
async def list_audit_events():
    return audit_ledger.get_events()

@router.get("/documents")
async def list_documents():
    docs = []
    if os.path.exists(settings.WORKSPACES_DIR):
        for fname in os.listdir(settings.WORKSPACES_DIR):
            fpath = os.path.join(settings.WORKSPACES_DIR, fname)
            if os.path.isfile(fpath):
                stat = os.stat(fpath)
                docs.append({
                    "filename": fname,
                    "size_bytes": stat.st_size,
                    "modified_at": stat.st_mtime,
                    "extension": os.path.splitext(fname)[1].lower()
                })
    return docs

@router.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    save_path = os.path.join(settings.WORKSPACES_DIR, file.filename)
    with open(save_path, "wb") as f:
        content = await file.read()
        f.write(content)
        
    doc_data = document_processor.process_file(save_path, file.filename)
    vector_store.ingest_document(doc_data)
    
    audit_ledger.record_event(
        action="DOCUMENT_UPLOAD",
        document=file.filename,
        details={"size": len(content), "pages": doc_data["pages"]}
    )
    return {"status": "success", "filename": file.filename, "pages": doc_data["pages"]}

@router.delete("/documents/{filename}")
async def delete_document(filename: str):
    fpath = os.path.join(settings.WORKSPACES_DIR, filename)
    if os.path.exists(fpath):
        os.remove(fpath)
        audit_ledger.record_event(action="DOCUMENT_DELETE", document=filename)
        return {"status": "success", "filename": filename}
    raise HTTPException(status_code=404, detail="File not found")

@router.get("/knowledge/chunks")
async def list_knowledge_chunks():
    return vector_store.list_chunks()

@router.post("/knowledge/search")
async def search_knowledge(payload: Dict[str, Any] = Body(...)):
    query = payload.get("query", "")
    top_k = payload.get("top_k", 5)
    return vector_store.search(query, top_k=top_k)
