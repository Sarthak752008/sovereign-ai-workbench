from typing import List, Dict, Optional
from app.schemas.workbench import RegisteredModel, ModelCapabilities, ConfidentialityLevel

class ModelRegistry:
    def __init__(self):
        self._models: Dict[str, RegisteredModel] = {}
        self._seed_default_models()

    def _seed_default_models(self):
        default_models = [
            RegisteredModel(
                model_id="qwen2.5-coder:7b",
                display_name="Qwen 2.5 Coder 7B (Local)",
                provider="ollama",
                modalities=["text"],
                capabilities=ModelCapabilities(
                    coding_score=9.2,
                    reasoning_score=8.5,
                    vision_score=0.0,
                    latency_score=9.0,
                    context_length=32768,
                    vram_mb=6144
                ),
                confidentiality_max=ConfidentialityLevel.HIGHLY_CONFIDENTIAL,
                enabled=True
            ),
            RegisteredModel(
                model_id="llama3.1:8b",
                display_name="Llama 3.1 8B Instruct (Local)",
                provider="ollama",
                modalities=["text"],
                capabilities=ModelCapabilities(
                    coding_score=8.0,
                    reasoning_score=8.8,
                    vision_score=0.0,
                    latency_score=8.5,
                    context_length=8192,
                    vram_mb=6144
                ),
                confidentiality_max=ConfidentialityLevel.HIGHLY_CONFIDENTIAL,
                enabled=True
            ),
            RegisteredModel(
                model_id="qwen2-vl:7b",
                display_name="Qwen 2 VL 7B Vision (Local)",
                provider="ollama",
                modalities=["text", "vision"],
                capabilities=ModelCapabilities(
                    coding_score=7.0,
                    reasoning_score=8.2,
                    vision_score=9.5,
                    latency_score=7.5,
                    context_length=16384,
                    vram_mb=8192
                ),
                confidentiality_max=ConfidentialityLevel.HIGHLY_CONFIDENTIAL,
                enabled=True
            ),
            RegisteredModel(
                model_id="deepseek-r1:8b",
                display_name="DeepSeek R1 8B Reasoning (Local)",
                provider="ollama",
                modalities=["text"],
                capabilities=ModelCapabilities(
                    coding_score=8.5,
                    reasoning_score=9.6,
                    vision_score=0.0,
                    latency_score=7.0,
                    context_length=16384,
                    vram_mb=6144
                ),
                confidentiality_max=ConfidentialityLevel.HIGHLY_CONFIDENTIAL,
                enabled=True
            ),
            RegisteredModel(
                model_id="nomic-embed-text",
                display_name="Nomic Embed Text (Local)",
                provider="ollama",
                modalities=["embed"],
                capabilities=ModelCapabilities(
                    coding_score=0.0,
                    reasoning_score=0.0,
                    vision_score=0.0,
                    latency_score=9.8,
                    context_length=8192,
                    vram_mb=2048
                ),
                confidentiality_max=ConfidentialityLevel.HIGHLY_CONFIDENTIAL,
                enabled=True
            )
        ]
        for m in default_models:
            self._models[m.model_id] = m

    def list_models(self) -> List[RegisteredModel]:
        return [m for m in self._models.values() if m.enabled]

    def get_model(self, model_id: str) -> Optional[RegisteredModel]:
        return self._models.get(model_id)

    def register_model(self, model: RegisteredModel) -> RegisteredModel:
        self._models[model.model_id] = model
        return model

model_registry = ModelRegistry()
