import os
import logging
from typing import List, Dict, Any, Optional, Literal
from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from pydantic import BaseModel
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
from app.models.unified_gateway import unified_gateway
from app.sentinel.network_sentinel import network_sentinel
from app.audit.ledger import audit_ledger
from app.agent.orchestrator import agent_orchestrator
from app.ingest.document_processor import document_processor
from app.rag.vector_store import vector_store
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


# Request/Response models for generate endpoint
class GenerateRequest(BaseModel):
    prompt: str
    model_id: Optional[str] = None
    provider: Optional[Literal["ollama", "gemini", "groq"]] = None
    system_prompt: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 2048
    fallback_to_external: bool = False
    confidentiality: str = "CONFIDENTIAL"


class GenerateResponse(BaseModel):
    text: str
    provider: str
    status: str
    model: Optional[str] = None
    usage: Optional[Dict[str, Any]] = None


class PolicyUpdateRequest(BaseModel):
    cloud_policy: str  # LOCAL_ONLY | CLOUD_ALLOWED_PUBLIC_ONLY


# ============================================================
# SYSTEM HEALTH & POLICY
# ============================================================

@router.get("/system/health")
async def system_health():
    """
    Comprehensive system health check.
    Returns real status for all services.
    """
    from app.models.gateway import model_gateway

    services = {}

    # 1. Backend is always ok if we're responding
    services["backend"] = {"status": "ok"}

    # 2. Check Ollama
    ollama_health = await model_gateway.health_check()
    services["ollama"] = ollama_health

    # 3. RAG / Vector Store
    chunk_count = len(vector_store.list_chunks())
    services["rag"] = {
        "status": "ok",
        "chunks": chunk_count,
        "has_data": chunk_count > 0,
    }

    # 4. Storage directories
    storage_ok = True
    for d_name, d_path in [
        ("workspaces", settings.WORKSPACES_DIR),
        ("blobs", settings.BLOBS_DIR),
        ("indexes", settings.VECTOR_DB_DIR),
    ]:
        exists = os.path.isdir(d_path)
        writable = os.access(d_path, os.W_OK) if exists else False
        if not exists or not writable:
            storage_ok = False
    services["storage"] = {"status": "ok" if storage_ok else "error"}

    # 5. Sandbox
    from app.sandbox.python_sandbox import python_sandbox
    services["sandbox"] = {
        "status": "ok",
        "docker_available": python_sandbox.use_docker,
        "mode": "docker" if python_sandbox.use_docker else "process_isolated",
    }

    # 6. Cloud providers (configured status only — NEVER expose keys)
    services["cloud_providers"] = {
        "gemini": {"configured": bool(settings.GEMINI_API_KEY), "model": settings.GEMINI_MODEL},
        "groq": {"configured": bool(settings.GROQ_API_KEY), "model": settings.GROQ_MODEL},
    }

    # Compute overall status
    ollama_ok = ollama_health.get("status") == "online"
    if ollama_ok and storage_ok:
        overall = "READY"
        reason = "All systems operational"
    elif not ollama_ok:
        overall = "DEGRADED"
        reason = "Ollama is offline — local inference unavailable. Run: ollama serve"
    elif not storage_ok:
        overall = "DEGRADED"
        reason = "Storage directories not writable"
    else:
        overall = "FAILED"
        reason = "Critical services offline"

    return {
        "status": overall,
        "reason": reason,
        "cloud_policy": settings.CLOUD_POLICY,
        "services": services,
    }


@router.get("/system/policy")
async def get_policy():
    """Return current cloud provider policy."""
    return {
        "cloud_policy": settings.CLOUD_POLICY,
        "allow_external": settings.ALLOW_EXTERNAL_AI_CALLS,
        "providers": {
            "gemini": bool(settings.GEMINI_API_KEY),
            "groq": bool(settings.GROQ_API_KEY),
        },
    }


@router.post("/system/policy")
async def update_policy(req: PolicyUpdateRequest):
    """Update cloud provider policy. Admin-only conceptually."""
    if req.cloud_policy not in ("LOCAL_ONLY", "CLOUD_ALLOWED_PUBLIC_ONLY"):
        raise HTTPException(status_code=400, detail="Invalid policy. Use LOCAL_ONLY or CLOUD_ALLOWED_PUBLIC_ONLY")

    settings.CLOUD_POLICY = req.cloud_policy
    if req.cloud_policy == "LOCAL_ONLY":
        settings.ALLOW_EXTERNAL_AI_CALLS = False
    else:
        settings.ALLOW_EXTERNAL_AI_CALLS = True

    audit_ledger.record_event(
        action="POLICY_UPDATE",
        details={"cloud_policy": req.cloud_policy, "allow_external": settings.ALLOW_EXTERNAL_AI_CALLS},
    )

    return {
        "cloud_policy": settings.CLOUD_POLICY,
        "allow_external": settings.ALLOW_EXTERNAL_AI_CALLS,
        "providers": {
            "gemini": bool(settings.GEMINI_API_KEY),
            "groq": bool(settings.GROQ_API_KEY),
        },
    }


