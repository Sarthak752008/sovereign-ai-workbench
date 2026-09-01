import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sovereign AI Workbench"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Server / LAN binding
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: list = [
        "http://10.21.128.122:3000",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # Network / Sovereignty
    ALLOW_EXTERNAL_AI_CALLS: bool = False
    REQUIRE_HITL_APPROVAL_FOR_HIGH_RISK: bool = True
    
    # Model Adapters / Ollama (Strictly private local loopback, never exposed to LAN)
    OLLAMA_BASE_URL: str = "http://127.0.0.1:11434"
    VLLM_BASE_URL: str = "http://127.0.0.1:8000/v1"
    
    # Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    WORKSPACES_DIR: str = os.path.join(BASE_DIR, "data", "workspaces")
    BLOBS_DIR: str = os.path.join(BASE_DIR, "data", "blobs")
    VECTOR_DB_DIR: str = os.path.join(BASE_DIR, "data", "indexes")
    
    class Config:
        case_sensitive = True

settings = Settings()

# Ensure directories exist
os.makedirs(settings.WORKSPACES_DIR, exist_ok=True)
os.makedirs(settings.BLOBS_DIR, exist_ok=True)
os.makedirs(settings.VECTOR_DB_DIR, exist_ok=True)
