import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Resolve project root (backend/../)
_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_PROJECT_ROOT = _BACKEND_DIR.parent
_ENV_FILE = _PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    PROJECT_NAME: str = "Sovereign AI Workbench"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Server / LAN binding
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    CORS_ORIGINS: list = [
        "http://10.21.128.122:3000",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://0.0.0.0:3000",
    ]

    # Network / Sovereignty
    ALLOW_EXTERNAL_AI_CALLS: bool = False
    REQUIRE_HITL_APPROVAL_FOR_HIGH_RISK: bool = True
    NETWORK_SENTINEL_INTERVAL_SEC: float = 2.0

    # Cloud provider policy: LOCAL_ONLY | CLOUD_ALLOWED_PUBLIC_ONLY
    CLOUD_POLICY: str = "LOCAL_ONLY"

    # Model Adapters / Ollama (Strictly private local loopback, never exposed to LAN)
    OLLAMA_BASE_URL: str = "http://127.0.0.1:11434"
    VLLM_BASE_URL: str = "http://127.0.0.1:8000/v1"

    # External API Keys (Optional — loaded from .env, NEVER exposed to frontend/logs)
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    OLLAMA_API_KEY: str = ""

    # Model preferences for external APIs
    GEMINI_MODEL: str = "gemini-1.5-pro"
    GROQ_MODEL: str = "qwen/qwen3.8-27b"

    # Database
    DATABASE_URL: str = "sqlite:///./sovereign_workbench.db"

    # Paths
    BASE_DIR: str = str(_BACKEND_DIR)
    WORKSPACES_DIR: str = str(_BACKEND_DIR / "data" / "workspaces")
    BLOBS_DIR: str = str(_BACKEND_DIR / "data" / "blobs")
    VECTOR_DB_DIR: str = str(_BACKEND_DIR / "data" / "indexes")

    class Config:
        case_sensitive = True
        env_file = str(_ENV_FILE)
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()

# Ensure data directories exist
os.makedirs(settings.WORKSPACES_DIR, exist_ok=True)
os.makedirs(settings.BLOBS_DIR, exist_ok=True)
os.makedirs(settings.VECTOR_DB_DIR, exist_ok=True)