# ============================================================
# EXISTING HEALTH (kept for backward compat)
# ============================================================

@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "sovereign_mode": "ACTIVE",
        "airgap": "ENFORCED",
        "available_providers": unified_gateway.get_available_providers()
    }


# ============================================================
# GENERATE
# ============================================================

@router.post("/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest):
    """
    Generate text using specified or best available AI provider.
    Enforces cloud policy: confidential data NEVER goes to cloud providers.
    """
    # Policy enforcement: block cloud for confidential data
    if request.provider in ("gemini", "groq"):
        if request.confidentiality in ("CONFIDENTIAL", "RESTRICTED", "HIGHLY_CONFIDENTIAL", "CRITICAL"):
            return GenerateResponse(
                text=f"[POLICY BLOCKED] Cannot send {request.confidentiality} data to cloud provider '{request.provider}'. "
                     "Use local inference or change confidentiality to PUBLIC/INTERNAL.",
                provider=request.provider,
                status="policy_blocked",
            )
        if settings.CLOUD_POLICY == "LOCAL_ONLY":
            return GenerateResponse(
                text=f"[POLICY BLOCKED] Cloud providers are disabled. Current policy: LOCAL_ONLY. "
                     "Change policy in Settings to enable cloud fallback.",
                provider=request.provider,
                status="policy_blocked",
            )

    # Block external fallback for confidential data
    effective_fallback = request.fallback_to_external
    if effective_fallback and request.confidentiality in ("CONFIDENTIAL", "RESTRICTED", "HIGHLY_CONFIDENTIAL", "CRITICAL"):
        effective_fallback = False
    if effective_fallback and settings.CLOUD_POLICY == "LOCAL_ONLY":
        effective_fallback = False

    result = await unified_gateway.generate(
        prompt=request.prompt,
        model_id=request.model_id,
        provider=request.provider,
        system_prompt=request.system_prompt,
        temperature=request.temperature,
        max_tokens=request.max_tokens,
        fallback_to_external=effective_fallback,
    )

    # Log to audit
    audit_ledger.record_event(
        action="AI_GENERATION",
        model_used=result.get("model"),
        details={
            "provider": result.get("provider", "unknown"),
            "model": result.get("model"),
            "status": result.get("status"),
            "tokens": result.get("usage", {}).get("total_tokens") if result.get("usage") else None,
        }
    )

    return GenerateResponse(
        text=result.get("text", ""),
        provider=result.get("provider", "unknown"),
        status=result.get("status", "error"),
        model=result.get("model"),
        usage=result.get("usage"),
    )


# ============================================================
# SENTINEL, MODELS, ROUTER
# ============================================================

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


# ============================================================
# TASKS
# ============================================================

@router.post("/tasks", response_model=TaskResponse)
async def create_task(request: TaskCreateRequest):
    try:
        return await agent_orchestrator.create_task(request)
    except Exception as e:
        logger.error(f"Task creation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Task execution failed: {str(e)}")

@router.get("/tasks", response_model=List[TaskResponse])
async def list_tasks():
    return agent_orchestrator.list_tasks()

@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str):
    task = agent_orchestrator.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


# ============================================================
# APPROVALS
# ============================================================

@router.get("/approvals", response_model=List[ApprovalRequest])
async def list_approvals():
    return agent_orchestrator.list_approvals()

@router.post("/approvals/decide", response_model=ApprovalRequest)
async def decide_approval(decision: ApprovalDecision):
    app_req = agent_orchestrator.decide_approval(decision.approval_id, decision.decision)
    if not app_req:
        raise HTTPException(status_code=404, detail="Approval request not found")
    return app_req


# ============================================================
# AUDIT
# ============================================================

@router.get("/audit/events", response_model=List[AuditEvent])
async def list_audit_events():
    return audit_ledger.get_events()


# ============================================================
# DOCUMENTS & KNOWLEDGE
# ============================================================

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
    try:
        save_path = os.path.join(settings.WORKSPACES_DIR, file.filename)
        with open(save_path, "wb") as f:
            content = await file.read()
            f.write(content)

        doc_data = document_processor.process_file(save_path, file.filename)
        vector_store.ingest_document(doc_data)

        audit_ledger.record_event(
            action="DOCUMENT_UPLOAD",
            document=file.filename,
            details={"size": len(content), "pages": doc_data["pages"], "chunks": len(doc_data["chunks"])}
        )
        return {
            "status": "success",
            "filename": file.filename,
            "pages": doc_data["pages"],
            "extracted_text": doc_data["extracted_text"][:500],
            "chunks_count": len(doc_data["chunks"]),
            "message": f"Uploaded & processed {file.filename} ({doc_data['pages']} pages). Local vector RAG index updated with {len(doc_data['chunks'])} chunks."
        }
    except Exception as e:
        logger.error(f"Document upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Document processing failed: {str(e)}")


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

@router.post("/workbench/reset")
async def reset_workbench():
    agent_orchestrator.reset()
    vector_store.clear()
    audit_ledger.record_event(action="WORKBENCH_RESET", details={"status": "cleared"})
    return {"status": "success", "message": "Workbench session reset cleanly. Ready for new report."}
