from datetime import datetime
from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# --- Enums ---

class ConfidentialityLevel(str, Enum):
    PUBLIC = "PUBLIC"
    INTERNAL = "INTERNAL"
    CONFIDENTIAL = "CONFIDENTIAL"
    RESTRICTED = "RESTRICTED"
    HIGHLY_CONFIDENTIAL = "HIGHLY_CONFIDENTIAL"

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class TaskType(str, Enum):
    SUMMARIZATION = "summarization"
    DOCUMENT_ANALYSIS = "document_analysis"
    VISION_ANALYSIS = "vision_analysis"
    CODING = "coding"
    SPREADSHEET_ANALYSIS = "spreadsheet_analysis"
    REASONING = "reasoning"
    EXTRACTION = "extraction"

class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"
    EXPIRED = "expired"

# --- Models & Registry ---

class ModelCapabilities(BaseModel):
    coding_score: float = 0.0
    reasoning_score: float = 0.0
    vision_score: float = 0.0
    latency_score: float = 0.0
    context_length: int = 4096
    vram_mb: int = 4096

class RegisteredModel(BaseModel):
    model_id: str
    display_name: str
    provider: str  # "ollama" | "vllm" | "local"
    modalities: List[str]  # ["text", "vision", "embed"]
    capabilities: ModelCapabilities
    confidentiality_max: ConfidentialityLevel = ConfidentialityLevel.HIGHLY_CONFIDENTIAL
    enabled: bool = True

# --- Routing ---

class RouteRequest(BaseModel):
    task_prompt: str
    task_type: Optional[TaskType] = None
    confidentiality: ConfidentialityLevel = ConfidentialityLevel.CONFIDENTIAL
    modality: str = "text"
    required_capabilities: List[str] = []
    gpu_vram_free_mb: int = 8192

class RouteDecision(BaseModel):
    selected_model: str
    reason: str
    alternatives: List[str]
    policy_decision: str  # "ALLOW" | "ALLOW_WITH_VERIFICATION" | "REQUIRE_APPROVAL"
    estimated_latency_ms: int
    task_classification: TaskType
    risk_level: RiskLevel

# --- Policy Engine ---

class PolicyEvaluationResult(BaseModel):
    decision: str  # ALLOW, REQUIRE_APPROVAL, DENY
    reason: str
    rule_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# --- Sentinel ---

class SentinelStatus(BaseModel):
    sovereign_mode: str = "ACTIVE"
    network_status: str = "BLOCKED"
    local_inference: str = "ACTIVE"
    external_ai_calls: int = 0
    external_dns_requests: int = 0
    cloud_ai_requests: int = 0
    last_egress_check: datetime = Field(default_factory=datetime.utcnow)
    active_local_models: List[str] = []

# --- Approvals & Audit ---

class ApprovalRequest(BaseModel):
    approval_id: str
    task_id: str
    action_name: str
    risk_level: RiskLevel
    payload: Dict[str, Any]
    status: ApprovalStatus = ApprovalStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ApprovalDecision(BaseModel):
    approval_id: str
    decision: ApprovalStatus  # APPROVED or DENIED
    comment: Optional[str] = None

class AuditEvent(BaseModel):
    event_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    action: str
    actor: str = "system"
    model_used: Optional[str] = None
    tool_used: Optional[str] = None
    document: Optional[str] = None
    hash: str
    prev_hash: str
    details: Dict[str, Any] = {}

# --- Tasks & Agent ---

class TaskCreateRequest(BaseModel):
    title: str
    prompt: str
    confidentiality: ConfidentialityLevel = ConfidentialityLevel.CONFIDENTIAL
    provider: Optional[str] = None
    document_ids: List[str] = []

class TaskResponse(BaseModel):
    task_id: str
    title: str
    status: str
    selected_model: Optional[str] = None
    risk_level: RiskLevel = RiskLevel.LOW
    current_step: str = "initialized"
    plan: List[str] = []
    output: Optional[str] = None
    verification_passed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
